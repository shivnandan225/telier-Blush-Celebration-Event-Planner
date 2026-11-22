import { Printer } from 'lucide-react';

export type WorkspaceTab = 'budget' | 'rsvps' | 'themes' | 'venue';

interface TopBarProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  onOpenPrintModal: () => void;
}

const NAV_ITEMS: Array<{ id: WorkspaceTab; label: string }> = [
  { id: 'budget', label: 'Budget' },
  { id: 'rsvps', label: 'Guest RSVPs' },
  { id: 'themes', label: 'Themes' },
  { id: 'venue', label: 'Venue Setup' },
];

export function TopBar({ activeTab, onSelectTab, onOpenPrintModal }: TopBarProps) {
  return (
    <header className="no-print sticky top-0 z-30 bg-[#FCF8F5]/95 backdrop-blur-sm border-b border-[#EADCD6]">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line brand wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('budget')}
          className="font-display text-xl font-semibold tracking-tight text-[#231D1A] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E25845] rounded"
        >
          Atelier Blush
        </button>

        {/* Zone 2: 4 concise single-line navigation links */}
        <nav aria-label="Primary workspace navigation" className="hidden md:flex items-center gap-7">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E25845] rounded ${
                  isActive
                    ? 'text-[#231D1A]'
                    : 'text-[#6E605A] hover:text-[#231D1A]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[17px] h-0.5 bg-[#E25845]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenPrintModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-[#E25845] hover:bg-[#C84432] rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[40px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E25845]"
          >
            <Printer className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Export / Print</span>
          </button>
        </div>
      </div>

      {/* Mobile compact secondary tab strip */}
      <nav
        aria-label="Mobile workspace navigation"
        className="md:hidden border-t border-[#EADCD6] bg-[#FFF8F5] px-3 flex items-center justify-between overflow-x-auto"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors min-h-[44px] ${
                isActive
                  ? 'border-[#E25845] text-[#231D1A]'
                  : 'border-transparent text-[#6E605A] hover:text-[#231D1A]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
