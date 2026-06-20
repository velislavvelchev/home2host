# SEO quality assurance for home2host — direction

**Status:** decided 2026-06-20. Replaces the earlier "Yoast-style scoring panel"
plan after a reframe with the owner.
**Date opened:** 2026-06-19 (research)
**Date decided:** 2026-06-20 (reframe + commit)
**Trigger:** owner-requested 2026-06-16 (Stage 5 bullet). Owner showed a
screenshot of Yoast SEO inside WordPress and asked for the same kind of
real-time scoring panel inside Payload admin — for every content type, both BG
and EN.
**Why this doc exists:** the first research pass investigated *how to clone
Yoast inside Payload*. On reading the result, the owner pushed back that the
architecture was too complicated and mixed, and asked the better question:
**"what's the standard way Next.js apps make sure their SEO is doing great?"**
This doc records the answer to that question and the simpler direction we
landed on — plus the abandoned-cloning research at the bottom, for record.

---

## TL;DR

**Drop the custom scoring panel idea.** It's a WordPress-era pattern that
solves a problem we don't have. The standard Next.js stack already covers the
SEO fundamentals; for the editor experience, ship a small focused set instead:

1. **Install `@payloadcms/plugin-seo`** — gives the owner meta-title + meta-
   description fields with character counters + a live Google SERP-snippet
   preview per collection / global. This is the bottom half of the Yoast
   screenshot and the only editor-facing piece worth shipping.
2. **External-tools menu in the Payload admin top bar** — single source of
   truth for the dashboards the owner actually uses (Search Console after
   launch, Vercel, the live site, Lighthouse / PageSpeed, etc.). Tiny custom
   admin component, no new dependencies.
3. **Stage 6 already covers the measurement loop** — Google Search Console
   verification + Lighthouse pass on the Vercel preview before DNS switch.
4. **For draft-content review** — the owner pastes the draft into an AI chat
   (ChatGPT/Claude). More useful than any rules-based analyzer we could ship,
   works in Bulgarian natively, zero maintenance.

No new content-analysis engine, no GPL license decision, no two-engine BG/EN
split, no Web Worker. The Stage 5 roadmap bullet collapses from "multi-week
build" to "~half a day for plugin-seo + ~half a day for the icon menu."

---

## How standard Next.js sites handle SEO

Three layers, none of which require building a custom analyzer in the CMS:

### Layer 1 — Framework fundamentals (we already have these)

Next.js + the App Router cover the entire *technical* SEO checklist out of
the box. We have all of this shipped:

- Server-side rendering (crawlable HTML — the single biggest gap WordPress
  used to plug)
- Per-page `Metadata` API: title, description, canonical, OG, Twitter card
- `sitemap.ts` with hreflang pairs for BG/EN
- `robots.ts` allowing public content, disallowing `/admin` + `/api`
- `next/image` for Core Web Vitals (CLS, LCP)
- JSON-LD `LocalBusiness` structured data in the layout
- Legacy-URL 308 redirects (preserve Google rankings through the DNS switch)
- `trailingSlash: true` to match live WP shape exactly

In WordPress, Yoast does most of this *because WordPress doesn't*. In Next.js,
the framework does it; Yoast's reason for existing largely evaporates.

### Layer 2 — Editor metadata UX (one plugin, that's it)

The official [`@payloadcms/plugin-seo`](https://payloadcms.com/docs/plugins/seo)
ships:

- A meta-fields group per collection (title, description, image)
- Character counters with green / yellow / red bands
- A live Google search-result preview that updates as you type
- Extensible custom fields (e.g. og:title overrides)

That's the part of Yoast editors actually use day-to-day. The "focus
keyphrase" traffic-light theatre on top is largely 2010s SEO mythology.

### Layer 3 — Content quality measured outside the editor

Real SEO loops happen against real Google data, not against a rules engine
running in your CMS:

- **Google Search Console** — the official authority on what Google indexes,
  what queries surface your pages, what's broken. Free. **Already on the
  Stage 6 list.** This is the actual measurement loop.
- **Lighthouse / PageSpeed Insights** — Google's own audit, covers SEO + a11y
  + performance + best practices. Built into Chrome DevTools, also runs from
  pagespeed.web.dev against the live URL. **Worth running before each
  significant deploy.**
- **Vercel Speed Insights** — Core Web Vitals in production from real
  visitors (not synthetic). Already a Vercel feature, just needs enabling.
- **AI assistant on the draft** — for "is this article SEO-good?" feedback
  while writing, pasting the draft into ChatGPT or Claude is *more* useful
  than Yoast's traffic lights, works fluently in Bulgarian, and costs nothing.

### Why not the Yoast-style scoring panel

Three reasons the first research pass should have surfaced:

- **Google publicly rejects keyword density as a ranking signal.** Modern
  Google ranking (post-2022 "Helpful Content Update") leans on perceived
  content quality and E-E-A-T (Experience, Expertise, Authority, Trust) —
  neither of which any algorithm running in our admin can measure. Yoast's
  green dot does not correlate with rankings; experienced SEOs treat it as
  noise.
- **The BG gap was a tell that the abstraction is wrong.** If the "best"
  library option for Bulgarian is to roll our own counters because nothing
  exists, that's a sign there's nothing real to measure that we couldn't
  eyeball or ask Claude about.
- **The complicated architecture I previously proposed was complicated
  *because the goal was wrong.*** Two scoring engines + a Web Worker + a
  GPL license decision + a rules library to trial + plugin-seo on top —
  all to recreate a panel whose advice is largely outdated. Dropping the
  scoring panel collapses every one of those decisions.

---

## What we're actually shipping

### Item 1 — Install `@payloadcms/plugin-seo`

Add the meta-fields + SERP preview to every content type that gets indexed.
Scope at install time:

- `blog-posts` collection (priority — long-form indexed content)
- `apartments` collection (cards link to Airbnb, but `/apartments/` itself
  is indexed)
- `landing-page`, `about`, `services`, `pricing-plans`, `contacts` globals
  (all map to indexed routes)

`faqs` collection and `social-links` global don't need SEO meta — they don't
have their own URLs.

Implementation:

```ts
import { seoPlugin } from "@payloadcms/plugin-seo";

plugins: [
  vercelBlobStorage({ ... }),
  seoPlugin({
    collections: ["blog-posts", "apartments"],
    globals: ["landing-page", "about", "services", "pricing-plans", "contacts"],
    uploadsCollection: "media",
    generateTitle: ({ doc }) => `${doc?.title || ""} — Home2Host`,
    generateDescription: ({ doc }) => doc?.excerpt || "",
    tabbedUI: true,
  }),
],
```

Many of the affected collections/globals already have hand-rolled
`metaTitle` + `metaDescription` fields (added during the Priority C–E
slices). On installing the plugin, those should be removed and replaced
with the plugin's `meta` field group so we have a single source of truth.
That's a small data-migration task to plan: the `<page>.metadata.ts` files
that read from the globals also need updating to read from the new
`meta.title` / `meta.description` instead of the bare fields.

### Item 2 — External-tools icon menu in the admin top bar

A small Payload custom admin component that renders a row of icon links to
the dashboards the owner uses. Clicked → opens in a new tab.

Scope is owner-confirmed below ("Open question — link list"). Likely
includes Search Console (post-launch), Vercel, the live site, Lighthouse /
PageSpeed Insights, possibly GA4 / Vercel Blob / GitHub repo / Upstash.

Implementation shape (concise):

```ts
// src/components/admin/ExternalToolsMenu.tsx
import { ExternalLink } from "lucide-react";
// renders a row of <a target="_blank" rel="noopener"> with icons
// configuration is a single LINKS array at the top of the file
```

Wired in `payload.config.ts` via the root `admin.components.actions` slot.
Refresh the import map (`npm run generate:importmap`) after registration.

Zero new dependencies (`lucide-react` is already in the project). No state,
no fetch, no auth. ~30–60 minutes of work end-to-end.

### Item 3 — Pre-launch Stage 6 additions

Already on the Stage 6 list, but call out for completeness:

- Google Search Console verification (after DNS switch)
- Lighthouse pass on the Vercel preview URL pre-launch
- Optionally: enable Vercel Speed Insights for production CWV monitoring

---

## Open question (one, not three)

Confirm the link set for the external-tools menu. Sensible starting set:

- **Live site (production)** — `https://home2host.vercel.app` today,
  `https://home2host.com` after the Stage 6 DNS switch
- **Google Search Console** — `https://search.google.com/search-console`
  (becomes useful post-launch; harmless to ship now)
- **PageSpeed Insights** — `https://pagespeed.web.dev/` (pre-filled with
  the prod URL would be even nicer, but not required)
- **Vercel project** — `https://vercel.com/<team>/home2host`
- **GitHub repo** — `https://github.com/velislavvelchev/home2host`
- **Google Analytics 4** — link straight to the property dashboard

Less essential but worth considering:

- **Vercel Blob** (media storage dashboard)
- **Upstash Redis** (rate limit dashboard)
- **Neon Postgres** (DB console)
- **Hostinger webmail** (info@home2host.com inbox)

---

## Appendix — abandoned Yoast-clone research (2026-06-19)

Kept for record only. The reframe on 2026-06-20 made these findings
non-load-bearing — but if anyone in future wants to revisit "should we
build a Yoast-style scoring panel after all," this is the answer.

### What we ruled out

- **Embedding Yoast itself.** No supported path. Yoast SEO is a WordPress
  plugin; no iframe-embeddable hosted variant, no public SaaS / REST API,
  no standalone browser extension that exposes the Yoast UI.
- **`react-yoastseo`** — last release June 14, 2021 (v1.1.0). React 17 /
  yoastseo 1.x peer-pinned. Repo 404 on GitHub, Snyk INACTIVE. Unusable on
  our React 19 / Next.js 15 stack without a fork-and-rewrite.
- **`@payloadcms/plugin-seo` as a complete solution.** Metadata only —
  fields + SERP preview. No content scoring. (This is fine; it's *exactly*
  what we want for the new direction.)

### `yoastseo` npm package (the analysis engine)

- Latest 3.6.0 (Feb 2026), active but slow cadence (issue
  [#17899](https://github.com/Yoast/wordpress-seo/issues/17899) open since
  2021).
- **License: GPL-3.0**, not MIT. Strong copyleft. Was the most
  consequential finding — bundling it into the admin React tree would
  trigger a license decision. Sidestepped by not using it.
- **No Bulgarian support.** Yoast covers ~21 languages for SEO assessments,
  readability, and word-form recognition; Bulgarian is absent across all
  three feature tables. Other Cyrillic-script languages (Russian) are
  supported — the gap is per-language linguistic resources, not script.
- Embeddable in non-WP JS apps via documented web-worker / React / bare
  patterns. Two Sanity community plugins do this:
  [sanity-plugin-seo-pane](https://github.com/sanity-io/sanity-plugin-seo-pane)
  and [LiahMartens/sanity-plugin-seo-tools](https://github.com/LiahMartens/sanity-plugin-seo-tools).

### Payload v3 admin integration (still relevant for Item 2)

The same primitives we'd have used for the scoring panel are also what
the external-tools menu uses:

- Custom React components register via file-path strings in
  `admin.components.<slot>` and `admin.importMap.baseDir`. After any
  registration change, run `npm run generate:importmap` (architecture
  doc, ADR-equivalent).
- For top-bar additions, the relevant slot is the root
  `admin.components.actions` array.
- For per-document field components (the original Yoast-panel use case),
  it's `type: 'ui'` fields with `admin.components.Field` pointing at a
  React component path.
- Reactive form hooks (`useFormFields` with selectors, `useField`,
  `useLocale`) are available for components that need to read the
  document's live values — not needed for the external-tools menu, but
  good to know they exist.

### Sources (research provenance)

- [npm: yoastseo (versions)](https://www.npmjs.com/package/yoastseo?activeTab=versions)
- [Yoast/wordpress-seo · packages/yoastseo](https://github.com/Yoast/wordpress-seo/tree/trunk/packages/yoastseo)
- [yoast.com/features/languages/](https://yoast.com/features/languages/)
- [yoast.com/help/features-per-language/](https://yoast.com/help/features-per-language/)
- [npm: react-yoastseo](https://www.npmjs.com/package/react-yoastseo)
- [Payload v3 docs — Custom Admin Components](https://payloadcms.com/docs/admin/components)
- [Payload v3 docs — React Hooks](https://payloadcms.com/docs/admin/react-hooks)
- [Payload v3 docs — UI Field](https://payloadcms.com/docs/fields/ui)
- [Payload v3 docs — SEO Plugin](https://payloadcms.com/docs/plugins/seo)
- [github.com/payloadcms/plugin-seo](https://github.com/payloadcms/plugin-seo)
- [npm: readability-cyr](https://www.npmjs.com/package/readability-cyr)
- [github.com/Amice13/readability-cyr](https://github.com/Amice13/readability-cyr)
- [github.com/retextjs/retext-readability](https://github.com/retextjs/retext-readability)
- [github.com/sanity-io/sanity-plugin-seo-pane](https://github.com/sanity-io/sanity-plugin-seo-pane)
- [github.com/LiahMartens/sanity-plugin-seo-tools](https://github.com/LiahMartens/sanity-plugin-seo-tools)
