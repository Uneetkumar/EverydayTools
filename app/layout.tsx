import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingToolsBackground from "@/components/FloatingToolsBackground";
import ThemeProvider from "@/components/ThemeProvider";
import FirebaseAnalytics from "@/components/FirebaseAnalytics";
import { SITE_CONFIG } from "@/lib/seo/metadata";
import {
  generateWebsiteJsonLd,
  generateOrganizationJsonLd,
} from "@/lib/seo/jsonld";
import { ADSENSE_CLIENT } from "@/lib/ads/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.domain),
  title: {
    default: "EverydayTools - Free Online Calculators & Web Tools",
    template: "%s | EverydayTools",
  },
  description:
    "Free online calculators, file converters, image compressors, PDF utilities, and developer tools. Fast, private in-browser tools with zero signups.",
  applicationName: "EverydayTools",
  authors: [{ name: "EverydayTools Team", url: SITE_CONFIG.domain }],
  creator: "EverydayTools",
  publisher: "EverydayTools",
  keywords: [
    "100% free online tools",
    "free tools for all",
    "free online calculators",
    "free image converter",
    "free pdf editor",
    "free image compressor to 50kb",
    "pdf to word converter free",
    "percentage calculator free",
    "qr code generator free",
    "password generator free",
    "age calculator",
    "gst calculator",
    "loan emi calculator",
    "json formatter online free",
    "base64 encoder free",
    "uuid generator",
    "jwt decoder free",
    "no login tools",
  ],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
  openGraph: {
    title: "EverydayTools - Fast, Free & Private Online Calculators and Utilities",
    description:
      "28 free tools: image compressor, PDF to Word, QR generator, calculators and developer utilities. Everything runs in your browser — no upload, no signup.",
    url: SITE_CONFIG.domain,
    siteName: "EverydayTools",
    locale: "en_US",
    type: "website",
    // Images come from app/opengraph-image.tsx (a real PNG). Setting them
    // here would override that convention.
  },
  twitter: {
    card: "summary_large_image",
    title: "EverydayTools - Fast, Free & Private Online Calculators and Utilities",
    description:
      "28 free browser tools: image compressor, PDF to Word, QR generator, calculators and developer utilities.",
    creator: SITE_CONFIG.twitterHandle,
  },
  alternates: {
    canonical: SITE_CONFIG.domain,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "a5hV-mzr0orDMWtjZapmRNjUCku4wH7UfUJhzymIQ9s",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Emitted as a @graph so the WebSite and Organization nodes can reference
  // each other by @id instead of repeating the publisher block on every page.
  const siteSchema = {
    "@context": "https://schema.org",
    "@graph": [generateOrganizationJsonLd(), generateWebsiteJsonLd()],
  };

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth`}
    >
      <head>
        <meta
          name="google-site-verification"
          content="a5hV-mzr0orDMWtjZapmRNjUCku4wH7UfUJhzymIQ9s"
        />

        {/* Warm up the ad origins so the first ad request is not paying for
            DNS and TLS on top of the fetch. */}
        <link
          rel="preconnect"
          href="https://pagead2.googlesyndication.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://googleads.g.doubleclick.net" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans transition-colors relative overflow-x-hidden antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          {/* Firebase Client Analytics */}
          <Suspense fallback={null}>
            <FirebaseAnalytics />
          </Suspense>

          {/* Floating Animated Background */}
          <FloatingToolsBackground />

          {/* Content Wrapper */}
          <div className="relative z-10 flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>

        {/* AdSense loads after hydration rather than in <head>. The library is
            large and third-party; blocking the head on it delays Largest
            Contentful Paint, which is a Core Web Vital and a ranking signal.
            afterInteractive still loads it well before a user scrolls to an
            ad slot. */}
        <Script
          id="adsbygoogle-init"
          strategy="afterInteractive"
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
        />
      </body>
    </html>
  );
}
