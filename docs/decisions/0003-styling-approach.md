# ADR 0003 — Styling approach: Tailwind CSS v4

**Date:** 2026-06-04
**Status:** Accepted

## Context

The new site needs a styling system. The design-system doc (`docs/design-system.md`) commits us to a token-based approach with no hardcoded values, a clear visual direction, and reusable components. We need to pick tooling that makes those rules easy to follow and hard to break.

Three realistic options were considered:

1. **Tailwind CSS v4** — utility-first, with design tokens declared in CSS via `@theme`.
2. **CSS Modules** — scoped CSS files per component, tokens via CSS custom properties.
3. **CSS-in-JS** (styled-components, Emotion) — runtime or compile-time JS-driven styling.

## Decision

We go with **Tailwind CSS v4**.

## Reasoning

### In favor of Tailwind v4

- **Tokens as native CSS.** Tailwind v4's `@theme` block lets us declare every design token as a CSS variable in one file (`globals.css`). The file *is* the design system, not a wrapper around one.
- **No hardcoded values by construction.** You can't type `color: #3a7bd5` in a Tailwind utility — the workflow doesn't go through arbitrary CSS in the first place. This enforces the first principle of `design-system.md` automatically.
- **Discoverability.** Every styling decision lives next to the JSX. Anyone reading a component sees its appearance without jumping to a separate file.
- **Speed.** Tailwind v4 uses a new high-performance engine, with full builds in the millisecond range and no PostCSS config to maintain.
- **Tree-shaking.** Only the utilities actually used end up in the final CSS. Production bundles stay small.
- **Tooling.** First-class VS Code extension with autocomplete, hover docs for every utility, and inline color previews.
- **Ecosystem.** shadcn/ui, Radix, and most modern Next.js component libraries assume Tailwind. Opting out closes doors.
- **Plays well with Payload.** Payload's admin panel ships its own styles and is isolated from the public site, so there's no conflict.

### In favor of CSS Modules (rejected)

- Familiar to anyone who knows plain CSS.
- Scoped class names prevent collisions automatically.
- No special syntax to learn beyond `import styles from './foo.module.css'`.

### Against CSS Modules

- Tokens still need a separate system (CSS custom properties or JS constants) — Tailwind gives us the same outcome without the bookkeeping.
- Two places to look for any component's style (the `.tsx` and the `.module.css`). More files, more context-switching.
- Encourages component-local CSS, which over time drifts from system tokens unless aggressively policed.
- No equivalent to Tailwind's autocomplete + token awareness in the editor.

### Against CSS-in-JS

- Runtime cost for the popular options (styled-components, Emotion).
- Friction with React Server Components and streaming SSR, which we use heavily via the App Router.
- Bundle bloat and serialization issues in the Next.js App Router.
- A class of solution we don't need at this project's scale.

## Consequences

- `src/app/globals.css` becomes the single source of truth for all design tokens, declared in a `@theme` block per Tailwind v4 conventions.
- `tailwind.config.ts` is minimal or absent — most configuration moves to CSS, as v4 prefers.
- Convention adopted: never use arbitrary-value syntax (`text-[#3a7bd5]`, `p-[13px]`) except as a last resort, and only with a code comment explaining why a token isn't appropriate.
- Components live in `src/components/` and use only utility classes derived from the configured token set.
- The open question in `roadmap.md` Stage 3 ("Styling approach: Tailwind vs CSS Modules") is now resolved. The design-token extraction work moves forward to Stage 1 so the scaffold has Tailwind enabled from day one. `roadmap.md` should be updated to reflect this.
- For the rare case of a one-off style that can't be expressed as utilities (complex keyframes, multi-stop gradients with logic), we use a small CSS Module file alongside the component, still referencing tokens via `var(--token-name)`.