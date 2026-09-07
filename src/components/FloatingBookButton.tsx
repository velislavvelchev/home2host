"use client";

import { CalendarCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

// Persistent floating "book now" CTA — the counterpart to FloatingCallButton.
// Mounted at the (frontend) layout level so it rides along on every page.
//
// Placement: bottom-LEFT, mirroring the call button (bottom-right) so the two
// corners balance and neither crowds the other.
//
// Responsive contract (matches FloatingCallButton):
// - <md: compact 56px circle with the calendar icon only, to save space on
//   mobile. The action is announced via aria-label.
// - >=md: expands to a pill with the icon + visible "Book" label.
//
// Client component (unlike the server-rendered call button) so it can:
// - resolve the locale-aware href + label via next-intl, and
// - hide itself on the /booking/ page, where a "Book" bubble would be
//   redundant. `usePathname` from @/i18n/navigation is locale-normalized,
//   so it returns "/booking/" on both /booking/ and /en/booking/.
//
// The gentle pulse (motion-safe:animate-soft-pulse) draws the eye without
// being harsh; reduced-motion users get a static button.

export function FloatingBookButton() {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  if (pathname === "/booking/") return null;

  return (
    <Link
      href="/booking/"
      aria-label={t("book")}
      className="fixed bottom-6 left-6 z-50 inline-flex h-14 w-14 items-center justify-center gap-3 rounded-full bg-brand-800 text-neutral-0 shadow-2 transition-colors duration-300 ease-out hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 motion-safe:animate-soft-pulse md:w-auto md:px-5 dark:bg-brand-600 dark:hover:bg-brand-500"
    >
      <CalendarCheck
        className="size-6 shrink-0"
        strokeWidth={2}
        aria-hidden="true"
      />
      <span className="hidden font-medium md:inline">{t("book")}</span>
    </Link>
  );
}
