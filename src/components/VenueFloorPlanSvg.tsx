import type { FloralDensity, VenueTableStyle } from '../types/planner';

interface VenueFloorPlanSvgProps {
  guestCount: number;
  tableStyle: VenueTableStyle;
  showStage: boolean;
  showDanceFloor: boolean;
  showBuffet: boolean;
  showPhotoBooth: boolean;
  floralDensity: FloralDensity;
  palette: [string, string, string, string];
  venueName: string;
}

export function computeVenueMetrics(guestCount: number, tableStyle: VenueTableStyle) {
  const safeGuests = Math.max(1, Math.round(guestCount));
  const seatsPerUnit =
    tableStyle === 'round'
      ? 8
      : tableStyle === 'imperial'
      ? 12
      : tableStyle === 'cocktail'
      ? 4
      : 10;
  const tablesNeeded = Math.max(1, Math.ceil(safeGuests / seatsPerUnit));
  const totalSeats = tablesNeeded * seatsPerUnit;
  const emptyBufferSeats = totalSeats - safeGuests;
  const maxComfortTables = tableStyle === 'cocktail' ? 24 : tableStyle === 'theater' ? 16 : 16;
  const utilizationPct = Math.min(100, Math.round((tablesNeeded / maxComfortTables) * 100));

  let comfortLabel = 'Airy & Spacious';
  if (utilizationPct > 85) comfortLabel = 'High Density (Upgrade Hall Recommended)';
  else if (utilizationPct > 65) comfortLabel = 'Full & Energetic';

  return {
    seatsPerUnit,
    tablesNeeded,
    totalSeats,
    emptyBufferSeats,
    utilizationPct,
    comfortLabel,
  };
}

export function VenueFloorPlanSvg({
  guestCount,
  tableStyle,
  showStage,
  showDanceFloor,
  showBuffet,
  showPhotoBooth,
  floralDensity,
  palette,
  venueName,
}: VenueFloorPlanSvgProps) {
  const [, blushColor, accentCoral, botanicalGreen] = palette;
  const { tablesNeeded, seatsPerUnit } = computeVenueMetrics(guestCount, tableStyle);

  // Clamp visible table glyphs cleanly to 16 grid cells while labeling actual count if larger
  const visibleTables = Math.min(tablesNeeded, 16);
  const cols = visibleTables <= 4 ? 2 : visibleTables <= 9 ? 3 : 4;
  const rows = Math.ceil(visibleTables / cols);

  const areaLeft = 90;
  const areaRight = 610;
  const areaTop = showStage ? 128 : 66;
  const areaBottom = showDanceFloor ? 335 : 420;
  const areaW = areaRight - areaLeft;
  const areaH = areaBottom - areaTop;

  const cellW = areaW / cols;
  const cellH = areaH / rows;

  const floralRadius = floralDensity === 'lush' ? 8 : floralDensity === 'balanced' ? 5.5 : 3.5;

  return (
    <svg
      viewBox="0 0 760 500"
      className="w-full h-auto rounded-lg border border-[#EADCD6] bg-[#FFFDF9]"
      role="img"
      aria-label={`Live architectural floor plan for ${venueName || 'Venue'} configured for ${guestCount} guests`}
    >
      {/* Subtle architectural grid */}
      <defs>
        <pattern id="venueGrid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#F4EAE4" strokeWidth="1" />
        </pattern>
      </defs>
      <rect x="20" y="20" width="720" height="460" rx="12" fill="url(#venueGrid)" stroke="#DFCFC7" strokeWidth="2" />

      {/* Entrance Indicator */}
      <g transform="translate(335, 470)">
        <rect x="0" y="-8" width="90" height="18" rx="4" fill="#FCF8F5" stroke="#D8C6BE" strokeWidth="1" />
        <text x="45" y="4" textAnchor="middle" fontSize="9.5" fill="#6E605A" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="600">
          MAIN ENTRY
        </text>
      </g>

      {/* Stage / Focal Backdrop */}
      {showStage && (
        <g>
          <rect
            x="220"
            y="36"
            width="320"
            height="58"
            rx="8"
            fill={blushColor}
            fillOpacity="0.45"
            stroke={accentCoral}
            strokeWidth="1.5"
          />
          <text
            x="380"
            y="62"
            textAnchor="middle"
            fontSize="12"
            fontWeight="600"
            fill="#231D1A"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            Focal Stage / Head Table &amp; Floral Arch
          </text>
          <text
            x="380"
            y="78"
            textAnchor="middle"
            fontSize="10"
            fill="#6E605A"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            {floralDensity === 'lush'
              ? 'Full cascading floral backdrop'
              : floralDensity === 'balanced'
              ? 'Asymmetric floral arch + uplights'
              : 'Clean architectural backdrop'}
          </text>
        </g>
      )}

      {/* Buffet / Bar Station */}
      {showBuffet && (
        <g>
          <rect
            x="635"
            y="100"
            width="76"
            height="190"
            rx="8"
            fill="#FFF3EE"
            stroke="#DFCFC7"
            strokeWidth="1.5"
          />
          <text
            x="673"
            y="192"
            textAnchor="middle"
            fontSize="10.5"
            fontWeight="600"
            fill="#231D1A"
            transform="rotate(-90 673 192)"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            Catering &amp; Bar Station
          </text>
        </g>
      )}

      {/* Photo Lounge Vignette */}
      {showPhotoBooth && (
        <g>
          <rect
            x="635"
            y="315"
            width="76"
            height="120"
            rx="8"
            fill={blushColor}
            fillOpacity="0.35"
            stroke={accentCoral}
            strokeDasharray="4 3"
            strokeWidth="1.25"
          />
          <text
            x="673"
            y="372"
            textAnchor="middle"
            fontSize="10"
            fontWeight="600"
            fill="#231D1A"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            Photo
          </text>
          <text
            x="673"
            y="386"
            textAnchor="middle"
            fontSize="10"
            fontWeight="600"
            fill="#231D1A"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            Lounge
          </text>
        </g>
      )}

      {/* Seating Units */}
      {Array.from({ length: visibleTables }).map((_, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const cx = areaLeft + col * cellW + cellW / 2;
        const cy = areaTop + row * cellH + cellH / 2;

        if (tableStyle === 'round') {
          const r = Math.min(cellW, cellH) * 0.25;
          const chairOrbit = r + 7;
          return (
            <g key={idx}>
              {Array.from({ length: seatsPerUnit }).map((__, sIdx) => {
                const angle = (sIdx / seatsPerUnit) * Math.PI * 2;
                const sx = cx + Math.cos(angle) * chairOrbit;
                const sy = cy + Math.sin(angle) * chairOrbit;
                return <circle key={sIdx} cx={sx} cy={sy} r="3.2" fill="#D5C2B9" />;
              })}
              <circle cx={cx} cy={cy} r={r} fill="#FFFFFF" stroke="#BFA99E" strokeWidth="1.5" />
              <circle cx={cx} cy={cy} r={floralRadius} fill={accentCoral} fillOpacity="0.85" />
              <circle cx={cx + 3} cy={cy - 2} r={floralRadius * 0.55} fill={botanicalGreen} fillOpacity="0.7" />
              <text
                x={cx}
                y={cy + r + 17}
                textAnchor="middle"
                fontSize="9"
                fill="#6E605A"
                fontFamily="JetBrains Mono, monospace"
              >
                T{idx + 1}
              </text>
            </g>
          );
        }

        if (tableStyle === 'imperial') {
          const tw = Math.min(92, cellW * 0.72);
          const th = 22;
          return (
            <g key={idx}>
              {Array.from({ length: 6 }).map((__, sIdx) => {
                const sx = cx - tw / 2 + 8 + (sIdx * (tw - 16)) / 5;
                return (
                  <g key={sIdx}>
                    <circle cx={sx} cy={cy - th / 2 - 5} r="3" fill="#D5C2B9" />
                    <circle cx={sx} cy={cy + th / 2 + 5} r="3" fill="#D5C2B9" />
                  </g>
                );
              })}
              <rect
                x={cx - tw / 2}
                y={cy - th / 2}
                width={tw}
                height={th}
                rx="4"
                fill="#FFFFFF"
                stroke="#BFA99E"
                strokeWidth="1.5"
              />
              <line
                x1={cx - tw / 2 + 10}
                y1={cy}
                x2={cx + tw / 2 - 10}
                y2={cy}
                stroke={botanicalGreen}
                strokeWidth={floralDensity === 'lush' ? 4 : floralDensity === 'balanced' ? 2.5 : 1.5}
                strokeLinecap="round"
              />
              <circle cx={cx - 12} cy={cy} r={floralRadius * 0.7} fill={accentCoral} />
              <circle cx={cx + 12} cy={cy} r={floralRadius * 0.7} fill={accentCoral} />
              <text
                x={cx}
                y={cy + th / 2 + 16}
                textAnchor="middle"
                fontSize="9"
                fill="#6E605A"
                fontFamily="JetBrains Mono, monospace"
              >
                Long {idx + 1}
              </text>
            </g>
          );
        }

        if (tableStyle === 'cocktail') {
          const r = 13;
          return (
            <g key={idx}>
              {[0, 1, 2, 3].map((sIdx) => {
                const angle = (sIdx / 4) * Math.PI * 2 + Math.PI / 4;
                return (
                  <circle
                    key={sIdx}
                    cx={cx + Math.cos(angle) * (r + 7)}
                    cy={cy + Math.sin(angle) * (r + 7)}
                    r="3.2"
                    fill={blushColor}
                    stroke="#BFA99E"
                    strokeWidth="0.8"
                  />
                );
              })}
              <circle cx={cx} cy={cy} r={r} fill="#FFFFFF" stroke={accentCoral} strokeWidth="1.4" />
              <circle cx={cx} cy={cy} r={floralRadius * 0.65} fill={accentCoral} />
              <text
                x={cx}
                y={cy + r + 15}
                textAnchor="middle"
                fontSize="8.5"
                fill="#6E605A"
                fontFamily="JetBrains Mono, monospace"
              >
                Hi-Top {idx + 1}
              </text>
            </g>
          );
        }

        // Theater / Ceremony rows
        const rowW = Math.min(110, cellW * 0.8);
        return (
          <g key={idx}>
            <rect
              x={cx - rowW / 2}
              y={cy - 8}
              width={rowW}
              height={16}
              rx="3"
              fill="#FFFFFF"
              stroke="#BFA99E"
              strokeWidth="1.2"
            />
            {Array.from({ length: 5 }).map((__, cIdx) => (
              <rect
                key={cIdx}
                x={cx - rowW / 2 + 6 + cIdx * ((rowW - 18) / 4)}
                y={cy - 5}
                width="9"
                height="10"
                rx="2"
                fill={blushColor}
                stroke="#BFA99E"
                strokeWidth="0.7"
              />
            ))}
          </g>
        );
      })}

      {/* Dance Floor */}
      {showDanceFloor && (
        <g>
          <rect
            x="220"
            y="355"
            width="280"
            height="92"
            rx="10"
            fill="#FFF7F3"
            stroke={accentCoral}
            strokeWidth="1.5"
          />
          <line x1="220" y1="401" x2="500" y2="401" stroke="#F1DCD4" strokeWidth="1" />
          <line x1="360" y1="355" x2="360" y2="447" stroke="#F1DCD4" strokeWidth="1" />
          <text
            x="360"
            y="398"
            textAnchor="middle"
            fontSize="11.5"
            fontWeight="600"
            fill="#231D1A"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            Dance Floor &amp; Lounge
          </text>
          <text
            x="360"
            y="415"
            textAnchor="middle"
            fontSize="9.5"
            fill="#6E605A"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            Clear traffic perimeter maintained
          </text>
        </g>
      )}

      {/* Table overflow summary badge if >16 tables */}
      {tablesNeeded > 16 && (
        <g transform="translate(35, 442)">
          <rect x="0" y="0" width="165" height="24" rx="5" fill="#FFF3EE" stroke="#E25845" strokeWidth="1" />
          <text x="82" y="15.5" textAnchor="middle" fontSize="10" fontWeight="600" fill="#231D1A">
            Showing 16 of {tablesNeeded} total tables
          </text>
        </g>
      )}
    </svg>
  );
}
