// Server-only helpers for pulling a title + cover image out of an
// Airbnb listing URL. Used by:
//   - the temporary /api/seed-apartments route (one-shot migration of
//     the 10 hardcoded listings into the Payload `apartments` collection)
//   - the permanent /api/fetch-airbnb endpoint that backs the
//     "Fetch from Airbnb" button in the admin Apartment form
//
// Parsing is the same approach the original scripts/fetch-airbnb-og-images.mjs
// used: og:image (stable, social-preview tag) + JSON-LD `name` (host's
// headline, not Airbnb's auto-summary). Both fields are way more stable
// than visible HTML — Airbnb keeps them working because their own
// social previews depend on og:tags, and JSON-LD is a published
// structured-data contract. If they ever change, the button degrades
// gracefully: returns an error, owner falls back to manual entry.

import type { Payload } from "payload";

const AIRBNB_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// Match an og: meta tag's `content` attribute, handling both attribute
// orders (`property=... content=...` and `content=... property=...`).
function matchOg(html: string, name: string): string | null {
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
// cover every value we've seen in practice.
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Walk every JSON-LD block, parse the JSON inside, and feed each parsed
// item to the visitor function. Stops as soon as the visitor returns a
// non-null value. Used to extract host headline + rating in two passes
// without re-parsing the HTML or the JSON.
function walkJsonLd<T>(
  html: string,
  visit: (item: Record<string, unknown>) => T | null,
): T | null {
  const ldRegex =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = ldRegex.exec(html)) !== null) {
    try {
      const data: unknown = JSON.parse(m[1]);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item && typeof item === "object") {
          const result = visit(item as Record<string, unknown>);
          if (result !== null) return result;
        }
      }
    } catch {
      // Skip malformed blocks — others may parse.
    }
  }
  return null;
}

// Find the host's narrative title in the listing's JSON-LD blocks.
// og:title is Airbnb's auto-summary ("Жилище · Банско · ★4,57 · …"), not
// the host's headline. The host's headline appears as the `name` field
// on the VacationRental / Product JSON-LD entity.
function matchJsonLdName(html: string): string | null {
  return walkJsonLd(html, (item) => {
    const name = item.name;
    return typeof name === "string" && name.length > 0 ? name : null;
  });
}

// Pull the star rating from JSON-LD's aggregateRating block. Locale-
// independent (it's structured data, always a numeric `ratingValue`),
// so this is the canonical source. Falls back to og:title parsing in
// the caller if JSON-LD doesn't have it.
function matchJsonLdRating(html: string): number | null {
  return walkJsonLd(html, (item) => {
    const agg = item.aggregateRating;
    if (!agg || typeof agg !== "object") return null;
    const value = (agg as Record<string, unknown>).ratingValue;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      // Some implementations emit the rating as a string. Replace
      // comma decimal separator (used by BG locale builds of Airbnb's
      // pages) before parseFloat.
      const parsed = parseFloat(value.replace(",", "."));
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  });
}

// Last-resort rating extraction: og:title carries "★4,57" or "★4.57"
// in the auto-summary. Only used if JSON-LD doesn't have an
// aggregateRating block — newer listings with no reviews yet (★New)
// have no rating in either place, so this returns null and the caller
// treats that as a real "no rating".
function matchOgTitleRating(html: string): number | null {
  const ogTitle = matchOg(html, "title");
  if (!ogTitle) return null;
  const m = ogTitle.match(/★\s*(\d+[.,]?\d*)/);
  if (!m) return null;
  const parsed = parseFloat(m[1].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

// Strip the `| Home2Host` trailer the host appends to every listing.
// Our whole site IS Home2Host, so repeating it on every card is noise.
function stripBrandSuffix(title: string): string {
  return title.replace(/\s*\|\s*Home2Host\s*$/i, "").trim();
}

export type AirbnbMeta = {
  title: string;
  imageUrl: string;
  // null = the listing has no rating yet (★New on Airbnb). The card
  // hides the rating pill entirely in that case.
  rating: number | null;
};

// Internal: fetch + parse, no field-level error throwing for the
// rating (it's allowed to be null). Used by both fetchAirbnbMeta and
// fetchAirbnbRating below — saves them from duplicating the network
// + HTML pull.
async function fetchAirbnbHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": AIRBNB_UA,
      "Accept-Language": "bg-BG,bg;q=0.9,en;q=0.8",
    },
  });
  if (!res.ok) {
    throw new Error(`Airbnb returned HTTP ${res.status}`);
  }
  return res.text();
}

function parseRating(html: string): number | null {
  // JSON-LD is the canonical source (structured data, locale-
  // independent). og:title regex is a last-resort fallback.
  return matchJsonLdRating(html) ?? matchOgTitleRating(html);
}

export async function fetchAirbnbMeta(url: string): Promise<AirbnbMeta> {
  const html = await fetchAirbnbHtml(url);
  const imageUrl = matchOg(html, "image");
  const rawTitle = matchJsonLdName(html);

  // Both missing → almost certainly a 404/410/gone page. Airbnb tends
  // to return HTTP 200 with an error-page HTML for removed listings,
  // so the missing-both check is the cleanest signal of "this URL is
  // not a real listing right now." Only one missing → genuine
  // structure change in Airbnb's HTML; flag that distinctly so we
  // know to update the parser rather than blame the editor's URL.
  if (!imageUrl && !rawTitle) {
    throw new Error(
      "Listing not found or no longer available. Check the URL by opening it on Airbnb in a browser.",
    );
  }
  if (!imageUrl) {
    throw new Error(
      "Couldn't find og:image on this URL. Airbnb may have changed their page structure — try uploading the photo manually.",
    );
  }
  if (!rawTitle) {
    throw new Error(
      "Couldn't find the listing title. Airbnb may have changed their page structure — try entering the title manually.",
    );
  }

  return {
    title: stripBrandSuffix(decodeEntities(rawTitle)),
    imageUrl,
    rating: parseRating(html),
  };
}

// Rating-only variant used by the small refresh-icon button in the
// admin. Doesn't validate or return title/image, so a listing whose
// title parser broke (e.g. structural change in Airbnb's HTML) can
// still get its rating refreshed.
export async function fetchAirbnbRating(url: string): Promise<number | null> {
  const html = await fetchAirbnbHtml(url);
  return parseRating(html);
}

// Download an image (typically an Airbnb a0.muscache.com URL) and
// upload it into the Payload `media` collection. Returns the new Media
// doc id so the caller can attach it as `featuredImage`.
//
// Filename is derived from the URL path so re-uploading the same image
// (rare) doesn't crash the Blob adapter's collision rules — Payload
// appends a suffix when needed.
export async function uploadImageToMedia(
  payload: Payload,
  imageUrl: string,
  alt: string,
): Promise<number> {
  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error(`Image fetch returned HTTP ${res.status}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const mimetype = res.headers.get("content-type") ?? "image/jpeg";

  // Derive a filename from the URL path. Airbnb's CDN paths look like
  // /im/pictures/hosting/Hosting-<id>/original/<uuid>.jpeg?im_w=720
  // — we want the last `.jpeg` segment, falling back to a generic name.
  const urlPath = new URL(imageUrl).pathname;
  const lastSegment = urlPath.split("/").filter(Boolean).pop() ?? "image.jpg";
  const filename = lastSegment.includes(".") ? lastSegment : `${lastSegment}.jpg`;

  const created = await payload.create({
    collection: "media",
    data: { alt },
    file: {
      data: buffer,
      mimetype,
      name: filename,
      size: buffer.length,
    },
  });

  return created.id;
}
