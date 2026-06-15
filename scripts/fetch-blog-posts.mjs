// One-shot fetcher: pulls each live blog post's title, publish date,
// featured-image URL, excerpt, and body HTML from home2host.com so we
// have the migration source material in one place.
//
// For every post writes two files under docs/inventory/raw/blog-posts/:
//
//   <slug>.md   — frontmatter only (title, slug, publish date,
//                 featured-image URL, excerpt, original URL). Body is
//                 NOT inlined here because pasting body content into a
//                 Lexical editor is best done from a rendered browser
//                 selection, which the .html file below provides.
//
//   <slug>.html — minimal HTML wrapper around the article body. Open
//                 this file in a browser, ⌘/Ctrl+A → copy → paste into
//                 the Payload admin Lexical editor. Browsers put both
//                 text/plain and text/html on the clipboard so Lexical
//                 preserves paragraphs, headings, lists, and links.
//
// Run: node scripts/fetch-blog-posts.mjs
//
// Idempotent — re-running overwrites the destination files. Safe to run
// after the partner updates a live post and we need to refresh source.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../docs/inventory/raw/blog-posts");

// URLs from docs/inventory/text/blog.md. Slug for each post is the
// last non-empty path segment of its URL — extracted at fetch time so
// we don't duplicate state.
//
// Post #1 ends in `-copy/` and is a likely WordPress draft duplicate
// (flagged in the inventory). Kept here so we fetch + flag it; the
// human verifies before importing into Payload.
const POST_URLS = [
  "https://home2host.com/%d1%80%d0%b5%d0%b3%d0%bb%d0%b0%d0%bc%d0%b5%d0%bd%d1%82-%d0%b5%d1%81-2024-1028-%d0%ba%d0%b0%d0%ba%d0%b2%d0%be-%d1%82%d1%80%d1%8f%d0%b1%d0%b2%d0%b0-%d0%b4%d0%b0-%d0%b7%d0%bd%d0%b0%d0%b5%d0%bc-copy/",
  "https://home2host.com/property-management-company-how-to-choose/",
  "https://home2host.com/bookings-and-guests/",
  "https://home2host.com/key-advice-for-design-and-decoration/",
  "https://home2host.com/bansko-perfect-for-rental-apartments/",
  "https://home2host.com/benefits-short-term-rental-management/",
];

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function slugFromUrl(url) {
  const u = new URL(url);
  const segments = u.pathname.split("/").filter(Boolean);
  return decodeURIComponent(segments[segments.length - 1]);
}

// Match a meta tag's `content` value, handling both attribute orders.
function matchMeta(html, attr, value) {
  const a = html.match(
    new RegExp(
      `<meta[^>]+${attr}=["']${value}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
  );
  if (a) return a[1];
  const b = html.match(
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${value}["']`,
      "i",
    ),
  );
  return b ? b[1] : null;
}

// Pull the article body from an Elementor/WordPress page. The live
// site renders post content inside a `data-elementor-type="single-post"`
// container; everything inside it is the body. Fallback to <article>
// then to the whole <body> if either is missing.
function extractBody(html) {
  const elementor = html.match(
    /<div[^>]+data-elementor-type=["']single-post["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/footer>/i,
  );
  if (elementor) return elementor[1];

  const article = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (article) return article[1];

  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return body ? body[1] : html;
}

// Strip <script>/<style>/<noscript> and common Elementor share/related
// widgets so the copy-paste source is just the article prose. Best
// effort — anything left over is fine to delete in the Payload editor.
function cleanBody(html) {
  // Try to narrow to just the post's prose. The Astra theme wraps the
  // article body in `<div class="entry-content ...">`; everything inside
  // is the real content. If that's not found, we fall back to the wider
  // body and apply best-effort cleanup.
  const entry = html.match(
    /<div[^>]+class=["'][^"']*\bentry-content\b[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*(?:<footer|<div[^>]+class=["'][^"']*\b(?:entry-meta|post-navigation|comments-area)\b)/i,
  );
  let inner = entry ? entry[1] : html;

  return inner
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    // Drop the duplicate header block (theme renders title + featured
    // image inside the body too) — featured image goes in a separate
    // Payload field, not the body.
    .replace(/<header[^>]*class=["'][^"']*\bentry-header\b[^>]*>[\s\S]*?<\/header>/gi, "")
    // Standalone "post-thumb" image divs outside the header.
    .replace(/<div[^>]+class=["'][^"']*\bpost-thumb[^"']*["'][\s\S]*?<\/div>/gi, "")
    // Elementor's share/related/comments/nav widgets.
    .replace(
      /<section[^>]+data-element_type=["']section["'][^>]*data-widget_type=["'][^"']*(?:share|related|comments|nav)[^"']*["'][\s\S]*?<\/section>/gi,
      "",
    )
    .trim();
}

function parseDate(html) {
  // article:published_time is the most reliable on Elementor sites.
  const og = matchMeta(html, "property", "article:published_time");
  if (og) return og.split("T")[0];
  // Fallback: <time datetime="...">
  const t = html.match(/<time[^>]+datetime=["']([^"']+)["']/i);
  return t ? t[1].split("T")[0] : null;
}

function htmlEntityDecode(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function buildHtmlWrapper({ title, bodyHtml }) {
  // Self-contained doc so the user can just double-click the file to
  // open it. Typography tuned to be readable but neutral — when copied
  // to the clipboard, the structure (h2/p/ul/a) is what matters; the
  // CSS doesn't survive paste anyway.
  return `<!doctype html>
<html lang="bg">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  body { max-width: 720px; margin: 2rem auto; padding: 0 1rem;
         font: 16px/1.6 -apple-system, "Segoe UI", system-ui, sans-serif;
         color: #1a1a1a; }
  h1, h2, h3 { line-height: 1.25; }
  a { color: #1e3878; }
  img { max-width: 100%; height: auto; }
  blockquote { border-left: 3px solid #4866b3; padding-left: 1em; color: #555; }
  pre, code { font-family: ui-monospace, monospace; }
  .meta { color: #888; font-size: 0.875rem; margin-bottom: 2rem; }
</style>
</head>
<body>
<p class="meta">⚠ Source extraction for Payload import — select all (Ctrl+A) → copy → paste into the Lexical editor.</p>
<h1>${title}</h1>
${bodyHtml}
</body>
</html>`;
}

function buildMarkdown(meta) {
  const fields = [
    `# ${meta.title}`,
    "",
    `- **Slug**: \`${meta.slug}\``,
    `- **Original URL**: ${meta.originalUrl}`,
    `- **Published**: ${meta.publishedAt ?? "(unknown)"}`,
    `- **Featured image**: ${meta.featuredImageUrl ?? "(none found)"}`,
    "",
    "## Excerpt",
    "",
    meta.excerpt ?? "(none extracted)",
    "",
    "## Body",
    "",
    `Open \`${meta.slug}.html\` in a browser, select all, copy, paste into Payload's Lexical editor.`,
    "",
  ];
  if (meta.notes && meta.notes.length > 0) {
    fields.push("## Notes", "");
    for (const n of meta.notes) fields.push(`- ${n}`);
    fields.push("");
  }
  return fields.join("\n");
}

async function fetchOne(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const html = await res.text();

  const slug = slugFromUrl(url);
  const ogTitle = matchMeta(html, "property", "og:title");
  const ogDesc = matchMeta(html, "property", "og:description");
  const ogImage = matchMeta(html, "property", "og:image");
  const publishedAt = parseDate(html);

  const title = ogTitle
    ? htmlEntityDecode(ogTitle).replace(/\s*[-—|]\s*Home2Host.*$/, "").trim()
    : slug;

  const bodyRaw = extractBody(html);
  const bodyClean = cleanBody(bodyRaw);

  const notes = [];
  if (slug.endsWith("-copy")) {
    notes.push(
      "Slug ends in `-copy`, likely a WordPress draft duplicate. Verify the live URL is actually indexed before importing.",
    );
  }
  if (!publishedAt) notes.push("No publish date found in meta tags.");
  if (!ogImage) notes.push("No og:image — featured image will need to be sourced manually.");

  return {
    slug,
    originalUrl: url,
    title,
    excerpt: ogDesc ? htmlEntityDecode(ogDesc) : null,
    publishedAt,
    featuredImageUrl: ogImage,
    bodyHtml: bodyClean,
    notes,
  };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const summary = [];
  for (const url of POST_URLS) {
    process.stdout.write(`Fetching ${url} … `);
    try {
      const post = await fetchOne(url);
      const mdPath = path.join(OUT_DIR, `${post.slug}.md`);
      const htmlPath = path.join(OUT_DIR, `${post.slug}.html`);
      await writeFile(mdPath, buildMarkdown(post), "utf8");
      await writeFile(
        htmlPath,
        buildHtmlWrapper({ title: post.title, bodyHtml: post.bodyHtml }),
        "utf8",
      );
      console.log(`ok → ${post.slug}`);
      summary.push({
        slug: post.slug,
        title: post.title,
        publishedAt: post.publishedAt,
        bodyChars: post.bodyHtml.length,
        notes: post.notes,
      });
    } catch (err) {
      console.log(`FAILED — ${err.message}`);
    }
  }

  console.log("\nSummary:");
  console.table(
    summary.map((s) => ({
      slug: s.slug.length > 50 ? s.slug.slice(0, 47) + "…" : s.slug,
      published: s.publishedAt ?? "—",
      bytes: s.bodyChars,
      notes: s.notes.length,
    })),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
