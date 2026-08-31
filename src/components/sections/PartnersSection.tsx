import { getLocale } from "next-intl/server";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { getPayloadInstance } from "@/lib/payload";
import type { Locale } from "@/i18n/routing";
import type { Media, Partner } from "@/payload-types";

// Home-page only: no standalone /partners/ route by design (owner asked
// for a section, not a page, and no nav entry). `headingLevel` kept for
// consistency with the other section components in case a standalone
// route is ever added later.
//
// Content model — matches the FAQ/Blog/Apartments pattern:
//   Collection `partners`        → one doc per partner logo (name, logo,
//                                  url, order, isActive)
//   Global    `listings-partners` → section chrome + isVisible kill switch
//                                  (eyebrow, heading, lead, note)
//
// Two-level hide: the Global's `isVisible` is the master switch (whole
// section renders or not); each partner row has its own `isActive` for
// per-partner hiding without deletion.
//
// Background inherits the theme (light: near-white body bg, dark: navy)
// — same behaviour as About/Services/Pricing sections, so the theme
// toggle transitions this section consistently with the rest of the
// page. Trade-off: logos need to work on BOTH backgrounds. Full-color
// brand marks are safe; pure-white or pure-dark mono logos will
// disappear on one of the two themes. Owner is warned via the field
// description on the `logo` field in payload.config.ts.
//
// Adaptive marquee density: with few partners, one duplication (2× the
// list) leaves the track shorter than the container, which reads as
// "cluster of logos jittering left of center". We duplicate enough
// copies to reach ~16 total items minimum, then scale the animation
// duration linearly with copy count so the perceived px/sec speed stays
// constant across small vs. large lists. The keyframe endpoint is a CSS
// variable so the translate distance matches the copy count without
// authoring N different keyframes.
//
// Plain <img>, not next/image: partner logos are overwhelmingly SVG in
// practice; next/image would try to rasterize them, which either bloats
// bundle size or requires unoptimized-per-image plumbing. The logos are
// small assets below the fold — LCP concern is nil.

type PartnersSectionProps = {
  headingLevel?: "h1" | "h2";
};

type ResolvedPartner = {
  id: string | number;
  name: string;
  url: string;
  logo: Media;
};

// Target the marquee has this many rendered items at minimum. Tuned so
// the visible frame always has 3–5 logos on desktop and 2–3 on mobile
// no matter how few unique partners exist. Above ~8 unique items,
// duplication drops to 2 copies (the natural minimum for a seamless
// loop).
const MIN_RENDERED_ITEMS = 16;
// Seconds one copy of the list takes to scroll past. Same base for any
// copy count — total animation duration scales with copies so pixels-
// per-second stays constant across small and large partner counts.
const SECONDS_PER_COPY = 20;

// Airbnb's and Booking.com's official wordmarks ship with essentially no
// internal padding — the glyphs fill the whole file canvas — so at the
// shared logo height they paint more ink and read visually larger than
// partner logos that carry their own whitespace. Render just those two a
// notch shorter so the row reads at consistent weight. Keyed on the
// destination host (stable for these brands) rather than the display name
// (free-text and localizable).
const OVERSIZED_LOGO_HOSTS = /(?:airbnb|booking)\./i;
const LOGO_HEIGHT = "h-14 md:h-[72px] lg:h-20";
const LOGO_HEIGHT_OVERSIZED = "h-11 md:h-14 lg:h-16";

export async function PartnersSection({
  headingLevel = "h2",
}: PartnersSectionProps) {
  const Heading = headingLevel;
  const locale = (await getLocale()) as Locale;
  const payload = await getPayloadInstance();

  // Chrome (Global) and rows (Collection) in parallel — same pattern as
  // FaqSection. depth: 1 on the collection so the `logo` upload relation
  // resolves to the full Media doc (url, width, height).
  const [listing, { docs }] = await Promise.all([
    payload.findGlobal({
      slug: "listings-partners",
      locale,
      depth: 0,
    }),
    payload.find({
      collection: "partners",
      locale,
      sort: "order",
      where: { isActive: { equals: true } },
      limit: 100,
      depth: 1,
    }),
  ]);

  // Master kill switch — owner-facing toggle on the Global to hide the
  // whole section without deleting content.
  if (!listing.isVisible) return null;

  const items: ResolvedPartner[] = (docs as Partner[])
    .map((row): ResolvedPartner | null => {
      const logo = typeof row.logo === "object" ? (row.logo as Media) : null;
      if (!logo?.url || !row.name || !row.url) return null;
      return {
        id: row.id,
        name: row.name,
        url: row.url,
        logo,
      };
    })
    .filter((item): item is ResolvedPartner => item !== null);

  // Second safety net: if the section is "visible" but there are no
  // active partners, still don't render — a chrome-only Partners
  // section with an empty row would look broken.
  if (items.length === 0) return null;

  // Adaptive duplication: enough copies so the visible strip always looks
  // populated. 2 copies is the minimum for a seamless loop.
  const copies = Math.max(2, Math.ceil(MIN_RENDERED_ITEMS / items.length));
  const loopedItems = Array.from({ length: copies }, () => items).flat();
  // At the end of the animation, the (N-th) copy sits exactly where the
  // 1st copy started — that's the seamless-loop condition. Distance is
  // ((copies-1)/copies) × 100% of the total track width.
  const endPercent = -((copies - 1) / copies) * 100;
  const durationSeconds = SECONDS_PER_COPY * copies;

  return (
    <section
      id="partners"
      aria-labelledby="partners-heading"
      // No explicit bg — inherits the body `--background` (white in
      // light, near-black in dark), matching About/Services/Pricing.
    >
      <div className="mx-auto max-w-6xl px-gutter py-section">
        <RevealOnScroll>
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 dark:bg-brand-900 dark:text-brand-100">
            <span className="size-1.5 rounded-full bg-brand-600" />
            {listing.eyebrow}
          </span>

          <Heading
            id="partners-heading"
            className="mt-6 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl"
          >
            {listing.heading}
          </Heading>

          <p className="mt-6 max-w-prose text-lg leading-relaxed text-foreground-muted">
            {listing.lead}
          </p>
        </RevealOnScroll>

        <RevealOnScroll delayIndex={1}>
          <div className="partners-marquee mt-12 overflow-hidden">
            <ul
              className="partners-marquee-track flex items-center gap-12 motion-safe:w-max motion-safe:animate-marquee motion-reduce:flex-wrap motion-reduce:justify-center md:gap-16 lg:gap-20"
              style={{
                // Endpoint of the CSS marquee keyframe — see globals.css.
                // Passed as a CSS variable so the same keyframe drives
                // any copy count (2 → -50%, 3 → -66.66%, 4 → -75%, …).
                ["--marquee-end" as string]: `${endPercent}%`,
                animationDuration: `${durationSeconds}s`,
              }}
            >
              {loopedItems.map((item, index) => {
                const isClone = index >= items.length;
                const logoHeight = OVERSIZED_LOGO_HOSTS.test(item.url)
                  ? LOGO_HEIGHT_OVERSIZED
                  : LOGO_HEIGHT;
                return (
                  <li
                    key={`${item.id}-${index}`}
                    aria-hidden={isClone ? true : undefined}
                    className={`shrink-0${isClone ? " marquee-clone" : ""}`}
                  >
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={item.name}
                      aria-label={item.name}
                      className="block px-2 py-2 opacity-90 transition-opacity duration-200 hover:opacity-100 focus-visible:opacity-100"
                    >
                      <img
                        src={item.logo.url!}
                        alt={item.name}
                        width={item.logo.width ?? undefined}
                        height={item.logo.height ?? undefined}
                        loading="lazy"
                        decoding="async"
                        // Height-normalized; width auto. Default is 56/72/80 px
                        // (bumped up from the initial h-10/h-12 after the first
                        // size looked lost against the section chrome). Tight-
                        // cropped wordmarks (Airbnb, Booking) render a notch
                        // shorter — see OVERSIZED_LOGO_HOSTS.
                        className={`${logoHeight} w-auto object-contain`}
                      />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
