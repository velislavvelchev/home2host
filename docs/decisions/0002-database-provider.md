# ADR 0002 — Database provider: Neon

**Date:** 2026-06-05
**Status:** Accepted

## Context

Payload (chosen in [ADR 0001](0001-payload-vs-headless-wp.md)) requires a database. We use Postgres rather than MongoDB — Payload supports both, but Postgres is safer for the kind of relational content this site will hold (BlogPost ↔ Author, Apartment ↔ Service ↔ PricingPlan, etc.) and has a richer hosted-provider ecosystem.

We need a hosted Postgres because:

- We don't want to run and maintain a database server ourselves.
- The free tiers of modern hosted Postgres are generous enough for a marketing site + blog at this scale.
- Migrating away later is straightforward — both providers are real Postgres, so the exit path is `pg_dump` + `pg_restore`.

Two realistic options were considered:

1. **Neon** — serverless Postgres with scale-to-zero and per-branch databases.
2. **Supabase** — Postgres bundled with auth, storage, realtime, and edge functions.

## Decision

We go with **Neon**.

## Reasoning

### In favor of Neon

- **Scope matches.** We only need a database. Payload already provides the admin UI, authentication for content editors, and media handling. Supabase's auth/storage/realtime/edge-functions would be dead weight — more surface area to learn, more dashboard noise, with nothing in the project using them.
- **Vercel-native.** Vercel acquired Neon in 2025; provisioning is one-click from the Vercel dashboard and environment variables are wired automatically. Supabase works on Vercel, but it's the standard-integration path rather than the native one.
- **DB branching matches our deploy flow.** Each git branch can have its own database branch, so preview deployments work against isolated data. This pairs cleanly with the Stage 6 launch plan, where the partner reviews on a Vercel preview URL without polluting production data. Supabase free-tier does not provide this.
- **Scale-to-zero.** A low-traffic marketing site spends most of its time idle. Neon stops billing compute when nothing is querying. The free tier becomes genuinely free, not a trial.
- **Smaller mental model.** A SQL console and branches — that's the dashboard. Less to teach the partner, less for us to navigate.

### In favor of Supabase (rejected)

- A richer dashboard (table editor, auth UI, storage UI).
- Auth, storage, realtime, and edge functions in one place — useful if we ever needed them.
- Slightly larger free database (500 MB vs Neon's ~0.5 GB — roughly parity).

### Against Supabase

- Every feature beyond the database is wasted on this project. Payload's admin gives editors a far better authoring experience than Supabase's raw table view.
- More concepts on the dashboard mean more cognitive load for a partner who will only ever touch Payload anyway.
- Vercel integration is functional but not the path-of-least-resistance the way Neon is.
- Free-tier projects pause after a week of inactivity and need a manual unpause — awkward for a site that may sit idle between content updates.

## Consequences

- The database is provisioned through the Vercel dashboard (Storage → Neon) so env vars (`DATABASE_URL`, `POSTGRES_URL`, etc.) are injected into all deployments automatically.
- A separate Neon branch is created for local development. The connection string for local dev lives in `.env.local` and is never committed.
- Payload uses `@payloadcms/db-postgres` as the adapter. No MongoDB-only Payload features will be relied upon.
- Preview deployments use Neon branch-on-PR (configured later, in Stage 5 or Stage 6 once the workflow stabilizes).
- The open question in [roadmap.md](../roadmap.md) Stage 1 ("Neon vs Supabase — to be decided") is now resolved.
- If we ever outgrow Neon's free tier or need features it doesn't offer, migration is a standard Postgres dump/restore — not a rewrite.

## Notes on tradeoffs we accept

- **Cold start.** Scale-to-zero means the first query after an idle period takes ~200–500 ms longer than a warm one. For a marketing site whose pages are mostly statically generated (SSG/ISR), the database isn't on the per-request path for most traffic. Dynamic routes (contact form submit, draft preview) will see the latency; we accept it.
- **Free-tier ceiling.** 0.5 GB storage is comfortable for a blog with hundreds of posts. We'd outgrow it only if a real apartment database were added later — explicitly out of scope per [architecture.md](../architecture.md).
- **Vendor risk.** Neon is younger than Supabase, but Vercel-owned now, and the underlying engine is plain Postgres — the worst case is a `pg_dump` to a different provider.
