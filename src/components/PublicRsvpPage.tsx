import { useState } from 'react';
import { ArrowLeft, Calendar, CheckCircle2, MapPin, Shirt } from 'lucide-react';
import { getThemeById } from '../data/currenciesAndThemes';
import type { CelebrationEvent, GuestRsvp, RsvpStatus } from '../types/planner';

interface PublicRsvpPageProps {
  event: CelebrationEvent | null;
  loading: boolean;
  errorMessage: string | null;
  isPreviewMode: boolean;
  onExitPreview?: () => void;
  onSubmitRsvp: (rsvp: GuestRsvp) => Promise<void>;
}

export function PublicRsvpPage({
  event,
  loading,
  errorMessage,
  isPreviewMode,
  onExitPreview,
  onSubmitRsvp,
}: PublicRsvpPageProps) {
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [status, setStatus] = useState<RsvpStatus>('attending');
  const [partySize, setPartySize] = useState(1);
  const [mealChoice, setMealChoice] = useState('Herb Roasted Sea Bass');
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCF8F5] flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white border border-[#EADCD6] rounded-xl p-8 text-center space-y-3">
          <div className="h-6 w-48 bg-[#F4EAE4] rounded mx-auto" />
          <div className="h-4 w-64 bg-[#FAF1EC] rounded mx-auto" />
          <p className="text-xs text-[#6E605A]">Loading invitation details...</p>
        </div>
      </div>
    );
  }

  if (!event || errorMessage) {
    return (
      <div className="min-h-screen bg-[#FCF8F5] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-[#EADCD6] rounded-xl p-6 space-y-4 text-center">
          <h1 className="font-display text-2xl font-semibold text-[#231D1A]">
            Invitation Unavailable
          </h1>
          <p className="text-sm text-[#6E605A]">
            {errorMessage || 'This RSVP link is either closed or no longer active.'}
          </p>
          {onExitPreview && (
            <button
              type="button"
              onClick={onExitPreview}
              className="px-4 py-2.5 text-sm font-medium text-white bg-[#E25845] hover:bg-[#C84432] rounded-lg"
            >
              Return to Planner
            </button>
          )}
        </div>
      </div>
    );
  }

  const theme = getThemeById(event.selectedThemeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload: GuestRsvp = {
        id: `rsvp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
        eventId: event.id,
        ownerId: event.ownerId,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        status,
        partySize: status === 'declined' ? 1 : Math.max(1, Math.min(20, Math.round(partySize) || 1)),
        mealChoice: status === 'declined' ? 'None' : mealChoice,
        dietaryNotes: dietaryNotes.trim(),
        source: 'public_link',
      };
      await onSubmitRsvp(payload);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to send RSVP right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCF8F5] text-[#231D1A] py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {isPreviewMode && onExitPreview && (
          <div className="flex items-center justify-between bg-[#FFF3EE] border border-[#EADCD6] rounded-xl px-4 py-3">
            <span className="text-xs font-medium text-[#231D1A]">
              Previewing Guest Invitation View
            </span>
            <button
              type="button"
              onClick={onExitPreview}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E25845] hover:text-[#C84432]"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Back to Planner</span>
            </button>
          </div>
        )}

        <article className="bg-white border border-[#EADCD6] rounded-xl overflow-hidden">
          <div className="aspect-[16/9] w-full bg-[#FAF1EC] relative overflow-hidden">
            <img
              src={theme.imageUrl}
              alt={event.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent flex items-end p-6">
              <div className="text-white space-y-1">
                <p className="text-xs text-white/85">
                  Hosted by {event.hostName}
                </p>
                <h1 className="font-display text-2xl sm:text-3xl font-semibold">
                  {event.title}
                </h1>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-[#EADCD6] text-xs text-[#6E605A]">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#E25845] shrink-0" aria-hidden="true" />
                <span>{event.eventDate || 'Date TBD'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#E25845] shrink-0" aria-hidden="true" />
                <span>{event.venueName || 'Venue TBD'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shirt className="w-4 h-4 text-[#E25845] shrink-0" aria-hidden="true" />
                <span>{event.dressCode || 'Festive Attire'}</span>
              </div>
            </div>

            {submitted ? (
              <div className="py-6 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-[#15803D] mx-auto" aria-hidden="true" />
                <h2 className="font-display text-2xl font-semibold text-[#231D1A]">
                  Thank You, {guestName}
                </h2>
                <p className="text-sm text-[#6E605A] max-w-md mx-auto">
                  Your RSVP ({status === 'attending' ? `Attending · Party of ${partySize}` : 'Declined'}) has been recorded in real time for {event.hostName}.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setGuestName('');
                    setGuestEmail('');
                    setDietaryNotes('');
                  }}
                  className="mt-2 px-4 py-2 text-xs font-medium text-[#E25845] border border-[#EADCD6] rounded-lg hover:bg-[#FFF3EE]"
                >
                  Submit Another Response
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="font-display text-xl font-semibold text-[#231D1A]">
                  Kindly Reply
                </h2>

                {submitError && (
                  <div className="p-3 text-xs text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-lg">
                    {submitError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#6E605A] mb-1">
                      Full Name(s)
                    </label>
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. Jordan & Sam Patel"
                      className="w-full h-11 px-3 text-sm bg-[#FCF8F5] border border-[#EADCD6] rounded-lg focus:outline-none focus:border-[#E25845]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6E605A] mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full h-11 px-3 text-sm bg-[#FCF8F5] border border-[#EADCD6] rounded-lg focus:outline-none focus:border-[#E25845]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#6E605A] mb-1">
                      Will you attend?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setStatus('attending')}
                        className={`h-11 text-sm font-medium rounded-lg border transition-colors ${
                          status === 'attending'
                            ? 'bg-[#E25845] text-white border-[#E25845]'
                            : 'bg-[#FCF8F5] text-[#231D1A] border-[#EADCD6]'
                        }`}
                      >
                        Joyfully Accepts
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus('declined')}
                        className={`h-11 text-sm font-medium rounded-lg border transition-colors ${
                          status === 'declined'
                            ? 'bg-[#231D1A] text-white border-[#231D1A]'
                            : 'bg-[#FCF8F5] text-[#231D1A] border-[#EADCD6]'
                        }`}
                      >
                        Regretfully Declines
                      </button>
                    </div>
                  </div>

                  {status === 'attending' && (
                    <div>
                      <label className="block text-xs font-medium text-[#6E605A] mb-1">
                        Total Guests in Party
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
                  )}
                </div>

                {status === 'attending' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#6E605A] mb-1">
                        Preferred Entree
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
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#6E605A] mb-1">
                        Dietary Needs or Song Request
                      </label>
                      <input
                        type="text"
                        value={dietaryNotes}
                        onChange={(e) => setDietaryNotes(e.target.value)}
                        placeholder="Allergies, accessibility, or notes..."
                        className="w-full h-11 px-3 text-sm bg-[#FCF8F5] border border-[#EADCD6] rounded-lg focus:outline-none focus:border-[#E25845]"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 text-sm font-semibold text-white bg-[#E25845] hover:bg-[#C84432] disabled:opacity-60 rounded-lg transition-colors"
                >
                  {submitting ? 'Sending RSVP...' : 'Confirm RSVP'}
                </button>
              </form>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
