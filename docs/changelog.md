# Changelog

Reverse chronological. One line per completed task. Dates in YYYY-MM-DD format.

## 2026-06-09

- feat: extend type scale with `text-7xl` (72px) and `text-8xl` (96px), and bump home hero to `text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl` so the headline keeps growing on 1080p+ monitors instead of capping at laptop-friendly 60px. Lower breakpoints unchanged — purely additive on the big-screen end.
- docs: fill in `design-system.md` Typography section (was TBD) — Geist Sans for display + body + Geist Mono for code, full px scale, and the documented hero responsive pattern.
- feat: rework home page from centered hero into a real top-of-page section so it sits properly under the new Header (max-w-6xl container, padded with `px-gutter` / `py-section`).
- feat: wire Header + Footer into `(frontend)/layout.tsx` — every page in the route group now inherits the chrome.
- feat: add Footer — 3-column grid on `md+`, stacked on mobile (brand+blurb / site map / contacts); contacts intentionally hardcoded as placeholders until the Contacts global is populated via Payload.
- feat: add Header — sticky, blurred-backdrop top bar; primary nav inline on `md+`, hamburger-toggled slide-in drawer on mobile (ESC + outside-click close, body-scroll lock while open). Drawer rendered as a sibling of `<header>` rather than a child: the header's `backdrop-filter` would otherwise establish a containing block and scope the drawer's `position: fixed` to the header's height (caught during 360px breakpoint testing). Backdrop dim at 70% opacity so the page behind doesn't peek through the drawer's `max-w-[85vw]` strip on narrow viewports.
- feat: add LanguageSwitcher — pill-style BG/EN toggle, visual-only for now (real locale switching arrives with next-intl in Stage 5).
- feat: home page consumes Button (via `buttonStyles()`) and Card — first real exercise of the design-system component contract end-to-end; production build green.
- feat: add Card primitive — `variant: default | muted`, `padding: sm | md | lg`; bordered surface with no drop-shadow per design-system "avoid 2018 card" rule; closed surface (no `className` prop) so layout-level spacing is the parent's job.
- feat: add Button primitive — `variant: primary | secondary | ghost`, `size: sm | md | lg`; closed surface per design-system contract (no `className` escape hatch); exports `buttonStyles()` helper so anchor tags can opt into the same visual treatment without polymorphism.
- feat: lock breakpoint scale (`sm`/`md`/`lg`/`xl`/`2xl` = 640/768/1024/1280/1536) explicitly in `globals.css` `@theme` so `globals.css` stays the single source of truth and codemods/upstream changes can't silently shift defaults.

## 2026-06-08

- fix: media doc `url` field now stores the direct Blob CDN URL (`disablePayloadAccessControl: true`) instead of Payload's proxy URL — public marketing site loads images straight from Vercel's CDN, no Function invocations per request. Verified end-to-end: 1200x900 upload produces original + 3 sharp size variants in Blob with direct URLs.
- feat: wire up Vercel Blob storage adapter for the Media collection per [ADR 0004](decisions/0004-media-storage-adapter.md). Stage 2 is now fully shippable.
- docs: ADR 0004 — pick Vercel Blob as the media storage adapter.
- feat: complete Stage 2 schema — six collections (Media, BlogPost, Apartment, FAQ, Service, PricingPlan) and two globals (Contacts, SocialLinks) with BG/EN field-level localization. Slugs non-localized (revisit in Stage 5). Sample content still to be entered by the partner.
- feat: add SocialLinks global — array of {platform, url, label}; platform enum drives icon mapping; Airbnb and Booking included as "platforms".
- feat: add Contacts global — email/phone required; address and workingHours localized; mapEmbedUrl stores only the iframe src.
- feat: add PricingPlan collection — price as free-form localized text (pricing models vary too much for numeric); features required min 1; isFeatured for the recommended tier.
- feat: add Service collection — title + summary, optional icon-name string or image; no long body (cards, not articles).
- feat: add FAQ collection — question + answer with category (owners/guests/general) and manual order; answer plain textarea, upgrade to richText if needed.
- feat: add Apartment collection — Airbnb embed pointers (title, city select, airbnbUrl, blurb), manual order, isActive toggle; no featuredImage since the embed renders its own preview.
- feat: add BlogPost collection — title/excerpt/body/tags localized; slug shared across locales; drafts enabled; author plain text; no SEO fields yet (Stage 5).
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