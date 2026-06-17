import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactsSection } from "@/components/sections/contacts/ContactsSection";

type Params = { locale: string };

// Canonical → `/` for the same reason as the other section routes: the
// home page carries the full content of every section. See the sibling
// routes for the longer reasoning.
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Contacts" });
  const title = t("metaTitle");
  const description = t("metaDescription");
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
