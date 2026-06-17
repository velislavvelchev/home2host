import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AboutSection } from "@/components/sections/AboutSection";

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
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "About" });
  const title = t("metaTitle");
  const description = t("metaDescription");
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
