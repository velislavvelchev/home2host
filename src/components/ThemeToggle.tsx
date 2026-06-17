"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";

// Light ↔ dark toggle. Light is the brand-default for everyone; dark
// is opt-in and persisted in a cookie that the server reads on the
// next request to render `<html class="dark">` directly in the SSR
// output. The cookie approach (vs localStorage + inline script) means
// no client-side theme-init script is needed — no FOUC, no React 19
// dev warning about inline <script> tags in the render tree.
//
// On click we ALSO update the DOM class immediately so the visual
// switch is instant; the cookie write is for future page loads.
//
// Hydration-safe by design: we do NOT mirror the current theme into
// React state. Both icons are rendered, and the dark: variant shows
// one and hides the other purely with CSS. Server renders the
// matching icon based on the .dark class it set from the cookie →
// client hydration sees the same DOM → no mismatch, no flash.

// 1 year — long enough to feel permanent, short enough that an
// abandoned device clears itself eventually. SameSite=Lax balances
// safety (no third-party context) with usability (still set on
// top-level navigations).
const COOKIE = "theme=dark; path=/; max-age=31536000; SameSite=Lax";
const COOKIE_DELETE = "theme=; path=/; max-age=0; SameSite=Lax";

export function ThemeToggle() {
  const t = useTranslations("Header");

  function toggle() {
    const html = document.documentElement;
    const isDark = html.classList.contains("dark");
    if (isDark) {
      html.classList.remove("dark");
      document.cookie = COOKIE_DELETE;
    } else {
      html.classList.add("dark");
      document.cookie = COOKIE;
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("toggleTheme")}
      className="inline-flex size-9 items-center justify-center rounded-full border border-border text-foreground-muted transition-colors duration-base ease-standard hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      {/* Convention: the icon shows the mode the user will SWITCH TO,
          not the current mode. In light → show Moon (click to go dark);
          in dark → show Sun (click to go light). */}
      <Moon
        className="size-4 dark:hidden"
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <Sun
        className="hidden size-4 dark:inline"
        strokeWidth={1.75}
        aria-hidden="true"
      />
    </button>
  );
}
