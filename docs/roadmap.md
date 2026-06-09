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
  - ⬜ Add `src/components/` when the first real component lands (per ADR 0003); no other folders pre-created
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
- 🔄 Home, About, Services, Prices, FAQ, Contacts
  - ✅ Header/Footer nav aligned with live slugs + BG labels; `trailingSlash: true` set so URLs match the WordPress shape exactly.
  - ✅ About section (`src/components/sections/AboutSection.tsx`) — first real section, BG content from inventory, embedded on `/` and standalone at `/about-us/` (canonical to `/`).
  - ⬜ Hero rebuild — replace the dev placeholder with the live BG copy + a static hero image via `next/image` (priority load) + a subtle CSS-only flourish for "alive" feel. Asset comes from `docs/inventory/images/`.
  - ⬜ Services, Prices, FAQ, Contacts sections — same pattern as About.
  - ⬜ Scroll-triggered fade-up animation on each section (`IntersectionObserver`, ~3KB JS) — added once across all sections, not per-section.
  - ⬜ Scroll-spy: as the user scrolls past sections on `/`, update `window.location.hash` (via `history.replaceState`) and highlight the active nav item. Pure UX, zero SEO impact (Google ignores hash fragments).
- ⬜ Blog (list + single post)
- ⬜ Apartments (list of Airbnb embeds)
- ⬜ **Each page verified at every breakpoint** before it's marked done — minimum: 360px (small phone), 768px (tablet), 1280px (laptop). Pay extra attention to the Airbnb embeds (their own iframes are notoriously narrow on small screens) and the Header/nav transitions across breakpoints.
- ⬜ Contact-form abuse defenses — **before the form is exposed publicly**: honeypot field (blocks ~80% of naive bots, zero UX cost) and per-IP rate limiting via `@upstash/ratelimit` + `@upstash/redis` (free tier sufficient). Optional Cloudflare Turnstile for residual spam.

## Stage 5 — i18n, analytics, SEO ⬜

- ⬜ next-intl setup and migration of English strings from TranslatePress
- ⬜ GA4 with the same measurement ID as the old site
- ⬜ Meta tags, sitemap, Open Graph
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

- **`PAYLOAD_SECRET` missing from Vercel Preview env.** Production and Development have it; Preview does not (Vercel CLI 54.9.1 wouldn't accept it non-interactively, and we had no PR workflow yet). Add it via Vercel dashboard → Settings → Environment Variables before the first PR-triggered preview deploy, otherwise `/admin` on the preview URL will 500 with "missing secret key".
- **`pg-connection-string` v3.0 / pg v9 SSL semantics.** The dev log shows a warning that `sslmode=require` currently aliases to `verify-full`, but won't in pg v9. When we upgrade to pg v9, switch the Neon URL to `sslmode=verify-full` explicitly. Until then: no action.
- **`src/components/` not created yet** (per [ADR 0003](decisions/0003-styling-approach.md)). Create the folder when the first real component lands in Stage 3, not pre-emptively.
- **Email adapter not wired.** Payload currently writes emails to console. Add Resend or SMTP adapter in Stage 4 or 5, before any production user needs a password reset. Until that exists, **don't lose the admin credentials** — no self-serve recovery.
- **Neon DB branching not enabled.** Per [ADR 0002](decisions/0002-database-provider.md), enable preview-deploy branching in Stage 5 or 6 once there's real production content worth protecting. Until then dev and prod share the same database.