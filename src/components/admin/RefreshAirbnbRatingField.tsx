"use client";

// Small admin Field component — renders a refresh-arrow icon button
// that pulls just the current rating from the Airbnb listing URL and
// writes it into the `rating` form field. Sits below the rating
// number input.
//
// Why a separate "rating-only" button alongside the bigger
// "Fetch from Airbnb" one: rating is the most volatile field (it
// drifts every time a new review lands). The big Fetch button
// overwrites title + photo too, which the editor may have manually
// curated. This icon button is the low-cost way to bump just the
// number.

import { useState } from "react";
import { useField, useFormFields } from "@payloadcms/ui";
import { RotateCw } from "lucide-react";

type RefreshResponse =
  | { ok: true; rating: number | null }
  | { ok: false; error: string };

export function RefreshAirbnbRatingField() {
  const airbnbUrl = useFormFields(
    ([fields]) => (fields?.airbnbUrl?.value as string | undefined) ?? "",
  );

  const ratingField = useField<number | null>({ path: "rating" });

  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "ok"; rating: number | null }
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
      const res = await fetch("/api/refresh-airbnb-rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: airbnbUrl }),
      });
      const data = (await res.json()) as RefreshResponse;

      if (!data.ok) {
        setStatus({ kind: "error", message: data.error });
        return;
      }

      ratingField.setValue(data.rating);
      setStatus({ kind: "ok", rating: data.rating });
    } catch (err) {
      setStatus({
        kind: "error",
        message:
          err instanceof Error
            ? err.message
            : "Couldn't reach the refresh endpoint.",
      });
    }
  }

  const isLoading = status.kind === "loading";

  return (
    <div style={{ marginBlock: "0.25rem 1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <button
          type="button"
          onClick={handleClick}
          disabled={isLoading || !airbnbUrl}
          aria-label="Refresh rating from Airbnb"
          title="Refresh rating from Airbnb"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            background: "transparent",
            color: "var(--theme-text)",
            border: "1px solid var(--theme-elevation-150)",
            borderRadius: 4,
            cursor: isLoading || !airbnbUrl ? "not-allowed" : "pointer",
            opacity: isLoading || !airbnbUrl ? 0.5 : 1,
          }}
        >
          <RotateCw
            size={16}
            strokeWidth={2}
            style={{
              // Subtle spin while loading — matches the "I'm fetching"
              // signal of the bigger button without taking visual weight.
              animation: isLoading ? "spin 0.8s linear infinite" : "none",
            }}
            aria-hidden="true"
          />
        </button>

        <span
          style={{
            fontSize: "0.8125rem",
            color: "var(--theme-text)",
            opacity: 0.7,
          }}
        >
          Refresh rating from Airbnb
        </span>
      </div>

      {status.kind === "error" ? (
        <p
          style={{
            margin: "0.35rem 0 0 2.5rem",
            fontSize: "0.8125rem",
            color: "var(--theme-error-500)",
          }}
        >
          {status.message}
        </p>
      ) : null}

      {status.kind === "ok" ? (
        <p
          style={{
            margin: "0.35rem 0 0 2.5rem",
            fontSize: "0.8125rem",
            color: "var(--theme-success-500)",
          }}
        >
          {status.rating === null
            ? "Listing has no rating yet — left empty."
            : `Updated to ${status.rating.toFixed(2)}.`}
        </p>
      ) : null}

      {/* Spinner keyframes — scoped via @layer not available inside an
          inline <style>, so we use a plain global style block. Only one
          renders per page since the component is only on the apartments
          edit screen. */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
