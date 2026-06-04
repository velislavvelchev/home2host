# Content inventory

What we need to gather from the old site before starting Stage 4 (pages). Tick ✅ when each item is collected.

**Status:** Stage 0 closed on 2026-06-04 with several follow-ups deferred — see the "Deferred follow-ups" section at the bottom. They are tracked here, not lost, and can be pulled when the relevant stage needs them.

## Text

URL slugs reflect the live site (not assumed names). BG copy is captured under `docs/inventory/text/`. EN versions from TranslatePress are still pending — not yet captured.

- ✅ Home (`/`) — `text/home.md`
- ✅ About Us (`/about-us/`) — `text/about-us.md` (sparse — only the "Кои сме ние" block, identical to home page)
- ✅ Services (`/services/`) — `text/services.md` (same 6 service cards as home page)
- ✅ Prices (`/prices/`) — `text/prices.md`
- ✅ FAQ (`/questions/`) — `text/questions.md` (note: live site has "BnB Manager" typo in last answer — should be "Home2Host")
- ✅ Apartments (`/apartments/`) — `text/apartments.md`
- ✅ Contacts (`/contacts/`) — `text/contacts.md` (form fields confirmed via screenshot 2026-06-04)
- ⬜ Footer text — not yet extracted (the page-extraction step skipped the footer)

🔄 EN versions from TranslatePress — raw HTML captured for all 8 pages in `docs/inventory/raw/en/` (1.46 MB total). Markdown extraction not yet done; raise it as a follow-up if/when EN copy is needed for the rebuild.

## Images

All 13 actively-used images + the logo master are now stored in `docs/inventory/images/` (2.37 MB total). The WordPress media library was NOT crawled — only files actually referenced by the live pages were pulled.

- ✅ Logo — `logo-512.png` (512×512). **No SVG/vector exists** on the server; if a vector original was ever produced it would have to come from the owner's local files.
- ✅ Photos from Home, About, Services pages — downloaded (8 files: 1 AI-generated hero illustration + 1 OG share image + 1 inline Pexels photo + 5 CSS-background Pexels photos)
- ✅ Favicon — three resolutions (32×32, 180×180, 192×192 PNG)
- ⬜ Icons, if used — none flagged separately in the page CSS; icon sets are loaded via Font Awesome (will not be inherited by the new site)

## Airbnb listings

- ✅ All Airbnb listing URLs — 12 listings, full URLs in `docs/inventory/text/apartments.md` (10 Bansko, 1 Burgas, 1 Razlog)
- ⬜ For each: which property it represents (e.g. "Bansko — Studio A", "Burgas — 2BR by the sea") — owner needs to assign labels

## Blog posts

- ✅ Count of existing posts at `/blog/` — 6 posts, list with titles/dates/excerpts/URLs in `docs/inventory/text/blog.md` (flagged: post #1 URL ends in `-copy/`, likely a WP draft duplicate)
- ⬜ For each post: title, body, author, date, featured image, tags/categories — only titles/dates/excerpts captured so far; full bodies pending
- ⬜ EN version if it exists in TranslatePress

## Brand

- ✅ Brand colors — captured in `docs/inventory/brand.md` (Astra customizer palette + actually-rendered colors from `post-12.css`; key finding: live site is dominated by `#122C69` deep indigo, not the customizer-declared `#0085FF`)
- ✅ Fonts used on the current site — captured in `docs/inventory/brand.md` (Lora 400 body, Lato 400/700 headings; **not** being inherited by the new site — modern direction TBD in Stage 3)
- ⬜ Tone-of-voice notes, if any

## Contact info (verify nothing changed)

- Phones: +359 885 146 191, +359 885 777 342
- Email: info@home2host.com
- Facebook: home2hosteu
- Instagram: home2host_

## Deferred follow-ups

These were intentionally **not** pulled when Stage 0 closed on 2026-06-04. Each is parked here with what triggers needing it, so it can be picked up when the relevant stage hits — no rush, no work lost.

| Item | What's currently in the repo | Pull it when | Effort estimate |
|---|---|---|---|
| **Footer copy (BG)** | Not extracted. The raw HTML for all pages is in `docs/inventory/raw/`, so the source exists. | Building the Footer component (Stage 3) | ~5 min — one grep + paste |
| **EN versions of all page copy** | Raw HTML captured in `docs/inventory/raw/en/` (8 files, 1.46 MB). Markdown not extracted. | Setting up next-intl and importing EN strings (Stage 5) | ~30 min — same WebFetch loop we ran for BG |
| **Full blog post bodies + featured images + tags + authors** | Only titles/dates/excerpts/URLs captured, in `docs/inventory/text/blog.md`. Note: post #1 has a `-copy/` URL — likely a draft duplicate. | Building the Blog page and importing posts to Payload (Stage 4) | ~45 min — 6 posts to fetch + parse |
| **EN versions of blog posts** | Not checked. | Same as EN page copy (Stage 5) | ~20 min if EN versions exist |
| **Apartment-label mapping** | 12 Airbnb URLs captured in `docs/inventory/text/apartments.md` with rating/size info. The labels (e.g. "Bansko — Studio A", "Burgas — 2BR by the sea") need to come from the owner. | Building the Apartments page (Stage 4) | Owner input required — Claude can't do this alone |
| **Tone-of-voice notes** | None captured. | Stage 4 when writing or reworking page copy | Discussion with owner |
| **Vector logo** | Only PNG (512×512) exists on the WordPress server. No SVG anywhere. | Stage 3 (design system) if a scalable logo is needed | Owner needs to provide; otherwise re-trace the PNG |
| **Icons audit** | None catalogued — the WordPress site uses Font Awesome, which won't be inherited | Stage 3 only if a question arises about specific icon glyphs | Probably a no-op — the new site picks its own icon set |

