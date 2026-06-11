"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Horizontal scroll-snap carousel for the Apartments section. Mobile users
// swipe naturally; desktop gets chevron arrow buttons that scroll one card
// at a time and disable themselves at the edges. Native CSS scroll-snap
// does the smooth-stop alignment — no JS animation library needed.
//
// Two jobs beyond layout:
//
// 1. Auto-advance every 5 seconds, with smart pauses: pause on hover
//    (desktop), pause-then-resume on touch (mobile), loop back to start
//    at the end. Respects prefers-reduced-motion: no auto-scroll for
//    users who've opted out of motion.
//
// 2. Arrow buttons (md+) for explicit control; disabled at the edges.
//
// Kept minimal: scroll state read directly from the container, no
// synthetic page model, no library dep.

type ApartmentsCarouselProps = {
  children: ReactNode;
};

const AUTOSCROLL_INTERVAL_MS = 5000;
const TOUCH_PAUSE_MS = 10_000;

export function ApartmentsCarousel({ children }: ApartmentsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Edge detection: update arrow can-scroll state ---
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      // 4px tolerance so rounding doesn't leave the arrow enabled when
      // the user has fully scrolled to the edge.
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  function scrollByOne(direction: 1 | -1) {
    const el = scrollRef.current;
    if (!el) return;
    // First child's width as the per-card scroll increment so the arrow
    // advance always lands on a snap point. Plus the container's `gap-6`
    // (24px) so we land cleanly past the gap.
    const firstCard = el.firstElementChild as HTMLElement | null;
    const cardWidth = firstCard?.offsetWidth ?? 320;
    const gap = 24;
    el.scrollBy({
      left: direction * (cardWidth + gap),
      behavior: "smooth",
    });
  }

  // --- Auto-scroll with pause logic ---
  useEffect(() => {
    // Honour reduced-motion preference: no auto-advance at all.
    if (typeof window === "undefined") return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    // Pause is in effect (user hover or recent touch) — skip the timer.
    if (isPaused) return;

    const interval = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      // At the end → loop back to start.
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scrollByOne(1);
      }
    }, AUTOSCROLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Pause auto-scroll for `ms` milliseconds, then auto-resume. Re-arming
  // an existing timer is fine — we want each fresh interaction to extend
  // the pause window.
  function pauseFor(ms: number) {
    setIsPaused(true);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      setIsPaused(false);
      pauseTimerRef.current = null;
    }, ms);
  }

  // Clean up the pause timer if the component unmounts mid-pause.
  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, []);

  return (
    <div
      className="relative"
      // Desktop pause: enter → pause indefinitely, leave → resume.
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        // Only resume if we're not in a touch-induced timed pause.
        if (!pauseTimerRef.current) setIsPaused(false);
      }}
      // Mobile pause: touch starts a timed pause; the timer auto-resumes.
      onTouchStart={() => pauseFor(TOUCH_PAUSE_MS)}
    >
      <div
        ref={scrollRef}
        // `[scrollbar-width:none]` + WebKit hide → no visible scrollbar
        // (cards themselves are the affordance; scrollbar clutters).
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-px-gutter pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      {/* Arrow buttons — desktop only (touch users swipe). Sit outside
          the content column so they don't overlap cards. Clicking
          extends the pause via the parent's mouseenter (already paused
          on hover) plus the smooth scroll itself doesn't trigger
          auto-advance. */}
      <button
        type="button"
        aria-label="Предишни апартаменти"
        onClick={() => scrollByOne(-1)}
        disabled={!canScrollLeft}
        className="absolute left-0 top-1/2 hidden size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-foreground shadow-2 transition-opacity hover:bg-surface-muted disabled:pointer-events-none disabled:opacity-0 md:inline-flex"
      >
        <ChevronLeft className="size-5" strokeWidth={2} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Следващи апартаменти"
        onClick={() => scrollByOne(1)}
        disabled={!canScrollRight}
        className="absolute right-0 top-1/2 hidden size-11 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-foreground shadow-2 transition-opacity hover:bg-surface-muted disabled:pointer-events-none disabled:opacity-0 md:inline-flex"
      >
        <ChevronRight className="size-5" strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
}
