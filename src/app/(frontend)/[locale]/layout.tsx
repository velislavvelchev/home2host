import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import "../../globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FloatingCallButton } from "@/components/FloatingCallButton";
import { StructuredData } from "@/components/StructuredData";
import { CookieConsent } from "@/components/CookieConsent";
import { routing } from "@/i18n/routing";

// Subsets MUST include cyrillic — primary content language is BG and
// without it we'd fall back to a system font for half the page.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

// Runs before first paint (see the <script> in the body). Reads the same
// `theme` cookie ThemeToggle writes and adds the `dark` class to <html> if
// set, so the saved theme is applied with no flash — without the server
// having to read the cookie (which would force dynamic rendering). Kept as
// a minified IIFE string: it must be tiny and self-contained. Wrapped in
// try/catch so a blocked-cookie environment can never break the page.
const THEME_INIT_SCRIPT =
  "(function(){try{if(/(?:^|; )theme=dark(?:;|$)/.test(document.cookie)){document.documentElement.classList.add('dark')}}catch(e){}})()";

// Per-locale root metadata. Title / description / OG copy resolve from
// the `SiteMetadata` namespace; everything else (icons, metadataBase, OG
// image dimensions) is locale-independent and stays static.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SiteMetadata" });
  const title = t("title");
  const description = t("description");
  return {
    // Absolute base used to resolve relative URLs in `openGraph.images`,
    // `icons`, etc. at build time. Without this Next.js falls back to
    // `http://localhost:3000` and warns on every build.
    metadataBase: new URL("https://home2host.com"),
    title,
    description,
    // Favicons + Apple touch icon. Icon-only SVG variant is the primary
    // tab icon — the wordmark in the full lockup is unreadable at 16-32px
    // and the icon-only version stays recognizable. Self-backed (white
    // backdrop baked into the SVG) so it reads correctly against dark
    // browser tabs. PNG fallbacks for older clients and Android home-
    // screen install.
    icons: {
      icon: [
        { url: "/logo-icon.svg", type: "image/svg+xml" },
        { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      ],
      apple: "/favicon-180.png",
    },
    openGraph: {
      title,
      description: t("ogShortDescription"),
      locale: t("ogLocale"),
      type: "website",
      images: [
        {
          url: "/og-image.jpg",
          width: 1536,
          height: 1024,
          alt: t("ogImageAlt"),
        },
      ],
    },
  };
}

// Tell Next.js which `[locale]` values to prerender at build time.
// Without this, the build is dynamic-only for every page in the group.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  // `params` is async in Next 15+. Validate against the configured
  // locale list — a stray path like `/xx/about-us` would otherwise
  // reach this layout with `locale: 'xx'` and render with no messages.
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Required by next-intl when statically rendering server components
  // that call `useTranslations` / `getTranslations`. Sets the active
  // locale into the request-scoped context. Must be called in every
  // entry point (layouts AND pages) that triggers static generation
  // of translated content — pages will add their own call in slice 2.
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    // `suppressHydrationWarning`: the pre-paint script below adds the
    // `dark` class to <html> before React hydrates, so the client's
    // className differs from the server's. That's intentional and scoped
    // to this element — suppress the (otherwise correct) warning.
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/*
          Apply the saved theme before first paint — no FOUC. Reading the
          cookie server-side (the previous approach) called `cookies()`, a
          dynamic API that forced EVERY page to render per-request and defeated
          static/edge caching (ADR 0006). This tiny raw <script> runs
          synchronously as the browser parses the HTML — before paint — so the
          `dark` class is set before anything renders. Same `theme` cookie
          ThemeToggle writes, so a visitor's choice persists across loads.

          It MUST be a raw <script>, not `next/script`: `beforeInteractive` in
          the App Router does NOT inline the script — it queues it via
          `__next_s` and runs it AFTER first paint, which reintroduces the
          dark-mode flash. React 19 logs a dev-only warning about inline
          scripts in the component tree, but that warning is stripped from
          production builds and the script works correctly (it's emitted into
          the SSR HTML and the browser executes it on parse). Do not "fix" this
          back to next/script.
        */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <NextIntlClientProvider messages={messages}>
          <StructuredData />
          <Header />
          {children}
          <Footer />
          <FloatingCallButton />
          {/*
            Cookie-consent banner + GA gate. GA4 loads only after the visitor
            accepts (GDPR/ePrivacy), and only when the measurement ID is set in
            the env — dev / previews without it render nothing. All consent
            logic is client-side so it can't force dynamic rendering (ADR 0006).
          */}
          <CookieConsent />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
