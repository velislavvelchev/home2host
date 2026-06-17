import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FaqSection } from "@/components/sections/FaqSection";

type Params = { locale: string };

// Canonical → `/` for the same reason as the other section routes: the
// home page carries the full content of every section. See the sibling
// routes for the longer reasoning.
//
// URL is `/questions/` (not `/faq/`) to match the live WordPress slug.
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Faq" });
  const title = t("metaTitle");
  const description = t("metaDescription");
  return {
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: { title, description },
  };
}

export default async function QuestionsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main className="flex-1">
      <FaqSection headingLevel="h1" />
    </main>
  );
}
