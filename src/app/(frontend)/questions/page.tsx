import type { Metadata } from "next";
import { FaqSection } from "@/components/sections/FaqSection";

// Canonical → `/` for the same reason as the other section routes: the
// home page carries the full content of every section. See the sibling
// routes for the longer reasoning.
//
// URL is `/questions/` (not `/faq/`) to match the live WordPress slug.
export const metadata: Metadata = {
  title: "Често задавани въпроси | Home2Host",
  description:
    "Отговори на най-честите въпроси за управлението на имоти за краткосрочен наем — регулации, ценообразуване, комисионна и още.",
  alternates: {
    canonical: "/",
  },
};

export default function QuestionsPage() {
  return (
    <main className="flex-1">
      <FaqSection headingLevel="h1" />
    </main>
  );
}
