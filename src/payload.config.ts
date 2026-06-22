import { postgresAdapter } from "@payloadcms/db-postgres";
import { seoPlugin } from "@payloadcms/plugin-seo";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";
import sharp from "sharp";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
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
      auth: true,
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
  ],
  editor: lexicalEditor(),
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
      ],
      uploadsCollection: "media",
      tabbedUI: true,
      // Content-type-aware defaults for the auto-generate buttons.
      // The `doc` passed in carries the current-locale resolved fields,
      // so clicking auto-generate on the BG tab pulls BG content and
      // on the EN tab pulls EN content — same function, both locales.
      //
      // Order of preference (first non-empty wins):
      //   1. Collection-specific source (title / excerpt).
      //   2. Landing-page's split title parts, stitched.
      //   3. Section heading / lead body, where present.
      generateTitle: ({ doc }) => {
        if (!doc || typeof doc !== "object") return "";
        const o = doc as Record<string, unknown>;
        const str = (v: unknown): string =>
          typeof v === "string" && v.length > 0 ? v : "";

        const title = str(o.title);
        if (title) return `${title} — Home2Host`;

        const stitched = [
          str(o.titleBefore),
          str(o.titleHighlight),
          str(o.titleAfter),
        ]
          .filter(Boolean)
          .join(" ");
        if (stitched) return `${stitched} — Home2Host`;

        const heading = str(o.heading);
        if (heading) return `${heading} — Home2Host`;

        return "";
      },
      generateDescription: ({ doc }) => {
        if (!doc || typeof doc !== "object") return "";
        const o = doc as Record<string, unknown>;
        const str = (v: unknown): string =>
          typeof v === "string" && v.length > 0 ? v : "";

        const excerpt = str(o.excerpt);
        if (excerpt) return excerpt;

        const lead = str(o.lead);
        if (lead) return lead;

        return "";
      },
    }),
  ],
});
