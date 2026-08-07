import Image from "next/image";
import { ShieldCheck, Star } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { RichText } from "@payloadcms/richtext-lexical/react";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { getPayloadInstance } from "@/lib/payload";
import type { Locale } from "@/i18n/routing";
import type { Media, TeamMember } from "@/payload-types";

// About-us-only: no home-page embed by design (owner wants staff cards
// on the standalone /about-us/ page, not the marketing home). Rendered
// as `h2` under the page's `h1` (which is About's heading).
//
// Content model — matches the FAQ/Apartments/Partners pattern:
//   Collection `team-members`  → one doc per person (name, photo,
//                                position, city, bio, order, isActive)
//   Global    `listings-team`  → section chrome + isVisible kill switch
//                                (eyebrow, heading, lead, note)
//
// Two-level hide: Global's `isVisible` is the master switch (whole
// section renders or not); each team member has its own `isActive` for
// per-person hiding without deletion.
//
// Bio is a Lexical rich-text field — same editor as blog posts, so
// owner gets bold/italic/lists/links without a second editor UX to
// learn. Rendered via `@payloadcms/richtext-lexical/react`'s <RichText>
// with the existing `.blog-prose` typography from globals.css so
// bold/italic/list styles stay consistent across the site.
//
// Card design — inverse of the Apartment cards on purpose: dark navy
// (brand-800) surface with white type. Creates strong visual contrast
// against the bio panel on the right (which stays on the page bg) and
// echoes the primary-CTA colour, signaling "this person is a hero
// asset" without needing extra chrome.
//
// Photo — uses the ORIGINAL Media url, not the pre-cropped `card` size
// variant. The size variants defined in payload.config.ts's media
// collection are all landscape (thumbnail 4:3, card 3:2, hero 16:9)
// which crop the top of the head off a portrait when squeezed into
// them. `next/image` with `fill` on the original srcs a proper set
// per viewport, and `object-[center_top]` positions the crop from the
// top so hair/forehead stays in frame if the original aspect doesn't
// match the square container.

type ResolvedMember = {
  id: string | number;
  name: string;
  position: string | null;
  city: string;
  bio: SerializedEditorState;
  photo: Media;
  isSuperhost: boolean;
  airbnbProfileUrl: string | null;
  guestRating: number | null;
};

export async function TeamSection() {
  const locale = (await getLocale()) as Locale;
  const payload = await getPayloadInstance();
  const t = await getTranslations("Team");

  const [listing, { docs }] = await Promise.all([
    payload.findGlobal({
      slug: "listings-team",
      locale,
      depth: 0,
    }),
    payload.find({
      collection: "team-members",
      locale,
      sort: "order",
      where: { isActive: { equals: true } },
      limit: 50,
      depth: 1,
    }),
  ]);

  if (!listing.isVisible) return null;

  const members: ResolvedMember[] = (docs as TeamMember[])
    .map((row): ResolvedMember | null => {
      const photo = typeof row.photo === "object" ? (row.photo as Media) : null;
      if (!photo?.url || !row.name || !row.bio || !row.city) return null;
      return {
        id: row.id,
        name: row.name,
        position: row.position?.trim() ? row.position : null,
        city: row.city,
        bio: row.bio as unknown as SerializedEditorState,
        photo,
        isSuperhost: row.isSuperhost === true,
        airbnbProfileUrl: row.airbnbProfileUrl?.trim()
          ? row.airbnbProfileUrl
          : null,
        guestRating:
          typeof row.guestRating === "number" ? row.guestRating : null,
      };
    })
    .filter((item): item is ResolvedMember => item !== null);

  if (members.length === 0) return null;

  return (
    <section
      id="team"
      aria-labelledby="team-heading"
    >
      {/*
        Section chrome (eyebrow / heading / lead) stays in the
        standard max-w-6xl container so it aligns with the About
        section above. The rows below deliberately break out to a
        wider container — see the next block. */}
      <div className="mx-auto max-w-6xl px-gutter pt-section">
        <RevealOnScroll>
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 dark:bg-brand-900 dark:text-brand-100">
            <span className="size-1.5 rounded-full bg-brand-600" />
            {listing.eyebrow}
          </span>

          <h2
            id="team-heading"
            className="mt-6 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl"
          >
            {listing.heading}
          </h2>

          {listing.lead ? (
            <p className="mt-6 max-w-prose text-lg leading-relaxed text-foreground-muted">
              {listing.lead}
            </p>
          ) : null}
        </RevealOnScroll>
      </div>

      {/*
        Rows in a WIDER container (max-w-[1440px]) than the chrome
        above (max-w-6xl = 1152px). Team member rows use the
        horizontal whitespace the standard container leaves on the
        sides — the owner specifically asked to use that space so
        the outer gray frame + navy card + bio row has more room to
        breathe. On viewports narrower than 1440 px this container
        just fills to the page gutter (mobile stays visually
        identical to the pre-break-out layout). Intentional
        left-edge misalignment with the About section above is
        acknowledged and OK'd by the owner.

        divide-y draws a hairline (border-border, same token the
        Footer's top rule uses) between adjacent rows only — no
        leading rule above the first row, no trailing rule under
        the last. Combined with symmetric top+bottom padding on
        each row, the divider ends up centered in the gap so it
        reads as a section separator rather than a shelf under any
        one member.
      */}
      <div className="mx-auto max-w-[1440px] px-gutter pb-section">
        <div className="mt-8 flex flex-col divide-y divide-border">
          {members.map((member, index) => (
            <TeamMemberRow
              key={member.id}
              member={member}
              delayIndex={index % 3}
              guestRatingLabel={t("guestRating")}
              viewProfileLabel={t("viewOnAirbnb")}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

type TeamMemberRowProps = {
  member: ResolvedMember;
  delayIndex: number;
  guestRatingLabel: string;
  viewProfileLabel: string;
};

function TeamMemberRow({
  member,
  delayIndex,
  guestRatingLabel,
  viewProfileLabel,
}: TeamMemberRowProps) {
  // Card is clickable only when an Airbnb profile URL is set. When
  // it is, we render an <a> with target=_blank + hover animation.
  // When it isn't, we render a plain <div> — no cursor pointer, no
  // hover effect, matching the "no action" affordance.
  const isClickable = Boolean(member.airbnbProfileUrl);
  return (
    <RevealOnScroll
      delayIndex={delayIndex}
      // Symmetric top+bottom padding on each row so the parent's
      // divide-y hairline lands centered in the visual gap between
      // rows. `first:pt-0 last:pb-0` trims the outer padding so the
      // section chrome doesn't get a phantom gap above the first row
      // or below the last.
      className="py-12 first:pt-0 last:pb-0 md:py-16"
    >
      {/*
        Side-by-side layout: compact card on the left, wide bio on
        the right. Bio column is deliberately as wide as the layout
        allows (no max-w-prose cap) so long bios take fewer vertical
        lines and the two columns end at closer heights — this is
        how the reference site (bnbmanager.bg) achieves a balanced
        row despite bios of varying length.

        Column widths: 520/620-px card column — with the parent
        row container now at max-w-[1440px] we have room to give
        the outer gray frame significant width without starving the
        bio column. Frame is proportioned so the navy card sits
        centered inside with generous gray padding on both sides,
        pulling the whole card toward a near-square shape rather
        than the tall portrait it was before. Mobile stays
        single-column (grid collapses at <md).
      */}
      <div className="grid gap-8 md:grid-cols-[520px_1fr] md:gap-10 lg:grid-cols-[620px_1fr] lg:gap-14">
        {/* Photo card — softened navy (brand-800 at 85% opacity),
            circular portrait at top, name + city + position band
            beneath. Centered on mobile, pinned to left column on md+.

            Wrapped in an outer light-gray "frame" card
            (bg-surface-muted + border) so the navy tile reads as a
            hero panel INSIDE a hosting card, matching the reference
            (bnbmanager.bg host profile). Outer card is
            theme-adaptive: near-white with a hairline border in
            light mode, dark navy-gray in dark mode.

            Padding on the outer frame is symmetric — the navy card
            sits CENTERED inside the gray card with equal gray
            margin on all sides. Combined with the wider grid
            column and wider parent container, this reads as
            "framed portrait card" rather than "navy tile pushed
            against one edge". Navy card is capped at max-w-[420px]
            so it doesn't stretch to fill a much wider outer card
            — its width stays the intended photo-card size while
            the frame grows around it. */}
        <div className="mx-auto w-full max-w-[340px] md:mx-0 md:max-w-none">
          <div className="rounded-[2rem] border border-border bg-surface-muted p-4 shadow-1 md:p-8 lg:p-10">
            {/*
              Inner navy card. Rendered as an <a> when
              airbnbProfileUrl is set (whole card becomes a link to
              the Airbnb host profile, opens new tab), or a plain
              <div> otherwise — no cursor pointer, no hover.

              Hover treatment on the clickable variant: subtle lift +
              brighter border + slightly stronger shadow, plus a
              tiny photo zoom via the `group` pattern. Mobile
              devices don't trigger :hover on tap so this cleanly
              no-ops on touch — no special media-query gating
              needed. Matches the Apartment card's hover feel.

              `focus-visible:ring-2` gives keyboard users the same
              affordance sighted users get on hover.
            */}
            {(() => {
              const navyCardBase =
                "group mx-auto block w-full max-w-[420px] rounded-3xl border border-brand-700/50 bg-brand-800/85 p-6 text-center shadow-2 sm:p-8";
              const navyCardHover =
                "transition-all duration-300 ease-out hover:-translate-y-1 hover:border-brand-500 hover:shadow-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-muted";
              const cardBody = (
                <>
                  {/* Photo + optional Superhost badge. Badge is a
                      sibling of the clipped circle so the
                      overflow-hidden rounded-full doesn't clip it. */}
                  <div className="relative mx-auto w-40 md:w-44 lg:w-48">
                    <div className="relative aspect-square overflow-hidden rounded-full ring-4 ring-white/20 shadow-2">
                      {member.photo.url ? (
                        <Image
                          src={member.photo.url}
                          alt={member.photo.alt ?? member.name}
                          fill
                          sizes="(max-width: 767px) 160px, (max-width: 1023px) 176px, 192px"
                          // `object-cover` + `object-[center_top]`
                          // keeps the top of the head in frame on a
                          // portrait; `group-hover:scale-105`
                          // subtly zooms the photo when the whole
                          // card is hovered (only fires when card
                          // is clickable — a plain div isn't a
                          // group target for hover in practice).
                          className="object-cover object-[center_top] transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                      ) : null}
                    </div>
                    {member.isSuperhost ? (
                      <span
                        aria-hidden="true"
                        className="absolute bottom-1 right-1 flex size-9 items-center justify-center rounded-full bg-pink-500 shadow-1 ring-4 ring-brand-800 md:size-10"
                      >
                        <ShieldCheck
                          className="size-5 text-white md:size-[22px]"
                          strokeWidth={2.5}
                        />
                      </span>
                    ) : null}
                    {member.isSuperhost ? (
                      <span className="sr-only">Airbnb Superhost</span>
                    ) : null}
                  </div>
                  <h3 className="mt-5 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    {member.name}
                  </h3>
                  {/* Guest rating — optional, renders directly under
                      the name. Yellow star + white number on line 1,
                      localized "guest rating" caption on line 2.
                      Matches the visual shape of the reference card
                      but adapted to the navy background (star stays
                      yellow, text goes white). Formatted to one
                      decimal (5.0, 4.9) — matches Airbnb's own
                      display convention. */}
                  {member.guestRating !== null ? (
                    <div className="mt-3 flex flex-col items-center">
                      <div className="flex items-center gap-1.5">
                        <Star
                          aria-hidden="true"
                          className="size-5 fill-yellow-400 text-yellow-400"
                          strokeWidth={0}
                        />
                        <span className="text-lg font-semibold text-white">
                          {member.guestRating.toFixed(1)}
                        </span>
                      </div>
                      <span className="mt-0.5 text-xs font-medium text-brand-200">
                        {guestRatingLabel}
                      </span>
                    </div>
                  ) : null}
                  <p className="mt-2 font-medium text-brand-200 sm:text-base">
                    {member.city}
                  </p>
                  {member.position ? (
                    <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                      <p className="text-sm font-semibold text-white sm:text-base">
                        {member.position}
                      </p>
                    </div>
                  ) : null}
                </>
              );

              return isClickable ? (
                <a
                  href={member.airbnbProfileUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${viewProfileLabel} — ${member.name}`}
                  className={`${navyCardBase} ${navyCardHover}`}
                >
                  {cardBody}
                </a>
              ) : (
                <div className={navyCardBase}>{cardBody}</div>
              );
            })()}
          </div>
        </div>

        {/* Bio — Lexical rich text rendered through the same
            `.blog-prose` typography rules as blog posts. No
            max-w-prose cap here (unlike blog posts): bio fills the
            entire right column so long bios stay short vertically
            and the row height stays close to the card's. Line
            length gets long at lg but stays inside comfortable
            reading range on typical desktop widths. */}
        <div className="blog-prose">
          <RichText data={member.bio} disableContainer />
        </div>
      </div>
    </RevealOnScroll>
  );
}
