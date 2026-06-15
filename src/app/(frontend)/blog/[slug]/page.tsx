import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { RichText } from "@payloadcms/richtext-lexical/react";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import { getPayloadInstance } from "@/lib/payload";
import type { BlogPost, Media } from "@/payload-types";

type Params = { slug: string };

// Same hardcoded month table as the index page — Vercel's serverless
// runtime ships a reduced ICU dataset so `bg-BG` locale formatting
// silently falls back. Two callers, kept duplicated for now; extract
// when a third use lands.
const BG_MONTHS = [
  "януари", "февруари", "март", "април", "май", "юни",
  "юли", "август", "септември", "октомври", "ноември", "декември",
];

function formatPublishedDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${BG_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

async function findPostBySlug(slug: string): Promise<BlogPost | null> {
  const payload = await getPayloadInstance();
  const { docs } = await payload.find({
    collection: "blog-posts",
    where: {
      slug: { equals: slug },
      _status: { equals: "published" },
    },
    limit: 1,
    locale: "bg",
    depth: 1,
  });
  return (docs[0] as BlogPost | undefined) ?? null;
}

// Pre-render every published post at build time. Posts published later
// fall back to on-demand rendering thanks to the default dynamicParams
// (true) — no extra config needed.
export async function generateStaticParams(): Promise<Params[]> {
  const payload = await getPayloadInstance();
  const { docs } = await payload.find({
    collection: "blog-posts",
    where: { _status: { equals: "published" } },
    limit: 100,
    locale: "bg",
    depth: 0,
  });
  return docs.map((d) => ({ slug: (d as BlogPost).slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
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
  const { slug } = await params;
  const post = await findPostBySlug(slug);
  if (!post) notFound();

  const image =
    post.featuredImage && typeof post.featuredImage === "object"
      ? (post.featuredImage as Media)
      : null;
  const heroUrl = image?.sizes?.hero?.url ?? image?.url ?? null;

  return (
    <main className="flex-1">
      <article className="bg-background">
        <div className="mx-auto max-w-3xl px-gutter py-section">
          {/* Back to the blog index — small breadcrumb-style link rather
              than a full breadcrumb component (one hop, no nesting). */}
          <Link
            href="/blog/"
            className="inline-flex items-center gap-1 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-4" strokeWidth={2} aria-hidden="true" />
            Всички статии
          </Link>

          <header className="mt-8">
            <time
              dateTime={post.publishedAt}
              className="text-xs font-medium uppercase tracking-wider text-foreground-muted"
            >
              {formatPublishedDate(post.publishedAt)}
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
                {post.author ? <span>От {post.author}</span> : null}
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
                sizes="(max-width: 768px) 100vw, 768px"
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
