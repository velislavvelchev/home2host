# Changelog

Reverse chronological. One line per completed task. Dates in YYYY-MM-DD format.

## 2026-06-08

- feat: enable BG/EN localization in Payload and add Media collection (bg default, en fallback; alt text localized; thumbnail/card/hero image sizes) — Stage 2 kickoff

## 2026-06-05

- feat: integrate Payload CMS v3 backed by Neon Postgres — admin at /admin, REST + GraphQL under /api, marketing site moved to (frontend) route group so each owns its own root layout; `--use-swc` workaround for Node 24 + Payload CLI; Stage 1 closed
- chore: provision Neon Postgres via Vercel Storage (Frankfurt, free tier) and link project locally; Vercel imports the GitHub repo and auto-deploys main to home2host.vercel.app
- docs: ADR 0002 — pick Neon as the Postgres provider (Vercel-native, scale-to-zero, per-branch DBs); Supabase rejected as scope-mismatched for a Payload-backed marketing site
- feat: lay down design-system foundation — @theme tokens (brand indigo anchored at #122C69, neutrals, semantic colors, Geist type scale, spacing/radii/shadows/motion), light+dark via CSS-variable swap, smoke-test home page exercises the tokens

## 2026-06-04

- docs: close Stage 0 — content-inventory.md now lists deferred follow-ups (footer copy, EN translations, blog post bodies, apartment labels, tone-of-voice, vector logo)
- docs: download active site images + logo master to docs/inventory/images/ (2.37 MB; no SVG logo found on server)
- docs: capture EN site raw HTML for all 8 pages to docs/inventory/raw/en/ (1.46 MB; markdown extraction deferred)
- docs: capture content inventory from live home2host.com (raw HTML of all 8 pages, body text per page, brand colors + fonts, image URL list)
- docs: reconcile roadmap with actual project state and ADR 0003
- chore: scaffold Next.js 16 app (TypeScript strict, App Router, src/, ESLint, Tailwind v4) at repo root

## 2026-06-02

- chore: scaffold project context (CLAUDE.md + docs/ structure)
- chore: initialize git repo and connect to GitHub (velislavvelchev/home2host)
- chore: set up local environment (Node v24.16.0, npm 11.13.0, Git 2.48.1)