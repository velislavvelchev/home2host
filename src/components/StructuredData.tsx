import { getLocale, getTranslations } from "next-intl/server";
import { getPayloadInstance } from "@/lib/payload";
import type { Locale } from "@/i18n/routing";

// JSON-LD structured data for the business. Rendered server-side as a
// <script type="application/ld+json"> tag so search engines can pick up
// the schema.org LocalBusiness shape without our React tree needing to
// know about it.
//
// Phones / email / address line / social URLs come from the Payload
// Globals (`contacts` + `social-links`) so the owner can update them in
// /admin and have the structured data follow automatically. The
// description + areaServed strings stay in messages JSON because
// they're SEO-tuned copy (not contact data) and bundled with other
// SEO-facing text. Postal code / locality / country stay hardcoded —
// factual office data that doesn't churn; building admin UI for them
// would be ceremony.
//
// JSON-LD lives outside React's render tree (innerHTML) on purpose: it's
// pure data, never reads, never updates, and any React state would be
// inert ceremony.

export async function StructuredData() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("StructuredData");

  const payload = await getPayloadInstance();
  const [contacts, social] = await Promise.all([
    payload.findGlobal({ slug: "contacts", locale, depth: 0 }),
    payload.findGlobal({ slug: "social-links", locale, depth: 0 }),
  ]);

  const phones: string[] = [contacts.primaryPhone.dial];
  if (contacts.secondaryPhone?.dial) {
    phones.push(contacts.secondaryPhone.dial);
  }

  const socialUrls = (social.links ?? []).map((l) => l.url);

  const org = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Home2Host",
    description: t("description"),
    url: "https://home2host.com",
    logo: "https://home2host.com/logo.svg",
    image: "https://home2host.com/og-image.jpg",
    telephone: phones,
    email: contacts.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: contacts.addressLine,
      addressLocality: t("addressLocality"),
      postalCode: "2770",
      addressCountry: "BG",
    },
    areaServed: (t.raw("areaServed") as string[]).map((name) => ({
      "@type": "City",
      name,
    })),
    sameAs: socialUrls,
  };

  return (
    <script
      type="application/ld+json"
      // We control the JSON; no XSS path. dangerouslySetInnerHTML keeps
      // it as a literal string rather than React-escaping the quotes.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(org) }}
    />
  );
}
