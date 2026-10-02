/**
 * How a tool is recognised at a glance: every category has its own colour,
 * and tools tied to a file format or a named calculation carry a short label
 * ("PDF", "JPG", "GST") on their icon, the way a file icon shows its type.
 *
 * Class strings are written out in full (not assembled) so Tailwind can see
 * them at build time.
 */

export interface CategoryTone {
  /** Icon tile: tinted background, strong icon colour, hairline ring. */
  tile: string;
  /** Solid label ("PDF") sitting on the tile's corner. */
  badge: string;
}

const TONES: Record<string, CategoryTone> = {
  calculators: {
    tile: "bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-400/15 dark:text-emerald-300 dark:ring-emerald-400/25",
    badge: "bg-emerald-700 text-white dark:bg-emerald-500 dark:text-emerald-950",
  },
  "date-time": {
    tile: "bg-orange-50 text-orange-700 ring-orange-600/15 dark:bg-orange-400/15 dark:text-orange-300 dark:ring-orange-400/25",
    badge: "bg-orange-700 text-white dark:bg-orange-400 dark:text-orange-950",
  },
  text: {
    tile: "bg-blue-50 text-blue-700 ring-blue-600/15 dark:bg-blue-400/15 dark:text-blue-300 dark:ring-blue-400/25",
    badge: "bg-blue-700 text-white dark:bg-blue-400 dark:text-blue-950",
  },
  developer: {
    tile: "bg-cyan-50 text-cyan-800 ring-cyan-700/15 dark:bg-cyan-400/15 dark:text-cyan-300 dark:ring-cyan-400/25",
    badge: "bg-cyan-800 text-white dark:bg-cyan-400 dark:text-cyan-950",
  },
  "api-http": {
    tile: "bg-indigo-50 text-indigo-700 ring-indigo-600/15 dark:bg-indigo-400/15 dark:text-indigo-300 dark:ring-indigo-400/25",
    badge: "bg-indigo-700 text-white dark:bg-indigo-400 dark:text-indigo-950",
  },
  "random-fun": {
    tile: "bg-rose-50 text-rose-700 ring-rose-600/15 dark:bg-rose-400/15 dark:text-rose-300 dark:ring-rose-400/25",
    badge: "bg-rose-700 text-white dark:bg-rose-400 dark:text-rose-950",
  },
  "image-media": {
    tile: "bg-violet-50 text-violet-700 ring-violet-600/15 dark:bg-violet-400/15 dark:text-violet-300 dark:ring-violet-400/25",
    badge: "bg-violet-700 text-white dark:bg-violet-400 dark:text-violet-950",
  },
  "pdf-docs": {
    tile: "bg-red-50 text-red-700 ring-red-600/15 dark:bg-red-400/15 dark:text-red-300 dark:ring-red-400/25",
    badge: "bg-red-700 text-white dark:bg-red-400 dark:text-red-950",
  },
  security: {
    tile: "bg-teal-50 text-teal-800 ring-teal-700/15 dark:bg-teal-400/15 dark:text-teal-300 dark:ring-teal-400/25",
    badge: "bg-teal-800 text-white dark:bg-teal-400 dark:text-teal-950",
  },
  business: {
    tile: "bg-amber-50 text-amber-800 ring-amber-700/15 dark:bg-amber-400/15 dark:text-amber-300 dark:ring-amber-400/25",
    badge: "bg-amber-800 text-white dark:bg-amber-400 dark:text-amber-950",
  },
  "ai-tools": {
    tile: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/15 dark:bg-fuchsia-400/15 dark:text-fuchsia-300 dark:ring-fuchsia-400/25",
    badge: "bg-fuchsia-700 text-white dark:bg-fuchsia-400 dark:text-fuchsia-950",
  },
};

const FALLBACK: CategoryTone = {
  tile: "bg-muted text-foreground ring-border",
  badge: "bg-foreground text-background",
};

export function categoryTone(category: string | undefined): CategoryTone {
  return (category && TONES[category]) || FALLBACK;
}

/**
 * Short label for tools defined by a format or a named calculation. For
 * converters it is the output format — what you walk away with. Tools whose
 * icon already says everything (a stopwatch, a crop) have none.
 */
export const TOOL_BADGES: Record<string, string> = {
  // PDF & documents
  "image-to-pdf": "PDF",
  "pdf-to-word": "DOCX",
  "pdf-to-jpg": "JPG",
  "unlock-pdf": "PDF",
  "pdf-merge": "PDF",
  "pdf-page-counter": "PDF",
  "split-pdf": "PDF",
  "rotate-pdf": "PDF",
  "add-page-numbers": "PDF",
  "pdf-editor": "PDF",
  // Images & media
  "png-to-jpg": "JPG",
  "jpg-to-png": "PNG",
  "png-to-svg": "SVG",
  "image-to-webp": "WEBP",
  "webp-to-jpg": "JPG",
  "favicon-generator": "ICO",
  "exif-viewer": "EXIF",
  "qr-code-generator": "QR",
  "qr-code-scanner": "QR",
  "video-cutter": "MP4",
  "audio-remover": "MP4",
  // Developer
  "json-formatter": "JSON",
  "json-to-csv": "CSV",
  "json-to-typescript": "TS",
  "base64-converter": "B64",
  "jwt-decoder": "JWT",
  "uuid-generator": "UUID",
  "url-encoder-decoder": "URL",
  "html-entity-converter": "HTML",
  "regex-tester": ".*",
  "markdown-table-generator": "MD",
  "color-converter": "HEX",
  "cron-explainer": "CRON",
  "contrast-checker": "AA",
  // API & HTTP
  "http-status-code-lookup": "404",
  "http-header-viewer": "HDR",
  "http-header-generator": "HDR",
  "http-method-reference": "GET",
  "user-agent-parser": "UA",
  "url-parser": "URL",
  "query-parameter-parser": "?=",
  "query-string-builder": "?=",
  "api-request-builder": "API",
  "curl-generator": "CURL",
  "curl-to-fetch": "FETCH",
  "curl-to-axios": "AXIOS",
  "curl-to-python": "PY",
  "curl-to-javascript": "JS",
  "mime-type-lookup": "MIME",
  "content-type-lookup": "CT",
  "internet-speed-test": "Mbps",
  "regex-builder": ".*",
  // Random
  "coin-flip": "H/T",
  "dice-roller": "d20",
  "random-number-generator": "RNG",
  // Calculators & finance
  "gst-calculator": "GST",
  "emi-calculator": "EMI",
  "sip-calculator": "SIP",
  "bmi-calculator": "BMI",
  "currency-converter": "FX",
  // Date & time
  "unix-timestamp-converter": "UNIX",
  "time-converter": "12/24",
  // Business
  "utm-builder": "UTM",
  // Security
  "hash-generator": "SHA",
  // AI
  "image-to-text": "OCR",
  "ai-explainer": "AI",
  "ai-text-summarizer": "AI",
  "ai-text-rewriter": "AI",
  "ai-text-simplifier": "AI",
  "ai-keyword-extractor": "AI",
  "ai-json-explainer": "AI",
};
