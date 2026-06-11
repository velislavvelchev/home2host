import Script from "next/script";
import { ExternalLink } from "lucide-react";
import { RevealOnScroll } from "@/components/RevealOnScroll";

// Reusable across the home page (embedded after Services, matching the live
// WordPress nav order) and the standalone /apartments/ route. Heading level
// swaps via prop, same contract as the other sections.
//
// Per the architecture doc, the "Apartments" section is intentionally NOT
// a custom property database with filters/search — it's a collection of
// Airbnb embed widgets. The owner's real listing photos, ratings, and
// availability live inside Airbnb; mirroring them locally would just go
// stale. The Airbnb JS SDK replaces each .airbnb-embed-frame div with an
// iframe at runtime; until that happens (or if the SDK is blocked), the
// placeholder we render inside reads as a tasteful "view this listing on
// Airbnb" link card.
//
// Content sourced from docs/inventory/text/apartments.md.
// 12 listings: 10 in Bansko, 1 in Burgas, 1 in Razlog.

type ApartmentsSectionProps = {
  headingLevel?: "h1" | "h2";
};

type Listing = {
  id: string;
  label: string;
  city: string;
  url: string;
};

const listings: Listing[] = [
  {
    id: "1318738434906867843",
    label: "Кондо в Банско",
    city: "Bansko",
    url: "https://www.airbnb.com/rooms/1318738434906867843",
  },
  {
    id: "671609314902059816",
    label: "Кондо в Бургас",
    city: "Burgas",
    url: "https://www.airbnb.com/rooms/671609314902059816",
  },
  {
    id: "1571758069076515492",
    label: "Апартамент за наем в Банско",
    city: "Bansko",
    url: "https://www.airbnb.com/rooms/1571758069076515492",
  },
  {
    id: "1607996732020225042",
    label: "Апартамент за наем в Банско",
    city: "Bansko",
    url: "https://www.airbnb.com/rooms/1607996732020225042",
  },
  {
    id: "1607988986183197333",
    label: "Апартамент за наем в Банско",
    city: "Bansko",
    url: "https://www.airbnb.com/rooms/1607988986183197333",
  },
  {
    id: "1582571602551689852",
    label: "Апартамент за наем в Банско",
    city: "Bansko",
    url: "https://www.airbnb.com/rooms/1582571602551689852",
  },
  {
    id: "1536078655698153217",
    label: "Апартамент за наем в Банско",
    city: "Bansko",
    url: "https://www.airbnb.com/rooms/1536078655698153217",
  },
  {
    id: "1544251596416809511",
    label: "Апартамент за наем в Банско",
    city: "Bansko",
    url: "https://www.airbnb.com/rooms/1544251596416809511",
  },
  {
    id: "1550747815707309469",
    label: "Апартамент за наем в Банско",
    city: "Bansko",
    url: "https://www.airbnb.com/rooms/1550747815707309469",
  },
  {
    id: "1576107287888378227",
    label: "Апартамент за наем в Разлог",
    city: "Razlog",
    url: "https://www.airbnb.com/rooms/1576107287888378227",
  },
  {
    id: "1614457751120708395",
    label: "Кондо в Банско",
    city: "Bansko",
    url: "https://www.airbnb.com/rooms/1614457751120708395",
  },
  {
    id: "1615387914155787876",
    label: "Кондо в Банско",
    city: "Bansko",
    url: "https://www.airbnb.com/rooms/1615387914155787876",
  },
];

export function ApartmentsSection({
  headingLevel = "h2",
}: ApartmentsSectionProps) {
  const Heading = headingLevel;

  return (
    <section id="apartments" aria-labelledby="apartments-heading">
      <div className="mx-auto max-w-6xl px-gutter py-section">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 dark:bg-brand-900 dark:text-brand-100">
          <span className="size-1.5 rounded-full bg-brand-600" />
          Апартаменти
        </span>

        <Heading
          id="apartments-heading"
          className="mt-6 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl"
        >
          Нашите апартаменти
        </Heading>

        <p className="mt-6 max-w-prose text-lg leading-relaxed text-foreground-muted">
          12 имота в Банско, Бургас и Разлог — управлявани от Home2Host.
          Резервирайте директно през Airbnb.
        </p>

        <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing, index) => (
            // delayIndex modulo 3 so each grid ROW cascades together
            // (instead of one long cascade across all 12 cards).
            <RevealOnScroll key={listing.id} delayIndex={index % 3}>
              <li>
                {/*
                  The Airbnb SDK swaps the contents of this div for an
                  iframe at runtime. The placeholder inside is what shows
                  during the brief load window and stays visible if the
                  SDK is blocked by an ad-blocker — so it's styled as a
                  tasteful "view on Airbnb" card, not a bare hyperlink.

                  `min-h-[28rem]` reserves vertical space so the page
                  doesn't shift when iframes finish loading.
                */}
                <div
                  className="airbnb-embed-frame relative flex min-h-[28rem] overflow-hidden rounded-2xl border border-foreground-muted bg-surface"
                  data-id={listing.id}
                  data-view="home"
                  style={{ width: "100%" }}
                >
                  <a
                    href={listing.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center transition-colors hover:bg-surface-muted"
                  >
                    <span className="inline-flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-800 dark:bg-brand-900 dark:text-brand-200">
                      <ExternalLink
                        className="size-5"
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="font-display text-base font-semibold tracking-tight text-foreground">
                      {listing.label}
                    </span>
                    <span className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
                      {listing.city}
                    </span>
                    <span className="mt-2 text-sm text-brand-700 underline dark:text-brand-300">
                      Виж в Airbnb
                    </span>
                  </a>
                </div>
              </li>
            </RevealOnScroll>
          ))}
        </ul>
      </div>

      {/*
        Airbnb's embed SDK. Loaded once per page; finds every
        .airbnb-embed-frame div on the page and progressively replaces
        them with iframes. `afterInteractive` defers until the page is
        ready so it doesn't compete with our critical render path.
      */}
      <Script
        src="https://www.airbnb.com/embeddable/airbnb_jssdk"
        strategy="afterInteractive"
      />
    </section>
  );
}
