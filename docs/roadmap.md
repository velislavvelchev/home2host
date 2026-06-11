# Roadmap

Status markers: ✅ done · 🔄 in progress · ⬜ not started

## Stage 0 — Preparation and safety ✅

- ✅ Local environment (Node.js, npm, Git, VS Code)
- ✅ GitHub repo created and connected locally
- ✅ Doc structure (CLAUDE.md, docs/) — this pattern
- ✅ Backup of the current WordPress site (created in WordPress admin)
- ✅ Collect the raw materials — closed 2026-06-04 with deferred items parked. See `docs/content-inventory.md` for the deferred-follow-ups table (footer copy, EN translations, full blog bodies, apartment labels, tone-of-voice, vector logo) — none block Stage 1, all pickable on demand.

## Stage 1 — Project skeleton ✅

Restructured after ADR 0003 (Tailwind v4) and the design-system doc were added — the original "folder structure" and "design tokens" items have collapsed into a single foundation step, executed before anything else.

- ✅ `create-next-app` with TypeScript and App Router
- ✅ Design-system foundation
  - ✅ Initial `@theme` block in `src/app/globals.css` per [design-system.md](design-system.md) and [ADR 0003](decisions/0003-styling-approach.md) — brand indigo (anchored at brand-800 = #122C69), neutrals, semantic colors, Geist type scale, spacing/radii/shadows/motion, light+dark via CSS-variable swap
  - ✅ `src/components/` created when the Button + Card primitives landed in Stage 3; now houses Header/Footer/FloatingCallButton/RevealOnScroll/StructuredData/LanguageSwitcher and the `sections/` + `sections/contacts/` subtrees.
  - ✅ Smoke-test home page that actually exercises the tokens — production build green
- ✅ Database decision — Neon, per [ADR 0002](decisions/0002-database-provider.md). Postgres + scale-to-zero + Vercel-native + per-branch DBs; Payload uses `@payloadcms/db-postgres`.
- ✅ Database provisioning + connection — Neon Postgres provisioned via Vercel Storage (Frankfurt, free tier). Env vars (`DATABASE_URL`, `POSTGRES_URL`, etc.) auto-injected into Production/Preview/Development environments and pulled locally with `vercel env pull .env.local`.
- ✅ Payload integration inside the same project — Payload v3.85 mounted as `(payload)` route group; marketing site lives in parallel `(frontend)` route group so each owns its own `<html>/<body>`. Admin reachable at `/admin`, REST at `/api/...`, GraphQL at `/api/graphql`. `--use-swc` flag on `payload generate:*` scripts to sidestep tsx's `require()`-on-ESM issue on Node 24.
- ✅ First deployment to Vercel — auto-deploys from `main` to `home2host.vercel.app`. Smoke-test page rendered; DNS untouched (WordPress stays on the domain until Stage 6).

## Stage 2 — Data layer (Payload schema) ✅

- ✅ Collections: Media, BlogPost, Apartment, FAQ, Service, PricingPlan
- ✅ Globals: Contacts, SocialLinks
- ✅ Field-level i18n (BG/EN) — `localization` block enabled in `payload.config.ts` (bg default, en fallback). Slug fields kept non-localized for now (revisit in Stage 5 with next-intl).
- ✅ Media storage adapter — Vercel Blob wired per [ADR 0004](decisions/0004-media-storage-adapter.md); doc `url` fields point directly at Blob's CDN (`disablePayloadAccessControl: true`); sharp generates 3 size variants per upload.
- ⬜ Sample content through the admin panel — left for the partner to populate; verify field shapes hold up against real content before Stage 3 starts.

## Stage 3 — Design system and shared UI ✅

Mobile-first is the default for every token and component (per [design-system.md](design-system.md), reinforced by Tailwind v4's mobile-first prefix model from [ADR 0003](decisions/0003-styling-approach.md)). Realistic visitor mix is phone-heavy (Airbnb-adjacent traffic, BG audience on mobile-first carriers).

- ✅ Design tokens — refinement pass closed. Palette anchored at `#122C69` brand-800, neutrals + semantic colors locked. Type scale extended to `text-8xl` (96px) so hero text grows on 1080p+ monitors instead of capping at laptop-friendly 60px; full scale documented in [design-system.md](design-system.md). Typeface kept on Geist Sans (display + body) + Geist Mono (code) — single webfont family for now; revisit when a more distinctive display face becomes a design priority.
- ✅ **Locked the breakpoint scale** — Tailwind's defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536) declared explicitly in `globals.css` `@theme` so the file is the single source of truth.
- ✅ Base components — closed-surface contract per [design-system.md](design-system.md): variants via props, no `className` escape hatch, light+dark via swappable tokens.
  - ✅ Button (`primary` / `secondary` / `ghost` × `sm` / `md` / `lg`; exports `buttonStyles()` for anchors)
  - ✅ Card (`default` / `muted` × `sm` / `md` / `lg` padding)
  - ✅ Layout chrome wired via `(frontend)/layout.tsx` (Header + Footer inherited by every route in the group; no separate `<Layout>` component needed).
  - ✅ Header — sticky bar with backdrop-blur, primary nav inline on `md+`, hamburger-toggled slide-in drawer on mobile (ESC + outside-click close, body-scroll lock, drawer rendered as a sibling of `<header>` to avoid `backdrop-filter` scoping its `position: fixed`).
  - ✅ Footer — 3-column grid on `md+`, stacked on mobile; contacts column is a placeholder until the Contacts global is populated via Payload.
  - ✅ LanguageSwitcher — pill-style BG/EN toggle, visual-only for now; real locale switching arrives with next-intl in Stage 5.

## Stage 4 — Pages 🔄

**Architecture:** the new site is a multi-page app with a rich home page that carries the **full** content of every section (preserves the live home's existing Google ranking authority). Each section also lives at its own URL — slugs matching the live WordPress site exactly (`/about-us/`, `/services/`, `/prices/`, `/questions/`, `/apartments/`, `/contacts/`, `/blog/`, trailing slashes preserved via `trailingSlash: true` in `next.config.ts`). Standalone section pages set `<link rel="canonical" href="/">` so they don't compete with the home for the same keywords. This is essentially what the live WordPress site already does (most standalone pages repeat home-page content), but made explicit.

Section components live under `src/components/sections/` and are reused 1:1 between the home embed and the standalone route — heading level swaps via a `headingLevel` prop so the document outline stays correct in both contexts.

Order: static pages first, then CMS-driven ones.
- ✅ Home, About, Services, Prices, FAQ, Contacts — all six sections built, embedded on `/`, and accessible as standalone routes with canonical → `/`.
  - ✅ Header/Footer nav aligned with live slugs + BG labels; `trailingSlash: true` set so URLs match the WordPress shape exactly.
  - ✅ About section (`src/components/sections/AboutSection.tsx`) — first real section, BG content from inventory, embedded on `/` and standalone at `/about-us/` (canonical to `/`).
  - ✅ Hero rebuild — placeholder replaced with BG title/eyebrow/tagline + mid-century interior photo (`public/hero-home.jpeg`) served via `next/image` with `priority` (preload link in head, srcSet from 384–3840px). Ambient liveliness via two CSS-only gradient blobs (offset 4s for out-of-phase pulsing) + slow Ken Burns zoom on the image (1.00 → 1.06 over 24s). All animations are `motion-safe:` gated so users with `prefers-reduced-motion` get the static version. Polish (more pronounced liveliness) parked as a follow-up.
  - ✅ Brand identity wired through — `public/logo.svg` (full lockup, vector from owner) + `public/logo-icon.svg` (cropped icon-only variant for the Header/Footer chip + SVG favicon) + 3 PNG favicon sizes + OG share image. Page metadata uses BG title/description, `lang="bg"`, `locale: "bg_BG"`. Geist Sans/Mono subsets now include `cyrillic` so BG copy renders in Geist instead of falling back to a system font. **Follow-up**: the in-page chip rendering of `logo-icon.svg` has two known polish gaps — the house icon sits slightly above center on the vertical axis, and there's a faint white halo at the chip's rounded-corner edges (the SVG's white backdrop bleeding past the indigo plate). Both are cosmetic, only visible in the small chip; favicon and full-lockup uses look right. Will be fixed in a focused logo-polish slice later.
  - ✅ Services section (`src/components/sections/ServicesSection.tsx`) — editorial alternating image/text rows (image left/right on `md+`, stacked on mobile), Lucide icon + `NN / 06` indicator per row, six Pexels photos under `public/services/` (placeholder until owner photography). Embedded on `/` and standalone at `/services/` (canonical to `/`).
  - ✅ Prices section (`src/components/sections/PricesSection.tsx`) — three pricing cards (Start Smart / Full Care / Home Refresh) with distinct Lucide icons, split-typography numeric prices, brand-tinted Check icons, cascading RevealOnScroll. Embedded on `/` and standalone at `/prices/` (canonical to `/`).
  - ✅ FAQ section (`src/components/sections/FaqSection.tsx`) — 7 Q&A pairs as a native `<details>/<summary>` accordion with chevron rotation, hairline dividers, single-column reading layout. Embedded on `/` and standalone at `/questions/` (canonical to `/`). "BnB Manager" typo from live site corrected to "Home2Host".
  - ✅ Contacts section (`src/components/sections/contacts/`) — two-column layout with service area + phone/email/address/WhatsApp/social on the left and a 4-field form on the right. Form posts via Next.js Server Action through Hostinger SMTP to the existing `info@home2host.com` mailbox; `Reply-To` set to the submitter so owner replies in webmail land directly. Honeypot field included; **Upstash rate limit deferred** (see follow-ups). Embedded on `/` and standalone at `/contacts/` (canonical to `/`).
  - ✅ Scroll-triggered fade-up animation on each section — reusable `<RevealOnScroll>` wired into every marketing section (About, Services, Apartments, Prices, FAQ, Contacts).
  - ✅ Scroll-spy: `IntersectionObserver` in the `Header` tracks which section is most-visible while scrolling `/`, highlights the matching nav item, and updates `location.hash` via `history.replaceState` (no scroll trigger, no history pollution). Standalone routes fall back to pathname match.
- ⬜ Blog (list + single post)
- ✅ Apartments section (`src/components/sections/ApartmentsSection.tsx`) — 10 custom photo cards in a horizontal scroll-snap carousel (auto-advance, pause-on-hover, swipe on mobile, arrow buttons on `md+`). Photos fetched once from each listing's og:image via `scripts/fetch-airbnb-og-images.mjs` and served through `next/image` from `a0.muscache.com`. Titles are each host's real headline (from JSON-LD `name`, `| Home2Host` suffix stripped). Card body `bg-brand-800` so the surface itself signals "clickable". Embedded on `/` between Services and Prices; standalone at `/apartments/` (canonical to `/`). Embed-iframe approach was scrapped 2026-06-11 due to load weight + uncontrollable styling.
- ⬜ **Each page verified at every breakpoint** before it's marked done — minimum: 360px (small phone), 768px (tablet), 1280px (laptop). Pay extra attention to the Airbnb embeds (their own iframes are notoriously narrow on small screens) and the Header/nav transitions across breakpoints.
- 🔄 Contact-form abuse defenses — **honeypot shipped with the form** (offscreen `name="website"` field; server action silently succeeds on fill). **Still to do before public launch**: per-IP rate limiting via `@upstash/ratelimit` + `@upstash/redis` (free tier sufficient). Optional Cloudflare Turnstile for residual spam.

## Stage 5 — i18n, analytics, SEO 🔄

- ⬜ next-intl setup and migration of English strings from TranslatePress
- ✅ GA4 with the same measurement ID as the old site — `@next/third-parties` installed and wired into the frontend layout. `NEXT_PUBLIC_GA_MEASUREMENT_ID` set on Vercel Production + Preview to `G-5HEDRYZJ93` (the same measurement ID the live WordPress site uses via Site Kit), so analytics continuity is preserved through the Stage 6 DNS switch. Verified in deployed page source 2026-06-11.
- ✅ Sitemap (`/sitemap.xml`) — dynamic, lists every public marketing page.
- ✅ `robots.txt` — allow public content, disallow `/admin/` + `/api/`, point at the sitemap.
- ✅ JSON-LD `LocalBusiness` structured data — rendered in the layout body.
- ⬜ Per-page Open Graph metadata — currently only the root metadata is set; section routes inherit but could specify their own.
- ⬜ Redirects from old URLs (preserve Google rankings)

## Stage 6 — Finalization and launch ⬜

- ⬜ Full real content entered through Payload
- ⬜ Thorough review on the Vercel preview URL
- ⬜ DNS switch from Hostinger to Vercel
- ⬜ WordPress kept as a backup for several weeks post-launch
- ⬜ Verify GA and Google Search Console after launch
- ⬜ **Real-device mobile pass** — open the Vercel preview URL on an actual Android phone and an actual iPhone (Safari behaves differently from Chrome DevTools' mobile emulation, especially on viewport-height units and tap targets). Catch issues DevTools never shows.
- ⬜ Security baseline (before/at DNS switch):
  - ⬜ Put **Cloudflare's free tier** in front of `home2host.com` for L7 DDoS, WAF, rate-limiting rules, bot management, always-on caching. Single biggest security upgrade available; covers ~90% of what Vercel charges for in Pro.
  - ⬜ Harden Payload admin auth — set `maxLoginAttempts: 5` and `lockTime: 15 * 60 * 1000` on the `users` collection to block brute-force login attempts.
  - ⬜ Enable **Vercel usage alerts** (Settings → Billing → Usage alerts) at 50% / 80% / 100% — early warning for traffic spikes or runaway crawlers.

## Open questions

- Vertical slice in Stage 1? (One page wired end-to-end early, to feel the full flow before going wide.)

## Known follow-ups (don't lose these)

Small items deferred during Stage 1 — none block Stage 2, but each will bite at a specific later moment if forgotten.

- **Payload `Apartment` collection out of sync with the new card design.** Stage 4's Apartments rebuild (2026-06-11) dropped Airbnb embeds in favour of custom photo cards. The schema still has the embed-era field set (`title`, `city`, `airbnbUrl`, `description`, `order`, `isActive`) — missing `featuredImage` (Media relation) and `rating` (decimal). Admin description still says "Each apartment is an embed, not a property record." Frontend is hardcoded so nothing breaks today; sync the schema (and `npm run generate:types`) before wiring Payload → frontend for Apartments in Stage 5 or later. Or delete the collection if we commit to hardcoded data permanently.

- **`PAYLOAD_SECRET` missing from Vercel Preview env.** Production and Development have it; Preview does not (Vercel CLI 54.9.1 wouldn't accept it non-interactively, and we had no PR workflow yet). Add it via Vercel dashboard → Settings → Environment Variables before the first PR-triggered preview deploy, otherwise `/admin` on the preview URL will 500 with "missing secret key".
- **`pg-connection-string` v3.0 / pg v9 SSL semantics.** The dev log shows a warning that `sslmode=require` currently aliases to `verify-full`, but won't in pg v9. When we upgrade to pg v9, switch the Neon URL to `sslmode=verify-full` explicitly. Until then: no action.
- **Email adapter not wired.** Payload currently writes emails to console. Add Resend or SMTP adapter in Stage 4 or 5, before any production user needs a password reset. Until that exists, **don't lose the admin credentials** — no self-serve recovery.
- **Neon DB branching not enabled.** Per [ADR 0002](decisions/0002-database-provider.md), enable preview-deploy branching in Stage 5 or 6 once there's real production content worth protecting. Until then dev and prod share the same database.