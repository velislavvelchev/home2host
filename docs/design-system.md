# Design system

## Principles
- No hardcoded values. Colors, spacing, typography, radii, shadows
  all come from tokens defined in one place.
- Components consume tokens; they never define raw values.
- Light/dark theming is a swap of token values, not a rewrite.

## Visual direction
- Goal: feel modern and slightly futuristic — not a reskin of the
  current WordPress site.
- Reference vibes: [3-5 sites/products that capture the feeling]
- What to avoid: generic "real estate template" tropes — stock photo
  of a key on a contract, beige + navy color schemes, rounded-corner
  cards with drop shadows that feel 2018.

## Token categories
- Color: brand, neutral, semantic (success/warning/error), surfaces
- Typography: font families, scale (xs → 8xl), weights, line heights
- Spacing: 4px base scale + named tokens (section, gutter)
- Radii, shadows, motion (duration + easing)
- Breakpoints

## Where tokens live
- `src/app/globals.css` — Tailwind v4 @theme block, single source of
  truth.
- Components reference tokens through Tailwind utilities only.

## Brand colors (to be filled in)
- Extract from current site → starting point, not final palette.
- Final palette decided once visual direction is locked.

## Typography
- Display font: **Geist Sans** (also used for body — kept as one family
  for now to avoid a second webfont download; revisit if a more
  distinctive display face becomes a design priority).
- Body font: **Geist Sans**.
- Mono (code/accents): **Geist Mono**.
- Scale (px, rem in `globals.css`):
  - `xs` 12 · `sm` 14 · `base` 16 · `lg` 18 · `xl` 20
  - `2xl` 24 · `3xl` 30 · `4xl` 36 · `5xl` 48 · `6xl` 60
  - `7xl` 72 · `8xl` 96 — display-only, hero/marketing use
- Headline pattern (mobile-first responsive jump):
  `text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl`
  Hero text grows on bigger screens; this is what gives the site a
  modern, confident feel on 1080p+ monitors instead of capping at
  laptop-friendly 60px forever.

## Component contract
- Every reusable component (Button, Card, Input, etc.) must:
  - Accept variants via props, not arbitrary className overrides.
  - Have a documented set of allowed sizes/states.
  - Render correctly in light and dark mode.