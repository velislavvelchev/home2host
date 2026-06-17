import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PricesSection } from "@/components/sections/PricesSection";

type Params = { locale: string };

// Canonical → `/` for the same reason as /about-us/ and /services/: the home
// page carries the full content of every section. See the sibling routes for
// the longer reasoning.
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Prices" });
  const title = t("metaTitle");
  const description = t("metaDescription");
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
