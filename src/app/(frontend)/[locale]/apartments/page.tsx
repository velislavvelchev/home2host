import type { Metadata } from "next";
import { ApartmentsSection } from "@/components/sections/ApartmentsSection";

// Canonical → `/` for the same reason as the other section routes: the
// home page carries the full content of every section. See the sibling
// routes for the longer reasoning.
// Per-page `openGraph` overrides the root layout's title/description so
// social-share previews for this URL read for the section, not the home.
// See sibling /about-us/page.tsx for the longer reasoning.
export const metadata: Metadata = {
  title: "Апартаменти | Home2Host",
  description:
    "10 имота за краткосрочен наем в Банско и Бургас, управлявани от Home2Host. Разглеждайте и резервирайте директно през Airbnb.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Апартаменти | Home2Host",
    description:
      "10 имота за краткосрочен наем в Банско и Бургас, управлявани от Home2Host. Разглеждайте и резервирайте директно през Airbnb.",
  },
};

export default function ApartmentsPage() {
  return (
    <main className="flex-1">
      <ApartmentsSection headingLevel="h1" />
    </main>
  );
}
