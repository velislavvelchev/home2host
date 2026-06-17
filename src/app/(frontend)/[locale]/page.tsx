import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { buttonStyles } from "@/components/Button";
import { AboutSection } from "@/components/sections/AboutSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { ApartmentsSection } from "@/components/sections/ApartmentsSection";
import { PricesSection } from "@/components/sections/PricesSection";
import { FaqSection } from "@/components/sections/FaqSection";
import { ContactsSection } from "@/components/sections/contacts/ContactsSection";

// `params.locale` is read so the page can opt into static rendering of
// translated content (setRequestLocale). All translated strings come
// from the `Hero` namespace via useTranslations — same hook works in
// both server and client components under next-intl.
export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HomeView />;
}

function HomeView() {
  const t = useTranslations("Hero");

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
                {t("eyebrow")}
              </span>

              <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                {t.rich("title", {
                  highlight: (chunks) => (
                    <span className="text-brand-800 dark:text-brand-300">
                      {chunks}
                    </span>
                  ),
                })}
              </h1>

              <p className="mt-6 max-w-prose text-lg leading-relaxed text-foreground-muted">
                {t("lead")}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/contacts/" className={buttonStyles("primary", "lg")}>
                  {t("ctaPrimary")}
                </Link>
                <Link href="/services/" className={buttonStyles("secondary", "lg")}>
                  {t("ctaSecondary")}
                </Link>
              </div>
            </div>

            <div className="md:col-span-5">
              <div className="relative aspect-[3/2] overflow-hidden rounded-xl shadow-2">
                <Image
                  src="/hero-home.jpeg"
                  alt={t("imageAlt")}
                  width={1600}
                  height={1069}
                  priority
                  sizes="(max-width: 768px) 100vw, 45vw"
                  className="size-full object-cover motion-safe:animate-ken-burns"
                />
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
