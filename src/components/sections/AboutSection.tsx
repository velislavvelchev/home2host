import { getLocale } from "next-intl/server";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { getPayloadInstance } from "@/lib/payload";
import type { Locale } from "@/i18n/routing";

// Reusable across the home page (embedded under the hero) and the
// standalone /about-us/ route (rendered alone). Heading level swaps via
// prop: h2 when embedded under the hero's h1, h1 when standalone.
//
// Copy is read from the Payload `about` Global on every request — owner
// edits it in /admin like any other text block (BG tab → EN tab → save),
// no developer round-trip. Same self-serve pattern as FAQ/Apartments.
// The Global is a singleton on purpose: this section is one fixed block
// of copy, not a list, so a Collection would be the wrong shape.

type AboutSectionProps = {
  headingLevel?: "h1" | "h2";
};

export async function AboutSection({ headingLevel = "h2" }: AboutSectionProps) {
  const Heading = headingLevel;
  const locale = (await getLocale()) as Locale;

  const payload = await getPayloadInstance();
  const about = await payload.findGlobal({
    slug: "about",
    locale,
    depth: 0,
  });

  return (
    <section
      id="about-us"
      aria-labelledby="about-us-heading"
      className="bg-surface-muted"
    >
      <div className="mx-auto max-w-6xl px-gutter py-section">
        {/*
          Two staggered reveals: heading group first, paragraphs second.
          Matches the cascade pattern used in Services/Prices/FAQ/Contacts
          — the section animates in as the user scrolls down, instead of
          appearing fully formed on page load.
        */}
        <RevealOnScroll>
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 dark:bg-brand-900 dark:text-brand-100">
            <span className="size-1.5 rounded-full bg-brand-600" />
            {about.eyebrow}
          </span>

          <Heading
            id="about-us-heading"
            className="mt-6 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl"
          >
            {about.heading}
          </Heading>
        </RevealOnScroll>

        <RevealOnScroll delayIndex={1}>
          <div className="mt-8 grid gap-6 text-lg leading-relaxed text-foreground-muted md:grid-cols-2 md:gap-10">
            <p>{about.paragraph1}</p>
            <p>{about.paragraph2}</p>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
