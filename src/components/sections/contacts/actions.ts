"use server";

import nodemailer from "nodemailer";

// Server action invoked by the Contacts form. Validates input, checks the
// honeypot, sends an email via Hostinger SMTP to the production mailbox
// (info@home2host.com). Returns a serializable result for useActionState.
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

export type ContactFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const initialContactFormState: ContactFormState = { status: "idle" };

type ValidatedFields = {
  name: string;
  email: string;
  phone: string;
  messageBody: string;
};

// Manual validation — only 4 fields, not worth adding a schema dep (zod et
// al.) for this. Returns the cleaned values or a user-facing error string.
function validate(formData: FormData): ValidatedFields | string {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const messageBody = String(formData.get("message") ?? "").trim();

  if (!name) return "Моля, въведете вашето име.";
  if (name.length > 200) return "Името е твърде дълго.";
  if (!email) return "Моля, въведете вашия имейл адрес.";
  if (email.length > 200) return "Имейлът е твърде дълъг.";
  // Pragmatic email check — RFC-strict regex is overkill for a contact form.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return "Моля, въведете валиден имейл адрес.";
  if (phone.length > 50) return "Телефонният номер е твърде дълъг.";
  if (!messageBody) return "Моля, опишете накратко вашето запитване.";
  if (messageBody.length > 5000) return "Съобщението е твърде дълго.";

  return { name, email, phone, messageBody };
}

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
  // Honeypot — hidden field that only bots fill in. We silently return
  // "success" so bots get no feedback that the form rejected them.
  const honeypot = String(formData.get("website") ?? "");
  if (honeypot.length > 0) {
    return { status: "success", message: "Благодарим! Ще се свържем с вас скоро." };
  }

  const validated = validate(formData);
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
    );
    return {
      status: "error",
      message:
        "Формата не е напълно конфигурирана. Моля, свържете се с нас по телефон или имейл.",
    };
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
    return {
      status: "success",
      message: "Благодарим! Ще се свържем с вас скоро.",
    };
  } catch (error) {
    // Log the underlying error server-side for debugging in Vercel logs,
    // but don't expose details to the user — keep the message generic.
    console.error("[contact-form] sendMail failed", error);
    return {
      status: "error",
      message:
        "Възникна грешка при изпращането. Моля, опитайте отново или ни пишете на info@home2host.com.",
    };
  }
}
