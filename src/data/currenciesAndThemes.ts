import type {
  AssistantSuggestedItem,
  BudgetItem,
  CelebrationEvent,
  CelebrationTheme,
  CurrencyCode,
  CurrencyConfig,
  EventType,
  GuestRsvp,
  ThemeId,
} from '../types/planner';

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    countryLabel: 'United States',
    locale: 'en-US',
    usdRate: 1,
    decimals: 0,
    sampleWeddingBudget: 28000,
    sampleBirthdayBudget: 4500,
    sampleCorporateBudget: 18000,
    sampleShowerBudget: 2600,
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    countryLabel: 'India',
    locale: 'en-IN',
    usdRate: 84,
    decimals: 0,
    sampleWeddingBudget: 1500000,
    sampleBirthdayBudget: 180000,
    sampleCorporateBudget: 850000,
    sampleShowerBudget: 120000,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    countryLabel: 'European Union',
    locale: 'de-DE',
    usdRate: 0.92,
    decimals: 0,
    sampleWeddingBudget: 25000,
    sampleBirthdayBudget: 4000,
    sampleCorporateBudget: 16000,
    sampleShowerBudget: 2400,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    countryLabel: 'United Kingdom',
    locale: 'en-GB',
    usdRate: 0.79,
    decimals: 0,
    sampleWeddingBudget: 22000,
    sampleBirthdayBudget: 3500,
    sampleCorporateBudget: 14500,
    sampleShowerBudget: 2000,
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    countryLabel: 'Australia',
    locale: 'en-AU',
    usdRate: 1.52,
    decimals: 0,
    sampleWeddingBudget: 38000,
    sampleBirthdayBudget: 6000,
    sampleCorporateBudget: 24000,
    sampleShowerBudget: 3600,
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    countryLabel: 'Canada',
    locale: 'en-CA',
    usdRate: 1.38,
    decimals: 0,
    sampleWeddingBudget: 35000,
    sampleBirthdayBudget: 5500,
    sampleCorporateBudget: 22000,
    sampleShowerBudget: 3200,
  },
  AED: {
    code: 'AED',
    symbol: 'AED ',
    name: 'UAE Dirham',
    countryLabel: 'United Arab Emirates',
    locale: 'en-AE',
    usdRate: 3.67,
    decimals: 0,
    sampleWeddingBudget: 95000,
    sampleBirthdayBudget: 16000,
    sampleCorporateBudget: 65000,
    sampleShowerBudget: 9000,
  },
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    countryLabel: 'Singapore',
    locale: 'en-SG',
    usdRate: 1.34,
    decimals: 0,
    sampleWeddingBudget: 36000,
    sampleBirthdayBudget: 5800,
    sampleCorporateBudget: 24000,
    sampleShowerBudget: 3400,
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    countryLabel: 'Japan',
    locale: 'ja-JP',
    usdRate: 152,
    decimals: 0,
    sampleWeddingBudget: 3800000,
    sampleBirthdayBudget: 550000,
    sampleCorporateBudget: 2400000,
    sampleShowerBudget: 360000,
  },
};

export const CURRENCY_LIST: CurrencyConfig[] = Object.values(CURRENCIES);

export function formatMoney(amount: number, currencyCode: CurrencyCode): string {
  const cfg = CURRENCIES[currencyCode] ?? CURRENCIES.USD;
  const safeVal = Number.isFinite(amount) ? Math.round(amount) : 0;
  try {
    return new Intl.NumberFormat(cfg.locale, {
      style: 'currency',
      currency: cfg.code,
      maximumFractionDigits: cfg.decimals,
      minimumFractionDigits: cfg.decimals,
    }).format(safeVal);
  } catch {
    return `${cfg.symbol}${safeVal.toLocaleString()}`;
  }
}

export function convertCurrencyAmount(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): number {
  if (fromCurrency === toCurrency) return amount;
  const fromRate = CURRENCIES[fromCurrency]?.usdRate || 1;
  const toRate = CURRENCIES[toCurrency]?.usdRate || 1;
  const inUsd = amount / fromRate;
  const raw = inUsd * toRate;
  if (raw >= 100000) return Math.round(raw / 1000) * 1000;
  if (raw >= 10000) return Math.round(raw / 500) * 500;
  if (raw >= 1000) return Math.round(raw / 50) * 50;
  return Math.round(raw);
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  wedding: 'Wedding',
  birthday: 'Milestone Birthday',
  corporate: 'Corporate Gala',
  shower: 'Baby / Bridal Shower',
  custom: 'Custom Celebration',
};

export const CELEBRATION_THEMES: CelebrationTheme[] = [
  {
    id: 'botanical_brunch',
    name: 'Botanical Conservatory Brunch',
    subtitle: 'Sunlit glasshouse tables with petite wildflower bud vases and warm wood seating',
    tier: 'budget_friendly',
    tierLabel: 'Budget-Smart Tier',
    idealEventTypes: ['shower', 'birthday', 'wedding', 'custom'],
    minUsdEquivalent: 0,
    maxUsdEquivalent: 12000,
    imageUrl: '/src/assets/images/theme_botanical_brunch_shower_1795346685636.jpg',
    palette: ['#FCF8F5', '#F6D5CB', '#E25845', '#5B7458'],
    paletteNames: ['Warm Cream', 'Soft Blush', 'Terracotta Coral', 'Sage Stem'],
    decorHighlights: [
      'Recycled glass bud vases reduce floral stem costs by up to 45%',
      'Natural daylight eliminates paid evening lighting rigging',
      'Shared wooden farm tables skip full floor-length linen rentals',
    ],
    recommendedTableStyle: 'imperial',
    recommendedFloralDensity: 'minimal',
    lightingMood: 'Morning & midday natural skylight',
  },
  {
    id: 'sunset_courtyard',
    name: 'Coral Courtyard Lounge',
    subtitle: 'Open-air twilight seating with coral cushions, dessert arch, and woven lanterns',
    tier: 'budget_friendly',
    tierLabel: 'Value & Social Tier',
    idealEventTypes: ['birthday', 'custom', 'shower', 'wedding'],
    minUsdEquivalent: 3000,
    maxUsdEquivalent: 22000,
    imageUrl: '/src/assets/images/theme_sunset_courtyard_birthday_1795346684858.jpg',
    palette: ['#FFF3EE', '#E25845', '#D99B78', '#2C2420'],
    paletteNames: ['Porcelain Blush', 'Celebration Coral', 'Sandstone', 'Espresso'],
    decorHighlights: [
      'One focal floral arch frames cake, photos, and speeches simultaneously',
      'Lounge vignettes require fewer formal chairs and charger plates',
      'Warm string bistro lights provide full ambiance on a modest budget',
    ],
    recommendedTableStyle: 'cocktail',
    recommendedFloralDensity: 'balanced',
    lightingMood: 'Golden dusk & warm amber pendants',
  },
  {
    id: 'garden_blush',
    name: 'Romantic Garden Terrace',
    subtitle: 'Classic round banquet tables dressed in cream linen with blush & coral roses',
    tier: 'balanced',
    tierLabel: 'Balanced Signature Tier',
    idealEventTypes: ['wedding', 'shower', 'custom'],
    minUsdEquivalent: 12000,
    maxUsdEquivalent: 40000,
    imageUrl: '/src/assets/images/theme_garden_blush_wedding_1795346684753.jpg',
    palette: ['#FFFDF9', '#F5C6BC', '#E25845', '#687A61'],
    paletteNames: ['Ivory Linen', 'Rosewater', 'Coral Peony', 'Olive Leaf'],
    decorHighlights: [
      'Low compote centerpieces keep table sightlines open for conversation',
      'Round 8-seat tables optimize outdoor terrace traffic flow',
      'Overhead festoon lights anchor the dance floor naturally after sunset',
    ],
    recommendedTableStyle: 'round',
    recommendedFloralDensity: 'balanced',
    lightingMood: 'Golden hour transitioning to bistro string lights',
  },
  {
    id: 'minimalist_loft',
    name: 'Sunlit Modern Loft',
    subtitle: 'Architectural oak & steel room with sculptural coral florals and clean stage wall',
    tier: 'balanced',
    tierLabel: 'Modern Editorial Tier',
    idealEventTypes: ['corporate', 'wedding', 'birthday'],
    minUsdEquivalent: 14000,
    maxUsdEquivalent: 45000,
    imageUrl: '/src/assets/images/theme_minimalist_loft_corporate_1795346685087.jpg',
    palette: ['#FAF7F4', '#E8806A', '#C9B199', '#231D1A'],
    paletteNames: ['Gallery White', 'Sculptural Coral', 'Warm Oak', 'Charcoal'],
    decorHighlights: [
      'Architectural timber backdrop serves as a ready-made stage & AV screen wall',
      'Ikebana-style sculptural stems deliver high visual impact with fewer blooms',
      'Modular rectangular tables transition smoothly from keynote to dinner',
    ],
    recommendedTableStyle: 'imperial',
    recommendedFloralDensity: 'minimal',
    lightingMood: 'Crisp architectural daylight & warm stage uplights',
  },
  {
    id: 'grand_ballroom',
    name: 'Grand Candlelight Ballroom',
    subtitle: 'Long feasting tables with cascading coral floral runners and tall glass tapers',
    tier: 'luxury',
    tierLabel: 'Grand Luxe Tier',
    idealEventTypes: ['wedding', 'corporate', 'custom'],
    minUsdEquivalent: 35000,
    maxUsdEquivalent: null,
    imageUrl: '/src/assets/images/theme_grand_ballroom_gala_1795346685346.jpg',
    palette: ['#FFFBF6', '#E57A67', '#C8A464', '#29201C'],
    paletteNames: ['Silk Ivory', 'Sunset Coral', 'Champagne Brass', 'Mahogany'],
    decorHighlights: [
      'Continuous floral garlands create dramatic focal length down imperial tables',
      'Layered glass hurricane candles elevate ballroom warmth and reflection',
      'Dedicated draped sweetheart stage anchors photography and toasts',
    ],
    recommendedTableStyle: 'imperial',
    recommendedFloralDensity: 'lush',
    lightingMood: 'Chandelier glow & warm candlelight tapers',
  },
];

export function suggestThemeForBudget(
  totalBudget: number,
  currencyCode: CurrencyCode,
  eventType: EventType
): CelebrationTheme {
  const usdEquivalent = totalBudget / (CURRENCIES[currencyCode]?.usdRate || 1);

  if (eventType === 'corporate') {
    return usdEquivalent >= 38000
      ? CELEBRATION_THEMES.find((t) => t.id === 'grand_ballroom')!
      : CELEBRATION_THEMES.find((t) => t.id === 'minimalist_loft')!;
  }
  if (eventType === 'birthday') {
    if (usdEquivalent < 3500) return CELEBRATION_THEMES.find((t) => t.id === 'botanical_brunch')!;
    if (usdEquivalent >= 35000) return CELEBRATION_THEMES.find((t) => t.id === 'grand_ballroom')!;
    return CELEBRATION_THEMES.find((t) => t.id === 'sunset_courtyard')!;
  }
  if (eventType === 'shower') {
    return usdEquivalent >= 15000
      ? CELEBRATION_THEMES.find((t) => t.id === 'garden_blush')!
      : CELEBRATION_THEMES.find((t) => t.id === 'botanical_brunch')!;
  }

  // Wedding / Custom
  if (usdEquivalent < 10000) return CELEBRATION_THEMES.find((t) => t.id === 'botanical_brunch')!;
  if (usdEquivalent < 16000) return CELEBRATION_THEMES.find((t) => t.id === 'sunset_courtyard')!;
  if (usdEquivalent < 38000) return CELEBRATION_THEMES.find((t) => t.id === 'garden_blush')!;
  return CELEBRATION_THEMES.find((t) => t.id === 'grand_ballroom')!;
}

export function buildRecommendedBudgetBreakdown(
  eventType: EventType,
  totalBudget: number,
  guestCount: number
): AssistantSuggestedItem[] {
  const safeBudget = Math.max(100, Math.round(totalBudget));
  const safeGuests = Math.max(1, Math.round(guestCount));

  const templates: Record<
    EventType,
    Array<{ category: string; title: string; ratio: number; pricingMode: 'fixed' | 'per_guest'; notes: string }>
  > = {
    wedding: [
      { category: 'Venue', title: 'Ceremony & Reception Venue Rental', ratio: 0.28, pricingMode: 'fixed', notes: 'Includes tables, chairs, and setup window' },
      { category: 'Catering', title: 'Plated / Buffet Dinner Service', ratio: 0.26, pricingMode: 'per_guest', notes: 'Auto-scales with confirmed attending RSVPs' },
      { category: 'Beverages', title: 'Welcome Drinks & Bar Package', ratio: 0.09, pricingMode: 'per_guest', notes: 'Signature coral spritz + non-alcoholic pairings' },
      { category: 'Photography', title: 'Photography & Highlight Film', ratio: 0.12, pricingMode: 'fixed', notes: '8 hours coverage with digital gallery' },
      { category: 'Decor & Florals', title: 'Floral Centerpieces, Arch & Linens', ratio: 0.12, pricingMode: 'fixed', notes: 'Repurpose ceremony florals for reception tables' },
      { category: 'Entertainment', title: 'Live DJ / Acoustic Quartet & Sound', ratio: 0.07, pricingMode: 'fixed', notes: 'Ceremony audio + reception dance floor lighting' },
      { category: 'Stationery & Favors', title: 'Invitations, Menus & Guest Keepsakes', ratio: 0.06, pricingMode: 'per_guest', notes: 'Digital RSVP link saves on return postage' },
    ],
    birthday: [
      { category: 'Venue', title: 'Private Courtyard / Lounge Hire', ratio: 0.24, pricingMode: 'fixed', notes: 'Evening buyout or semi-private terrace' },
      { category: 'Catering', title: 'Grazing Table, Dinner & Birthday Cake', ratio: 0.34, pricingMode: 'per_guest', notes: 'Auto-scales with confirmed attending guests' },
      { category: 'Beverages', title: 'Hosted Bar & Mocktail Station', ratio: 0.14, pricingMode: 'per_guest', notes: 'Curated 3-drink menu keeps bar spend predictable' },
      { category: 'Decor & Florals', title: 'Focal Backdrop Arch & Candlelight', ratio: 0.14, pricingMode: 'fixed', notes: 'Concentrate decor at cake & photo vignette' },
      { category: 'Entertainment', title: 'DJ / Playlist Sound & Photo Booth', ratio: 0.08, pricingMode: 'fixed', notes: 'Instant digital photo sharing' },
      { category: 'Photography', title: 'Candid Event Photographer (4 hrs)', ratio: 0.06, pricingMode: 'fixed', notes: 'Captures toasts and group portraits' },
    ],
    corporate: [
      { category: 'Venue & AV', title: 'Loft Hall, Stage & Projection Setup', ratio: 0.30, pricingMode: 'fixed', notes: 'Includes wireless mics and ambient uplighting' },
      { category: 'Catering', title: 'Executive Dinner & Passed Canapes', ratio: 0.32, pricingMode: 'per_guest', notes: 'Tracks dietary counts from live RSVPs' },
      { category: 'Beverages', title: 'Networking Reception Drinks', ratio: 0.12, pricingMode: 'per_guest', notes: '2-hour hosted reception window' },
      { category: 'Decor & Branding', title: 'Stage Florals & Signage', ratio: 0.11, pricingMode: 'fixed', notes: 'Minimalist sculptural centerpieces' },
      { category: 'Photography', title: 'Corporate Event & Keynote Coverage', ratio: 0.08, pricingMode: 'fixed', notes: 'Same-week press & social deliverables' },
      { category: 'Guest Experience', title: 'Program Print & Speaker Gifts', ratio: 0.07, pricingMode: 'per_guest', notes: 'Digital schedule reduces print waste' },
    ],
    shower: [
      { category: 'Venue', title: 'Conservatory / Sunlit Brunch Room', ratio: 0.25, pricingMode: 'fixed', notes: 'Daytime block pricing saves up to 35%' },
      { category: 'Catering', title: 'Brunch Menu, Pastries & Tiered Cake', ratio: 0.35, pricingMode: 'per_guest', notes: 'Auto-scales with confirmed RSVPs' },
      { category: 'Beverages', title: 'Mimosa, Tea & Botanical Spritz Bar', ratio: 0.12, pricingMode: 'per_guest', notes: 'Self-serve carafe bar cuts staffing fees' },
      { category: 'Decor & Florals', title: 'Bud Vases, Runners & Welcome Sign', ratio: 0.15, pricingMode: 'fixed', notes: 'Mixed bud vases act as take-home favors' },
      { category: 'Games & Keepsakes', title: 'Activity Cards & Guest Favors', ratio: 0.07, pricingMode: 'per_guest', notes: 'Printed keepsake recipe or wish cards' },
      { category: 'Photography', title: 'Portrait & Table Detail Coverage', ratio: 0.06, pricingMode: 'fixed', notes: '2-3 hours during peak brunch light' },
    ],
    custom: [
      { category: 'Venue', title: 'Celebration Space & Rentals', ratio: 0.28, pricingMode: 'fixed', notes: 'Base venue, tables, and seating' },
      { category: 'Catering', title: 'Main Dining & Dessert Service', ratio: 0.30, pricingMode: 'per_guest', notes: 'Updates automatically from RSVPs' },
      { category: 'Beverages', title: 'Refreshments & Toast Package', ratio: 0.11, pricingMode: 'per_guest', notes: 'Consumption-capped drink service' },
      { category: 'Decor & Florals', title: 'Theme Styling & Table Centerpieces', ratio: 0.14, pricingMode: 'fixed', notes: 'Focused on main focal backdrop' },
      { category: 'Entertainment', title: 'Music, Host & Lighting', ratio: 0.09, pricingMode: 'fixed', notes: 'Core sound and mood lighting' },
      { category: 'Photography', title: 'Event Photography & Keepsakes', ratio: 0.08, pricingMode: 'fixed', notes: 'Digital gallery + guest favors' },
    ],
  };

  const rows = templates[eventType] ?? templates.wedding;
  let runningTotal = 0;

  return rows.map((row, idx) => {
    const isLast = idx === rows.length - 1;
    const allocated = isLast
      ? Math.max(0, safeBudget - runningTotal)
      : Math.round(safeBudget * row.ratio);
    runningTotal += allocated;

    const unitCost =
      row.pricingMode === 'per_guest'
        ? Math.max(1, Math.round(allocated / safeGuests))
        : allocated;

    return {
      category: row.category,
      title: row.title,
      pricingMode: row.pricingMode,
      unitCost,
      allocatedAmount: row.pricingMode === 'per_guest' ? unitCost * safeGuests : allocated,
      notes: row.notes,
    };
  });
}

export function generateCostSavingTips(
  eventType: EventType,
  totalBudget: number,
  currencyCode: CurrencyCode,
  guestCount: number
): string[] {
  const usdEquivalent = totalBudget / (CURRENCIES[currencyCode]?.usdRate || 1);
  const perGuestFormatted = formatMoney(Math.round(totalBudget / Math.max(1, guestCount)), currencyCode);

  const tips: string[] = [
    `Your current target averages ${perGuestFormatted} per guest across ${guestCount} guests—trimming 10% of non-attending buffers using live RSVPs prevents over-ordering catering plates.`,
  ];

  if (eventType === 'wedding') {
    tips.push(
      'Repurpose ceremony arch & aisle florals directly behind the sweetheart table and cake display to save 20–30% on total floral spend.'
    );
    tips.push(
      'Use digital shareable RSVP links and table QR menus instead of multi-insert mailed stationery to cut printing and postage costs.'
    );
  } else if (eventType === 'birthday') {
    tips.push(
      'Choose a signature 2-cocktail + mocktail menu instead of an open full-shelf bar to keep beverage costs 25% lower.'
    );
  } else if (eventType === 'corporate') {
    tips.push(
      'Select a sunlit loft with built-in timber stage walls and house AV to avoid external staging and pipe-and-drape rigging fees.'
    );
  } else {
    tips.push(
      'Host a daytime brunch or afternoon tea block—venues often discount off-peak daytime rentals by 25–35%.'
    );
  }

  if (usdEquivalent < 15000) {
    tips.push(
      'Cluster petite bud vases with seasonal greenery and pillar candles along table runners instead of tall full-foam arrangements for maximum impact at lower cost.'
    );
    tips.push(
      'Book a single 4–5 hour photography window covering arrival, key speeches, and cake cutting rather than full-day retainers.'
    );
  } else {
    tips.push(
      'Lock in a flat per-person catering package tied to final RSVP headcount 7 days prior, and negotiate waived cake-cutting or corkage fees upfront.'
    );
    tips.push(
      'Opt for mixed round and imperial tables to reduce specialty linen count while keeping dramatic focal sightlines.'
    );
  }

  return tips.slice(0, 5);
}

export function createSampleEventData(): {
  event: CelebrationEvent;
  budgetItems: BudgetItem[];
  rsvps: GuestRsvp[];
} {
  const eventId = 'sample_blush_wedding';
  const defaultBudget = 28000;
  const defaultGuests = 85;
  const theme = suggestThemeForBudget(defaultBudget, 'USD', 'wedding');

  const event: CelebrationEvent = {
    id: eventId,
    ownerId: 'demo_organizer',
    title: 'Elena & Marcus Garden Wedding',
    hostName: 'Elena & Marcus',
    eventType: 'wedding',
    eventDate: '2027-05-15',
    venueName: 'Villa Magnolia Terrace',
    dressCode: 'Garden Cocktail Attire',
    currencyCode: 'USD',
    totalBudget: defaultBudget,
    estimatedGuests: defaultGuests,
    selectedThemeId: theme.id,
    venueTableStyle: 'round',
    showStage: true,
    showDanceFloor: true,
    showBuffet: true,
    showPhotoBooth: true,
    floralDensity: 'balanced',
    isPublicRsvp: true,
    costSavingTips: generateCostSavingTips('wedding', defaultBudget, 'USD', defaultGuests),
  };

  const breakdown = buildRecommendedBudgetBreakdown('wedding', defaultBudget, defaultGuests);
  const budgetItems: BudgetItem[] = breakdown.map((item, idx) => ({
    id: `sample_item_${idx + 1}`,
    eventId,
    ownerId: 'demo_organizer',
    category: item.category,
    title: item.title,
    pricingMode: item.pricingMode,
    unitCost: item.unitCost,
    allocatedAmount: item.allocatedAmount,
    actualSpent: idx === 0 ? Math.round(item.allocatedAmount * 0.5) : idx === 3 ? Math.round(item.allocatedAmount * 0.4) : 0,
    notes: item.notes,
  }));

  const rsvps: GuestRsvp[] = [
    {
      id: 'sample_rsvp_1',
      eventId,
      ownerId: 'demo_organizer',
      guestName: 'Priya & Arjun Mehta',
      guestEmail: 'priya.mehta@example.com',
      status: 'attending',
      partySize: 2,
      mealChoice: 'Herb Roasted Sea Bass',
      dietaryNotes: 'No shellfish',
      source: 'public_link',
    },
    {
      id: 'sample_rsvp_2',
      eventId,
      ownerId: 'demo_organizer',
      guestName: 'Clara & Thomas Lin',
      guestEmail: 'clara.lin@example.com',
      status: 'attending',
      partySize: 2,
      mealChoice: 'Wild Mushroom Risotto (Vegan)',
      dietaryNotes: 'Vegan, dairy-free',
      source: 'public_link',
    },
    {
      id: 'sample_rsvp_3',
      eventId,
      ownerId: 'demo_organizer',
      guestName: 'Daniel Okafor',
      guestEmail: 'd.okafor@example.com',
      status: 'attending',
      partySize: 1,
      mealChoice: 'Charred Herb Chicken',
      dietaryNotes: 'None',
      source: 'public_link',
    },
    {
      id: 'sample_rsvp_4',
      eventId,
      ownerId: 'demo_organizer',
      guestName: 'Sofia Rossi Family',
      guestEmail: 'sofia.rossi@example.com',
      status: 'attending',
      partySize: 4,
      mealChoice: 'Herb Roasted Sea Bass',
      dietaryNotes: '1 kids meal',
      source: 'organizer',
    },
    {
      id: 'sample_rsvp_5',
      eventId,
      ownerId: 'demo_organizer',
      guestName: 'Liam & Hannah Brooks',
      guestEmail: 'hannah.b@example.com',
      status: 'pending',
      partySize: 2,
      mealChoice: 'Undecided',
      dietaryNotes: 'Gluten-free option requested',
      source: 'organizer',
    },
    {
      id: 'sample_rsvp_6',
      eventId,
      ownerId: 'demo_organizer',
      guestName: 'Nadia Al-Mansoor',
      guestEmail: 'nadia.m@example.com',
      status: 'declined',
      partySize: 1,
      mealChoice: 'None',
      dietaryNotes: 'Sending warm wishes from Dubai',
      source: 'public_link',
    },
  ];

  return { event, budgetItems, rsvps };
}

export function getThemeById(id: ThemeId): CelebrationTheme {
  return CELEBRATION_THEMES.find((t) => t.id === id) ?? CELEBRATION_THEMES[2];
}
