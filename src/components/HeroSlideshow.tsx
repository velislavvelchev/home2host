"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// Hero photo display for the home page. Handles both the single-photo
// case and the multi-photo crossfade slideshow with the same markup —
// all slides are rendered stacked absolutely; CSS opacity controls
// which one is visible. Active slide also gets the Ken Burns zoom so
// the photo feels alive instead of frozen.
//
// Rotation timing: 6 seconds dwell per slide; 1 second crossfade
// (matches the `duration-1000` Tailwind class). For N slides, full
// loop = N × 6s.
//
// Reduced motion: when the user has `prefers-reduced-motion: reduce`
// set, auto-advance is disabled (interval never starts) and the Ken
// Burns animation is gated by Tailwind's `motion-safe:` prefix, so the
// hero is a still photo of the first slide. The other slides are
// still rendered in the DOM but hidden by opacity — non-issue for
// reduced-motion users since they only see slide 0.

export type HeroSlide = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export function HeroSlideshow({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    // Honour OS-level reduced-motion preference — no auto-advance.
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const interval = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 6000);
    return () => window.clearInterval(interval);
  }, [slides.length]);

  // Guard against a stale index if the slide list shrinks (HMR, owner
  // delete during dev). Modulo keeps the rendered index in range.
  const activeIndex = slides.length > 0 ? index % slides.length : 0;

  return (
    <>
      {slides.map((slide, i) => (
        <Image
          // Index in the key so two slides with the same src (unlikely
          // but possible if the owner uploads dupes) still get distinct
          // React keys.
          key={`${slide.src}-${i}`}
          src={slide.src}
          alt={slide.alt}
          width={slide.width}
          height={slide.height}
          // Preload only the first slide — it's LCP. The others are
          // ambient rotations the browser can fetch on idle.
          priority={i === 0}
          sizes="(max-width: 768px) 100vw, 45vw"
          className={`absolute inset-0 size-full object-cover transition-opacity duration-1000 ease-in-out ${
            i === activeIndex
              ? "opacity-100 motion-safe:animate-ken-burns"
              : "opacity-0"
          }`}
        />
      ))}
    </>
  );
}
