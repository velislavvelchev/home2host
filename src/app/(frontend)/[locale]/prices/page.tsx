import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { PricesSection } from "@/components/sections/PricesSection";
import { getPayloadInstance } from "@/lib/payload";
import type { Locale } from "@/i18n/routing";

type Params = { locale: string };

// Canonical → `/` for the same reason as /about-us/ and /services/: the home
// page carries the full content of every section. See the sibling routes for
// the longer reasoning.
//
// metaTitle / metaDescription live on the `pricing-plans` Global so the owner
// can edit search-result copy alongside the plan cards in /admin.
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const payload = await getPayloadInstance();
  const pricing = await payload.findGlobal({
    slug: "pricing-plans",
    locale: locale as Locale,
    depth: 0,
  });
  const title = pricing.metaTitle ?? undefined;
  const description = pricing.metaDescription ?? undefined;
  return {
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: { title, description },
  };
}

export default async function PricesPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main className="flex-1">
      <PricesSection headingLevel="h1" />
    </main>
  );
}
