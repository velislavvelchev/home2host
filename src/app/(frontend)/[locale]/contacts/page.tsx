import type { Metadata } from "next";
import { ContactsSection } from "@/components/sections/contacts/ContactsSection";

// Canonical → `/` for the same reason as the other section routes: the
// home page carries the full content of every section. See the sibling
// routes for the longer reasoning.
// Per-page `openGraph` overrides the root layout's title/description so
// social-share previews for this URL read for the section, not the home.
// See sibling /about-us/page.tsx for the longer reasoning.
export const metadata: Metadata = {
  title: "Контакти | Home2Host",
  description:
    "Свържете се с Home2Host за управление на имота ви за краткосрочен наем в Бургас, Банско и околните региони — телефон, имейл, WhatsApp и форма за запитване.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Контакти | Home2Host",
    description:
      "Свържете се с Home2Host за управление на имота ви за краткосрочен наем в Бургас, Банско и околните региони — телефон, имейл, WhatsApp и форма за запитване.",
  },
};

export default function ContactsPage() {
  return (
    <main className="flex-1">
      <ContactsSection headingLevel="h1" />
    </main>
  );
}
