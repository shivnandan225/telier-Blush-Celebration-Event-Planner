import { Download, Printer, X } from 'lucide-react';
import {
  EVENT_TYPE_LABELS,
  formatMoney,
  getThemeById,
} from '../data/currenciesAndThemes';
import type { BudgetItem, CelebrationEvent, GuestRsvp } from '../types/planner';
import { computeVenueMetrics, VenueFloorPlanSvg } from './VenueFloorPlanSvg';

interface PrintCoordinationViewProps {
  event: CelebrationEvent;
  budgetItems: BudgetItem[];
  rsvps: GuestRsvp[];
  confirmedGuests: number;
  onClose: () => void;
}

export function PrintCoordinationView({
  event,
  budgetItems,
  rsvps,
  confirmedGuests,
  onClose,
}: PrintCoordinationViewProps) {
  const theme = getThemeById(event.selectedThemeId);
  const activeHeadcount = Math.max(1, confirmedGuests > 0 ? confirmedGuests : event.estimatedGuests);
  const attendingGuests = rsvps.filter((r) => r.status === 'attending');
  const metrics = computeVenueMetrics(activeHeadcount, event.venueTableStyle);

  const lineItems = budgetItems.map((item) => ({
    ...item,
    effectiveAllocated:
      item.pricingMode === 'per_guest'
        ? Math.round(item.unitCost * activeHeadcount)
        : Math.round(item.allocatedAmount),
  }));

  const totalAllocated = lineItems.reduce((s, i) => s + i.effectiveAllocated, 0);
  const totalActual = lineItems.reduce((s, i) => s + Math.round(i.actualSpent), 0);

  const handleDownloadCsv = () => {
    const rows = [
      ['SECTION', 'ITEM / GUEST', 'CATEGORY / STATUS', 'ALLOCATED / PARTY SIZE', 'ACTUAL / MEAL', 'NOTES'],
      ...lineItems.map((i) => [
        'Budget',
        i.title,
        i.category,
        String(i.effectiveAllocated),
        String(i.actualSpent),
        i.notes,
      ]),
      ...rsvps.map((r) => [
        'RSVP',
        r.guestName,
        r.status,
        String(r.partySize),
        r.mealChoice,
        r.dietaryNotes,
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-coordination.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto p-3 sm:p-6 print:static print:bg-white print:p-0 print:overflow-visible">
      <div className="max-w-4xl mx-auto bg-white border border-[#EADCD6] rounded-xl overflow-hidden print-only-sheet">
        {/* Modal Controls (hidden during print/PDF) */}
        <div className="no-print px-6 py-4 bg-[#FFF3EE] border-b border-[#EADCD6] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#231D1A]">
              Final Coordination Packet — Print or Save as PDF
            </h2>
            <p className="text-xs text-[#6E605A]">
              Use your browser&apos;s Print dialog (&ldquo;Save as PDF&rdquo;) for a clean vector dossier, or download CSV.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#231D1A] bg-white border border-[#EADCD6] hover:bg-[#FCF8F5] rounded-lg"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#E25845] hover:bg-[#C84432] rounded-lg"
            >
              <Printer className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close print preview"
              className="p-2 text-[#6E605A] hover:text-[#231D1A] rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Print Dossier Content */}
        <div className="p-6 sm:p-10 space-y-8 text-[#231D1A]">
          <header className="pb-6 border-b border-[#EADCD6] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs text-[#6E605A]">
                Atelier Blush · Final Event Coordination Sheet
              </p>
              <h1 className="font-display text-3xl font-semibold mt-1">{event.title}</h1>
              <p className="text-sm text-[#6E605A] mt-1">
                {EVENT_TYPE_LABELS[event.eventType]} · Hosted by {event.hostName}
              </p>
            </div>
            <div className="text-xs text-[#6E605A] sm:text-right space-y-0.5">
              <div>Date: {event.eventDate}</div>
              <div>Venue: {event.venueName || 'TBD'}</div>
              <div>Dress Code: {event.dressCode || 'Festive'}</div>
            </div>
          </header>

          {/* Financial Summary */}
          <section className="print-break-avoid space-y-3">
            <h2 className="font-display text-xl font-semibold">
              1. Multi-Currency Budget Summary ({event.currencyCode})
            </h2>
            <div className="grid grid-cols-3 gap-4 border border-[#EADCD6] rounded-lg p-4 bg-[#FCF8F5]">
              <div>
                <p className="text-xs text-[#6E605A]">Target Budget</p>
                <p className="text-lg font-semibold font-mono-num">
                  {formatMoney(event.totalBudget, event.currencyCode)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#6E605A]">Allocated ({activeHeadcount} guests)</p>
                <p className="text-lg font-semibold font-mono-num">
                  {formatMoney(totalAllocated, event.currencyCode)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#6E605A]">Actual Paid</p>
                <p className="text-lg font-semibold font-mono-num">
                  {formatMoney(totalActual, event.currencyCode)}
                </p>
              </div>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#EADCD6] text-[#6E605A]">
                  <th className="py-2 pr-3 font-medium">Category</th>
                  <th className="py-2 pr-3 font-medium">Item</th>
                  <th className="py-2 pr-3 font-medium">Basis</th>
                  <th className="py-2 pr-3 font-medium text-right">Allocated</th>
                  <th className="py-2 font-medium text-right">Actual Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EADCD6]">
                {lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 pr-3 text-[#6E605A]">{item.category}</td>
                    <td className="py-2 pr-3 font-medium">{item.title}</td>
                    <td className="py-2 pr-3 text-[#6E605A]">
                      {item.pricingMode === 'per_guest' ? 'Per guest' : 'Fixed'}
                    </td>
                    <td className="py-2 pr-3 text-right font-mono-num">
                      {formatMoney(item.effectiveAllocated, event.currencyCode)}
                    </td>
                    <td className="py-2 text-right font-mono-num">
                      {formatMoney(item.actualSpent, event.currencyCode)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Cost-Saving Checklist */}
          {event.costSavingTips.length > 0 && (
            <section className="print-break-avoid space-y-2">
              <h2 className="font-display text-xl font-semibold">
                2. Cost-Saving Coordination Notes
              </h2>
              <ul className="space-y-1.5 text-xs text-[#3B312C]">
                {event.costSavingTips.map((tip, i) => (
                  <li key={i}>• {tip}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Confirmed Guest Roster */}
          <section className="print-break-avoid space-y-3">
            <h2 className="font-display text-xl font-semibold">
              3. Confirmed Guest Roster ({confirmedGuests} Attending Guests)
            </h2>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#EADCD6] text-[#6E605A]">
                  <th className="py-2 pr-3 font-medium">Guest / Household</th>
                  <th className="py-2 pr-3 font-medium">Party</th>
                  <th className="py-2 pr-3 font-medium">Meal Choice</th>
                  <th className="py-2 font-medium">Dietary Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EADCD6]">
                {attendingGuests.map((g) => (
                  <tr key={g.id}>
                    <td className="py-2 pr-3 font-medium">{g.guestName}</td>
                    <td className="py-2 pr-3 font-mono-num">{g.partySize}</td>
                    <td className="py-2 pr-3">{g.mealChoice}</td>
                    <td className="py-2 text-[#6E605A]">{g.dietaryNotes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Theme & Venue Floor Plan */}
          <section className="print-break-avoid space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">
                4. Venue Setup &amp; Theme ({theme.name})
              </h2>
              <span className="text-xs font-mono-num text-[#6E605A]">
                {metrics.tablesNeeded} tables · {metrics.totalSeats} seats ({event.venueTableStyle})
              </span>
            </div>
            <VenueFloorPlanSvg
              guestCount={activeHeadcount}
              tableStyle={event.venueTableStyle}
              showStage={event.showStage}
              showDanceFloor={event.showDanceFloor}
              showBuffet={event.showBuffet}
              showPhotoBooth={event.showPhotoBooth}
              floralDensity={event.floralDensity}
              palette={theme.palette}
              venueName={event.venueName}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
