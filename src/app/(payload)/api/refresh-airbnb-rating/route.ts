// Rating-only refresh endpoint backing the small refresh-arrow button
// in the admin Apartment form. Same auth + URL-shape gates as the
// full /api/fetch-airbnb route, but skips the image upload (the
// expensive step) and only returns the current rating.
//
//   { ok: true, rating: number | null }
//
// Anonymous → 401. Bad URL → 400. Network/parser failure → 502.
// Listing has no reviews yet → 200 with `rating: null` (this is a
// success: the button's UX shows "Listing has no rating yet — left
// empty" so the editor knows the empty state is intentional).

import { getPayloadInstance } from "@/lib/payload";
import { fetchAirbnbRating } from "@/lib/airbnb";

export async function POST(req: Request) {
  const payload = await getPayloadInstance();

  // See /api/fetch-airbnb for the rationale on req.headers vs next/headers.
  let user: unknown = null;
  try {
    const res = await payload.auth({ headers: req.headers });
    user = res.user;
  } catch (err) {
    console.error("[refresh-airbnb-rating] payload.auth threw:", err);
  }
  if (!user) {
    const cookieHeader = req.headers.get("cookie") ?? "";
    console.warn("[refresh-airbnb-rating] auth returned no user", {
      hasCookieHeader: cookieHeader.length > 0,
      hasPayloadToken: cookieHeader.includes("payload-token="),
      cookieLength: cookieHeader.length,
    });
    return Response.json(
      { ok: false, error: "Not authenticated." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { ok: false, error: "Body must be JSON." },
      { status: 400 },
    );
  }

  const url =
    body && typeof body === "object" && "url" in body
      ? String((body as { url: unknown }).url)
      : "";

  // Same loose subdomain match as /api/fetch-airbnb — any Airbnb
  // localized URL is fine; we control Accept-Language in the fetcher.
  if (!url || !/^https:\/\/(?:[a-z0-9-]+\.)?airbnb\.[a-z.]+\/rooms\//i.test(url)) {
    return Response.json(
      {
        ok: false,
        error:
          "Provide a public Airbnb listing URL (https://www.airbnb.com/rooms/... or https://bg.airbnb.com/rooms/...).",
      },
      { status: 400 },
    );
  }

  try {
    const rating = await fetchAirbnbRating(url);
    return Response.json({ ok: true, rating });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 502 },
    );
  }
}
