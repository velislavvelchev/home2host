# ADR 0001 — Payload CMS vs headless WordPress

**Date:** 2026-06-02
**Status:** Accepted

## Context

The current site is on WordPress. We need a CMS so that both the developer and the business partner can add content — most importantly, blog posts and new Airbnb listings. Two realistic options were considered:

1. **Payload CMS**, written in TypeScript, runs inside the same Next.js project, with a built-in admin panel.
2. **Headless WordPress**: keep WordPress alive only as a content store, expose data via REST or WPGraphQL, consume from Next.js.

## Decision

We go with **Payload CMS**.

## Reasoning

In favor of Payload:
- Schema defined as TypeScript code (collections). Matches the "SOLID + understandable" goal.
- Built-in admin panel — the business partner gets a clean UI without touching code.
- Single stack: one repo, one language (TypeScript), one deployment.
- Native multilingual support at the field level.
- Full ownership of the code — no opaque PHP plugins.

In favor of headless WordPress (the rejected option):
- The business partner already knows the WordPress admin interface.
- Migration of existing blog posts would be trivial.

Against headless WordPress:
- Drags WordPress along as infrastructure — separate hosting, separate maintenance, separate attack surface.
- The whole point of this project is to leave WordPress behind, not to keep it on life support.
- PHP/MySQL hosting requirements complicate deployment.

The headless WordPress option would have won only if "change nothing for the business partner" had been the dominant priority. It isn't — both parties want a clean, modern, owned stack.

## Consequences

- Need a Postgres (or Mongo) instance. Provider choice deferred to Stage 1.
- The business partner has a one-time learning curve for the new admin panel.
- Existing blog posts (if any) must be migrated manually or via a small one-off script.
