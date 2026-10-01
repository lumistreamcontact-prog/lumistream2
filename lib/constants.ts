/**
 * Every "enum" in the Prisma schema is stored as a String and validated here,
 * which keeps the model portable and lets the admin add values without a
 * migration. This module is the single source of truth for the allowed values.
 */

export const ROLES = { USER: "user", ADMIN: "admin" } as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

export const SUBSCRIPTION_STATUS = {
  ACTIVE: "active",
  EXPIRED: "expired",
  PENDING: "pending",
  CANCELLED: "cancelled",
} as const;
export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
} as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const CONTENT_TYPES = {
  MOVIE: "movie",
  SERIES: "series",
  DOCUMENTARY: "documentary",
} as const;
export type ContentType = (typeof CONTENT_TYPES)[keyof typeof CONTENT_TYPES];

export const TICKET_STATUS = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
  CLOSED: "closed",
} as const;

export const TICKET_PRIORITY = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  URGENT: "urgent",
} as const;

/** Channel categories — also drives the category filter UI. */
export const CATEGORIES = [
  { value: "general", labelKey: "category.general" },
  { value: "news", labelKey: "category.news" },
  { value: "sports", labelKey: "category.sports" },
  { value: "movies", labelKey: "category.movies" },
  { value: "entertainment", labelKey: "category.entertainment" },
  { value: "kids", labelKey: "category.kids" },
  { value: "documentary", labelKey: "category.documentary" },
  { value: "music", labelKey: "category.music" },
  { value: "religion", labelKey: "category.religion" },
  { value: "education", labelKey: "category.education" },
] as const;

export const CATEGORY_VALUES = CATEGORIES.map((c) => c.value) as string[];

export const QUALITIES = ["4K", "FHD", "HD", "SD"] as const;

export const CURRENCIES = [
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "MAD", symbol: "DH", label: "Moroccan Dirham" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "CAD", symbol: "CA$", label: "Canadian Dollar" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export const CURRENCY_CODES = CURRENCIES.map((c) => c.code) as string[];

/** Languages the UI ships with out of the box (admin can add more). */
export const DEFAULT_LANGUAGES = [
  { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl", isDefault: true },
  { code: "en", name: "English", nativeName: "English", dir: "ltr", isDefault: false },
  { code: "fr", name: "French", nativeName: "Français", dir: "ltr", isDefault: false },
  { code: "es", name: "Spanish", nativeName: "Español", dir: "ltr", isDefault: false },
] as const;

export const FALLBACK_LOCALE = "ar";

/** Languages we have a translation bundle for. */
export const BUNDLED_LOCALES = ["ar", "en", "fr", "es"] as const;
export type Locale = (typeof BUNDLED_LOCALES)[number] | string;

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_LOGIN_ATTEMPTS = 8;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;