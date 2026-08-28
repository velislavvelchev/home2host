"use client";

import { useEffect, useState } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonStyles } from "@/components/Button";

// Cookie-consent gate. The ONLY cookie on this site that legally needs
// consent is Google Analytics (the `theme` and `cookie-consent` cookies are
// functional / necessary and exempt), so this is a simple binary Accept /
// Reject: GA loads only after the visitor accepts.
//
// CRITICAL: everything here is client-side. The server must NEVER read the
// consent cookie — doing so would force dynamic rendering and undo the static
// caching, the exact trap the theme cookie caused (see ADR 0006). That's why
// this is a client component and the layout renders it without touching the
// cookie.
//
// When GA isn't configured (dev / previews without NEXT_PUBLIC_GA_MEASUREMENT_ID)
// there are no consent-requiring cookies, so nothing renders — no banner, no GA.

const CONSENT_COOKIE = "cookie-consent";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// Dispatched by the footer "Manage cookies" button to re-open the banner so a
// visitor can change a previous choice (GDPR: withdrawing consent must be as
// easy as giving it).
export const OPEN_COOKIE_SETTINGS_EVENT = "h2h:open-cookie-settings";

type Consent = "granted" | "denied" | null;

function readConsent(): Consent {
  const match = document.cookie.match(/(?:^|;\s*)cookie-consent=([^;]*)/);
  if (match?.[1] === "granted") return "granted";
  if (match?.[1] === "denied") return "denied";
  return null;
}

function writeConsent(value: "granted" | "denied"): void {
  document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
}

export function CookieConsent() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const t = useTranslations("CookieConsent");
  const [consent, setConsent] = useState<Consent>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setConsent(readConsent());
    setMounted(true);
    const reopen = () => setConsent(null);
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  // No analytics configured → there's nothing to consent to.
  if (!gaId) return null;
  // Render nothing until we've read the cookie client-side. The page HTML is
  // static (same for everyone), so the banner/GA decision can only be made
  // after mount — this avoids a hydration mismatch.
  if (!mounted) return null;

  return (
    <>
      {consent === "granted" ? <GoogleAnalytics gaId={gaId} /> : null}

      {consent === null ? (
        <div
          role="dialog"
          aria-label={t("title")}
          className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 backdrop-blur-sm"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-gutter py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-relaxed text-foreground-muted">
              {t("message")}
              <Link
                href="/cookie-policy/"
                className="font-medium text-brand-700 underline-offset-2 hover:underline dark:text-brand-300"
              >
                {t("policyLinkText")}
              </Link>
              .
            </p>
            <div className="flex shrink-0 gap-3">
              <button
                type="button"
                onClick={() => {
                  writeConsent("denied");
                  setConsent("denied");
                }}
                className={buttonStyles("ghost", "sm")}
              >
                {t("reject")}
              </button>
              <button
                type="button"
                onClick={() => {
                  writeConsent("granted");
                  setConsent("granted");
                }}
                className={buttonStyles("primary", "sm")}
              >
                {t("accept")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
