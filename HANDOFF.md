# EverydayTools — Project Handoff / Context

Snapshot for continuing work in a fresh session. Written 19 Aug 2026.

---

## 1. What this is

A free browser-based tools site (PDF, image, calculator, developer utilities).
**Core premise: everything runs client-side — no file is ever uploaded.** That
claim is the site's only real differentiator against iLovePDF / SmallPDF, so it
must stay literally true. Do not add a feature that transmits user data without
flagging it explicitly.

**Live:** `https://tabbench.com` (Firebase Hosting, project id remains `everydaytools-s`)

## 2. Stack

| | |
|---|---|
| Framework | Next.js **16.3.1**, App Router, **Turbopack** |
| Rendering | **`output: "export"` — fully static.** There is NO server. |
| React | 19.2.8 |
| Styling | Tailwind **v4** (container queries available: `@container`, `@md:` etc.) |
| Hosting | Firebase Hosting, `cleanUrls: true` |
| Key deps | pdf-lib, **pdfjs-dist 6.2.108**, docx, mammoth, jszip, qrcode.react, cropperjs, crypto-js, canvas-confetti, next-themes |

> **`AGENTS.md` says this Next.js build differs from training data — read
> `node_modules/next/dist/docs/` before writing framework code.** That guidance is real.

**Important:** "server-side rendering" is not available and not needed. Every
page is prerendered to static HTML at build time; crawlers get full content
with zero JS. That is already the best case for SEO.

## 3. Architecture — where things live

```
lib/tools/registry.ts      39 tools. SINGLE SOURCE OF TRUTH.
lib/tools/content.ts       Long-form SEO content per tool (1:1 with registry)
lib/tools/categoryContent.ts   9 category landing pages
lib/tools/search.ts        Tokenised ranked search (shared by all search UIs)
lib/guides/content.ts      6 long-tail guide articles
lib/currency/rates.ts      Live FX (open.er-api.com → frankfurter.dev fallback)
lib/currency/pairs.ts      12 currency-pair landing pages
lib/currency/locale.ts     Timezone/locale → currency guess (no IP lookup)
lib/samples/generate.ts    Sample/dummy file generators
lib/history/recent.ts      Recently-used tools (localStorage)
lib/history/results.ts     Recent output files (IndexedDB, 7-day TTL, 3/tool)
lib/pdf/loader.ts          pdf.js bootstrap — READ THE COMMENTS HERE
lib/seo/metadata.ts        SITE_CONFIG + metadata builders
lib/seo/jsonld.ts          All structured data
lib/ads/config.ts          AdSense client + slot IDs
lib/utils/download.ts      downloadBlob() — ALSO records file history

app/tools/[slug]           Tool pages (switch statement maps slug → component)
app/categories/[category]  Category pages
app/convert/[pair]         Currency pair pages
app/guides/[slug]          Guide articles
components/ToolShell.tsx   Wrapper for every tool page
```

**Adding a tool requires 4 edits:** `registry.ts`, `content.ts`, a component in
`components/tools/`, and a `case` in `app/tools/[slug]/page.tsx`.
Audit with:
```bash
grep -oE 'slug: "[^"]+"' lib/tools/registry.ts | sed 's/slug: "//;s/"//' | sort > /tmp/r.txt
grep -oE 'case "[^"]+"' 'app/tools/[slug]/page.tsx' | sed 's/case "//;s/"//' | sort > /tmp/s.txt
comm -23 /tmp/r.txt /tmp/s.txt   # in registry but unwired → renders the WRONG tool
```

## 4. Current state

- **39 tools** (~925 words avg), 6 guides, 12 currency pairs, 9 categories
- **76 HTML pages**, 74 sitemap URLs
- 0 titles over 60 chars, 0 duplicate titles (except 404/_not-found, harmless)
- All JSON-LD valid, **no `aggregateRating` anywhere** (see §6)
- Build + typecheck clean. **7 pre-existing lint errors** in `Header.tsx`,
  `page.tsx`, `ShareToolWidget.tsx`, `PasswordGenerator.tsx`, `UuidGenerator.tsx`,
  `CropImage.tsx` — all "setState synchronously within an effect". Not introduced
  by recent work.

---

## 5. ⚠️ GOTCHAS — these cost hours to rediscover

**pdf.js v6 (`pdfjs-dist@6.2.108`)**
1. `page.render()` accepts **`canvas` OR `canvasContext`, never both.** Passing
   both leaves the promise permanently pending with no error.
2. **`standardFontDataUrl` is mandatory** or rendering silently stalls on any
   document using standard-14 fonts (Helvetica/Times/Courier — i.e. most PDFs).
   Text *extraction* works fine without it, which makes this trivial to ship broken.
   Assets are served from `/pdfjs/` (`standard_fonts/`, `cmaps/`, `wasm/`).
3. Rendering is driven by `requestAnimationFrame`, so it **stalls in a hidden or
   background tab** and resumes when visible. Not a bug — affects automated testing.
4. Worker is at `/pdf.worker.min.mjs` (copied from node_modules into `public/`).
   **Keep it in sync with the pdfjs-dist version** or it fails at runtime.

**qrcode.react** writes an inline `width/height: {size}px`. Inside a flex
container the inline *width* gets shrunk while the *height* does not → a
distorted, non-square QR. Fix: pass `style={{width:"100%",height:"auto"}}`,
which the library spreads last.

**Tailwind v4** — `sm:`/`lg:` are **viewport** queries. In a nested two-pane
layout they fire based on the window, not the pane, packing 4 columns into
350px. Use `@container` on the wrapper and `@md:`/`@xl:` variants.

**Next.js static export**
- `opengraph-image.tsx` routes need `export const dynamic = "force-static"`.
- They emit **extensionless** files; Firebase serves them as
  `application/octet-stream`. `firebase.json` has a `Content-Type: image/png`
  header rule for `**/opengraph-image` — **do not remove it** or every social
  preview breaks.
- A route marked `"use client"` **cannot export `metadata`**. `/contact` had a
  duplicate title for this reason; it is now split into `page.tsx` (server) +
  `ContactForm.tsx` (client).

**React patterns that bit us**
- Gating an element on state that only its own effect can set = deadlock
  (canvas ref stays null, effect bails, nothing renders). Hit in `WatermarkRemover`.
- `{cond && <figure>…}` **unmounts** the element; a remounted `<canvas>` is blank
  because the paint only happens on upload. Use `className={cond ? "" : "hidden"}`.
- Anything reading `localStorage`/`IndexedDB`/`Date.now()` during render breaks
  hydration on a prerendered page. Read on mount, deferred off the sync path.

**Domain availability:** DNS/NS lookups give **false positives** — investors hold
names without nameservers. Use RDAP:
```bash
curl -s -o /dev/null -w "%{http_code}" https://rdap.verisign.com/com/v1/domain/NAME.com
# 404 = available, 200 = registered
```

---

## 6. Things that were broken and are now fixed

| Issue | Detail |
|---|---|
| Fake `aggregateRating` | 4.9 / 1480 ratings on all pages with no real reviews — Google structured-data spam violation. Removed; never re-add. |
| **PdfToWord was fake** | Ignored the upload entirely, emitted 3 hardcoded lines. Now does real pdf.js text extraction. |
| Duplicate title suffix | `"X \| EverydayTools \| EverydayTools"`. Fixed via `title: { absolute }`. |
| SVG OG image | Ignored by every platform. Now real PNGs via `next/og`. |
| AdSense never filled | Push was guarded on `window.adsbygoogle` existing. |
| QR distorted 1:2.5 | See qrcode.react gotcha. |
| QR exports blurry | Export read the 240px preview canvas and upscaled to 1024/2048. Now a dedicated full-res export canvas. |
| Watermark tool dead | Canvas deadlock (above). Also: brush was sized in image px → 3.5 screen px on a 14MP photo. Now sized in screen px. |
| FAQ invisible to crawlers | Accordion only rendered open answers. Now `<details>`. |
| Multi-word search broken | Matched whole query as one substring, so "rs to" found nothing. Now tokenised with synonym groups. |

## 7. ⚠️ KNOWN PROBLEMS — unresolved

1. **`pdf-compressor` does not compress.** It only inspects (page count, title,
   author). The registry name is honest; the long-form content was corrected to
   match. Do not re-describe it as a compressor. True PDF compression needs image
   codecs pdf-lib doesn't have.
2. **`ai-explainer` makes zero network calls** — canned local responses, not AI,
   despite the "AI-Powered Tools" category.
3. **Most tools have never been functionally tested.** Only these were verified
   end-to-end with real files: PdfToWord, PdfToJpg, WatermarkRemover, QR,
   CurrencyConverter, ImageResizer, SampleFileGenerator. Given two tools turned
   out to be stubs, **assume others may be too until proven otherwise.**
   A page loading without console errors does NOT mean the tool works.
4. **AdSense earns nothing.** `lib/ads/config.ts` has no real numeric slot IDs, so
   `AdSlot` renders nothing (deliberately — empty boxes violate policy). Create
   units in AdSense and paste the numeric IDs. Approval on a `.web.app` subdomain
   is doubtful.
5. **7 pre-existing lint errors** (listed in §4).

## 8. Decisions made (don't silently reverse)

- **Privacy claims are conditional.** `NETWORK_TOOLS` in `ToolShell.tsx` lists
  tools that contact a server (currently only `currency-converter`); they show
  "Live data · needs internet" instead of "Client-Side Private". Add any new
  network-dependent tool to that set.
- **File history is opt-out, not opt-in**, 7-day TTL, 3 per tool, 25MB cap.
  The privacy policy (§4/§5 of `/privacy`) describes this accurately and there is
  a "Clear all local data" control. If you change retention, update that page.
- **`WIDE_LAYOUT_TOOLS`** in `ToolShell.tsx` — workspace-style tools break out to
  full width. Currently qr-code-generator, crop-image, watermark-remover,
  image-compressor, image-resizer, favicon-generator, pdf-to-jpg.
- **Sitemap `lastModified` uses a fixed constant** (`CONTENT_LAST_UPDATED`), not
  `new Date()`. Building with the current time marks every URL modified on every
  deploy and erodes crawl trust.
- **No FAQ rich-result expectations.** Google restricted these to authoritative
  gov/health sites in Aug 2023. The schema is valid and harmless; don't count on it.

## 9. Domain — RESOLVED

**`tabbench.com` purchased.** Site rebranded from EverydayTools to TabBench
across 32 files.

**Deliberately NOT renamed** (these are Firebase/browser identifiers, not brand):
- `.firebaserc` → project id `everydaytools-s`
- `lib/firebase.ts` → `authDomain`, `projectId`, `storageBucket`
- `lib/history/results.ts` → IndexedDB name `everydaytools_history`
  (renaming would orphan files already stored in users' browsers)

**Still outstanding:**
- Connect `tabbench.com` as a Firebase custom domain and wait for the SSL cert
  **before deploying** — the build now emits `https://tabbench.com` canonicals.
- New Search Console property + verification token. The old token was removed
  from `app/layout.tsx`; add the new one to `metadata.verification.google`.
- `SITE_CONFIG.twitterHandle` is set to `@tabbench` — register it or change it.
- Set up both apex and `www`, one redirecting to the other.
- `public/ads.txt` publisher ID is unchanged and still valid.

## 10. Realistic SEO position

Content and technical SEO are now solid. What is **not** solved, and what
actually determines rankings:

- **Zero backlinks.** Dominant ranking factor.
- **Zero domain authority** (see §9).
- **Site is ~4 days old.**

A 7/10 domain with 50 backlinks beats a 9/10 with none. Do not expect ranking
movement for 3–6 months even after the domain move. Target long-tail
("compress image to 50kb for exam form"), not head terms.

## 11. Commands

```bash
npx next build                     # build → out/
npx tsc --noEmit                   # typecheck
npx eslint .                       # lint (7 known pre-existing errors)
firebase emulators:start --only hosting --project everydaytools-s   # serves out/ on :5002 (5000 is taken by AirPlay on macOS)
firebase deploy --only hosting
```

**Test tools with real files, not smoke tests.** A page that loads without
console errors can still be completely non-functional — that is exactly how the
fake PdfToWord and the deadlocked WatermarkRemover both passed review.
