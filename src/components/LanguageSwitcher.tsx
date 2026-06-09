"use client";

import { useState } from "react";

// Visual-only for now — real locale switching arrives with next-intl in Stage 5
// (see docs/roadmap.md). Until then this just toggles local state so the
// component shape and styling are usable in Header/drawer designs.
type Locale = "bg" | "en";

const locales: { code: Locale; label: string }[] = [
  { code: "bg", label: "BG" },
  { code: "en", label: "EN" },
];

export function LanguageSwitcher() {
  const [active, setActive] = useState<Locale>("bg");

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex rounded-full border border-border bg-surface p-0.5"
    >
      {locales.map(({ code, label }) => {
        const isActive = active === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setActive(code)}
            aria-pressed={isActive}
            className={
              "min-w-[2.25rem] rounded-full px-2.5 py-1 text-xs font-medium " +
              "transition-colors duration-base ease-standard " +
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 " +
              (isActive
                ? "bg-brand-800 text-neutral-0 dark:bg-brand-600"
                : "text-foreground-muted hover:text-foreground")
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
