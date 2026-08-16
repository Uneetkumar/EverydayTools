import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingToolsBackground from "@/components/FloatingToolsBackground";
import ThemeProvider from "@/components/ThemeProvider";
import FirebaseAnalytics from "@/components/FirebaseAnalytics";
import { SITE_CONFIG } from "@/lib/seo/metadata";
import { generateWebsiteJsonLd } from "@/lib/seo/jsonld";

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
    default: "EverydayTools - Fast, Free & Private Online Calculators and Utilities",
    template: "%s | EverydayTools",
  },
  description:
    "Free, fast, and privacy-focused online calculators, file converters, image compressors, PDF utilities, and developer tools. Run calculations instantly in your browser with zero latency.",
  applicationName: "EverydayTools",
  authors: [{ name: "EverydayTools Team", url: SITE_CONFIG.domain }],
  creator: "EverydayTools",
  publisher: "EverydayTools",
  keywords: [
    "free online tools",
    "online calculators",
    "image compressor to 50kb",
    "pdf to word converter",
    "percentage calculator",
    "qr code generator",
    "password generator",
    "age calculator",
    "gst calculator",
    "loan emi calculator",
    "json formatter",
    "base64 encoder",
    "uuid generator",
    "jwt decoder",
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
    description: "22+ Essential Tools: Image Compressor, PDF to Word, QR Generator, Math & Developer Tools. 100% Client-Side Private.",
    url: SITE_CONFIG.domain,
    siteName: "EverydayTools",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: `${SITE_CONFIG.domain}/og-image.svg`,
        width: 1200,
        height: 630,
        alt: "EverydayTools - Fast, Free & Private Online Utilities",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EverydayTools - Fast, Free & Private Online Calculators and Utilities",
    description: "22+ Essential Tools: Image Compressor, PDF to Word, QR Generator, Math & Developer Tools.",
    creator: SITE_CONFIG.twitterHandle,
    images: [`${SITE_CONFIG.domain}/og-image.svg`],
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const websiteSchema = generateWebsiteJsonLd();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth`}
    >
      <head>
        {/* Google AdSense Script */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5552044975820319"
          crossOrigin="anonymous"
        />

        {/* Structured Data (Schema.org) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
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
      </body>
    </html>
  );
}
