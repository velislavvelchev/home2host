// One-shot fetcher: pulls the og:image meta tag from each Airbnb listing
// and prints { id, url, imageUrl } so we can bake the URLs into the
// ApartmentsSection listings array. Re-run after adding/removing listings
// or when an owner notices a stale photo on Airbnb.
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

async function fetchOgImage(id) {
  const url = `https://www.airbnb.com/rooms/${id}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        "Accept-Language": "en-US,en;q=0.9,bg;q=0.8",
      },
    });
    if (!res.ok) return { id, error: `HTTP ${res.status}` };
    const html = await res.text();
    // Airbnb's og:image tag — content first, then property, sometimes the
    // other way around. Two passes to handle both attribute orders.
    let m =
      html.match(
        /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      ) ??
      html.match(
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      );
    if (!m) return { id, error: "og:image not found" };
    return { id, imageUrl: m[1] };
  } catch (err) {
    return { id, error: String(err) };
  }
}

const results = await Promise.all(listings.map((l) => fetchOgImage(l.id)));

console.log(JSON.stringify(results, null, 2));

const failures = results.filter((r) => r.error);
if (failures.length > 0) {
  console.error(
    `\n${failures.length} of ${results.length} failed:`,
    failures.map((f) => `${f.id}: ${f.error}`).join("\n"),
  );
  process.exit(1);
}
