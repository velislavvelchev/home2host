import type { MetadataRoute } from "next";

// Dynamic sitemap, generated at build time. Lists every public marketing
// page so search engines have a clean crawl entry point.
//
// Lives in the (frontend) route group so Next.js scopes its URL to
// `/sitemap.xml` (root) — sitemaps must live at the site root for
// Google to honour them.
//
// `BASE_URL` matches the `metadataBase` set in (frontend)/layout.tsx.
// Update both at Stage 6 when the custom domain is live.
const BASE_URL = "https://home2host.vercel.app";

const STATIC_ROUTES = [
  { path: "/", priority: 1.0 },
  { path: "/about-us/", priority: 0.6 },
  { path: "/services/", priority: 0.8 },
  { path: "/apartments/", priority: 0.8 },
  { path: "/prices/", priority: 0.7 },
  { path: "/questions/", priority: 0.6 },
  { path: "/contacts/", priority: 0.6 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  // Hardcoded build-time date because Math.random / Date.now are not
  // available in some Next.js contexts; ISO timestamp captured at the
  // moment the slice ships, refreshed by re-generating sitemap on each
  // deploy.
  const lastModified = new Date("2026-06-11");

  return STATIC_ROUTES.map(({ path, priority }) => ({
    url: `${BASE_URL}${path}`,
    lastModified,
    // Weekly cadence — the marketing pages don't change daily, and an
    // overly-frequent hint can hurt crawl budget.
    changeFrequency: "weekly" as const,
    priority,
  }));
}
