// Shared state types + initial value for the contact form's useActionState.
// Lives in its own file because `actions.ts` is a `"use server"` module and
// in Next.js, "use server" modules can ONLY export async functions. Mixing
// in `export const` and `export type` causes Server Action registration to
// fail at runtime, surfacing as a generic HTTP 500 (Vercel's "This page
// couldn't load" page).

export type ContactFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const initialContactFormState: ContactFormState = { status: "idle" };
