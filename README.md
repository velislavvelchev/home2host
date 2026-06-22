# home2host

Modernization of [home2host.com](https://home2host.com) — WordPress → Next.js migration.
Property-management business for short-term rentals (Airbnb/Booking) in Bansko and Burgas.

The new site is live on the Vercel preview URL today; DNS only switches at the
final launch step, per the migration-safety plan in
[docs/architecture.md](docs/architecture.md).

## Quickstart

```bash
# 1. Use the right Node version (the project pins via .nvmrc + engines).
nvm install      # reads .nvmrc
nvm use

# 2. Install dependencies. package-lock.json pins the entire transitive
#    tree by integrity hash — `npm ci` (clean install) is reproducible.
npm install      # or `npm ci` if package-lock should be authoritative

# 3. Fill in environment variables. Two paths:
#    (a) If you have access to the Vercel project, fastest is:
vercel link
vercel env pull .env.local
#    (b) Otherwise, copy the example and fill values from each provider:
cp .env.local.example .env.local
#        Then edit .env.local — see comments in the file for what each var is.

# 4. Run the dev server.
npm run dev      # frontend on http://localhost:3000
                 # Payload admin on http://localhost:3000/admin
```

## Stack

Next.js (App Router) + TypeScript · Payload CMS (same repo) · Neon Postgres ·
next-intl (BG default, EN at `/en/...`) · Tailwind v4 · Vercel hosting.
Full reasoning in [docs/architecture.md](docs/architecture.md).

## Project structure

- `src/app/(frontend)/` — public marketing site
- `src/app/(payload)/` — Payload admin + REST/GraphQL API
- `src/payload.config.ts` — Payload schema (collections + globals)
- `src/components/` — shared UI
- `messages/{bg,en}.json` — i18n strings
- `docs/` — architecture, roadmap, conventions, design system, ADRs

The parallel-root-layouts pattern (`(frontend)` + `(payload)` route groups,
each with its own `<html>`/`<body>`) is non-negotiable — see
[docs/architecture.md](docs/architecture.md) for the "we learned this the
hard way" history.

## Scripts

| command | what it does |
|---|---|
| `npm run dev` | Next.js dev server (frontend + admin) |
| `npm run build` | production build |
| `npm run start` | run the production build locally |
| `npm run lint` | eslint |
| `npm run generate:types` | regenerate `src/payload-types.ts` after editing `payload.config.ts` |
| `npm run generate:importmap` | regenerate the admin import map after adding a custom field component |

After any change to `payload.config.ts`:
- always run `generate:types`
- run `generate:importmap` too if you added/removed a field with a custom component (e.g. Lexical editor changes, custom field UI). Skipping this surfaces as `PayloadComponent not found in importMap` errors in admin.

## Docs

The repo treats docs as the source of truth, not a nice-to-have:

- [CLAUDE.md](CLAUDE.md) — instructions for AI assistants working in the repo
- [docs/architecture.md](docs/architecture.md) — chosen stack and *why*
- [docs/roadmap.md](docs/roadmap.md) — stages, status, known follow-ups
- [docs/conventions.md](docs/conventions.md) — code style, naming, commit format
- [docs/design-system.md](docs/design-system.md) — tokens, visual direction, component contract
- [docs/decisions/](docs/decisions/) — ADRs for non-trivial choices (DB, styling, media, i18n)
- [docs/changelog.md](docs/changelog.md) — reverse-chronological log of completed work
