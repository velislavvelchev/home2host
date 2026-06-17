import { useTranslations } from "next-intl";

// JSON-LD structured data for the business. Rendered server-side as a
// <script type="application/ld+json"> tag so search engines can pick up
// the schema.org LocalBusiness shape without our React tree needing to
// know about it.
//
// Sourced from docs/inventory/text/contacts.md. Two phone numbers exposed
// (primary first). When Payload's Contacts global gets populated, this
// can switch to fetching from there instead of the hardcoded constants
// — but the marketing site only needs one source of truth, and hardcoded
// is simpler until then.
//
// JSON-LD lives outside React's render tree (innerHTML) on purpose: it's
// pure data, never reads, never updates, and any React state would be
// inert ceremony.

export function StructuredData() {
  const t = useTranslations("StructuredData");

  const org = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Home2Host",
    description: t("description"),
    url: "https://home2host.vercel.app",
    logo: "https://home2host.vercel.app/logo.svg",
    image: "https://home2host.vercel.app/og-image.jpg",
    telephone: ["+359885146191", "+359885777342"],
    email: "info@home2host.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: t("addressStreet"),
      addressLocality: t("addressLocality"),
      postalCode: "2770",
      addressCountry: "BG",
    },
    areaServed: (t.raw("areaServed") as string[]).map((name) => ({
      "@type": "City",
      name,
    })),
    sameAs: [
      "https://facebook.com/home2hosteu",
      "https://instagram.com/home2host_",
    ],
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
