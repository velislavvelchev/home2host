# ADR 0005 — i18n URL structure: path prefix with BG as unprefixed default

**Date:** 2026-06-16
**Status:** Accepted

## Context

Stage 5 adds Bulgarian/English i18n via `next-intl`, replacing the WordPress TranslatePress plugin. Choosing the URL structure is the first decision because it cascades into everything else — route file layout, sitemap generation, redirect rules, `<link rel="alternate" hreflang>` markup, and the LanguageSwitcher's behaviour.

The live `home2host.com` WordPress site is **already in production** with two languages and its current URLs are Google-indexed. The DNS switch in Stage 6 will point the domain at this new Next.js app; **the URLs Google has on file should still resolve 1:1 to the same pages** or we lose ranking authority for every page Google has crawled. Preserving SEO continuity through migration is non-negotiable — it's the reason marketing-page slugs already match the WP shape verbatim ([`trailingSlash: true`](../../next.config.ts) in Stage 4).

Three real options exist:

1. **Path prefix, default unprefixed** — `/about-us/` for BG (default), `/en/about-us/` for EN. This is what the live WP/TranslatePress install does today.
2. **Path prefix, every locale prefixed** — `/bg/about-us/` and `/en/about-us/`. Symmetric but breaks every existing BG URL.
3. **Subdomain per locale** — `home2host.com` for BG, `en.home2host.com` for EN.
4. **Cookie-based switching, single URL** — `/about-us/` serves either language depending on a cookie or `Accept-Language` header.

## Decision

**Option 1: path prefix with BG as the unprefixed default.**

- BG (default locale) pages live at root: `/`, `/about-us/`, `/services/`, `/blog/`, `/blog/<slug>/`, etc.
- EN pages live under `/en/`: `/en/`, `/en/about-us/`, `/en/services/`, `/en/blog/`, `/en/blog/<slug>/`.
- `next-intl` is configured with `localePrefix: 'as-needed'` (or the v4 equivalent).
- `<link rel="alternate" hreflang>` tags wired into the layout so Google understands the BG↔EN pairing.

## Reasoning

### In favor of path prefix with unprefixed default (chosen)

- **SEO continuity is preserved exactly.** Every BG URL Google has indexed today (`/about-us/`, `/blog/eu-regulation-2024-1028-what-to-know/`, etc.) keeps the same shape after the DNS switch. No 301/308 redirects needed for the BG side. EN URLs that exist on the live WP install (`/en/...` per TranslatePress) also map 1:1 into the new app's `/en/...` routes. Zero ranking authority lost on either side.
- **`next-intl`'s default and best-supported pattern.** The library's documentation, examples, and middleware ergonomics are built around path-prefix routing. The other patterns require swimming against the current.
- **Single domain = single SEO authority.** Google treats `home2host.com` and `en.home2host.com` as separate properties with independent ranking signals — splitting authority across two subdomains is the opposite of what we want.
- **Operationally simple.** One DNS record, one Vercel project, one SSL certificate, one analytics property. No reverse-proxy or domain-routing logic.
- **The LanguageSwitcher becomes trivial.** It just rewrites the locale segment of the current pathname — no domain juggling, no cookie state.

### Against "every locale prefixed" (`/bg/...` + `/en/...`)

- **Breaks every indexed BG URL.** Every page Google has on file for the live site would 308 to `/bg/...`. Redirects preserve crawlability but consolidate ranking signal more slowly than not breaking the URL in the first place, and 308-from-canonical chains can compound badly with hreflang.
- The symmetry gain is purely aesthetic — `/about-us/` is no less "the Bulgarian version" with hreflang tags than `/bg/about-us/` would be.

### Against subdomain per locale (`en.home2host.com`)

- **Splits SEO authority.** Each subdomain is its own ranking entity. The EN side starts from zero authority instead of inheriting from the BG parent. Bad trade for a small site.
- DNS work in Stage 6 doubles: a second `A`/`CNAME` record, potentially a second SSL cert, second Cloudflare zone (if/when we put Cloudflare in front per the Stage 6 security baseline).
- Cookie-sharing across subdomains is awkward; cross-locale analytics in GA4 requires extra configuration to count as one site.
- Doesn't match the live WP setup, so we'd be both migrating AND restructuring at once.

### Against cookie-based switching, single URL

- **Catastrophic for SEO.** Googlebot doesn't carry cookies or `Accept-Language` preferences across crawls. The EN content effectively disappears from search — Google indexes one URL with one language and the other content is invisible.
- Even ignoring SEO: caching, sharing links, screenshots, "open in new tab", anonymous mode — all of these surface the wrong language to the user. Hard fail.

## Consequences

- **App router file layout under `src/app/(frontend)/`** gets a `[locale]` segment wrapping the existing routes, OR `next-intl`'s middleware-based scheme is used so the file layout stays mostly the same and the locale is resolved per-request. Decide during implementation.
- **`next.config.ts`** keeps `trailingSlash: true`. The locale prefix sits *before* the rest of the path, so `/en/about-us/` keeps the trailing slash.
- **Sitemap (`/sitemap.xml`)** doubles in size: every public URL appears twice (BG + EN versions), each with a `<xhtml:link rel="alternate" hreflang>` pair pointing at the other. The dynamic generator in `src/app/(frontend)/sitemap.ts` needs to enumerate locales when building entries.
- **Section route `metadata.openGraph.locale`** becomes locale-aware (currently hardcoded `bg_BG` in the root layout). Both locales share the same OG image inheritance pattern from Stage 5.
- **Redirects in `next.config.ts`** stay as-is — the legacy WP rules (`/wp-admin/*`, `/feed`, etc.) target `/`, which now means BG home page. Acceptable.
- **JSON-LD `LocalBusiness`** keeps a single block on both locales; only the text-bearing fields (name aliases, area-served descriptors) localise.
- **`<link rel="alternate" hreflang>` tags** must be rendered in `<head>` on every page — `bg`, `en`, and `x-default` (pointing at BG). Lives in the root layout via `generateMetadata`.
- **Blog posts in two languages** — Payload's localization is already enabled at the field level (Stage 2), so the BG and EN versions of a post share a `slug` and a row but have distinct translated fields. EN blog listing pulls posts where the EN locale has actual content (not just the BG fallback). Posts without EN content can either show the BG fallback with a notice or be filtered from the EN list — to decide at implementation time.
- **The LanguageSwitcher** stops being visual-only (its Stage 3 placeholder state) and starts swapping the locale segment in `usePathname()`.

## Notes on trade-offs we accept

- **The unprefixed-default pattern means BG and EN routes don't look symmetric in code.** Some next-intl users find this confusing. We accept it because the alternative (`/bg/...` everywhere) breaks the live SEO — that cost dwarfs the codebase-aesthetics one.
- **`/en/` becomes a "first-class but secondary" locale.** If we ever add a third language (Russian for tourist owners? German?) the pattern continues cleanly: `/ru/about-us/`, `/de/about-us/`. The default still doesn't get a prefix.
- **next-intl's middleware adds ~few KB to the edge runtime and runs on every request to determine the locale.** Negligible at our scale; standard practice.
