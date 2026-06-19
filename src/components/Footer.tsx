import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getPayloadInstance } from "@/lib/payload";
import type { Locale } from "@/i18n/routing";

// Slugs match the live WordPress URLs (trailing slashes preserved) so
// existing Google rankings carry over after the DNS switch in Stage 6.
// Labels resolve from the `Nav` namespace so the footer reads BG on
// `/...` and EN on `/en/...` — same source as the Header.
//
// Email is pulled from the `contacts` Global so the owner can update it
// in /admin without a code change. Everything else here (tagline, sitemap
// heading, regions copy) stays in messages JSON — Footer chrome the
// owner is unlikely to want to retune, low edit value.
const siteMap: { href: string; key: "aboutUs" | "services" | "prices" | "apartments" | "blog" | "questions" | "contacts" }[] = [
  { href: "/about-us/",   key: "aboutUs"    },
  { href: "/services/",   key: "services"   },
  { href: "/prices/",     key: "prices"     },
  { href: "/apartments/", key: "apartments" },
  { href: "/blog/",       key: "blog"       },
  { href: "/questions/",  key: "questions"  },
  { href: "/contacts/",   key: "contacts"   },
];

export async function Footer() {
  const year = new Date().getFullYear();
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("Footer");
  const tNav = await getTranslations("Nav");

  const payload = await getPayloadInstance();
  const contacts = await payload.findGlobal({
    slug: "contacts",
    locale,
    depth: 0,
  });

  return (
    <footer className="border-t border-border bg-surface-muted">
      <div className="mx-auto max-w-6xl px-gutter py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-foreground"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-icon.svg"
                alt=""
                aria-hidden="true"
                width={36}
                height={36}
                className="block size-9 overflow-hidden rounded-md"
              />
              Home2Host
            </Link>
            <p className="mt-3 max-w-sm text-sm text-foreground-muted">
              {t("tagline")}
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              {t("sitemapHeading")}
            </h2>
            <ul className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
              {siteMap.map(({ href, key }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-foreground transition-colors duration-base ease-standard hover:text-brand-700 dark:hover:text-brand-300"
                  >
                    {tNav(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              {t("contactsHeading")}
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-foreground-muted">{t("emailLabel")}</dt>
                <dd className="text-foreground">{contacts.email}</dd>
              </div>
              <div>
                <dt className="text-foreground-muted">{t("regionsLabel")}</dt>
                <dd className="text-foreground">{t("regionsValue")}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-xs text-foreground-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{t("rights", { year })}</p>
          <p>{t("location")}</p>
        </div>
      </div>
    </footer>
  );
}
