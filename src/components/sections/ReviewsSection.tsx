import { ArrowUpRight, Star } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { buttonStyles } from "@/components/Button";
import { ReviewsCarousel } from "./ReviewsCarousel";
import { getPayloadInstance } from "@/lib/payload";
import type { Locale } from "@/i18n/routing";
import type { Review } from "@/payload-types";

// Home-page only: no standalone /reviews/ route by design (owner asked for
// a section, not a page, and no nav entry). `headingLevel` kept for
// consistency with the other section components in case a standalone route
// is ever added later.
//
// Content model — matches the Apartments/Partners/Team pattern:
//   Collection `reviews`         → one doc per guest review (name, text,
//                                  rating, date, order, isActive)
//   Global    `listings-reviews` → section chrome + isVisible kill switch
//                                  + the overall-rating trust card fields
//                                  (overallRating, reviewCount, profile URL)
//
// Reviews are authentic Airbnb guest quotes: `reviewText` + `reviewerName`
// are NOT localized — the original wording shows on both the BG and EN
// sites, which is both more honest (a testimonial rewritten per language
// isn't the same testimonial) and half the data entry. Only the section
// chrome + the small fixed UI labels (from the `Reviews` messages
// namespace) are localized.
//
// Reviews can't be auto-fetched from Airbnb the way apartments are — host-
// profile reviews load behind Airbnb's private GraphQL API, not in the
// page HTML — so the owner enters them by hand in the admin. See the
// Reviews collection description in payload.config.ts.

type ReviewsSectionProps = {
  headingLevel?: "h1" | "h2";
};

type ResolvedReview = {
  id: string | number;
  reviewerName: string;
  reviewText: string;
  rating: number;
  reviewDate: string | null;
};

// Avatar background colors, drawn from the design tokens (brand scale +
// semantic colors) rather than hardcoded hexes so they stay in the theme
// system and read with white text in both light and dark mode. Which one a
// given reviewer gets is derived deterministically from their name, so the
// same person always keeps the same color across renders.
const AVATAR_COLORS = [
  "var(--color-brand-600)",
  "var(--color-success)",
  "var(--color-warning)",
  "var(--color-error)",
  "var(--color-brand-400)",
  "var(--color-brand-800)",
];

function avatarColor(name: string): string {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

// First character of the name as the avatar initial. Uses the string
// iterator (not name[0]) so multi-byte letters — Cyrillic, emoji — aren't
// split into a broken half-character.
function initial(name: string): string {
  return [...name.trim()][0]?.toUpperCase() ?? "?";
}

// Reviews longer than this get truncated to a "See more" link; shorter ones
// render whole. Also the ceiling the cards equalize to, so it doubles as the
// "medium card height" knob — raise it for taller cards, lower for shorter.
const MAX_REVIEW_CHARS = 240;

// Truncate a review at a WORD boundary (never mid-word, unlike CSS
// line-clamp which cuts at a pixel line). Backs up to the last whitespace
// before the limit and strips any dangling punctuation so the "…" reads
// cleanly. Whitespace includes the "\n"s in multi-line reviews, so those
// cut at a boundary too.
function clampReview(text: string): { shown: string; truncated: boolean } {
  const normalized = text.trim();
  if (normalized.length <= MAX_REVIEW_CHARS) {
    return { shown: normalized, truncated: false };
  }
  const slice = normalized.slice(0, MAX_REVIEW_CHARS);
  const atWord = slice.replace(/\s+\S*$/u, "");
  // Guard against a pathological single-word run with no whitespace to back
  // up to — fall back to the hard slice rather than emptying the card.
  const base = atWord.length > MAX_REVIEW_CHARS * 0.5 ? atWord : slice;
  const cleaned = base.replace(/[\s.,;:!?—–-]+$/u, "");
  return { shown: cleaned, truncated: true };
}

export async function ReviewsSection({
  headingLevel = "h2",
}: ReviewsSectionProps) {
  const Heading = headingLevel;
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("Reviews");

  const payload = await getPayloadInstance();
  const [listing, { docs }] = await Promise.all([
    payload.findGlobal({ slug: "listings-reviews", locale, depth: 0 }),
    payload.find({
      collection: "reviews",
      where: { isActive: { equals: true } },
      sort: "order",
      // Reviews aren't localized, so locale doesn't affect the rows —
      // passed for API symmetry with the other section reads.
      locale,
      depth: 0,
      limit: 100,
    }),
  ]);

  // Master kill switch — owner-facing toggle on the Global to hide the whole
  // section without deleting content.
  if (!listing.isVisible) return null;

  const profileUrl =
    typeof listing.airbnbProfileUrl === "string" &&
    listing.airbnbProfileUrl.length > 0
      ? listing.airbnbProfileUrl
      : null;

  const items: ResolvedReview[] = (docs as Review[])
    .map((row): ResolvedReview | null => {
      if (!row.reviewerName || !row.reviewText) return null;
      return {
        id: row.id,
        reviewerName: row.reviewerName,
        reviewText: row.reviewText,
        rating: typeof row.rating === "number" ? row.rating : 5,
        reviewDate: row.reviewDate ?? null,
      };
    })
    .filter((item): item is ResolvedReview => item !== null);

  // Second safety net: a "visible" section with no active reviews would
  // render as chrome with an empty carousel — hide it instead.
  if (items.length === 0) return null;

  return (
    <section
      id="reviews"
      aria-labelledby="reviews-heading"
      // Muted surface + a top hairline so it reads as its own band even
      // though the Apartments section above also sits on surface-muted.
      // Cards use `bg-surface` (white / dark navy) so they lift off this
      // background in both themes — the reference "gray section, white
      // cards" look.
      className="border-t border-border bg-surface-muted"
    >
      <div className="mx-auto max-w-6xl px-gutter py-section">
        <RevealOnScroll>
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 dark:bg-brand-900 dark:text-brand-100">
            <span className="size-1.5 rounded-full bg-brand-600" />
            {listing.eyebrow}
          </span>

          <Heading
            id="reviews-heading"
            className="mt-6 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl"
          >
            {listing.heading}
          </Heading>

          <p className="mt-6 max-w-prose text-lg leading-relaxed text-foreground-muted">
            {listing.lead}
          </p>
        </RevealOnScroll>

        <div className="mt-12">
          <ReviewsCarousel>
            {items.map((review, index) => (
              <ReviewCard
                key={review.id}
                review={review}
                index={index}
                reviewLabel={t("reviewLabel")}
                seeMoreLabel={t("seeMore")}
                profileUrl={profileUrl}
              />
            ))}
          </ReviewsCarousel>
        </div>

        {profileUrl ? (
          <RevealOnScroll className="mt-10 flex justify-center">
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonStyles("secondary", "lg")}
            >
              {t("seeAll")}
              <ArrowUpRight className="size-5" strokeWidth={2} aria-hidden="true" />
            </a>
          </RevealOnScroll>
        ) : null}
      </div>
    </section>
  );
}

function StarRow({
  rating,
  className = "",
}: {
  rating: number;
  className?: string;
}) {
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span
      className={`inline-flex items-center gap-0.5 ${className}`}
      aria-hidden="true"
    >
      {Array.from({ length: full }).map((_, i) => (
        <Star key={i} className="size-4 fill-current" strokeWidth={0} />
      ))}
    </span>
  );
}

type ReviewCardProps = {
  review: ResolvedReview;
  index: number;
  reviewLabel: string;
  seeMoreLabel: string;
  profileUrl: string | null;
};

function ReviewCard({
  review,
  index,
  reviewLabel,
  seeMoreLabel,
  profileUrl,
}: ReviewCardProps) {
  const { shown, truncated } = clampReview(review.reviewText);
  return (
    <RevealOnScroll
      delayIndex={index % 3}
      className="flex snap-start shrink-0 w-[85vw] sm:w-[340px] md:w-[360px]"
    >
      <figure className="flex w-full flex-col rounded-2xl border border-border bg-surface p-6 shadow-1">
        <figcaption className="flex items-center gap-3">
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-full font-display text-lg font-semibold text-white"
            style={{ backgroundColor: avatarColor(review.reviewerName) }}
            aria-hidden="true"
          >
            {initial(review.reviewerName)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              {review.reviewerName}
            </p>
            <p className="text-xs text-foreground-muted">
              {review.reviewDate
                ? `${reviewLabel} · ${review.reviewDate}`
                : reviewLabel}
            </p>
          </div>
        </figcaption>

        <StarRow rating={review.rating} className="mt-4 text-warning" />

        {/* Long reviews are truncated at a word boundary (see clampReview)
            and end in "… See more" linking to the Airbnb profile. Cards
            equalize to the ~240-char ceiling via the carousel's
            items-stretch, so shorter reviews stretch up to match. */}
        <blockquote className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground-muted">
          {shown}
          {truncated ? (
            <>
              {"… "}
              {profileUrl ? (
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-brand-700 underline-offset-2 hover:underline dark:text-brand-300"
                >
                  {seeMoreLabel}
                </a>
              ) : null}
            </>
          ) : null}
        </blockquote>
      </figure>
    </RevealOnScroll>
  );
}
