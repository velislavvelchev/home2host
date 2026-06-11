import { RevealOnScroll } from "@/components/RevealOnScroll";

// Reusable across the home page (embedded under the hero) and the
// standalone /about-us/ route (rendered alone). Heading level swaps via
// prop: h2 when embedded under the hero's h1, h1 when standalone.

type AboutSectionProps = {
  headingLevel?: "h1" | "h2";
};

export function AboutSection({ headingLevel = "h2" }: AboutSectionProps) {
  const Heading = headingLevel;

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
            За нас
          </span>

          <Heading
            id="about-us-heading"
            className="mt-6 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl"
          >
            Кои сме ние?
          </Heading>
        </RevealOnScroll>

        <RevealOnScroll delayIndex={1}>
          <div className="mt-8 grid gap-6 text-lg leading-relaxed text-foreground-muted md:grid-cols-2 md:gap-10">
            <p>
              Home2Host е компания, създадена с цел да осигури професионално
              управление на имоти за краткосрочен наем. Отдаването на имоти за
              краткосрочен наем чрез платформи като Airbnb, Booking и други,
              става все по-популярно и предпочитано. Това дава възможност на
              собствениците не само да получават допълнителен доход от имота
              си, но и да го използват при нужда.
            </p>
            <p>
              Тази дейност обаче изисква време и усилия – почистване,
              комуникация с гостите, посрещане, настаняване и регулиране на
              цените. Home2Host поема всички тези ангажименти и се грижи за
              цялостното управление на имота ви, като се фокусира върху
              оптимизацията и максимизирането на доходите ви.
            </p>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
