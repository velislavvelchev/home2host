import type { MetadataRoute } from "next";
import { getPayloadInstance } from "@/lib/payload";
import type { BlogPost } from "@/payload-types";

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
  { path: "/blog/", priority: 0.7 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Hardcoded fallback date for static routes — the marketing pages
  // don't change daily, and we don't have build timestamps available in
  // this context. Refreshed by re-generating sitemap on each deploy.
  const lastModified = new Date("2026-06-15");

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(
    ({ path, priority }) => ({
      url: `${BASE_URL}${path}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority,
    }),
  );

  // Pull every published blog post and append. Failures here would break
  // the whole sitemap, which is worse than serving the static portion
  // alone — so we swallow errors and log instead.
  let postEntries: MetadataRoute.Sitemap = [];
  try {
    const payload = await getPayloadInstance();
    // No `_status` filter — Payload's default find already excludes
    // draft-only documents when `versions: { drafts: true }` is set.
    // See blog/page.tsx for the longer reasoning.
    const { docs } = await payload.find({
      collection: "blog-posts",
      limit: 500,
      locale: "bg",
      depth: 0,
    });
    postEntries = (docs as BlogPost[]).map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}/`,
      lastModified: new Date(post.updatedAt ?? post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch (err) {
    console.error("[sitemap] failed to load blog posts:", err);
  }

  return [...staticEntries, ...postEntries];
}
