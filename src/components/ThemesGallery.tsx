import { Check } from 'lucide-react';
import {
  CELEBRATION_THEMES,
  CURRENCIES,
  formatMoney,
  suggestThemeForBudget,
} from '../data/currenciesAndThemes';
import type { CelebrationEvent, ThemeId } from '../types/planner';

interface ThemesGalleryProps {
  event: CelebrationEvent;
  confirmedGuests: number;
  onSelectTheme: (themeId: ThemeId) => void;
  onGoToVenuePreview: () => void;
}

export function ThemesGallery({
  event,
  confirmedGuests,
  onSelectTheme,
  onGoToVenuePreview,
}: ThemesGalleryProps) {
  const recommendedTheme = suggestThemeForBudget(
    event.totalBudget,
    event.currencyCode,
    event.eventType
  );
  const activeHeadcount = Math.max(1, confirmedGuests > 0 ? confirmedGuests : event.estimatedGuests);
  const rate = CURRENCIES[event.currencyCode]?.usdRate || 1;

  return (
    <div className="space-y-8">
      <section className="bg-white border border-[#EADCD6] rounded-xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-[#6E605A]">
            Visual Event Themes · Matched to {formatMoney(event.totalBudget, event.currencyCode)}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#231D1A]">
            Budget-Matched Setup Styles &amp; Photography
          </h1>
          <p className="text-sm text-[#6E605A] max-w-2xl">
            Preview realistic celebration aesthetics calibrated to your budget so you can verify the look before locking vendor deposits.
          </p>
        </div>

        <button
          type="button"
          onClick={onGoToVenuePreview}
          className="px-4 py-2.5 text-xs sm:text-sm font-medium text-white bg-[#E25845] hover:bg-[#C84432] rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[42px]"
        >
          Preview Selected Layout
        </button>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CELEBRATION_THEMES.map((theme) => {
          const isSelected = event.selectedThemeId === theme.id;
          const isBudgetMatch = recommendedTheme.id === theme.id;
          const typicalPerGuestLocal = Math.round(
            ((theme.minUsdEquivalent + (theme.maxUsdEquivalent ?? 45000)) / 2 / 100) * rate
          );

          return (
            <article
              key={theme.id}
              className={`bg-white rounded-xl overflow-hidden flex flex-col transition-colors ${
                isSelected
                  ? 'border-2 border-[#E25845]'
                  : 'border border-[#EADCD6] hover:border-[#D4B9AF]'
              }`}
            >
              <div className="aspect-[4/3] w-full bg-[#FAF1EC] relative overflow-hidden">
                <img
                  src={theme.imageUrl}
                  alt={theme.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="text-xs text-[#6E605A] flex flex-wrap items-center gap-2">
                    <span>{theme.tierLabel}</span>
                    {isBudgetMatch && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-[#E25845]">
                          Recommended for your budget
                        </span>
                      </>
                    )}
                  </div>

                  <h2 className="font-display text-xl font-semibold text-[#231D1A]">
                    {theme.name}
                  </h2>

                  <p className="text-xs text-[#6E605A] leading-relaxed">
                    {theme.subtitle}
                  </p>

                  {/* Swatches */}
                  <div className="flex items-center gap-2 pt-1">
                    {theme.palette.map((hex, idx) => (
                      <span
                        key={hex}
                        title={theme.paletteNames[idx]}
                        className="w-5 h-5 rounded-full border border-[#EADCD6]"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                    <span className="text-xs text-[#6E605A] font-mono-num ml-auto">
                      ~{formatMoney(typicalPerGuestLocal, event.currencyCode)}/guest est.
                    </span>
                  </div>

                  <ul className="pt-2 border-t border-[#EADCD6] space-y-1.5 text-xs text-[#3B312C]">
                    {theme.decorHighlights.map((hl, i) => (
                      <li key={i} className="leading-relaxed">
                        • {hl}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onSelectTheme(theme.id)}
                    className={`w-full h-11 px-4 text-xs sm:text-sm font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-2 ${
                      isSelected
                        ? 'bg-[#FFF3EE] text-[#E25845] border border-[#E25845]'
                        : 'bg-[#231D1A] text-white hover:bg-[#3B312C]'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-4 h-4" aria-hidden="true" />
                        <span>Active Theme ({activeHeadcount} Guests)</span>
                      </>
                    ) : (
                      <span>Select &amp; Preview Setup</span>
                    )}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
