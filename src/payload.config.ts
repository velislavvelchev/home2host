import { postgresAdapter } from "@payloadcms/db-postgres";
import { nodemailerAdapter } from "@payloadcms/email-nodemailer";
import { seoPlugin } from "@payloadcms/plugin-seo";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";
import sharp from "sharp";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Trim long body text into a Google-friendly meta description (~150
// chars). Tries a sentence boundary first (period / exclam / question)
// to land on a natural cut; falls back to a word boundary with an
// ellipsis; last-resort hard cut. The 80-char floor avoids degenerate
// cuts ("Home2Host е..." with nothing useful before the punctuation).
function truncateForMeta(text: string, maxLen = 155): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= maxLen) return trimmed;

  const window = trimmed.slice(0, maxLen);
  const lastSentence = Math.max(
    window.lastIndexOf("."),
    window.lastIndexOf("!"),
    window.lastIndexOf("?"),
  );
  if (lastSentence >= 80) return window.slice(0, lastSentence + 1).trim();

  const lastSpace = window.lastIndexOf(" ");
  if (lastSpace >= 80) return `${window.slice(0, lastSpace).trim()}…`;

  return `${window.slice(0, maxLen - 1).trim()}…`;
}

// Resolve the public URL the admin + API are reachable at. Used by
// Payload to build absolute links in outbound mail (password reset,
// account verification) and as the implicit CORS/CSRF allowlist when
// neither is set explicitly. Resolution order:
//   1. NEXT_PUBLIC_SERVER_URL — explicit override, the right answer
//      for production where the domain is known (set this on Vercel
//      Production to https://home2host.vercel.app today, flip to
//      https://home2host.com at the Stage 6 DNS switch).
//   2. VERCEL_URL — auto-injected per deployment on Preview; gives
//      every preview deploy its own correct origin without hand-set
//      env vars per branch.
//   3. http://localhost:3000 — dev fallback.
const serverURL =
  process.env.NEXT_PUBLIC_SERVER_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
  "http://localhost:3000";

export default buildConfig({
  serverURL,
  admin: {
    user: "users",
    importMap: {
      baseDir: path.resolve(dirname),
    },
    // Force dark mode globally. The owner is the only admin and asked
    // for the brand-navy dark theme as the permanent look; this also
    // removes the in-app theme toggle so there's no way to land in the
    // unstyled light view by accident. Flip to 'all' if a user toggle
    // is ever needed back.
    theme: "dark",
    meta: {
      // Browser-tab favicon + title for the admin. Same icon set the
      // frontend uses (public/logo-icon.svg + PNG fallbacks), so the
      // admin tab is visually paired with the marketing site tabs.
      titleSuffix: " — Home2Host admin",
      icons: [
        { url: "/logo-icon.svg", type: "image/svg+xml" },
        { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      ],
    },
    components: {
      // Top-right of the admin panel (left of the user/logout menu).
      // One centralized launcher for the external dashboards the owner
      // uses — live site, Search Console, PageSpeed, Vercel, GA4,
      // GitHub, webmail.
      actions: ["/components/admin/ExternalToolsMenu#ExternalToolsMenu"],
      // Brand graphics — Icon shows in the sidebar top-left, Logo
      // shows on the login screen. Both server components rendering
      // the SVGs from /public.
      graphics: {
        Icon: "/components/admin/BrandIcon#BrandIcon",
        Logo: "/components/admin/BrandLogo#BrandLogo",
      },
    },
  },
  localization: {
    locales: [
      { code: "bg", label: "Български" },
      { code: "en", label: "English" },
    ],
    defaultLocale: "bg",
    fallback: true,
  },
  collections: [
    {
      slug: "users",
      // Brute-force defense: lock the account after 5 failed login
      // attempts for 15 minutes. Payload tracks attempts in the
      // users table itself, so this works without any external rate
      // limiter. The password-reset flow (email adapter wired earlier
      // 2026-06-22) is the recovery path if a legitimate admin trips
      // the lockout — reset issues a new password and clears the
      // attempt counter, so a locked-out owner is back in within the
      // time it takes to read an email.
      auth: {
        maxLoginAttempts: 5,
        lockTime: 15 * 60 * 1000,
      },
      admin: { useAsTitle: "email" },
      fields: [],
    },
    {
      slug: "media",
      admin: { useAsTitle: "filename" },
      access: { read: () => true },
      upload: {
        mimeTypes: ["image/*"],
        imageSizes: [
          { name: "thumbnail", width: 400, height: 300, position: "centre" },
          { name: "card", width: 768, height: 512, position: "centre" },
          { name: "hero", width: 1600, height: 900, position: "centre" },
        ],
      },
      fields: [
        {
          name: "alt",
          type: "text",
          localized: true,
          required: true,
        },
      ],
    },
    // ──────────────────────────────────────────────────────────────
    // NOTE: there is intentionally NO `comments` collection on this
    // site, and the blog detail page renders no comment form.
    //
    // The previous WordPress install was constantly receiving spam
    // submissions via `wp-comments-post.php` (a POST endpoint that
    // exists whether or not the comment UI is shown). Re-introducing
    // comments here means re-introducing that attack surface — bots
    // would find any `/api/comments` endpoint by URL alone.
    //
    // If you ever decide to add commenting, route it through a
    // third-party service (Giscus, Disqus, Cusdis) rather than a
    // Payload collection: the third party absorbs the spam-handling
    // and identity problems instead of us shipping a moderation queue
    // and rate limiter we'd then have to maintain.
    // ──────────────────────────────────────────────────────────────
    {
      slug: "blog-posts",
      labels: { singular: "Blog post", plural: "Blog posts" },
      admin: {
        useAsTitle: "title",
        defaultColumns: ["id", "title", "publishedAt", "_status"],
      },
      access: { read: () => true },
      versions: { drafts: true },
      fields: [
        { name: "title", type: "text", localized: true, required: true },
        {
          name: "slug",
          type: "text",
          required: true,
          unique: true,
          index: true,
          admin: {
            description:
              "URL-safe identifier, shared across locales (e.g. 'welcome-to-bansko').",
          },
        },
        { name: "excerpt", type: "textarea", localized: true },
        { name: "featuredImage", type: "upload", relationTo: "media" },
        { name: "body", type: "richText", localized: true, required: true },
        { name: "author", type: "text" },
        {
          name: "tags",
          type: "array",
          localized: true,
          fields: [{ name: "label", type: "text", required: true }],
        },
        {
          name: "publishedAt",
          type: "date",
          required: true,
          admin: { date: { pickerAppearance: "dayOnly" } },
        },
      ],
    },
    {
      slug: "apartments",
      labels: { singular: "Apartment", plural: "Apartments" },
      admin: {
        useAsTitle: "title",
        defaultColumns: ["id", "title", "city", "order", "isActive"],
        description:
          "Airbnb listings shown on the Apartments carousel. Paste the Airbnb URL and use 'Fetch from Airbnb' to auto-fill the title and cover photo, or fill them manually.",
      },
      access: { read: () => true },
      defaultSort: "order",
      fields: [
        {
          name: "airbnbUrl",
          type: "text",
          required: true,
          admin: {
            description:
              "Public Airbnb listing URL — any locale form works (https://www.airbnb.com/rooms/..., https://bg.airbnb.com/rooms/..., https://www.airbnb.co.uk/rooms/..., etc.). The card on the site links to whichever form you paste.",
          },
        },
        {
          // UI-only field (no DB column) — renders the "Fetch from
          // Airbnb" button. Sits directly under airbnbUrl so the action
          // is colocated with the input it reads from. Path is resolved
          // against the admin.importMap.baseDir (src/), then refreshed
          // via `npm run generate:importmap` after any change.
          name: "fetchFromAirbnb",
          type: "ui",
          admin: {
            components: {
              Field:
                "/components/admin/FetchFromAirbnbField#FetchFromAirbnbField",
            },
          },
        },
        { name: "title", type: "text", localized: true, required: true },
        {
          name: "featuredImage",
          type: "upload",
          relationTo: "media",
          required: true,
          admin: {
            description:
              "Cover photo shown on the card. Auto-uploaded when you use 'Fetch from Airbnb', or upload manually.",
          },
        },
        {
          name: "rating",
          type: "number",
          min: 0,
          max: 5,
          admin: {
            description:
              "Star rating shown on the card (e.g. 4.85). Auto-filled by 'Fetch from Airbnb'; click the refresh icon below to pull just the latest number from Airbnb without overwriting title or photo. Leave empty to hide the rating pill (use for ★New listings).",
            step: 0.01,
          },
        },
        {
          // UI-only field — small refresh icon button that re-fetches
          // just the rating from Airbnb. Lets the owner bump a number
          // they care about (most volatile field) without overwriting
          // the title or featured image they may have curated.
          name: "refreshRatingButton",
          type: "ui",
          admin: {
            components: {
              Field:
                "/components/admin/RefreshAirbnbRatingField#RefreshAirbnbRatingField",
            },
          },
        },
        {
          name: "city",
          type: "select",
          required: true,
          options: [
            { label: "Bansko", value: "bansko" },
            { label: "Burgas", value: "burgas" },
            { label: "Razlog", value: "razlog" },
          ],
        },
        {
          name: "order",
          type: "number",
          defaultValue: 0,
          admin: { description: "Lower numbers appear first." },
        },
        {
          name: "isActive",
          type: "checkbox",
          defaultValue: true,
          admin: { description: "Uncheck to hide from the site without deleting." },
        },
      ],
    },
    {
      slug: "faqs",
      labels: { singular: "FAQ", plural: "FAQs" },
      admin: {
        useAsTitle: "question",
        defaultColumns: ["id", "question", "category", "order"],
      },
      access: { read: () => true },
      defaultSort: "order",
      fields: [
        { name: "question", type: "text", localized: true, required: true },
        { name: "answer", type: "textarea", localized: true, required: true },
        {
          name: "category",
          type: "select",
          options: [
            { label: "For property owners", value: "owners" },
            { label: "For guests", value: "guests" },
            { label: "General", value: "general" },
          ],
          defaultValue: "general",
        },
        {
          name: "order",
          type: "number",
          defaultValue: 0,
          admin: { description: "Lower numbers appear first within a category." },
        },
      ],
    },
    // ──────────────────────────────────────────────────────────────
    // NOTE: Services and PricingPlans intentionally live as Globals
    // (see below), not Collections. The design is built around a
    // fixed count — 6 alternating service rows, 3 pricing cards —
    // and a Collection implicitly promises the owner they can add a
    // 7th service or 4th plan, which the layout doesn't accept
    // gracefully. Globals + capped arrays match the visual contract.
    // ──────────────────────────────────────────────────────────────
  ],
  globals: [
    {
      slug: "landing-page",
      label: "Landing page section",
      admin: {
        description:
          "Editable copy + photos for the home-page hero — the first thing visitors see. Title is split into three parts so the highlighted phrase (rendered in brand indigo) is editable as plain text. Add multiple images to enable a slow crossfade slideshow; leave the images list empty to show the built-in default photo.",
      },
      access: { read: () => true },
      fields: [
        // Section copy.
        { name: "eyebrow", type: "text", localized: true, required: true },

        // Title is split so the styled highlight (brand-indigo span) is
        // editable as plain text — no markup tokens for the owner to typo.
        // Order: [before] [highlight] [after]. Any of them can be empty.
        {
          name: "titleBefore",
          type: "text",
          localized: true,
          admin: {
            description:
              "First part of the heading, before the highlighted phrase. Leave empty if the highlight starts the title.",
          },
        },
        {
          name: "titleHighlight",
          type: "text",
          localized: true,
          admin: {
            description:
              "The phrase rendered in the brand indigo accent color. Leave empty to skip the highlight entirely.",
          },
        },
        {
          name: "titleAfter",
          type: "text",
          localized: true,
          admin: {
            description:
              "Trailing part of the heading, after the highlighted phrase. Often just punctuation (e.g. '.'). Leave empty if not needed.",
          },
        },

        { name: "lead", type: "textarea", localized: true, required: true },

        // CTAs — two button groups, label + url each.
        {
          name: "primaryCta",
          type: "group",
          admin: {
            description: "The main filled button (right-most prominence). Required.",
          },
          fields: [
            { name: "label", type: "text", localized: true, required: true },
            {
              name: "url",
              type: "text",
              required: true,
              admin: {
                description:
                  "Where the button goes. Use a relative path (e.g. '/contacts/') for internal links — locale prefix is added automatically for EN visitors. Use a full URL ('https://…') for external links — those open in a new tab.",
              },
            },
          ],
        },
        {
          name: "secondaryCta",
          type: "group",
          admin: {
            description: "The secondary outlined button. Required.",
          },
          fields: [
            { name: "label", type: "text", localized: true, required: true },
            {
              name: "url",
              type: "text",
              required: true,
              admin: { description: "Same convention as the primary button." },
            },
          ],
        },

        // Image slideshow. minRows: 0 → owner can leave it empty, and the
        // frontend falls back to the built-in /hero-home.jpeg (with its
        // alt text from messages JSON). When at least one image is
        // uploaded, those take over. 2+ images enables auto-advancing
        // crossfade rotation on the home page.
        {
          name: "images",
          type: "array",
          minRows: 0,
          maxRows: 8,
          admin: {
            description:
              "Hero photos. Leave empty to show the built-in default photo. Add one for a single static photo. Add two or more for a slow crossfade slideshow on the home page (6s per image with a 1s fade). Alt text for each photo comes from the Media doc's own Alt field.",
          },
          fields: [
            {
              name: "image",
              type: "upload",
              relationTo: "media",
              required: true,
            },
          ],
        },
      ],
    },
    {
      slug: "about",
      label: "About section",
      admin: {
        description:
          "Editable copy for the 'About us' section (embedded on the home page and shown at /about-us/). Two paragraphs sit side-by-side on desktop and stack on mobile.",
      },
      access: { read: () => true },
      fields: [
        { name: "eyebrow", type: "text", localized: true, required: true },
        { name: "heading", type: "text", localized: true, required: true },
        { name: "paragraph1", type: "textarea", localized: true, required: true },
        { name: "paragraph2", type: "textarea", localized: true, required: true },
      ],
    },
    {
      slug: "services",
      label: "Services section",
      admin: {
        description:
          "Editable copy for the 'Services' section. Exactly 6 items — the layout is built for that count (6-up overview grid + 6 alternating editorial rows). Use the 'Key' select on each item to pick which icon and fallback photo show; reordering the array reorders the cards visually.",
      },
      access: { read: () => true },
      fields: [
        { name: "eyebrow", type: "text", localized: true, required: true },
        { name: "heading", type: "text", localized: true, required: true },
        { name: "lead", type: "textarea", localized: true, required: true },
        { name: "closing", type: "text", localized: true, required: true },
        {
          name: "items",
          type: "array",
          minRows: 6,
          maxRows: 6,
          admin: {
            description:
              "Exactly 6 items. Don't add or remove rows — edit in place.",
          },
          fields: [
            {
              name: "key",
              type: "select",
              required: true,
              options: [
                { label: "Profile (sparkles icon)", value: "profile" },
                { label: "Pricing (line chart icon)", value: "pricing" },
                { label: "Communication (messages icon)", value: "communication" },
                { label: "Cleaning (brush icon)", value: "cleaning" },
                { label: "Interior (palette icon)", value: "interior" },
                { label: "Security (shield icon)", value: "security" },
              ],
              admin: {
                description:
                  "Pick the visual identity for this row. Drives the icon and the fallback photo (used if no custom Image is uploaded). Each key should appear exactly once.",
              },
            },
            { name: "title", type: "text", localized: true, required: true },
            { name: "body", type: "textarea", localized: true, required: true },
            { name: "imageAlt", type: "text", localized: true, required: true },
            {
              name: "image",
              type: "upload",
              relationTo: "media",
              admin: {
                description:
                  "Optional custom photo for this row. Leave empty to use the built-in fallback for the chosen Key.",
              },
            },
          ],
        },
      ],
    },
    {
      slug: "pricing-plans",
      label: "Pricing section",
      admin: {
        description:
          "Editable copy for the 'Pricing' section. Exactly 3 plans — the 3-up grid is built for that count and would wrap awkwardly with a 4th card. Use the 'Icon' select on each plan to pick which icon shows.",
      },
      access: { read: () => true },
      fields: [
        { name: "eyebrow", type: "text", localized: true, required: true },
        { name: "heading", type: "text", localized: true, required: true },
        { name: "lead", type: "textarea", localized: true, required: true },
        {
          name: "cta",
          type: "text",
          localized: true,
          required: true,
          admin: { description: "Button label on every plan card." },
        },
        {
          name: "plans",
          type: "array",
          minRows: 3,
          maxRows: 3,
          admin: {
            description:
              "Exactly 3 plans. Don't add or remove cards — edit in place.",
          },
          fields: [
            {
              name: "icon",
              type: "select",
              required: true,
              options: [
                { label: "Rocket (Start Smart)", value: "rocket" },
                { label: "House (Full Care)", value: "house" },
                { label: "Wand (Home Refresh)", value: "wand" },
              ],
              admin: {
                description: "Icon shown on the card header. Each icon should appear exactly once.",
              },
            },
            { name: "name", type: "text", localized: true, required: true },
            {
              name: "cadence",
              type: "text",
              localized: true,
              required: true,
              admin: { description: "Short line under the plan name (e.g. 'One-off service')." },
            },
            {
              name: "price",
              type: "text",
              localized: true,
              required: true,
              admin: {
                description:
                  "The price as text — either a number ('200', '25') or a phrase ('Custom quote'). Phrases skip the unit treatment.",
              },
            },
            {
              name: "priceUnit",
              type: "text",
              localized: true,
              admin: {
                description:
                  "Unit shown next to a numeric price (e.g. 'EUR', '%'). Leave empty for phrase-style prices.",
              },
            },
            {
              name: "features",
              type: "array",
              localized: true,
              minRows: 1,
              fields: [{ name: "label", type: "text", required: true }],
            },
          ],
        },
      ],
    },
    {
      slug: "contacts",
      label: "Contacts section",
      admin: {
        description:
          "Editable copy + contact data for the 'Contacts' section (embedded on the home page and shown at /contacts/). Also feeds the floating call button, the footer email, and the SEO structured data.",
      },
      access: { read: () => true },
      fields: [
        // Section copy — visible chrome the owner may want to retune.
        { name: "eyebrow", type: "text", localized: true, required: true },
        { name: "heading", type: "text", localized: true, required: true },
        { name: "lead", type: "textarea", localized: true, required: true },
        {
          name: "serviceAreaHeading",
          type: "text",
          localized: true,
          required: true,
          admin: {
            description: "Heading on the small 'Where we work' card (e.g. 'Къде работим?').",
          },
        },
        {
          name: "serviceAreaBody",
          type: "textarea",
          localized: true,
          required: true,
          admin: {
            description: "Body of the 'Where we work' card — short description of the service area.",
          },
        },

        // Contact data — phones are explicit primary/secondary groups
        // (rather than a free-form array) so it's unambiguous in the
        // admin which number drives the bubble + WhatsApp link.
        { name: "email", type: "email", required: true },
        {
          name: "primaryPhone",
          type: "group",
          admin: {
            description:
              "The 'main' phone. Used wherever a single number is needed (the floating call bubble, the WhatsApp button), and shown first in the phone list on the Contacts section.",
          },
          fields: [
            {
              name: "display",
              type: "text",
              required: true,
              admin: { description: "What visitors see (e.g. '+359 88 514 6191'). Spaces allowed." },
            },
            {
              name: "dial",
              type: "text",
              required: true,
              admin: {
                description:
                  "What goes into tel: and wa.me/ links. No spaces. Keep the leading + (e.g. '+359885146191').",
              },
            },
          ],
        },
        {
          name: "secondaryPhone",
          type: "group",
          admin: {
            description:
              "Optional second phone, shown only on the Contacts section under the primary one. Leave both fields empty if there's only one number.",
          },
          fields: [
            {
              name: "display",
              type: "text",
              admin: { description: "Optional — leave blank to hide the second phone." },
            },
            {
              name: "dial",
              type: "text",
              admin: { description: "Required if 'Display' is filled. No spaces, keep the leading +." },
            },
          ],
        },
        {
          name: "addressLine",
          type: "text",
          localized: true,
          required: true,
          admin: {
            description:
              "The displayed street address as one line (e.g. '2770 гр. Банско, ул. Кралев двор №5').",
          },
        },
        {
          name: "addressMapsUrl",
          type: "text",
          required: true,
          admin: {
            description:
              "Google Maps link the address text points at. Open Google Maps, search the address, click Share → Copy link, paste here.",
          },
        },
        {
          name: "workingHours",
          type: "textarea",
          localized: true,
          admin: { description: "Optional — free-form text, one line per row." },
        },
        {
          name: "mapEmbedUrl",
          type: "text",
          admin: {
            description:
              "Optional — Google Maps embed URL (the src attribute from the embed iframe). Not currently rendered, kept for future map block.",
          },
        },
      ],
    },
    {
      slug: "social-links",
      label: "Social links",
      access: { read: () => true },
      fields: [
        {
          name: "links",
          type: "array",
          labels: { singular: "Link", plural: "Links" },
          fields: [
            {
              name: "platform",
              type: "select",
              required: true,
              options: [
                { label: "Facebook", value: "facebook" },
                { label: "Instagram", value: "instagram" },
                { label: "YouTube", value: "youtube" },
                { label: "TikTok", value: "tiktok" },
                { label: "LinkedIn", value: "linkedin" },
                { label: "Airbnb", value: "airbnb" },
                { label: "Booking", value: "booking" },
              ],
            },
            { name: "url", type: "text", required: true },
            {
              name: "label",
              type: "text",
              localized: true,
              admin: {
                description:
                  "Optional accessible label. Falls back to the platform name in the frontend.",
              },
            },
          ],
        },
      ],
    },
    // Listing-page SEO holders. The three pages /questions/, /blog/, and
    // /apartments/ used to take their meta from messages/<locale>.json,
    // invisible to the owner in admin. These Globals exist solely to
    // surface that meta in the SEO tab UX — same shape as the other
    // section Globals so the workflow is identical (auto-generate from
    // the live-site pattern in payload.config's generateTitle map, then
    // hand-tune as needed). Each Global has one `note` field for the
    // Content tab; the actual SEO fields are injected by plugin-seo.
    //
    // Why three Globals instead of one with sub-groups: plugin-seo adds
    // one `meta` group per doc, so a single Global with three sub-groups
    // would share ONE meta across all three listings. Three Globals,
    // grouped under "Listings" in the admin sidebar, gets us the per-page
    // SEO tab + SERP preview + image thumbnail for free.
    {
      slug: "listings-faq",
      label: "Listings — FAQ page",
      admin: {
        group: "Listings",
        description:
          "SEO settings for the FAQ listing page at /questions/. Edit meta title, description, and image in the SEO tab.",
      },
      access: { read: () => true },
      fields: [
        {
          name: "note",
          type: "textarea",
          localized: true,
          admin: {
            description:
              "Optional internal note (not displayed publicly). Use this space for your own reminders about this listing page.",
          },
        },
      ],
    },
    {
      slug: "listings-blog",
      label: "Listings — Blog page",
      admin: {
        group: "Listings",
        description:
          "SEO settings for the blog listing page at /blog/. Edit meta title, description, and image in the SEO tab. Per-post SEO lives on each blog post.",
      },
      access: { read: () => true },
      fields: [
        {
          name: "note",
          type: "textarea",
          localized: true,
          admin: {
            description:
              "Optional internal note (not displayed publicly). Use this space for your own reminders about this listing page.",
          },
        },
      ],
    },
    {
      slug: "listings-apartments",
      label: "Listings — Apartments page",
      admin: {
        group: "Listings",
        description:
          "SEO settings for the apartments listing page at /apartments/. Edit meta title, description, and image in the SEO tab. Individual apartments have their own SEO under the Apartments collection.",
      },
      access: { read: () => true },
      fields: [
        {
          name: "note",
          type: "textarea",
          localized: true,
          admin: {
            description:
              "Optional internal note (not displayed publicly). Use this space for your own reminders about this listing page.",
          },
        },
      ],
    },
  ],
  editor: lexicalEditor(),
  // Email transport for password-reset, account verification, and any
  // future Payload-initiated mail. Reuses the same Hostinger SMTP
  // mailbox as the contact form (info@home2host.com) — most SMTP
  // servers reject envelope-from mismatches as relay attempts, so the
  // FROM address must match SMTP_USER.
  //
  // Guarded by env-var presence: if any of the three SMTP_* vars is
  // missing, fall back to Payload's default console transport (writes
  // emails to the dev log, doesn't deliver). Keeps `npm run dev`
  // working on a fresh clone without Hostinger creds — the resulting
  // dev-mode warning ("Email transport not configured…") is the cue
  // that production needs the env vars set.
  email:
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD
      ? nodemailerAdapter({
          defaultFromAddress: process.env.SMTP_USER,
          defaultFromName: "Home2Host Admin",
          transportOptions: {
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 465,
            // Port 465 is implicit-TLS (the legacy "SSL" mode); 587 is
            // STARTTLS. `secure: true` means implicit-TLS — correct
            // for our Hostinger setup. If the port ever flips to 587,
            // also flip this to `false` so nodemailer upgrades the
            // connection via STARTTLS instead of expecting TLS from
            // byte zero.
            secure: (Number(process.env.SMTP_PORT) || 465) === 465,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASSWORD,
            },
          },
        })
      : undefined,
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || "",
    },
  }),
  sharp,
  plugins: [
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      collections: {
        media: { disablePayloadAccessControl: true },
      },
      token: process.env.BLOB_READ_WRITE_TOKEN || "",
    }),
    // Adds a `meta` field group (title + description + image) and a
    // live Google SERP preview to each enabled content type. The
    // tabbedUI option puts the group into its own "SEO" tab in the
    // edit form (cleaner than stacking the fields at the bottom).
    seoPlugin({
      collections: ["blog-posts", "apartments"],
      globals: [
        "landing-page",
        "about",
        "services",
        "pricing-plans",
        "contacts",
        "listings-faq",
        "listings-blog",
        "listings-apartments",
      ],
      uploadsCollection: "media",
      tabbedUI: true,
      // Replace the plugin's stock Preview field component (URL +
      // title + description only) with one that also renders the
      // uploaded meta.image as a thumbnail — image-rich SERP style.
      // See src/components/admin/SeoPreviewWithImage.tsx for the
      // motivation; the override here just remaps the field's
      // component path, leaving every other Preview prop intact.
      fields: ({ defaultFields }) =>
        defaultFields.map((field) => {
          if (
            field.type === "ui" &&
            "name" in field &&
            field.name === "preview"
          ) {
            return {
              ...field,
              admin: {
                ...(field.admin ?? {}),
                components: {
                  ...(field.admin?.components ?? {}),
                  Field: {
                    // Carry over the plugin's client-side props
                    // (descriptionPath, hasGenerateURLFn, titlePath)
                    // by spreading the existing Field config — our
                    // component accepts the same shape, so they pass
                    // straight through.
                    ...(typeof field.admin?.components?.Field === "object"
                      ? field.admin.components.Field
                      : {}),
                    path: "/components/admin/SeoPreviewWithImage#SeoPreviewWithImage",
                  },
                },
              },
            };
          }
          return field;
        }),
      // Content-type-aware defaults for the auto-generate buttons in
      // the SEO tab. The `doc` carries the current-locale resolved
      // fields (BG when clicked on BG tab, EN on EN); the `locale`
      // arg lets us emit a locale-appropriate brand+keyword suffix.
      //
      // Title formula matches the live WordPress site's existing SEO
      // pattern (which has accumulated Google ranking signal):
      //   "{short page name} - {keyword phrase} - Home2Host"
      // The keyword phrase is the part Google has indexed the site on.
      //
      // Per-slug "short page name" map is non-obvious but deliberate:
      // each Global's visible `heading` field carries marketing copy
      // ("Кои сме ние" — "Who we are"), not the short SEO label
      // ("За нас" — "About"). The map sidesteps that by hard-coding
      // the right short name per page, in both locales. If a new
      // Global is added later, fall through to the heading until the
      // map is updated.
      //
      // Description truncates to fit the 150-char SEO limit, preferring
      // a sentence boundary, then a word boundary, then a hard cut
      // with an ellipsis.
      generateTitle: ({ doc, locale, globalSlug, collectionSlug }) => {
        if (!doc || typeof doc !== "object") return "";
        const o = doc as Record<string, unknown>;
        const str = (v: unknown): string =>
          typeof v === "string" && v.length > 0 ? v : "";
        const isEn = locale === "en";

        const suffix = isEn
          ? " - Property Management in Bansko & Burgas - Home2Host"
          : " - Управление на Имоти в Банско и Бургас - Home2Host";
        const brandOnly = suffix.replace(/^ - /, "");

        // Landing page: no per-page short name — homepage's identity
        // is the brand+keyword itself.
        if (globalSlug === "landing-page") return brandOnly;

        // Per-Global short SEO label, BG + EN. Decoupled from the
        // visible `heading` field, which carries marketing phrasing.
        const SHORT_NAMES: Record<string, { bg: string; en: string }> = {
          about: { bg: "За нас", en: "About" },
          services: { bg: "Услуги", en: "Services" },
          "pricing-plans": { bg: "Цени", en: "Pricing" },
          contacts: { bg: "Контакти", en: "Contacts" },
          "listings-faq": {
            bg: "Често задавани въпроси",
            en: "Frequently asked questions",
          },
          "listings-blog": { bg: "Блог", en: "Blog" },
          "listings-apartments": { bg: "Апартаменти", en: "Apartments" },
        };

        if (globalSlug && SHORT_NAMES[globalSlug]) {
          const name = SHORT_NAMES[globalSlug][isEn ? "en" : "bg"];
          return `${name}${suffix}`;
        }

        // Collections (blog-posts, apartments): per-doc title is the
        // right "page name" — those vary per document.
        if (collectionSlug) {
          const title = str(o.title);
          if (title) return `${title}${suffix}`;
          return brandOnly;
        }

        // Defensive fallback for any future Global not in the map —
        // visible heading is better than nothing.
        const heading = str(o.heading);
        if (heading) return `${heading}${suffix}`;

        return brandOnly;
      },
      generateDescription: ({ doc, locale, globalSlug }) => {
        if (!doc || typeof doc !== "object") return "";
        const o = doc as Record<string, unknown>;
        const str = (v: unknown): string =>
          typeof v === "string" && v.length > 0 ? v : "";
        const isEn = locale === "en";

        // Listing pages (no content fields) get hardcoded live-site
        // descriptions per locale so the auto-generate button still
        // produces something useful. Owner can hand-tune afterwards.
        const LISTING_DESCRIPTIONS: Record<
          string,
          { bg: string; en: string }
        > = {
          "listings-faq": {
            bg: "Често задавани въпроси за управление на имоти за краткосрочен наем в Банско и Бургас — какво включват услугите ни, как ценообразуваме и какво осигуряваме за собствениците.",
            en: "Frequently asked questions about short-term rental property management in Bansko and Burgas — what our services include, how we price, and what we provide for owners.",
          },
          "listings-blog": {
            bg: "Блог за управление на краткосрочни наеми в България. Съвети за Airbnb мениджмънт, динамично ценообразуване, оптимизация на обяви и повишаване на доходността на имота.",
            en: "Blog about short-term rental management in Bulgaria. Tips on Airbnb management, dynamic pricing, listing optimization, and improving property returns.",
          },
          "listings-apartments": {
            bg: "Разгледайте имотите, които управляваме за краткосрочен наем в Банско и Бургас — професионално подготвени, готови да приемат гости през Airbnb и Booking.",
            en: "Browse the properties we manage for short-term rental in Bansko and Burgas — professionally prepared, ready for guests through Airbnb and Booking.",
          },
        };
        if (globalSlug && LISTING_DESCRIPTIONS[globalSlug]) {
          return LISTING_DESCRIPTIONS[globalSlug][isEn ? "en" : "bg"];
        }

        // Source order: excerpt (blog-posts) → lead (Globals with one)
        // → paragraph1 (About has no lead).
        const source =
          str(o.excerpt) || str(o.lead) || str(o.paragraph1);
        if (!source) return "";

        return truncateForMeta(source);
      },
      // Auto-generate button for the SEO tab's Meta Image. The owner
      // had been uploading the same image twice on every post — once
      // into `featuredImage` for the card, once into `meta.image` for
      // social shares. This wires the SEO Meta Image to default to
      // whatever image the doc already references, so the auto-generate
      // button doubles as a one-click "use the existing image".
      //
      // Return shape per plugin-seo: number ID, { id }, or "" to clear.
      // The form sends the current edit-buffer values (not the DB row),
      // and for upload fields that means the relation is just the ID —
      // not a resolved object — so a number is the right thing to return.
      //
      // Pages with no source image (about, pricing-plans, contacts,
      // listings-*) return "" → the field stays empty and the owner
      // uploads a custom OG image directly into the SEO tab.
      generateImage: ({ doc, globalSlug, collectionSlug }) => {
        if (!doc || typeof doc !== "object") return "";
        const o = doc as Record<string, unknown>;

        const asMediaId = (v: unknown): number | string => {
          if (typeof v === "number" || typeof v === "string") return v;
          if (v && typeof v === "object" && "id" in v) {
            const id = (v as { id: unknown }).id;
            if (typeof id === "number" || typeof id === "string") return id;
          }
          return "";
        };

        // Collections — both blog-posts and apartments have a
        // `featuredImage` field that already drives the visible card.
        if (
          collectionSlug === "blog-posts" ||
          collectionSlug === "apartments"
        ) {
          return asMediaId(o.featuredImage);
        }

        // Landing page — the hero's first uploaded image is the
        // natural OG image for the home page. The `images` array can
        // legitimately be empty (the frontend then falls back to the
        // built-in /hero-home.jpeg) — return "" in that case.
        if (globalSlug === "landing-page") {
          const images = Array.isArray(o.images) ? o.images : [];
          for (const row of images) {
            if (row && typeof row === "object" && "image" in row) {
              const id = asMediaId((row as { image: unknown }).image);
              if (id) return id;
            }
          }
          return "";
        }

        // Services — first row that has a custom uploaded image.
        // The 6 items default to in-code /services/{key}.jpg fallbacks
        // when no Image is uploaded, so most owners will skip this
        // until they add custom photography.
        if (globalSlug === "services") {
          const items = Array.isArray(o.items) ? o.items : [];
          for (const item of items) {
            if (item && typeof item === "object" && "image" in item) {
              const id = asMediaId((item as { image: unknown }).image);
              if (id) return id;
            }
          }
          return "";
        }

        return "";
      },
    }),
  ],
});
