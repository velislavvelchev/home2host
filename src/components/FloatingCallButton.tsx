import { Phone } from "lucide-react";
import { useTranslations } from "next-intl";

// Persistent floating "call us" CTA. Lives at the layout level so it appears
// on every (frontend) page. Pure server component — no state, no JS.
//
// Responsive contract:
// - <md: compact 56px circle with the phone icon only (saves screen real
//   estate on mobile; the icon is universal enough that BG tap-to-call is
//   intuitive). The phone number is still announced via aria-label.
// - >=md: expands to a pill with the icon + visible number, since desktop
//   users can't tap-to-call as reflexively and benefit from seeing the
//   number to copy or read.
//
// `tel:` links dial directly on mobile; on desktop they open the OS
// default handler (FaceTime/Skype/etc.) or do nothing — acceptable, since
// the visible number on desktop is the primary affordance.
//
// Phone number sourced from `docs/inventory/text/contacts.md`. When the
// Payload Contacts global is populated, fetch from there instead and pass
// in as a prop.

const PHONE_DISPLAY = "+359 88 514 6191";
const PHONE_DIAL = "+359885146191";

export function FloatingCallButton() {
  const t = useTranslations("FloatingCall");

  return (
    <a
      href={`tel:${PHONE_DIAL}`}
      aria-label={t("ariaLabel", { phone: PHONE_DISPLAY })}
      className="fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center gap-3 rounded-full bg-brand-700 text-neutral-0 shadow-2 transition-all duration-300 ease-out hover:bg-brand-600 hover:shadow-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 motion-safe:hover:scale-105 md:w-auto md:px-5"
    >
      <Phone className="size-6 shrink-0" strokeWidth={2} aria-hidden="true" />
      <span className="hidden font-medium md:inline">{PHONE_DISPLAY}</span>
    </a>
  );
}
