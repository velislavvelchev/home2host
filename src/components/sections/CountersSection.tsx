import { getLocale } from "next-intl/server";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { CountUp } from "@/components/sections/CountUp";
import { getPayloadInstance } from "@/lib/payload";
import type { Locale } from "@/i18n/routing";
import type { Counter } from "@/payload-types";

// Stats band on the home page, between About and Services. Reads the
// `counters` Global by locale — resolved at build/regeneration time like
// every other section Global, so the page stays SSG (ADR 0006). No cookie
// or header reads here; the count-up animation lives entirely in the
// client-only CountUp component.
//
// `headingLevel` kept for parity with the other section components — this
// section is home-page-only (no standalone route), embedded under the
// hero's h1, so it defaults to h2.

type CountersSectionProps = {
  headingLevel?: "h1" | "h2";
};

type Stat = NonNullable<Counter["items"]>[number];

// Clean grid column count per stat count, so 2/3/4 stats each get a layout
// that fills the row instead of leaving an orphan. Stacked on phones.
function gridColsFor(count: number): string {
  if (count >= 4) return "grid-cols-2 lg:grid-cols-4";
  if (count === 3) return "grid-cols-1 md:grid-cols-3";
  return "grid-cols-1 sm:grid-cols-2";
}

export async function CountersSection({
  headingLevel = "h2",
}: CountersSectionProps) {
  const Heading = headingLevel;
  const locale = (await getLocale()) as Locale;

  const payload = await getPayloadInstance();
  const counters = await payload.findGlobal({
    slug: "counters",
    locale,
    depth: 0,
  });

  // Defensive guard: a never-saved Global comes back with undefined fields.
  // Drop rows missing a numeric value or a label, and render nothing at all
  // if there's no usable stat — a chrome-only band would look broken.
  const items: Stat[] = (counters.items ?? []).filter(
    (item): item is Stat =>
      typeof item.value === "number" && Boolean(item.label),
  );
  if (items.length === 0) return null;

  return (
    <section
      id="counters"
      aria-labelledby="counters-heading"
      // Deep brand-indigo band with fixed brand colors (theme-independent,
      // like the Apartments navy cards) — high contrast against the light/
      // muted sections above and below, and identical in light & dark mode.
      className="relative overflow-hidden bg-brand-900"
    >
      {/*
        Ambient decorative glow blobs, same idea as the hero — brand-tinted,
        blurred, pulsing out of phase. motion-safe gated so reduced-motion
        users get the static band. Behind the content (-z-0 / content wrapped
        above), pointer-events-none so they never intercept clicks.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 size-[28rem] rounded-full bg-brand-500/30 blur-3xl motion-safe:animate-glow"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-16 size-[24rem] rounded-full bg-brand-400/20 blur-3xl motion-safe:animate-glow motion-safe:[animation-delay:-4s]"
      />

      <div className="relative mx-auto max-w-6xl px-gutter py-section">
        <RevealOnScroll>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-brand-100">
            <span className="size-1.5 rounded-full bg-brand-300" />
            {counters.eyebrow}
          </span>

          <Heading
            id="counters-heading"
            className="mt-6 max-w-3xl font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl"
          >
            {counters.heading}
          </Heading>

          <p className="mt-6 max-w-prose text-lg leading-relaxed text-brand-100/80">
            {counters.lead}
          </p>
        </RevealOnScroll>

        <RevealOnScroll delayIndex={1}>
          <ul
            className={`mt-12 grid gap-6 sm:gap-8 ${gridColsFor(items.length)}`}
          >
            {items.map((item, index) => (
              <li
                key={item.id ?? index}
                className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center backdrop-blur-sm transition duration-300 ease-out motion-safe:hover:-translate-y-1 hover:border-white/20 hover:bg-white/10"
              >
                <span className="font-display text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
                  <CountUp value={item.value} locale={locale} />
                  {item.suffix ? (
                    <span className="text-brand-300">{item.suffix}</span>
                  ) : null}
                </span>
                <span className="mt-3 text-base font-medium text-brand-100/70 sm:text-lg">
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </RevealOnScroll>
      </div>
    </section>
  );
}
