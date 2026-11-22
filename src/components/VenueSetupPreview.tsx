import { useState } from 'react';
import { getThemeById } from '../data/currenciesAndThemes';
import type {
  CelebrationEvent,
  FloralDensity,
  VenueTableStyle,
} from '../types/planner';
import { computeVenueMetrics, VenueFloorPlanSvg } from './VenueFloorPlanSvg';

interface VenueSetupPreviewProps {
  event: CelebrationEvent;
  confirmedGuests: number;
  onUpdateEvent: (patch: Partial<CelebrationEvent>) => void;
}

const TABLE_STYLES: Array<{ id: VenueTableStyle; label: string; cap: string }> = [
  { id: 'round', label: 'Round Banquet', cap: '8 / table' },
  { id: 'imperial', label: 'Long Imperial', cap: '12 / table' },
  { id: 'cocktail', label: 'Cocktail Hi-Tops', cap: '4 / table' },
  { id: 'theater', label: 'Ceremony Rows', cap: '10 / row' },
];

export function VenueSetupPreview({
  event,
  confirmedGuests,
  onUpdateEvent,
}: VenueSetupPreviewProps) {
  const [useSimulatedGuests, setUseSimulatedGuests] = useState(false);
  const [simulatedGuests, setSimulatedGuests] = useState(event.estimatedGuests);

  const liveGuests = confirmedGuests > 0 ? confirmedGuests : event.estimatedGuests;
  const activeHeadcount = useSimulatedGuests ? simulatedGuests : liveGuests;
  const theme = getThemeById(event.selectedThemeId);
  const metrics = computeVenueMetrics(activeHeadcount, event.venueTableStyle);

  return (
    <div className="space-y-8">
      <section className="bg-white border border-[#EADCD6] rounded-xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-[#6E605A]">
            Real-Time Floor Plan &amp; Seating Simulator · {theme.name}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#231D1A]">
            Live Venue Setup Preview
          </h1>
          <p className="text-sm text-[#6E605A] max-w-2xl">
            Every table, seat buffer, and zone updates instantaneously as guest RSVPs confirm or as you test seating styles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setUseSimulatedGuests(false)}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors min-h-[40px] ${
              !useSimulatedGuests
                ? 'bg-[#E25845] text-white border-[#E25845]'
                : 'bg-[#FCF8F5] text-[#231D1A] border-[#EADCD6]'
            }`}
          >
            Live Count ({liveGuests} guests)
          </button>
          <button
            type="button"
            onClick={() => {
              setSimulatedGuests(liveGuests);
              setUseSimulatedGuests(true);
            }}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors min-h-[40px] ${
              useSimulatedGuests
                ? 'bg-[#231D1A] text-white border-[#231D1A]'
                : 'bg-[#FCF8F5] text-[#231D1A] border-[#EADCD6]'
            }`}
          >
            Test Capacity Slider
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Controls & Theme Look */}
        <aside className="space-y-6">
          <div className="bg-white border border-[#EADCD6] rounded-xl p-5 sm:p-6 space-y-5">
            <div>
              <label className="block text-xs font-medium text-[#6E605A] mb-1.5">
                Venue Name
              </label>
              <input
                type="text"
                value={event.venueName}
                onChange={(e) => onUpdateEvent({ venueName: e.target.value })}
                placeholder="e.g. Villa Magnolia Terrace"
                className="w-full h-11 px-3 text-sm bg-[#FCF8F5] border border-[#EADCD6] rounded-lg focus:outline-none focus:border-[#E25845]"
              />
            </div>

            {useSimulatedGuests && (
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-[#6E605A]">Test Guest Headcount</span>
                  <span className="font-mono-num font-semibold text-[#E25845]">
                    {simulatedGuests} guests
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={250}
                  value={simulatedGuests}
                  onChange={(e) => setSimulatedGuests(Number(e.target.value))}
                  className="w-full accent-[#E25845]"
                />
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-[#6E605A] mb-2">Seating Layout Style</p>
              <div className="grid grid-cols-2 gap-2">
                {TABLE_STYLES.map((style) => {
                  const active = event.venueTableStyle === style.id;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => onUpdateEvent({ venueTableStyle: style.id })}
                      className={`p-2.5 text-left rounded-lg border transition-colors ${
                        active
                          ? 'bg-[#FFF3EE] border-[#E25845] text-[#231D1A]'
                          : 'bg-[#FCF8F5] border-[#EADCD6] text-[#6E605A] hover:text-[#231D1A]'
                      }`}
                    >
                      <div className="text-xs font-semibold">{style.label}</div>
                      <div className="text-[11px] font-mono-num mt-0.5">{style.cap}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-[#6E605A] mb-2">Floral &amp; Centerpiece Density</p>
              <div className="grid grid-cols-3 gap-2">
                {(['minimal', 'balanced', 'lush'] as FloralDensity[]).map((density) => (
                  <button
                    key={density}
                    type="button"
                    onClick={() => onUpdateEvent({ floralDensity: density })}
                    className={`py-2 px-2 text-xs font-medium capitalize rounded-lg border transition-colors ${
                      event.floralDensity === density
                        ? 'bg-[#E25845] text-white border-[#E25845]'
                        : 'bg-[#FCF8F5] text-[#6E605A] border-[#EADCD6]'
                    }`}
                  >
                    {density}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-[#6E605A] mb-2">Interactive Floor Zones</p>
              <div className="space-y-2.5 text-sm">
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="text-xs text-[#231D1A]">Focal Stage / Head Table Arch</span>
                  <input
                    type="checkbox"
                    checked={event.showStage}
                    onChange={(e) => onUpdateEvent({ showStage: e.target.checked })}
                    className="accent-[#E25845] w-4 h-4"
                  />
                </label>
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="text-xs text-[#231D1A]">Dance Floor &amp; Lounge</span>
                  <input
                    type="checkbox"
                    checked={event.showDanceFloor}
                    onChange={(e) => onUpdateEvent({ showDanceFloor: e.target.checked })}
                    className="accent-[#E25845] w-4 h-4"
                  />
                </label>
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="text-xs text-[#231D1A]">Catering &amp; Bar Station</span>
                  <input
                    type="checkbox"
                    checked={event.showBuffet}
                    onChange={(e) => onUpdateEvent({ showBuffet: e.target.checked })}
                    className="accent-[#E25845] w-4 h-4"
                  />
                </label>
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="text-xs text-[#231D1A]">Photo Backdrop Vignette</span>
                  <input
                    type="checkbox"
                    checked={event.showPhotoBooth}
                    onChange={(e) => onUpdateEvent({ showPhotoBooth: e.target.checked })}
                    className="accent-[#E25845] w-4 h-4"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Reference Photo Preview */}
          <div className="bg-white border border-[#EADCD6] rounded-xl overflow-hidden">
            <div className="aspect-[4/3] bg-[#FAF1EC]">
              <img
                src={theme.imageUrl}
                alt={theme.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 space-y-1">
              <p className="text-xs text-[#6E605A]">Visual Mood · {theme.lightingMood}</p>
              <p className="text-sm font-semibold text-[#231D1A]">{theme.name}</p>
            </div>
          </div>
        </aside>

        {/* Live Floor Plan Canvas & Spatial Telemetry */}
        <section className="xl:col-span-2 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-[#EADCD6] rounded-xl p-4">
              <p className="text-[11px] text-[#6E605A]">Tables / Rows Needed</p>
              <p className="text-xl font-semibold font-mono-num text-[#231D1A] mt-1">
                {metrics.tablesNeeded}
              </p>
            </div>
            <div className="bg-white border border-[#EADCD6] rounded-xl p-4">
              <p className="text-[11px] text-[#6E605A]">Total Seats Placed</p>
              <p className="text-xl font-semibold font-mono-num text-[#231D1A] mt-1">
                {metrics.totalSeats}
              </p>
            </div>
            <div className="bg-white border border-[#EADCD6] rounded-xl p-4">
              <p className="text-[11px] text-[#6E605A]">Buffer Seats</p>
              <p className="text-xl font-semibold font-mono-num text-[#231D1A] mt-1">
                +{metrics.emptyBufferSeats}
              </p>
            </div>
            <div className="bg-[#FFF3EE] border border-[#EADCD6] rounded-xl p-4">
              <p className="text-[11px] text-[#6E605A]">Spatial Comfort</p>
              <p className="text-xs font-semibold text-[#231D1A] mt-1.5">
                {metrics.comfortLabel}
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#EADCD6] rounded-xl p-4 sm:p-5">
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
          </div>
        </section>
      </div>
    </div>
  );
}
