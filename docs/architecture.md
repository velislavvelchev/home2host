# Architecture

## What we're rebuilding

`home2host.com` currently runs on WordPress + Elementor + TranslatePress. The site is essentially a marketing site + blog; the "Our apartments" section is not a real property database — it's a collection of embedded Airbnb listings. So the migration is mostly: rebuilding static pages as React components, moving the blog into a CMS, and re-embedding the Airbnb listings.

## Stack

| Layer | Choice | Why (short version) |
|---|---|---|
| Frontend | Next.js (App Router) + TypeScript | React-based, SSR/SSG for speed and SEO, trivial deployment |
| CMS | Payload, same repo as the frontend | Admin panel for the business partner, schema-as-code, single stack |
| Database | Postgres (Neon vs Supabase — TBD) | Required by Payload; safer than Mongo for relational data |
| Hosting (frontend) | Vercel (free tier) | Built by the Next.js team, GitHub integration in minutes |
| Domain / DNS | Hostinger remains the registrar | Only DNS is repointed to Vercel at the very end |
| i18n | next-intl | Replaces TranslatePress; UI strings in JSON, blog uses bilingual fields in CMS |
| Analytics | Google Analytics 4 via `@next/third-parties` | Same measurement ID — historical data in GA is preserved |
| Version control | Git + GitHub | One repo for everything |

## What we replace

- Elementor → React components
- TranslatePress → next-intl
- WordPress wp-admin → Payload admin panel

## What we explicitly do NOT replace (for now)

- The Airbnb listings stay as embed widgets — no custom "apartment" entity with filters/search. If a real database of properties becomes necessary later, it's a separate feature, not part of this migration.

## Migration safety

The WordPress site stays live on the domain throughout development. The new site is built on a temporary Vercel URL (something like `home2host.vercel.app`). DNS is repointed **only at the very end**, after full verification. WordPress is **not deleted** after launch — it's kept as a rollback option for several weeks.

## Considered and rejected alternatives

See `docs/decisions/0001-payload-vs-headless-wp.md` for the reasoning behind choosing Payload over headless WordPress.