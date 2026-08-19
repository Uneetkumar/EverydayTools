import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingToolsBackground from "@/components/FloatingToolsBackground";
import ThemeProvider from "@/components/ThemeProvider";
import FirebaseAnalytics from "@/components/FirebaseAnalytics";
import PwaManager from "@/components/PwaManager";
import { SITE_CONFIG } from "@/lib/seo/metadata";
import {
  generateWebsiteJsonLd,
  generateOrganizationJsonLd,
} from "@/lib/seo/jsonld";
import { getAllTools } from "@/lib/tools/registry";

// Derived so the marketing copy cannot drift from the registry.
const TOOL_COUNT = getAllTools().length;

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
    default: "TabBench - Free Online Calculators & Web Tools",
    template: "%s | TabBench",
  },
  description:
    "Free online calculators, file converters, image compressors, PDF utilities, and developer tools. Fast, private in-browser tools with zero signups.",
  applicationName: "TabBench",
  authors: [{ name: "TabBench Team", url: SITE_CONFIG.domain }],
  creator: "TabBench",
  publisher: "TabBench",
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
    title: "TabBench - Fast, Free & Private Online Calculators and Utilities",
    description:
      `${TOOL_COUNT} free tools: image compressor, PDF to Word, QR generator, calculators and developer utilities. Everything runs in your browser — no upload, no signup.`,
    url: SITE_CONFIG.domain,
    siteName: "TabBench",
    locale: "en_US",
    type: "website",
    // Images come from app/opengraph-image.tsx (a real PNG). Setting them
    // here would override that convention.
  },
  twitter: {
    card: "summary_large_image",
    title: "TabBench - Fast, Free & Private Online Calculators and Utilities",
    description:
      `${TOOL_COUNT} free browser tools: image compressor, PDF to Word, QR generator, calculators and developer utilities.`,
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
  // Add the verification token issued for the tabbench.com Search Console
  // property here. The previous token belonged to everydaytools-s.web.app and
  // will not validate on the new domain.
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
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="rating" content="general" />
        <meta name="distribution" content="global" />
        <meta name="revisit-after" content="2 days" />

        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TabBench" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="manifest" href="/manifest.webmanifest" />

        {/* Warm up the ad origins so the first ad request is not paying for
            DNS and TLS on top of the fetch. */}
        <link
          rel="preconnect"
          href="https://pagead2.googlesyndication.com"
          crossOrigin="anonymous"
        />
        {/* Google AdSense Script */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5552044975820319"
          crossOrigin="anonymous"
        />

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

          {/* PWA Service Worker & Install Prompts */}
          <PwaManager />

          {/* Floating Animated Background */}
          <FloatingToolsBackground />

          {/* Content Wrapper */}
          <div className="relative z-10 flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
