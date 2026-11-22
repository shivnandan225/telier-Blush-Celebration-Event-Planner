import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from 'lucide-react';
import {
  CURRENCY_LIST,
  EVENT_TYPE_LABELS,
  formatMoney,
  getThemeById,
} from '../data/currenciesAndThemes';
import type {
  BudgetItem,
  CelebrationEvent,
  CurrencyCode,
  EventType,
  PricingMode,
  ThemeId,
} from '../types/planner';

interface BudgetWorkspaceProps {
  event: CelebrationEvent;
  budgetItems: BudgetItem[];
  confirmedGuests: number;
  onUpdateEvent: (patch: Partial<CelebrationEvent>) => void;
  onChangeCurrency: (newCurrency: CurrencyCode, convertValues: boolean) => void;
  onAutoFillRecommended: (eventType: EventType, totalBudget: number, guestCount: number) => void;
  onSaveBudgetItem: (item: BudgetItem, isNew: boolean) => void;
  onDeleteBudgetItem: (itemId: string) => void;
  onOpenThemeGallery: () => void;
  onSelectTheme: (themeId: ThemeId) => void;
}

export function BudgetWorkspace({
  event,
  budgetItems,
  confirmedGuests,
  onUpdateEvent,
  onChangeCurrency,
  onAutoFillRecommended,
  onSaveBudgetItem,
  onDeleteBudgetItem,
  onOpenThemeGallery,
  onSelectTheme,
}: BudgetWorkspaceProps) {
  const [convertOnCurrencySwitch, setConvertOnCurrencySwitch] = useState(true);
  const [newCategory, setNewCategory] = useState('Decor & Florals');
  const [newTitle, setNewTitle] = useState('');
  const [newMode, setNewMode] = useState<PricingMode>('fixed');
  const [newAmount, setNewAmount] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const activeHeadcount = Math.max(1, confirmedGuests > 0 ? confirmedGuests : event.estimatedGuests);

  const computedItems = budgetItems.map((item) => {
    const effectiveAllocated =
      item.pricingMode === 'per_guest'
        ? Math.round(item.unitCost * activeHeadcount)
        : Math.round(item.allocatedAmount);
    return {
      ...item,
      effectiveAllocated,
    };
  });

  const totalAllocated = computedItems.reduce((sum, item) => sum + item.effectiveAllocated, 0);
  const totalActualSpent = computedItems.reduce((sum, item) => sum + Math.round(item.actualSpent), 0);
  const remainingTarget = event.totalBudget - totalAllocated;
  const isOverTarget = remainingTarget < 0;
  const utilizationPercent =
    event.totalBudget > 0 ? Math.round((totalAllocated / event.totalBudget) * 100) : 0;

  const suggestedTheme = getThemeById(event.selectedThemeId);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Number(newAmount);
    if (!newTitle.trim() || !Number.isFinite(numeric) || numeric < 0) return;

    const unitCost = Math.round(numeric);
    const allocatedAmount =
      newMode === 'per_guest' ? unitCost * activeHeadcount : unitCost;

    const item: BudgetItem = {
      id: `item_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      eventId: event.id,
      ownerId: event.ownerId,
      category: newCategory.trim() || 'General',
      title: newTitle.trim(),
      pricingMode: newMode,
      unitCost,
      allocatedAmount,
      actualSpent: 0,
      notes: newMode === 'per_guest' ? `Auto-scales with ${activeHeadcount} guests` : '',
    };

    onSaveBudgetItem(item, true);
    setNewTitle('');
    setNewAmount('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-8">
      {/* Top Planner Inputs & Multi-Currency Strip */}
      <section className="bg-white border border-[#EADCD6] rounded-xl p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-[#6E605A]">
              Automated Budget Engine · Live RSVP Sync
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#231D1A]">
              {event.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-[#6E605A]">
              <input
                type="checkbox"
                checked={convertOnCurrencySwitch}
                onChange={(e) => setConvertOnCurrencySwitch(e.target.checked)}
                className="accent-[#E25845] w-4 h-4 rounded"
              />
              <span>Auto-convert amounts</span>
            </label>
            <button
              type="button"
              onClick={() =>
                onAutoFillRecommended(event.eventType, event.totalBudget, event.estimatedGuests)
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-white bg-[#E25845] hover:bg-[#C84432] rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[42px]"
            >
              <RefreshCw className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Auto-Fill Recommended Budget</span>
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Event Type */}
          <div>
            <label htmlFor="budget-event-type" className="block text-xs font-medium text-[#6E605A] mb-1.5">
              Celebration Type
            </label>
            <select
              id="budget-event-type"
              value={event.eventType}
              onChange={(e) => {
                const nextType = e.target.value as EventType;
                onUpdateEvent({ eventType: nextType });
              }}
              className="w-full h-11 px-3 text-sm bg-[#FCF8F5] border border-[#EADCD6] rounded-lg text-[#231D1A] focus:outline-none focus:border-[#E25845]"
            >
              {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((type) => (
                <option key={type} value={type}>
                  {EVENT_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

          {/* Multi-Country Currency */}
          <div>
            <label htmlFor="budget-currency" className="block text-xs font-medium text-[#6E605A] mb-1.5">
              Country &amp; Currency
            </label>
            <select
              id="budget-currency"
              value={event.currencyCode}
              onChange={(e) =>
                onChangeCurrency(e.target.value as CurrencyCode, convertOnCurrencySwitch)
              }
              className="w-full h-11 px-3 text-sm bg-[#FCF8F5] border border-[#EADCD6] rounded-lg text-[#231D1A] focus:outline-none focus:border-[#E25845]"
            >
              {CURRENCY_LIST.map((cur) => (
                <option key={cur.code} value={cur.code}>
                  {cur.code} ({cur.symbol.trim()}) — {cur.countryLabel}
                </option>
              ))}
            </select>
          </div>

          {/* Target Budget Input */}
          <div>
            <label htmlFor="budget-target-input" className="block text-xs font-medium text-[#6E605A] mb-1.5">
              Target Total Budget ({event.currencyCode})
            </label>
            <input
              id="budget-target-input"
              type="number"
              min={0}
              step={100}
              value={event.totalBudget}
              onChange={(e) => {
                const next = Math.max(0, Number(e.target.value) || 0);
                onUpdateEvent({ totalBudget: next });
              }}
              className="w-full h-11 px-3 text-sm font-mono-num bg-[#FCF8F5] border border-[#EADCD6] rounded-lg text-[#231D1A] focus:outline-none focus:border-[#E25845]"
            />
          </div>

          {/* Planned Guests */}
          <div>
            <label htmlFor="budget-guests-input" className="block text-xs font-medium text-[#6E605A] mb-1.5">
              Estimated Guests (Live RSVPs: {confirmedGuests})
            </label>
            <input
              id="budget-guests-input"
              type="number"
              min={1}
              max={10000}
              value={event.estimatedGuests}
              onChange={(e) => {
                const next = Math.max(1, Math.min(10000, Math.round(Number(e.target.value) || 1)));
                onUpdateEvent({ estimatedGuests: next });
              }}
              className="w-full h-11 px-3 text-sm font-mono-num bg-[#FCF8F5] border border-[#EADCD6] rounded-lg text-[#231D1A] focus:outline-none focus:border-[#E25845]"
            />
          </div>
        </div>
      </section>

      {/* Financial KPI Summary Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#EADCD6] rounded-xl p-5">
          <p className="text-xs text-[#6E605A]">Target Budget</p>
          <p className="mt-1.5 text-2xl font-semibold font-mono-num text-[#231D1A]">
            {formatMoney(event.totalBudget, event.currencyCode)}
          </p>
          <p className="mt-1 text-xs text-[#6E605A] tabular-nums">
            {formatMoney(Math.round(event.totalBudget / activeHeadcount), event.currencyCode)} per active guest
          </p>
        </div>

        <div className="bg-white border border-[#EADCD6] rounded-xl p-5">
          <p className="text-xs text-[#6E605A]">Allocated Across Categories</p>
          <p className="mt-1.5 text-2xl font-semibold font-mono-num text-[#231D1A]">
            {formatMoney(totalAllocated, event.currencyCode)}
          </p>
          <p className="mt-1 text-xs text-[#6E605A] tabular-nums">
            {utilizationPercent}% of target planned
          </p>
        </div>

        <div className="bg-white border border-[#EADCD6] rounded-xl p-5">
          <p className="text-xs text-[#6E605A]">Actual Paid / Deposits</p>
          <p className="mt-1.5 text-2xl font-semibold font-mono-num text-[#231D1A]">
            {formatMoney(totalActualSpent, event.currencyCode)}
          </p>
          <p className="mt-1 text-xs text-[#6E605A] tabular-nums">
            {totalAllocated > 0 ? Math.round((totalActualSpent / totalAllocated) * 100) : 0}% of allocated paid
          </p>
        </div>

        <div className="bg-white border border-[#EADCD6] rounded-xl p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-[#6E605A]">
              {isOverTarget ? 'Over Target Variance' : 'Unallocated Buffer'}
            </p>
            {isOverTarget ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#B91C1C]">
                <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                Over limit
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#15803D]">
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                On track
              </span>
            )}
          </div>
          <p
            className={`mt-1.5 text-2xl font-semibold font-mono-num ${
              isOverTarget ? 'text-[#B91C1C]' : 'text-[#231D1A]'
            }`}
          >
            {formatMoney(Math.abs(remainingTarget), event.currencyCode)}
          </p>
          <p className="mt-1 text-xs text-[#6E605A]">
            {confirmedGuests > 0
              ? `Scaled to ${confirmedGuests} confirmed RSVPs`
              : `Using ${event.estimatedGuests} estimated guests`}
          </p>
        </div>
      </section>

      {/* Main Ledger + Cost Saving Tips & Theme Preview Split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Automated Category Ledger */}
        <section className="xl:col-span-2 bg-white border border-[#EADCD6] rounded-xl overflow-hidden">
          <div className="p-5 sm:px-6 border-b border-[#EADCD6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-[#231D1A]">
                Automated Category Breakdown
              </h2>
              <p className="text-xs text-[#6E605A] mt-0.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#E25845]" aria-hidden="true" />
                <span>
                  Per-guest rows automatically multiply by {activeHeadcount}{' '}
                  {confirmedGuests > 0 ? 'confirmed RSVP guests' : 'estimated guests'}.
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#231D1A] bg-[#FFF3EE] hover:bg-[#FBE4DC] border border-[#EADCD6] rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
            >
              <Plus className="w-4 h-4 text-[#E25845]" aria-hidden="true" />
              <span>Add Line Item</span>
            </button>
          </div>

          {showAddForm && (
            <form
              onSubmit={handleAddItem}
              className="p-5 bg-[#FFF8F5] border-b border-[#EADCD6] grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
            >
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-[#6E605A] mb-1">Category</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-white border border-[#EADCD6] rounded-lg"
                  placeholder="e.g. Florals"
                  required
                />
              </div>
              <div className="sm:col-span-4">
                <label className="block text-xs font-medium text-[#6E605A] mb-1">Item Name</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-white border border-[#EADCD6] rounded-lg"
                  placeholder="e.g. Welcome Dessert Table"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#6E605A] mb-1">Pricing</label>
                <select
                  value={newMode}
                  onChange={(e) => setNewMode(e.target.value as PricingMode)}
                  className="w-full h-10 px-2.5 text-sm bg-white border border-[#EADCD6] rounded-lg"
                >
                  <option value="fixed">Fixed</option>
                  <option value="per_guest">Per Guest</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#6E605A] mb-1">
                  {newMode === 'per_guest' ? 'Per Guest' : 'Total'}
                </label>
                <input
                  type="number"
                  min={0}
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full h-10 px-3 text-sm font-mono-num bg-white border border-[#EADCD6] rounded-lg"
                  placeholder="0"
                  required
                />
              </div>
              <div className="sm:col-span-1">
                <button
                  type="submit"
                  className="w-full h-10 px-3 text-xs font-medium text-white bg-[#E25845] hover:bg-[#C84432] rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
            </form>
          )}

          {computedItems.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-sm text-[#6E605A]">
                No budget line items yet. Auto-fill a recommended split or add your first item.
              </p>
              <button
                type="button"
                onClick={() =>
                  onAutoFillRecommended(event.eventType, event.totalBudget, event.estimatedGuests)
                }
                className="px-4 py-2 text-xs font-medium text-white bg-[#E25845] hover:bg-[#C84432] rounded-lg"
              >
                Auto-Fill Budget Breakdown
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#EADCD6]">
              {computedItems.map((item) => {
                const isOverLine = item.actualSpent > item.effectiveAllocated && item.effectiveAllocated > 0;
                return (
                  <div
                    key={item.id}
                    className="p-4 sm:px-6 hover:bg-[#FFFBF9] transition-colors grid grid-cols-1 lg:grid-cols-12 gap-4 items-center"
                  >
                    <div className="lg:col-span-5 space-y-0.5">
                      <div className="flex items-center gap-2 text-xs text-[#6E605A]">
                        <span>{item.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {item.pricingMode === 'per_guest'
                            ? `Per guest (${formatMoney(item.unitCost, event.currencyCode)} × ${activeHeadcount})`
                            : 'Fixed package'}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-[#231D1A]">{item.title}</p>
                      {item.notes && (
                        <p className="text-xs text-[#6E605A] line-clamp-1">{item.notes}</p>
                      )}
                    </div>

                    <div className="lg:col-span-3">
                      <label className="block text-[11px] text-[#6E605A] mb-1">
                        {item.pricingMode === 'per_guest' ? 'Unit Cost / Guest' : 'Allocated Budget'}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          value={item.pricingMode === 'per_guest' ? item.unitCost : item.allocatedAmount}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value) || 0);
                            if (item.pricingMode === 'per_guest') {
                              onSaveBudgetItem(
                                {
                                  ...item,
                                  unitCost: val,
                                  allocatedAmount: val * activeHeadcount,
                                },
                                false
                              );
                            } else {
                              onSaveBudgetItem(
                                {
                                  ...item,
                                  unitCost: val,
                                  allocatedAmount: val,
                                },
                                false
                              );
                            }
                          }}
                          className="w-full h-9 px-2.5 text-sm font-mono-num bg-[#FCF8F5] border border-[#EADCD6] rounded-md text-[#231D1A]"
                        />
                        {item.pricingMode === 'per_guest' && (
                          <span className="text-xs font-mono-num text-[#6E605A] whitespace-nowrap">
                            = {formatMoney(item.effectiveAllocated, event.currencyCode)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="lg:col-span-3">
                      <label className="block text-[11px] text-[#6E605A] mb-1">
                        Actual Paid {isOverLine && '(Over line limit)'}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={item.actualSpent}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          onSaveBudgetItem({ ...item, actualSpent: val }, false);
                        }}
                        className={`w-full h-9 px-2.5 text-sm font-mono-num bg-[#FCF8F5] border rounded-md ${
                          isOverLine
                            ? 'border-[#B91C1C] text-[#B91C1C]'
                            : 'border-[#EADCD6] text-[#231D1A]'
                        }`}
                      />
                    </div>

                    <div className="lg:col-span-1 flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          onSaveBudgetItem(
                            {
                              ...item,
                              pricingMode: item.pricingMode === 'fixed' ? 'per_guest' : 'fixed',
                              unitCost:
                                item.pricingMode === 'fixed'
                                  ? Math.max(1, Math.round(item.allocatedAmount / activeHeadcount))
                                  : item.effectiveAllocated,
                              allocatedAmount: item.effectiveAllocated,
                            },
                            false
                          )
                        }
                        title="Switch Fixed vs Per-Guest"
                        className="px-2 py-1.5 text-[11px] font-medium text-[#6E605A] hover:text-[#231D1A] border border-[#EADCD6] rounded-md whitespace-nowrap"
                      >
                        {item.pricingMode === 'fixed' ? 'Fix' : '/Gst'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteBudgetItem(item.id)}
                        aria-label={`Remove ${item.title}`}
                        className="p-2 text-[#6E605A] hover:text-[#B91C1C] rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Column: Cost-Saving Tips & Budget-Matched Theme Spotlight */}
        <aside className="space-y-6">
          {/* Smart Cost-Saving Tips */}
          <div className="bg-[#FFF3EE] border border-[#EADCD6] rounded-xl p-5 sm:p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-[#E25845] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h2 className="font-display text-lg font-semibold text-[#231D1A]">
                  Cost-Saving Tips for This Budget
                </h2>
                <p className="text-xs text-[#6E605A] mt-0.5">
                  Tailored to {formatMoney(event.totalBudget, event.currencyCode)} · {activeHeadcount} guests
                </p>
              </div>
            </div>

            <ul className="space-y-3 text-sm text-[#231D1A] leading-relaxed">
              {(event.costSavingTips || []).map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="font-mono-num text-xs font-semibold text-[#E25845] mt-0.5">
                    0{idx + 1}.
                  </span>
                  <span className="text-[13.5px] text-[#3B312C]">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Suggested Theme Match */}
          <div className="bg-white border border-[#EADCD6] rounded-xl overflow-hidden">
            <div className="aspect-[4/3] w-full bg-[#FAF1EC] relative overflow-hidden">
              <img
                src={suggestedTheme.imageUrl}
                alt={suggestedTheme.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-5 space-y-3">
              <div className="text-xs text-[#6E605A] flex items-center gap-2">
                <span>Matched Theme</span>
                <span aria-hidden="true">·</span>
                <span>{suggestedTheme.tierLabel}</span>
              </div>
              <h3 className="font-display text-lg font-semibold text-[#231D1A]">
                {suggestedTheme.name}
              </h3>
              <p className="text-xs text-[#6E605A] leading-relaxed">
                {suggestedTheme.subtitle}
              </p>

              {/* Color Swatches */}
              <div className="flex items-center gap-2 pt-1">
                {suggestedTheme.palette.map((hex, i) => (
                  <div key={hex} className="flex items-center gap-1.5">
                    <span
                      className="w-4 h-4 rounded-full border border-[#EADCD6]"
                      style={{ backgroundColor: hex }}
                      title={suggestedTheme.paletteNames[i]}
                    />
                  </div>
                ))}
                <span className="text-xs text-[#6E605A] ml-1">
                  {suggestedTheme.paletteNames.slice(0, 2).join(' & ')}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onSelectTheme(suggestedTheme.id)}
                  className="text-xs font-medium text-[#E25845] hover:text-[#C84432] inline-flex items-center gap-1"
                >
                  <span>Apply layout &amp; palette</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenThemeGallery}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#231D1A] hover:text-[#E25845]"
                >
                  <span>Explore all setups</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
