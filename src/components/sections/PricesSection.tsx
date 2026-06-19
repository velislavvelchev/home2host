import type { LucideIcon } from "lucide-react";
import { Rocket, House, Wand2, Check } from "lucide-react";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { buttonStyles } from "@/components/Button";
import { getPayloadInstance } from "@/lib/payload";
import type { Locale } from "@/i18n/routing";

// Reusable across the home page (embedded after Services) and the standalone
// /prices/ route. `headingLevel` swaps h1/h2 so the document outline stays
// correct in both contexts — same contract as AboutSection/ServicesSection.
//
// Three equal-weight pricing cards (Start Smart, Full Care, Home Refresh) —
// not three tiers of the same product, three different offerings, so no
// "Recommended" highlight.
//
// Plans are read from the Payload `pricing-plans` Global on every request.
// Capped at exactly 3 entries because the 3-up grid is designed for that
// count; the admin shows 3 in-place editable cards. Icon is picked per
// card via a `select` field (rocket/house/wand) and resolved against the
// `icons` map below — keyed, not indexed, so reordering in admin keeps
// the right icon on the right card.
//
// Design notes vs the live WordPress version:
// - Different Lucide icon per card instead of the same house thrice — signals
//   distinct offerings instead of "same product, three sizes."
// - Drops the stacked indigo header + white body block (2018 SaaS pricing look)
//   for a single card surface with clean typography hierarchy.
// - Section bg is `bg-surface-muted` (same family as About) so the page
//   rhythm goes hero → About (muted) → Services (brand-tinted, signature) →
//   Prices (back to muted). Keeps Services as the one brand-colored section.

type PricesSectionProps = {
  headingLevel?: "h1" | "h2";
};

type PlanIconKey = "rocket" | "house" | "wand";

const icons: Record<PlanIconKey, LucideIcon> = {
  rocket: Rocket,
  house: House,
  wand: Wand2,
};

export async function PricesSection({ headingLevel = "h2" }: PricesSectionProps) {
  const Heading = headingLevel;
  const locale = (await getLocale()) as Locale;

  const payload = await getPayloadInstance();
  const pricing = await payload.findGlobal({
    slug: "pricing-plans",
    locale,
    depth: 0,
  });

  const plans = pricing.plans ?? [];

  return (
    <section
      id="prices"
      aria-labelledby="prices-heading"
      className="bg-surface-muted"
    >
      <div className="mx-auto max-w-6xl px-gutter py-section">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 dark:bg-brand-900 dark:text-brand-100">
          <span className="size-1.5 rounded-full bg-brand-600" />
          {pricing.eyebrow}
        </span>

        <Heading
          id="prices-heading"
          className="mt-6 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl"
        >
          {pricing.heading}
        </Heading>

        <p className="mt-6 max-w-prose text-lg leading-relaxed text-foreground-muted">
          {pricing.lead}
        </p>

        {/* 3-col grid only kicks in at `lg` (≥1024) — at `md` (768) the
            cards would be ~225px wide each, cramping the long Bulgarian
            feature text into narrow ribbons. Stacking at 768 gives each
            card the full content width to breathe; 1024+ still gets the
            scannable three-up layout. */}
        <ul className="mt-16 grid gap-6 lg:grid-cols-3 lg:gap-8">
          {plans.map((plan, index) => {
            const Icon = icons[plan.icon];
            // Numeric prices get the unit treatment (split typography);
            // the "Индивидуална оферта" / "Custom quote" plan needs the
            // whole string at a smaller display size since it's a phrase.
            const isNumericPrice = !!plan.priceUnit;
            return (
              <RevealOnScroll key={plan.id ?? `plan-${index}`} delayIndex={index}>
                <li className="flex h-full flex-col rounded-2xl border border-foreground-muted bg-surface p-6 md:p-8">
                  {/* Card header: icon + plan name + cadence */}
                  <div className="flex items-start gap-4">
                    <span
                      aria-hidden="true"
                      className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-800 dark:bg-brand-900 dark:text-brand-200"
                    >
                      <Icon className="size-6" strokeWidth={1.75} />
                    </span>
                    <div>
                      <h3 className="font-display text-2xl font-semibold tracking-tight">
                        {plan.name}
                      </h3>
                      <p className="mt-1 text-sm leading-snug text-foreground-muted">
                        {plan.cadence}
                      </p>
                    </div>
                  </div>

                  {/* Price block — separated by a hairline divider above
                      and below so it reads as the card's anchor point. */}
                  <div className="mt-8 border-y border-border py-6">
                    {isNumericPrice ? (
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-5xl font-semibold tracking-tight text-foreground">
                          {plan.price}
                        </span>
                        <span className="font-display text-2xl font-medium text-foreground-muted">
                          {plan.priceUnit}
                        </span>
                      </div>
                    ) : (
                      <span className="font-display text-2xl font-semibold tracking-tight text-foreground">
                        {plan.price}
                      </span>
                    )}
                  </div>

                  {/* Feature list */}
                  <ul className="mt-6 flex flex-col gap-3">
                    {(plan.features ?? []).map((feature) => (
                      <li
                        key={feature.id ?? feature.label}
                        className="flex items-start gap-3 text-sm leading-relaxed text-foreground-muted"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-300"
                        >
                          <Check className="size-3.5" strokeWidth={2.5} />
                        </span>
                        <span>{feature.label}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA pinned to card bottom via `mt-auto` so cards with
                      different feature-list lengths still align their CTAs. */}
                  <Link
                    href="/contacts/"
                    className={`${buttonStyles("primary", "md")} mt-8 w-full justify-center`}
                  >
                    {pricing.cta}
                  </Link>
                </li>
              </RevealOnScroll>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
