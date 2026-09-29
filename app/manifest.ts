import { MetadataRoute } from "next";
import { SEO_CONFIG } from "@/lib/seo/config";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SEO_CONFIG.siteName} - Free Online Calculators & Web Tools`,
    short_name: SEO_CONFIG.siteName,
    description: SEO_CONFIG.description,
    start_url: "/",
    id: "/",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    background_color: "#0f172a",
    theme_color: "#2563eb",
    orientation: "any",
    categories: ["utilities", "productivity", "developer"],
    icons: [
      // PNGs first: Android's install prompt and some launchers ignore SVG.
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
