// Replaces Payload's stock wordmark in the admin sidebar top-left.
//
// Uses the plate-free knockout variant (logo-icon-knockout.svg) — just
// the white house+key silhouette, no dark blue background plate. Reads
// as a clean mark against the navy admin chrome, matching the visual
// weight of Payload's own stock hex mark instead of looking like a
// stickered chip.
//
// Server component, no client state. Inlined width/height as
// attributes (not via CSS) so the SVG paints at the right size
// before any stylesheet loads — avoids a flash of oversized logo
// on slow connections.

export function BrandIcon() {
  return (
    <img
      src="/logo-icon-knockout.svg"
      alt="Home2Host"
      width={32}
      height={32}
      style={{ display: "block" }}
    />
  );
}
