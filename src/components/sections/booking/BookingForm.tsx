"use client";

import { useRef, useState } from "react";
import { Send } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { buttonStyles } from "@/components/Button";

// Client booking form. Posts JSON to the stable /api/booking endpoint via
// fetch (NOT a Server Action — see the route file's header for why). The
// server returns { ok, message } with the message already localized to the
// visitor's locale, which we render in the inline status region.
//
// Dropdown translation: the option VALUES are stable keys (studio, night,
// bansko, …); the visible text comes from the `Booking` messages namespace
// (locations from the server, resolved against `Apartments.cities`). So the
// same form renders BG on /booking/ and EN on /en/booking/ with no code
// branching, and the email to the owner maps the keys back to BG labels.
//
// Honeypot: same offscreen `h2h_confirm` field + password-manager opt-out
// attributes as the contact form. Bots that fill every input get caught
// server-side; real users never see or focus it.

type LocationOption = { value: string; label: string };

type Props = {
  locations: LocationOption[];
};

type Status = { state: "idle" | "success" | "error"; message?: string };

const PROPERTY_TYPES = [
  "studio",
  "one-bedroom",
  "two-bedroom",
  "three-bedroom-plus",
] as const;

const BUDGET_PERIODS = ["night", "stay", "month"] as const;

const inputClass =
  "block w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-foreground placeholder:text-foreground-muted/70 transition-colors focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30 disabled:cursor-not-allowed disabled:opacity-60";

const labelClass = "mb-1.5 block text-sm font-medium text-foreground";

// Hide the up/down spinner on number inputs (Chrome/Safari/Edge via the
// webkit spin-button pseudo-elements, Firefox via -moz appearance:textfield).
const noSpinner =
  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0";

export function BookingForm({ locations }: Props) {
  const t = useTranslations("Booking");
  const locale = useLocale();
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setPending(true);
    setStatus({ state: "idle" });

    const payload = Object.fromEntries(new FormData(form).entries());
    payload.locale = locale;

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (res.ok && data.ok) {
        setStatus({ state: "success", message: data.message });
        form.reset();
      } else {
        setStatus({
          state: "error",
          message: data.message ?? t("errors.generic"),
        });
      }
    } catch {
      // Network / parse failure — surface the generic message.
      setStatus({ state: "error", message: t("errors.generic") });
    } finally {
      setPending(false);
    }
  }

  const req = <span className="text-error">*</span>;
  const optional = (
    <span className="text-foreground-muted">{t("optional")}</span>
  );

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Honeypot — offscreen, accessible-hidden. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
      >
        <label htmlFor="booking-h2h-confirm">{t("honeypotLabel")}</label>
        <input
          id="booking-h2h-confirm"
          name="h2h_confirm"
          type="text"
          tabIndex={-1}
          autoComplete="new-password"
          data-lpignore="true"
          data-1p-ignore="true"
          data-form-type="other"
        />
      </div>

      {/* Name + Email */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="booking-name" className={labelClass}>
            {t("nameLabel")} {req}
          </label>
          <input
            id="booking-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            maxLength={200}
            disabled={pending}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="booking-email" className={labelClass}>
            {t("emailLabel")} {req}
          </label>
          <input
            id="booking-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            maxLength={200}
            disabled={pending}
            className={inputClass}
          />
        </div>
      </div>

      {/* Phone + Location */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="booking-phone" className={labelClass}>
            {t("phoneLabel")} {req}
          </label>
          <input
            id="booking-phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            maxLength={50}
            disabled={pending}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="booking-location" className={labelClass}>
            {t("locationLabel")} {optional}
          </label>
          <select
            id="booking-location"
            name="location"
            defaultValue=""
            disabled={pending || locations.length === 0}
            className={inputClass}
          >
            <option value="">{t("locationPlaceholder")}</option>
            {locations.map((loc) => (
              <option key={loc.value} value={loc.value}>
                {loc.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Check-in + Check-out */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="booking-checkin" className={labelClass}>
            {t("checkInLabel")} {req}
          </label>
          <input
            id="booking-checkin"
            name="checkIn"
            type="date"
            required
            disabled={pending}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="booking-checkout" className={labelClass}>
            {t("checkOutLabel")} {req}
          </label>
          <input
            id="booking-checkout"
            name="checkOut"
            type="date"
            required
            disabled={pending}
            className={inputClass}
          />
        </div>
      </div>

      {/* Adults + Children */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="booking-adults" className={labelClass}>
            {t("adultsLabel")} {optional}
          </label>
          <input
            id="booking-adults"
            name="adults"
            type="number"
            min={0}
            max={99}
            inputMode="numeric"
            disabled={pending}
            className={`${inputClass} ${noSpinner}`}
          />
        </div>
        <div>
          <label htmlFor="booking-children" className={labelClass}>
            {t("childrenLabel")} {optional}
          </label>
          <input
            id="booking-children"
            name="children"
            type="number"
            min={0}
            max={99}
            inputMode="numeric"
            disabled={pending}
            className={`${inputClass} ${noSpinner}`}
          />
        </div>
      </div>

      {/* Budget amount + unit + period */}
      <div>
        <label htmlFor="booking-budget" className={labelClass}>
          {t("budgetLabel")} {optional}
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative sm:flex-1">
            <input
              id="booking-budget"
              name="budget"
              type="number"
              min={0}
              inputMode="numeric"
              disabled={pending}
              className={`${inputClass} pr-14 ${noSpinner}`}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-medium text-foreground-muted">
              EUR
            </span>
          </div>
          <select
            aria-label={t("budgetPerLabel")}
            name="budgetPer"
            defaultValue=""
            disabled={pending}
            className={`${inputClass} sm:w-44`}
          >
            <option value="">{t("budgetPerPlaceholder")}</option>
            {BUDGET_PERIODS.map((key) => (
              <option key={key} value={key}>
                {t(`budgetPer.${key}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Property type */}
      <div>
        <label htmlFor="booking-type" className={labelClass}>
          {t("propertyTypeLabel")} {optional}
        </label>
        <select
          id="booking-type"
          name="propertyType"
          defaultValue=""
          disabled={pending}
          className={inputClass}
        >
          <option value="">{t("propertyTypePlaceholder")}</option>
          {PROPERTY_TYPES.map((key) => (
            <option key={key} value={key}>
              {t(`type.${key}`)}
            </option>
          ))}
        </select>
      </div>

      {/* Note */}
      <div>
        <label htmlFor="booking-note" className={labelClass}>
          {t("noteLabel")} {optional}
        </label>
        <textarea
          id="booking-note"
          name="note"
          rows={4}
          maxLength={5000}
          disabled={pending}
          placeholder={t("notePlaceholder")}
          className={`${inputClass} resize-y`}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className={`${buttonStyles("primary", "lg")} w-full`}
      >
        <Send className="size-4" strokeWidth={2} aria-hidden="true" />
        {pending ? t("submitting") : t("submit")}
      </button>

      {status.state !== "idle" && status.message ? (
        <p
          role="status"
          aria-live="polite"
          className={`rounded-md px-4 py-3 text-sm ${
            status.state === "success"
              ? "bg-success/10 text-success"
              : "bg-error/10 text-error"
          }`}
        >
          {status.message}
        </p>
      ) : null}
    </form>
  );
}
