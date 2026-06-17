"use server";

// "use server" modules can ONLY export async functions. Types + the initial
// useActionState state live in formState.ts to keep this file valid. See
// that file's header for the why.

import nodemailer from "nodemailer";
import { getTranslations } from "next-intl/server";
import { checkContactRateLimit } from "@/lib/rateLimit";
import type { ContactFormState } from "./formState";

// Server action invoked by the Contacts form. Validates input, checks the
// honeypot, sends an email via Hostinger SMTP to the production mailbox
// (info@home2host.com). Returns a serializable result for useActionState.
//
// Locale strategy: messages shown to the SUBMITTER (success / validation
// errors / rate-limit / generic failure) are pulled from next-intl in
// the submitter's locale. Email body / subject sent to the OWNER stays
// hardcoded BG — the owner reads every inquiry, and switching the email
// language based on which version of the site the submitter used would
// just be noise for them. Submitter-facing locale, owner-facing fixed.
//
// Why server action vs API route:
// - Tighter coupling with the form (no fetch boilerplate, FormData passed
//   in directly, free progressive enhancement — the form works without JS
//   if the client hydration is delayed).
// - One less surface area (no /api/contact endpoint to lock down).
//
// Why nodemailer + Hostinger SMTP vs a transactional email service:
// - The owner already operates info@home2host.com as their primary client-
//   inquiry inbox; routing form submissions to the same inbox means zero
//   new infrastructure to monitor and replies happen in the familiar UI.
// - See memory: infrastructure-domain-and-mailbox.md.
//
// Required env vars (set in Vercel):
//   SMTP_HOST           e.g. smtp.hostinger.com
//   SMTP_PORT           465 (SSL) or 587 (TLS)
//   SMTP_USER           info@home2host.com
//   SMTP_PASSWORD       mailbox password (from Hostinger panel)
//   CONTACT_RECIPIENT   info@home2host.com (defaults to SMTP_USER if unset)

type ValidatedFields = {
  name: string;
  email: string;
  phone: string;
  messageBody: string;
};

type ErrorTranslator = (key: string) => string;

// Manual validation — only 4 fields, not worth adding a schema dep (zod et
// al.) for this. Returns the cleaned values or a translated error string.
function validate(
  formData: FormData,
  tError: ErrorTranslator,
): ValidatedFields | string {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const messageBody = String(formData.get("message") ?? "").trim();

  if (!name) return tError("nameRequired");
  if (name.length > 200) return tError("nameTooLong");
  if (!email) return tError("emailRequired");
  if (email.length > 200) return tError("emailTooLong");
  // Pragmatic email check — RFC-strict regex is overkill for a contact form.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return tError("emailInvalid");
  if (phone.length > 50) return tError("phoneTooLong");
  if (!messageBody) return tError("messageRequired");
  if (messageBody.length > 5000) return tError("messageTooLong");

  return { name, email, phone, messageBody };
}

// Email body assembly — always BG, since the owner is the only reader.
// See module header for the rationale.
function buildEmail(fields: ValidatedFields) {
  const subject = `[Запитване от сайта] ${fields.name}`;
  const text = [
    `Ново запитване от формата на home2host.com`,
    ``,
    `Име: ${fields.name}`,
    `Имейл: ${fields.email}`,
    fields.phone ? `Телефон: ${fields.phone}` : null,
    ``,
    `Съобщение:`,
    fields.messageBody,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const html = `
    <h2 style="margin:0 0 16px;font-family:system-ui,sans-serif;">Ново запитване от формата на home2host.com</h2>
    <table style="font-family:system-ui,sans-serif;font-size:14px;border-collapse:collapse;">
      <tr><td style="padding:4px 12px 4px 0;color:#6b7484;">Име:</td><td style="padding:4px 0;">${escapeHtml(fields.name)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#6b7484;">Имейл:</td><td style="padding:4px 0;"><a href="mailto:${encodeURIComponent(fields.email)}">${escapeHtml(fields.email)}</a></td></tr>
      ${fields.phone ? `<tr><td style="padding:4px 12px 4px 0;color:#6b7484;">Телефон:</td><td style="padding:4px 0;"><a href="tel:${encodeURIComponent(fields.phone)}">${escapeHtml(fields.phone)}</a></td></tr>` : ""}
    </table>
    <h3 style="margin:24px 0 8px;font-family:system-ui,sans-serif;font-size:14px;color:#6b7484;">Съобщение</h3>
    <p style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.6;white-space:pre-wrap;margin:0;">${escapeHtml(fields.messageBody)}</p>
  `;

  return { subject, text, html };
}

// Minimal HTML escape — defence against the submitted text containing HTML.
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function submitContact(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  // Resolve the submitter-facing strings in their locale up front. Both
  // namespaces resolve from the same JSON file so this is a single load.
  const tForm = await getTranslations("ContactForm");
  const tError = (key: string) => tForm(`errors.${key}`);

  // Honeypot — hidden field that only bots fill in. We silently return
  // "success" so bots get no feedback that the form rejected them.
  // The field name must NOT be a common autofill target ("website",
  // "url", "email", "phone") or Chrome and password managers will fill
  // it for legit users, silently rejecting their submissions.
  const honeypot = String(formData.get("h2h_confirm") ?? "");
  if (honeypot.length > 0) {
    // Keep this log — it's a low-frequency abuse signal worth seeing in
    // Vercel logs if the form starts getting hammered.
    console.log("[contact-form] honeypot tripped — silently succeeding");
    return { status: "success", message: tForm("successMessage") };
  }

  // Per-IP rate limit. Runs after the honeypot (cheap, in-process) but
  // before validation and SMTP so a flood of invalid payloads still gets
  // throttled. Fails open if Upstash isn't configured — see src/lib/rateLimit.ts.
  const rateLimit = await checkContactRateLimit();
  if (!rateLimit.allowed) {
    // Same rationale as the honeypot log — abuse-frequency signal, not noise.
    console.log("[contact-form] rate limit exceeded");
    return { status: "error", message: tError("rateLimit") };
  }

  const validated = validate(formData, tError);
  if (typeof validated === "string") {
    return { status: "error", message: validated };
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT) || 465;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const recipient = process.env.CONTACT_RECIPIENT ?? smtpUser;

  if (!smtpHost || !smtpUser || !smtpPassword || !recipient) {
    console.error(
      "[contact-form] SMTP env vars missing — refusing to attempt send.",
      {
        hasHost: Boolean(smtpHost),
        hasUser: Boolean(smtpUser),
        hasPassword: Boolean(smtpPassword),
        hasRecipient: Boolean(recipient),
      },
    );
    return { status: "error", message: tError("smtpMisconfigured") };
  }

  // Wrap BOTH transporter creation and sendMail in the same try — if any
  // setup step throws (DNS lookup failures, invalid auth config, missing
  // peer deps, etc.) we surface the friendly inline error instead of
  // letting the error bubble out of the server action as an HTTP 500
  // (which would dump the user on Vercel's generic error page).
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
      // replyTo lets the owner hit "Reply" in webmail and respond directly
      // to the visitor instead of replying to the SMTP From address.
      replyTo: validated.email,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
    return { status: "success", message: tForm("successMessage") };
  } catch (error) {
    // Log the underlying error server-side for debugging in Vercel logs,
    // but don't expose details to the user — keep the message generic.
    console.error("[contact-form] sendMail failed", error);
    return { status: "error", message: tError("sendFailed") };
  }
}
