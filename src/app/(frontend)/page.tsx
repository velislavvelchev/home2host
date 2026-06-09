import { buttonStyles } from "@/components/Button";
import { Card } from "@/components/Card";

export default function Home() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-6xl px-gutter py-section">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 dark:bg-brand-900 dark:text-brand-100">
          <span className="size-1.5 rounded-full bg-brand-600" />
          Stage 3 · design system & shared UI
        </span>

        <h1 className="mt-6 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
          Property management in{" "}
          <span className="text-brand-800 dark:text-brand-300">
            Bansko & Burgas
          </span>
          .
        </h1>

        <p className="mt-6 max-w-prose text-lg text-foreground-muted">
          The new site is being rebuilt. The header, footer, language switcher,
          and primitives below are powered by tokens defined in{" "}
          <code className="rounded-sm bg-surface-muted px-1.5 py-0.5 font-mono text-sm">
            src/app/globals.css
          </code>
          . Pages and content arrive in Stage 4.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <a
            href="https://github.com/velislavvelchev/home2host"
            className={buttonStyles("primary", "md")}
          >
            Repository
          </a>
          <a
            href="https://github.com/velislavvelchev/home2host/blob/main/docs/roadmap.md"
            className={buttonStyles("secondary", "md")}
          >
            Roadmap
          </a>
        </div>

        <div className="mt-12">
          <Card padding="md" variant="muted">
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
          </Card>
        </div>
      </section>
    </main>
  );
}
