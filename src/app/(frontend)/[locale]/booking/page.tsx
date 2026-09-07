import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { BookingSection } from "@/components/sections/booking/BookingSection";
import { getPayloadInstance } from "@/lib/payload";
import type { Locale } from "@/i18n/routing";

type Params = { locale: string };

// Unlike the section routes (which canonical → `/` because the home page
// carries their full content), /booking/ is a unique page with no home-
// page embed, so it is SELF-canonical: we don't set `alternates.canonical`
// at all, matching the blog detail route — Next.js then emits no canonical
// override and the page self-references. hreflang for the BG/EN pair is
// handled by the sitemap.
//
// SEO copy lives in the `booking` Global's `meta` group (added by
// @payloadcms/plugin-seo), editable in /admin's SEO tab. Empty until the
// owner runs auto-generate / hand-tunes → falls back to the root layout's
// default title + description.
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const payload = await getPayloadInstance();
  const booking = await payload.findGlobal({
    slug: "booking",
    locale: locale as Locale,
    depth: 0,
  });
  const title = booking.meta?.title ?? undefined;
  const description = booking.meta?.description ?? undefined;
  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function BookingPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main className="flex-1">
      <BookingSection headingLevel="h1" />
    </main>
  );
}
