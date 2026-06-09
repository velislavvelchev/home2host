import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

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

export const metadata: Metadata = {
  title: "Home2Host — Управление на имоти в Банско и Бургас",
  description:
    "Професионално управление на имоти за краткосрочен наем в Банско и Бургас. Обяви, комуникация с гости, почистване и поддръжка.",
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
    title: "Home2Host — Управление на имоти в Банско и Бургас",
    description:
      "Професионално управление на имоти за краткосрочен наем в Банско и Бургас.",
    locale: "bg_BG",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1536,
        height: 1024,
        alt: "Home2Host — управление на имоти в Банско и Бургас",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bg"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
