"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Wraps arbitrary content in a fade-up reveal triggered by IntersectionObserver
// the first time the element scrolls into view. Once revealed, it stays revealed
// (no re-trigger on re-scroll) — feels less twitchy than libraries that animate
// on every intersection.
//
// `prefers-reduced-motion: reduce` users get the content rendered visible
// immediately, skipping the observer entirely.
//
// Kept deliberately small (~1KB after minify) — the alternative would be a
// motion library like framer-motion (~30KB) which is overkill for one effect.
// See `docs/roadmap.md` Stage 4 — this is meant to be the single scroll-fade
// utility shared across every marketing section.

type RevealOnScrollProps = {
  children: ReactNode;
  // Pixel offset to delay the trigger until the element is `rootMargin`px
  // inside the viewport. Negative values fire earlier (element still below
  // the fold); positive values fire later. Default `-80px` ≈ "fire when the
  // top ~80px of the element is visible," which feels natural on most
  // viewport heights.
  rootMargin?: string;
  // Staggers the reveal so a vertical list of siblings cascades instead of
  // popping in together. Pass the index in the list; we convert to ms.
  delayIndex?: number;
  // Extra Tailwind classes applied to the wrapper <div>. Useful when the
  // wrapper itself needs to participate in layout (e.g. flex-item sizing
  // inside a carousel: `snap-start shrink-0 w-[320px]`).
  className?: string;
};

export function RevealOnScroll({
  children,
  rootMargin = "0px 0px -80px 0px",
  delayIndex = 0,
  className = "",
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Honour the OS-level reduced-motion preference — same contract as the
    // Tailwind `motion-safe:` utilities used elsewhere in the project.
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) {
      setRevealed(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: revealed ? `${delayIndex * 80}ms` : "0ms" }}
      className={`transition-all duration-700 ease-out ${
        revealed ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}
