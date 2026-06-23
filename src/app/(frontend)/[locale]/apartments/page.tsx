import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ApartmentsSection } from "@/components/sections/ApartmentsSection";
import { getPayloadInstance } from "@/lib/payload";
import { type Locale } from "@/i18n/routing";

type Params = { locale: string };

// Canonical → `/` for the same reason as the other section routes: the
// home page carries the full content of every section. See the sibling
// routes for the longer reasoning.
//
// Meta is owner-controlled via the `listings-apartments` Global → SEO
// tab. Falls back to the i18n JSON copy until the owner saves admin
// values.
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Apartments" });
  const payload = await getPayloadInstance();
  const listing = await payload.findGlobal({
    slug: "listings-apartments",
    locale: locale as Locale,
    depth: 0,
  });
  const title = listing.meta?.title || t("metaTitle");
  const description = listing.meta?.description || t("metaDescription");
  return {
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: { title, description },
  };
}

export default async function ApartmentsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main className="flex-1">
      <ApartmentsSection headingLevel="h1" />
    </main>
  );
}
