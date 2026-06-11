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

  // Allow next/image to load + optimise Airbnb listing photos. Used by
  // ApartmentsSection — each card's photo URL is the listing's og:image,
  // baked into the listings array via scripts/fetch-airbnb-og-images.mjs.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "a0.muscache.com" },
    ],
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
