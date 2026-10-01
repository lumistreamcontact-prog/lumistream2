import { en } from "./en";

/**
 * Every translatable key, derived from the English reference bundle.
 *
 * The root layout iterates this list to serialise the active dictionary into
 * the client bundle, so client components can call `t()` without pulling the
 * whole translation set into their JavaScript.
 */
export const TRANSLATION_KEYS = Object.keys(en) as readonly string[];

export type TranslationKey = (typeof TRANSLATION_KEYS)[number];