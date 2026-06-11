"use client";

import { useActionState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { buttonStyles } from "@/components/Button";
import { submitContact } from "./actions";
import {
  initialContactFormState,
  type ContactFormState,
} from "./formState";

// Client form component — server action handles delivery, this just
// manages the input UI, the pending state, and the inline status message.
// Uses React 19's useActionState so the form is uncontrolled and works
// with progressive enhancement (no JS = native HTML form post).
//
// Honeypot field: hidden offscreen (NOT `display:none` since some bots
// skip those), aria-hidden, tabIndex=-1, autoComplete="off". Bots that
// blindly fill every input get caught; humans never see or focus it.

const inputClass =
  "block w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-foreground placeholder:text-foreground-muted/70 transition-colors focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30 disabled:cursor-not-allowed disabled:opacity-60";

const labelClass =
  "mb-1.5 block text-sm font-medium text-foreground";

export function ContactForm() {
  const [state, formAction, isPending] = useActionState<
    ContactFormState,
    FormData
  >(submitContact, initialContactFormState);
  const formRef = useRef<HTMLFormElement>(null);

  // Reset the form fields after a successful submit so the user can send
  // another message without manually clearing. The status message itself
  // stays visible.
  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} noValidate className="space-y-5">
      {/* Honeypot — offscreen, accessible-hidden. Real users won't see or
          tab to this; bots that blindly fill every input get caught by
          the server action's honeypot check. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
      >
        <label htmlFor="contact-website">
          Не попълвайте това поле — то е за защита от спам.
        </label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div>
        <label htmlFor="contact-name" className={labelClass}>
          Име <span className="text-error">*</span>
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          autoComplete="name"
          maxLength={200}
          disabled={isPending}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="contact-email" className={labelClass}>
          Имейл <span className="text-error">*</span>
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          maxLength={200}
          disabled={isPending}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="contact-phone" className={labelClass}>
          Телефон <span className="text-foreground-muted">(по желание)</span>
        </label>
        <input
          id="contact-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          maxLength={50}
          disabled={isPending}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="contact-message" className={labelClass}>
          Съобщение <span className="text-error">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          maxLength={5000}
          disabled={isPending}
          placeholder="Опишете накратко вашето запитване..."
          className={`${inputClass} resize-y`}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={`${buttonStyles("primary", "lg")} w-full`}
      >
        <Send className="size-4" strokeWidth={2} aria-hidden="true" />
        {isPending ? "Изпращане..." : "Изпрати запитване"}
      </button>

      {/* Live-region status message — announced to screen readers when it
          changes. Visible to everyone but only renders when there's a
          status to show (state.status !== "idle"). */}
      {state.status !== "idle" && state.message ? (
        <p
          role="status"
          aria-live="polite"
          className={`rounded-md px-4 py-3 text-sm ${
            state.status === "success"
              ? "bg-success/10 text-success"
              : "bg-error/10 text-error"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
