import { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserMinus,
  Clock,
} from 'lucide-react';
import type { CelebrationEvent, GuestRsvp, RsvpStatus } from '../types/planner';

interface RsvpWorkspaceProps {
  event: CelebrationEvent;
  rsvps: GuestRsvp[];
  isCloudSynced: boolean;
  onUpdateEvent: (patch: Partial<CelebrationEvent>) => void;
  onSaveRsvp: (rsvp: GuestRsvp, isNew: boolean) => void;
  onDeleteRsvp: (rsvpId: string) => void;
  onPreviewPublicRsvp: () => void;
  onSignInRequest: () => void;
}

export function RsvpWorkspace({
  event,
  rsvps,
  isCloudSynced,
  onUpdateEvent,
  onSaveRsvp,
  onDeleteRsvp,
  onPreviewPublicRsvp,
  onSignInRequest,
}: RsvpWorkspaceProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | RsvpStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [partySize, setPartySize] = useState(1);
  const [status, setStatus] = useState<RsvpStatus>('attending');
  const [mealChoice, setMealChoice] = useState('Herb Roasted Sea Bass');
  const [dietaryNotes, setDietaryNotes] = useState('');

  const shareUrl = `${window.location.origin}${window.location.pathname}?rsvp=${encodeURIComponent(event.id)}`;

  const attendingList = rsvps.filter((r) => r.status === 'attending');
  const declinedList = rsvps.filter((r) => r.status === 'declined');
  const pendingList = rsvps.filter((r) => r.status === 'pending');

  const confirmedHeadcount = attendingList.reduce((acc, r) => acc + (r.partySize || 1), 0);
  const pendingHeadcount = pendingList.reduce((acc, r) => acc + (r.partySize || 1), 0);

  const mealTally = attendingList.reduce<Record<string, number>>((acc, r) => {
    const meal = r.mealChoice?.trim() || 'Standard';
    acc[meal] = (acc[meal] || 0) + (r.partySize || 1);
    return acc;
  }, {});

  const filteredRsvps = rsvps.filter((r) => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      r.guestName.toLowerCase().includes(q) ||
      r.guestEmail.toLowerCase().includes(q) ||
      r.mealChoice.toLowerCase().includes(q) ||
      r.dietaryNotes.toLowerCase().includes(q)
    );
  });

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setCopiedLink(false);
    }
  };

  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    const record: GuestRsvp = {
      id: `rsvp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      eventId: event.id,
      ownerId: event.ownerId,
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim(),
      status,
      partySize: Math.max(1, Math.min(20, Math.round(partySize) || 1)),
      mealChoice: mealChoice.trim() || 'Standard',
      dietaryNotes: dietaryNotes.trim(),
      source: 'organizer',
    };
    onSaveRsvp(record, true);
    setGuestName('');
    setGuestEmail('');
    setPartySize(1);
    setDietaryNotes('');
  };

  return (
    <div className="space-y-8">
      {/* Live Shareable RSVP Portal Banner */}
      <section className="bg-white border border-[#EADCD6] rounded-xl p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-[#6E605A]">
              Real-Time Guest Portal · Updates Budget &amp; Venue Capacity Automatically
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#231D1A]">
              Live Guest RSVPs
            </h1>
            <p className="text-sm text-[#6E605A] max-w-2xl">
              {isCloudSynced
                ? 'Share this live invitation link with guests. Submissions stream directly into your ledger and adjust per-guest catering totals.'
                : 'Sign in with Google above to publish this event to the cloud and collect live RSVPs across guest devices.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {!isCloudSynced && (
              <button
                type="button"
                onClick={onSignInRequest}
                className="px-4 py-2.5 text-xs sm:text-sm font-medium text-white bg-[#E25845] hover:bg-[#C84432] rounded-lg transition-colors min-h-[42px]"
              >
                Connect Google for Live Link
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-[#231D1A] bg-[#FFF3EE] hover:bg-[#FBE4DC] border border-[#EADCD6] rounded-lg transition-colors min-h-[42px]"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-[#15803D]" aria-hidden="true" />
                  <span>Link Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#E25845]" aria-hidden="true" />
                  <span>Copy Shareable RSVP Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onPreviewPublicRsvp}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-white bg-[#231D1A] hover:bg-[#3A302B] rounded-lg transition-colors min-h-[42px]"
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              <span>Open Guest RSVP Form</span>
            </button>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-[#EADCD6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs font-mono-num text-[#6E605A] truncate">
            Invitation URL: {shareUrl}
          </div>
          <label className="inline-flex items-center gap-2 text-xs font-medium text-[#231D1A] shrink-0">
            <input
              type="checkbox"
              checked={event.isPublicRsvp}
              onChange={(e) => onUpdateEvent({ isPublicRsvp: e.target.checked })}
              className="accent-[#E25845] w-4 h-4 rounded"
            />
            <span>Accept public RSVP submissions</span>
          </label>
        </div>
      </section>

      {/* RSVP Metrics & Meal Tallies */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#EADCD6] rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-[#6E605A]">
            <span>Confirmed Attending</span>
            <UserCheck className="w-4 h-4 text-[#15803D]" aria-hidden="true" />
          </div>
          <p className="mt-1.5 text-2xl font-semibold font-mono-num text-[#231D1A]">
            {confirmedHeadcount} guests
          </p>
          <p className="mt-1 text-xs text-[#6E605A] tabular-nums">
            {attendingList.length} households confirmed
          </p>
        </div>

        <div className="bg-white border border-[#EADCD6] rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-[#6E605A]">
            <span>Awaiting Response</span>
            <Clock className="w-4 h-4 text-[#B45309]" aria-hidden="true" />
          </div>
          <p className="mt-1.5 text-2xl font-semibold font-mono-num text-[#231D1A]">
            {pendingHeadcount} guests
          </p>
          <p className="mt-1 text-xs text-[#6E605A] tabular-nums">
            {pendingList.length} pending invitations
          </p>
        </div>

        <div className="bg-white border border-[#EADCD6] rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-[#6E605A]">
            <span>Declined</span>
            <UserMinus className="w-4 h-4 text-[#6E605A]" aria-hidden="true" />
          </div>
          <p className="mt-1.5 text-2xl font-semibold font-mono-num text-[#231D1A]">
            {declinedList.reduce((acc, r) => acc + (r.partySize || 1), 0)} guests
          </p>
          <p className="mt-1 text-xs text-[#6E605A] tabular-nums">
            {declinedList.length} declined entries
          </p>
        </div>

        <div className="bg-[#FFF3EE] border border-[#EADCD6] rounded-xl p-5">
          <p className="text-xs text-[#6E605A]">Catering Meal Breakdown</p>
          {Object.keys(mealTally).length === 0 ? (
            <p className="mt-2 text-xs text-[#6E605A]">No attending meals selected yet.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-xs text-[#231D1A]">
              {Object.entries(mealTally)
                .slice(0, 3)
                .map(([meal, count]) => (
                  <li key={meal} className="flex items-center justify-between gap-2">
                    <span className="truncate">{meal}</span>
                    <span className="font-mono-num font-semibold shrink-0">{count}</span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </section>

      {/* Add Guest + Live Guest Table */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Add Guest Form */}
        <section className="bg-white border border-[#EADCD6] rounded-xl p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-[#231D1A] mb-4">
            Add Guest or Household
          </h2>
          <form onSubmit={handleAddGuest} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#6E605A] mb-1">
                Guest / Household Name
              </label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. Maya & Lucas Vance"
                required
                className="w-full h-11 px-3 text-sm bg-[#FCF8F5] border border-[#EADCD6] rounded-lg focus:outline-none focus:border-[#E25845]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6E605A] mb-1">
                Email (Organizer private)
              </label>
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="maya@example.com"
                className="w-full h-11 px-3 text-sm bg-[#FCF8F5] border border-[#EADCD6] rounded-lg focus:outline-none focus:border-[#E25845]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#6E605A] mb-1">
                  RSVP Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as RsvpStatus)}
                  className="w-full h-11 px-3 text-sm bg-[#FCF8F5] border border-[#EADCD6] rounded-lg focus:outline-none focus:border-[#E25845]"
                >
                  <option value="attending">Attending</option>
                  <option value="pending">Pending</option>
                  <option value="declined">Declined</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6E605A] mb-1">
                  Party Size
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={partySize}
                  onChange={(e) => setPartySize(Number(e.target.value) || 1)}
                  className="w-full h-11 px-3 text-sm font-mono-num bg-[#FCF8F5] border border-[#EADCD6] rounded-lg focus:outline-none focus:border-[#E25845]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6E605A] mb-1">
                Meal Selection
              </label>
              <select
                value={mealChoice}
                onChange={(e) => setMealChoice(e.target.value)}
                className="w-full h-11 px-3 text-sm bg-[#FCF8F5] border border-[#EADCD6] rounded-lg focus:outline-none focus:border-[#E25845]"
              >
                <option value="Herb Roasted Sea Bass">Herb Roasted Sea Bass</option>
                <option value="Charred Herb Chicken">Charred Herb Chicken</option>
                <option value="Wild Mushroom Risotto (Vegan)">Wild Mushroom Risotto (Vegan)</option>
                <option value="Chef Tasting Platter">Chef Tasting Platter</option>
                <option value="Kids Meal">Kids Meal</option>
                <option value="Undecided">Undecided</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6E605A] mb-1">
                Dietary Notes / Allergies
              </label>
              <input
                type="text"
                value={dietaryNotes}
                onChange={(e) => setDietaryNotes(e.target.value)}
                placeholder="Gluten-free, nut allergy, high chair..."
                className="w-full h-11 px-3 text-sm bg-[#FCF8F5] border border-[#EADCD6] rounded-lg focus:outline-none focus:border-[#E25845]"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 h-11 px-4 text-sm font-medium text-white bg-[#E25845] hover:bg-[#C84432] rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Add to Guest List</span>
            </button>
          </form>
        </section>

        {/* Guest Roster */}
        <section className="xl:col-span-2 bg-white border border-[#EADCD6] rounded-xl overflow-hidden">
          <div className="p-5 sm:px-6 border-b border-[#EADCD6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-1 p-1 bg-[#FCF8F5] border border-[#EADCD6] rounded-lg overflow-x-auto">
              {(['all', 'attending', 'pending', 'declined'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterStatus(tab)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap shrink-0 ${
                    filterStatus === tab
                      ? 'bg-[#E25845] text-white'
                      : 'text-[#6E605A] hover:text-[#231D1A]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search
                className="w-4 h-4 text-[#6E605A] absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guest or meal..."
                className="w-full h-10 pl-9 pr-3 text-sm bg-[#FCF8F5] border border-[#EADCD6] rounded-lg focus:outline-none focus:border-[#E25845]"
              />
            </div>
          </div>

          {filteredRsvps.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#6E605A]">
              No guests match the current filter. Share your RSVP link or add guests on the left.
            </div>
          ) : (
            <div className="divide-y divide-[#EADCD6]">
              {filteredRsvps.map((rsvp) => (
                <div
                  key={rsvp.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FFFBF9]"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[#231D1A]">{rsvp.guestName}</span>
                      <span className="text-xs text-[#6E605A]">·</span>
                      <span className="text-xs font-mono-num text-[#6E605A]">
                        Party of {rsvp.partySize}
                      </span>
                      <span className="text-xs text-[#6E605A]">·</span>
                      <span className="text-xs text-[#6E605A]">
                        {rsvp.source === 'public_link' ? 'Submitted via link' : 'Added by host'}
                      </span>
                    </div>
                    <div className="text-xs text-[#6E605A] flex flex-wrap items-center gap-2">
                      <span>Meal: {rsvp.mealChoice || 'Standard'}</span>
                      {rsvp.dietaryNotes && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Note: {rsvp.dietaryNotes}</span>
                        </>
                      )}
                      {rsvp.guestEmail && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{rsvp.guestEmail}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      aria-label={`RSVP status for ${rsvp.guestName}`}
                      value={rsvp.status}
                      onChange={(e) =>
                        onSaveRsvp({ ...rsvp, status: e.target.value as RsvpStatus }, false)
                      }
                      className={`h-9 px-2.5 text-xs font-medium rounded-md border ${
                        rsvp.status === 'attending'
                          ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]'
                          : rsvp.status === 'declined'
                          ? 'bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C]'
                          : 'bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]'
                      }`}
                    >
                      <option value="attending">Attending</option>
                      <option value="pending">Pending</option>
                      <option value="declined">Declined</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => onDeleteRsvp(rsvp.id)}
                      aria-label={`Delete ${rsvp.guestName}`}
                      className="p-2 text-[#6E605A] hover:text-[#B91C1C] rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
