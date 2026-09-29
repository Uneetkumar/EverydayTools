import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SearchProvider } from "@/components/search/search-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import ThemeProvider from "@/components/ThemeProvider";
import FirebaseAnalytics from "@/components/FirebaseAnalytics";
import PwaManager from "@/components/PwaManager";
import { SEO_CONFIG } from "@/lib/seo/config";
import { generateSiteGraph } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/json-ld";
import { getAllTools } from "@/lib/tools/registry";
import { CANONICAL_HOST_SCRIPT } from "@/lib/seo/canonical-host";

// Derived so the marketing copy cannot drift from the registry.
const TOOL_COUNT = getAllTools().length;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SEO_CONFIG.origin),
  title: {
    default: "TabBench – Free Online Calculators, PDF & Image Tools",
    template: "%s | TabBench",
  },
  description: SEO_CONFIG.description,
  applicationName: SEO_CONFIG.siteName,
  authors: [{ name: SEO_CONFIG.siteName, url: SEO_CONFIG.origin }],
  creator: SEO_CONFIG.siteName,
  publisher: SEO_CONFIG.siteName,
  // No site-wide `alternates.canonical` on purpose. It used to point at the
  // homepage, so any page that forgot its own canonical would silently tell
  // Google it was a duplicate of the homepage. Every indexable page now sets
  // its own (lib/seo/metadata.ts); scripts/seo-check.mjs fails the build if
  // one is missing.
  //
  // No `icons` either: app/favicon.ico, app/icon.svg and app/apple-icon.tsx
  // (a real PNG — iOS ignores SVG touch icons) are picked up by convention.
  // No `keywords`: Google ignores the tag.
  openGraph: {
    title: "TabBench – Fast, Free & Private Online Calculators and Utilities",
    description: `${TOOL_COUNT} free tools: image compressor, PDF to Word, QR generator, calculators and developer utilities. Everything runs in your browser — no upload, no signup.`,
    url: SEO_CONFIG.origin,
    siteName: SEO_CONFIG.siteName,
    locale: SEO_CONFIG.locale,
    type: "website",
    // Images come from app/opengraph-image.tsx (a real PNG).
  },
  twitter: {
    card: "summary_large_image",
    title: "TabBench – Fast, Free & Private Online Calculators and Utilities",
    description: `${TOOL_COUNT} free browser tools: image compressor, PDF to Word, QR generator, calculators and developer utilities.`,
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
  appleWebApp: {
    capable: true,
    title: SEO_CONFIG.siteName,
    statusBarStyle: "default",
  },
  // Search Console: verify tabbench.com as a Domain property (DNS TXT record),
  // which needs nothing here. If you use the HTML-tag method instead, add
  // `verification: { google: "<token>" }`. The old token belonged to
  // everydaytools-s.web.app and will not validate on the new domain.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <head>
        {/* charset, viewport, theme-color, manifest and icons are emitted by
            Next from `metadata`/`viewport` and the app/ icon files. They were
            also hand-written here, so every page shipped two charsets, two
            viewports, two manifests and an SVG apple-touch-icon iOS ignores.
            `appleWebApp` also emits mobile-web-app-capable. */}
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossOrigin="anonymous" />

        {/* reCAPTCHA Enterprise is no longer loaded here. It was a
            synchronous, render-blocking script on every page for a check only
            the contact form runs; lib/recaptcha.ts now loads it on demand, and
            Firebase App Check injects it itself for the cloud AI path. */}

        {/* Google AdSense. The loader inserts its own <script> into <head>
            before React hydrates, so <head> deliberately holds no inline
            scripts for that insertion to displace (they live at the top of
            <body>). A raw tag rather than next/script so it is in the static
            HTML, where AdSense's site verification looks for it. */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5552044975820319"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        {/* Firebase always serves the project's *.web.app hostname and it
            cannot be switched off, so the whole site is reachable on two
            domains — BOTH *.web.app and *.firebaseapp.com, neither of which
            can be switched off. Canonicals already point at tabbench.com, but
            a duplicate answering 200 with "index, follow" splits crawl budget
            and invites Google to pick the wrong host.

            A plain inline <script>, deliberately NOT next/script: with
            `strategy="beforeInteractive"` Next serialises this into its
            `self.__next_s` queue, so it only runs once the framework bundle
            has loaded. A raw inline tag in <head> executes immediately and
            does not depend on any JS chunk arriving. For a redirect that
            should fire before anything renders, that difference matters.

            See lib/seo/canonical-host.ts for why the hostname test is a
            suffix match and why it cannot fire on production.

            It sits at the very top of <body> rather than in <head>: the
            AdSense loader inserts a <script> before the first script in
            <head> ahead of hydration, which shifted these inline scripts and
            produced a hydration mismatch. As the first thing in <body> it
            still runs before any content is parsed or painted, and
            document.head (where it writes the robots meta) is complete. */}
        <script
          id="canonical-host"
          dangerouslySetInnerHTML={{
            __html: CANONICAL_HOST_SCRIPT,
          }}
        />

        <JsonLd data={generateSiteGraph()} />

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={300}>
            <SearchProvider>
              {/* Firebase Client Analytics */}
              <Suspense fallback={null}>
                <FirebaseAnalytics />
              </Suspense>

              {/* PWA Service Worker & Install Prompts */}
              <PwaManager />

              <a
                href="#main"
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow-raised"
              >
                Skip to content
              </a>

              <div className="flex min-h-screen flex-col">
                <Header />
                <main id="main" className="flex-1">
                  {children}
                </main>
                <SiteFooter />
              </div>
              <Toaster position="bottom-center" />
            </SearchProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
