// One-shot SEO audit: fetches each public marketing/blog URL on the
// Vercel preview deploy, extracts <title> + meta description + OG
// title + OG description, prints a structured report, and flags any
// values that look weaker than Google's typical SERP guidelines or
// weaker than what the live WordPress site has (per
// docs/seo-live-site-snapshot.md).
//
// Run: node scripts/audit-seo.mjs
//
// Output is human-readable; the agent that runs this reads it back
// and writes the actual analysis.

const BASE = "https://home2host.vercel.app";

const PAGES = [
  // Marketing — BG
  { url: "/", label: "Landing page" },
  { url: "/about-us/", label: "About" },
  { url: "/services/", label: "Services" },
  { url: "/prices/", label: "Pricing" },
  { url: "/questions/", label: "FAQ listing" },
  { url: "/contacts/", label: "Contacts" },
  { url: "/apartments/", label: "Apartments listing" },
  { url: "/blog/", label: "Blog listing" },
  // Marketing — EN
  { url: "/en/", label: "Landing page (EN)" },
  { url: "/en/about-us/", label: "About (EN)" },
  { url: "/en/services/", label: "Services (EN)" },
  { url: "/en/prices/", label: "Pricing (EN)" },
  { url: "/en/questions/", label: "FAQ listing (EN)" },
  { url: "/en/contacts/", label: "Contacts (EN)" },
  { url: "/en/apartments/", label: "Apartments listing (EN)" },
  { url: "/en/blog/", label: "Blog listing (EN)" },
  // Blog posts — BG
  { url: "/blog/eu-regulation-2024-1028-what-to-know/", label: "Post: EU regulation" },
  { url: "/blog/property-management-company-how-to-choose/", label: "Post: how to choose mgmt" },
  { url: "/blog/bookings-and-guests/", label: "Post: bookings + guests" },
  { url: "/blog/key-advice-for-design-and-decoration/", label: "Post: design + decoration" },
  { url: "/blog/bansko-perfect-for-rental-apartments/", label: "Post: Bansko for rental" },
  { url: "/blog/benefits-short-term-rental-management/", label: "Post: benefits of mgmt" },
  // Blog posts — EN
  { url: "/en/blog/eu-regulation-2024-1028-what-to-know/", label: "Post: EU regulation (EN)" },
  { url: "/en/blog/property-management-company-how-to-choose/", label: "Post: how to choose mgmt (EN)" },
  { url: "/en/blog/bookings-and-guests/", label: "Post: bookings + guests (EN)" },
  { url: "/en/blog/key-advice-for-design-and-decoration/", label: "Post: design + decoration (EN)" },
  { url: "/en/blog/bansko-perfect-for-rental-apartments/", label: "Post: Bansko for rental (EN)" },
  { url: "/en/blog/benefits-short-term-rental-management/", label: "Post: benefits of mgmt (EN)" },
];

function decodeEntities(s) {
  return s
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&#x2F;", "/")
    .replaceAll("&#39;", "'");
}

function extract(html, regex) {
  const m = html.match(regex);
  return m ? decodeEntities(m[1].trim()) : "";
}

function flags(title, description) {
  const out = [];
  if (!title) out.push("MISSING TITLE");
  else {
    if (title.length > 60) out.push(`title ${title.length}c (>60 → SERP truncates)`);
    if (title.length < 30) out.push(`title ${title.length}c (<30 — short)`);
  }
  if (!description) out.push("MISSING DESCRIPTION");
  else {
    if (description.length > 160) out.push(`desc ${description.length}c (>160 → SERP truncates)`);
    if (description.length < 80) out.push(`desc ${description.length}c (<80 — short)`);
  }
  return out;
}

async function audit() {
  const results = [];
  for (const page of PAGES) {
    try {
      const res = await fetch(BASE + page.url, {
        headers: { "User-Agent": "home2host-seo-audit/1.0" },
      });
      if (!res.ok) {
        results.push({ ...page, error: `HTTP ${res.status}` });
        continue;
      }
      const html = await res.text();
      const title = extract(html, /<title[^>]*>([^<]+)<\/title>/i);
      const description = extract(
        html,
        /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
      );
      const ogTitle = extract(
        html,
        /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      );
      const ogDescription = extract(
        html,
        /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
      );
      results.push({
        ...page,
        title,
        description,
        ogTitle,
        ogDescription,
        flags: flags(title, description),
      });
    } catch (err) {
      results.push({ ...page, error: String(err) });
    }
  }
  return results;
}

const results = await audit();

for (const r of results) {
  console.log("─".repeat(80));
  console.log(`${r.label}  —  ${r.url}`);
  if (r.error) {
    console.log(`  ERROR: ${r.error}`);
    continue;
  }
  console.log(`  title  (${r.title.length}c): ${r.title}`);
  console.log(`  desc   (${r.description.length}c): ${r.description}`);
  if (r.ogTitle && r.ogTitle !== r.title) {
    console.log(`  ogT    (${r.ogTitle.length}c): ${r.ogTitle}`);
  }
  if (r.ogDescription && r.ogDescription !== r.description) {
    console.log(`  ogD    (${r.ogDescription.length}c): ${r.ogDescription}`);
  }
  if (r.flags.length) {
    console.log(`  ⚠  ${r.flags.join(" | ")}`);
  }
}

console.log("─".repeat(80));
console.log(`\nDone. ${results.length} pages audited.`);

// Duplicate-description check across BG marketing pages — the live WP
// site shared the same description across home + About, which the
// snapshot calls out as a regression to avoid.
const bgMarketing = results.filter(
  (r) =>
    r.description &&
    !r.url.startsWith("/en/") &&
    !r.url.startsWith("/blog/") &&
    r.url !== "/blog/",
);
const seen = new Map();
for (const r of bgMarketing) {
  const key = r.description.slice(0, 100);
  if (seen.has(key)) {
    console.log(
      `⚠ DUPLICATE description between ${seen.get(key)} and ${r.url} (first 100c match)`,
    );
  } else {
    seen.set(key, r.url);
  }
}
