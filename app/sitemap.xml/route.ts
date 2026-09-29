import { renderSitemapIndex, sitemapResponse } from "@/lib/seo/sitemap";

export const dynamic = "force-static";

/** Sitemap index — the one URL submitted to Search Console. See lib/seo/sitemap.ts. */
export function GET() {
  return sitemapResponse(renderSitemapIndex());
}
