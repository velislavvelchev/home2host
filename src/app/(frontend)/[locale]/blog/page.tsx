import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { getPayloadInstance } from "@/lib/payload";
import type { BlogPost, Media } from "@/payload-types";

type Params = { locale: string };

// Unlike the section routes, the blog is a genuinely separate page —
// no canonical-to-home, no on-home embed. It owns its own URL.
// Per-page `openGraph` so shares of `/blog/` read for the blog rather
// than the home; per-post OG is set separately in [slug]/page.tsx.
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Blog" });
  const title = t("metaTitle");
  const description = t("metaDescription");
  return {
    title,
    description,
    openGraph: { title, description },
  };
}

// Each post lives in the DB; this page reads fresh on each request.
// Could move to ISR later if traffic warrants it.
export const dynamic = "force-dynamic";

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const payload = await getPayloadInstance();

  // No `_status` filter — see /blog/[slug]/page.tsx for the full
  // reasoning. With `versions: { drafts: true }` on the collection,
  // Payload's default find already excludes draft-only documents,
  // and the explicit filter was producing 0-match results when
  // combined with non-ASCII slug values.
  //
  // Locale-aware blog field loading lands in slice 3; for now the
  // posts are fetched in BG regardless of URL locale (matches the
  // rest of the marketing content in slice 2).
  const { docs } = await payload.find({
    collection: "blog-posts",
    sort: "-publishedAt",
    limit: 24,
    locale: "bg",
    depth: 1, // populate the featuredImage relation
  });

  const posts = docs as BlogPost[];

  return <BlogView posts={posts} />;
}

function BlogView({ posts }: { posts: BlogPost[] }) {
  const t = useTranslations("Blog");

  return (
    <main className="flex-1">
      <section className="bg-surface-muted" aria-labelledby="blog-heading">
        <div className="mx-auto max-w-6xl px-gutter py-section">
          <RevealOnScroll>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 dark:bg-brand-900 dark:text-brand-100">
              <span className="size-1.5 rounded-full bg-brand-600" />
              {t("eyebrow")}
            </span>

            <h1
              id="blog-heading"
              className="mt-6 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl"
            >
              {t("heading")}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground-muted">
              {t("lead")}
            </p>
          </RevealOnScroll>

          <div className="mt-12">
            {posts.length === 0 ? <EmptyState /> : <PostGrid posts={posts} />}
          </div>
        </div>
      </section>
    </main>
  );
}

function PostGrid({ posts }: { posts: BlogPost[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
      {posts.map((post, index) => (
        <RevealOnScroll key={post.id} delayIndex={index % 3}>
          <PostCard post={post} />
        </RevealOnScroll>
      ))}
    </div>
  );
}

function PostCard({ post }: { post: BlogPost }) {
  const t = useTranslations("Blog");
  // featuredImage is either a number (unpopulated) or a Media object
  // (populated via depth: 1 in the find call). Type-guard once.
  const image =
    post.featuredImage && typeof post.featuredImage === "object"
      ? (post.featuredImage as Media)
      : null;
  const imageUrl = image?.sizes?.card?.url ?? image?.url ?? null;

  return (
    <Link
      href={`/blog/${post.slug}/`}
      // Card surface uses the neutral page bg so it pops against the
      // muted section background. Group coordinates the arrow + image
      // hover effects with the parent link.
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background transition-all duration-300 ease-out hover:-translate-y-1 hover:border-brand-400 hover:shadow-2"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-surface-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={image?.alt ?? post.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          // No featured image yet — show a flat brand-tinted block so
          // the layout doesn't break. Owner can add an image in Payload
          // and it appears on next request.
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900 dark:to-brand-800"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <time
          dateTime={post.publishedAt}
          className="text-xs font-medium uppercase tracking-wider text-foreground-muted"
        >
          {formatPublishedDate(post.publishedAt, t.raw("months") as string[])}
        </time>

        <div className="flex items-start justify-between gap-3">
          <h2 className="line-clamp-2 font-display text-xl font-semibold tracking-tight text-foreground">
            {post.title}
          </h2>
          <span
            aria-hidden="true"
            className="mt-1 inline-flex shrink-0 text-foreground-muted transition-colors group-hover:text-brand-700 dark:group-hover:text-brand-300"
          >
            <ArrowUpRight className="size-5" strokeWidth={2} />
          </span>
        </div>

        {post.excerpt ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-foreground-muted">
            {post.excerpt}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

function EmptyState() {
  const t = useTranslations("Blog");
  return (
    <div className="rounded-2xl border border-dashed border-border bg-background px-6 py-16 text-center">
      <p className="font-display text-xl font-semibold text-foreground">
        {t("emptyHeading")}
      </p>
      <p className="mt-3 text-foreground-muted">{t("emptyBody")}</p>
    </div>
  );
}

// Locale-aware date format. JS's `toLocaleDateString('bg-BG')` works
// locally but Vercel's serverless runtime ships a reduced ICU dataset
// that silently falls back to en-US formatting in production. The month
// names come from the active locale's message bundle instead.
function formatPublishedDate(iso: string, months: string[]): string {
  const d = new Date(iso);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
