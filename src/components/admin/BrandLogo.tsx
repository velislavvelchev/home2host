// Replaces Payload's stock logo on the admin login screen.
//
// Uses the same plate-free knockout mark as BrandIcon, just larger —
// owner wanted the login screen to feel like Payload's default in
// terms of minimalism (a single small mark, no chrome) while still
// being the Home2Host icon. The wordmark lockup (logo.svg) is too
// busy at this scale; the icon alone reads cleaner.
//
// Server component. 80px is what Payload's own login mark renders
// at — matching the slot keeps the form vertical rhythm intact.

export function BrandLogo() {
  return (
    <img
      src="/logo-icon-knockout.svg"
      alt="Home2Host"
      width={80}
      height={80}
      style={{ display: "block" }}
    />
  );
}
