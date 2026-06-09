import Link from "next/link";

// Slugs match the live WordPress URLs (trailing slashes preserved) so
// existing Google rankings carry over after the DNS switch in Stage 6.
// Labels are BG to match the primary content language; EN comes in Stage 5.
const siteMap = [
  { href: "/about-us/",   label: "За нас" },
  { href: "/services/",   label: "Услуги" },
  { href: "/prices/",     label: "Цени" },
  { href: "/apartments/", label: "Апартаменти" },
  { href: "/blog/",       label: "Блог" },
  { href: "/questions/",  label: "Въпроси" },
  { href: "/contacts/",   label: "Контакти" },
];

export function Footer() {
  const year = new Date().getFullYear();

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
              Управление на имоти за краткосрочен наем в Банско и Бургас.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Карта на сайта
            </h2>
            <ul className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
              {siteMap.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-foreground transition-colors duration-base ease-standard hover:text-brand-700 dark:hover:text-brand-300"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Контакти
            </h2>
            {/* Placeholder until Contacts global is populated via the Payload admin. */}
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-foreground-muted">Имейл</dt>
                <dd className="text-foreground">info@home2host.com</dd>
              </div>
              <div>
                <dt className="text-foreground-muted">Райони</dt>
                <dd className="text-foreground">Банско · Бургас</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-xs text-foreground-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Home2Host. Всички права запазени.</p>
          <p>Банско · Бургас, България</p>
        </div>
      </div>
    </footer>
  );
}
