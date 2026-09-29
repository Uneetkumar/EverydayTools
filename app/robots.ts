import { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/config";

export const dynamic = "force-static";

/**
 * Everything is crawlable, on purpose.
 *
 * - No Disallow for /_next/, fonts, images or the WASM under /vendor, /pdfjs,
 *   /tesseract: Google renders pages with them, and blocking rendering
 *   resources is a classic way to break indexing.
 * - The previous `Disallow: /api/` is gone: this is a static export with no
 *   /api (the video service runs on its own host), so it protected nothing.
 * - Pages that must stay out of the index — the 404 page, the Next RSC `.txt`
 *   payloads, tools.csv, tool-index.json — are handled with `noindex` (meta
 *   tag or the X-Robots-Tag header in firebase.json). robots.txt cannot
 *   de-index anything: a blocked URL can still be indexed from links, and
 *   Google would never see the noindex on it.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
