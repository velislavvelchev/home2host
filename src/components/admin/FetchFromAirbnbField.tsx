"use client";

// Custom admin Field component — renders a "Fetch from Airbnb" button
// in the Apartment edit form. When clicked, it reads the airbnbUrl form
// field, POSTs to /api/fetch-airbnb (which parses og:image + JSON-LD
// name and uploads the cover photo into the Media collection), then
// writes the parsed title and uploaded mediaId back into the form via
// useField. The editor reviews the populated fields and clicks Save.
//
// Graceful degradation: any failure (Airbnb bot-block, parser miss,
// network) surfaces inline as a small red message; the form remains
// fully editable. Owner can always type the title and upload the photo
// manually instead.
//
// Why this beats automatic refresh: the editor is in the loop on every
// fetch, so a silent Airbnb-page-redesign breakage can't write garbage
// to the DB. The button just stops working until we update the parser
// — and the rest of the admin keeps functioning.

import { useState } from "react";
import { useField, useFormFields } from "@payloadcms/ui";

type FetchResponse =
  | {
      ok: true;
      title: string;
      mediaId: number;
      mediaUrl: string | null;
      rating: number | null;
    }
  | { ok: false; error: string };

export function FetchFromAirbnbField() {
  // Read airbnbUrl from the form context. `useFormFields` subscribes
  // to a slice of the form state; we only re-render when the URL
  // changes (a single string selector keeps this cheap).
  const airbnbUrl = useFormFields(
    ([fields]) => (fields?.airbnbUrl?.value as string | undefined) ?? "",
  );

  // useField returns a stable setter for each target field. Title is
  // localized, so the writes apply to whichever locale tab the editor
  // currently has open — usually BG (the default), and they can switch
  // to EN and fetch again, or translate in place.
  const titleField = useField<string>({ path: "title" });
  const featuredImageField = useField<number>({ path: "featuredImage" });
  const ratingField = useField<number | null>({ path: "rating" });

  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "ok"; previewUrl: string | null }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function handleClick() {
    if (!airbnbUrl) {
      setStatus({
        kind: "error",
        message: "Enter an Airbnb listing URL first.",
      });
      return;
    }

    setStatus({ kind: "loading" });

    try {
      const res = await fetch("/api/fetch-airbnb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: airbnbUrl }),
      });
      const data = (await res.json()) as FetchResponse;

      if (!data.ok) {
        setStatus({ kind: "error", message: data.error });
        return;
      }

      titleField.setValue(data.title);
      featuredImageField.setValue(data.mediaId);
      // Rating may legitimately be null (★New listings with no reviews
      // yet); writing null clears the form field, which is the right
      // behavior — frontend will then hide the rating pill.
      ratingField.setValue(data.rating);
      setStatus({ kind: "ok", previewUrl: data.mediaUrl });
    } catch (err) {
      setStatus({
        kind: "error",
        message:
          err instanceof Error
            ? err.message
            : "Couldn't reach the fetch endpoint.",
      });
    }
  }

  const isLoading = status.kind === "loading";

  return (
    <div
      style={{
        marginBlock: "0.5rem 1rem",
        padding: "0.75rem 1rem",
        border: "1px solid var(--theme-elevation-100)",
        borderRadius: "4px",
        background: "var(--theme-elevation-50)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <button
          type="button"
          onClick={handleClick}
          disabled={isLoading || !airbnbUrl}
          style={{
            padding: "0.5rem 1rem",
            background: isLoading
              ? "var(--theme-elevation-200)"
              : "var(--theme-success-500)",
            color: "var(--theme-elevation-0)",
            border: "none",
            borderRadius: "4px",
            cursor: isLoading || !airbnbUrl ? "not-allowed" : "pointer",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          {isLoading ? "Fetching…" : "Fetch from Airbnb"}
        </button>

        <p
          style={{
            margin: 0,
            fontSize: "0.8125rem",
            color: "var(--theme-text)",
            opacity: 0.7,
          }}
        >
          Auto-fills title + cover photo from the URL above.
        </p>
      </div>

      {status.kind === "error" ? (
        <p
          style={{
            margin: "0.5rem 0 0",
            fontSize: "0.8125rem",
            color: "var(--theme-error-500)",
          }}
        >
          {status.message}
        </p>
      ) : null}

      {status.kind === "ok" ? (
        <div
          style={{
            marginTop: "0.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          {status.previewUrl ? (
            // Tiny inline preview so the editor sees what landed in
            // featuredImage before scrolling down to the upload field.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={status.previewUrl}
              alt=""
              style={{
                width: 56,
                height: 42,
                objectFit: "cover",
                borderRadius: 4,
              }}
            />
          ) : null}
          <p
            style={{
              margin: 0,
              fontSize: "0.8125rem",
              color: "var(--theme-success-500)",
            }}
          >
            Title and cover photo populated. Review the fields below and click
            Save.
          </p>
        </div>
      ) : null}
    </div>
  );
}
