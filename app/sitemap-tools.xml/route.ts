import { renderUrlset, sitemapResponse } from "@/lib/seo/sitemap";

export const dynamic = "force-static";

export function GET() {
  return sitemapResponse(renderUrlset("sitemap-tools.xml"));
}
