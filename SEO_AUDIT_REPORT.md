# TabBench SEO Audit Report

- **Audit date:** 29 September 2026
- **Scope:** every public route of the static export (`out/`) that Firebase Hosting serves at https://tabbench.com, plus the live site where the server's behaviour mattered (redirects, headers, TLS).
- **Machine-readable output:** [`seo-report.json`](seo-report.json) (the scorecard) and [`reports/route-inventory.json`](reports/route-inventory.json) (one row per route).
- **How to reproduce:** `npm run build`, then `npm run test:seo` and `npm run seo:report`.

SEO work cannot guarantee rankings or traffic. This pass fixes the technical and content foundations that search engines use to discover, crawl, understand and present the site.

---

## 1. Executive summary

TabBench already had self-referencing canonicals, one H1 per page, unique titles and no accidental `noindex`. The problems were elsewhere, in six areas:

- **Sitemap dates.** The sitemap gave 112 of 132 URLs the same hand-set date.
- **Structured data.** It did not match the page: breadcrumbs disagreed with the visible trail, schema values were invented or invalid, and the logo was an SVG.
- **Head tags.** Every page had duplicate head tags, plus a Twitter handle nobody had verified.
- **Unindexable payloads.** Crawlable RSC payloads (`/about.txt` and similar) were served without `noindex`.
- **`www` domain.** `www.tabbench.com` fails HTTPS on the live site. This needs a manual Firebase fix (§12).
- **Mobile.** Three tool pages overflowed on 320 px phones.

The fix is a single SEO layer driven by a route registry, with two parts:

1. **Generated artefacts.**
   - A sitemap index with five child sitemaps.
   - `lastmod` dates derived from actual content changes.
   - JSON-LD generated from the same data the page shows.
   - A post-build audit that fails the build on regressions.
2. **A test suite** of 69 tests.

The same audit, run against the committed build (`70905a5`) and against this build, gives:

| Metric (same audit, same rules) | Before (70905a5) | After |
|---|---:|---:|
| Audit errors | 380 | **0** |
| Audit warnings | 143 | **0** |
| Structured-data errors | 113 | **0** |
| Pages with duplicate `<meta charset>` / viewport | 132 / 132 | **0 / 0** |
| Breadcrumb JSON-LD ≠ visible breadcrumb | 93 | **0** |
| Truncated titles (`… \| TabB...`) | 2 | **0** |
| Meta descriptions clipped mid-sentence | 10 | **0** |
| `meta keywords` tags | 132 | **0** |
| Unverified `twitter:creator` | 132 | **0** |
| Tool schema with invented `softwareVersion` / `datePublished` | 82 / 80 | **0 / 0** |
| Organization logo / apple-touch-icon as SVG (not accepted) | 132 / 132 | **0 / 0** |
| Sitemap files | 1 | **5 + index** |
| URLs sharing one hand-set `lastmod` | 112 | **0** (per-URL, content-derived) |
| Pages overflowing at 320 px | 3 | **0** |

---

## 2. Technical SEO: problems found and fixed

Problems are ordered by the spec's priority levels. "Before" counts come from running the new audit against the committed build.

### P0: indexing and crawling

| Problem | Evidence | Fix |
|---|---|---|
| `https://www.tabbench.com` fails with a certificate name mismatch. DNS points at Firebase, but no certificate was issued for `www`. | Live check, 29 Sep 2026 | **Manual.** Needs Firebase console access (§12). |
| RSC payloads (`/about.txt`, `/tools/x.txt` and others) were served with a 200 status and no `noindex`. They duplicate every page's text. | Live `about.txt`: no `X-Robots-Tag` | `firebase.json` now sends `X-Robots-Tag: noindex` for `**/*.txt`. `tool-index.json` and `tools.csv` are noindexed too. |
| The root layout set `alternates.canonical: "/"`. Any page that forgot its own canonical would silently canonicalise to the homepage. This was latent; no current page was affected. | `app/layout.tsx` | Removed. Every page now gets a self-canonical from `buildMetadata()`, and the audit fails the build on `canonical-not-self`. |
| The sitemap's `lastmod` was one constant (`CONTENT_LAST_UPDATED` = 2026-09-13) for every non-guide URL, and had to be bumped by hand. | Old `app/sitemap.ts` | Each URL's `lastmod` now comes from a fingerprint of its content (§3). |

### P1: metadata, schema and linking

| Problem | Before | Fix |
|---|---:|---|
| Duplicate `<meta charset>` and `viewport` tags (manual tags plus Next's) | 132 pages | Manual tags removed. Next emits one of each. |
| Duplicate `mobile-web-app-capable`, `manifest` and `apple-touch-icon` tags | 132 pages | Left to the Metadata API only. |
| Breadcrumb JSON-LD differed from the visible trail ("All Tools" vs "All tools", missing levels) | 93 pages | `components/Breadcrumbs.tsx` now emits the `BreadcrumbList` from the same items it renders. It is not possible for the two to drift. |
| Article schema for guides had no `image` | 20 guides | Each guide's Open Graph card is used. `datePublished` is the guide's real first-commit date; `dateModified` is `max(updated, lastmod)`. |
| Every tool had `applicationCategory: "UtilityApplication"`, which is not a value Google recognises | 82 tools | Mapped per category to Google's values: `UtilitiesApplication`, `DeveloperApplication`, `MultimediaApplication`, `SecurityApplication`, `BusinessApplication`. |
| Hard-coded `softwareVersion: "1.0"` and made-up `datePublished` on tool schema | 82 / 80 | Removed. `dateModified` comes from real content changes. |
| Organization logo was `/icon.svg`; Google requires a raster logo of at least 112 px | 132 pages | 512 px PNG generated from the brand mark (`/icons/icon-512.png`). |
| `apple-touch-icon` pointed at an SVG, which iOS ignores | 132 pages | 180 px PNG (`app/apple-icon.tsx`). 192 px, 512 px and maskable-512 PNGs were added to the manifest. |
| `twitter:creator` was set to `@tabbench`, an account TabBench has not verified | 132 pages | Removed. There is now a single `SEO_CONFIG.twitterHandle` slot, and `sameAs` is empty until the accounts are verified. |
| `meta keywords` tags. Google ignores them, and long lists look like stuffing. | 132 pages | Removed. Keyword data still powers on-site search. |
| Titles truncated to `… \| TabB...` by the old title builder | 2 | `buildTitle()` adds " \| TabBench" only when the result fits in 60 characters, and never cuts a title. |
| Meta descriptions cut mid-sentence with `...` | 10 | Rewritten at the source to 160 characters or fewer. The audit now warns on any clipped description (`description-clipped`). |
| The `WebSite` SearchAction targets `/tools?q=`, but the directory ignored `q` | 1 target | `/tools` now pre-fills its search from `?q=`. The canonical stays `/tools`. |
| `Disallow: /api/` in `robots.txt`, although a static export has no `/api` path | 1 | Removed (see §4). |
| Category copy made claims the tools do not support: "60–80%" PDF compression, a SubtleCrypto claim, "AI models" for rule-based engines | 3 categories | Rewritten to describe what the tools actually do. |
| Guides linked to one tool, and category pages did not link to guides | — | Guides now show up to 4 related tools, and category pages list their guides (§7). |
| Horizontal overflow at 320 px on the Sample File Generator, Lorem Ipsum Generator and Salary Calculator (+17 to +23 px) | 3 pages | The rows now wrap (§9). |

### P2: architecture and automation

- **Route registry.** `lib/seo/routes.ts` lists every public URL, grouped by sitemap section. The sitemaps, the audit and the tests all read from it.
- **Post-build audit.** `scripts/seo/audit.mjs` runs automatically after `npm run build` and fails the build on any error.
- **Scorecard and inventory.** `seo-report.json` and `reports/route-inventory.json` record page type, title, H1, canonical, robots, sitemap file, `lastmod`, schema types, breadcrumb, word count, internal links in and out, and issues.
- **Dead code removed.** `lib/seo/validator.ts` and `scripts/seo-check.ts` could not be run and referenced exports that no longer exist.

---

## 3. Sitemap

### Architecture

| URL | Contents | URLs |
|---|---|---:|
| https://tabbench.com/sitemap.xml | Sitemap index | 5 files |
| https://tabbench.com/sitemap-pages.xml | Home, `/tools`, `/categories`, `/guides`, `/about`, `/contact`, `/editorial-policy`, `/privacy`, `/terms` | 9 |
| https://tabbench.com/sitemap-categories.xml | `/categories/*` (only categories that contain tools) | 9 |
| https://tabbench.com/sitemap-tools.xml | `/tools/*` | 82 |
| https://tabbench.com/sitemap-guides.xml | `/guides/*` | 20 |
| https://tabbench.com/sitemap-currency.xml | `/convert/*` currency pairs | 12 |
| | **Total** | **132** |

- **Generation.** Every file is produced by a static route handler (`app/sitemap*.xml/route.ts` → `lib/seo/sitemap.ts`) at build time, with no server involved. A section with no URLs is left out of the index. Any file that passes 50,000 URLs is split automatically.
- **`lastmod`.** Dates come from `lib/seo/lastmod.json`, which `npm run build` refreshes before building:
  - Each URL has a fingerprint made of its visible content fields and its page-specific source files.
  - A URL's date changes only when that fingerprint changes. Redeploying does not change dates.
  - Fields that are not page content (`keywords`, `aliases`, `metaTitle`, `metaDescription`) do not affect the fingerprint.
  - The first dates were reconstructed from git history.
  - `node scripts/seo/lastmod.mjs --check` exits with an error if the manifest is stale.
  - `--accept /tools/<slug>` records a layout-only change without bumping the date.
- **Omitted on purpose.** `changefreq` and `priority` are left out because Google ignores them.
- **Browser view.** `public/sitemap.xsl` renders the sitemaps as a readable table in a browser. It is cosmetic only: crawlers ignore it, and Chrome is removing XSLT support.

### Validation (automated, in `tests/seo/sitemap.test.mjs`)

Every check below passes:

- The files are well-formed XML with the correct namespaces.
- The index references only child sitemaps that exist.
- Every URL is absolute `https://tabbench.com`, with no query string, no trailing slash and no duplicates.
- No URL is a redirect source in `firebase.json`, and none returns 404 in the build.
- No URL is `noindex`, and every URL is its page's own canonical.
- Every `lastmod` is a valid W3C date and none is in the future.
- Every indexable page appears in a sitemap.
- The set of sitemap URLs equals the registry exactly.

### Excluded URLs (by design)

- `/404` and `/_not-found`, which are `noindex`.
- The 12 legacy slugs that redirect with a 301, such as `/tools/basic-calculator` and `/tools/youtube-video-downloader`.
- `/tools?q=…` and other query variants.
- RSC `.txt` payloads, `tool-index.json`, `tools.csv`, `opengraph-image` files and `manifest.webmanifest`.

---

## 4. Robots

```
User-Agent: *
Allow: /

Sitemap: https://tabbench.com/sitemap.xml
```

Why these rules:

- **Everything is allowed.** Every public page is meant to be indexed, and CSS and JS must stay crawlable for rendering.
- **`Disallow: /api/` was removed.** The static export has no `/api` path, so the rule protected nothing and only added noise.
- **Pages that must stay out of the index use `noindex`, not `robots.txt`.** A disallowed URL can still be indexed from links, and a disallow also stops Google from ever seeing a `noindex` on it.

`tests/seo/robots.test.mjs` checks the syntax, the absolute sitemap URL, and that no public route is blocked.

---

## 5. Canonicals

The strategy:

- **One origin.** Every indexable page has exactly one absolute, self-referencing canonical on `https://tabbench.com`. It is built from `SEO_CONFIG.origin`, which is a constant, so an environment file cannot inject a preview or localhost host.
- **One URL form.** Canonicals follow the shape Firebase serves (`cleanUrls: true`, `trailingSlash: false`): no trailing slash and no query string.
- **`og:url` matches the canonical**, checked on every page.
- **Other hosts and variants.**
  - Firebase project hosts are pointed at the canonical origin by the existing `canonical-host` script.
  - `http://` is 301-redirected to `https://` (verified live).
  - Trailing-slash and `.html` variants are 301-redirected by Firebase (verified live).
- **Before vs after.** The before build had 0 missing and 0 conflicting canonicals. The remaining risk was the layout-level `canonical: "/"`, which is now removed.
- **Enforcement.** The audit fails on any of: `canonical-missing`, `canonical-multiple`, `canonical-host`, `canonical-query`, `canonical-not-self`, `canonical-duplicate` or `og-url-mismatch`.

---

## 6. Metadata

These counts cover the 132 indexable pages of the current build.

| Count | Value |
|---|---:|
| Unique titles | 132 |
| Duplicate titles | 0 |
| Missing titles | 0 |
| Missing descriptions | 0 |
| Duplicate descriptions | 0 |
| Missing H1 | 0 |
| Multiple H1 on one page | 0 |
| Duplicate H1 across pages | 0 |
| Titles over 60 characters | 0 |
| Descriptions over 160 characters or clipped | 0 |

What changed:

- **Titles and descriptions.** Registry `metaTitle` and `metaDescription` values were rewritten where they were vague, truncated or too long. For example:
  - "JSON Formatter & Validator"
  - "GST Calculator India – Add or Remove GST"
  - "CTC to In-Hand Salary Calculator (India)"
  - "Privacy Policy: What We Store and Never See"
- **Tests on the source data.** `tests/seo/registry.test.mjs` requires every tool title to be 60 characters or fewer and unique, and every description to be 70–160 characters.
- **Social cards.**
  - Every page has a complete Open Graph and X card: a 1200×630 PNG, real alt text and `og:type`. Guides use `article` with published and modified times.
  - `og:title` is the page title without the " | TabBench" suffix.
  - Card URLs carry a `?v=` content fingerprint, so social networks fetch the image again when the page changes.

---

## 7. Structured data

All JSON-LD is rendered by `components/seo/json-ld.tsx`. It escapes `<`, `>`, `&`, U+2028 and U+2029, so page text cannot break out of the `<script>` tag.

| Type | Pages | Source of truth |
|---|---:|---|
| Organization | 132 | `SEO_CONFIG`: 512 px PNG logo, contact point; `sameAs` only once verified |
| WebSite (with SearchAction → `/tools?q=`) | 132 | `SEO_CONFIG` |
| WebApplication | 82 | Tool registry: free offer, Google category value, `dateModified` from `lastmod` |
| FAQPage | 123 | Only FAQs that are visible on the page (checked by the audit) |
| BreadcrumbList | 131 (all except the homepage) | The visible breadcrumb component |
| Article | 20 | Guide content: headline, image, author/publisher = Organization, real dates |
| CollectionPage (with ItemList) | 12 | Hub, category and guides-index listings |

- **Validation.** 0 schema errors in the build. Every block must be valid JSON with a `@context`, and the audit fails on any of: `jsonld-invalid`, `breadcrumb-mismatch`, `faq-not-visible`, `article-field` or `fake-rating`.
- **Deliberately not added:**
  - `AggregateRating` or `Review` markup, because there are no real ratings.
  - `sameAs` or `twitter:site`, because the accounts are unverified.
  - `SoftwareApplication` version or publish dates, because they are not tracked.
  - `HowTo`, because Google no longer shows it.
- **FAQ rich results.** Google shows FAQ rich results only for well-known government and health sites, so FAQ markup here helps understanding rather than appearance.

---

## 8. Internal linking

The link path is: Home → Categories → Tools → Related tools / Next steps → Guides → back to Tools.

| | Before | After |
|---|---:|---:|
| Orphan pages | 0 | 0 |
| Weakly linked pages (2 or fewer inbound links) | 0 | 0 |
| Broken internal links | 0 | 0 |
| Internal links that go through a redirect | 0 | 0 |
| Least-linked guide (inbound links) | 7 | 8 |
| Average outbound links per guide | 9.0 | 12.9 |
| Least-linked tool (inbound links) | 3 | 4 |

What changed:

- **Guide pages** end with a "Related tools" block of up to 4 tools, taken from the guide tool's next steps and related tools.
- **Category pages** list their guides.
- **Breadcrumbs.** Every page's breadcrumb has a real link at every level, including the last one in the JSON-LD.
- **Reciprocal related links** were added where they help the reader:
  - Crop Image → Online Camera
  - PNG to JPG → WebP to JPG
- **Audit checks.** It flags broken, relative, mixed-case and redirecting links, and reports orphaned and weakly linked pages.

---

## 9. Performance and mobile

### Measured

This build, all figures gzipped:

| Page type | HTML | Initial JS (module) | CSS |
|---|---:|---:|---:|
| Home | 38.9 KB | 225 KB | 38 KB |
| `/tools` directory | 50.6 KB | 234 KB | 38 KB |
| Category | 27.1 KB | 233 KB | 38 KB |
| Tool page (JSON Formatter, EMI, PDF Editor, Image Compressor, Camera) | 30–32 KB | 235 KB | 38 KB |
| Guide | 24.7 KB | 225 KB | 38 KB |
| About | 18.9 KB | 223 KB | 38 KB |

- **Polyfills.** A 39 KB polyfill bundle ships as `noModule`, so modern browsers never download it.
- **Tool code.** Each tool's code loads lazily after the page shell. The PDF editor's chunk is the largest, at about 240 KB gzipped on top of the shell.
- **Social images.** The Open Graph PNGs are built ahead of time, so there is no runtime rendering.

### What this pass changed

- **No new client JavaScript.** The SEO layer adds none: the JSON-LD, sitemaps, icons and metadata are all generated at build time.
- **`/tools?q=` pre-fill.** It uses `useSyncExternalStore`, which adds no hydration mismatch and no extra render on pages without a query.
- **Head size.** Duplicate head tags and the keyword lists were removed.

### Not measured

No Lighthouse run or field data (CrUX) was collected in this pass. The figures above are transfer sizes, not Core Web Vitals. After deploying, run PageSpeed Insights on:

- `/`
- `/tools`
- one tool page each for calculators, images, PDF and developer tools

Treat Search Console's Core Web Vitals report as the real measure.

A possible next step is to lazy-load the command-search dialog; the Radix UI libraries in the shared bundle total about 55 KB. It was not done here because there was no field data to justify the change.

### Mobile

Every one of the 132 routes was loaded in iframes at seven widths:

| Widths | Page loads | Horizontal overflow |
|---|---:|---:|
| Phones: 320, 375, 390, 414 px | 528 | 0 (3 before the fixes) |
| Tablet and desktop: 768, 1024 px | 264 | 0 |
| Desktop: 1440 px | — | Checked in the browser pane |

The three overflowing pages were fixed:

- Sample File Generator: the file-count and FPS rows now wrap.
- Lorem Ipsum Generator: the type selector becomes a 2×2 grid below 400 px.
- Salary Calculator: the Provident Fund options now wrap their text.

---

## 10. Indexability

| Class | Count | Signal |
|---|---:|---|
| Indexed: home, hubs, informational and legal pages | 9 | `index, follow` + in sitemap |
| Indexed: categories | 9 | same |
| Indexed: tools | 82 | same |
| Indexed: guides | 20 | same |
| Indexed: currency pairs | 12 | same |
| Excluded: `/404`, `/_not-found` | 2 | `noindex` meta |
| Excluded: RSC `.txt`, `tool-index.json`, `tools.csv` | — | `X-Robots-Tag: noindex` header |
| Excluded: legacy tool slugs | 12 | 301 redirects in `firebase.json` |

The audit compares what the build actually serves with the route registry. It fails on:

- `route-missing`: a registered page was not built.
- `accidental-noindex`: a public page is marked `noindex`.
- `unexpected-indexable`: an unregistered page is indexable.

---

## 11. Security (SEO-related)

- **Safe JSON-LD.** Output is escaped, so FAQ or guide text cannot close the `<script>` tag. Unit tests cover this.
- **Query input.** `?q=` on `/tools` is length-capped, rendered as text only, and never written into metadata or canonicals.
- **No wrong hosts in production HTML.** Production pages contain no localhost, `*.web.app`, `*.firebaseapp.com` or `http://` URLs. The audit checks every page and fails the build if one appears.
- **No false identity signals.** Unverified social accounts (`twitter:creator` and similar) were removed.
- **Unchanged.** The existing security headers (HSTS, `nosniff`, frame options, referrer and permissions policies) were kept as they were.

---

## 12. Remaining issues

These are real issues that code in this repository cannot fix.

1. **`www.tabbench.com` has no valid certificate (P0, manual).**
   - Fix: in the Firebase console, open Hosting and add the custom domain `www.tabbench.com`, set to **redirect** to `tabbench.com`.
   - Keep the DNS records Firebase asks for, then wait for the certificate to be issued.
   - Until then, anyone who types `www.` gets a browser security error.
2. **Search Console is not verified yet.** Follow the steps in §14.
3. **`/tools/pdf-compressor` hosts the PDF Inspector.** The slug promises compression the tool doesn't do.
   - The URL was kept to avoid breaking existing links.
   - If you rename it, add a 301 in `firebase.json` and update the registry. The audit catches missed references.
4. **Social profiles.** Add `sameAs` and `twitterHandle` in `lib/seo/config.ts` only once TabBench owns and controls those accounts.
5. **Chrome is removing XSLT.** The sitemap stylesheet will stop rendering in Chrome. Crawlers are unaffected.
6. **`/_not-found` returns 200 with `noindex`.** This is a Next.js static-export artefact. It is harmless because of the `noindex` and the absence of links, and real missing URLs still get Firebase's 404.
7. **Pages touched today have today's `lastmod`.** That is correct, because their visible content changed. The next deploys will not move any date unless the page changes again.
8. **Lint.** Seven lint errors predate this pass (setState-in-effect and refs-in-render in BarcodeScanner, PdfEditor, PngToSvg and QrCodeScanner). None is SEO-related.

---

## 13. Deployment

```bash
npm ci                 # installs jiti (new devDependency used by the SEO scripts)
npm run build          # refreshes lastmod.json, builds out/, runs the SEO audit (fails on errors)
npm run test:seo       # 69 SEO tests
firebase deploy --only hosting
```

After deploying, check each of these:

- `https://tabbench.com/robots.txt`, `/sitemap.xml` and `/sitemap-tools.xml` return 200 with XML.
- `https://tabbench.com/about.txt` returns `X-Robots-Tag: noindex`.
- `https://tabbench.com/apple-icon` and `/icons/icon-512.png` return PNGs.

Commit `lib/seo/lastmod.json` along with the change that caused it; it is the record of when each page last changed.

---

## 14. Google Search Console

1. Add a **Domain property** for `tabbench.com` (verification by DNS TXT record). It covers both `www` and non-`www`, over both http and https.
2. Under Sitemaps, submit `https://tabbench.com/sitemap.xml`. Only the index is needed; Google finds the child sitemaps from it.
3. Use URL Inspection on the homepage, one tool, one category and one guide, then request indexing.
4. After 1–2 weeks, check two reports:
   - **Pages:** look for "Duplicate without user-selected canonical" and "Crawled – currently not indexed".
   - **Enhancements:** Breadcrumbs.
5. Optionally, submit the same sitemap in Bing Webmaster Tools; it can import the site from Search Console.

---

## 15. Manual verification still required

- Run the Rich Results Test on one tool, one guide and one category after deploying.
- Check the Open Graph cards in real share previews: X, LinkedIn, WhatsApp and Slack.
- Run PageSpeed Insights on the pages listed in §9. Mobile field data will appear in Search Console after about 28 days of traffic.
- Confirm that `www.tabbench.com` redirects once the certificate has been issued.
- Test the PDF editor's restricted-PDF notice with a real encrypted PDF; only the logic was checked.

---

## Appendix: files

### Created

- **Config, registry and sitemap logic:**
  - `lib/seo/config.ts`, `lib/seo/routes.ts`, `lib/seo/sitemap.ts`
  - `lib/seo/lastmod.json`, `lib/seo/brand-icon.tsx`
- **Sitemap routes:**
  - `app/sitemap.xml/route.ts`
  - `app/sitemap-{pages,categories,tools,guides,currency}.xml/route.ts`
  - `public/sitemap.xsl`
- **Icons:** `app/apple-icon.tsx`, `app/icons/[file]/route.tsx`
- **JSON-LD component:** `components/seo/json-ld.tsx`
- **Scripts:** `scripts/seo/audit.mjs`, `scripts/seo/lastmod.mjs`, `scripts/seo/lib/site.mjs`
- **Tests:** `tests/seo/*.test.mjs` (9 suites, 69 tests) and `tests/seo/helpers.mjs`
- **Reports:** `SEO_AUDIT_REPORT.md`, `seo-report.json`, `reports/route-inventory.json`

### Changed

- **App routes and metadata:**
  - `app/layout.tsx`, `app/page.tsx`, `app/robots.ts`, `app/manifest.ts`
  - `app/tools/page.tsx`, `app/tools/[slug]/page.tsx`
  - `app/categories/page.tsx`, `app/categories/[category]/page.tsx`
  - `app/guides/page.tsx`, `app/guides/[slug]/page.tsx`
  - `app/convert/[pair]/page.tsx`
  - `app/{about,contact,editorial-policy,privacy,terms}/page.tsx`
- **Shared components:**
  - `components/Breadcrumbs.tsx`, `components/ToolShell.tsx`, `components/layout/prose-page.tsx`
  - `components/tool/tool-directory.tsx`, `components/ui/command.tsx`
- **Tool components:**
  - `components/tools/PdfEditor.tsx`
  - `components/tools/{SampleFileGenerator,LoremIpsumGenerator,SalaryCalculator}.tsx`
- **SEO and content libraries:**
  - `lib/seo/{metadata,jsonld,canonical-host}.ts`
  - `lib/tools/{registry,categoryContent,search}.ts`
  - `lib/guides/content.ts`
- **Build and hosting:**
  - `scripts/seo-check.mjs`, `firebase.json`
  - `package.json` and `package-lock.json` (`jiti` added as a devDependency)

### Deleted

- `app/sitemap.ts` (replaced by the sitemap index)
- `app/apple-icon.svg` (replaced by a PNG)
- `lib/seo/validator.ts` and `scripts/seo-check.ts` (dead code that could not run)

### Not part of this pass

These appear in `git status` but are separate, uncommitted work on the developer tools:

- **Tool components:** `Base64Converter`, `ColorConverter`, `ContrastChecker`, `FaviconGenerator`, `HtmlEntityConverter`, `JsonToTypeScript`, `RegexTester`, `SlugGenerator`, `UnixTimestampConverter` and `UrlEncoderDecoder`.
- **Content:** `lib/tools/content.ts`.
- **New folders and files:**
  - `lib/color`, `lib/image`, `lib/json`, `lib/regex`, `lib/time`
  - `lib/text/{base64,slug}.ts`, `lib/url/encode.ts`
  - `components/color`
