import type { Metadata } from "next";
import { ServicesSection } from "@/components/sections/ServicesSection";

// Canonical → `/` for the same reason as /about-us/: the home page carries
// the full content of every section, so standalone section URLs exist to
// match the live WordPress URL shape and serve deep-links, not to compete
// with the home for keywords. See src/app/(frontend)/about-us/page.tsx.
export const metadata: Metadata = {
  title: "Услуги | Home2Host",
  description:
    "Цялостно управление на имоти за краткосрочен наем — професионални обяви, динамично ценообразуване, комуникация с гости, почистване, поддръжка и сигурност.",
  alternates: {
    canonical: "/",
  },
};

export default function ServicesPage() {
  return (
    <main className="flex-1">
      <ServicesSection headingLevel="h1" />
    </main>
  );
}
