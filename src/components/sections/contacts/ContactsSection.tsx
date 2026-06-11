import type { SVGProps } from "react";
import { MapPin, Phone, Mail, MessageCircle } from "lucide-react";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { ContactForm } from "./ContactForm";

// Brand marks for social platforms — inlined as SVG because this version
// of lucide-react omits brand icons (trademark reasons). Paths from
// simple-icons (CC0). Kept tiny and local; if more brand marks land later
// we can extract to a shared component.
function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
    </svg>
  );
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0Zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.897 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.897-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03Zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162ZM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4Zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439Z" />
    </svg>
  );
}

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
// Content sourced from docs/inventory/text/contacts.md.

type ContactsSectionProps = {
  headingLevel?: "h1" | "h2";
};

// Phone numbers in display format and dial format. The dial format
// strips spaces so `tel:` links work consistently across dialers.
const PHONES = [
  { display: "+359 88 514 6191", dial: "+359885146191" },
  { display: "+359 88 577 7342", dial: "+359885777342" },
] as const;

const EMAIL = "info@home2host.com";
const ADDRESS = "2770 гр. Банско, ул. Кралев двор №5";
const ADDRESS_MAPS = "https://www.google.com/maps/search/?api=1&query=2770+%D0%B3%D1%80.+%D0%91%D0%B0%D0%BD%D1%81%D0%BA%D0%BE%2C+%D1%83%D0%BB.+%D0%9A%D1%80%D0%B0%D0%BB%D0%B5%D0%B2+%D0%B4%D0%B2%D0%BE%D1%80+5";

// Prefilled BG message for WhatsApp. Encoded once at module scope.
const WHATSAPP_LINK = `https://wa.me/${PHONES[0].dial.replace(
  "+",
  "",
)}?text=${encodeURIComponent(
  "Здравейте, имам въпрос относно управление на имот.",
)}`;

const SOCIAL = [
  {
    label: "Facebook",
    href: "https://facebook.com/home2hosteu",
    Icon: FacebookIcon,
  },
  {
    label: "Instagram",
    href: "https://instagram.com/home2host_",
    Icon: InstagramIcon,
  },
] as const;

const detailRowClass =
  "flex items-start gap-3 text-foreground transition-colors";
const detailIconClass =
  "mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-800 dark:bg-brand-900 dark:text-brand-200";

export function ContactsSection({
  headingLevel = "h2",
}: ContactsSectionProps) {
  const Heading = headingLevel;

  return (
    <section
      id="contacts"
      aria-labelledby="contacts-heading"
      className="bg-surface-muted"
    >
      <div className="mx-auto max-w-6xl px-gutter py-section">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 dark:bg-brand-900 dark:text-brand-100">
          <span className="size-1.5 rounded-full bg-brand-600" />
          Контакти
        </span>

        <Heading
          id="contacts-heading"
          className="mt-6 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl"
        >
          Свържете се с нас
        </Heading>

        <p className="mt-6 max-w-prose text-lg leading-relaxed text-foreground-muted">
          Имате имот, който искате да отдавате под наем? Или въпрос за
          нашите услуги? Пишете ни — отговаряме в рамките на работния ден.
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
                    Къде работим?
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-foreground-muted">
                    Home2Host управлява имоти на територията на Бургас,
                    Банско и околните региони. Осигуряваме надеждно
                    управление и добра доходност за вашия имот.
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
                    Телефон
                  </h3>
                  <ul className="mt-1 flex flex-col gap-0.5">
                    {PHONES.map((p) => (
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
                    Имейл
                  </h3>
                  <a
                    href={`mailto:${EMAIL}`}
                    className="mt-1 inline-block text-sm text-foreground-muted transition-colors hover:text-brand-800 dark:hover:text-brand-200"
                  >
                    {EMAIL}
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
                    Адрес
                  </h3>
                  <a
                    href={ADDRESS_MAPS}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-sm text-foreground-muted transition-colors hover:text-brand-800 dark:hover:text-brand-200"
                  >
                    {ADDRESS}
                  </a>
                </div>
              </div>

              <hr className="border-border" />

              {/* WhatsApp CTA + social links */}
              <div className="flex flex-col gap-4">
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-brand-800 px-5 text-sm font-medium text-brand-800 transition-colors hover:bg-brand-50 dark:border-brand-300 dark:text-brand-200 dark:hover:bg-brand-900/40"
                >
                  <MessageCircle
                    className="size-4"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  Пишете ни в WhatsApp
                </a>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
                    Социални мрежи
                  </span>
                  <ul className="flex items-center gap-2">
                    {SOCIAL.map(({ label, href, Icon }) => (
                      <li key={label}>
                        <a
                          href={href}
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
              </div>
            </div>
          </RevealOnScroll>

          {/* Right column — form */}
          <RevealOnScroll delayIndex={1}>
            <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
              <h3 className="font-display text-xl font-semibold tracking-tight">
                Изпратете запитване
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-foreground-muted">
                Полетата със звездичка са задължителни.
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
