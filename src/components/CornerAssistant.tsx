import { useState } from 'react';
import { MessageSquareHeart, Send, X, ArrowUpRight, Loader2 } from 'lucide-react';
import {
  CURRENCIES,
  CURRENCY_LIST,
  EVENT_TYPE_LABELS,
  formatMoney,
} from '../data/currenciesAndThemes';
import type {
  AssistantResponse,
  CelebrationEvent,
  CurrencyCode,
  EventType,
} from '../types/planner';

interface ChatMessage {
  role: 'assistant' | 'user';
  text: string;
  appliedBudgetSummary?: string;
}

interface CornerAssistantProps {
  event: CelebrationEvent;
  onApplyAssistantPlan: (plan: {
    eventType: EventType;
    totalBudget: number;
    currencyCode: CurrencyCode;
    guests: number;
    themeId: AssistantResponse['recommendedThemeId'];
    breakdown: AssistantResponse['budgetBreakdown'];
    costSavingTips: string[];
  }) => void;
  onQuickOpenBudget: (
    eventType: EventType,
    totalBudget: number,
    currencyCode: CurrencyCode,
    guests: number
  ) => void;
}

const QUICK_EVENTS: Array<{ type: EventType; label: string }> = [
  { type: 'wedding', label: 'Wedding' },
  { type: 'birthday', label: 'Birthday' },
  { type: 'corporate', label: 'Corporate Gala' },
  { type: 'shower', label: 'Baby / Bridal Shower' },
];

export function CornerAssistant({
  event,
  onApplyAssistantPlan,
  onQuickOpenBudget,
}: CornerAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<EventType>(event.eventType);
  const [currency, setCurrency] = useState<CurrencyCode>(event.currencyCode);
  const [budgetInput, setBudgetInput] = useState<string>(String(event.totalBudget));
  const [guestInput, setGuestInput] = useState<string>(String(event.estimatedGuests));
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Welcome! What event are you planning today? Pick an event below—like Wedding—to open its budget directly with recommended splits and cost-saving tips.',
    },
  ]);

  const handleSelectQuickEvent = (type: EventType) => {
    setSelectedType(type);
    const cfg = CURRENCIES[currency];
    const presetBudget =
      type === 'wedding'
        ? cfg.sampleWeddingBudget
        : type === 'birthday'
        ? cfg.sampleBirthdayBudget
        : type === 'corporate'
        ? cfg.sampleCorporateBudget
        : cfg.sampleShowerBudget;
    setBudgetInput(String(presetBudget));
  };

  const handleDirectWeddingOrEventLaunch = async () => {
    const parsedBudget = Math.max(100, Number(budgetInput) || CURRENCIES[currency].sampleWeddingBudget);
    const parsedGuests = Math.max(1, Math.min(10000, Math.round(Number(guestInput) || 80)));

    // Immediately open and populate the Budget workspace for zero-latency experience
    onQuickOpenBudget(selectedType, parsedBudget, currency, parsedGuests);

    const userSummary = `Plan my ${EVENT_TYPE_LABELS[selectedType]} with a budget of ${formatMoney(parsedBudget, currency)} for ${parsedGuests} guests.`;
    setMessages((prev) => [...prev, { role: 'user', text: userSummary }]);
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userSummary,
          eventType: selectedType,
          totalBudget: parsedBudget,
          currencyCode: currency,
          estimatedGuests: parsedGuests,
          history: messages,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Assistant request failed.');
      }
      const typed = data as AssistantResponse;
      if (typed.shouldApplyBudget && Array.isArray(typed.budgetBreakdown) && typed.budgetBreakdown.length > 0) {
        onApplyAssistantPlan({
          eventType: typed.detectedEventType || selectedType,
          totalBudget: typed.recommendedTotalBudget || parsedBudget,
          currencyCode: currency,
          guests: typed.recommendedGuests || parsedGuests,
          themeId: typed.recommendedThemeId,
          breakdown: typed.budgetBreakdown,
          costSavingTips: typed.costSavingTips || [],
        });
      }
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: typed.reply,
          appliedBudgetSummary: `Opened ${EVENT_TYPE_LABELS[selectedType]} budget (${formatMoney(parsedBudget, currency)}) with ${typed.costSavingTips?.length || 0} cost-saving tips.`,
        },
      ]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to reach AI advisor.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', text: trimmed }];
    setMessages(nextMessages);
    setChatInput('');
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          eventType: selectedType,
          totalBudget: Number(budgetInput) || event.totalBudget,
          currencyCode: currency,
          estimatedGuests: Number(guestInput) || event.estimatedGuests,
          history: nextMessages,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Assistant request failed.');
      }
      const typed = data as AssistantResponse;
      if (typed.shouldApplyBudget && Array.isArray(typed.budgetBreakdown) && typed.budgetBreakdown.length > 0) {
        setSelectedType(typed.detectedEventType);
        setBudgetInput(String(typed.recommendedTotalBudget));
        setGuestInput(String(typed.recommendedGuests));
        onApplyAssistantPlan({
          eventType: typed.detectedEventType,
          totalBudget: typed.recommendedTotalBudget,
          currencyCode: currency,
          guests: typed.recommendedGuests,
          themeId: typed.recommendedThemeId,
          breakdown: typed.budgetBreakdown,
          costSavingTips: typed.costSavingTips || [],
        });
      }
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: typed.reply,
          appliedBudgetSummary: typed.shouldApplyBudget
            ? `Updated ${EVENT_TYPE_LABELS[typed.detectedEventType]} budget & cost-saving tips.`
            : undefined,
        },
      ]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to reach AI advisor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="no-print fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open Event Planning Assistant"
          className="inline-flex items-center gap-2.5 h-12 sm:h-13 px-4 sm:px-5 rounded-full bg-[#231D1A] hover:bg-[#3A302B] text-white shadow-lg border border-[#3E332E] transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E25845]"
        >
          <MessageSquareHeart className="w-5 h-5 text-[#F48777] shrink-0" aria-hidden="true" />
          <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
            Plan Event &amp; Budget
          </span>
        </button>
      ) : (
        <section
          aria-label="Event Planning Assistant"
          className="w-[calc(100vw-2rem)] sm:w-[390px] max-h-[82vh] bg-white border border-[#EADCD6] rounded-2xl shadow-xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-[#FFF3EE] border-b border-[#EADCD6] flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold text-[#231D1A]">
                Planning Assistant
              </h2>
              <p className="text-[11px] text-[#6E605A]">
                Instant budget builder &amp; cost-saving advisor
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close planning assistant"
              className="p-2 text-[#6E605A] hover:text-[#231D1A] rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Event Selector + Direct Budget Launcher */}
          <div className="p-3.5 bg-[#FCF8F5] border-b border-[#EADCD6] space-y-3">
            <p className="text-xs font-medium text-[#231D1A]">
              What event do you want to plan?
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {QUICK_EVENTS.map((ev) => (
                <button
                  key={ev.type}
                  type="button"
                  onClick={() => handleSelectQuickEvent(ev.type)}
                  className={`px-2.5 py-2 text-xs font-medium rounded-lg border text-left transition-colors ${
                    selectedType === ev.type
                      ? 'bg-[#E25845] text-white border-[#E25845]'
                      : 'bg-white text-[#231D1A] border-[#EADCD6] hover:bg-[#FFF3EE]'
                  }`}
                >
                  {ev.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-[#6E605A] mb-0.5">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => {
                    const nextCur = e.target.value as CurrencyCode;
                    setCurrency(nextCur);
                    const cfg = CURRENCIES[nextCur];
                    const nextVal =
                      selectedType === 'wedding'
                        ? cfg.sampleWeddingBudget
                        : selectedType === 'birthday'
                        ? cfg.sampleBirthdayBudget
                        : selectedType === 'corporate'
                        ? cfg.sampleCorporateBudget
                        : cfg.sampleShowerBudget;
                    setBudgetInput(String(nextVal));
                  }}
                  className="w-full h-9 px-2 text-xs bg-white border border-[#EADCD6] rounded-md"
                >
                  {CURRENCY_LIST.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol.trim()})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-[#6E605A] mb-0.5">Budget</label>
                <input
                  type="number"
                  min={100}
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="w-full h-9 px-2 text-xs font-mono-num bg-white border border-[#EADCD6] rounded-md"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#6E605A] mb-0.5">Guests</label>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={guestInput}
                  onChange={(e) => setGuestInput(e.target.value)}
                  className="w-full h-9 px-2 text-xs font-mono-num bg-white border border-[#EADCD6] rounded-md"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleDirectWeddingOrEventLaunch}
              disabled={loading}
              className="w-full h-10 px-3 text-xs font-semibold text-white bg-[#231D1A] hover:bg-[#3A302B] disabled:opacity-60 rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Open {EVENT_TYPE_LABELS[selectedType]} Budget &amp; Tips</span>
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {/* Conversation Feed */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 min-h-[160px] max-h-[240px]">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#E25845] text-white'
                      : 'bg-[#FFF3EE] text-[#231D1A] border border-[#EADCD6]'
                  }`}
                >
                  <p>{msg.text}</p>
                  {msg.appliedBudgetSummary && (
                    <p className="mt-1.5 pt-1.5 border-t border-[#EADCD6] text-[11px] font-medium text-[#C84432]">
                      {msg.appliedBudgetSummary}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-[#6E605A]">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E25845]" />
                <span>Tailoring budget splits &amp; cost-saving tips...</span>
              </div>
            )}
            {errorMsg && (
              <div className="p-2.5 text-xs text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-lg">
                {errorMsg}
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendChat} className="p-3 border-t border-[#EADCD6] flex items-center gap-2 bg-white">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask for budget cuts or theme advice..."
              className="flex-1 h-10 px-3 text-xs bg-[#FCF8F5] border border-[#EADCD6] rounded-lg focus:outline-none focus:border-[#E25845]"
            />
            <button
              type="submit"
              disabled={loading || !chatInput.trim()}
              aria-label="Send message to assistant"
              className="h-10 w-10 inline-flex items-center justify-center rounded-lg bg-[#E25845] hover:bg-[#C84432] disabled:opacity-50 text-white shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
