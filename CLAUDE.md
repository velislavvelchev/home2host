# CLAUDE.md

# home2host — project context for Claude Code

Modernization of home2host.com (WordPress → Next.js). Read these before any task:

- @docs/architecture.md — chosen stack and *why* (includes the project layout: parallel `(frontend)` + `(payload)` route groups, and local dev setup)
- @docs/roadmap.md — stages, status, what's next (and the "Known follow-ups" section for deferred small items)
- @docs/conventions.md — code style, naming, commit format
- @docs/design-system.md — tokens, visual direction, component contract

## At a glance

Property management business for short-term rentals (Airbnb/Booking) in Bansko and Burgas.
Mostly marketing site + blog. "Apartments" section is Airbnb embeds, not a custom DB.
Old WordPress stays live on the domain throughout; new site builds on Vercel preview URL.
Domain switches to Vercel only at the final launch step.

## Stack (one-liner; see architecture.md for reasoning)

Next.js (App Router) + TypeScript · Payload CMS in same repo · Postgres (TBD: Neon vs Supabase) · Vercel hosting · next-intl for i18n · GA4 via @next/third-parties

## Always

- Explain **why** before writing code. User wants to understand, not paste blindly.
- SOLID, but readable. No over-abstraction.
- Conventional Commits for messages: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`.
- TypeScript strict mode.
- Comments only when intent isn't obvious from the code.

## Never

- Don't touch or modify the live WordPress site.
- Don't add dependencies without explaining trade-offs (size, maintenance, lock-in).
- Don't generate filler comments like `// imports` or `// constructor`.
- Don't assume — ask if the spec is unclear.

## Working method

- File-by-file, one logical chunk per task.
- After completing a task, append a dated one-line entry to `docs/changelog.md`.
- For architectural decisions (DB choice, auth approach, deployment changes), create a new ADR in `docs/decisions/` numbered sequentially.
