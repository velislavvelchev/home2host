export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-background px-gutter py-section text-foreground">
      <div className="w-full max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 dark:bg-brand-900 dark:text-brand-100">
          <span className="size-1.5 rounded-full bg-brand-600" />
          Stage 1 · design-system foundation
        </span>

        <h1 className="mt-6 font-display text-5xl font-semibold tracking-tight">
          Home2Host
        </h1>

        <p className="mt-4 max-w-prose text-lg text-foreground-muted">
          Property management for short-term rentals in Bansko and Burgas.
          The new site is being rebuilt. Tokens above (color, type, spacing,
          radius, shadow) come from{" "}
          <code className="rounded-sm bg-surface-muted px-1.5 py-0.5 font-mono text-sm">
            src/app/globals.css
          </code>
          .
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <a
            href="https://github.com/velislavvelchev/home2host"
            className="inline-flex h-10 items-center rounded-md bg-brand-800 px-4 text-sm font-medium text-neutral-0 shadow-1 transition-colors duration-base ease-standard hover:bg-brand-700"
          >
            Repository
          </a>
          <a
            href="https://github.com/velislavvelchev/home2host/blob/main/docs/roadmap.md"
            className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors duration-base ease-standard hover:bg-surface-muted"
          >
            Roadmap
          </a>
        </div>

        <hr className="my-10 border-border" />

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs uppercase tracking-wide text-foreground-muted">Brand</dt>
            <dd className="mt-1 font-mono text-foreground">#122c69</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-foreground-muted">Font</dt>
            <dd className="mt-1 text-foreground">Geist Sans</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-foreground-muted">Spacing</dt>
            <dd className="mt-1 font-mono text-foreground">4px base</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-foreground-muted">Stack</dt>
            <dd className="mt-1 text-foreground">Next 16 · TW 4</dd>
          </div>
        </dl>
      </div>
    </main>
  );
}
