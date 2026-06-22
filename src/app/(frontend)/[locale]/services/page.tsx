import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { getPayloadInstance } from "@/lib/payload";
import type { Locale } from "@/i18n/routing";

type Params = { locale: string };

// Canonical → `/` for the same reason as /about-us/: the home page carries
// the full content of every section, so standalone section URLs exist to
// match the live WordPress URL shape and serve deep-links, not to compete
// with the home for keywords. See src/app/(frontend)/[locale]/about-us/page.tsx.
//
// SEO copy lives in the `services` Global's `meta` group (added by the
// @payloadcms/plugin-seo plugin) so the owner can edit search-result
// title + description alongside the section body in /admin's SEO tab.
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const payload = await getPayloadInstance();
  const services = await payload.findGlobal({
    slug: "services",
    locale: locale as Locale,
    depth: 0,
  });
  const title = services.meta?.title ?? undefined;
  const description = services.meta?.description ?? undefined;
  return {
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: { title, description },
  };
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main className="flex-1">
      <ServicesSection headingLevel="h1" />
    </main>
  );
}
