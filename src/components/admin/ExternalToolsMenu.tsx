// Custom admin top-bar component — renders a row of icon links to the
// external dashboards the owner uses (Hostinger panel, Cloudflare,
// live site, Google Search Console, PageSpeed Insights, Vercel, GA4,
// GitHub, Hostinger webmail). One centralized launcher instead of
// bookmarks the owner has to remember.
//
// Convention for icon choice: lucide-react icons that conceptually
// represent the tool (Server for hosting, Cloud for Cloudflare, etc.)
// rather than brand-mark logos. Tooltip + aria-label carry the actual
// name. Keeps the icon row visually consistent. Only exception is
// GithubIcon (inlined simple-icons SVG) because lucide-react ships
// without brand marks for trademark reasons.
//
// Registered via root `admin.components.actions` in payload.config.ts.
// Per the Payload v3 config types, `actions` renders "to the top right
// of the Admin Panel" — i.e. left of the user/logout menu.
//
// No state, no hooks → server component. Native <a target="_blank">
// behavior; `title` attribute provides the tooltip + `aria-label` keeps
// it accessible.

import type { ComponentType } from "react";
import {
  BarChart3,
  Cloud,
  Gauge,
  Globe,
  Mail,
  Search,
  Server,
  Triangle,
} from "lucide-react";

// lucide-react 1.17.x ships without brand-mark icons for trademark
// reasons (Github, Facebook, Instagram, etc.) — same workaround as
// ContactsSection.tsx, which inlines simple-icons SVGs locally.
// Stroke-based markup matches the lucide visual style so the icon
// row reads as one consistent set.
function GithubIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

// The site's public URL — drives the "Live site" + PageSpeed Insights
// links in the admin top bar.
const LIVE_SITE_URL = "https://home2host.com";

type ToolLink = {
  href: string;
  label: string;
  Icon: ComponentType<{ size?: number }>;
};

const LINKS: ToolLink[] = [
  {
    // Hostinger panel — domain registrar, DNS history, mail account
    // management. Distinct destination from the webmail link further
    // down: hpanel = admin / configuration; mail.hostinger.com = inbox.
    href: "https://hpanel.hostinger.com",
    label: "Hostinger panel (domain, DNS, mail config)",
    Icon: Server,
  },
  {
    // Cloudflare dashboard — DNS records, WAF/security rules, cache
    // rules, SSL/TLS settings. See docs/cloudflare-setup.md for the
    // full configuration reference.
    href: "https://dash.cloudflare.com",
    label: "Cloudflare (DNS, security, cache)",
    Icon: Cloud,
  },
  {
    href: LIVE_SITE_URL,
    label: "Live site",
    Icon: Globe,
  },
  {
    href: "https://search.google.com/search-console/",
    label: "Google Search Console",
    Icon: Search,
  },
  {
    // Pre-fill PageSpeed Insights with the live URL so it's a one-click
    // Lighthouse run, not a two-click (open → paste URL → run).
    href: `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(LIVE_SITE_URL)}`,
    label: "PageSpeed Insights (Lighthouse)",
    Icon: Gauge,
  },
  {
    href: "https://vercel.com/dashboard",
    label: "Vercel",
    Icon: Triangle,
  },
  {
    href: "https://analytics.google.com/",
    label: "Google Analytics",
    Icon: BarChart3,
  },
  {
    href: "https://github.com/velislavvelchev/home2host",
    label: "GitHub repo",
    Icon: GithubIcon,
  },
  {
    href: "https://mail.hostinger.com",
    label: "Webmail (info@home2host.com)",
    Icon: Mail,
  },
];

export function ExternalToolsMenu() {
  return (
    <>
      {/*
        Scoped CSS for the icon row. Inline styles can't express :hover
        or :focus-visible cleanly, so a small <style> block sits next to
        the markup. Class name is namespaced to avoid leaking into
        Payload's other admin chrome.
      */}
      <style>{`
        .h2h-tools {
          display: flex;
          align-items: center;
          gap: 0.125rem;
          margin-right: 0.5rem;
        }
        .h2h-tools a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          color: var(--theme-text);
          opacity: 0.6;
          transition: opacity 150ms ease, background-color 150ms ease;
        }
        .h2h-tools a:hover,
        .h2h-tools a:focus-visible {
          opacity: 1;
          background: var(--theme-elevation-100);
          outline: none;
        }
        .h2h-tools a:focus-visible {
          box-shadow: 0 0 0 2px var(--theme-success-500);
        }
      `}</style>

      <div className="h2h-tools">
        {LINKS.map(({ href, label, Icon }) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title={label}
            aria-label={label}
          >
            {/* aria-hidden not needed: parent <a> has aria-label; SR
                announces the link by that label, ignoring icon children. */}
            <Icon size={18} />
          </a>
        ))}
      </div>
    </>
  );
}
