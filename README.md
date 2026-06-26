# 🏠 home2host

### Modernization of [home2host.com](https://home2host.com) — a WordPress + Elementor + TranslatePress marketing site rebuilt as a Next.js + Payload CMS application, with the original WordPress install preserved as a live archive at [old.home2host.com](https://old.home2host.com).

The business is a property-management company for short-term rentals (Airbnb / Booking.com) in **Bansko** and **Burgas**, Bulgaria. The site is mostly a marketing surface (about / services / pricing / FAQ / contacts / blog) plus an embedded "apartments" section that links out to the actual listings. The migration brought the technical stack into 2026 — proper i18n, faster pages, a real CMS the business partner can edit, server-side rendering for SEO — without breaking a single existing URL or ranking.

Access the production site at [**home2host.com**](https://home2host.com). The previous WordPress version remains accessible at [**old.home2host.com**](https://old.home2host.com) as a reference / fallback archive — same content, same admin, same database, just at a different hostname.

Scroll down for project context, design notes, SEO preservation strategy, and the technology stack ⬇️


## 📸 Preview

### Public site (Bulgarian default; EN at `/en/...`)

<img width="1357" height="810" alt="image" src="https://github.com/user-attachments/assets/9678edde-16ce-44cf-8a7f-456bcd5feafa" />


### Payload CMS admin panel — what the business owner uses to manage content

<img width="1570" height="786" alt="image" src="https://github.com/user-attachments/assets/63d291f7-b135-47c0-b033-7aa3d7a83ce6" />

## 🧭 Project Context

The original site was a typical small-business WordPress build — Elementor for layouts, TranslatePress for the BG/EN switch, a long stack of plugins for SEO, performance, security, and forms. It worked, but it was slow, brittle, and the only way to change content was through wp-admin's Elementor visual editor (which is heavy and inflexible). The business partner couldn't edit anything that wasn't already an Elementor widget without breaking layouts.

Rather than incrementally patching WordPress, the rebuild went all-in on a modern stack: React-based frontend with SSR/SSG (Next.js App Router), a schema-as-code CMS (Payload, same repo as the frontend), serverless Postgres (Neon), and edge hosting (Vercel + Cloudflare). The result is a faster, more maintainable site — *and* a cleaner editorial workflow for the partner: every section that they'd ever want to retune is a typed field in the admin, with localized BG/EN inputs side by side and a live SERP preview for SEO tabs.

The whole migration was done with **zero downtime for users** — the WordPress site stayed live on `home2host.com` throughout development while the new build matured on a Vercel preview URL. The DNS cutover from WordPress → Vercel was the final step, executed in roughly 25 minutes including troubleshooting, with a documented < 5-minute rollback playbook in case anything went sideways. Nothing did.


## 🎨 Design & Architecture

The visual language is "modern, slightly futuristic, mobile-first" — not a reskin of the old site. Reference points: clean editorial layouts, deep indigo brand color (`#122C69`), confident type that scales up on bigger screens instead of capping at laptop-friendly sizes, Ken Burns and crossfade animations gated behind `prefers-reduced-motion`.

A few load-bearing architectural choices:

- 🧱 **Parallel root layouts pattern.** Payload's admin and the marketing frontend share the `src/app/` tree via two route groups (`(frontend)` + `(payload)`), each owning its own `<html>`/`<body>`. Collapsing them into a single root layout produces nested `<html>` tags and hydration errors — the route-group split is non-negotiable.
- 🎨 **Tailwind v4 + design tokens.** All colors, spacing, typography, radii, shadows live in a single `@theme` block in `globals.css`. Components consume tokens via utility classes — no hardcoded values, no `className` escape-hatch overrides. Light + dark are token-value swaps, not style rewrites.
- 📱 **Mobile-first everything.** Realistic visitor mix is phone-heavy (Airbnb-adjacent traffic, Bulgarian audience on mobile-first carriers). Every breakpoint, every component contract, every animation gets the small-screen variant designed first.
- 🌍 **i18n via next-intl.** Bulgarian is the default locale (unprefixed URLs — `/about-us/`, `/services/`), English lives at `/en/about-us/`, `/en/services/`, etc. Locale-aware Link components keep visitors in their chosen locale as they navigate. Bilingual fields throughout the CMS so the business partner can manage both languages in place.
- 🖼️ **Brand-themed Payload admin.** The admin UI is custom-themed to match home2host brand colors — brand indigo replaces Payload's stock blue/green scales, Geist Sans loaded into the admin route group, custom logo + favicon, external-tools top bar with one-click access to Hostinger, Cloudflare, Vercel, GA4, Search Console, GitHub, and the live site.


## 🔍 SEO Preservation

The original WordPress site had years of accumulated Google rankings, particularly for Bulgarian property-management queries (*"управление на имоти Банско"*, *"апартамент под наем Бургас"*). Losing those rankings in the migration would have been a real cost. The rebuild was designed from day one to preserve ranking continuity:

- 🔗 **URL shape kept identical.** Every marketing-page slug matches the live WordPress site exactly — `/about-us/`, `/services/`, `/prices/`, `/questions/`, `/apartments/`, `/contacts/`, `/blog/` — including trailing slashes. Legacy WordPress system URLs (`/wp-admin/*`, `/author/*`, `/category/*`, `/tag/*`, `/feed`, etc.) all 308-redirect to `/`.
- 📝 **Per-page SEO meta.** Every page + blog post + global has a dedicated SEO tab in the admin (powered by `@payloadcms/plugin-seo`) — localized meta title + description + image, with character counters, a live Google SERP preview, and auto-generate buttons that reproduce the live-site SEO copy patterns. The business partner can tune every page's SEO independently for BG + EN.
- 🗺️ **Dynamic sitemap + hreflang.** `/sitemap.xml` is generated at build time, listing every public URL with `lastmod` dates, plus `<xhtml:link rel="alternate" hreflang="...">` tags pairing each BG URL with its EN equivalent (and vice versa). Blog posts auto-included; untranslated posts only listed under the locale they're authored in.
- 🏷️ **JSON-LD structured data.** A schema.org `LocalBusiness` block renders server-side in the document head, with phones, email, address, area-served cities, and social URLs all pulled live from Payload Globals so the business partner can update them in `/admin` and the structured data follows automatically.
- 🔐 **Apex-canonical URLs.** `home2host.com` (bare apex) is the canonical hostname. `www.home2host.com` 308-redirects to apex. All sitemap entries, OG tags, JSON-LD URLs, and canonical links use the apex form — preserving the link-equity shape of every existing backlink.
- 📦 **WordPress kept alive as `old.home2host.com`.** Rather than freezing the old site as an inaccessible backup, it's now a live archive at a branded subdomain. If a deep-linked legacy URL ever surfaces (a forum post, a print brochure, a screenshot from 2023), it can be one search away from the original content instead of a dead 404.

A pre-launch audit script (`scripts/audit-seo.mjs`) walks all 16 marketing-page surfaces (8 pages × 2 locales) and verifies titles + descriptions are within Google's 60c / 160c SERP budgets, with no duplicate descriptions across pages.


## 🛠 Technologies

### Frontend
- **Next.js 16 (App Router)** — React-based framework with SSR/SSG, route groups, and built-in image optimization. Anchors the public site.
- **React 19 + TypeScript (strict mode)** — strict types from day one; no `any` without an explanation comment.
- **Tailwind v4** — design-token-based styling via the `@theme` block in `globals.css`. Mobile-first utilities, no CSS Modules, no CSS-in-JS.
- **next-intl** — internationalization (BG default, EN at `/en/...`); replaces TranslatePress from the old stack.
- **Geist Sans + Geist Mono** — typefaces, loaded via `next/font` with `cyrillic` subset included.
- **Lucide React** — icon set; brand-mark icons (GitHub, Facebook, Instagram) inlined locally because Lucide ships without them.

### CMS + Data
- **Payload CMS 3.85** — admin panel, schema-as-code, REST + GraphQL APIs. Mounted in the same Next.js repo via the `(payload)` route group.
- **`@payloadcms/plugin-seo`** — per-document SEO tab in the admin (meta title, description, image, SERP preview, character counters).
- **`@payloadcms/richtext-lexical`** — rich-text editor for blog post bodies.
- **Neon Postgres** — serverless Postgres database, scale-to-zero, Vercel-native integration.
- **`@payloadcms/storage-vercel-blob`** — media uploads stored on Vercel Blob, served directly from Blob's CDN.
- **Sharp** — server-side image processing (generates 3 size variants per upload).

### Infrastructure
- **Vercel (Hobby tier)** — frontend hosting, atomic deployments, edge network. Auto-deploys from `main`.
- **Cloudflare (Free tier)** — DNS provider + CDN + edge security. Bot Fight Mode, rate limiting on `/admin`, cache rules, Universal SSL.
- **Hostinger** — domain registrar, email host (`info@home2host.com`), and home of the original WordPress install at `old.home2host.com`.
- **GitHub** — source control, single `main` branch.

### Communications
- **`nodemailer` + Hostinger SMTP** — contact form submissions delivered to the existing `info@home2host.com` mailbox.
- **`@payloadcms/email-nodemailer`** — same SMTP transport reused for admin password-reset emails.
- **Upstash Ratelimit + Redis** — sliding-window per-IP rate limit on the contact form (5 submissions/hour) to deter spam.

### Analytics + SEO
- **`@next/third-parties`** — Google Analytics 4 integration with the same measurement ID as the old site (continuity of historical data through the launch).
- **Custom audit script** (`scripts/audit-seo.mjs`) — fetches all public URLs, extracts titles + descriptions + OG tags, flags duplicates and SERP-budget violations.


## 🚀 Running Locally

See [**Getting started locally**](docs/getting-started.md) *(coming soon — separate document covering Node version requirements, environment variables, Payload generate steps, and dev server setup)*.


## 📚 Documentation

Documentation is treated as the source of truth, not a nice-to-have:

- 🤖 [**CLAUDE.md**](CLAUDE.md) — instructions for AI assistants working in the repo
- 🏗️ [**docs/architecture.md**](docs/architecture.md) — chosen stack and *why* it was chosen
- 🗺️ [**docs/roadmap.md**](docs/roadmap.md) — stages, status, known follow-ups (Stage 0 → Stage 7)
- 📐 [**docs/conventions.md**](docs/conventions.md) — code style, naming, commit format (Conventional Commits)
- 🎨 [**docs/design-system.md**](docs/design-system.md) — tokens, visual direction, component contract
- ☁️ [**docs/cloudflare-setup.md**](docs/cloudflare-setup.md) — Cloudflare configuration reference + rollback playbook
- ✍️ [**docs/blog-post-formatting-prompt.md**](docs/blog-post-formatting-prompt.md) — reusable AI prompt for formatting blog post drafts
- 📜 [**docs/decisions/**](docs/decisions/) — ADRs for non-trivial choices (CMS, DB, styling, media storage, i18n URL structure)
- 📒 [**docs/changelog.md**](docs/changelog.md) — reverse-chronological log of completed work


## 📌 Status

Launched **2026-06-26** on `https://home2host.com`. WordPress install preserved as a live archive at `https://old.home2host.com`. Post-launch verification + handoff items are tracked in [docs/roadmap.md](docs/roadmap.md) Stage 6.


## 📝 License

Private project — not open source. All rights reserved.
