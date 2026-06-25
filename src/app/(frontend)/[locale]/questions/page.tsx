import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { FaqSection } from "@/components/sections/FaqSection";
import { getPayloadInstance } from "@/lib/payload";
import { type Locale } from "@/i18n/routing";

type Params = { locale: string };

// Canonical → `/` for the same reason as the other section routes: the
// home page carries the full content of every section. See the sibling
// routes for the longer reasoning.
//
// URL is `/questions/` (not `/faq/`) to match the live WordPress slug.
//
// Meta is owner-controlled via the `listings-faq` Global → SEO tab.
// The owner has populated values for both locales, so no JSON fallback
// is needed.
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const payload = await getPayloadInstance();
  const listing = await payload.findGlobal({
    slug: "listings-faq",
    locale: locale as Locale,
    depth: 0,
  });
  const title = listing.meta?.title ?? undefined;
  const description = listing.meta?.description ?? undefined;
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
