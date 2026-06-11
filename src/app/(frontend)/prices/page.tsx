import type { Metadata } from "next";
import { PricesSection } from "@/components/sections/PricesSection";

// Canonical → `/` for the same reason as /about-us/ and /services/: the home
// page carries the full content of every section. See the sibling routes for
// the longer reasoning.
export const metadata: Metadata = {
  title: "Цени | Home2Host",
  description:
    "Три плана за управление на имоти за краткосрочен наем — Start Smart за стартиране, Full Care за пълен мениджмънт и Home Refresh за интериорно обновяване.",
  alternates: {
    canonical: "/",
  },
};

export default function PricesPage() {
  return (
    <main className="flex-1">
      <PricesSection headingLevel="h1" />
    </main>
  );
}
