import type { Metadata } from "next";
import { FaqSection } from "@/components/sections/FaqSection";

// Canonical → `/` for the same reason as the other section routes: the
// home page carries the full content of every section. See the sibling
// routes for the longer reasoning.
//
// URL is `/questions/` (not `/faq/`) to match the live WordPress slug.
// Per-page `openGraph` overrides the root layout's title/description so
// social-share previews for this URL read for the section, not the home.
// See sibling /about-us/page.tsx for the longer reasoning.
export const metadata: Metadata = {
  title: "Често задавани въпроси | Home2Host",
  description:
    "Отговори на най-честите въпроси за управлението на имоти за краткосрочен наем — регулации, ценообразуване, комисионна и още.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Често задавани въпроси | Home2Host",
    description:
      "Отговори на най-честите въпроси за управлението на имоти за краткосрочен наем — регулации, ценообразуване, комисионна и още.",
  },
};

export default function QuestionsPage() {
  return (
    <main className="flex-1">
      <FaqSection headingLevel="h1" />
    </main>
  );
}
