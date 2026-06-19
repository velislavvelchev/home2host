import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonStyles } from "@/components/Button";
import { HeroSlideshow, type HeroSlide } from "@/components/HeroSlideshow";
import { AboutSection } from "@/components/sections/AboutSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { ApartmentsSection } from "@/components/sections/ApartmentsSection";
import { PricesSection } from "@/components/sections/PricesSection";
import { FaqSection } from "@/components/sections/FaqSection";
import { ContactsSection } from "@/components/sections/contacts/ContactsSection";
import { getPayloadInstance } from "@/lib/payload";
import type { Locale } from "@/i18n/routing";
import type { Media } from "@/payload-types";

// Built-in default hero photo, used when the `landing-page` Global has
// no images uploaded yet. The owner can override by adding images via
// admin; until they do, the site still renders with a real photo.
const DEFAULT_HERO_IMAGE = {
  src: "/hero-home.jpeg",
  width: 1600,
  height: 1069,
};

// Helper: decide whether a CTA URL should route internally (locale-
// aware via next-intl) or open externally in a new tab. Owner pastes
// `/contacts/` for internal or `https://...` for external; the schema
// doesn't enforce so the frontend has to detect.
function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const payload = await getPayloadInstance();
  // depth: 1 so the image upload relations come back populated with
  // their full Media doc (url, sizes, alt, intrinsic dimensions). Cheap
  // — the array is capped at 8 by the schema.
  const hero = await payload.findGlobal({
    slug: "landing-page",
    locale: locale as Locale,
    depth: 1,
  });

  // Built-in default alt is the only string still pulled from the i18n
  // bundle for the hero — used when no images are uploaded and we fall
  // back to /hero-home.jpeg. As soon as the owner uploads photos, each
  // photo's alt comes from its own Media doc instead.
  const t = await getTranslations("Hero");

  // Build the slideshow input. Filter out any rows where the upload
  // relation didn't resolve (race during edit, deleted Media, etc.) so
  // a half-deleted row can't blank the hero.
  const ownedSlides: HeroSlide[] = (hero.images ?? [])
    .map((item): HeroSlide | null => {
      const media = typeof item.image === "object" ? (item.image as Media) : null;
      if (!media?.url) return null;
      return {
        src: media.url,
        alt: media.alt || "",
        width: media.width ?? DEFAULT_HERO_IMAGE.width,
        height: media.height ?? DEFAULT_HERO_IMAGE.height,
      };
    })
    .filter((s): s is HeroSlide => s !== null);

  const slides: HeroSlide[] =
    ownedSlides.length > 0
      ? ownedSlides
      : [
          {
            src: DEFAULT_HERO_IMAGE.src,
            alt: t("imageAlt"),
            width: DEFAULT_HERO_IMAGE.width,
            height: DEFAULT_HERO_IMAGE.height,
          },
        ];

  return (
    <main className="flex-1">
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-gutter py-section">
          <div className="grid gap-10 md:grid-cols-12 md:items-center md:gap-12 lg:gap-16">
            <div className="relative md:col-span-7">
              {/*
                Decorative gradient blobs sitting behind the heading. Brand-
                indigo, blurred large enough to read as ambient glow rather
                than a shape. The second blob is the same animation offset
                by half a cycle (-4s) so the two pulse out of phase — gives
                a drifting feel instead of one thing breathing. `motion-safe:`
                honours prefers-reduced-motion.
              */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-32 -top-32 -z-10 size-[34rem] rounded-full bg-brand-400/60 blur-3xl motion-safe:animate-glow dark:bg-brand-500/60"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-24 right-0 -z-10 size-[26rem] rounded-full bg-brand-300/50 blur-3xl motion-safe:animate-glow motion-safe:[animation-delay:-4s] dark:bg-brand-400/40"
              />

              <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 dark:bg-brand-900 dark:text-brand-100">
                <span className="size-1.5 rounded-full bg-brand-600" />
                {hero.eyebrow}
              </span>

              {/*
                Title is composed from three localized fields: a plain
                lead-in, a highlighted phrase rendered in brand indigo,
                and a trailing tail (often just punctuation). Any of the
                three can be empty — the owner can put the highlight at
                the start by leaving `titleBefore` empty, etc. Spaces
                must be authored explicitly in each field; we don't
                inject them, otherwise titles with no highlight would
                show a stray gap.
              */}
              <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                {hero.titleBefore}
                {hero.titleHighlight ? (
                  <span className="text-brand-800 dark:text-brand-300">
                    {hero.titleHighlight}
                  </span>
                ) : null}
                {hero.titleAfter}
              </h1>

              <p className="mt-6 max-w-prose text-lg leading-relaxed text-foreground-muted">
                {hero.lead}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                {/*
                  CTA contract: relative URLs ('/contacts/') route via
                  next-intl's locale-aware Link so EN visitors get
                  /en/contacts/ automatically. Absolute URLs ('https://')
                  open in a new tab with rel="noopener noreferrer".
                */}
                {isExternalUrl(hero.primaryCta.url) ? (
                  <a
                    href={hero.primaryCta.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonStyles("primary", "lg")}
                  >
                    {hero.primaryCta.label}
                  </a>
                ) : (
                  <Link
                    href={hero.primaryCta.url}
                    className={buttonStyles("primary", "lg")}
                  >
                    {hero.primaryCta.label}
                  </Link>
                )}

                {isExternalUrl(hero.secondaryCta.url) ? (
                  <a
                    href={hero.secondaryCta.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonStyles("secondary", "lg")}
                  >
                    {hero.secondaryCta.label}
                  </a>
                ) : (
                  <Link
                    href={hero.secondaryCta.url}
                    className={buttonStyles("secondary", "lg")}
                  >
                    {hero.secondaryCta.label}
                  </Link>
                )}
              </div>
            </div>

            <div className="md:col-span-5">
              <div className="relative aspect-[3/2] overflow-hidden rounded-xl shadow-2">
                <HeroSlideshow slides={slides} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <AboutSection />
      <ServicesSection />
      <ApartmentsSection />
      <PricesSection />
      <FaqSection />
      <ContactsSection />
    </main>
  );
}
