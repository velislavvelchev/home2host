"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

// Pill toggle that swaps the URL between BG (unprefixed, e.g. /about-us/)
// and EN (prefixed, e.g. /en/about-us/) while keeping the visitor on the
// same page. Uses next-intl's locale-aware router so the pathname stays
// the same and only the locale segment changes.
//
// `useTransition` lets us mark the navigation as a transition: the
// active state of the clicked pill flips immediately, the route swap
// happens in the background, and React doesn't block the click on the
// new page's render. Without it the pill feels laggy on slow routes.

const localeLabels: Record<Locale, string> = {
  bg: "BG",
  en: "EN",
};

export function LanguageSwitcher() {
  const activeLocale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchTo(target: Locale) {
    if (target === activeLocale || isPending) return;
    startTransition(() => {
      // `replace` instead of `push` so the back button doesn't
      // accumulate a stack of (almost identical) locale-swap entries.
      // pathname here is the LOCALE-LESS pathname (next-intl strips
      // the segment) — the router re-attaches the new locale per
      // `localePrefix: 'as-needed'` (BG omits prefix, EN gets /en).
      router.replace(pathname, { locale: target });
    });
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex rounded-full border border-border bg-surface p-0.5"
    >
      {routing.locales.map((locale) => {
        const isActive = locale === activeLocale;
        return (
          <button
            key={locale}
            type="button"
            onClick={() => switchTo(locale)}
            disabled={isPending && !isActive}
            aria-pressed={isActive}
            className={
              "min-w-[2.25rem] rounded-full px-2.5 py-1 text-xs font-medium " +
              "transition-colors duration-base ease-standard " +
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 " +
              "disabled:cursor-not-allowed disabled:opacity-60 " +
              (isActive
                ? "bg-brand-800 text-neutral-0 dark:bg-brand-600"
                : "text-foreground-muted hover:text-foreground")
            }
          >
            {localeLabels[locale]}
          </button>
        );
      })}
    </div>
  );
}
