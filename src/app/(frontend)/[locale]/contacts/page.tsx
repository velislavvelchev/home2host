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
// metaTitle / metaDescription live on the `contacts` Global so the owner
// can edit search-result copy alongside the section body in /admin.
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
  const title = contacts.metaTitle ?? undefined;
  const description = contacts.metaDescription ?? undefined;
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
