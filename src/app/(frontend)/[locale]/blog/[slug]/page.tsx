import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { RichText } from "@payloadcms/richtext-lexical/react";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPayloadInstance } from "@/lib/payload";
import { routing } from "@/i18n/routing";
import type { BlogPost, Media } from "@/payload-types";

type Params = { locale: string; slug: string };

async function findPostBySlug(slug: string): Promise<BlogPost | null> {
  const payload = await getPayloadInstance();
  // `draft: false` (the default) is sufficient to filter out drafts —
  // Payload's versioned-collection find already excludes documents whose
  // latest saved state is a draft. An explicit `_status: { equals:
  // "published" }` filter on top of that is redundant AND was producing
  // 0-match results when combined with a non-ASCII slug value (the
  // Cyrillic Регламент post). Dropping the redundant filter avoids the
  // collision and is closer to the idiomatic Payload pattern.
  const { docs } = await payload.find({
    collection: "blog-posts",
    where: { slug: { equals: slug } },
    limit: 1,
    locale: "bg",
    depth: 1,
  });
  return (docs[0] as BlogPost | undefined) ?? null;
}

// Pre-render every published post at build time, once per locale (BG
// is the default — same slugs since blog slugs are non-localized).
// Posts published later fall back to on-demand rendering thanks to the
// default dynamicParams (true).
export async function generateStaticParams(): Promise<Params[]> {
  const payload = await getPayloadInstance();
  // No `_status` filter — see findPostBySlug for the reason. With
  // `versions: { drafts: true }` on the collection, Payload's default
  // find already excludes draft-only documents.
  const { docs } = await payload.find({
    collection: "blog-posts",
    limit: 100,
    locale: "bg",
    depth: 0,
  });
  return routing.locales.flatMap((locale) =>
    docs.map((d) => ({ locale, slug: (d as BlogPost).slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  // Locale-aware blog field loading lands in slice 3 — for now the post
  // is fetched in BG regardless of URL locale (matches the rest of the
  // marketing content in slice 2).
  const post = await findPostBySlug(slug);
  if (!post) return {};

  const image =
    post.featuredImage && typeof post.featuredImage === "object"
      ? (post.featuredImage as Media)
      : null;
  const ogImageUrl = image?.sizes?.hero?.url ?? image?.url ?? null;

  return {
    title: `${post.title} | Home2Host`,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: "article",
      publishedTime: post.publishedAt,
      ...(ogImageUrl
        ? {
            images: [
              {
                url: ogImageUrl,
                alt: image?.alt ?? post.title,
              },
            ],
          }
        : {}),
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const post = await findPostBySlug(slug);
  if (!post) notFound();

  // Pulling translations on the server (async) instead of via a
  // useTranslations sub-component — `setRequestLocale` has already run
  // above so the bundle resolves to the right locale either way; the
  // async call keeps everything in one render function.
  const t = await getTranslations("Blog");
  const months = t.raw("months") as string[];

  const image =
    post.featuredImage && typeof post.featuredImage === "object"
      ? (post.featuredImage as Media)
      : null;
  const heroUrl = image?.sizes?.hero?.url ?? image?.url ?? null;

  return (
    <main className="flex-1">
      <article className="bg-background">
        {/* `max-w-4xl` (896px) gives the post detail more breathing
            room than the original `max-w-3xl` (768px) on wide screens
            without sacrificing readability — ~85-95 chars per line at
            text-lg, still inside the comfortable 65-95 reading band. */}
        <div className="mx-auto max-w-4xl px-gutter py-section">
          {/* Back to the blog index — small breadcrumb-style link rather
              than a full breadcrumb component (one hop, no nesting). */}
          <Link
            href="/blog/"
            className="inline-flex items-center gap-1 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-4" strokeWidth={2} aria-hidden="true" />
            {t("back")}
          </Link>

          <header className="mt-8">
            <time
              dateTime={post.publishedAt}
              className="text-xs font-medium uppercase tracking-wider text-foreground-muted"
            >
              {formatPublishedDate(post.publishedAt, months)}
            </time>

            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
              {post.title}
            </h1>

            {post.excerpt ? (
              <p className="mt-6 text-lg leading-relaxed text-foreground-muted">
                {post.excerpt}
              </p>
            ) : null}

            {(post.author || (post.tags && post.tags.length > 0)) && (
              <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-foreground-muted">
                {post.author ? (
                  <span>{t("byAuthor", { author: post.author })}</span>
                ) : null}
                {post.tags && post.tags.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <li
                        key={tag.id ?? tag.label}
                        className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs"
                      >
                        {tag.label}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )}
          </header>

          {heroUrl ? (
            <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-2xl bg-surface-muted">
              <Image
                src={heroUrl}
                alt={image?.alt ?? post.title}
                fill
                sizes="(max-width: 896px) 100vw, 896px"
                priority
                className="object-cover"
              />
            </div>
          ) : null}

          {/* `prose` utilities aren't loaded — typography on the rendered
              Lexical tree is owned by the design tokens via element
              selectors below. Refine if a real article looks off. */}
          <div className="blog-prose mt-12">
            <RichText
              data={post.body as unknown as SerializedEditorState}
              disableContainer
            />
          </div>
        </div>
      </article>
    </main>
  );
}

// Locale-aware date format. JS's `toLocaleDateString('bg-BG')` works
// locally but Vercel's serverless runtime ships a reduced ICU dataset
// that silently falls back to en-US formatting in production. Month
// names come from the active locale's message bundle instead.
function formatPublishedDate(iso: string, months: string[]): string {
  const d = new Date(iso);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
