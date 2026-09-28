import {
  TOOL_CATEGORIES,
  getPopularTools,
  getToolsByCategory,
} from "@/lib/tools/registry";
import { SiteHeader, type NavTool } from "./site-header";

const toNav = (t: { slug: string; name: string; tagline: string; iconName: string; category: string }): NavTool => ({
  slug: t.slug,
  name: t.name,
  tagline: t.tagline,
  iconName: t.iconName,
  category: t.category,
});

/**
 * Server half of the header. It reads the registry here and hands the client
 * header only the ~25 small entries its menus show, so the full registry
 * (FAQs, formulas, long copy) never ships to the browser.
 */
export function Header() {
  const categories = TOOL_CATEGORIES.filter((c) => getToolsByCategory(c.id).length > 0).map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    icon: c.icon,
  }));
  return (
    <SiteHeader
      categories={categories}
      popular={getPopularTools().slice(0, 10).map(toNav)}
      aiTools={getToolsByCategory("ai-tools").map(toNav)}
    />
  );
}
