# Roadmap

Status markers: ✅ done · 🔄 in progress · ⬜ not started

## Stage 0 — Preparation and safety ✅

- ✅ Local environment (Node.js, npm, Git, VS Code)
- ✅ GitHub repo created and connected locally
- ✅ Doc structure (CLAUDE.md, docs/) — this pattern
- ✅ Backup of the current WordPress site (created in WordPress admin)
- ✅ Collect the raw materials — closed 2026-06-04 with deferred items parked. See `docs/content-inventory.md` for the deferred-follow-ups table (footer copy, EN translations, full blog bodies, apartment labels, tone-of-voice, vector logo) — none block Stage 1, all pickable on demand.

## Stage 1 — Project skeleton ⬜

Restructured after ADR 0003 (Tailwind v4) and the design-system doc were added — the original "folder structure" and "design tokens" items have collapsed into a single foundation step, executed before anything else.

- ✅ `create-next-app` with TypeScript and App Router
- ⬜ Design-system foundation
  - Initial `@theme` block in `src/app/globals.css` per [design-system.md](design-system.md) and [ADR 0003](decisions/0003-styling-approach.md)
  - Add `src/components/` when the first real component lands (per ADR 0003); no other folders pre-created
  - Smoke-test home page that actually exercises the tokens (so we know the pipeline works before going wide)
- ⬜ Database decision (Neon vs Supabase) — ADR 0002
- ⬜ Database provisioning + connection
- ⬜ Payload integration inside the same project
- ⬜ First deployment to Vercel (smoke-test page, but end-to-end pipeline working)

## Stage 2 — Data layer (Payload schema) ⬜

- ⬜ Collections: BlogPost, Apartment, Service, PricingPlan, FAQ, Media
- ⬜ Globals: Contacts, SocialLinks
- ⬜ Field-level i18n (BG/EN)
- ⬜ Sample content through the admin panel

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
- Postgres provider: Neon vs Supabase — to be decided in Stage 1 (task 2, ADR 0002)