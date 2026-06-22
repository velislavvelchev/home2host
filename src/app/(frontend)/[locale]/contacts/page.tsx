import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { ContactsSection } from "@/components/sections/contacts/ContactsSection";
import { getPayloadInstance } from "@/lib/payload";
import type { Locale } from "@/i18n/routing";

type Params = { locale: string };

// Canonical → `/` for the same reason as the other section routes: the
// home page carries the full content of every section. See the sibling
// routes for the longer reasoning.
//
// SEO copy lives in the `contacts` Global's `meta` group (added by the
// @payloadcms/plugin-seo plugin) so the owner can edit search-result
// title + description alongside the section body in /admin's SEO tab.
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const payload = await getPayloadInstance();
  const contacts = await payload.findGlobal({
    slug: "contacts",
    locale: locale as Locale,
    depth: 0,
  });
  const title = contacts.meta?.title ?? undefined;
  const description = contacts.meta?.description ?? undefined;
  return {
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: { title, description },
  };
}

export default async function ContactsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main className="flex-1">
      <ContactsSection headingLevel="h1" />
    </main>
  );
}
