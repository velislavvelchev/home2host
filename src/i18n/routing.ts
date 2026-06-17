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
//
// `localeDetection: false` — owner preference (2026-06-17): BG is the
// unambiguous brand-default. By default next-intl matches the visitor's
// `Accept-Language` header on first visit and redirects English-
// speaking browsers to `/en/...`, which over-served EN to visitors
// who'd never asked for it. Disabling detection pins every fresh visit
// to BG. Users who actively want EN click the LanguageSwitcher → the
// URL shape `/en/...` is bookmarkable, so the EN audience isn't lost.
export const routing = defineRouting({
  locales: ["bg", "en"],
  defaultLocale: "bg",
  localePrefix: "as-needed",
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
