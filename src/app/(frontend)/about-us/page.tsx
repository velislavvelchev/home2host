import type { Metadata } from "next";
import { AboutSection } from "@/components/sections/AboutSection";

// Canonical points at `/` because the home page carries the full
// content of every section (preserving the SEO authority the live
// WordPress home has accumulated). Standalone section URLs exist to
// match the live URL shape and serve direct deep-links, but they
// should NOT compete with the home for the same keywords — hence
// the canonical signal.
// Per-page `openGraph` overrides the root layout's title/description so
// social-share previews for this URL read for the section, not the home
// page. `images` is intentionally left to inherit the root's OG image —
// per-section share images are a separate design slice.
export const metadata: Metadata = {
  title: "За нас | Home2Host",
  description:
    "Home2Host е компания за професионално управление на имоти за краткосрочен наем в Банско и Бургас.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "За нас | Home2Host",
    description:
      "Home2Host е компания за професионално управление на имоти за краткосрочен наем в Банско и Бургас.",
  },
};

export default function AboutUsPage() {
  return (
    <main className="flex-1">
      <AboutSection headingLevel="h1" />
    </main>
  );
}
