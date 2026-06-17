"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";

// Primary nav. Slugs match the live WordPress URLs (with trailing slashes)
// so existing Google-indexed pages keep resolving 1:1 — see ADR/roadmap
// Stage 4 notes on SEO preservation.
//
// `sectionId` is the matching <section id="..."> in the home-page embed.
// It's used by the scroll-spy below to decide which nav item is active
// while the user scrolls through `/`. `/blog/` has no home-page section
// since the blog is a separate listing, so we omit it from the spy.
// `labelKey` is resolved against the `Nav` namespace at render time so
// the nav reads BG on `/...` and EN on `/en/...`.
type NavItem = {
  href: string;
  labelKey: "aboutUs" | "services" | "apartments" | "prices" | "questions" | "blog" | "contacts";
  sectionId: string | null;
};

const navItems: NavItem[] = [
  { href: "/about-us/",   labelKey: "aboutUs",    sectionId: "about-us"   },
  { href: "/services/",   labelKey: "services",   sectionId: "services"   },
  { href: "/apartments/", labelKey: "apartments", sectionId: "apartments" },
  { href: "/prices/",     labelKey: "prices",     sectionId: "prices"     },
  { href: "/questions/",  labelKey: "questions",  sectionId: "questions"  },
  { href: "/blog/",       labelKey: "blog",       sectionId: null         },
  { href: "/contacts/",   labelKey: "contacts",   sectionId: "contacts"   },
];

// Active-nav classes for the desktop bar — applied additively over the
// base classes so the inactive item just uses the muted variant.
const NAV_LINK_BASE =
  "rounded-md px-3 py-2 text-sm font-medium transition-colors duration-base ease-standard";
const NAV_LINK_INACTIVE =
  "text-foreground-muted hover:bg-surface-muted hover:text-foreground";
const NAV_LINK_ACTIVE =
  "bg-surface-muted text-foreground";

// Same idea for the mobile drawer — slightly heavier weight + brand tint
// so the active row stands out in the tap-target list.
const MOBILE_LINK_BASE =
  "block rounded-md px-3 py-3 text-base font-medium transition-colors duration-base ease-standard";
const MOBILE_LINK_INACTIVE = "text-foreground hover:bg-surface-muted";
const MOBILE_LINK_ACTIVE =
  "bg-brand-50 text-brand-800 dark:bg-brand-900 dark:text-brand-200";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const tNav = useTranslations("Nav");
  const tHeader = useTranslations("Header");
  // Currently most-visible section while scrolling `/`. null when off-home
  // (we rely on pathname matching instead).
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  // Lock body scroll + ESC-to-close while the mobile drawer is open.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Scroll-spy: only runs on the home page (where all sections are
  // embedded in one document). On standalone routes the nav highlights
  // by pathname instead — no observer needed.
  //
  // Approach: a single IntersectionObserver watches every section, and a
  // `rootMargin: "-30% 0px -55% 0px"` viewport band means a section is
  // "active" when its top edge is between ~30% and ~45% from the top of
  // the viewport. That feels like "looking at this section" rather than
  // "barely scrolled into view".
  useEffect(() => {
    if (pathname !== "/") {
      setActiveSectionId(null);
      return;
    }

    const sections = navItems
      .map((item) => item.sectionId)
      .filter((id): id is string => id !== null)
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the visible section closest to the top of the viewport.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              a.target.getBoundingClientRect().top -
              b.target.getBoundingClientRect().top,
          );
        if (visible.length > 0) {
          const id = visible[0].target.id;
          setActiveSectionId(id);
          // Update the URL hash without scrolling and without polluting
          // browser history — `replaceState`, not `pushState` or assigning
          // `location.hash = ...` (which would scroll the page).
          if (typeof window !== "undefined") {
            history.replaceState(null, "", `#${id}`);
          }
        }
      },
      {
        rootMargin: "-30% 0px -55% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [pathname]);

  function isActive(item: NavItem): boolean {
    // Home page: scroll-spy result wins. Highlight nothing until at
    // least one section has been seen (initial top-of-page state).
    if (pathname === "/") {
      return item.sectionId !== null && item.sectionId === activeSectionId;
    }
    // Standalone route: pathname must match the nav href exactly. With
    // `trailingSlash: true`, Next.js normalizes pathname to also include
    // the trailing slash, so this is a clean string compare.
    return pathname === item.href;
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-gutter">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-foreground"
          aria-label={tHeader("logoAriaLabel")}
        >
          {/* Brand chip — icon-only variant of the logo. The full lockup
              (icon + wordmark) is too detailed at this size; the wordmark
              text rendered next to the chip carries that part. SVG has its
              own white backdrop baked in, so the cut-outs read correctly
              against any surrounding background. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-icon.svg"
            alt=""
            aria-hidden="true"
            width={36}
            height={36}
            className="block size-9 overflow-hidden rounded-md"
          />
          Home2Host
        </Link>

        <nav aria-label={tHeader("ariaPrimary")} className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`${NAV_LINK_BASE} ${active ? NAV_LINK_ACTIVE : NAV_LINK_INACTIVE}`}
                  >
                    {tNav(item.labelKey)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={tHeader("openMenu")}
            aria-controls="mobile-drawer"
            aria-expanded={open}
            className="inline-flex size-10 items-center justify-center rounded-md text-foreground transition-colors duration-base ease-standard hover:bg-surface-muted lg:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
      </header>

      {/* Mobile drawer — rendered as a sibling, NOT a child of <header>. The
          header has `backdrop-blur`, and any element with `backdrop-filter`
          becomes a containing block for `position: fixed` descendants, which
          clips the drawer to the header's height. Sibling = drawer's
          `fixed inset-0` is resolved against the real viewport. */}
      <div
        id="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={tHeader("menuTitle")}
        className={
          "fixed inset-0 z-50 lg:hidden " +
          (open ? "pointer-events-auto" : "pointer-events-none")
        }
      >
        <div
          onClick={() => setOpen(false)}
          aria-hidden="true"
          className={
            "absolute inset-0 bg-neutral-1000/70 transition-opacity duration-base ease-standard " +
            (open ? "opacity-100" : "opacity-0")
          }
        />
        <div
          className={
            "absolute inset-y-0 right-0 flex w-80 max-w-[85vw] flex-col border-l border-border bg-background transition-transform duration-base ease-standard " +
            (open ? "translate-x-0" : "translate-x-full")
          }
        >
          <div className="flex h-16 items-center justify-between border-b border-border px-gutter">
            <span className="font-display text-base font-semibold">{tHeader("menuTitle")}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={tHeader("closeMenu")}
              className="inline-flex size-10 items-center justify-center rounded-md text-foreground transition-colors duration-base ease-standard hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <nav aria-label={tHeader("ariaMobile")} className="flex-1 overflow-y-auto px-gutter py-4">
            <ul className="flex flex-col gap-1">
              {navItems.map((item) => {
                const active = isActive(item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`${MOBILE_LINK_BASE} ${active ? MOBILE_LINK_ACTIVE : MOBILE_LINK_INACTIVE}`}
                    >
                      {tNav(item.labelKey)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
