import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

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
    ];
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
