import { CATEGORIES, CURRENCIES, QUALITIES, ROLES, CONTENT_TYPES } from "./constants";

/**
 * Declarative field definitions for the generic admin editor.
 *
 * Every catalogue screen renders the same `<EntityForm>`; the differences live
 * here so a new field never means a new bespoke page. Labels are dictionary
 * keys, so the editor is automatically translated.
 */

export type FieldKind =
  | "text"
  | "url"
  | "password"
  | "textarea"
  | "lines"
  | "number"
  | "color"
  | "select"
  | "checkbox"
  | "channels";

export interface FieldOption {
  value: string;
  labelKey?: string;
  label?: string;
}

export interface FieldSpec {
  name: string;
  labelKey: string;
  kind: FieldKind;
  required?: boolean;
  placeholder?: string;
  step?: string;
  min?: number;
  max?: number;
  options?: FieldOption[];
  /** Columns occupied in the two-column form grid. */
  span?: 1 | 2;
}

export type AdminEntity = "channel" | "content" | "package" | "user" | "language";

const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c.value, labelKey: c.labelKey }));
const QUALITY_OPTIONS = QUALITIES.map((q) => ({ value: q, label: q }));
const CURRENCY_OPTIONS = CURRENCIES.map((c) => ({ value: c.code, label: `${c.symbol} ${c.code}` }));
const TYPE_OPTIONS = Object.values(CONTENT_TYPES).map((c) => ({
  value: c,
  labelKey: `content.${c === "movie" ? "movies" : c === "series" ? "series" : "documentaries"}`,
}));

export const ENTITY_FIELDS: Record<AdminEntity, FieldSpec[]> = {
  channel: [
    { name: "name", labelKey: "admin.channelName", kind: "text", required: true, span: 1 },
    { name: "slug", labelKey: "admin.slug", kind: "text", span: 1 },
    {
      name: "streamUrl",
      labelKey: "admin.streamUrl",
      kind: "url",
      required: true,
      placeholder: "https://cdn.example.com/live/index.m3u8",
      span: 2,
    },
    { name: "fallbackUrl", labelKey: "admin.fallbackUrl", kind: "url", span: 2 },
    { name: "logo", labelKey: "admin.logo", kind: "url", span: 1 },
    { name: "poster", labelKey: "admin.poster", kind: "url", span: 1 },
    { name: "category", labelKey: "admin.category", kind: "select", options: CATEGORY_OPTIONS, span: 1 },
    { name: "quality", labelKey: "admin.quality", kind: "select", options: QUALITY_OPTIONS, span: 1 },
    { name: "country", labelKey: "admin.country", kind: "text", span: 1 },
    { name: "language", labelKey: "admin.language", kind: "text", span: 1 },
    { name: "tags", labelKey: "admin.tags", kind: "text", span: 2 },
    { name: "sortOrder", labelKey: "admin.sortOrder", kind: "number", step: "1", span: 1 },
    { name: "description", labelKey: "admin.description", kind: "textarea", span: 2 },
    { name: "isFeatured", labelKey: "admin.featured", kind: "checkbox", span: 1 },
    { name: "isActive", labelKey: "admin.isActive", kind: "checkbox", span: 1 },
  ],

  content: [
    { name: "title", labelKey: "admin.title", kind: "text", required: true, span: 1 },
    { name: "slug", labelKey: "admin.slug", kind: "text", span: 1 },
    { name: "originalTitle", labelKey: "admin.originalTitle", kind: "text", span: 2 },
    { name: "type", labelKey: "content.filterType", kind: "select", options: TYPE_OPTIONS, span: 1 },
    { name: "year", labelKey: "admin.year", kind: "number", step: "1", min: 1900, max: 2100, span: 1 },
    { name: "duration", labelKey: "admin.duration", kind: "number", step: "1", span: 1 },
    { name: "ageRating", labelKey: "admin.ageRating", kind: "text", span: 1 },
    { name: "rating", labelKey: "admin.rating", kind: "number", step: "0.1", min: 0, max: 10, span: 1 },
    { name: "genres", labelKey: "admin.genres", kind: "text", span: 1 },
    { name: "poster", labelKey: "admin.poster", kind: "url", span: 1 },
    { name: "videoUrl", labelKey: "admin.videoUrl", kind: "url", span: 1 },
    { name: "trailerUrl", labelKey: "admin.trailerUrl", kind: "url", span: 1 },
    { name: "director", labelKey: "admin.director", kind: "text", span: 1 },
    { name: "cast", labelKey: "admin.cast", kind: "text", span: 2 },
    { name: "sortOrder", labelKey: "admin.sortOrder", kind: "number", step: "1", span: 1 },
    { name: "description", labelKey: "admin.description", kind: "textarea", span: 2 },
    { name: "isFeatured", labelKey: "admin.featured", kind: "checkbox", span: 1 },
    { name: "isActive", labelKey: "admin.isActive", kind: "checkbox", span: 1 },
  ],

  package: [
    { name: "name", labelKey: "admin.plan", kind: "text", required: true, span: 1 },
    { name: "slug", labelKey: "admin.slug", kind: "text", span: 1 },
    { name: "price", labelKey: "admin.price", kind: "number", step: "0.01", min: 0, span: 1 },
    { name: "currency", labelKey: "admin.commerce", kind: "select", options: CURRENCY_OPTIONS, span: 1 },
    { name: "durationDays", labelKey: "admin.durationDays", kind: "number", step: "1", min: 1, span: 1 },
    { name: "maxDevices", labelKey: "admin.maxDevices", kind: "number", step: "1", min: 1, span: 1 },
    { name: "durationLabel", labelKey: "packages.duration", kind: "text", span: 1 },
    { name: "sortOrder", labelKey: "admin.sortOrder", kind: "number", step: "1", span: 1 },
    { name: "image", labelKey: "admin.image", kind: "url", span: 1 },
    { name: "description", labelKey: "admin.description", kind: "textarea", span: 2 },
    { name: "features", labelKey: "admin.features", kind: "lines", span: 2 },
    { name: "channels", labelKey: "admin.includedChannels", kind: "channels", span: 2 },
    { name: "isPopular", labelKey: "admin.popular", kind: "checkbox", span: 1 },
    { name: "isActive", labelKey: "admin.isActive", kind: "checkbox", span: 1 },
  ],

  user: [
    { name: "firstName", labelKey: "auth.firstName", kind: "text", required: true, span: 1 },
    { name: "lastName", labelKey: "auth.lastName", kind: "text", required: true, span: 1 },
    { name: "email", labelKey: "auth.email", kind: "text", required: true, span: 2 },
    { name: "phone", labelKey: "support.phone", kind: "text", span: 1 },
    {
      name: "role",
      labelKey: "admin.role",
      kind: "select",
      options: [
        { value: ROLES.USER, labelKey: "admin.user" },
        { value: ROLES.ADMIN, labelKey: "admin.admin" },
      ],
      span: 1,
    },
    { name: "password", labelKey: "admin.password", kind: "password", span: 2 },
    { name: "isActive", labelKey: "admin.isActive", kind: "checkbox", span: 1 },
  ],

  language: [
    { name: "code", labelKey: "admin.code", kind: "text", required: true, placeholder: "fr", span: 1 },
    { name: "sortOrder", labelKey: "admin.sortOrder", kind: "number", step: "1", span: 1 },
    { name: "name", labelKey: "admin.code", kind: "text", required: true, placeholder: "French", span: 1 },
    { name: "nativeName", labelKey: "admin.nativeName", kind: "text", required: true, span: 1 },
    {
      name: "dir",
      labelKey: "admin.direction",
      kind: "select",
      options: [
        { value: "ltr", label: "LTR" },
        { value: "rtl", label: "RTL" },
      ],
      span: 1,
    },
    { name: "isDefault", labelKey: "admin.isDefault", kind: "checkbox", span: 1 },
    { name: "isActive", labelKey: "admin.isActive", kind: "checkbox", span: 1 },
  ],
};

export interface ColumnSpec {
  key: string;
  labelKey: string;
  kind?: "badge" | "bool" | "date";
}

/** Columns rendered by the generic list tables. */
export const TABLE_COLUMNS: Record<AdminEntity, ColumnSpec[]> = {
  channel: [
    { key: "name", labelKey: "admin.channelName" },
    { key: "category", labelKey: "admin.category" },
    { key: "quality", labelKey: "admin.quality" },
    { key: "country", labelKey: "admin.country" },
    { key: "isActive", labelKey: "admin.isActive", kind: "bool" },
    { key: "isFeatured", labelKey: "admin.featured", kind: "bool" },
    { key: "viewCount", labelKey: "admin.pageViews" },
  ],
  content: [
    { key: "title", labelKey: "admin.title" },
    { key: "type", labelKey: "content.filterType" },
    { key: "year", labelKey: "admin.year" },
    { key: "genres", labelKey: "admin.genres" },
    { key: "isActive", labelKey: "admin.isActive", kind: "bool" },
    { key: "isFeatured", labelKey: "admin.featured", kind: "bool" },
  ],
  package: [
    { key: "name", labelKey: "admin.plan" },
    { key: "price", labelKey: "admin.price" },
    { key: "currency", labelKey: "admin.commerce" },
    { key: "durationDays", labelKey: "admin.durationDays" },
    { key: "maxDevices", labelKey: "admin.maxDevices" },
    { key: "isActive", labelKey: "admin.isActive", kind: "bool" },
  ],
  user: [
    { key: "email", labelKey: "auth.email" },
    { key: "firstName", labelKey: "auth.firstName" },
    { key: "lastName", labelKey: "auth.lastName" },
    { key: "role", labelKey: "admin.role", kind: "badge" },
    { key: "isActive", labelKey: "admin.isActive", kind: "bool" },
    { key: "createdAt", labelKey: "admin.date", kind: "date" },
  ],
  language: [
    { key: "code", labelKey: "admin.code" },
    { key: "name", labelKey: "admin.code" },
    { key: "nativeName", labelKey: "admin.nativeName" },
    { key: "dir", labelKey: "admin.direction" },
    { key: "sortOrder", labelKey: "admin.sortOrder" },
    { key: "isActive", labelKey: "admin.isActive", kind: "bool" },
  ],
};
