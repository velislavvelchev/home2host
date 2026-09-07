// Backs the direct-booking form on /booking/ (the page that gives guests
// 10% off). Validates input, checks the honeypot + per-IP rate limit, and
// emails the request to the production mailbox (info@home2host.com).
//
// Why an API route and NOT a Server Action (unlike the contact form):
// a Server Action's ID is baked into each build. When a new deployment
// ships while a visitor still holds an older page, their POST carries a
// stale action ID the new deployment can't resolve — the action body
// never runs and the submission is silently dropped (no email sent). A
// booking form is a conversion surface where a lost submission is a lost
// sale, so it posts to a STABLE URL that every deployment can serve. See
// memory: forms-use-fetch-not-server-actions.
//
// Security parity a Server Action gives for free, replicated here:
//  - Origin/Host check (CSRF): reject cross-origin POSTs.
//  - Honeypot (h2h_confirm): silently succeed for bots.
//  - Per-IP rate limit (Upstash sliding window, shared limiter lib).
//  - Method guard: only POST is exported → other verbs 405 automatically.
//  - Server-side validation of every field.
//
// Locale strategy mirrors the contact form: messages shown to the
// SUBMITTER resolve via next-intl in their locale (sent in the body);
// the email to the OWNER is always Bulgarian, with the dropdown keys
// mapped to BG labels so the owner reads one consistent inbox regardless
// of which language the visitor used.

import nodemailer from "nodemailer";
import { getTranslations } from "next-intl/server";
import { checkBookingRateLimit } from "@/lib/rateLimit";
import { routing } from "@/i18n/routing";

// ── BG label maps for the owner-facing email ────────────────────────
// The form submits stable keys; the owner reads Bulgarian. Unknown keys
// fall back to the raw value (defensive — schema/DB drift shouldn't blank
// a field in the email).
const CITY_LABELS_BG: Record<string, string> = {
  bansko: "Банско",
  burgas: "Бургас",
  razlog: "Разлог",
  chernomorets: "Черноморец",
  "slanchev-bryag": "Слънчев бряг",
};

const TYPE_LABELS_BG: Record<string, string> = {
  studio: "Студио",
  "one-bedroom": "Двустаен апартамент",
  "two-bedroom": "Тристаен апартамент",
  "three-bedroom-plus": "Четиристаен и по-голям",
};

const PER_LABELS_BG: Record<string, string> = {
  night: "на вечер",
  stay: "за престой",
  month: "на месец",
};

type ErrorTranslator = (key: string) => string;

type ValidatedFields = {
  name: string;
  email: string;
  phone: string;
  location: string;
  checkIn: string;
  checkOut: string;
  adults: string;
  children: string;
  budget: string;
  budgetPer: string;
  propertyType: string;
  note: string;
};

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

// Manual validation — a handful of fields, not worth a schema dependency.
// Returns the cleaned values or a translated error string.
function validate(
  body: Record<string, unknown>,
  tError: ErrorTranslator,
): ValidatedFields | string {
  const name = str(body.name);
  const email = str(body.email);
  const phone = str(body.phone);
  const location = str(body.location);
  const checkIn = str(body.checkIn);
  const checkOut = str(body.checkOut);
  const adults = str(body.adults);
  const children = str(body.children);
  const budget = str(body.budget);
  const budgetPer = str(body.budgetPer);
  const propertyType = str(body.propertyType);
  const note = str(body.note);

  if (!name) return tError("nameRequired");
  if (name.length > 200) return tError("nameTooLong");
  if (!email) return tError("emailRequired");
  if (email.length > 200) return tError("emailTooLong");
  // Pragmatic email check — RFC-strict regex is overkill for a lead form.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return tError("emailInvalid");
  if (!phone) return tError("phoneRequired");
  if (phone.length > 50) return tError("phoneTooLong");
  if (!checkIn) return tError("checkInRequired");
  if (!checkOut) return tError("checkOutRequired");
  // Dates arrive as yyyy-mm-dd from <input type="date">. Reject a
  // check-out that isn't strictly after check-in — a common fat-finger
  // that would otherwise reach the owner as a nonsensical request.
  const inDate = Date.parse(checkIn);
  const outDate = Date.parse(checkOut);
  if (Number.isNaN(inDate) || Number.isNaN(outDate)) {
    return tError("datesInvalid");
  }
  if (outDate <= inDate) return tError("checkOutBeforeIn");
  if (note.length > 5000) return tError("noteTooLong");

  return {
    name,
    email,
    phone,
    location,
    checkIn,
    checkOut,
    adults,
    children,
    budget,
    budgetPer,
    propertyType,
    note,
  };
}

// Minimal HTML escape for the HTML email body.
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Email body assembly — always Bulgarian (owner is the only reader).
function buildEmail(f: ValidatedFields) {
  const subject = `[Резервация -10%] ${f.name}`;

  const cityLabel = f.location
    ? CITY_LABELS_BG[f.location] ?? f.location
    : "";
  const typeLabel = f.propertyType
    ? TYPE_LABELS_BG[f.propertyType] ?? f.propertyType
    : "";
  const perLabel = f.budgetPer ? PER_LABELS_BG[f.budgetPer] ?? f.budgetPer : "";
  const budgetLine =
    f.budget && perLabel
      ? `${f.budget} EUR (${perLabel})`
      : f.budget
        ? `${f.budget} EUR`
        : "";
  const guests = [
    f.adults ? `${f.adults} възрастни` : "",
    f.children ? `${f.children} деца` : "",
  ]
    .filter(Boolean)
    .join(", ");

  // [label, value] rows — falsy values are dropped so the email only
  // shows fields the visitor actually filled.
  const rows: [string, string][] = [
    ["Име", f.name],
    ["Имейл", f.email],
    ["Телефон", f.phone],
    ["Локация", cityLabel],
    ["Настаняване", f.checkIn],
    ["Напускане", f.checkOut],
    ["Гости", guests],
    ["Бюджет", budgetLine],
    ["Тип имот", typeLabel],
  ].filter(([, value]) => value !== "") as [string, string][];

  const text = [
    "Ново запитване за резервация с 10% отстъпка (от формата на /booking/).",
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    ...(f.note ? ["", "Забележка:", f.note] : []),
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,sans-serif;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#122C69;text-transform:uppercase;letter-spacing:0.04em;">Резервация с 10% отстъпка</p>
      <h2 style="margin:0 0 16px;font-size:18px;">Ново запитване от /booking/</h2>
      <table style="font-size:14px;border-collapse:collapse;">
        ${rows
          .map(
            ([label, value]) =>
              `<tr><td style="padding:4px 12px 4px 0;color:#6b7484;vertical-align:top;">${escapeHtml(label)}:</td><td style="padding:4px 0;">${escapeHtml(value)}</td></tr>`,
          )
          .join("")}
      </table>
      ${
        f.note
          ? `<h3 style="margin:24px 0 8px;font-size:14px;color:#6b7484;">Забележка</h3><p style="font-size:14px;line-height:1.6;white-space:pre-wrap;margin:0;">${escapeHtml(f.note)}</p>`
          : ""
      }
    </div>
  `;

  return { subject, text, html };
}

// Same-origin guard. Server Actions get CSRF protection automatically; an
// API route must check it explicitly. If an Origin header is present it
// must match the Host the request came in on; a mismatch is a cross-site
// POST → reject. Missing Origin (rare for a fetch POST) fails open rather
// than blocking a legitimate submission.
function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const host = req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  // Resolve the visitor's locale from the body (client sends it) so the
  // messages we return are in their language. Validate against the
  // configured locales; fall back to the default.
  let body: Record<string, unknown>;
  try {
    const parsed = await req.json();
    body =
      parsed && typeof parsed === "object"
        ? (parsed as Record<string, unknown>)
        : {};
  } catch {
    body = {};
  }

  const rawLocale = str(body.locale);
  const locale = (routing.locales as readonly string[]).includes(rawLocale)
    ? rawLocale
    : routing.defaultLocale;

  const t = await getTranslations({ locale, namespace: "Booking" });
  const tError = (key: string) => t(`errors.${key}`);

  // Cross-origin POSTs are rejected before any work. Return the generic
  // error message rather than leaking that it was an origin failure.
  if (!isSameOrigin(req)) {
    return Response.json(
      { ok: false, message: tError("generic") },
      { status: 403 },
    );
  }

  // Honeypot — hidden field only bots fill. Silently succeed so they get
  // no signal the form rejected them.
  if (str(body.h2h_confirm).length > 0) {
    console.log("[booking-form] honeypot tripped — silently succeeding");
    return Response.json({ ok: true, message: t("successMessage") });
  }

  // Per-IP rate limit. Runs before validation + SMTP so a flood of
  // invalid payloads still gets throttled. Fails open if Upstash is unset.
  const rateLimit = await checkBookingRateLimit();
  if (!rateLimit.allowed) {
    console.log("[booking-form] rate limit exceeded");
    return Response.json(
      { ok: false, message: tError("rateLimit") },
      { status: 429 },
    );
  }

  const validated = validate(body, tError);
  if (typeof validated === "string") {
    return Response.json({ ok: false, message: validated }, { status: 400 });
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT) || 465;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const recipient = process.env.CONTACT_RECIPIENT ?? smtpUser;

  if (!smtpHost || !smtpUser || !smtpPassword || !recipient) {
    console.error(
      "[booking-form] SMTP env vars missing — refusing to attempt send.",
      {
        hasHost: Boolean(smtpHost),
        hasUser: Boolean(smtpUser),
        hasPassword: Boolean(smtpPassword),
        hasRecipient: Boolean(recipient),
      },
    );
    return Response.json(
      { ok: false, message: tError("smtpMisconfigured") },
      { status: 500 },
    );
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPassword },
    });
    const email = buildEmail(validated);
    await transporter.sendMail({
      from: `Home2Host сайт <${smtpUser}>`,
      to: recipient,
      // Reply lands directly in the visitor's inbox from webmail.
      replyTo: validated.email,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
    return Response.json({ ok: true, message: t("successMessage") });
  } catch (error) {
    console.error("[booking-form] sendMail failed", error);
    return Response.json(
      { ok: false, message: tError("sendFailed") },
      { status: 502 },
    );
  }
}
