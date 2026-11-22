export type EventType = 'wedding' | 'birthday' | 'corporate' | 'shower' | 'custom';

export type CurrencyCode = 'USD' | 'INR' | 'EUR' | 'GBP' | 'AUD' | 'CAD' | 'AED' | 'SGD' | 'JPY';

export type PricingMode = 'fixed' | 'per_guest';

export type VenueTableStyle = 'round' | 'imperial' | 'cocktail' | 'theater';

export type FloralDensity = 'minimal' | 'balanced' | 'lush';

export type RsvpStatus = 'attending' | 'declined' | 'pending';

export type ThemeId =
  | 'garden_blush'
  | 'grand_ballroom'
  | 'sunset_courtyard'
  | 'minimalist_loft'
  | 'botanical_brunch';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  countryLabel: string;
  locale: string;
  usdRate: number;
  decimals: number;
  sampleWeddingBudget: number;
  sampleBirthdayBudget: number;
  sampleCorporateBudget: number;
  sampleShowerBudget: number;
}

export interface CelebrationTheme {
  id: ThemeId;
  name: string;
  subtitle: string;
  tier: 'budget_friendly' | 'balanced' | 'luxury';
  tierLabel: string;
  idealEventTypes: EventType[];
  minUsdEquivalent: number;
  maxUsdEquivalent: number | null;
  imageUrl: string;
  palette: [string, string, string, string];
  paletteNames: string[];
  decorHighlights: string[];
  recommendedTableStyle: VenueTableStyle;
  recommendedFloralDensity: FloralDensity;
  lightingMood: string;
}

export interface CelebrationEvent {
  id: string;
  ownerId: string;
  title: string;
  hostName: string;
  eventType: EventType;
  eventDate: string;
  venueName: string;
  dressCode: string;
  currencyCode: CurrencyCode;
  totalBudget: number;
  estimatedGuests: number;
  selectedThemeId: ThemeId;
  venueTableStyle: VenueTableStyle;
  showStage: boolean;
  showDanceFloor: boolean;
  showBuffet: boolean;
  showPhotoBooth: boolean;
  floralDensity: FloralDensity;
  isPublicRsvp: boolean;
  costSavingTips: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface BudgetItem {
  id: string;
  eventId: string;
  ownerId: string;
  category: string;
  title: string;
  pricingMode: PricingMode;
  unitCost: number;
  allocatedAmount: number;
  actualSpent: number;
  notes: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface GuestRsvp {
  id: string;
  eventId: string;
  ownerId: string;
  guestName: string;
  guestEmail: string;
  status: RsvpStatus;
  partySize: number;
  mealChoice: string;
  dietaryNotes: string;
  source: 'public_link' | 'organizer';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AssistantSuggestedItem {
  category: string;
  title: string;
  pricingMode: PricingMode;
  unitCost: number;
  allocatedAmount: number;
  notes: string;
}

export interface AssistantResponse {
  reply: string;
  detectedEventType: EventType;
  shouldApplyBudget: boolean;
  recommendedTotalBudget: number;
  recommendedGuests: number;
  recommendedThemeId: ThemeId;
  budgetBreakdown: AssistantSuggestedItem[];
  costSavingTips: string[];
}

export const FIELD_LIMITS = {
  TITLE_MAX: 140,
  HOST_MAX: 100,
  VENUE_MAX: 140,
  DRESS_CODE_MAX: 80,
  CATEGORY_MAX: 60,
  ITEM_TITLE_MAX: 120,
  NOTES_MAX: 300,
  GUEST_NAME_MAX: 100,
  GUEST_EMAIL_MAX: 140,
  MEAL_MAX: 60,
  DIETARY_MAX: 240,
  TIP_MAX: 280,
  TIPS_ARRAY_MAX: 10,
} as const;
