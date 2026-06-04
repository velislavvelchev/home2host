# Image URLs referenced from the homepage

Captured: 2026-06-04
Sources: `docs/inventory/raw/home.html` (img tags, favicon links, OG tags) + `docs/inventory/raw/post-12.css` (CSS background-image declarations).

**Status: all 13 actively-used images + the 512×512 logo master have been downloaded into `docs/inventory/images/` (2.37 MB total). File names in that folder are descriptive (e.g. `logo-512.png`, `hero-illustration-v1.png`, `bg-pexels-tara-winstead.jpg`) rather than the WordPress filenames, since those have URL-encoded Cyrillic and `-scaled` suffixes that are inconvenient locally.**

The WordPress media library was **not** crawled — only files actually referenced by the live pages were pulled. The one library probe done was for a vector logo (no SVG exists; the logo is PNG-only at 512×512).

---

## Logo / favicon (auto-derived by WordPress from one master file)

All four files below are crops of the same source. The 512×512 master was confirmed at `Home2Host-Logo-512x512-1.png` (44 KB PNG). **No SVG variant exists** at any of the obvious paths — the logo on the live site is PNG-only. If a vector original was ever produced, it lives outside the website and would need to come from the owner / designer.

Downloaded to `docs/inventory/images/`:

| Local file | Source URL |
|---|---|
| `logo-512.png` | https://home2host.com/wp-content/uploads/2025/10/Home2Host-Logo-512x512-1.png |
| `favicon-32.png` | https://home2host.com/wp-content/uploads/2025/10/cropped-cropped-Home2Host-Logo-512x512-1-32x32.png |
| `favicon-180.png` | https://home2host.com/wp-content/uploads/2025/10/cropped-cropped-Home2Host-Logo-512x512-1-180x180.png |
| `favicon-192.png` | https://home2host.com/wp-content/uploads/2025/10/cropped-cropped-Home2Host-Logo-512x512-1-192x192.png |

## Hero / illustration (likely AI-generated)

Filename pattern `ChatGPT-Image-13.09.2025` strongly suggests an AI render. The two files below are byte-identical (61.7 KB each) — almost certainly the same image uploaded twice; only one needs to be kept long-term.

| Local file | Source URL | Notes |
|---|---|---|
| `hero-illustration-v1.png` | …/cropped-ChatGPT-Image-13.09.2025-г.-15_23_02-1.png | 1024×827, used with srcset on the home page |
| `hero-illustration-v2.png` | …/cropped-ChatGPT-Image-13.09.2025-г.-15_23_02.png | 1024×827, identical to v1 — WordPress upload duplicate |

Srcset thumbnails for the hero (not downloaded; not needed if we re-export the master):
- `…-300x242.png`
- `…-768x620.png`

## Open Graph / Twitter share image

| Local file | Source URL |
|---|---|
| `og-share-IMG_8712.jpg` | https://home2host.com/wp-content/uploads/2025/10/IMG_8712.jpg |

## Inline content photo

| Local file | Source URL |
|---|---|
| `inline-pexels-fotios-1090638.jpg` | https://home2host.com/wp-content/uploads/2025/11/pexels-fotios-photos-1090638-2048x1365.jpg (Pexels stock) |

## CSS background images (referenced from `post-12.css`)

All Pexels stock except one. The new site will likely replace these with real apartment photography or a different stock direction.

| Local file | Source URL |
|---|---|
| `bg-open-home-mid-century.jpeg` | …/Open-home-with-mid-century-modern-interior-design-2-scaled-2.jpeg |
| `bg-pexels-tara-winstead.jpg` | …/pexels-tara-winstead-7111591-scaled.jpg |
| `bg-pexels-solliefoto.jpg` | …/pexels-solliefoto-298842.jpg |
| `bg-pexels-cottonbro.jpg` | …/pexels-cottonbro-6466490-scaled.jpg |
| `bg-pexels-pixabay-276267.jpg` | …/pexels-pixabay-276267-scaled-1.jpg |
| `bg-pexels-kindelmedia.jpg` | …/pexels-kindelmedia-7579137-scaled.jpg |

## Language switcher flags — NOT downloaded

TranslatePress plugin assets, not site content. Listed here for completeness only; the new site will use a different language-switcher implementation (next-intl) and won't carry these forward.

- https://home2host.com/wp-content/plugins/translatepress-multilingual/assets/flags/4x3/bg_BG.svg
- https://home2host.com/wp-content/plugins/translatepress-multilingual/assets/flags/4x3/en_US.svg

## Observations (for triage)

- **Most photos are Pexels stock**, not custom photography of the actual managed properties. The new site will likely want real photos of the apartments at some point — flag for content sourcing.
- **The hero illustration is AI-generated.** Verify this is intentional and that the owner is OK keeping that direction in the rebuild.
- **No SVG/vector logo exists on the website.** The header uses the 512×512 PNG. If a vector original was ever produced (Illustrator, Figma export), it would need to come from the owner's local files — it is not on the server.
- **Actual apartment photos** are inside Airbnb embeds — not stored on home2host.com. We only get them by accessing the Airbnb listings directly.

## Disk usage

`docs/inventory/images/` now contains 14 files totalling **2.37 MB**. None of the WordPress media library beyond what's actually referenced was crawled.
