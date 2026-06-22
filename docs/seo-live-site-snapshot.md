# Live-site SEO snapshot — 2026-06-22

**Source:** `https://home2host.com` (the current WordPress site).
**Captured by:** `node scripts/scrape-live-seo.mjs` on 2026-06-22, before the
new Payload-driven SEO copy was finalized.

**Why this file exists.** Before the Stage 6 DNS switch, we replaced
Payload's placeholder `meta.title` / `meta.description` values with copy
derived from this live-site SEO (which had accumulated Google ranking
signal). The "derivation" was done via improved `generateTitle` /
`generateDescription` callbacks in [`src/payload.config.ts`](../src/payload.config.ts) —
they produce sensible defaults from existing page fields and bake in
the live-site keyword phrase `Управление на Имоти в Банско и Бургас`.

If the Payload SEO ever needs to be reverted to exactly the live-site
copy (e.g., a ranking dip post-launch turns out to be due to SEO
phrasing changes), the values below are the source of truth — paste
them directly into the matching Global's SEO tab in the admin.

Re-running `scripts/scrape-live-seo.mjs` against the live site will
pick up the *current* WP values, which may differ from this snapshot
if the owner has edited the live site since 2026-06-22.

---

## Marketing pages — each maps to a Payload Global

### `/` — Landing page section

- **`<title>`:** `Home - Home2Host Управление на имоти в Банско и Бургас`
- **OG title:** `Управление на Имоти в Банско и Бургас - Home2Host`
- **Meta description:** `Home2Host е компания, създадена с цел да осигури професионалмо управление на имоти за краткосрочен наем в платформи като Airbnb и Booking`
- **OG description:** `Home2Host е компания, създадена с цел да осигури професионалмо управление на имоти за краткосрочен наем в платформи като Airbnb и Booking`

> **Typo on the live site:** `професионалмо` (м) should be `професионално` (н). When pasting, prefer the corrected form.

### `/about-us/` — About section

- **`<title>`:** `About Us - Home2Host Управление на имоти в Банско и Бургас`
- **OG title:** `За нас - Управление на Имоти в Банско и Бургас - Home2Host`
- **Meta description:** `Home2Host е компания, създадена с цел да осигури професионалмо управление на имоти за краткосрочен наем в платформи като Airbnb и Booking`
- **OG description:** (identical to meta description)

### `/services/` — Services section

- **`<title>`:** `Services - Home2Host Управление на имоти в Банско и Бургас`
- **OG title:** `Услуги - Управление на Имоти в Банско и Бургас - Home2Host`
- **Meta description:** `Създаване и оптимизация на порфил в Airbnb и Booking Динамично ценообразуване Комуникация и настаняване на гости Поддръжка и почистване Интериорен дизайн`
- **OG description:** (longer; same text continues with `Сигурност ПРОФЕСИОНАЛНО СЪЗДАВАНЕ НА ПРОФИЛ Създаваме и поддържаме профила на вашия имот...`)

> **Typo on the live site:** `порфил` should be `профил`. Fix when pasting.

### `/prices/` — Pricing section

- **`<title>`:** `Prices - Home2Host Управление на имоти в Банско и Бургас`
- **OG title:** `Цени - Управление на Имоти в Банско и Бургас - Home2Host`
- **Meta description:** `Предлагаме следните пакети с услуги: Start smart, Full Care, Home Refresh Свържете се с нас за повече инфо: +359 885 146 191 +359 885 777 342`
- **OG description:** (identical to meta description)

> Phone numbers in a meta description are unconventional and can read as spammy in SERPs. The improved Payload-driven version drops them.

### `/contacts/` — Contacts section

- **`<title>`:** `Contacts - Home2Host Управление на имоти в Банско и Бургас`
- **OG title:** `Контакти - Управление на Имоти в Банско и Бургас - Home2Host`
- **Meta description:** `Къде работим? Home2Host управлява имоти на територията на Банско,Бургас и околните региони. Осигуряваме управление доходност за вашия имот.`
- **OG description:** (identical to meta description)

---

## Listing pages — currently sourced from `messages/<locale>.json`

These have no Payload Global today. Until the optional "Listings page
settings" Global is built (parked in the roadmap), their meta lives in
the i18n JSON files.

### `/questions/` — FAQ listing

- **`<title>`:** `Questions - Home2Host Управление на имоти в Банско и Бургас`
- **OG title:** `Често задавани въпроси - Управление на Имоти в Банско`
- **Meta description:** `Кои апартаменти са подходящи за краткосрочни наеми? Най-добре се отдават имоти в центъра или в близост до ключови забележителности.`

### `/apartments/` — Apartments listing

- **`<title>`:** `Apartments - Home2Host Управление на имоти в Банско и Бургас`
- **OG title:** (identical to `<title>`)
- **Meta description:** `Explore the apartments that we manage. View our full collection of short-term rental properties managed to the highest standards.`

> The live site's apartments description is in English (likely a Yoast default that was never edited).

### `/blog/` — Blog listing

- **`<title>`:** `Blog - Home2Host Управление на имоти в Банско и Бургас`
- **OG title:** (identical to `<title>`)
- **Meta description:** `Блог за управление на краткосрочни наеми в България. Съвети за Airbnb мениджмънт, динамично ценообразуване, оптимизация на обяви и повишаване на доходността на имота.`

---

## Notes for future-self

- The `<title>` tags all mix English + Cyrillic ("Home - Home2Host Управление…"). The OG titles are uniformly Bulgarian and read better for a BG audience. **Prefer the OG title pattern** when restoring values from this snapshot.
- The OG titles follow a consistent formula: `{Page name in BG} - Управление на Имоти в Банско и Бургас - Home2Host`. The improved `generateTitle` callback bakes this formula in.
- The meta descriptions duplicate across home + about (same copy). The improved Payload-driven version differentiates them — paragraph1 of each Global feeds the description, so editing the visible page content also refreshes the SEO copy via auto-generate.
- Individual blog-post `<title>` and `<meta description>` were not in scope of this scrape — they live per-post in WordPress and would need to be scraped per-slug if maximum continuity is desired post-launch.
