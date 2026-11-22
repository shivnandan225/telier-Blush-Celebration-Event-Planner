import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { Cloud, CloudOff, LogIn, LogOut, Plus, CheckCircle2 } from 'lucide-react';
import { BudgetWorkspace } from './components/BudgetWorkspace';
import { CornerAssistant } from './components/CornerAssistant';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PrintCoordinationView } from './components/PrintCoordinationView';
import { PublicRsvpPage } from './components/PublicRsvpPage';
import { RsvpWorkspace } from './components/RsvpWorkspace';
import { ThemesGallery } from './components/ThemesGallery';
import { TopBar, type WorkspaceTab } from './components/TopBar';
import { VenueSetupPreview } from './components/VenueSetupPreview';
import {
  buildRecommendedBudgetBreakdown,
  convertCurrencyAmount,
  createSampleEventData,
  EVENT_TYPE_LABELS,
  generateCostSavingTips,
  getThemeById,
  suggestThemeForBudget,
} from './data/currenciesAndThemes';
import {
  auth,
  createEventWithDetails,
  fetchPublicEvent,
  makeSafeId,
  removeBudgetItem,
  removeRsvp,
  replaceEventBudgetItems,
  signInWithGoogle,
  signOutUser,
  submitPublicGuestRsvp,
  subscribeEventBudgetItems,
  subscribeEventRsvps,
  subscribeOwnerEvents,
  testFirestoreConnection,
  updateEventFields,
  upsertBudgetItem,
  upsertRsvp,
} from './lib/firebase';
import type {
  AssistantResponse,
  BudgetItem,
  CelebrationEvent,
  CurrencyCode,
  EventType,
  GuestRsvp,
  ThemeId,
} from './types/planner';

function PlannerShell() {
  const rsvpParamId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('rsvp')?.trim() || null;
  }, []);

  // Public Guest RSVP View State (when ?rsvp=<eventId> is in URL)
  const [publicEvent, setPublicEvent] = useState<CelebrationEvent | null>(null);
  const [publicLoading, setPublicLoading] = useState<boolean>(Boolean(rsvpParamId));
  const [publicError, setPublicError] = useState<string | null>(null);

  // Organizer Workspace State
  const initialSample = useMemo(() => createSampleEventData(), []);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [cloudEvents, setCloudEvents] = useState<CelebrationEvent[]>([]);
  const [activeEventId, setActiveEventId] = useState<string>(initialSample.event.id);
  const [localEvent, setLocalEvent] = useState<CelebrationEvent>(initialSample.event);
  const [localBudgetItems, setLocalBudgetItems] = useState<BudgetItem[]>(initialSample.budgetItems);
  const [localRsvps, setLocalRsvps] = useState<GuestRsvp[]>(initialSample.rsvps);

  const [cloudBudgetItems, setCloudBudgetItems] = useState<BudgetItem[]>([]);
  const [cloudRsvps, setCloudRsvps] = useState<GuestRsvp[]>([]);

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('budget');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [previewPublicRsvp, setPreviewPublicRsvp] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3500);
  };

  // Startup Firestore connectivity check & public RSVP fetch
  useEffect(() => {
    testFirestoreConnection();

    if (rsvpParamId) {
      if (rsvpParamId === initialSample.event.id) {
        setPublicEvent(initialSample.event);
        setPublicLoading(false);
      } else {
        fetchPublicEvent(rsvpParamId)
          .then((evt) => {
            if (!evt || !evt.isPublicRsvp) {
              setPublicError('This event invitation is closed or could not be found.');
            } else {
              setPublicEvent(evt);
            }
          })
          .catch((err) => {
            setPublicError(err instanceof Error ? err.message : 'Could not load invitation.');
          })
          .finally(() => setPublicLoading(false));
      }
    }
  }, [rsvpParamId, initialSample.event]);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Subscribe to cloud events when authenticated
  useEffect(() => {
    if (!authReady || !user || rsvpParamId) {
      setCloudEvents([]);
      return;
    }

    const unsub = subscribeOwnerEvents(
      user.uid,
      (events) => {
        setSyncError(null);
        if (events.length === 0) {
          // Seed the user's first cloud event from the workspace sample cleanly
          const newEventId = makeSafeId('evt');
          const seedEvent: CelebrationEvent = {
            ...localEvent,
            id: newEventId,
            ownerId: user.uid,
            hostName: user.displayName || localEvent.hostName,
          };
          const seedItems = localBudgetItems.map((item, idx) => ({
            ...item,
            id: makeSafeId(`bi${idx}`),
            eventId: newEventId,
            ownerId: user.uid,
          }));
          const seedRsvps = localRsvps.map((r, idx) => ({
            ...r,
            id: makeSafeId(`rsvp${idx}`),
            eventId: newEventId,
            ownerId: user.uid,
          }));
          createEventWithDetails(seedEvent, seedItems, seedRsvps).catch((err) => {
            setSyncError(err instanceof Error ? err.message : 'Unable to initialize cloud event.');
          });
        } else {
          setCloudEvents(events);
          setActiveEventId((prev) =>
            events.some((e) => e.id === prev) ? prev : events[0].id
          );
        }
      },
      (err) => {
        setSyncError(err.message);
      }
    );

    return () => unsub();
  }, [authReady, user, rsvpParamId]);

  const isCloudMode = Boolean(user && cloudEvents.length > 0);
  const activeEvent = useMemo(() => {
    if (isCloudMode) {
      return cloudEvents.find((e) => e.id === activeEventId) || cloudEvents[0];
    }
    return localEvent;
  }, [isCloudMode, cloudEvents, activeEventId, localEvent]);

  // Subscribe to active event's budgetItems & rsvps in cloud mode
  useEffect(() => {
    if (!isCloudMode || !user || !activeEvent?.id || rsvpParamId) {
      setCloudBudgetItems([]);
      setCloudRsvps([]);
      return;
    }

    const unsubItems = subscribeEventBudgetItems(
      activeEvent.id,
      user.uid,
      (items) => setCloudBudgetItems(items),
      (err) => setSyncError(err.message)
    );

    const unsubRsvps = subscribeEventRsvps(
      activeEvent.id,
      user.uid,
      (rsvps) => setCloudRsvps(rsvps),
      (err) => setSyncError(err.message)
    );

    return () => {
      unsubItems();
      unsubRsvps();
    };
  }, [isCloudMode, user, activeEvent?.id, rsvpParamId]);

  const activeBudgetItems = isCloudMode ? cloudBudgetItems : localBudgetItems;
  const activeRsvps = isCloudMode ? cloudRsvps : localRsvps;

  const confirmedGuests = useMemo(() => {
    return activeRsvps
      .filter((r) => r.status === 'attending')
      .reduce((sum, r) => sum + (r.partySize || 1), 0);
  }, [activeRsvps]);

  // Handle Public Guest RSVP Link Route
  if (rsvpParamId) {
    return (
      <PublicRsvpPage
        event={publicEvent}
        loading={publicLoading}
        errorMessage={publicError}
        isPreviewMode={false}
        onSubmitRsvp={async (rsvp) => {
          if (rsvpParamId === initialSample.event.id) {
            setLocalRsvps((prev) => [rsvp, ...prev]);
          } else {
            await submitPublicGuestRsvp(rsvp);
          }
        }}
      />
    );
  }

  // Handle Organizer Previewing Guest RSVP Form
  if (previewPublicRsvp) {
    return (
      <PublicRsvpPage
        event={activeEvent}
        loading={false}
        errorMessage={null}
        isPreviewMode={true}
        onExitPreview={() => setPreviewPublicRsvp(false)}
        onSubmitRsvp={async (rsvp) => {
          if (isCloudMode) {
            await submitPublicGuestRsvp(rsvp);
          } else {
            setLocalRsvps((prev) => [rsvp, ...prev]);
          }
        }}
      />
    );
  }

  // Handlers
  const handleUpdateEvent = async (patch: Partial<CelebrationEvent>) => {
    const updated: CelebrationEvent = { ...activeEvent, ...patch };
    if (isCloudMode) {
      setCloudEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      try {
        await updateEventFields(updated);
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : 'Failed to save event changes.');
      }
    } else {
      setLocalEvent(updated);
    }
  };

  const handleChangeCurrency = async (newCurrency: CurrencyCode, convertValues: boolean) => {
    const oldCurrency = activeEvent.currencyCode;
    if (oldCurrency === newCurrency) return;

    const newTotalBudget = convertValues
      ? convertCurrencyAmount(activeEvent.totalBudget, oldCurrency, newCurrency)
      : activeEvent.totalBudget;

    const newTips = generateCostSavingTips(
      activeEvent.eventType,
      newTotalBudget,
      newCurrency,
      activeEvent.estimatedGuests
    );

    const updatedEvent: CelebrationEvent = {
      ...activeEvent,
      currencyCode: newCurrency,
      totalBudget: newTotalBudget,
      costSavingTips: newTips,
    };

    const updatedItems = activeBudgetItems.map((item) => {
      if (!convertValues) return item;
      const convertedUnit = convertCurrencyAmount(item.unitCost, oldCurrency, newCurrency);
      const convertedAllocated = convertCurrencyAmount(item.allocatedAmount, oldCurrency, newCurrency);
      const convertedActual = convertCurrencyAmount(item.actualSpent, oldCurrency, newCurrency);
      return {
        ...item,
        unitCost: convertedUnit,
        allocatedAmount: convertedAllocated,
        actualSpent: convertedActual,
      };
    });

    if (isCloudMode) {
      try {
        await updateEventFields(updatedEvent);
        await replaceEventBudgetItems(
          activeEvent.id,
          activeBudgetItems.map((i) => i.id),
          updatedItems
        );
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : 'Currency conversion sync failed.');
      }
    } else {
      setLocalEvent(updatedEvent);
      setLocalBudgetItems(updatedItems);
    }
    showToast(`Switched currency to ${newCurrency}`);
  };

  const handleAutoFillRecommended = async (
    eventType: EventType,
    totalBudget: number,
    guestCount: number
  ) => {
    const suggestedTheme = suggestThemeForBudget(totalBudget, activeEvent.currencyCode, eventType);
    const tips = generateCostSavingTips(
      eventType,
      totalBudget,
      activeEvent.currencyCode,
      guestCount
    );
    const breakdown = buildRecommendedBudgetBreakdown(eventType, totalBudget, guestCount);

    const newItems: BudgetItem[] = breakdown.map((row, idx) => ({
      id: makeSafeId(`bi${idx}`),
      eventId: activeEvent.id,
      ownerId: activeEvent.ownerId,
      category: row.category,
      title: row.title,
      pricingMode: row.pricingMode,
      unitCost: row.unitCost,
      allocatedAmount: row.allocatedAmount,
      actualSpent: 0,
      notes: row.notes,
    }));

    const updatedEvent: CelebrationEvent = {
      ...activeEvent,
      eventType,
      totalBudget,
      estimatedGuests: guestCount,
      selectedThemeId: suggestedTheme.id,
      venueTableStyle: suggestedTheme.recommendedTableStyle,
      floralDensity: suggestedTheme.recommendedFloralDensity,
      costSavingTips: tips,
    };

    if (isCloudMode) {
      try {
        await updateEventFields(updatedEvent);
        await replaceEventBudgetItems(
          activeEvent.id,
          activeBudgetItems.map((i) => i.id),
          newItems
        );
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : 'Failed to apply recommended budget.');
      }
    } else {
      setLocalEvent(updatedEvent);
      setLocalBudgetItems(newItems);
    }
    showToast(`Populated recommended ${EVENT_TYPE_LABELS[eventType]} budget & cost-saving tips`);
  };

  const handleSaveBudgetItem = async (item: BudgetItem, isNew: boolean) => {
    if (isCloudMode) {
      try {
        await upsertBudgetItem(item, isNew);
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : 'Failed to update budget item.');
      }
    } else {
      setLocalBudgetItems((prev) =>
        isNew ? [...prev, item] : prev.map((existing) => (existing.id === item.id ? item : existing))
      );
    }
  };

  const handleDeleteBudgetItem = async (itemId: string) => {
    if (isCloudMode) {
      try {
        await removeBudgetItem(activeEvent.id, itemId);
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : 'Failed to delete budget item.');
      }
    } else {
      setLocalBudgetItems((prev) => prev.filter((i) => i.id !== itemId));
    }
  };

  const handleSaveRsvp = async (rsvp: GuestRsvp, isNew: boolean) => {
    if (isCloudMode) {
      try {
        await upsertRsvp(rsvp, isNew);
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : 'Failed to update RSVP.');
      }
    } else {
      setLocalRsvps((prev) =>
        isNew ? [rsvp, ...prev] : prev.map((existing) => (existing.id === rsvp.id ? rsvp : existing))
      );
    }
  };

  const handleDeleteRsvp = async (rsvpId: string) => {
    if (isCloudMode) {
      try {
        await removeRsvp(activeEvent.id, rsvpId);
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : 'Failed to delete RSVP.');
      }
    } else {
      setLocalRsvps((prev) => prev.filter((r) => r.id !== rsvpId));
    }
  };

  const handleSelectTheme = async (themeId: ThemeId) => {
    const theme = getThemeById(themeId);
    await handleUpdateEvent({
      selectedThemeId: themeId,
      venueTableStyle: theme.recommendedTableStyle,
      floralDensity: theme.recommendedFloralDensity,
    });
    showToast(`Applied ${theme.name} theme & venue layout`);
  };

  const handleQuickOpenFromAssistant = (
    eventType: EventType,
    totalBudget: number,
    currencyCode: CurrencyCode,
    guests: number
  ) => {
    setActiveTab('budget');
    const suggestedTheme = suggestThemeForBudget(totalBudget, currencyCode, eventType);
    const tips = generateCostSavingTips(eventType, totalBudget, currencyCode, guests);
    const breakdown = buildRecommendedBudgetBreakdown(eventType, totalBudget, guests);

    const newItems: BudgetItem[] = breakdown.map((row, idx) => ({
      id: makeSafeId(`bi${idx}`),
      eventId: activeEvent.id,
      ownerId: activeEvent.ownerId,
      category: row.category,
      title: row.title,
      pricingMode: row.pricingMode,
      unitCost: row.unitCost,
      allocatedAmount: row.allocatedAmount,
      actualSpent: 0,
      notes: row.notes,
    }));

    const updatedEvent: CelebrationEvent = {
      ...activeEvent,
      title:
        eventType === 'wedding'
          ? 'Our Wedding Celebration'
          : `${EVENT_TYPE_LABELS[eventType]} Celebration`,
      eventType,
      currencyCode,
      totalBudget,
      estimatedGuests: guests,
      selectedThemeId: suggestedTheme.id,
      venueTableStyle: suggestedTheme.recommendedTableStyle,
      floralDensity: suggestedTheme.recommendedFloralDensity,
      costSavingTips: tips,
    };

    if (isCloudMode) {
      updateEventFields(updatedEvent).catch((e) => setSyncError(String(e)));
      replaceEventBudgetItems(
        activeEvent.id,
        activeBudgetItems.map((i) => i.id),
        newItems
      ).catch((e) => setSyncError(String(e)));
    } else {
      setLocalEvent(updatedEvent);
      setLocalBudgetItems(newItems);
    }
    showToast(`Opened ${EVENT_TYPE_LABELS[eventType]} budget workspace`);
  };

  const handleApplyAssistantPlan = async (plan: {
    eventType: EventType;
    totalBudget: number;
    currencyCode: CurrencyCode;
    guests: number;
    themeId: AssistantResponse['recommendedThemeId'];
    breakdown: AssistantResponse['budgetBreakdown'];
    costSavingTips: string[];
  }) => {
    const theme = getThemeById(plan.themeId);
    const newItems: BudgetItem[] = plan.breakdown.map((row, idx) => ({
      id: makeSafeId(`ai${idx}`),
      eventId: activeEvent.id,
      ownerId: activeEvent.ownerId,
      category: row.category,
      title: row.title,
      pricingMode: row.pricingMode,
      unitCost: Math.max(0, Math.round(row.unitCost)),
      allocatedAmount: Math.max(0, Math.round(row.allocatedAmount)),
      actualSpent: 0,
      notes: row.notes || '',
    }));

    const updatedEvent: CelebrationEvent = {
      ...activeEvent,
      eventType: plan.eventType,
      currencyCode: plan.currencyCode,
      totalBudget: Math.max(0, Math.round(plan.totalBudget)),
      estimatedGuests: Math.max(1, Math.round(plan.guests)),
      selectedThemeId: theme.id,
      venueTableStyle: theme.recommendedTableStyle,
      floralDensity: theme.recommendedFloralDensity,
      costSavingTips:
        plan.costSavingTips.length > 0
          ? plan.costSavingTips
          : generateCostSavingTips(plan.eventType, plan.totalBudget, plan.currencyCode, plan.guests),
    };

    if (isCloudMode) {
      try {
        await updateEventFields(updatedEvent);
        await replaceEventBudgetItems(
          activeEvent.id,
          activeBudgetItems.map((i) => i.id),
          newItems
        );
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : 'Failed to save AI budget plan.');
      }
    } else {
      setLocalEvent(updatedEvent);
      setLocalBudgetItems(newItems);
    }
    setActiveTab('budget');
    showToast('AI-tailored budget, tips & theme applied');
  };

  const handleCreateNewCloudEvent = async () => {
    const sample = createSampleEventData();
    const newId = makeSafeId('evt');
    const newEvent: CelebrationEvent = {
      ...sample.event,
      id: newId,
      ownerId: user?.uid || 'demo_organizer',
      title: 'New Celebration Event',
      hostName: user?.displayName || 'Celebration Host',
    };
    const items = sample.budgetItems.map((item, idx) => ({
      ...item,
      id: makeSafeId(`bi${idx}`),
      eventId: newId,
      ownerId: newEvent.ownerId,
    }));

    if (user) {
      try {
        await createEventWithDetails(newEvent, items, []);
        setActiveEventId(newId);
        showToast('Created new cloud celebration workspace');
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : 'Unable to create event.');
      }
    } else {
      setLocalEvent(newEvent);
      setLocalBudgetItems(items);
      setLocalRsvps([]);
      showToast('Started fresh local event workspace');
    }
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      showToast('Signed in with Google — Cloud RSVP sync active');
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Google Sign-In failed.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FCF8F5] text-[#231D1A] flex flex-col">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenPrintModal={() => setShowPrintModal(true)}
      />

      {/* Workspace Context Strip (Event Switcher & Cloud Sync Status) */}
      <div className="no-print bg-[#FFF8F5] border-b border-[#EADCD6]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {isCloudMode && cloudEvents.length > 1 ? (
              <select
                aria-label="Select celebration event"
                value={activeEvent.id}
                onChange={(e) => setActiveEventId(e.target.value)}
                className="h-9 px-3 bg-white border border-[#EADCD6] rounded-lg text-xs font-medium text-[#231D1A]"
              >
                {cloudEvents.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>
            ) : (
              <input
                aria-label="Event title"
                type="text"
                value={activeEvent.title}
                onChange={(e) => handleUpdateEvent({ title: e.target.value })}
                className="h-9 px-3 bg-white border border-[#EADCD6] rounded-lg text-xs font-medium text-[#231D1A] w-56 sm:w-64 focus:outline-none focus:border-[#E25845]"
              />
            )}

            <input
              aria-label="Event date"
              type="date"
              value={activeEvent.eventDate}
              onChange={(e) => handleUpdateEvent({ eventDate: e.target.value })}
              className="h-9 px-2.5 bg-white border border-[#EADCD6] rounded-lg text-xs font-mono-num text-[#6E605A]"
            />

            <button
              type="button"
              onClick={handleCreateNewCloudEvent}
              className="inline-flex items-center gap-1 h-9 px-3 text-xs font-medium text-[#231D1A] bg-white hover:bg-[#FFF3EE] border border-[#EADCD6] rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 text-[#E25845]" aria-hidden="true" />
              <span>New Event</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {user ? (
              <>
                <span className="inline-flex items-center gap-1.5 text-[#15803D] font-medium">
                  <Cloud className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Cloud Synced ({user.displayName || user.email})</span>
                </span>
                <button
                  type="button"
                  onClick={() => signOutUser()}
                  className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs text-[#6E605A] hover:text-[#231D1A] border border-[#EADCD6] bg-white rounded-md"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5 text-[#6E605A]">
                  <CloudOff className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Preview Mode</span>
                </span>
                <button
                  type="button"
                  onClick={handleSignIn}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-medium text-white bg-[#231D1A] hover:bg-[#3A302B] rounded-lg transition-colors whitespace-nowrap"
                >
                  <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Sign in with Google for Live Sync</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="no-print flex-1 max-w-[1320px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {syncError && (
          <div className="mb-6 p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-[#B91C1C] flex items-center justify-between gap-3">
            <span>{syncError}</span>
            <button
              type="button"
              onClick={() => setSyncError(null)}
              className="underline font-medium shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {activeTab === 'budget' && (
          <BudgetWorkspace
            event={activeEvent}
            budgetItems={activeBudgetItems}
            confirmedGuests={confirmedGuests}
            onUpdateEvent={handleUpdateEvent}
            onChangeCurrency={handleChangeCurrency}
            onAutoFillRecommended={handleAutoFillRecommended}
            onSaveBudgetItem={handleSaveBudgetItem}
            onDeleteBudgetItem={handleDeleteBudgetItem}
            onOpenThemeGallery={() => setActiveTab('themes')}
            onSelectTheme={handleSelectTheme}
          />
        )}

        {activeTab === 'rsvps' && (
          <RsvpWorkspace
            event={activeEvent}
            rsvps={activeRsvps}
            isCloudSynced={isCloudMode}
            onUpdateEvent={handleUpdateEvent}
            onSaveRsvp={handleSaveRsvp}
            onDeleteRsvp={handleDeleteRsvp}
            onPreviewPublicRsvp={() => setPreviewPublicRsvp(true)}
            onSignInRequest={handleSignIn}
          />
        )}

        {activeTab === 'themes' && (
          <ThemesGallery
            event={activeEvent}
            confirmedGuests={confirmedGuests}
            onSelectTheme={handleSelectTheme}
            onGoToVenuePreview={() => setActiveTab('venue')}
          />
        )}

        {activeTab === 'venue' && (
          <VenueSetupPreview
            event={activeEvent}
            confirmedGuests={confirmedGuests}
            onUpdateEvent={handleUpdateEvent}
          />
        )}
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="no-print border-t border-[#EADCD6] bg-[#FFF8F5] py-5 px-4 sm:px-6 lg:px-8 text-xs text-[#6E605A]">
        <div className="max-w-[1320px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Atelier Blush — Celebration Event Planner</span>
          <span>Multi-Currency Budgeting · Live Guest RSVPs · Venue Setup Studio</span>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="no-print fixed bottom-20 left-4 sm:bottom-6 sm:left-6 z-40 bg-[#231D1A] text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg inline-flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-[#F48777] shrink-0" aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Right-Corner Smart AI Assistant */}
      <CornerAssistant
        event={activeEvent}
        onQuickOpenBudget={handleQuickOpenFromAssistant}
        onApplyAssistantPlan={handleApplyAssistantPlan}
      />

      {/* Print / PDF Final Coordination Modal */}
      {showPrintModal && (
        <PrintCoordinationView
          event={activeEvent}
          budgetItems={activeBudgetItems}
          rsvps={activeRsvps}
          confirmedGuests={confirmedGuests}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <PlannerShell />
    </ErrorBoundary>
  );
}
