import type { MetadataRoute } from "next";

// robots.txt, generated dynamically by Next.js. Allow public marketing
// content; disallow the Payload admin and API routes (no SEO value, may
// leak schema or response shapes if indexed).

const BASE_URL = "https://home2host.vercel.app";

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
    host: BASE_URL,
  };
}
