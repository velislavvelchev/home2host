"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

// App Router re-applies the server-rendered <html> attributes on every
// client-side navigation, which discards the `dark` class ThemeToggle
// (and the pre-paint init script in the layout) add imperatively. That
// class is intentionally NOT part of the server render — reading the
// theme cookie server-side would force dynamic rendering and defeat the
// static caching (see the theme note in [locale]/layout.tsx). The side
// effect is that a soft navigation — most visibly a locale switch, which
// navigates /… ↔ /en/… — snaps a dark page back to light even though the
// `theme` cookie is untouched. Re-assert the class from the cookie on
// each navigation so theme and locale stay independent.
//
// `usePathname` from next/navigation (not next-intl's, which strips the
// locale segment) so a locale-only swap still changes the value and
// re-fires the effect. Layout effect so the re-add lands before paint —
// no flash of the wrong theme.

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function ThemeSync() {
  const pathname = usePathname();

  useIsomorphicLayoutEffect(() => {
    try {
      const isDark = /(?:^|; )theme=dark(?:;|$)/.test(document.cookie);
      document.documentElement.classList.toggle("dark", isDark);
    } catch {
      // Blocked-cookie environments: leave whatever class is present.
    }
  }, [pathname]);

  return null;
}
