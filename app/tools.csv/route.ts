import { getAllTools } from "@/lib/tools/registry";
import { SITE_CONFIG } from "@/lib/seo/metadata";

export const dynamic = "force-static";

const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;

/**
 * The full tool catalogue as CSV, generated at build time. Replaces a client
 * button that shipped the whole registry to the browser to build the same
 * file on click. Columns are unchanged.
 */
export async function GET() {
  const header = "Name,Slug,Category,Description,URL,Type\n";
  const rows = getAllTools()
    .map((t) =>
      [
        cell(t.name),
        cell(t.slug),
        cell(t.categoryName),
        cell(t.description),
        cell(`${SITE_CONFIG.domain}/tools/${t.slug}`),
        cell("Browser Service"),
      ].join(",")
    )
    .join("\n");

  return new Response(header + rows + "\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
