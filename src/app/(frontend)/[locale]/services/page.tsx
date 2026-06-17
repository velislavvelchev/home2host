import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ServicesSection } from "@/components/sections/ServicesSection";

type Params = { locale: string };

// Canonical → `/` for the same reason as /about-us/: the home page carries
// the full content of every section, so standalone section URLs exist to
// match the live WordPress URL shape and serve deep-links, not to compete
// with the home for keywords. See src/app/(frontend)/[locale]/about-us/page.tsx.
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Services" });
  const title = t("metaTitle");
  const description = t("metaDescription");
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
