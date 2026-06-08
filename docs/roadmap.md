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

## Stage 2 — Data layer (Payload schema) 🔄

- ✅ Collections: Media, BlogPost, Apartment, FAQ, Service, PricingPlan
- ✅ Globals: Contacts, SocialLinks
- ✅ Field-level i18n (BG/EN) — `localization` block enabled in `payload.config.ts` (bg default, en fallback). Slug fields kept non-localized for now (revisit in Stage 5 with next-intl).
- ⬜ Sample content through the admin panel — left for the partner to populate; verify field shapes hold up against real content before Stage 3 starts.

## Stage 3 — Design system and shared UI ⬜

- ⬜ Design tokens — refinement and finalization (initial extraction happens in Stage 1 as part of the design-system foundation; this stage locks the final palette/type scale once real components exist)
- ⬜ Base components: Layout, Header, Footer, LanguageSwitcher, Button, Card

## Stage 4 — Pages ⬜

Order: static pages first, then CMS-driven ones.
- ⬜ Home, About, Services, Prices, FAQ, Contacts
- ⬜ Blog (list + single post)
- ⬜ Apartments (list of Airbnb embeds)

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

## Open questions

- Vertical slice in Stage 1? (One page wired end-to-end early, to feel the full flow before going wide.)

## Known follow-ups (don't lose these)

Small items deferred during Stage 1 — none block Stage 2, but each will bite at a specific later moment if forgotten.

- **`PAYLOAD_SECRET` missing from Vercel Preview env.** Production and Development have it; Preview does not (Vercel CLI 54.9.1 wouldn't accept it non-interactively, and we had no PR workflow yet). Add it via Vercel dashboard → Settings → Environment Variables before the first PR-triggered preview deploy, otherwise `/admin` on the preview URL will 500 with "missing secret key".
- **`pg-connection-string` v3.0 / pg v9 SSL semantics.** The dev log shows a warning that `sslmode=require` currently aliases to `verify-full`, but won't in pg v9. When we upgrade to pg v9, switch the Neon URL to `sslmode=verify-full` explicitly. Until then: no action.
- **`src/components/` not created yet** (per [ADR 0003](decisions/0003-styling-approach.md)). Create the folder when the first real component lands in Stage 3, not pre-emptively.
- **Email adapter not wired.** Payload currently writes emails to console. Add Resend or SMTP adapter in Stage 4 or 5, before any production user needs a password reset. Until that exists, **don't lose the admin credentials** — no self-serve recovery.
- **Media storage adapter not wired.** Payload defaults to local-disk uploads, which won't survive on Vercel's ephemeral filesystem. Pick a storage adapter (Vercel Blob is the natural fit; warrants its own ADR) before the partner uploads any image in production. Until then, do not upload media via the production admin — only via local dev.
- **Neon DB branching not enabled.** Per [ADR 0002](decisions/0002-database-provider.md), enable preview-deploy branching in Stage 5 or 6 once there's real production content worth protecting. Until then dev and prod share the same database.