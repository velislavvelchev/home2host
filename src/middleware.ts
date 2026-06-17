import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Locale-aware routing for the marketing site. With `as-needed`:
//   - /              → renders [locale]/page.tsx with locale='bg'
//   - /about-us/     → renders [locale]/about-us/page.tsx with locale='bg'
//   - /en            → renders [locale]/page.tsx with locale='en'
//   - /en/about-us/  → renders [locale]/about-us/page.tsx with locale='en'
//   - /bg/...        → 308 redirect to the unprefixed form (default locale
//                       is never visible in URLs — enforces a single
//                       canonical URL per page, important for SEO).
//
// The Payload group ((payload) — /admin and /api/...) MUST be excluded
// from the matcher. The locale rewriter would otherwise try to wrap
// /admin into /[locale]/admin and break the Payload UI + API.
export default createMiddleware(routing);

export const config = {
  // Match everything except:
  //   - /api/*       → Payload REST + GraphQL endpoints
  //   - /admin/*     → Payload admin UI
  //   - /_next/*     → Next.js internals (chunks, image optimizer, ...)
  //   - /_vercel/*   → Vercel internals (insights, monitoring)
  //   - anything with a file extension → static assets in /public (logo,
  //                    favicons, hero/services photos), plus sitemap.xml
  //                    and robots.txt (both emitted by Next.js but served
  //                    as flat .xml/.txt files).
  matcher: "/((?!api|admin|_next|_vercel|.*\\..*).*)",
};
