import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { AboutSection } from "@/components/sections/AboutSection";
import { getPayloadInstance } from "@/lib/payload";
import type { Locale } from "@/i18n/routing";

type Params = { locale: string };

// Canonical points at `/` because the home page carries the full
// content of every section (preserving the SEO authority the live
// WordPress home has accumulated). Standalone section URLs exist to
// match the live URL shape and serve direct deep-links, but they
// should NOT compete with the home for the same keywords — hence
// the canonical signal.
// Per-page `openGraph` overrides the root layout's title/description so
// social-share previews for this URL read for the section, not the home
// page. `images` is intentionally left to inherit the root's OG image —
// per-section share images are a separate design slice.
//
// SEO copy lives in the `about` Global's `meta` group (added by the
// @payloadcms/plugin-seo plugin) so the owner can edit search-result
// title + description alongside the section body in /admin's SEO tab.
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const payload = await getPayloadInstance();
  const about = await payload.findGlobal({
    slug: "about",
    locale: locale as Locale,
    depth: 0,
  });
  const title = about.meta?.title ?? undefined;
  const description = about.meta?.description ?? undefined;
  return {
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: { title, description },
  };
}

export default async function AboutUsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main className="flex-1">
      <AboutSection headingLevel="h1" />
    </main>
  );
}
