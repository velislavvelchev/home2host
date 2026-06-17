import { defineRouting } from "next-intl/routing";

// Single source of truth for locale config. Consumed by:
//   - src/middleware.ts (rewrites incoming requests to [locale]/...)
//   - src/i18n/request.ts (loads the right message bundle per request)
//   - components/LanguageSwitcher (will use createNavigation() in slice 3)
//
// `localePrefix: 'as-needed'` + `defaultLocale: 'bg'` gives us the URL
// shape locked by ADR 0005:
//   - BG (default):  /, /about-us/, /services/, ...
//   - EN (prefixed): /en, /en/about-us/, /en/services/, ...
//
// This matches the live WordPress + TranslatePress URLs 1:1, so every
// Google-indexed page keeps resolving after the Stage 6 DNS switch.
// Switching this is non-trivial post-launch — see ADR 0005 for the
// alternatives considered.
export const routing = defineRouting({
  locales: ["bg", "en"],
  defaultLocale: "bg",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
