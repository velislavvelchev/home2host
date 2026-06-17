import { useTranslations } from "next-intl";
import { RevealOnScroll } from "@/components/RevealOnScroll";

// Reusable across the home page (embedded under the hero) and the
// standalone /about-us/ route (rendered alone). Heading level swaps via
// prop: h2 when embedded under the hero's h1, h1 when standalone.

type AboutSectionProps = {
  headingLevel?: "h1" | "h2";
};

export function AboutSection({ headingLevel = "h2" }: AboutSectionProps) {
  const Heading = headingLevel;
  const t = useTranslations("About");

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
            {t("eyebrow")}
          </span>

          <Heading
            id="about-us-heading"
            className="mt-6 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl"
          >
            {t("heading")}
          </Heading>
        </RevealOnScroll>

        <RevealOnScroll delayIndex={1}>
          <div className="mt-8 grid gap-6 text-lg leading-relaxed text-foreground-muted md:grid-cols-2 md:gap-10">
            <p>{t("paragraph1")}</p>
            <p>{t("paragraph2")}</p>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
