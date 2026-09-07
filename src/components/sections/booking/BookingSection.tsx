import { getLocale, getTranslations } from "next-intl/server";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { getPayloadInstance } from "@/lib/payload";
import type { Locale } from "@/i18n/routing";
import { BookingForm } from "./BookingForm";

// Standalone /booking/ page section — the direct-booking form giving guests
// 10% off. Not embedded on the home page (nav-only), so `headingLevel`
// defaults to h1; the prop is kept for contract-consistency with the other
// sections.
//
// Data sources:
// - `booking` Global → editorial chrome (eyebrow / heading / lead /
//   footerNote). Each falls back to the `Booking` messages copy when the
//   owner hasn't filled it, so the page ships correct on day one.
// - Active Apartments → the Location dropdown lists only the distinct
//   cities we actually manage, so a visitor can't request a place we don't
//   serve. City labels resolve via the shared `Apartments.cities` map so
//   they read BG / EN like the apartment cards.
// - messages `Booking` namespace → all form field labels, dropdown option
//   text, and status messages (functional UI copy; same split as the
//   contact form).

type Props = {
  headingLevel?: "h1" | "h2";
};

export async function BookingSection({ headingLevel = "h1" }: Props) {
  const Heading = headingLevel;
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("Booking");
  const tCities = await getTranslations("Apartments");

  const payload = await getPayloadInstance();
  const [booking, apartments] = await Promise.all([
    payload.findGlobal({ slug: "booking", locale, depth: 0 }),
    payload.find({
      collection: "apartments",
      where: { isActive: { equals: true } },
      sort: "order",
      limit: 200,
      depth: 0,
    }),
  ]);

  // Distinct apartment cities, first-seen order (apartments are sorted by
  // `order`). Each city value maps to its localized label via the shared
  // Apartments.cities map; unknown values fall back to the raw key.
  const seen = new Set<string>();
  const locations: { value: string; label: string }[] = [];
  for (const apt of apartments.docs) {
    const city = (apt as { city?: string }).city;
    if (!city || seen.has(city)) continue;
    seen.add(city);
    const key = `cities.${city}`;
    locations.push({ value: city, label: tCities.has(key) ? tCities(key) : city });
  }

  // Chrome with JSON fallback until the owner fills the Global.
  const eyebrow = booking.eyebrow || t("eyebrow");
  const heading = booking.heading || t("heading");
  const lead = booking.lead || t("lead");
  const footerNote = booking.footerNote || t("footerNote");

  return (
    <section
      id="booking"
      aria-labelledby="booking-heading"
      className="bg-surface-muted"
    >
      <div className="mx-auto max-w-3xl px-gutter py-section">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 dark:bg-brand-900 dark:text-brand-100">
            <span className="size-1.5 rounded-full bg-brand-600" />
            {eyebrow}
          </span>

          <Heading
            id="booking-heading"
            className="mx-auto mt-6 max-w-2xl font-display text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl"
          >
            {heading}
          </Heading>

          <p className="mx-auto mt-6 max-w-prose text-lg leading-relaxed text-foreground-muted">
            {lead}
          </p>
        </div>

        <RevealOnScroll>
          <div className="mt-10 rounded-2xl border border-border bg-surface p-6 md:p-8">
            <BookingForm locations={locations} />
          </div>
        </RevealOnScroll>

        <p className="mx-auto mt-8 max-w-prose whitespace-pre-line text-center text-sm leading-relaxed text-foreground-muted">
          {footerNote}
        </p>
      </div>
    </section>
  );
}
