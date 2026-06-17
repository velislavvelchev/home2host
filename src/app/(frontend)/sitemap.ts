import type { MetadataRoute } from "next";
import { getPayloadInstance } from "@/lib/payload";
import { routing } from "@/i18n/routing";
import type { BlogPost } from "@/payload-types";

// Dynamic sitemap, generated at build time. Lists every public URL on
// the site with hreflang alternates so Google knows which version to
// serve for which audience.
//
// URL shape per ADR 0005:
//   - BG (default locale): unprefixed — /, /about-us/, ...
//   - EN: prefixed — /en, /en/about-us/, ...
//
// Each entry lists itself + every sister locale in `alternates.languages`
// so Google can connect the pages. The entry for /about-us/ and the
// entry for /en/about-us/ both contain the same alternates block.
//
// Blog posts: a post is only included in a locale's sitemap if it has
// content authored for that locale (BG always; EN only when the owner
// has filled the post's EN fields in Payload). Listing /en/blog/<slug>/
// with hreflang=en but no real EN content would invite Google to index a
// page that falls back to BG copy + a "translation pending" notice —
// hurts the EN search experience and our SEO.
//
// Lives in the (frontend) route group so Next.js scopes its URL to
// `/sitemap.xml` (root). Sitemaps must live at the site root for Google
// to honour them.
//
// `BASE_URL` matches the `metadataBase` set in (frontend)/[locale]/layout.tsx.
// Update both at Stage 6 when the custom domain is live.
const BASE_URL = "https://home2host.vercel.app";

type StaticRoute = { path: string; priority: number };

const STATIC_ROUTES: StaticRoute[] = [
  { path: "/", priority: 1.0 },
  { path: "/about-us/", priority: 0.6 },
  { path: "/services/", priority: 0.8 },
  { path: "/apartments/", priority: 0.8 },
  { path: "/prices/", priority: 0.7 },
  { path: "/questions/", priority: 0.6 },
  { path: "/contacts/", priority: 0.6 },
  { path: "/blog/", priority: 0.7 },
];

// Build the locale-prefixed URL for a path. BG (default) is unprefixed
// per `localePrefix: 'as-needed'`; other locales get the /locale/ prefix.
// The home path "/" becomes just "/<locale>" — no trailing slash —
// because that's the canonical Next.js shape for the locale root.
function localePath(path: string, locale: string): string {
  const isDefault = locale === routing.defaultLocale;
  if (path === "/") return isDefault ? "/" : `/${locale}`;
  return isDefault ? path : `/${locale}${path}`;
}

// hreflang `alternates.languages` map shared by both entries of a
// localised URL pair. Given `/about-us/`, this produces:
//   { bg: '.../about-us/', en: '.../en/about-us/' }
function alternatesFor(
  path: string,
  availableLocales: readonly string[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const locale of availableLocales) {
    out[locale] = `${BASE_URL}${localePath(path, locale)}`;
  }
  return out;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Hardcoded fallback date for static routes — the marketing pages
  // don't change daily, and we don't have build timestamps available in
  // this context. Refreshed by re-generating sitemap on each deploy.
  const lastModified = new Date("2026-06-17");

  // Every static route exists in every configured locale — emit one
  // entry per (locale × path) pair, each carrying the full alternates
  // block for that path. This is what Google expects: every URL
  // self-references in its own hreflang group.
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.flatMap(
    ({ path, priority }) => {
      const languages = alternatesFor(path, routing.locales);
      return routing.locales.map((locale) => ({
        url: `${BASE_URL}${localePath(path, locale)}`,
        lastModified,
        changeFrequency: "weekly" as const,
        priority,
        alternates: { languages },
      }));
    },
  );

  // Pull every published blog post and emit per-locale entries. For
  // each post we probe Payload with `fallbackLocale: false` to detect
  // which locales actually have translated content; we list only those
  // in the sitemap (and in each entry's alternates block). A post that
  // has not been translated to EN yet appears under /blog/<slug>/ only,
  // and gets promoted to /en/blog/<slug>/ + an alternates pair on the
  // next sitemap regeneration after the owner fills its EN fields in
  // the admin.
  //
  // Failures here would break the whole sitemap, which is worse than
  // serving the static portion alone — so we swallow errors and log.
  let postEntries: MetadataRoute.Sitemap = [];
  try {
    const payload = await getPayloadInstance();
    // Default fetch in BG — slug + updatedAt + publishedAt + title are
    // all we need. BG content is the source of truth for "this post
    // exists at all".
    const { docs } = await payload.find({
      collection: "blog-posts",
      limit: 500,
      locale: "bg",
      depth: 0,
    });
    const posts = docs as BlogPost[];

    // Per-post: find which non-BG locales have a translated title.
    // Title is the cheapest proxy for "has been translated" — owners
    // who fill EN fields fill the title first; if it's still null,
    // there's no EN content to serve.
    const enabledLocalesByPost = new Map<string, string[]>();
    for (const post of posts) {
      const available: string[] = [routing.defaultLocale];
      for (const locale of routing.locales) {
        if (locale === routing.defaultLocale) continue;
        const localised = await payload.findByID({
          collection: "blog-posts",
          id: post.id,
          locale,
          fallbackLocale: false,
          depth: 0,
        });
        if ((localised as BlogPost).title) available.push(locale);
      }
      enabledLocalesByPost.set(String(post.id), available);
    }

    postEntries = posts.flatMap((post) => {
      const available = enabledLocalesByPost.get(String(post.id)) ?? [
        routing.defaultLocale,
      ];
      const path = `/blog/${post.slug}/`;
      const languages = alternatesFor(path, available);
      return available.map((locale) => ({
        url: `${BASE_URL}${localePath(path, locale)}`,
        lastModified: new Date(post.updatedAt ?? post.publishedAt),
        changeFrequency: "monthly" as const,
        priority: 0.6,
        alternates: { languages },
      }));
    });
  } catch (err) {
    console.error("[sitemap] failed to load blog posts:", err);
  }

  return [...staticEntries, ...postEntries];
}
