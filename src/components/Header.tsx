"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "./LanguageSwitcher";

// Primary nav. Slugs match the live WordPress URLs (with trailing slashes)
// so existing Google-indexed pages keep resolving 1:1 — see ADR/roadmap
// Stage 4 notes on SEO preservation. Labels are BG to match the primary
// content language; EN labels arrive in Stage 5 via next-intl.
const navItems = [
  { href: "/about-us/",   label: "За нас" },
  { href: "/services/",   label: "Услуги" },
  { href: "/apartments/", label: "Апартаменти" },
  { href: "/prices/",     label: "Цени" },
  { href: "/questions/",  label: "Въпроси" },
  { href: "/blog/",       label: "Блог" },
  { href: "/contacts/",   label: "Контакти" },
];

export function Header() {
  const [open, setOpen] = useState(false);

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

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-gutter">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-foreground"
          aria-label="Home2Host — начало"
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

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {navItems.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-foreground-muted transition-colors duration-base ease-standard hover:bg-surface-muted hover:text-foreground"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
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
        aria-label="Menu"
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
            <span className="font-display text-base font-semibold">Menu</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="inline-flex size-10 items-center justify-center rounded-md text-foreground transition-colors duration-base ease-standard hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-gutter py-4">
            <ul className="flex flex-col gap-1">
              {navItems.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-3 text-base font-medium text-foreground transition-colors duration-base ease-standard hover:bg-surface-muted"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
