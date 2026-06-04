# Brand observations from the live site

Captured: 2026-06-04
Sources: `docs/inventory/raw/home.html` (inline `<style>`), plus three downloaded stylesheets in `docs/inventory/raw/`: `post-12.css` (home page Elementor styles), `post-386.css` (about-us page styles, page ID 386), `eael-12.css` (Essential Addons widget styles).

This file records **what the current WordPress site actually uses**. It is not the new design system — that comes later, in Stage 3, building on what's collected here.

Vendor-default colors from the Elementor / Essential Addons starter kits are intermixed with brand-authored colors on the live site, and at this stage we are **collecting, not interpreting**. Filtering vendor noise from real brand intent happens after a visual side-by-side with the live pages.

## Sources scanned

| File | Purpose | Size |
|---|---|---|
| `docs/inventory/raw/home.html` — inline `<style id="astra-theme-css-inline-css">` | Astra theme customizer output — declares the global theme palette | ~290 KB total in home.html |
| `docs/inventory/raw/post-12.css` | Per-page Elementor CSS for the home page (page ID 12) | 85 KB |
| `docs/inventory/raw/post-386.css` | Per-page Elementor CSS for about-us (page ID 386) | 1.3 KB |
| `docs/inventory/raw/eael-12.css` | Essential Addons for Elementor, home-page bundle | 39 KB |

Vendor/icon stylesheets (Font Awesome, swiper, animations, Astra `main.min.css`, language switcher, etc.) were intentionally skipped — they don't carry brand colors.

## Colors observed — Astra customizer palette (theme-level declaration)

These are declared as CSS custom properties in the inline `<style>` block at `home.html:65` and mirrored as Elementor global colors. They represent what the theme customizer considers the site palette.

| Token | Hex | Astra mapping (from same `<style>` block) |
|---|---|---|
| `--ast-global-color-0` | `#0085FF` | Default link color (`a { color: var(--ast-global-color-0) }`) |
| `--ast-global-color-1` | `#0177E3` | Default link hover (`a:hover { color: var(--ast-global-color-1) }`) |
| `--ast-global-color-2` | `#FFFFFF` | Site title color |
| `--ast-global-color-3` | `#E7F6FF` | Body text default (`body { color: var(--ast-global-color-3) }`) — note: this is the *light* tint, used on dark backgrounds |
| `--ast-global-color-4` | `#212A37` | Astra "secondary" (`--ast-global-color-secondary`) |
| `--ast-global-color-5` | `#0F172A` | Astra "primary" (`--ast-global-color-primary`) — used as dark background |
| `--ast-global-color-6` | `#2a7fb0` | Astra "subtle background" |
| `--ast-global-color-7` | `#070614` | Astra "alternate background" |
| `--ast-global-color-8` | `#222222` | Heading default fallback |

## Colors observed — home page custom styles (`post-12.css`)

Every distinct color found in the Elementor per-page CSS for the home page. Sorted by frequency (approximate; minified to a single line so counts are reads from the grep pass).

| Hex | Approx. uses | Notes / where in the file |
|---|---|---|
| `#122C69` | ~30+ | Dominant deep-indigo blue. Used for headings, buttons, icons, accent borders across most sections of the home page. This is the color visible in the contacts-page screenshot (heading "КОНТАКТИ", "Изпрати" submit button, phone/location icons). |
| `#FFFFFF` / `#fff` | many | White backgrounds and text on dark sections |
| `#020101` | ~3 | Near-black, used in a button/background context (alongside `rgba(0,0,0,0.5)`) |
| `#1635E5` | ~5 | Vivid mid-blue — appears as hover/highlight color on cards |
| `#003580` | ~10 | Strong navy blue — likely the Booking.com brand badge color on listing references |
| `#4054B2` | ~7 | Medium blue — secondary accent inside the apartment-grid cards |
| `#2F3742` | 2 | Dark slate (Elementor heading default) |
| `#AC4513` | 1 | Saddle brown — almost certainly one specific icon |
| `#444343` | 3 | Dark gray |
| `#3d3d3d` | ~4 | Dark gray |
| `#333333` | 2 | Dark gray |
| `#444` | 4 | Dark gray |
| `#54595F` | ~2 | Elementor default body-text gray |
| `#00C853` | 2 | Bright "success" green — appears on availability/status indicators |
| `#2FB2D7` | 3 | Cyan — accent inside one section |
| `#f9f9f9` | 3 | Near-white surface |
| `rgba(0,0,0,0.5)` | ~6 | Semi-transparent black overlay |
| `rgba(208, 216, 234, 0.3)` | ~6 | Very faint blue overlay |

## Colors observed — about-us page custom styles (`post-386.css`)

Page 386 is small (1.3 KB) and most colors here are unchanged Elementor "starter kit" defaults — flagged accordingly.

| Hex | Notes |
|---|---|
| `#6EC1E4` | Elementor default primary accent — **not customized** |
| `#54595F` | Elementor default text gray |
| `#7A7A7A` | Elementor default secondary text |
| `#61CE70` | Elementor default green |
| `#46237A` | Elementor default purple |
| `#4054B2` | Same medium blue seen in `post-12.css` |
| `#23A455` | Green |
| `#000`, `#FFF` | Black, white |

## Colors observed — Essential Addons widget styles (`eael-12.css`)

Plugin-bundled widget defaults. Many of these are color choices made by the plugin author, not the site owner — captured for completeness but most are unlikely to be brand-authored.

| Hex / Function | Notes |
|---|---|
| `#565656` | Widget default text |
| `#000`, `#fff`, `#ccc`, `#ededed`, `#666` | Generic UI grays |
| `#f71169` | Pink — Essential Addons pricing-table default |
| `#5eead4` | Teal — recent Essential Addons starter color |
| `#00c853` | Same bright green as `post-12.css` (consistent across files) |
| `#ef5350` | Red — error state default |
| `#43a047`, `#c8e6c9`, `#03b048`, `#23A455` | Green family — state indicators |
| `#2a2a2a`, `#8d8d8d`, `#6d6d6d`, `#414141`, `#999`, `#414141`, `#414141` | Misc grays |
| `#f1f1f1`, `#eee`, `#ddd` | Light surface grays |
| `rgba(10,10,10,.9)` | Tooltip background |
| `rgba(0,0,0,.04)` / `.1` / `.22` / `.25` / `.6` | Various overlays |
| `hsla(0,0%,100%,.4)` | Translucent white |

## Quick observations (raw, no decisions made)

- **The customizer-declared palette and the actually-rendered colors disagree.** The Astra customizer thinks the accent is `#0085FF` (bright blue), but `post-12.css` overrides this throughout with `#122C69` (deep indigo). The visible site reflects the latter.
- **`#122C69` is overwhelmingly the dominant authored color** on the home page (~30+ usages across sections, buttons, icons, headings).
- **`#1635E5` and `#4054B2`** appear consistently inside the apartment-grid section, suggesting they are intentional secondary accents (possibly card hover or icon fills).
- **`#003580`** is exactly the Booking.com brand blue — usage strongly suggests it's tied to the Booking.com listing badge, not a home2host brand color.
- **`#00C853`** appears in both `post-12.css` and `eael-12.css`, suggesting consistent intentional use for a "success / available" indicator.
- **Page 386 (about-us) uses mostly unmodified Elementor defaults** — consistent with how sparse the page's authored content is (see `text/about-us.md`).

## Fonts observed

> **Note:** the new site will **not** inherit these fonts. The owner wants a more modern type direction (to be decided in Stage 3). The list below is preserved only as a record of the current state.

Declared in the Astra inline `<style>` block at `home.html:65`:

| Role | Font stack | Weights loaded |
|---|---|---|
| Body, buttons, inputs, paragraphs | `'Lora', serif` | 400 |
| Headings `h1`–`h6`, `.site-title` | `'Lato', sans-serif` | 400, 700 |

Loaded from `https://fonts.googleapis.com/css?family=Lora:400|Lato:400,700&display=swap` (link tag `id='astra-google-fonts-css'`).

Additional fonts pre-loaded but not necessarily used on the home page:

- **Roboto** — locally hosted via `wp-content/uploads/elementor/google-fonts/css/roboto.css` (Elementor widget default)
- **Roboto Slab** — locally hosted via `wp-content/uploads/elementor/google-fonts/css/robotoslab.css` (Elementor widget default)
- **Helvetica** — appears once in the Astra reset (`font-family: "Helvetica",sans-serif`) — system fallback only

Elementor per-page CSS (`post-12.css`) references `var(--e-global-typography-primary-font-family)` and `var(--e-global-typography-text-font-family)` but those custom properties aren't bound in the home page's inline styles — they likely fall back to the Lato/Lora pair declared by Astra.
