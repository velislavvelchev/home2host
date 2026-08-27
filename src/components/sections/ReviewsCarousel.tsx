"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

// Horizontal scroll-snap carousel for the Reviews section. Same interaction
// contract as ApartmentsCarousel (swipe on mobile, chevron arrows on md+,
// auto-advance with hover/touch pauses, reduced-motion aware) — deliberately
// kept as a sibling rather than sharing one component, because the only
// difference that matters is the i18n namespace for the arrow labels, and
// forcing a shared "labels" prop onto the working Apartments carousel adds
// more indirection than the ~40 duplicated lines it would save. Reviews are
// text-heavy, so the auto-advance interval is a touch slower to give the
// eye time to read a card before it moves.

type ReviewsCarouselProps = {
  children: ReactNode;
};

const AUTOSCROLL_INTERVAL_MS = 7000;
const TOUCH_PAUSE_MS = 10_000;

export function ReviewsCarousel({ children }: ReviewsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = useTranslations("Reviews");

  // --- Edge detection: update arrow can-scroll state ---
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
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
    const firstCard = el.firstElementChild as HTMLElement | null;
    const cardWidth = firstCard?.offsetWidth ?? 340;
    const gap = 24;
    el.scrollBy({
      left: direction * (cardWidth + gap),
      behavior: "smooth",
    });
  }

  // --- Auto-scroll with pause logic ---
  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    if (isPaused) return;

    const interval = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scrollByOne(1);
      }
    }, AUTOSCROLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isPaused]);

  function pauseFor(ms: number) {
    setIsPaused(true);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      setIsPaused(false);
      pauseTimerRef.current = null;
    }, ms);
  }

  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, []);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        if (!pauseTimerRef.current) setIsPaused(false);
      }}
      onTouchStart={() => pauseFor(TOUCH_PAUSE_MS)}
    >
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory items-stretch gap-6 overflow-x-auto scroll-px-gutter pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      <button
        type="button"
        aria-label={t("carouselPrev")}
        onClick={() => scrollByOne(-1)}
        disabled={!canScrollLeft}
        className="absolute left-0 top-1/2 hidden size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-foreground shadow-2 transition-opacity hover:bg-surface-muted disabled:pointer-events-none disabled:opacity-0 md:inline-flex"
      >
        <ChevronLeft className="size-5" strokeWidth={2} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label={t("carouselNext")}
        onClick={() => scrollByOne(1)}
        disabled={!canScrollRight}
        className="absolute right-0 top-1/2 hidden size-11 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-foreground shadow-2 transition-opacity hover:bg-surface-muted disabled:pointer-events-none disabled:opacity-0 md:inline-flex"
      >
        <ChevronRight className="size-5" strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
}
