# Editor-facing SEO assessment in Payload admin — build-vs-adopt research

**Status:** research complete, decision pending. Closed only after the three open
questions at the bottom are answered.
**Date:** 2026-06-19
**Trigger:** owner-requested 2026-06-16 (Stage 5 bullet). Owner showed a screenshot
of Yoast SEO inside WordPress and asked for the same kind of real-time scoring
panel inside Payload admin — for **every** content type, not just blog — and for
**both** BG and EN.
**Why this doc exists:** capture the research findings so we can pick a direction
on a later day without redoing the research. Decisions land in an ADR; this is
just the prep.

---

## TL;DR

No off-the-shelf solution covers the home2host case (Yoast-style real-time
scoring in Payload v3 admin, Bulgarian-first, multi-collection).

The realistic shape is a **hybrid build**:

1. Adopt the official `@payloadcms/plugin-seo` for **metadata fields + SERP
   preview** (the bottom half of the Yoast screenshot — meta title, description,
   social image, character counters, live Google snippet). It already does that
   part well; reinventing it would be busywork.
2. Build **one custom `type: 'ui'` field component** ("SEO assessment") that
   attaches to every collection/global that needs it. It does the **scoring**
   part Yoast does (the top half of the screenshot — focus keyphrase, traffic
   lights, suggestion list).

Within the custom component, two scoring paths:

- **EN content** → run [`yoastseo`](https://www.npmjs.com/package/yoastseo) (the
  open-source analysis engine that powers Yoast itself).
- **BG content** → run a small in-house rules-based analyzer. Optionally backed
  by [`readability-cyr`](https://github.com/Amice13/readability-cyr) for
  Cyrillic-aware readability stats.

Trade-offs and open decisions are at the bottom.

---

## What we ruled out

### Embedding Yoast itself

No supported path exists. Yoast SEO is a WordPress plugin. There is no:

- iframe-embeddable hosted Yoast,
- public SaaS / REST API for Yoast scoring,
- standalone browser extension that exposes the Yoast UI.

Yoast's *content-analysis engine* is published separately as the `yoastseo` npm
package — that's the only Yoast-branded option for non-WP apps. It does not ship
a UI; you build the UI yourself.

### `react-yoastseo` (the only existing React wrapper)

Effectively abandoned. Last release **June 14, 2021** (v1.1.0). Peer dependencies
pin `react@^17.x` and `yoastseo@^1.x`. Upstream repo is 404 on GitHub. Snyk
classifies it INACTIVE.

Our stack is Next.js 15 / React 19 / `yoastseo` 3.x. Adopting it would mean
forking and modernizing — not less work than wiring `yoastseo` directly.

### `@payloadcms/plugin-seo` as a complete solution

The official Payload plugin is **metadata-only**:

- meta title, description, image fields,
- character counters,
- real-time SERP (Google search result) preview snippet.

The docs explicitly say the UI "might feel familiar to Yoast users" — that
comparison is purely visual (the SERP preview), not analytical. No content
scoring, no keyphrase analysis, no readability. We will use it for what it
*does* cover and supplement with a custom panel for the rest.

---

## What we'll use

### `yoastseo` npm package (for EN scoring)

- **Latest version:** 3.6.0 (Feb 2026).
- **Maintenance:** active but slow cadence. Standalone npm releases are not a
  Yoast priority (issue [#17899](https://github.com/Yoast/wordpress-seo/issues/17899)
  open since 2021 with no Yoast staff response). The package isn't dead — 3.6.0
  did ship — but don't expect rapid upstream fixes.
- **License: GPL-3.0** (not MIT). **This is the most consequential finding.**
  Strong copyleft. Bundling `yoastseo` into the Payload admin React tree is
  normal in-house use, but if home2host is ever open-sourced or distributed,
  GPL-3.0 may extend to the surrounding admin code. **Decision needed before
  installing the package.** See "Open questions" below.
- **Bulgarian support: none.** Yoast's official language tables cover ~21
  languages for SEO assessments, readability, and word-form recognition.
  Bulgarian appears in none of them. Other Cyrillic-script languages (Russian)
  *are* supported — so the gap is per-language linguistic resources, not a
  script-level limitation. Means: `yoastseo` is **EN-only** for our purposes.
- **What it exports** (per the package README): a documented JS API with three
  integration patterns — bare-bones `AbstractResearcher` + `Paper`, Webpack +
  web-worker, and a React example. The web-worker pattern is the one we want —
  keeps the analysis off the main thread so keystrokes stay responsive.
- **Embeddable in non-WP JS apps?** Yes. Sanity has two community plugins that do
  exactly this — [`sanity-plugin-seo-pane`](https://github.com/sanity-io/sanity-plugin-seo-pane)
  and [`LiahMartens/sanity-plugin-seo-tools`](https://github.com/LiahMartens/sanity-plugin-seo-tools)
  — both wrap `yoastseo` into a Sanity Studio panel. Confirms the pattern is
  viable; we're doing the same in Payload.

### `readability-cyr` (for BG readability — needs trial)

- A Cyrillic-aware readability library surfaced in the research, by
  [Amice13/readability-cyr](https://github.com/Amice13/readability-cyr).
- Claims to handle Cyrillic tokenization + a few readability scores. **Has not
  been verified hands-on yet** — trial before committing.
- Worst case: skip the library and roll our own counters (sentence length,
  paragraph length, word count) on Cyrillic-aware string ops, which is ~50
  lines of code and zero dependencies.

### `@payloadcms/plugin-seo` (for metadata + SERP preview)

- Official Payload plugin, current v3.79.0.
- Renders a meta-fields group + live Google preview that updates as you type.
- Extensible — we can add custom fields (e.g. og:title overrides) per collection.
- Will be installed alongside the custom scoring component.

---

## Payload v3 integration plan

Payload v3 has all the primitives we need. None of this is exotic.

### Component shape: `type: 'ui'` field

Payload's [UI Field](https://payloadcms.com/docs/fields/ui) is purpose-built for
presentational widgets that observe other fields but **persist nothing** to the
document. It's exactly the shape Yoast's panel has: it reads everything else on
the form and renders scores; it doesn't store its own data.

Configuration shape (per the docs):

```ts
{
  name: 'seoAssessment',
  type: 'ui',
  admin: {
    components: {
      Field: '@/components/admin/SeoAssessment#SeoAssessment',
    },
    position: 'sidebar', // or main column; sidebar matches the Yoast layout
  },
}
```

The same field block can be appended to every collection/global that needs the
panel (BlogPost, Hero global, About/Services/Pricing globals, etc.).

### Reactive hooks (sufficient for live scoring)

Payload v3 exposes the React hooks a live-scoring sidebar needs:

- [`useFormFields`](https://payloadcms.com/docs/admin/react-hooks#useformfields)
  — Redux-like selector pattern, **only re-renders when the selected fields
  change**. Subscribe to `title`, `meta.description`, `slug`, `body`, etc.
  individually so keystrokes on unrelated fields don't trigger rescoring.
- `useAllFormFields` — whole-form read with `reduceFieldsToValues` /
  `getSiblingData` helpers. Use sparingly (re-renders on every form change).
- `useField` — single-field hook returning `{ value, setValue, errorMessage,
  formInitializing, formProcessing, ... }` — for the per-collection
  focus-keyphrase input.
- `useLocale` — returns `{ code, label, rtl }`. We branch on `code === 'bg'`
  vs `'en'` to pick the scoring path.

### Where the component lives in the repo

Tentative layout (decide at implementation time):

```
src/components/admin/
  SeoAssessment/
    SeoAssessment.tsx         ← top-level UI Field component
    useScoringWorker.ts       ← spawns a Web Worker, posts content to it
    worker.ts                 ← runs yoastseo (EN) or rules engine (BG)
    rules/
      bg.ts                   ← BG rules-based analyzer
      shared.ts               ← language-agnostic signals
    ui/
      TrafficLight.tsx
      SuggestionList.tsx
      FocusKeyphraseInput.tsx
```

The Web Worker matters: `yoastseo` is heavy (does string-search-heavy analysis
on every keystroke) and we want the admin to stay snappy. The Yoast package
README documents the worker pattern as the canonical embed.

---

## What scoring signals look like

Pulled apart by **language dependency**, so we know which we can ship today
(language-agnostic, just string ops) versus which need linguistic resources we
don't have for BG.

### Language-agnostic (ship for both BG and EN today)

These are just string + regex operations on the document fields:

- Focus keyphrase **present** in: title, meta description, slug, H1, first
  paragraph, body. (Simple substring/lowercase match.)
- Keyphrase **density** in body (1–2.5% target). (Word count / occurrence
  count.)
- Meta title length (50–60 chars target).
- Meta description length (120–156 chars target).
- Slug length + presence of stop-character noise.
- Image alt-text coverage (count of `<img>` without `alt`).
- Internal-link presence (count of relative `href`s in body).
- Sentence length distribution (split on `[.!?]` — works for Cyrillic too).
- Paragraph length distribution (split on double newlines / `<p>` boundaries).

### Language-dependent (EN today, BG later)

These need per-language word lists or morphological resources:

- **Transition-word frequency** (Yoast: ~30% of sentences should contain a
  transition word). Needs a curated BG transition-word list. Yoast doesn't
  ship one.
- **Stop-word filtering** for keyphrase density (so "и", "на", "от" don't
  count as keyphrase tokens). Needs a BG stop-word list.
- **Flesch-Kincaid / similar readability score**. Needs a syllable counter.
  English has good libraries; BG syllable rules are different. `readability-cyr`
  may or may not help here — trial needed.
- **Word-form recognition** (Yoast in EN treats "manage", "manages",
  "managing" as the same keyphrase). Needs a stemmer/lemmatizer. None available
  for BG in the JS ecosystem.

V1 strategy: ship language-agnostic signals for both locales. EN also gets
the `yoastseo` engine layered on top (which adds the language-dependent
signals via Yoast's bundled EN resources). BG gets a "readability not yet
scored" placeholder, or `readability-cyr` if it works in trial.

---

## Open questions (these block any code)

1. **`yoastseo` GPL-3.0 — accept or avoid?**
   - Accept: cleanest EN scoring quality, ~mature analysis, well-known UX.
     Document in an ADR. The repo stays private, so copyleft has minimal
     practical impact in-house. If we ever open-source, plan for it then.
   - Avoid: build a smaller in-house EN analyzer too. EN scoring quality drops
     to roughly BG quality (rules-based only). More code, no Yoast brand
     recognition, but zero license risk.
   - Defer: ship a unified rules-based analyzer for both BG and EN at V1, layer
     `yoastseo` in for EN later if the rules version feels weak.

2. **Scope at V1 — which collections/globals get the panel?**
   - Heavy-text candidates: BlogPost, Hero global, About/Services/Pricing
     globals.
   - Lighter-text candidates: Contacts, FAQ, Apartments.
   - All-or-nothing is fine if we wire it as a reusable UI-field block.

3. **BG readability at V1 — `readability-cyr`, in-house counters only, or skip?**
   - `readability-cyr`: trial, ship if usable. Best owner experience.
   - In-house counters only: simplest, no external dep, no Flesch-style score.
   - Skip readability for BG entirely at V1: structural signals only (keyphrase,
     lengths, alts, links). Add readability in a V2 pass.

---

## Sources

Primary (cited in the research synthesis):

- [npm: yoastseo (versions)](https://www.npmjs.com/package/yoastseo?activeTab=versions) —
  3.6.0, GPL-3.0, last published Feb 2026.
- [Yoast/wordpress-seo · `packages/yoastseo`](https://github.com/Yoast/wordpress-seo/tree/trunk/packages/yoastseo) —
  README with three integration examples (worker, React, bare-bones).
- [yoast.com/features/languages/](https://yoast.com/features/languages/) — official
  per-feature language matrix (Bulgarian absent across all three tables).
- [yoast.com/help/features-per-language/](https://yoast.com/help/features-per-language/) —
  same data, in help-doc form.
- [GH issue #17899 — Publish updates of yoastseo on NPM](https://github.com/Yoast/wordpress-seo/issues/17899) —
  community signal on maintenance cadence; open since 2021.
- [npm: react-yoastseo](https://www.npmjs.com/package/react-yoastseo) — last release
  v1.1.0 2021-06-14, React 17 / yoastseo 1.x.
- [Payload v3 docs — Custom Admin Components](https://payloadcms.com/docs/admin/components)
- [Payload v3 docs — React Hooks](https://payloadcms.com/docs/admin/react-hooks)
- [Payload v3 docs — UI Field](https://payloadcms.com/docs/fields/ui)
- [Payload v3 docs — SEO Plugin](https://payloadcms.com/docs/plugins/seo)
- [github.com/payloadcms/plugin-seo](https://github.com/payloadcms/plugin-seo)
- [npm: readability-cyr](https://www.npmjs.com/package/readability-cyr) —
  Cyrillic-aware readability lib (trial pending).
- [github.com/Amice13/readability-cyr](https://github.com/Amice13/readability-cyr)
- [github.com/retextjs/retext-readability](https://github.com/retextjs/retext-readability) —
  unified-ecosystem readability; English-only.
- [github.com/sanity-io/sanity-plugin-seo-pane](https://github.com/sanity-io/sanity-plugin-seo-pane) —
  Sanity's official SEO pane, embeds `yoastseo`.
- [github.com/LiahMartens/sanity-plugin-seo-tools](https://github.com/LiahMartens/sanity-plugin-seo-tools) —
  community Sanity plugin, also wraps `yoastseo`.

Refuted claim worth noting (so we don't fall for it later): "Yoast stopped
publishing yoastseo to npm, breaking ~20k Drupal sites." Verification 0–3 against:
the package *is* on npm with recent releases (3.6.0 Feb 2026). Cadence is slow,
not zero.
