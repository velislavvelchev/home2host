import { withPayload } from "@payloadcms/next/withPayload";
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

// next-intl's build-time plugin. Wires the request config in
// src/i18n/request.ts into the server runtime so getTranslations /
// useTranslations can load the right message bundle per request. Path
// is the plugin's default; passing it explicitly keeps the link
// visible to anyone reading next.config.ts in isolation.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Match the live WordPress URL shape (e.g. `/about-us/`, `/services/`)
  // so existing Google-indexed URLs keep resolving 1:1 after the DNS
  // switch in Stage 6. Without this, every section URL would be a 301
  // and we'd carry that redirect weight for the lifetime of the site.
  trailingSlash: true,

  // Packages that must NOT be bundled by Next.js for server use — they're
  // required at runtime as regular Node modules instead. nodemailer uses
  // dynamic Node-internal requires (`net`, `tls`, `dns`) that the
  // bundler can't statically resolve; without this opt-out the contact
  // form's server action throws an unhandled error at runtime (Vercel
  // shows "This page couldn't load — A server error occurred").
  serverExternalPackages: ["nodemailer"],

  // Hosts next/image is allowed to optimise from.
  //   - a0.muscache.com — Airbnb's image CDN, used by ApartmentsSection
  //     (each card's photo URL is the listing's og:image, baked in via
  //     scripts/fetch-airbnb-og-images.mjs).
  //   - *.public.blob.vercel-storage.com — Vercel Blob, where Payload
  //     uploads land (see ADR 0004). Used for blog post featured images
  //     and any other Media-backed content.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "a0.muscache.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },

  // Redirects for legacy WordPress URLs that Google still has indexed
  // from the previous site. The marketing section URLs (`/about-us/`,
  // `/services/`, etc.) already match the live WP slugs exactly thanks
  // to `trailingSlash: true` above, so they need no redirect. Blog post
  // slugs are also imported verbatim from WordPress (Strategy A in the
  // migration plan) → no per-post redirects either.
  //
  // What's left is two safe catch-alls for system URLs that have no
  // equivalent on the new site:
  //   - WP admin / login → drop to home (no admin on the new site)
  //   - Author / category / tag / feed / attachment / `?p=` → drop to
  //     home (no equivalent taxonomy yet; preserves crawl budget)
  //
  // `permanent: true` emits 308 (preserves method) — Google treats this
  // as a permanent move and transfers ranking signals to the target.
  async redirects() {
    return [
      // WP admin surface — public crawlers occasionally try these from
      // the old install.
      { source: "/wp-admin/:path*", destination: "/", permanent: true },
      { source: "/wp-login.php", destination: "/", permanent: true },

      // Legacy taxonomy / feed URLs Google may have indexed from the
      // WP install. Send to home rather than 404 so they pass any
      // accumulated authority back to a live page.
      { source: "/author/:path*", destination: "/", permanent: true },
      { source: "/category/:path*", destination: "/", permanent: true },
      { source: "/tag/:path*", destination: "/", permanent: true },
      { source: "/feed", destination: "/", permanent: true },
      { source: "/feed/:path*", destination: "/", permanent: true },
      { source: "/comments/feed", destination: "/", permanent: true },

      // Blog post slug remap: the original WordPress URL was a
      // percent-encoded Cyrillic slug ending in `-copy` (the live
      // post was likely a draft duplicate that never got renamed).
      // We imported it under a clean ASCII slug for consistency with
      // the other 5 posts. Redirect the legacy URL → new URL so any
      // crawler / inbound link that has the old form is preserved.
      {
        source:
          "/blog/%d1%80%d0%b5%d0%b3%d0%bb%d0%b0%d0%bc%d0%b5%d0%bd%d1%82-%d0%b5%d1%81-2024-1028-%d0%ba%d0%b0%d0%ba%d0%b2%d0%be-%d1%82%d1%80%d1%8f%d0%b1%d0%b2%d0%b0-%d0%b4%d0%b0-%d0%b7%d0%bd%d0%b0%d0%b5%d0%bc-copy",
        destination: "/blog/eu-regulation-2024-1028-what-to-know/",
        permanent: true,
      },
    ];
  },
};

// Compose order: next-intl first (wires the message-bundle plugin into
// the base config), then Payload (which expects the bundle hooks to
// already be present). Payload's wrapper is always the outermost.
export default withPayload(withNextIntl(nextConfig), {
  devBundleServerPackages: false,
});
