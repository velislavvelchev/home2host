import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  LineChart,
  MessagesSquare,
  Brush,
  Palette,
  ShieldCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { RevealOnScroll } from "@/components/RevealOnScroll";

// Reusable across the home page (embedded after About) and the standalone
// /services/ route. `headingLevel` swaps h1/h2 so the document outline
// stays correct in both contexts — same contract as AboutSection.
//
// Layout: alternating image/text rows (modern editorial pattern). On `lg+`
// odd rows have the image on the left, even rows on the right; on mobile
// everything stacks (image on top, text below). The icon + numbered
// indicator sits inline with the heading on each row — a single rich
// "what we do" pass, not the live site's two-pass icon-grid-then-text
// repetition.
//
// Images live in `public/services/` and were sourced from the Stage 0
// content inventory (same Pexels stock the live WordPress site uses).
// Replace with owned photography in a later slice when the owner has it.
//
// Service text (title + body + imageAlt) lives in messages/<locale>.json
// under `Services.items`. The visuals (icon + image path) stay in code
// and are paired with the translated text by index — the order MUST
// match between `visuals` and `Services.items`.

type ServicesSectionProps = {
  headingLevel?: "h1" | "h2";
};

type ServiceVisual = { icon: LucideIcon; image: string };
type ServiceText = { title: string; body: string; imageAlt: string };

const visuals: ServiceVisual[] = [
  { icon: Sparkles,      image: "/services/profile.jpg"      },
  { icon: LineChart,     image: "/services/pricing.jpg"      },
  { icon: MessagesSquare, image: "/services/communication.jpg" },
  { icon: Brush,         image: "/services/cleaning.jpg"     },
  { icon: Palette,       image: "/services/interior.jpg"     },
  { icon: ShieldCheck,   image: "/services/security.jpg"     },
];

export function ServicesSection({ headingLevel = "h2" }: ServicesSectionProps) {
  const Heading = headingLevel;
  const t = useTranslations("Services");
  const items = t.raw("items") as ServiceText[];

  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="bg-brand-50/60 dark:bg-[#1a2245]"
    >
      <div className="mx-auto max-w-6xl px-gutter py-section">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 dark:bg-brand-900 dark:text-brand-100">
          <span className="size-1.5 rounded-full bg-brand-600" />
          {t("eyebrow")}
        </span>

        <Heading
          id="services-heading"
          className="mt-6 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl"
        >
          {t("heading")}
        </Heading>

        <p className="mt-6 max-w-prose text-lg leading-relaxed text-foreground-muted">
          {t("lead")}
        </p>

        {/*
          Overview grid — a fast scannable "menu" of the six services.
          Each tile is an anchor jumping to its matching detail row below
          (`#service-1`…`#service-6`). Hover state is coordinated via
          `group` / `group-hover:`: tile border darkens to brand, the icon
          square deepens + scales slightly, and the whole tile lifts ~2px.
          All transitions are 300ms; smooth-scroll on `<html>` is gated by
          `prefers-reduced-motion` in `globals.css`.
        */}
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((service, index) => {
            const Icon = visuals[index].icon;
            return (
              <li key={`overview-${service.title}`}>
                <a
                  href={`#service-${index + 1}`}
                  className="group flex h-full flex-col rounded-2xl border border-brand-200 bg-surface p-6 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-brand-700 hover:bg-brand-50/40 dark:border-brand-700 dark:hover:border-brand-400 dark:hover:bg-brand-900/30"
                >
                  <span
                    aria-hidden="true"
                    className="inline-flex size-14 items-center justify-center rounded-xl bg-brand-50 text-brand-800 transition-all duration-300 ease-out group-hover:scale-105 group-hover:bg-brand-100 group-hover:shadow-1 dark:bg-brand-900 dark:text-brand-200 dark:group-hover:bg-brand-800"
                  >
                    <Icon className="size-7" strokeWidth={1.75} />
                  </span>
                  {/* `<span>`, not `<h3>` — the overview is a navigation
                      block that links to the canonical h3 on each detail
                      row below. Keeping both as headings would double up
                      the section outline and confuse screen readers. */}
                  <span className="mt-5 font-display text-base font-semibold tracking-tight text-foreground transition-colors duration-300 group-hover:text-brand-800 dark:group-hover:text-brand-200">
                    {service.title}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>

        <ol className="mt-20 flex flex-col gap-8 md:gap-10">
          {items.map((service, index) => {
            const { icon: Icon, image } = visuals[index];
            const isImageRight = index % 2 === 1;
            return (
              <RevealOnScroll key={service.title}>
                {/*
                  Bordered rectangle wrapping each row — defines a visual
                  region without the 2018 drop-shadow card look. Generous
                  rounded-2xl plus inner padding so the photo and text both
                  get breathing room inside. `scroll-mt-24` clears the
                  sticky 64px header when the row is the anchor target.
                */}
                <li
                  id={`service-${index + 1}`}
                  className="grid scroll-mt-24 items-center gap-8 rounded-2xl border border-foreground-muted p-6 md:grid-cols-12 md:gap-12 md:p-10 lg:gap-16"
                >
                  {/*
                    Order classes drive the alternation on `md+`. On mobile
                    the image always comes first (natural reading order), so
                    the photo introduces the section before the words explain
                    it — feels less like a wall of text.
                  */}
                  <div
                    className={`md:col-span-6 ${
                      isImageRight ? "md:order-2" : "md:order-1"
                    }`}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                      <Image
                        src={image}
                        alt={service.imageAlt}
                        fill
                        sizes="(max-width: 768px) 100vw, 45vw"
                        className="object-cover"
                      />
                    </div>
                  </div>

                  <div
                    className={`md:col-span-6 ${
                      isImageRight ? "md:order-1" : "md:order-2"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        aria-hidden="true"
                        className="inline-flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-800 dark:bg-brand-900 dark:text-brand-200"
                      >
                        <Icon className="size-6" strokeWidth={1.75} />
                      </span>
                      <span
                        aria-hidden="true"
                        className="font-mono text-sm font-medium text-foreground-muted"
                      >
                        {String(index + 1).padStart(2, "0")} / 06
                      </span>
                    </div>

                    <h3 className="mt-5 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                      {service.title}
                    </h3>

                    <p className="mt-4 text-base leading-relaxed text-foreground-muted sm:text-lg">
                      {service.body}
                    </p>
                  </div>
                </li>
              </RevealOnScroll>
            );
          })}
        </ol>

        <p className="mt-20 max-w-prose font-display text-2xl font-medium tracking-tight sm:text-3xl">
          {t("closing")}
        </p>
      </div>
    </section>
  );
}
