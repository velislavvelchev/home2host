import type { ReactElement, SVGProps } from "react";
import { MapPin, Phone, Mail, MessageCircle } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { ContactForm } from "./ContactForm";
import { getPayloadInstance } from "@/lib/payload";
import type { Locale } from "@/i18n/routing";

// Reusable across the home page (embedded after FAQ) and the standalone
// /contacts/ route. `headingLevel` swaps h1/h2 so the document outline
// stays correct in both contexts — same contract as the other sections.
//
// Layout: two-column grid on md+, stacked on mobile. Contact details
// (service area, phones, email, address, WhatsApp CTA, social) on the
// left; submission form on the right. On mobile, details come first
// because phone/WhatsApp are one-tap immediate actions while the form
// requires typing.
//
// Section bg is `bg-surface-muted` so the page rhythm goes ... -> FAQ
// (solid brand-800) -> Contacts (back to muted) -> end.
//
// Data sources:
// - `contacts` Global → eyebrow / heading / lead / serviceArea heading+body,
//   email, primary + optional secondary phone, addressLine + addressMapsUrl
// - `social-links` Global → array of {platform, url, label} for the
//   social row at the bottom of the contact card. Icon component is
//   resolved from a code-side map (brand marks not shipped by lucide).
// - messages/<locale>.json (still) → the small functional labels
//   (Телефон / Имейл / Адрес / WhatsApp CTA / WhatsApp prefill /
//   Социални мрежи / form heading / form required note) and ContactForm
//   strings. These are functional UI labels the owner is unlikely to
//   rewrite; bundled here to keep error-message coupling clean.

// ──────────────────────────────────────────────────────────────────
// Brand marks for social platforms — inlined as SVG because this
// version of lucide-react omits brand icons (trademark reasons). Paths
// from simple-icons (CC0). Kept tiny and local; if more brand marks
// land later we can extract to a shared component.
// ──────────────────────────────────────────────────────────────────

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
    </svg>
  );
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0Zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.897 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.897-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03Zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162ZM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4Zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439Z" />
    </svg>
  );
}

function YouTubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function LinkedInIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function AirbnbIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M22.5 18.7c-.1-.2-.2-.5-.3-.7-.2-.4-.4-.8-.5-1.1l-.1-.1c-1.5-3.2-3.1-6.5-4.8-9.7l-.1-.1c-.2-.3-.3-.7-.5-1-.2-.4-.4-.8-.7-1.2-.6-.9-1.5-1.4-2.5-1.4s-1.9.5-2.5 1.3c-.2.4-.5.8-.7 1.2-.2.3-.3.7-.5 1l-.1.1C7.6 10.3 6 13.5 4.5 16.7l-.1.1c-.2.4-.4.8-.5 1.1-.1.2-.2.5-.3.7-.3.8-.4 1.6-.3 2.4.2 1.7 1.4 3.1 2.9 3.7.6.2 1.2.3 1.8.3.2 0 .4 0 .6-.1.7-.1 1.5-.3 2.2-.7.9-.5 1.8-1.2 2.8-2.3 1 1.1 1.9 1.8 2.8 2.3.7.4 1.4.6 2.2.7.2 0 .4.1.6.1.6 0 1.2-.1 1.8-.3 1.6-.6 2.7-2 2.9-3.7.2-.8.1-1.6-.2-2.4zM12 17.6c-1.2-1.5-2-3-2.2-4.2-.1-.5-.2-1-.1-1.4 0-.4.1-.7.3-1 .4-.6 1.1-1 1.9-1s1.5.4 1.9 1c.2.3.3.6.3 1 0 .5 0 .9-.1 1.4-.3 1.2-1 2.6-2 4.2zm9.6 2.5c-.1 1.2-.9 2.2-2 2.6-.5.2-1.1.3-1.7.2-.6-.1-1.1-.2-1.7-.5-.8-.4-1.6-1.1-2.5-2 1.5-1.8 2.4-3.5 2.7-4.9.2-.7.2-1.3.1-1.9-.1-.5-.3-1-.6-1.5-.7-1-1.8-1.6-3-1.6s-2.4.6-3 1.5c-.3.5-.5.9-.6 1.5-.1.6-.1 1.3.1 1.9.3 1.4 1.3 3.2 2.7 4.9-.8.9-1.7 1.6-2.5 2-.6.3-1.2.4-1.7.5-.6.1-1.2 0-1.7-.2-1.1-.4-1.9-1.4-2-2.6-.1-.6 0-1.2.2-1.8.1-.2.2-.4.3-.7.1-.3.3-.6.5-1l.1-.1c1.5-3.2 3.1-6.4 4.7-9.5l.1-.1c.2-.3.3-.6.5-1 .2-.3.4-.7.6-1 .4-.5 1-.8 1.6-.8s1.2.3 1.6.8c.2.3.4.6.6 1 .2.3.4.7.5 1l.1.1c1.6 3.2 3.2 6.4 4.7 9.5l.1.1c.2.3.3.7.5 1 .1.3.2.5.3.7.2.5.3 1 .2 1.6z" />
    </svg>
  );
}

function BookingIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M21.6 0H2.4C1.08 0 0 1.08 0 2.4v19.2C0 22.92 1.08 24 2.4 24h19.2c1.32 0 2.4-1.08 2.4-2.4V2.4C24 1.08 22.92 0 21.6 0zM8.83 6.93h2.49c1.62 0 2.55.92 2.55 2.34 0 .96-.42 1.62-1.11 2.04 1.05.36 1.62 1.2 1.62 2.43 0 1.71-1.2 2.79-3.06 2.79H8.83V6.93zm1.83 3.84h1.05c.69 0 1.05-.45 1.05-1.08 0-.6-.36-.99-1.05-.99h-1.05v2.07zm0 4.05h1.32c.84 0 1.26-.45 1.26-1.2 0-.78-.42-1.2-1.26-1.2h-1.32v2.4zm5.61 1.71V6.93h1.83v9.6h-1.83z" />
    </svg>
  );
}

// Platform identifier → brand SVG. Keys match the Payload schema's
// `platform` select options exactly; if a new platform value is added
// to the schema, add the matching entry here. Unknown platforms get
// hidden in the render loop (defensive — the schema enforces the union
// but a typo in the DB shouldn't crash the page).
type SocialPlatform =
  | "facebook"
  | "instagram"
  | "youtube"
  | "tiktok"
  | "linkedin"
  | "airbnb"
  | "booking";

const SOCIAL_ICONS: Record<SocialPlatform, (props: SVGProps<SVGSVGElement>) => ReactElement> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  youtube: YouTubeIcon,
  tiktok: TikTokIcon,
  linkedin: LinkedInIcon,
  airbnb: AirbnbIcon,
  booking: BookingIcon,
};

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  airbnb: "Airbnb",
  booking: "Booking",
};

type ContactsSectionProps = {
  headingLevel?: "h1" | "h2";
};

const detailRowClass =
  "flex items-start gap-3 text-foreground transition-colors";
const detailIconClass =
  "mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-800 dark:bg-brand-900 dark:text-brand-200";

export async function ContactsSection({
  headingLevel = "h2",
}: ContactsSectionProps) {
  const Heading = headingLevel;
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("Contacts");

  const payload = await getPayloadInstance();
  const [contacts, social] = await Promise.all([
    payload.findGlobal({ slug: "contacts", locale, depth: 0 }),
    payload.findGlobal({ slug: "social-links", locale, depth: 0 }),
  ]);

  // Phones: primary always rendered; secondary only when both display
  // and dial are populated (the secondary group is optional in admin).
  const phones: { display: string; dial: string }[] = [
    contacts.primaryPhone,
  ];
  const secondary = contacts.secondaryPhone;
  if (secondary?.display && secondary?.dial) {
    phones.push({ display: secondary.display, dial: secondary.dial });
  }

  // WhatsApp link uses the primary phone's dial format with the + stripped.
  const whatsappLink = `https://wa.me/${contacts.primaryPhone.dial.replace(
    "+",
    "",
  )}?text=${encodeURIComponent(t("whatsappPrefill"))}`;

  // Social links: skip rows we don't have an icon for (defensive).
  const socialLinks = (social.links ?? []).flatMap((link) => {
    const icon = SOCIAL_ICONS[link.platform as SocialPlatform];
    if (!icon) return [];
    return [
      {
        platform: link.platform as SocialPlatform,
        url: link.url,
        // `label` overrides the platform name when set (used for aria-label).
        label: link.label || PLATFORM_LABELS[link.platform as SocialPlatform],
        Icon: icon,
      },
    ];
  });

  return (
    <section
      id="contacts"
      aria-labelledby="contacts-heading"
      className="bg-surface-muted"
    >
      <div className="mx-auto max-w-6xl px-gutter py-section">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 dark:bg-brand-900 dark:text-brand-100">
          <span className="size-1.5 rounded-full bg-brand-600" />
          {contacts.eyebrow}
        </span>

        <Heading
          id="contacts-heading"
          className="mt-6 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl"
        >
          {contacts.heading}
        </Heading>

        <p className="mt-6 max-w-prose text-lg leading-relaxed text-foreground-muted">
          {contacts.lead}
        </p>

        <div className="mt-12 grid gap-8 md:grid-cols-2 md:gap-10">
          {/* Left column — contact details + WhatsApp + social */}
          <RevealOnScroll>
            <div className="flex flex-col gap-8 rounded-2xl border border-border bg-surface p-6 md:p-8">
              {/* Service area */}
              <div className={detailRowClass}>
                <span aria-hidden="true" className={detailIconClass}>
                  <MapPin className="size-5" strokeWidth={1.75} />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold tracking-tight">
                    {contacts.serviceAreaHeading}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-foreground-muted">
                    {contacts.serviceAreaBody}
                  </p>
                </div>
              </div>

              <hr className="border-border" />

              {/* Phones */}
              <div className={detailRowClass}>
                <span aria-hidden="true" className={detailIconClass}>
                  <Phone className="size-5" strokeWidth={1.75} />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold tracking-tight">
                    {t("phoneHeading")}
                  </h3>
                  <ul className="mt-1 flex flex-col gap-0.5">
                    {phones.map((p) => (
                      <li key={p.dial}>
                        <a
                          href={`tel:${p.dial}`}
                          className="text-sm text-foreground-muted transition-colors hover:text-brand-800 dark:hover:text-brand-200"
                        >
                          {p.display}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Email */}
              <div className={detailRowClass}>
                <span aria-hidden="true" className={detailIconClass}>
                  <Mail className="size-5" strokeWidth={1.75} />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold tracking-tight">
                    {t("emailHeading")}
                  </h3>
                  <a
                    href={`mailto:${contacts.email}`}
                    className="mt-1 inline-block text-sm text-foreground-muted transition-colors hover:text-brand-800 dark:hover:text-brand-200"
                  >
                    {contacts.email}
                  </a>
                </div>
              </div>

              {/* Address */}
              <div className={detailRowClass}>
                <span aria-hidden="true" className={detailIconClass}>
                  <MapPin className="size-5" strokeWidth={1.75} />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold tracking-tight">
                    {t("addressHeading")}
                  </h3>
                  <a
                    href={contacts.addressMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-sm text-foreground-muted transition-colors hover:text-brand-800 dark:hover:text-brand-200"
                  >
                    {contacts.addressLine}
                  </a>
                </div>
              </div>

              <hr className="border-border" />

              {/* WhatsApp CTA + social links */}
              <div className="flex flex-col gap-4">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-brand-800 px-5 text-sm font-medium text-brand-800 transition-colors hover:bg-brand-50 dark:border-brand-300 dark:text-brand-200 dark:hover:bg-brand-900/40"
                >
                  <MessageCircle
                    className="size-4"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  {t("whatsappCta")}
                </a>

                {socialLinks.length > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
                      {t("socialLabel")}
                    </span>
                    <ul className="flex items-center gap-2">
                      {socialLinks.map(({ platform, url, label, Icon }) => (
                        <li key={platform}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={label}
                            className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-foreground-muted transition-colors hover:border-brand-600 hover:text-brand-800 dark:hover:text-brand-200"
                          >
                            <Icon className="size-4" aria-hidden="true" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </RevealOnScroll>

          {/* Right column — form */}
          <RevealOnScroll delayIndex={1}>
            <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
              <h3 className="font-display text-xl font-semibold tracking-tight">
                {t("formHeading")}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-foreground-muted">
                {t("formRequiredNote")}
              </p>
              <div className="mt-6">
                <ContactForm />
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
