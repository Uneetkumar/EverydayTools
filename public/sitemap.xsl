<?xml version="1.0" encoding="UTF-8"?>
<!--
  Human-readable view of TabBench's XML sitemaps. Presentation only: search
  engines read the XML and ignore this file. Handles both the sitemap index
  (/sitemap.xml) and the per-type URL sets (/sitemap-tools.xml, …).
-->
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9"
  exclude-result-prefixes="s">
  <xsl:output method="html" encoding="UTF-8" indent="yes" doctype-system="about:legacy-compat"/>

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="robots" content="noindex"/>
        <title>XML Sitemap · TabBench</title>
        <style>
          :root { color-scheme: light dark; --bg:#fafafa; --card:#fff; --fg:#18181b; --muted:#71717a; --line:#e4e4e7; --link:#1d4ed8; }
          @media (prefers-color-scheme: dark) { :root { --bg:#111113; --card:#18181b; --fg:#f4f4f5; --muted:#a1a1aa; --line:#27272a; --link:#93b4fd; } }
          * { box-sizing: border-box; }
          body { margin:0; background:var(--bg); color:var(--fg); font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif; }
          main { max-width:1040px; margin:0 auto; padding:32px 16px 64px; }
          h1 { font-size:22px; margin:0 0 6px; letter-spacing:-.01em; }
          p { margin:0 0 20px; color:var(--muted); max-width:70ch; }
          a { color:var(--link); text-decoration:none; word-break:break-all; }
          a:hover { text-decoration:underline; }
          .card { background:var(--card); border:1px solid var(--line); border-radius:12px; overflow:hidden; }
          table { width:100%; border-collapse:collapse; }
          th, td { text-align:left; padding:10px 14px; border-bottom:1px solid var(--line); vertical-align:top; }
          th { font-size:12px; text-transform:uppercase; letter-spacing:.04em; color:var(--muted); font-weight:600; }
          tr:last-child td { border-bottom:0; }
          td.n, th.n { width:3.5rem; color:var(--muted); font-variant-numeric:tabular-nums; }
          td.d, th.d { width:9rem; white-space:nowrap; font-variant-numeric:tabular-nums; color:var(--muted); }
          @media (max-width:560px) { td.n, th.n { display:none; } td.d, th.d { width:auto; } }
        </style>
      </head>
      <body>
        <main>
          <xsl:choose>
            <xsl:when test="s:sitemapindex">
              <h1>TabBench sitemap index</h1>
              <p>
                This index lists <xsl:value-of select="count(s:sitemapindex/s:sitemap)"/> sitemaps, one per kind of page.
                It is the file to submit in Search Console. Open one to see its URLs.
              </p>
              <div class="card">
                <table>
                  <thead><tr><th class="n">#</th><th>Sitemap</th><th class="d">Last modified</th></tr></thead>
                  <tbody>
                    <xsl:for-each select="s:sitemapindex/s:sitemap">
                      <tr>
                        <td class="n"><xsl:value-of select="position()"/></td>
                        <td><a href="{s:loc}"><xsl:value-of select="s:loc"/></a></td>
                        <td class="d"><xsl:value-of select="s:lastmod"/></td>
                      </tr>
                    </xsl:for-each>
                  </tbody>
                </table>
              </div>
            </xsl:when>
            <xsl:otherwise>
              <h1>TabBench sitemap</h1>
              <p>
                <xsl:value-of select="count(s:urlset/s:url)"/> URLs. Each is the canonical address of a page meant to be
                indexed. Last modified is the date that page's content last changed. <a href="/sitemap.xml">Back to the index</a>.
              </p>
              <div class="card">
                <table>
                  <thead><tr><th class="n">#</th><th>URL</th><th class="d">Last modified</th></tr></thead>
                  <tbody>
                    <xsl:for-each select="s:urlset/s:url">
                      <tr>
                        <td class="n"><xsl:value-of select="position()"/></td>
                        <td><a href="{s:loc}"><xsl:value-of select="s:loc"/></a></td>
                        <td class="d"><xsl:value-of select="s:lastmod"/></td>
                      </tr>
                    </xsl:for-each>
                  </tbody>
                </table>
              </div>
            </xsl:otherwise>
          </xsl:choose>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
