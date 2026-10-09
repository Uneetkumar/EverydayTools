import {
  TOOL_CATEGORIES,
  getAllTools,
  getToolsByCategory,
  type ToolDefinition,
} from "@/lib/tools/registry";
import { GUIDES } from "@/lib/guides/content";
import lastmodManifest from "./lastmod.json";

/**
 * Every public, indexable URL on the site, derived from the registries.
 *
 * This is the source of truth for the XML sitemaps and the SEO checks. A page
 * appears here only if it is canonical, returns 200 and is meant to be
 * indexed — so a new tool is in the sitemap the moment it is in the registry,
 * and a removed one drops out without anyone editing a URL list.
 *
 * Deliberately NOT here: the 404 page, `/_not-found`, internal-search URLs
 * (`/tools?q=…`), the RSC `.txt` payloads Next exports next to each page,
 * `tools.csv`, `tool-index.json`, and the retired slugs `firebase.json`
 * 301-redirects.
 */

export type SitemapSection = "pages" | "categories" | "tools" | "guides";

export type RouteKind =
  | "homepage"
  | "hub"
  | "category"
  | "calculator"
  | "developer-tool"
  | "pdf-tool"
  | "image-tool"
  | "text-tool"
  | "ai-tool"
  | "utility"
  | "guide"
  | "informational"
  | "legal";

export interface PublicRoute {
  path: string;
  kind: RouteKind;
  section: SitemapSection;
  /** Human label, for reports. */
  label: string;
  /** YYYY-MM-DD of the last real content change, from lib/seo/lastmod.json. */
  lastmod?: string;
  /** Source files whose contents define this page (static pages only). */
  sourceFiles?: string[];
}

/** Sitemap order and file names. A section with no routes gets no file. */
export const SITEMAP_SECTIONS: { id: SitemapSection; file: string; title: string }[] = [
  { id: "pages", file: "sitemap-pages.xml", title: "Main pages" },
  { id: "categories", file: "sitemap-categories.xml", title: "Tool categories" },
  { id: "tools", file: "sitemap-tools.xml", title: "Tools" },
  { id: "guides", file: "sitemap-guides.xml", title: "Guides" },
];

const STATIC_ROUTES: Omit<PublicRoute, "lastmod">[] = [
  { path: "/", kind: "homepage", section: "pages", label: "Homepage", sourceFiles: ["app/page.tsx"] },
  { path: "/tools", kind: "hub", section: "pages", label: "All tools", sourceFiles: ["app/tools/page.tsx"] },
  { path: "/categories", kind: "hub", section: "pages", label: "Categories", sourceFiles: ["app/categories/page.tsx"] },
  { path: "/guides", kind: "hub", section: "pages", label: "Guides", sourceFiles: ["app/guides/page.tsx"] },
  { path: "/about", kind: "informational", section: "pages", label: "About", sourceFiles: ["app/about/page.tsx"] },
  { path: "/offline", kind: "informational", section: "pages", label: "Use offline", sourceFiles: ["app/offline/page.tsx", "components/offline/offline-manager.tsx"] },
  { path: "/contact", kind: "informational", section: "pages", label: "Contact", sourceFiles: ["app/contact/page.tsx", "app/contact/ContactForm.tsx"] },
  { path: "/editorial-policy", kind: "informational", section: "pages", label: "Editorial policy", sourceFiles: ["app/editorial-policy/page.tsx"] },
  { path: "/privacy", kind: "legal", section: "pages", label: "Privacy policy", sourceFiles: ["app/privacy/page.tsx"] },
  { path: "/terms", kind: "legal", section: "pages", label: "Terms of service", sourceFiles: ["app/terms/page.tsx"] },
];

export const toolPath = (slug: string) => `/tools/${slug}`;
export const categoryPath = (id: string) => `/categories/${id}`;
export const guidePath = (slug: string) => `/guides/${slug}`;

/** Page type for reports: a calculator, a PDF tool, and so on. */
export function toolKind(tool: Pick<ToolDefinition, "slug" | "category">): RouteKind {
  if (tool.slug === "calculator" || tool.slug.endsWith("-calculator")) return "calculator";
  switch (tool.category) {
    case "developer":
    case "api-http":
      return "developer-tool";
    case "pdf-docs":
      return "pdf-tool";
    case "image-media":
      return "image-tool";
    case "text":
      return "text-tool";
    case "ai-tools":
      return "ai-tool";
    default:
      return "utility";
  }
}

/** Categories with at least one tool. Empty ones are thin pages and are not built. */
export function getPopulatedCategories() {
  return TOOL_CATEGORIES.filter((c) => getToolsByCategory(c.id).length > 0);
}

const LASTMOD = (lastmodManifest as { routes: Record<string, { lastmod: string }> }).routes;

export function getPublicRoutes(): PublicRoute[] {
  const routes: Omit<PublicRoute, "lastmod">[] = [
    ...STATIC_ROUTES,
    ...getPopulatedCategories().map((c) => ({
      path: categoryPath(c.id),
      kind: "category" as const,
      section: "categories" as const,
      label: c.name,
    })),
    ...getAllTools().map((t) => ({
      path: toolPath(t.slug),
      kind: toolKind(t),
      section: "tools" as const,
      label: t.name,
    })),
    ...GUIDES.map((g) => ({
      path: guidePath(g.slug),
      kind: "guide" as const,
      section: "guides" as const,
      label: g.title,
    })),
  ];
  return routes.map((r) => ({ ...r, lastmod: LASTMOD[r.path]?.lastmod }));
}

export function getLastmod(path: string): string | undefined {
  return LASTMOD[path]?.lastmod;
}
