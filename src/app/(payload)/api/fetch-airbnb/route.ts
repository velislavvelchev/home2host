// Backs the "Fetch from Airbnb" button in the admin Apartment form.
// Takes a public Airbnb listing URL, pulls the host's headline +
// cover photo + current rating, uploads the photo to Payload Media,
// and returns the pieces the admin component needs to populate the
// form fields:
//
//   { ok: true, title, mediaId, mediaUrl, rating }
//
// Auth: the route is only intended to be hit from the admin UI; gated
// via `payload.auth({ headers })` so only signed-in admins can trigger
// outbound fetches + media uploads. Anonymous POSTs get a 401 — the
// (payload) route group's [...slug] catch-all already protects the
// other Payload endpoints similarly.
//
// Graceful degradation: any failure (Airbnb bot-block, HTML structure
// change, dead image URL) returns 4xx with a human-readable message
// the admin component surfaces inline. Owner can always fall back to
// filling the fields manually.

import { headers as nextHeaders } from "next/headers";
import { getPayloadInstance } from "@/lib/payload";
import { fetchAirbnbMeta, uploadImageToMedia } from "@/lib/airbnb";

export async function POST(req: Request) {
  const payload = await getPayloadInstance();

  // Reject anonymous requests — this endpoint downloads remote content
  // and writes to media storage, both of which we only want signed-in
  // admins to trigger.
  const headersList = await nextHeaders();
  const { user } = await payload.auth({ headers: headersList });
  if (!user) {
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

  // Accept any Airbnb subdomain — `www.airbnb.com`, `bg.airbnb.com`,
  // `www.airbnb.co.uk`, etc. The language/region in the subdomain only
  // affects what Airbnb's page renders client-side; we send our own
  // Accept-Language header in the fetcher so the parsed content is
  // locale-consistent regardless. The saved airbnbUrl on the doc keeps
  // whichever form the editor pasted — visitors who click through land
  // on the localized Airbnb listing.
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
    const meta = await fetchAirbnbMeta(url);
    const mediaId = await uploadImageToMedia(payload, meta.imageUrl, meta.title);

    // Re-fetch the media doc so we can return its public Blob URL —
    // the admin component shows a small preview after a successful fetch.
    const mediaDoc = await payload.findByID({
      collection: "media",
      id: mediaId,
      depth: 0,
    });

    return Response.json({
      ok: true,
      title: meta.title,
      mediaId,
      mediaUrl: mediaDoc.url ?? null,
      rating: meta.rating,
    });
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
