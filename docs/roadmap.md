# Roadmap

Status markers: ✅ done · 🔄 in progress · ⬜ not started

## Stage 0 — Preparation and safety 🔄

- ✅ Local environment (Node.js, npm, Git, VS Code)
- ✅ GitHub repo created and connected locally
- ✅ Doc structure (CLAUDE.md, docs/) — this pattern
- ⬜ Backup of the current WordPress site (content + files + database)
- ⬜ Collect the raw materials — see `docs/content-inventory.md`

## Stage 1 — Project skeleton ⬜

- ⬜ `create-next-app` with TypeScript and App Router
- ⬜ Folder structure (`src/app`, `src/components`, `src/lib`, etc.)
- ⬜ Payload integration inside the same project
- ⬜ Database choice and connection (Neon vs Supabase — decided here, documented in a new ADR)
- ⬜ First deployment to Vercel (empty page, but end-to-end pipeline working)

## Stage 2 — Data layer (Payload schema) ⬜

- ⬜ Collections: BlogPost, Apartment, Service, PricingPlan, FAQ, Media
- ⬜ Globals: Contacts, SocialLinks
- ⬜ Field-level i18n (BG/EN)
- ⬜ Sample content through the admin panel

## Stage 3 — Design system and shared UI ⬜

- ⬜ Styling approach (Tailwind vs CSS Modules — decided here)
- ⬜ Design tokens (colors, fonts, spacing) extracted from the current site
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
- Postgres provider: Neon vs Supabase — to be decided in Stage 1
- Styling: Tailwind vs CSS Modules — to be decided in Stage 3