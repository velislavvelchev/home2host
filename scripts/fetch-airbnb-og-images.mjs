// One-shot fetcher: pulls og:image + og:title from each Airbnb listing
// and prints { id, imageUrl, title } so we can bake them into the
// ApartmentsSection listings array. Re-run after adding/removing
// listings, when an owner notices a stale photo, or when a host
// changes a listing's title on Airbnb.
//
// Run: node scripts/fetch-airbnb-og-images.mjs

const listings = [
  { id: "1318738434906867843" },
  { id: "671609314902059816" },
  { id: "1571758069076515492" },
  { id: "1607996732020225042" },
  { id: "1607988986183197333" },
  { id: "1582571602551689852" },
  { id: "1536078655698153217" },
  { id: "1544251596416809511" },
  { id: "1550747815707309469" },
  { id: "1614457751120708395" },
];

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// Match an og: meta tag's `content` attribute, handling both attribute
// orders (`property=... content=...` and `content=... property=...`).
function matchOg(html, name) {
  const a = html.match(
    new RegExp(
      `<meta[^>]+property=["']og:${name}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
  );
  if (a) return a[1];
  const b = html.match(
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${name}["']`,
      "i",
    ),
  );
  return b ? b[1] : null;
}

// Decode the few HTML entities Airbnb's og: meta tags typically emit.
// We avoid pulling a full HTML-entities lib for this — these three
// cover every value in our 10 listings as of 2026-06-11.
function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Find the host's narrative title in the listing's JSON-LD blocks. The
// og:title is Airbnb's auto-summary ("Жилище · Банско · ★4,57 · …"),
// not the host's headline. The host's headline appears as the `name`
// field on the VacationRental / Product JSON-LD entity.
function matchJsonLdName(html) {
  const ldRegex =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = ldRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(m[1]);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (typeof item.name === "string" && item.name.length > 0) {
          return item.name;
        }
      }
    } catch {
      // Skip malformed blocks — others may parse.
    }
  }
  return null;
}

// Strip the `| Home2Host` trailer the host appends to every listing
// (sometimes with leading/trailing whitespace around the pipe). Our
// whole site IS Home2Host, so repeating it on every card is noise.
function stripBrandSuffix(title) {
  return title.replace(/\s*\|\s*Home2Host\s*$/i, "").trim();
}

async function fetchListingMeta(id) {
  const url = `https://www.airbnb.com/rooms/${id}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        "Accept-Language": "bg-BG,bg;q=0.9,en;q=0.8",
      },
    });
    if (!res.ok) return { id, error: `HTTP ${res.status}` };
    const html = await res.text();
    const imageUrl = matchOg(html, "image");
    const rawTitle = matchJsonLdName(html);
    if (!imageUrl) return { id, error: "og:image not found" };
    if (!rawTitle) return { id, error: "JSON-LD name not found" };
    return {
      id,
      imageUrl,
      title: stripBrandSuffix(decodeEntities(rawTitle)),
    };
  } catch (err) {
    return { id, error: String(err) };
  }
}

const results = await Promise.all(listings.map((l) => fetchListingMeta(l.id)));

console.log(JSON.stringify(results, null, 2));

const failures = results.filter((r) => r.error);
if (failures.length > 0) {
  console.error(
    `\n${failures.length} of ${results.length} failed:`,
    failures.map((f) => `${f.id}: ${f.error}`).join("\n"),
  );
  process.exit(1);
}
