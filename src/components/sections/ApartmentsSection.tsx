import Image from "next/image";
import { ArrowUpRight, Star } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
// getTranslations is still used for the city labels below ("Apartments.cities");
// only the eyebrow/heading/lead fallback is gone.
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { ApartmentsCarousel } from "./ApartmentsCarousel";
import { getPayloadInstance } from "@/lib/payload";
import type { Locale } from "@/i18n/routing";
import type { Apartment, Media } from "@/payload-types";

// Reusable across the home page (embedded after Services, matching the live
// WordPress nav order) and the standalone /apartments/ route. Heading level
// swaps via prop, same contract as the other sections.
//
// Listings are read from the Payload `apartments` collection on every
// request (where: isActive=true, sort: order, locale-aware so EN visitors
// see EN titles when the owner has translated them). Owner manages the
// list in /admin: paste Airbnb URL → click "Fetch from Airbnb" to
// auto-fill title + cover photo, or fill manually. See [[fetch-airbnb-button]]
// in src/components/admin for the auto-fill flow.
//
// Each card's photo is served from Vercel Blob via next/image — owner
// uploads (or auto-uploads via the admin button); we don't depend on
// a0.muscache.com URLs staying live anymore.
//
// City labels resolve through `Apartments.cities` so EN visitors see
// "Bansko"/"Burgas" while BG visitors see "Банско"/"Бургас".
//
// Eyebrow / heading / lead come from the `listings-apartments` Global
// so the owner can edit them in admin (same shape as the About/Services
// Globals). All three are `required: true` in payload.config.ts — the
// Global can't be saved with empty values, so we read them directly
// without a fallback.

type ApartmentsSectionProps = {
  headingLevel?: "h1" | "h2";
};

export async function ApartmentsSection({
  headingLevel = "h2",
}: ApartmentsSectionProps) {
  const Heading = headingLevel;
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("Apartments");

  const payload = await getPayloadInstance();
  const [{ docs }, listing] = await Promise.all([
    payload.find({
      collection: "apartments",
      where: { isActive: { equals: true } },
      sort: "order",
      locale,
      // depth: 1 populates the featuredImage relation so we can read
      // sizes/url directly without a second round trip.
      depth: 1,
      limit: 100,
    }),
    payload.findGlobal({
      slug: "listings-apartments",
      locale,
      depth: 0,
    }),
  ]);

  return (
    <section
      id="apartments"
      aria-labelledby="apartments-heading"
      className="bg-surface-muted"
    >
      <div className="mx-auto max-w-6xl px-gutter py-section">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 dark:bg-brand-900 dark:text-brand-100">
          <span className="size-1.5 rounded-full bg-brand-600" />
          {listing.eyebrow}
        </span>

        <Heading
          id="apartments-heading"
          className="mt-6 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl"
        >
          {listing.heading}
        </Heading>

        <p className="mt-6 max-w-prose text-lg leading-relaxed text-foreground-muted">
          {listing.lead}
        </p>

        <div className="mt-12">
          <ApartmentsCarousel>
            {docs.map((apartment, index) => (
              <ApartmentCard
                key={apartment.id}
                apartment={apartment as Apartment}
                index={index}
                cityLabel={t(`cities.${apartment.city}`)}
              />
            ))}
          </ApartmentsCarousel>
        </div>
      </div>
    </section>
  );
}

type ApartmentCardProps = {
  apartment: Apartment;
  index: number;
  cityLabel: string;
};

function ApartmentCard({ apartment, index, cityLabel }: ApartmentCardProps) {
  // featuredImage is either a number id (unpopulated) or a populated
  // Media object — populated here because of `depth: 1` on the find.
  const image =
    apartment.featuredImage && typeof apartment.featuredImage === "object"
      ? (apartment.featuredImage as Media)
      : null;
  const imageUrl = image?.sizes?.card?.url ?? image?.url ?? null;

  return (
    <RevealOnScroll
      delayIndex={index % 3}
      // Mobile dominates the viewport with one card + a peek of
      // the next; fixed widths from sm up.
      className="snap-start shrink-0 w-[85vw] sm:w-[320px] md:w-[360px]"
    >
      <a
        href={apartment.airbnbUrl}
        target="_blank"
        rel="noopener noreferrer"
        // Card body bg is `bg-brand-800` — same indigo as primary CTA
        // buttons. The colour itself is the click affordance, signalling
        // "this is a button-shaped surface" before any explicit CTA text
        // reads. Border brand-700 (one shade lighter than the bg) provides
        // subtle definition without competing. Group so child hover
        // effects (arrow, scale) coordinate with the parent link.
        className="group block overflow-hidden rounded-2xl border border-brand-700 bg-brand-800 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-brand-500 hover:shadow-2"
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={image?.alt ?? apartment.title}
              fill
              sizes="(max-width: 640px) 85vw, 360px"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            // featuredImage is required on the collection, so this
            // shouldn't render in practice — kept as a defensive fallback
            // so a half-saved doc doesn't crash the page.
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-br from-brand-700 to-brand-900"
            />
          )}
          {/* Rating pill — top-right, semi-transparent black backdrop
              reads on any photo. Only renders when there's a numeric
              rating; ★New listings (rating=null) get no pill at all,
              which is cleaner than a stale "New" snapshot. Owner
              refreshes the number via the small icon button on the
              Apartment edit form. */}
          {typeof apartment.rating === "number" ? (
            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              <Star
                className="size-3 fill-current"
                strokeWidth={0}
                aria-hidden="true"
              />
              {apartment.rating.toFixed(2)}
            </span>
          ) : null}
        </div>

        {/* Card body — text colours locked to on-indigo since the bg is
            brand-800 in both light AND dark mode (no `dark:` variants
            needed; the foreground tokens that swap by OS preference
            would be invisible in one mode). */}
        <div className="flex flex-col gap-1 p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 font-display text-base font-semibold tracking-tight text-white">
              {apartment.title}
            </h3>
            <span
              aria-hidden="true"
              className="mt-0.5 inline-flex shrink-0 text-brand-200 transition-colors group-hover:text-white"
            >
              <ArrowUpRight className="size-5" strokeWidth={2} />
            </span>
          </div>
          <span className="text-xs font-medium uppercase tracking-wider text-brand-200">
            {cityLabel}
          </span>
        </div>
      </a>
    </RevealOnScroll>
  );
}
