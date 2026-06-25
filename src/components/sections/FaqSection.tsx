import { ChevronDown } from "lucide-react";
import { getLocale } from "next-intl/server";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { getPayloadInstance } from "@/lib/payload";
import type { Locale } from "@/i18n/routing";

// Reusable across the home page (embedded after Prices) and the standalone
// /questions/ route. `headingLevel` swaps h1/h2 so the document outline
// stays correct in both contexts — same contract as the other sections.
//
// Implementation: native <details>/<summary> as the accordion primitive.
// Zero JS, full keyboard a11y, server-rendered. Chevron rotation is the
// only animation — native <details> height transition still has patchy
// browser support (`interpolate-size: allow-keywords` not in FF/Safari
// yet), so we accept instant open/close and let the chevron carry the
// visual feedback. Modern minimal.
//
// Q&A pairs are read from the Payload `faqs` collection on every request.
// The owner manages them in /admin (BG tab → EN tab → save) like blog
// posts — no developer round-trip for content edits. With localization
// enabled on the collection, passing `locale` selects the right language
// and untranslated EN fields fall back to BG via `defaultLocale` config.
//
// Eyebrow / heading / lead come from the `listings-faq` Global so the
// owner can edit them in admin (same shape as the About/Services/etc.
// Globals). All three are `required: true` in payload.config.ts — the
// Global can't be saved with empty values, so we read them directly
// without a fallback.

type FaqSectionProps = {
  headingLevel?: "h1" | "h2";
};

export async function FaqSection({ headingLevel = "h2" }: FaqSectionProps) {
  const Heading = headingLevel;
  const locale = (await getLocale()) as Locale;

  const payload = await getPayloadInstance();
  const [{ docs }, listing] = await Promise.all([
    payload.find({
      collection: "faqs",
      locale,
      sort: "order",
      // Higher than we'd ever expect — keeps a single round trip even if
      // the owner adds dozens of Q&As over time.
      limit: 100,
      depth: 0,
    }),
    payload.findGlobal({
      slug: "listings-faq",
      locale,
      depth: 0,
    }),
  ]);

  return (
    <section
      id="questions"
      aria-labelledby="questions-heading"
      className="bg-brand-800"
    >
      {/*
        All text colors below are locked (no dark: variants) because the
        section bg is locked to brand-800 in both light AND dark mode. The
        foreground / foreground-muted tokens swap by OS preference and would
        either be invisible (light mode: foreground = dark) or wrong-tone
        against the indigo bg, so we use explicit on-dark colors throughout.
      */}
      <div className="mx-auto max-w-6xl px-gutter py-section">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-900">
          <span className="size-1.5 rounded-full bg-brand-700" />
          {listing.eyebrow}
        </span>

        <Heading
          id="questions-heading"
          className="mt-6 max-w-3xl font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl"
        >
          {listing.heading}
        </Heading>

        <p className="mt-6 max-w-prose text-lg leading-relaxed text-brand-100">
          {listing.lead}
        </p>

        <ul className="mt-12 max-w-3xl divide-y divide-white/15">
          {docs.map((qa, index) => (
            <RevealOnScroll key={qa.id} delayIndex={index}>
              <li>
                <details className="group py-5">
                  {/*
                    Hide the native disclosure marker (the default triangle)
                    in both WebKit and standards browsers. The Lucide chevron
                    on the right replaces it; rotates 180° on open via
                    `group-open:rotate-180`.
                  */}
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left [&::-webkit-details-marker]:hidden">
                    <span className="font-display text-lg font-medium leading-snug text-white sm:text-xl">
                      {qa.question}
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      strokeWidth={2}
                      className="size-5 shrink-0 text-brand-200 transition-transform duration-300 ease-out group-open:rotate-180"
                    />
                  </summary>
                  <p className="mt-4 text-base leading-relaxed text-brand-100">
                    {qa.answer}
                  </p>
                </details>
              </li>
            </RevealOnScroll>
          ))}
        </ul>
      </div>
    </section>
  );
}
