# ADR 0006 — Rendering & caching strategy: static pages with on-demand revalidation

**Date:** 2026-08-28
**Status:** Accepted

## Context

Post-launch, the live site felt sluggish compared to a peer site (`myflat.bg`). Measured from Bulgaria: `home2host.com` served its home page with a **~1.2s TTFB warm** and a **~6.5s cold start**, versus `myflat.bg` at **~0.3s**.

Investigation found the cause was **not** the Vercel Hobby tier (compute speed is identical to Pro). Every public page was rendering **dynamically — server-rendered per request**, hitting the Neon database (Frankfurt) on every visit, from a serverless function that defaults to the US region (`iad1`). Two root causes, in priority order:

1. **The frontend root layout read the theme cookie server-side** (`(await cookies()).get("theme")`) to render `<html class="dark">` without a flash. `cookies()` is a Next.js dynamic API — its mere presence forces the entire route subtree (layout + every page) into dynamic rendering, unconditionally. This was the dominant cause: even fully cached data reads couldn't make the pages static while this call existed.
2. **CMS reads weren't cached** — once (1) is fixed, pages would either freeze content at build time (stale) or need per-request DB hits to stay fresh.

The content is CMS-driven (Payload → Neon): the owner edits Globals, blog posts, apartments, reviews, etc. in the admin, and those edits must appear on the live site promptly without a redeploy.

## Decision

**Render the public marketing site as static HTML (SSG), and refresh it on demand when content changes via Payload hooks.** Concretely:

1. **Move theme application off the server.** The layout no longer calls `cookies()`. A tiny blocking inline script in `<body>` reads the same `theme` cookie before first paint and adds the `dark` class to `<html>`. `<html>` carries `suppressHydrationWarning`. Result: no FOUC, theme persists across loads and navigation, and the layout is statically renderable. (The `ThemeToggle` component is unchanged — it still writes the cookie and flips the class.)
2. **Let pages render statically.** With the dynamic API gone, all frontend routes prerender at build via `generateStaticParams` (per locale). Removed the blog list's `export const dynamic = "force-dynamic"`.
3. **Revalidate on content change.** A shared `afterChange` / `afterDelete` hook is attached to every content collection and global in `payload.config.ts` (skipping `users`). It calls `revalidatePath("/", "layout")`, invalidating every cached route so the next request regenerates with fresh data. `next/cache` is dynamic-imported inside the hook (so the standalone Payload CLI never loads it) and wrapped in try/catch (so a revalidation outside a request context can never block a save).
4. **Co-locate the serverless region with the database.** `vercel.json` pins functions to `fra1` (Frankfurt), next to Neon and the Bulgarian audience. Single-region is free on Hobby.

## Reasoning

### Why static + on-demand revalidation (chosen)

- **It targets the actual bottleneck.** Static pages are served from Vercel's edge CDN — no function invocation, no cold start, no DB round-trip on the hot path. The measured local TTFB dropped from ~1.2s (dynamic) to ~20ms (static-cached); on the real deployment this lands the site in the peer's ~0.3s range instead of 1.2s.
- **Freshness is preserved.** On-demand revalidation means an owner edit appears within a request or two — not on a timer, not only on redeploy. Best of both: cached-fast serving *and* prompt updates.
- **$0.** The whole fix is architectural — no plan upgrade. (Hobby-vs-Pro is a separate decision about commercial licensing, usage alerts, and headroom — not performance.)

### Why not per-read caching with `revalidateTag`

We considered wrapping all ~22 CMS reads in `unstable_cache` with tags and revalidating tags in the hooks. Rejected for this site: it's a large, error-prone editing surface, and it's unnecessary — once the pages are static (SSG), their data reads only run at build/regeneration, not per request, so per-request speed is already solved without per-read caching. `revalidatePath("/", "layout")` is a coarser but reliable invalidation that doesn't depend on getting a tag on every single read.

### Why coarse invalidation (`revalidatePath("/", "layout")`) is acceptable

Content edits are infrequent and the site is small, so regenerating all pages on any edit is cheap. The alternative — per-collection/global tags mapped to the exact routes that consume them — buys nothing here (the Contacts global alone is used on every page via the footer) and adds bookkeeping that can silently drift out of date.

### Why an inline theme script instead of keeping the server cookie

The server-cookie approach was the *only* thing forcing dynamic rendering. A pre-paint inline script is the standard, dependency-free way every static site does dark mode (it's what `next-themes` does internally). We kept the cookie as the store (so existing dark-mode visitors keep their preference) and only moved *where it's read* — from the server to a pre-paint client script.

## Consequences

- **The whole public site is SSG.** Build output shows `● (SSG)` for `/[locale]` and every section/blog route (both `/bg` and `/en`); only `/admin` and `/api/*` remain `ƒ Dynamic`, which is correct.
- **Builds now read the DB for every page × locale** during static generation. Already true for `generateStaticParams`; the build has `.env.local` creds.
- **A content edit lazily regenerates all pages.** First visitor after an edit may trigger regeneration (served the previous cached copy meanwhile, per stale-while-revalidate); subsequent visitors get the fresh copy from cache.
- **Theme is applied client-side.** The only theoretical FOUC risk is a hard refresh, mitigated by running the script before paint. Client-side navigation is unaffected (the `dark` class simply persists on the document).
- **Media changes revalidate too** (the hook is on the `media` collection), so a replaced image propagates.
- **`vercel.json` now pins `fra1`.** If we ever need multi-region, that requires Pro.

## Notes on trade-offs we accept

- **Coarse revalidation** regenerates more than strictly necessary on each edit. Negligible at this scale; revisit with tagged reads only if edit frequency or page count grows enough to matter.
- **Static pages can't vary per visitor.** That's fine — nothing on these pages is per-user except theme, which is now handled client-side. (The contact form is a server action / POST, unaffected by page caching.)
- **The pre-paint inline script** is a small amount of hand-written JS in the layout. Kept minimal (one cookie regex, try/catch) and documented inline. Preferred over adding `next-themes` as a dependency for what is a simple two-state toggle.
- **`revalidatePath("/", "layout")` relies on Next's documented "revalidate everything under the root layout" behavior.** Verified in build + local production server; if a specific locale/route is ever found not to invalidate, escalate that route to a tagged read.
