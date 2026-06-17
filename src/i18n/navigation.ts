import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware drop-in replacements for next/link + next/navigation.
// Use these for INTERNAL site links (anything routed by next-intl).
// Wrapping with the routing config means a `<Link href="/contacts/">`
// rendered on /en/about-us/ resolves to /en/contacts/, not /contacts/
// (which would silently kick the visitor back to BG).
//
// Keep using `next/link` for EXTERNAL hrefs (airbnb.com, facebook.com,
// google maps links, etc.) — those don't go through our middleware.
// `href="#anchor"` in-page hash links also stay on `next/link`.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
