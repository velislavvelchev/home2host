"use client";

import { useTranslations } from "next-intl";
import { OPEN_COOKIE_SETTINGS_EVENT } from "@/components/CookieConsent";

// Footer link that re-opens the cookie-consent banner so a visitor can change
// a previous Accept/Reject choice. Client component because it dispatches a
// DOM event; CookieConsent listens for it. Styled to match the sibling footer
// links (plain text, not a button-looking control).
export function ManageCookiesButton() {
  const t = useTranslations("Footer");
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))}
      className="text-left text-foreground transition-colors duration-base ease-standard hover:text-brand-700 dark:hover:text-brand-300"
    >
      {t("manageCookies")}
    </button>
  );
}
