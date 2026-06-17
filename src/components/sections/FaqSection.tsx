import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { RevealOnScroll } from "@/components/RevealOnScroll";

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
// Q&A pairs live in `messages/<locale>.json` under `Faq.items`. The live
// site's "BnB Manager" typo in the last answer is corrected to
// "Home2Host" in the BG copy — see content-inventory-findings memory.

type FaqSectionProps = {
  headingLevel?: "h1" | "h2";
};

type QA = { question: string; answer: string };

export function FaqSection({ headingLevel = "h2" }: FaqSectionProps) {
  const Heading = headingLevel;
  const t = useTranslations("Faq");
  const items = t.raw("items") as QA[];

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
          {t("eyebrow")}
        </span>

        <Heading
          id="questions-heading"
          className="mt-6 max-w-3xl font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl"
        >
          {t("heading")}
        </Heading>

        <p className="mt-6 max-w-prose text-lg leading-relaxed text-brand-100">
          {t("lead")}
        </p>

        <ul className="mt-12 max-w-3xl divide-y divide-white/15">
          {items.map((qa, index) => (
            <RevealOnScroll key={qa.question} delayIndex={index}>
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
