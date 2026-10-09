import { absoluteUrl } from "./config";
import { SITEMAP_SECTIONS, getPublicRoutes, type PublicRoute, type SitemapSection } from "./routes";

/**
 * XML sitemaps, built from lib/seo/routes.ts.
 *
 *   /sitemap.xml             sitemap index (the one URL to submit)
 *   /sitemap-pages.xml       homepage, hubs, about/contact/legal
 *   /sitemap-categories.xml  category landing pages
 *   /sitemap-tools.xml       one URL per tool
 *   /sitemap-guides.xml      how-to guides
 *
 * Split by content type so Search Console reports indexing per type ("82
 * tools submitted, N indexed") — the fastest way to see which kind of page
 * Google is not taking. A section with no URLs produces no file, and a
 * section over 50,000 URLs is chunked (-2, -3, …), the protocol's limit.
 *
 * Route handlers rather than app/sitemap.ts so each file can carry the
 * `<?xml-stylesheet?>` line that makes it readable in a browser. Search
 * engines ignore the stylesheet.
 *
 * `changefreq` and `priority` are omitted: Google ignores both.
 */

const MAX_URLS = 50_000;
const XSL = '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>';
const HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600",
};

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

interface SitemapFile {
  file: string;
  section: SitemapSection;
  routes: PublicRoute[];
}

/** Every sitemap file that should exist, in index order. */
export function getSitemapFiles(): SitemapFile[] {
  const routes = getPublicRoutes();
  const files: SitemapFile[] = [];
  for (const { id, file } of SITEMAP_SECTIONS) {
    const inSection = routes.filter((r) => r.section === id);
    for (let i = 0; i * MAX_URLS < inSection.length; i++) {
      files.push({
        file: i === 0 ? file : file.replace(/\.xml$/, `-${i + 1}.xml`),
        section: id,
        routes: inSection.slice(i * MAX_URLS, (i + 1) * MAX_URLS),
      });
    }
  }
  return files;
}

const newest = (routes: PublicRoute[]) =>
  routes.map((r) => r.lastmod).filter((d): d is string => !!d).sort().at(-1);

export function renderSitemapIndex(): string {
  const entries = getSitemapFiles().map(({ file, routes }) => {
    const lastmod = newest(routes);
    return `<sitemap><loc>${escapeXml(absoluteUrl(`/${file}`))}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</sitemap>`;
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    XSL,
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</sitemapindex>",
    "",
  ].join("\n");
}

export function renderUrlset(file: string): string | null {
  const match = getSitemapFiles().find((f) => f.file === file);
  if (!match) return null;
  const urls = match.routes.map(
    (r) => `<url><loc>${escapeXml(absoluteUrl(r.path))}</loc>${r.lastmod ? `<lastmod>${r.lastmod}</lastmod>` : ""}</url>`
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    XSL,
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

export function sitemapResponse(xml: string | null): Response {
  if (xml === null) return new Response("Not found", { status: 404 });
  return new Response(xml, { headers: HEADERS });
}
