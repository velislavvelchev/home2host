import Link from "next/link";

const siteMap = [
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/prices", label: "Prices" },
  { href: "/apartments", label: "Apartments" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "FAQ" },
  { href: "/contacts", label: "Contacts" },
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
              <span className="size-2 rounded-full bg-brand-800 dark:bg-brand-500" />
              Home2Host
            </Link>
            <p className="mt-3 max-w-sm text-sm text-foreground-muted">
              Short-term rental management for property owners in Bansko and Burgas.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Site map
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
              Contacts
            </h2>
            {/* Placeholder until Contacts global is populated via the Payload admin. */}
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-foreground-muted">Email</dt>
                <dd className="text-foreground">hello@home2host.com</dd>
              </div>
              <div>
                <dt className="text-foreground-muted">Areas</dt>
                <dd className="text-foreground">Bansko · Burgas</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-xs text-foreground-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Home2Host. All rights reserved.</p>
          <p>Bansko · Burgas, Bulgaria</p>
        </div>
      </div>
    </footer>
  );
}
