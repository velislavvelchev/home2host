import type { MetadataRoute } from "next";

// robots.txt, generated dynamically by Next.js. Allow public marketing
// content; disallow the Payload admin and API routes (no SEO value, may
// leak schema or response shapes if indexed).
//
// Lives at `src/app/robots.ts` (NOT inside a route group like the rest
// of the marketing tree). Next.js 16 + Turbopack picks up robots.ts at
// the app root reliably but silently no-ops it from inside a route
// group — discovered when the file was originally placed in
// `(frontend)` and the route never appeared in the build output.
// Sitemap doesn't have the same quirk: `(frontend)/sitemap.ts` works.

const BASE_URL = "https://home2host.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
