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
// metaTitle / metaDescription live on the `services` Global so the owner
// can edit search-result copy alongside the section body in /admin.
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
  const title = services.metaTitle ?? undefined;
  const description = services.metaDescription ?? undefined;
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
