import type { Metadata } from "next";
import { ApartmentsSection } from "@/components/sections/ApartmentsSection";

// Canonical → `/` for the same reason as the other section routes: the
// home page carries the full content of every section. See the sibling
// routes for the longer reasoning.
export const metadata: Metadata = {
  title: "Апартаменти | Home2Host",
  description:
    "10 имота за краткосрочен наем в Банско и Бургас, управлявани от Home2Host. Разглеждайте и резервирайте директно през Airbnb.",
  alternates: {
    canonical: "/",
  },
};

export default function ApartmentsPage() {
  return (
    <main className="flex-1">
      <ApartmentsSection headingLevel="h1" />
    </main>
  );
}
