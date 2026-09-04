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

- **52 tools** (~925 words avg), 6 guides, 12 currency pairs, 9 categories
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
| **PDF editor could not edit** | Detected AcroForm fields only. Real invoices/receipts have none, so the tool appeared dead — it offered a blank "New text" box and nothing else. Now uses `getTextContent()` to locate every painted text run and make it click-to-edit. |
| **Form field value invisible** | Field ink came from the shared `textColor` state, whose palette includes white → white text on the field's white widget background. The side panel paints with theme colours so the value showed there while the page and the export were blank. `legibleInk(ink, bg)` now guards both canvas and export. |
| **Field preview never matched the export** | Three separate divergences: the preview painted a hardcoded `bg-white` while the export painted `a.bgColor`; the preview clamped font size to `min(26, max(8, size*scale))` while the export used raw points; and the preview inset text by a fixed `px-1.5` while pdf-lib insets by exactly 1pt. All three now derive from the same values. |
| **Field background sampled once** | `bgColor` was sampled at the default drop point and never again, so a dragged field kept the colour of where it was first inserted. Also sampled *around* the box (right for covering a text run, wrong for a widget fill). Now `sampleFillUnder` takes the modal colour *inside* the rect, re-sampled when a gesture settles. |
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


## 12. Video downloader — architecture (added 23 Aug 2026)

**The site cannot download from platforms on its own.** `output: "export"` means
there is no server, and a browser cannot: CORS blocks reading the response,
stream URLs are signature-signed, and above 360p video and audio are separate
streams needing ffmpeg to mux.

**Verified dead (Aug 2026)** — the old client-only approach relied on these and
all are blocked: every public Invidious instance (403/401/dead), allorigins.win,
corsproxy.io (403). TikTok's CDN resolves then answers **503**. Do not try to
"fix" this by swapping in new mirrors; they get blocked within weeks.

### The bug that made it look broken
`resolveVideoUrl()` had a **silent fall-through**: when a platform resolver
failed it dropped to the direct-link branch and returned the *page* URL as if it
were a stream. The player got an HTML document as its `src` (blank) and
"download" saved HTML. Now every unresolvable link returns
`{ unsupported, reason, suggestion }` and the UI shows it.

### Key distinction
`<video src>` does **not** require CORS; `fetch()` does. A video can play
perfectly and still fail to download. The download path falls back to anchor
navigation, which is not subject to CORS.

### The optional backend — `/server`
Deployed **separately** (Cloud Run / Railway / Fly / VPS). Node + Express +
`yt-dlp` + `ffmpeg` in a Docker image.

- `GET /api/info?url=` → title, duration, thumbnail, format list
- `GET /api/download?url=&format=&audio=` → streams the file (piped, never
  buffered to disk)
- Rate limited, SSRF-guarded, size-capped, CORS allowlisted

**Activate by setting `NEXT_PUBLIC_VIDEO_API=https://your-service`.**
Without it the site handles direct media URLs only and says so — that is the
safe default, so nothing breaks if the service is down.

Client lives in `lib/video/backend.ts`; `detectPlatform()` there recognises 10
platforms from the URL.

**Rebuild the image regularly** — platforms change signature algorithms and an
outdated yt-dlp stops working within weeks.

**Note:** the AdSense-policy concern about hosting platform downloaders was
raised and the owner decided to proceed. Not re-litigated.


## 13. ffmpeg.wasm tools (video-cutter, audio-remover)

Engine: `@ffmpeg/ffmpeg` + self-hosted core in `public/ffmpeg/` (~32MB wasm).
Loader is `lib/media/ffmpeg.ts` — lazy, so the core is fetched only when one of
these tools runs, never on page load.

**SINGLE-THREADED core is deliberate.** The multi-threaded build needs
SharedArrayBuffer, which requires site-wide COOP/COEP headers — and those break
third-party embeds **including AdSense**. Slower, but it does not cost the rest
of the site. Do not "optimise" this without understanding that trade.

Both tools use `-c copy` (stream copy), never a re-encode:
- cutter: `-ss/-to` + `-c copy` → instant and lossless, but lands on the nearest
  preceding keyframe (~1-2s). Frame accuracy would require re-encoding.
- remover: `-an -c copy` to mute, `-vn -acodec copy` to extract as .m4a.

`public/ffmpeg/` adds ~32MB to every deploy. Keep it in sync if
`@ffmpeg/core` is upgraded.

---

## 14. PDF editor — click-to-edit (added 23 Aug 2026)

**The problem it solves.** A PDF stores positioned glyphs, not sentences, and
fonts are subset-embedded, so an existing string genuinely cannot be rewritten in
place. The first build exposed that limitation directly (cover, then add text)
and users read it as broken.

**How click-to-edit works.** On load, per page:
```
page.getTextContent()  →  per-run text matrix
pdfjs.Util.transform(viewport(scale:1).transform, item.transform)
  → t[4]=left, t[5]=baseline (top-down), hypot(t[2],t[3])=font size
```
stored as page fractions in `TextRun[]`. Clicking one:
1. samples the **modal colour just outside** the box → the cover colour
2. samples the **darkest pixel inside** the box → the ink colour
3. emits a whiteout at the box (+~1.2pt bleed) and a text annot at the same
   x/y/size, pre-filled with the original string, then focuses the textarea

Verified against a generated invoice: export placed replacements at
`x=50 y=640 size=11.0` and `x=60 y=568 size=12.0` — **identical** to the
originals. Text on a coloured band got cover `rgb(231,240,255)`, not white.

**Gotchas**
- Covers are emitted **before** other annots in `save()`, or a replacement added
  in the same click lands underneath its own whiteout.
- On-screen font size must be `size * (stageW / pageWidthPts)` via a
  `ResizeObserver`. The preview is a scaled bitmap; a fixed multiplier makes the
  preview disagree with the exported file.
- Colour sampling reads the page bitmap through a `willReadFrequently` context
  decoded once per page — do not make it async per click.
- **Covering is not redaction.** The original text stays in the content stream
  and extraction still returns it (verified: both old and new strings present).
  The UI warns on whiteout select; do not soften that copy.
- Scanned PDFs yield zero runs. The UI says so and falls back to Cover + Add text.


---

## 15. PDF editor — form fields (audited 24 Aug 2026)

Fields added in the editor are now written as **real AcroForm fields**, so the
exported file can be reopened and refilled without redoing the layout.

### Bugs found and fixed in this pass

| Bug | Detail |
|---|---|
| **Empty field left the original text showing** | Export only painted a cover when the field had a value (`else if (textVal)`). Clearing a value therefore revealed whatever was underneath. The widget now carries an opaque `/BG`, which paints whether or not there is a value. |
| **"Fields" were never real fields** | Export drew static text, so the saved PDF had no fillable fields at all — the entire point of the feature. Now uses `form.createTextField/createCheckBox/createDropdown` + `addToPage`. |
| **Checking a checkbox crashed the whole export** | It drew a literal `"✓"`, and `WinAnsi cannot encode "✓" (0x2713)` — verified, it throws. Real checkboxes render from ZapfDingbats via pdf-lib, so the glyph is never encoded by us. |
| **Cover colour hardcoded white** | `rgb(1,1,1)` scarred any coloured background. Now sampled from the page at insert time and stored as `bgColor`. |
| **Existing form fields went dead on save** | `save()` copied pages into a new document, orphaning the source AcroForm — widgets still rendered but were no longer listed, so a fillable form stopped being fillable. Export now edits the source document **in place**. |
| **Source fields were rendered twice** | They were written into the doc *and* redrawn as static text. Annots from the file carry `isSourceField` and are skipped on export. |
| **Blank field name made the on-canvas input read-only** | The input was controlled but its `onChange` matched annots by `fieldName`; an empty name matched nothing, so typing did nothing. Updates are keyed on annotation id now. |
| **Duplicate / invalid field names** | pdf-lib throws on duplicates, and `.` means hierarchy in a PDF field name. `sanitizeFieldName` + `uniqueFieldName` handle both (`customer.name` → `customername`, `agreed terms` → `agreed_terms`). |
| **Deleting a document field did nothing** | It only dropped the value from `fields`; the widget survived. Tracked in `removedFields` and removed via `form.removeField()`. |

### pdf-lib gotchas worth keeping

1. **`setFontSize()` must come AFTER `addToPage()`** — otherwise
   `No /DA (default appearance) entry found for field`. `addToPage` creates the /DA.
2. **`addToPage` defaults are a white background and a black 1pt border.** Pass
   `borderWidth: 0` and an explicit `backgroundColor`, or every field paints a box.
   `borderColor: undefined` works — the widget code is `if (borderColor)`, and the
   key being *present* is what skips the default.
3. **Never `drawText("✓")`** with a standard font. WinAnsi cannot encode it.
4. **In-place page reorder** is `removePage()` for every index, then
   `insertPage(i, page)` in the new order. Skipped entirely unless the order
   actually changed, so the common single-page case never touches the page tree.
5. `doc.save()` regenerates field appearances and can throw on a value the
   field's font cannot encode. Export falls back to
   `save({ updateFieldAppearances: false })`.

### Verified end-to-end

Added a field over existing text, cleared its value, exported:
- exported field is a real `PDFTextField` with `/MK << /BG [1 1 1] /R 0 >>`
- reopening the export lists it as a **document** field, not a session one
- pixels inside the field rect: **0.44% dark**; the same text line just outside
  it: **27.27% dark** — the original text is genuinely covered
- checkbox export completes with no error and round-trips as a checked `checkbox`


---

### Form fields — verified against a rendered export (25 Aug 2026)

**Verify by rasterising the exported PDF, not by round-tripping numbers.**
`addToPage(y)` vs `getRectangle().y` share a convention, so comparing them
proves nothing. macOS has no `pdftoppm`, but Quick Look works:

```bash
qlmanage -t -s 1200 -o outdir file.pdf   # -> outdir/file.pdf.png
```

A drawn magenta rectangle at the same coords as a widget confirmed pdf-lib's
`addToPage` y is bottom-left and lands exactly where intended — **geometry was
never the bug.** What the render exposed was that the field's opaque white
background was *erasing the page text it landed on* (an address line came out as
`A-16 UGF1 Rail v` + white gap + `ziabad`).

- **A form field must not destroy document content.** New fields are now
  `bgColor: undefined` → no `/BG` → the page shows through. pdf-lib defaults
  `backgroundColor` to opaque white when the key is *absent*, so it has to be
  passed explicitly as `undefined`.
- Covering is still available but **opt-in**, via Background `None` / `Cover` /
  colour on each row in the Forms panel. `Cover` runs `sampleFillUnder` once at
  the current position; it does not silently re-sample.
- `findBlankSpot()` places new fields in an empty band instead of a hardcoded
  20%/25%, which landed on body text on most real documents.

### Field preview/export fidelity (25 Aug 2026)

Measured, not assumed: the widget **rectangle** was already exact. Insert at
`left 0.2000 top 0.2500 w 0.1600 h 0.0280` exported to the identical fractions,
and so did a dragged field at `0.0529 / 0.3309`. The mismatch was everything
*inside* the box.

- Preview and export must read the **same** `a.bgColor` with the same default.
  A hardcoded `bg-white` in the preview hides any mismatch until export.
- pdf-lib insets field text by exactly **1pt** (`borderWidth 0 + padding 1`,
  see `api/form/appearances.js`). The preview matches with `1 * scale` px.
- Preview font size must be `size * scale` with **no clamp**; the old
  `min(26, max(8, …))` silently disagreed with the exported point size.
- `sampleFillUnder` quantises at **5 bits** per channel and then averages the
  real pixels in the winning bucket. 3 bits put white paper and a pale tint in
  the same bucket; reconstructing from the bucket midpoint rendered white as
  `#f0f0f0`.
- Re-sampling lives in an effect keyed on `[annots, pageIndex, gestureSettled]`,
  **not** in `endDrag`. `endDrag` also fires on pointerleave, and the last
  pointermove is the final `annots` change — it lands while `dragRef` is still
  set, so an `endDrag`-based resample reads the previous position and lags by
  exactly one move. `gestureSettled` is the explicit nudge that fixes it.

## 16. SEO — additive pass (25 Aug 2026)

**Nothing was removed.** Every pre-existing title, description, canonical,
JSON-LD block, sitemap entry and robots rule is intact; the diff is additive
plus two defect fixes.

**Baseline found by auditing `out/`, not source** — 96 pages, all with title,
description, canonical, og:title, twitter:card; 702 JSON-LD blocks; zero fake
ratings; zero localhost/`.web.app` leaks; canonicals correctly self-referential.

**Fixed**
1. **36 pages shipped with no `og:image` / `twitter:image`** (categories 9,
   convert 12, guides 8, static 7). Cause: Next replaces the `openGraph` object
   wholesale rather than merging, so any page setting `openGraph` without
   `images` silently loses the root layout's. Tool pages were unaffected only
   because they have an `opengraph-image.tsx` file. Now 97/97.
2. **`/tools/pdf-editor` rendered two `<h1>`** — the widget had its own heading
   competing with ToolShell's. Demoted to `<p>`; ToolShell owns the page h1.

**Added**
- `lib/seo/og-template.tsx` — one OG card design, plus `clampForOg()`.
- `opengraph-image.tsx` for `categories/[category]`, `guides/[slug]`,
  `convert/[pair]` — 29 tailored cards. Firebase's existing
  `**/opengraph-image` Content-Type rule already covers the nested paths.
- `constructPageMetadata({ ogImage })` — defaults to the site card; pass
  **`null`** on any route owning an `opengraph-image.tsx`, or the metadata
  `images` overrides the tailored card.
- `/categories` hub. The 9 category pages previously had no crawlable parent
  (header dropdown only). Linked from footer + both nav menus + sitemap.
- `scripts/seo-check.mjs`, wired as **`postbuild`** so every export is gated,
  and as `npm run seo:check`.

**The check is verified to fire** — tested against 7 injected defects: missing
og:image, canonical pointing at the homepage, duplicate `<h1>`,
`aggregateRating`, `.web.app` in a URL, a broken internal link, and `noindex`.
All caught, exit 1. Do not let it become a check that always passes: if you
change it, re-run the injection test.

**Do not** apply the "put `<link rel="canonical" href="https://tabbench.com">`
on every page" advice that circulated — it tells Google all 97 pages duplicate
the homepage. `seo-check.mjs` now errors on exactly that.


---

## 17. SEO — second additive pass (25 Aug 2026)

**Removed: none.** Additive plus four defect fixes surfaced by extending the
validator.

**Verified live** (not just locally):
```
http://tabbench.com        -> 301 https://tabbench.com/   OK
https://tabbench.com       -> 200                          OK
https://www.tabbench.com   -> connection refused           www is NOT configured
https://everydaytools-s.web.app -> 200, canonical -> tabbench.com
```
The deployed build is current: `/categories` is live, per-page `og:image` is
live, sitemap serves 95 URLs.

**`www` is a dashboard action, not a code change.** Firebase `redirects` in
`firebase.json` match on *path*, not host, and with `output: "export"` there is
no server to branch on `Host`. Adding `www.tabbench.com` as a redirect domain
must be done in the Firebase Hosting console. Today `www` simply does not
resolve, so it creates no duplicate — it only loses any traffic linked that way.

**Fixed (all found by the new checks, all previously invisible):**
1. **`.slice(0, 8)` / `.slice(0, 5)` in the related blocks** always took the
   *first* N in registry order, so the tail of `CURRENCY_PAIRS` and `GUIDES` was
   never linked from anywhere — three corridors and two guides had a single
   inbound link. Both now **rotate** the window by the current item's index,
   which guarantees every sibling is linked from somewhere.
2. `/about` jumped h1 -> h3 (feature cards had no section heading).
3. `/contact` jumped h1 -> h3 — the h3s were the **footer** columns. Footer
   headings are now h2: they sit in their own landmark and should not dangle
   under the page h1.
4. Promoting the footer then exposed **h2 -> h4** in four tool widgets
   (WordCounter, SampleFileGenerator, ProfitMarginCalculator, PdfEditor) that
   the footer's h3 had been masking. Now h3.

**`scripts/seo-check.mjs` gained** (Phases 20/21/25/28/29):
- orphan detection — **error** at 0 inbound internal links, **warn** at 1-2
- `<img>` without `alt` — error
- skipped heading levels — warn
- structured-data coverage line, so a page type silently losing schema shows up

Current: **0 errors, 0 warnings**, 95 indexable pages.
`Organization 95 · WebSite 95 · BreadcrumbList 94 · FAQPage 86 ·
WebApplication 57 · CollectionPage 12 · Article 8`

**Deliberately not done, with reasons:**
- **Sitemap index / split sitemaps** — 95 URLs against Google's 50,000 limit.
  Splitting adds moving parts and buys nothing.
- **Search Console query data** — no API access from here. Never invent
  impressions, CTR or positions to justify a change.
- **Core Web Vitals field data** — cannot be measured from a build. What is
  measurable: 3.6 MB raw JS over 36 chunks (largest 448 KB); ffmpeg (31 MB) and
  pdf.js (3.9 MB) are in `public/` and lazy-loaded, so they stay out of the
  initial payload; the only third-party script is AdSense, already `async` with
  a `preconnect`.
- **AdSense on every page while `lib/ads/config.ts` has no slot IDs** — a
  third-party connection on every page for zero fill. Flagged, not removed:
  removing it is a product decision, and the intent is to enable ads.


---

## 18. Only tabbench.com is indexable (25 Aug 2026)

**Firebase serves the project on THREE hostnames, not two.** The old guard only
covered `everydaytools-s.web.app`. `everydaytools-s.firebaseapp.com` was also
live, returning 200 with `<meta name="robots" content="index, follow">`.
Neither can be switched off in Firebase.

Guard now lives in `lib/seo/canonical-host.ts`:
1. suffix test on `.web.app` / `.firebaseapp.com`
2. sets `robots` to `noindex, follow` **before** redirecting, so a crawler that
   renders but does not follow a JS navigation still gets the signal
3. `location.replace` to `https://tabbench.com` + path

**It is a plain inline `<script>`, deliberately not `next/script`.** With
`strategy="beforeInteractive"` Next serialises the code into its
`self.__next_s` queue, so it only runs after the framework bundle loads. A raw
inline tag in `<head>` executes immediately with no chunk dependency. Do not
"modernise" this back to `<Script>`.

**Why not robots.txt `Disallow` on the duplicate:** blocking crawl stops Google
ever seeing the canonical or the noindex, stranding whatever is already indexed.
Disallow is the wrong tool for removing pages.

**Why not a server-side 301:** `firebase.json` redirects match on *path*, not
host, and `output: "export"` means there is no server to read the Host header.
A Cloud Function rewrite could, but routing every request through a function to
fix canonicalisation is a bad trade.

**The check RUNS the guard, it does not grep for it.** `seo-check.mjs` extracts
the emitted script and executes it against real hostnames, asserting it
redirects + noindexes both Firebase hosts and — the direction that actually
matters — that it does **nothing** on `tabbench.com`, `www.tabbench.com`,
`localhost` and `127.0.0.1`. An over-escaped regex ships a guard that never
fires and looks identical under grep.

### Unblocking the new calculators

Seven components were written against APIs that did not exist yet. Both were
extended **additively**, so every existing call site is untouched:
- `ResultCard` accepts `label` (alias for `title`), `formulaExplanation`
  (falls back into the `subtitle` slot), `copyText` (overrides what the copy
  button writes) and `shareTitle`. The card already implemented copy and share,
  so these are overrides for existing behaviour, not new features.
- `downloadBlob(blob, filename, toolSlug?)` — `recordResult` already took an
  optional slug; it is now forwarded.

Site is **115 pages / 77 tools** as a result.


---

## 19. AI architecture (25 Aug 2026)

**Site is 121 pages / 83 tools.**

### The 404 that only happened in production

`lib/ai/providers/gemini-provider.ts` used to `POST /api/ai/generate`. That
route exists in the source and works under `npm run dev`, but:

```
next.config.ts:  output: process.env.NODE_ENV === "production" ? "export" : undefined
```

A static export **cannot emit API routes** — there is no server. `out/api` was
never created, Firebase served 404, and users saw *"Server AI processing failed
(404)"*. It looked perfect locally. This is the trap to remember: **anything
under `app/api/` silently disappears in production.**

Fixed by calling **Firebase AI Logic directly from the browser**. That is the
right fit for a static site: it brokers the model call, so no Gemini API key is
shipped. Prompts were carried over verbatim so results match what dev produced.

### The three-link chain (each hid the next)

1. API route 404 → now calls AI Logic directly
2. AI Logic not enabled → enabled in console
3. **App Check enforced but no client token** → the console read
   `0% verified / 100% unverified` with status `Basic - Enforced`, so every
   request would have been rejected anyway

`ensureAppCheck()` in `lib/firebase.ts` fixes (3). It is **lazy and
browser-only** on purpose: it pulls the reCAPTCHA Enterprise script, and paying
that on every page load when most of 83 tools never touch the network is waste.
Both cloud paths await it immediately before calling the model.

The reCAPTCHA **site** key is committed as a default. It is public by design and
committing it means the Firebase build needs no extra env setup — one less way
for production to differ from dev. The reCAPTCHA **secret** key is the sensitive
half and is not in this repo.

### Two engines, deliberately

- **On-device** (`lib/ai/nlp/*`, ~700 lines) — real TextRank/lexical
  implementations, not stubs. **All five shared AI tools default to `"local"`**,
  which is why the 404 only appeared when a user chose *Advanced Cloud*.
- **Cloud** (Gemini 2.5 Flash) — opt-in.

`components/tools/ImageToText.tsx` follows the same pattern: Tesseract.js
on-device by default (self-hosted from `/public/tesseract`, ~9.5MB lazy), Gemini
opt-in for handwriting/tables/non-Latin scripts. Verified 100% accurate on a
rendered invoice in ~1s. It is in `NETWORK_TOOLS` because the AI mode uploads —
the page must not claim an unconditional privacy guarantee.

### Leftovers — all cleared (25 Aug 2026)

1. **`app/api/ai/generate/route.ts` deleted**, along with `lib/ai/rate-limiter.ts`
   whose only importer it was. The route could never execute in a static export
   and hardcoded the Firebase API key. (`lib/firebase.ts` still contains that
   key as `firebaseConfig.apiKey` — that one is public by design and required.)
2. **The "DistilBART Summarizer" entry is gone.** `LOCAL_AI_MODELS` now carries
   a comment explaining why, so nobody re-adds a model claim the code does not
   implement. The heuristics are good; they are just not a neural model.
3. **`ai-explainer` asks a real model.** `customQuestion` was previously
   declared in state and never read — the tool was a static four-topic FAQ named
   "AI Formula Explainer". It now has an Ask-anything box wired to Gemini, with
   the curated answers kept and relabelled as hand-written.

### Audit findings (same pass)

- **`image-to-text` had no `content.ts` entry** — registry, route and component
  existed but the long-form content did not, leaving a thin page that carried an
  ad. Now 1,104 words.
- **Five AI tools claimed "Client-Side Private" while offering a cloud mode.**
  `ai-text-summarizer`, `ai-text-rewriter`, `ai-text-simplifier`,
  `ai-keyword-extractor`, `ai-json-explainer` all default to on-device and work
  offline, but each has an "Advanced Cloud" control that uploads the input. All
  are now in `NETWORK_TOOLS`. The badge is blunter than ideal — it reads "needs
  internet" for a tool that works offline by default — but erring toward a
  weaker claim beats advertising a privacy guarantee a visible control breaks.
- `lib/video/validators.ts` is unreferenced. Left in place; harmless.
- `CropImage`'s `fetch()` is a `data:` URL read, not a network call.


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
