import { Link } from "@/i18n/navigation";

// Shared renderer for the legal pages (Privacy Policy, Cookie Policy). The
// content itself lives locale-keyed in each page file — this only turns a
// structured document into markup, so both pages look identical and stay
// consistent. Server component; no client JS.

export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  // Data-controller / contact card rendered as a definition list.
  | { type: "controller"; rows: { label: string; value: string }[] }
  // A paragraph containing a single inline link. `external` → open in a new
  // tab with a plain <a>; otherwise a locale-aware next-intl <Link>.
  | {
      type: "pLink";
      before: string;
      href: string;
      linkText: string;
      after: string;
      external?: boolean;
    }
  | { type: "cookieTable"; headers: string[]; rows: string[][] };

export type LegalSection = { heading: string; blocks: LegalBlock[] };

export type LegalDoc = {
  title: string;
  updatedLabel: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

const linkClass =
  "font-medium text-brand-700 underline-offset-2 hover:underline dark:text-brand-300 break-words";

function Block({ block }: { block: LegalBlock }) {
  switch (block.type) {
    case "p":
      return (
        <p className="mt-4 leading-relaxed text-foreground-muted">{block.text}</p>
      );
    case "list":
      return (
        <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed text-foreground-muted marker:text-brand-500">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case "controller":
      return (
        <dl className="mt-4 rounded-2xl border border-border bg-surface-muted p-6 text-sm">
          {block.rows.map((row, i) => (
            <div
              key={i}
              className="flex flex-col gap-0.5 py-1.5 sm:flex-row sm:gap-3 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-border/60 [&:not(:last-child)]:pb-3"
            >
              <dt className="shrink-0 font-medium text-foreground sm:w-48">
                {row.label}
              </dt>
              <dd className="text-foreground-muted">{row.value}</dd>
            </div>
          ))}
        </dl>
      );
    case "pLink":
      return (
        <p className="mt-4 leading-relaxed text-foreground-muted">
          {block.before}
          {block.external ? (
            <a
              href={block.href}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              {block.linkText}
            </a>
          ) : (
            <Link href={block.href} className={linkClass}>
              {block.linkText}
            </Link>
          )}
          {block.after}
        </p>
      );
    case "cookieTable":
      return (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border text-foreground">
                {block.headers.map((h, i) => (
                  <th key={i} className="py-2 pr-4 font-semibold last:pr-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-foreground-muted">
              {block.rows.map((row, ri) => (
                <tr key={ri} className="border-b border-border align-top">
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={`py-3 pr-4 last:pr-0 ${ci === 0 ? "font-mono text-xs text-foreground" : ""}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-gutter py-section">
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {doc.title}
        </h1>
        <p className="mt-4 text-sm text-foreground-muted">
          {doc.updatedLabel} {doc.updated}
        </p>
        <p className="mt-8 text-lg leading-relaxed text-foreground-muted">
          {doc.intro}
        </p>

        {doc.sections.map((section, si) => (
          <section key={si}>
            <h2 className="mt-12 font-display text-2xl font-semibold tracking-tight">
              {section.heading}
            </h2>
            {section.blocks.map((block, bi) => (
              <Block key={bi} block={block} />
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
