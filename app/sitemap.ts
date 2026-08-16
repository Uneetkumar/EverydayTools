import { MetadataRoute } from "next";
import { getAllTools } from "@/lib/tools/registry";
import { SITE_CONFIG } from "@/lib/seo/metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  const tools = getAllTools();
  const currentDate = new Date().toISOString();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_CONFIG.domain,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_CONFIG.domain}/about`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_CONFIG.domain}/contact`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_CONFIG.domain}/privacy`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_CONFIG.domain}/terms`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_CONFIG.domain}/editorial-policy`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];

  const toolRoutes: MetadataRoute.Sitemap = tools.map((tool) => ({
    url: `${SITE_CONFIG.domain}/tools/${tool.slug}`,
    lastModified: currentDate,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticRoutes, ...toolRoutes];
}
