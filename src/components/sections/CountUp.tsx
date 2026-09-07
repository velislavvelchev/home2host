"use client";

import { useEffect, useRef, useState } from "react";

// Animates a single number from 0 up to `value` the first time it scrolls
// into view, then stops (no re-trigger). Same contract as RevealOnScroll:
//   - IntersectionObserver drives the trigger (fires once, then disconnects)
//   - `prefers-reduced-motion: reduce` skips the animation and shows the
//     final number immediately
// Purely client-side (observer + rAF + matchMedia) — it never reads a
// cookie or header, so it can't affect the page's static caching (ADR 0006).
//
// It renders the FINAL number as its initial state, so server HTML / no-JS
// visitors see the real value (not a stuck "0"). On a motion-capable client
// the effect resets it to 0 before the element is on screen (it always
// mounts below the fold, under the hero + About) and ramps back up.
//
// Number grouping is locale-aware via Intl.NumberFormat: "1 300" in BG,
// "1,300" in EN. The rAF uses an ease-out curve so a small target (4) still
// reads as 1-2-3-4 while a large one (1300) ramps quickly through the range.

type CountUpProps = {
  value: number;
  locale: string;
  durationMs?: number;
};

export function CountUp({ value, locale, durationMs = 1800 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Reduced-motion: leave the final value in place (state already starts
    // there) and skip the whole observer/animation path — no state write.
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    const node = ref.current;
    if (!node) return;

    let animateRaf = 0;
    let startTime = 0;

    // Reset to 0 on the next frame (not synchronously in the effect body —
    // that would trip react-hooks/set-state-in-effect and cause a cascading
    // render). The element mounts below the fold, so it's reset to 0 before
    // it's ever scrolled into view — no flash of the final number.
    const resetRaf = requestAnimationFrame(() => setDisplay(0));

    const animate = (now: number) => {
      if (!startTime) startTime = now;
      const t = Math.min(1, (now - startTime) / durationMs);
      // easeOutCubic — fast start, gentle settle onto the target.
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) {
        animateRaf = requestAnimationFrame(animate);
      } else {
        setDisplay(value);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            observer.disconnect();
            animateRaf = requestAnimationFrame(animate);
            break;
          }
        }
      },
      { rootMargin: "0px 0px -80px 0px" },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(resetRaf);
      if (animateRaf) cancelAnimationFrame(animateRaf);
    };
  }, [value, durationMs]);

  // `tabular-nums` keeps the digit width fixed so the number doesn't jitter
  // horizontally as it counts up.
  return (
    <span ref={ref} className="tabular-nums">
      {new Intl.NumberFormat(locale).format(display)}
    </span>
  );
}
