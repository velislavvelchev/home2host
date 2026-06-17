import type { Metadata } from "next";
import { PricesSection } from "@/components/sections/PricesSection";

// Canonical → `/` for the same reason as /about-us/ and /services/: the home
// page carries the full content of every section. See the sibling routes for
// the longer reasoning.
// Per-page `openGraph` overrides the root layout's title/description so
// social-share previews for this URL read for the section, not the home.
// See sibling /about-us/page.tsx for the longer reasoning.
export const metadata: Metadata = {
  title: "Цени | Home2Host",
  description:
    "Три плана за управление на имоти за краткосрочен наем — Start Smart за стартиране, Full Care за пълен мениджмънт и Home Refresh за интериорно обновяване.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Цени | Home2Host",
    description:
      "Три плана за управление на имоти за краткосрочен наем — Start Smart за стартиране, Full Care за пълен мениджмънт и Home Refresh за интериорно обновяване.",
  },
};

export default function PricesPage() {
  return (
    <main className="flex-1">
      <PricesSection headingLevel="h1" />
    </main>
  );
}
