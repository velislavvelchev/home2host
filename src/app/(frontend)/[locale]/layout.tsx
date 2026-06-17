import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import "../../globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FloatingCallButton } from "@/components/FloatingCallButton";
import { StructuredData } from "@/components/StructuredData";
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
    // `http://localhost:3000` and warns on every build. Update to the
    // real custom domain at Stage 6 (DNS switch).
    metadataBase: new URL("https://home2host.vercel.app"),
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

  // Read the theme preference from the cookie (set by ThemeToggle).
  // We render <html class="dark"> directly in the initial SSR output
  // when the cookie says so — no client-side script needed, no FOUC,
  // no React 19 / Next.js dev warning about inline <script> tags. The
  // cookie travels with every request (~10 bytes), which is cheaper
  // than the localStorage + inline-script alternative.
  //
  // Default: no cookie → light (the brand-default for everyone).
  const themeCookie = (await cookies()).get("theme")?.value;
  const isDark = themeCookie === "dark";

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased${isDark ? " dark" : ""}`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <NextIntlClientProvider messages={messages}>
          <StructuredData />
          <Header />
          {children}
          <Footer />
          <FloatingCallButton />
          {/*
            GA4 only renders when the measurement ID is set in the env. Local
            dev (no `.env.local` value) and Vercel previews without the var
            configured render nothing — keeps test pageviews out of the
            production analytics property.
          */}
          {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ? (
            <GoogleAnalytics
              gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}
            />
          ) : null}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
