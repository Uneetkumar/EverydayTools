import { MetadataRoute } from "next";
import { getAllTools, getToolsByCategory, TOOL_CATEGORIES } from "@/lib/tools/registry";
import { SITE_CONFIG, CONTENT_LAST_UPDATED } from "@/lib/seo/metadata";

export const dynamic = "force-static";

/**
 * `lastModified` uses a fixed constant rather than `new Date()`.
 *
 * Building with the current timestamp marks every URL as freshly modified on
 * every deploy, even when nothing changed. Google notices that the content is
 * identical, stops trusting the field, and crawl scheduling gets worse rather
 * than better. Bump CONTENT_LAST_UPDATED when content actually changes.
 *
 * `changeFrequency` and `priority` are omitted — Google has stated publicly
 * that it ignores both.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = CONTENT_LAST_UPDATED;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_CONFIG.domain, lastModified },
    { url: `${SITE_CONFIG.domain}/tools`, lastModified },
    { url: `${SITE_CONFIG.domain}/about`, lastModified },
    { url: `${SITE_CONFIG.domain}/contact`, lastModified },
    { url: `${SITE_CONFIG.domain}/privacy`, lastModified },
    { url: `${SITE_CONFIG.domain}/terms`, lastModified },
    { url: `${SITE_CONFIG.domain}/editorial-policy`, lastModified },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = TOOL_CATEGORIES.filter(
    (cat) => getToolsByCategory(cat.id).length > 0
  ).map((cat) => ({
    url: `${SITE_CONFIG.domain}/categories/${cat.id}`,
    lastModified,
  }));

  const toolRoutes: MetadataRoute.Sitemap = getAllTools().map((tool) => ({
    url: `${SITE_CONFIG.domain}/tools/${tool.slug}`,
    lastModified,
  }));

  return [...staticRoutes, ...categoryRoutes, ...toolRoutes];
}
