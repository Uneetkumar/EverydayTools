/**
 * The tool database — the single source of truth for every tool's name,
 * copy, category, search terms and relationships. Search, navigation, the
 * homepage, category pages, related tools, SEO metadata, structured data and
 * the sitemap all read from here, so a rename happens in exactly one place.
 *
 * Adding a tool: add an entry to TOOL_SOURCE, long-form copy in content.ts,
 * a component in components/tools/, and a loader in
 * components/tool/tool-loaders.tsx.
 */

export interface ToolFaq {
  question: string;
  answer: string;
}

export interface ToolFormula {
  name: string;
  expression: string;
  explanation: string;
  example: string;
}

export type ToolCategoryId =
  | "calculators"
  | "business"
  | "date-time"
  | "text"
  | "developer"
  | "image-media"
  | "pdf-docs"
  | "security"
  | "ai-tools";

/**
 * Where a tool's data goes. Drives the privacy line on the tool page, so it
 * must be accurate — a privacy claim that is not true everywhere is worth
 * less than no claim at all.
 * - local: everything runs in the browser; nothing is sent anywhere.
 * - cloud-optional: on-device by default, with an opt-in cloud AI mode that
 *   sends the input to Google Gemini.
 * - network: needs a network service to work (see privacyNote).
 */
export type ToolPrivacy = "local" | "cloud-optional" | "network";

export interface ToolDefinition {
  slug: string;
  /** Precise, natural name. Used for the H1, cards and search. */
  name: string;
  /** Compact label for chips and tight lists. */
  shortName: string;
  /** One line, under ~80 characters: what the tool does, in plain words. */
  tagline: string;
  category: ToolCategoryId;
  /** Derived from TOOL_CATEGORIES — never set per tool. */
  categoryName: string;
  description: string;
  longDescription: string;
  iconName: string;
  privacy: ToolPrivacy;
  privacyNote?: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  /** Everyday phrasings people type ("reduce image size"), used by search only. */
  aliases: string[];
  features: string[];
  formulas?: ToolFormula[];
  faqs: ToolFaq[];
  /** Similar tools. */
  relatedToolSlugs: string[];
  /** Workflow continuation: what people usually do after this tool. */
  nextSteps: string[];
  isPopular?: boolean;
}

export type ToolSource = Omit<ToolDefinition, "categoryName" | "isPopular">;

export interface ToolCategory {
  id: ToolCategoryId;
  name: string;
  shortName: string;
  /** What someone can get done here, in one sentence. */
  description: string;
  icon: string;
  /** Hand-picked starting points shown first on the category page. */
  popular: string[];
}

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: "calculators",
    name: "Calculators & Finance",
    shortName: "Calculators",
    description: "Work out percentages, GST, loan EMIs, SIP returns, take-home pay and unit conversions.",
    icon: "Calculator",
    popular: ["percentage-calculator", "gst-calculator", "emi-calculator", "discount-calculator", "salary-calculator", "currency-converter"],
  },
  {
    id: "date-time",
    name: "Date & Time",
    shortName: "Date & Time",
    description: "Find your exact age, count days or business days between dates, convert timestamps and time things.",
    icon: "CalendarClock",
    popular: ["age-calculator", "date-difference-calculator", "working-days-calculator", "stopwatch-timer"],
  },
  {
    id: "text",
    name: "Text & Writing",
    shortName: "Text",
    description: "Count words, change case, compare, sort and clean text, or dictate and listen to it.",
    icon: "Type",
    popular: ["word-counter", "case-converter", "text-diff-checker", "text-sorter"],
  },
  {
    id: "developer",
    name: "Developer & Data",
    shortName: "Developer",
    description: "Format and validate JSON, encode Base64 and URLs, decode JWTs, test regex and convert data.",
    icon: "Code",
    popular: ["json-formatter", "base64-converter", "jwt-decoder", "regex-tester", "json-to-csv", "uuid-generator"],
  },
  {
    id: "image-media",
    name: "Image & Media",
    shortName: "Images & Media",
    description: "Compress, resize, crop and convert images, make QR codes and barcodes, and trim video.",
    icon: "Image",
    popular: ["image-compressor", "image-resizer", "crop-image", "qr-code-generator", "png-to-jpg", "image-to-webp"],
  },
  {
    id: "pdf-docs",
    name: "PDF & Documents",
    shortName: "PDF",
    description: "Edit, merge, split, rotate and convert PDFs, including PDF to Word and images to PDF.",
    icon: "FileText",
    popular: ["pdf-editor", "pdf-merge", "pdf-to-word", "image-to-pdf", "split-pdf", "pdf-to-jpg"],
  },
  {
    id: "security",
    name: "Security & Generators",
    shortName: "Security",
    description: "Generate strong passwords and cryptographic hashes without anything leaving your device.",
    icon: "Shield",
    popular: ["password-generator", "hash-generator"],
  },
  {
    id: "business",
    name: "Business & Marketing",
    shortName: "Business",
    description: "Price with confidence: profit margins, break-even points, ROI and campaign tracking links.",
    icon: "Briefcase",
    popular: ["profit-margin-calculator", "break-even-calculator", "utm-builder"],
  },
  {
    id: "ai-tools",
    name: "AI Tools",
    shortName: "AI",
    description: "Summarise, rewrite and simplify text, extract keywords, explain JSON and read text in images.",
    icon: "Sparkles",
    popular: ["ai-text-summarizer", "image-to-text", "ai-text-rewriter", "ai-text-simplifier"],
  },
];

/**
 * Curated discovery lists. Hand-picked until there is enough usage data to
 * rank by it; order is display order.
 */
export const POPULAR_TOOL_SLUGS = [
  "image-compressor",
  "pdf-editor",
  "percentage-calculator",
  "pdf-merge",
  "json-formatter",
  "qr-code-generator",
  "pdf-to-word",
  "word-counter",
  "image-resizer",
  "gst-calculator",
  "age-calculator",
  "ai-text-summarizer",
];

/** Recently added. */
export const NEW_TOOL_SLUGS = [
  "png-to-svg",
  "text-sorter",
  "unit-converter",
  "stopwatch-timer",
  "image-to-text",
  "calculator",
];

/** Useful tools people rarely think to look for. */
export const HIDDEN_GEM_SLUGS = [
  "sample-file-generator",
  "exif-viewer",
  "contrast-checker",
  "cron-explainer",
  "favicon-generator",
  "video-cutter",
  "utm-builder",
  "markdown-table-generator",
];

const TOOL_SOURCE: Record<string, ToolSource> = {
  "json-formatter": {
    "slug": "json-formatter",
    "name": "JSON Formatter",
    "shortName": "JSON Formatter",
    "tagline": "Format, validate and minify JSON with exact error locations.",
    "category": "developer",
    "description": "Format, validate, prettify, minify, and inspect JSON payloads with real-time error detection.",
    "longDescription": "A client-side developer utility to format unreadable JSON, detect syntax mistakes with exact line diagnostics, minify data, and inspect structures securely without data leaves your browser.",
    "iconName": "Braces",
    "privacy": "local",
    "metaTitle": "JSON Formatter | TabBench",
    "metaDescription": "Format, validate, prettify, and minify JSON payloads in your browser. Live syntax error diagnostics with zero server upload.",
    "keywords": [
      "json formatter",
      "json validator",
      "prettify json",
      "minify json",
      "json parser",
      "format json online",
      "beautify json",
      "json lint",
      "json viewer",
      "clean json",
      "json repair"
    ],
    "aliases": [
      "json validator",
      "json minifier",
      "json beautifier",
      "pretty print json",
      "json lint",
      "fix json"
    ],
    "features": [
      "Prettify with 2/4 spaces or tab",
      "Minify JSON",
      "Syntax error line indicators",
      "100% private in-browser"
    ],
    "faqs": [
      {
        "question": "Is my JSON stored?",
        "answer": "No. Everything runs purely in your local browser JavaScript memory."
      }
    ],
    "relatedToolSlugs": [
      "base64-converter",
      "jwt-decoder",
      "uuid-generator"
    ],
    "nextSteps": [
      "json-to-csv",
      "json-to-typescript",
      "ai-json-explainer",
      "base64-converter"
    ]
  },
  "percentage-calculator": {
    "slug": "percentage-calculator",
    "name": "Percentage Calculator",
    "shortName": "Percentage Calculator",
    "tagline": "Find X% of Y, percentage change and percentage difference.",
    "category": "calculators",
    "description": "Calculate percentages, percentage increases, decreases, and differences with instant step-by-step formulas.",
    "longDescription": "Instant math tool for students, finance managers, shoppers, and researchers. Solve X% of Y, percentage increase/decrease, and percentage difference instantly.",
    "iconName": "Percent",
    "privacy": "local",
    "metaTitle": "Percentage Calculator | TabBench",
    "metaDescription": "Calculate percentages, percentage increases, decreases, and differences with TabBench's free calculator. Includes formulas and instant calculations.",
    "keywords": [
      "percentage calculator",
      "percent increase",
      "percent decrease",
      "percentage difference",
      "calculate percentage",
      "percent of number",
      "percentage formula",
      "percent off calculator",
      "percentage ratio",
      "calculate percent online"
    ],
    "aliases": [
      "percent",
      "percentage increase",
      "percentage decrease",
      "marks percentage",
      "percent change"
    ],
    "features": [
      "X% of Y calculation",
      "% Increase/decrease",
      "% Difference",
      "Step-by-step formula cards"
    ],
    "formulas": [
      {
        "name": "Percentage of a Number",
        "expression": "P = (X / 100) × Y",
        "explanation": "Divide percentage by 100 and multiply by the total value.",
        "example": "15% of 200 = (15 / 100) * 200 = 30."
      }
    ],
    "faqs": [
      {
        "question": "How to calculate percent mentally?",
        "answer": "Find 10% by shifting the decimal left, then scale accordingly."
      }
    ],
    "relatedToolSlugs": [
      "discount-calculator",
      "gst-calculator",
      "emi-calculator"
    ],
    "nextSteps": [
      "discount-calculator",
      "gst-calculator",
      "profit-margin-calculator",
      "calculator"
    ]
  },
  "word-counter": {
    "slug": "word-counter",
    "name": "Word Counter",
    "shortName": "Word Counter",
    "tagline": "Count words, characters, sentences and reading time as you type.",
    "category": "text",
    "description": "Count words, characters, sentences, paragraphs, and estimate reading & speaking time in real-time.",
    "longDescription": "Essential writing utility for essayists, copywriters, and social media managers. Track character limits for Twitter/X, Instagram, LinkedIn, and calculate estimated reading duration.",
    "iconName": "LetterText",
    "privacy": "local",
    "metaTitle": "Word Counter | TabBench",
    "metaDescription": "Count words, characters, sentences, paragraphs, and reading time in real time. Perfect for essays, social media posts, and editorial drafts.",
    "keywords": [
      "word counter",
      "character counter",
      "word count online",
      "character count with spaces",
      "reading time calculator",
      "essay word counter",
      "twitter character counter",
      "paragraph counter",
      "sentence counter",
      "speaking time calculator"
    ],
    "aliases": [
      "character count",
      "letter count",
      "essay length",
      "reading time",
      "character counter"
    ],
    "features": [
      "Live words and characters counter",
      "Counts without spaces",
      "Sentence and paragraph breakdown",
      "Estimated reading time"
    ],
    "faqs": [
      {
        "question": "What is average reading speed?",
        "answer": "Average reading speed is 200 to 250 words per minute."
      }
    ],
    "relatedToolSlugs": [
      "case-converter",
      "text-diff-checker",
      "password-generator"
    ],
    "nextSteps": [
      "case-converter",
      "ai-text-summarizer",
      "text-diff-checker",
      "ai-keyword-extractor"
    ]
  },
  "password-generator": {
    "slug": "password-generator",
    "name": "Password Generator",
    "shortName": "Password Generator",
    "tagline": "Create strong random passwords with your choice of length and symbols.",
    "category": "security",
    "description": "Generate highly secure, cryptographically random passwords with customizable length, symbols, and memorability.",
    "longDescription": "Create uncrackable, cryptographically secure passwords using standard browser Crypto APIs. Customize length, uppercase, lowercase, numbers, and special symbols.",
    "iconName": "KeyRound",
    "privacy": "local",
    "metaTitle": "Random Password Generator | TabBench",
    "metaDescription": "Generate strong, cryptographically secure passwords with custom length, symbols, numbers, and strength scoring. 100% private.",
    "keywords": [
      "password generator",
      "random password generator",
      "strong password generator",
      "random password",
      "secure password generator",
      "random string generator",
      "random key generator",
      "generate password online",
      "crypto password maker",
      "secure pin generator"
    ],
    "aliases": [
      "random password",
      "strong password",
      "pin generator",
      "passphrase"
    ],
    "features": [
      "Cryptographically secure (window.crypto)",
      "Customizable length (6 to 64 chars)",
      "Symbol and number toggles",
      "Password strength meter"
    ],
    "faqs": [
      {
        "question": "Are passwords saved anywhere?",
        "answer": "Never. Passwords are generated directly on your device via CSPRNG."
      }
    ],
    "relatedToolSlugs": [
      "uuid-generator",
      "hash-generator",
      "base64-converter"
    ],
    "nextSteps": [
      "hash-generator",
      "uuid-generator"
    ]
  },
  "base64-converter": {
    "slug": "base64-converter",
    "name": "Base64 Encoder & Decoder",
    "shortName": "Base64",
    "tagline": "Encode text to Base64 or decode Base64 back to readable text.",
    "category": "developer",
    "description": "Encode text or decode Base64 strings instantly with live UTF-8 support and URL-safe mode.",
    "longDescription": "Convert plain text to Base64 and decode Base64 strings to readable UTF-8 text with instant one-click copy and error detection.",
    "iconName": "Binary",
    "privacy": "local",
    "metaTitle": "Base64 Converter | TabBench",
    "metaDescription": "Encode text to Base64 and decode Base64 strings to UTF-8 text instantly. Supports URL-safe format and real-time live conversion.",
    "keywords": [
      "base64 converter",
      "base64 encoder",
      "base64 decoder",
      "encode base64 online",
      "decode base64 to text",
      "base64 string to ascii",
      "utf8 base64 converter",
      "url safe base64",
      "base64 translator"
    ],
    "aliases": [
      "base64 encode",
      "base64 decode",
      "atob",
      "btoa"
    ],
    "features": [
      "Encode text to Base64",
      "Decode Base64 to UTF-8",
      "URL-safe format toggle",
      "Instant live preview"
    ],
    "faqs": [
      {
        "question": "What is Base64 used for?",
        "answer": "Base64 encodes binary data into ASCII characters for safe transmission in JSON, email, and URLs."
      }
    ],
    "relatedToolSlugs": [
      "jwt-decoder",
      "url-encoder-decoder",
      "json-formatter"
    ],
    "nextSteps": [
      "url-encoder-decoder",
      "jwt-decoder",
      "html-entity-converter"
    ]
  },
  "jwt-decoder": {
    "slug": "jwt-decoder",
    "name": "JWT Decoder",
    "shortName": "JWT Decoder",
    "tagline": "Decode a JWT's header and payload and check when it expires.",
    "category": "developer",
    "description": "Decode JSON Web Tokens (Header, Payload, Signature) and inspect expiration timestamps safely in your browser.",
    "longDescription": "Debug JWT authentication tokens client-side. Inspect user claims, issuer, algorithm, and check whether the token is expired or valid.",
    "iconName": "KeySquare",
    "privacy": "local",
    "metaTitle": "JWT Decoder | TabBench",
    "metaDescription": "Decode and inspect JSON Web Tokens (JWT) headers and payloads. Check token expiration status securely with zero network transmission.",
    "keywords": [
      "jwt decoder",
      "decode jwt",
      "jwt token inspect",
      "jwt expiration checker",
      "jwt payload viewer",
      "json web token decoder",
      "jwt debugger",
      "auth token viewer",
      "bearer token decoder"
    ],
    "aliases": [
      "json web token",
      "bearer token",
      "decode token"
    ],
    "features": [
      "Decodes Header and Payload",
      "Formatted JSON inspection",
      "Live token expiration status",
      "Zero network transmission"
    ],
    "faqs": [
      {
        "question": "Is it safe to paste JWT tokens here?",
        "answer": "Yes, decoding is performed purely in client JavaScript with no network requests."
      }
    ],
    "relatedToolSlugs": [
      "base64-converter",
      "uuid-generator",
      "json-formatter"
    ],
    "nextSteps": [
      "base64-converter",
      "json-formatter",
      "unix-timestamp-converter"
    ]
  },
  "uuid-generator": {
    "slug": "uuid-generator",
    "name": "UUID Generator",
    "shortName": "UUID Generator",
    "tagline": "Generate random v4 UUIDs one at a time or in bulk.",
    "category": "developer",
    "description": "Generate cryptographically secure Version 4 UUIDs (GUIDs) in bulk with uppercase, hyphen, and quote formatting.",
    "longDescription": "Generate random v4 UUIDs for database primary keys, API tokens, and unique identifiers. Bulk generation up to 100 UUIDs at once.",
    "iconName": "Hash",
    "privacy": "local",
    "metaTitle": "UUID & GUID Generator | TabBench",
    "metaDescription": "Generate cryptographically secure Version 4 UUIDs (GUIDs) individually or in bulk. Customize hyphens, uppercase, and quote formatting.",
    "keywords": [
      "uuid generator",
      "random uuid generator",
      "guid generator",
      "random id generator",
      "v4 uuid online",
      "bulk uuid generator",
      "unique identifier generator",
      "random guid",
      "generate uuid v4",
      "online guid maker"
    ],
    "aliases": [
      "guid",
      "unique id",
      "random id"
    ],
    "features": [
      "RFC 4122 compliant v4 UUIDs",
      "Bulk generation (1 to 100)",
      "Hyphen and uppercase options",
      "One-click copy all"
    ],
    "faqs": [
      {
        "question": "What is a UUID v4?",
        "answer": "A Version 4 UUID is a 128-bit number generated using cryptographically random numbers."
      }
    ],
    "relatedToolSlugs": [
      "password-generator",
      "base64-converter",
      "json-formatter"
    ],
    "nextSteps": [
      "password-generator",
      "hash-generator",
      "sample-file-generator"
    ]
  },
  "url-encoder-decoder": {
    "slug": "url-encoder-decoder",
    "name": "URL Encoder & Decoder",
    "shortName": "URL Encoder & Decoder",
    "tagline": "Percent-encode text for URLs, or decode an encoded URL.",
    "category": "developer",
    "description": "Encode query parameters and special characters into percent-encoded URL format, or decode URLs to plain text.",
    "longDescription": "Quickly percent-encode URL strings and decode encoded URLs. Supports full URL encode and encodeURIComponent modes.",
    "iconName": "Link",
    "privacy": "local",
    "metaTitle": "URL Encoder & Decoder | TabBench",
    "metaDescription": "Encode and decode URLs and URI query parameters using standard percent-encoding. Inspect and modify query parameters in real time.",
    "keywords": [
      "url encoder decoder",
      "url encode online",
      "url decode",
      "percent encoding",
      "parse url query parameters",
      "uri component encode",
      "decode url string",
      "url parameter decoder",
      "percent decode online"
    ],
    "aliases": [
      "url encode",
      "url decode",
      "percent encoding",
      "query string",
      "uri encode"
    ],
    "features": [
      "encodeURIComponent support",
      "decodeURIComponent support",
      "Live conversion",
      "One-click copy"
    ],
    "faqs": [
      {
        "question": "Why encode URLs?",
        "answer": "URLs can only contain certain ASCII characters. Special characters like spaces or symbols must be percent-encoded."
      }
    ],
    "relatedToolSlugs": [
      "base64-converter",
      "jwt-decoder",
      "json-formatter"
    ],
    "nextSteps": [
      "utm-builder",
      "base64-converter",
      "slug-generator"
    ]
  },
  "qr-code-generator": {
    "slug": "qr-code-generator",
    "name": "QR Code Generator",
    "shortName": "QR Code Generator",
    "tagline": "Make QR codes for links, Wi-Fi, contacts and more. PNG or SVG.",
    "category": "image-media",
    "description": "Generate high-resolution custom QR codes for URLs, vCards, Wi-Fi passwords, emails, phone calls, and events. Download as PNG or SVG.",
    "longDescription": "Create clean QR codes instantly in your browser. Customize colors, error correction level, frame templates, and size. Download high-res PNG or SVG vector for print or web.",
    "iconName": "QrCode",
    "privacy": "local",
    "metaTitle": "QR Code Generator | Free Custom QR Maker | TabBench",
    "metaDescription": "Create custom QR codes for URLs, vCards, WiFi networks, phone calls, and calendar events. Customize colors, logos, frames, and download crisp PNGs.",
    "keywords": [
      "qr code generator",
      "create qr code",
      "custom qr code generator",
      "vcard qr code generator",
      "free qr code maker",
      "download qr code png",
      "generate qr online",
      "wifi qr code generator",
      "link to qr code",
      "barcode qr maker"
    ],
    "aliases": [
      "qr maker",
      "wifi qr",
      "vcard qr",
      "qr code for link"
    ],
    "features": [
      "URL, vCard 3.0, Wi-Fi, Phone, SMS, and Event modes",
      "Custom foreground & background colors with contrast validator",
      "High-res PNG (up to 2048px) and vector SVG exports",
      "Center logo and presentation frame templates",
      "100% private client-side browser generation"
    ],
    "faqs": [
      {
        "question": "Do these QR codes expire?",
        "answer": "No, these are standard static QR codes and will work indefinitely."
      },
      {
        "question": "What information can I store in a vCard QR code?",
        "answer": "You can store full contact details including first and last name, company, job title, work and mobile phone numbers, email, website, and physical address."
      }
    ],
    "relatedToolSlugs": [
      "qr-code-scanner",
      "barcode-generator",
      "barcode-scanner"
    ],
    "nextSteps": [
      "qr-code-scanner",
      "barcode-generator",
      "utm-builder",
      "favicon-generator"
    ]
  },
  "qr-code-scanner": {
    "slug": "qr-code-scanner",
    "name": "QR Code Scanner",
    "shortName": "QR Scanner",
    "tagline": "Read a QR code from your camera, an image or a screenshot.",
    "category": "image-media",
    "description": "Scan QR codes from camera or upload images. Extract URLs, vCard contact cards, Wi-Fi passwords, and calendar events instantly.",
    "longDescription": "Extract and decode data from any QR code completely client-side in your browser. Scan live using your device camera, drag and drop image files, or paste screenshots from your clipboard. Automatically parses vCards, Wi-Fi networks, links, events, and plain text with 1-click export.",
    "iconName": "ScanLine",
    "privacy": "local",
    "metaTitle": "QR Code Scanner & Data Extractor | TabBench",
    "metaDescription": "Scan and decode QR codes from camera or images client-side. Extract vCards, Wi-Fi passwords, URLs, and events with zero uploads.",
    "keywords": [
      "qr code scanner",
      "scan qr code",
      "qr code reader",
      "qr data extractor",
      "read qr code online",
      "qr scanner camera",
      "extract vcard from qr",
      "decode wifi qr code",
      "free qr scanner"
    ],
    "aliases": [
      "qr reader",
      "scan qr",
      "decode qr"
    ],
    "features": [
      "Live camera scanner with rear/front camera and flashlight support",
      "Upload PNG, JPG, WebP, or SVG images with drag & drop",
      "Paste QR code directly from clipboard (Ctrl+V)",
      "Auto-extracts vCards with one-click .vcf address book download",
      "Parses Wi-Fi credentials with one-click password copy",
      "100% client-side privacy - no server uploads"
    ],
    "faqs": [
      {
        "question": "Does this QR scanner upload my photos or camera feed?",
        "answer": "No. All camera frames and image files are analyzed locally inside your browser using JavaScript and WebAssembly. Nothing is ever transmitted to a server."
      },
      {
        "question": "Can I save extracted vCard contacts directly to my phone?",
        "answer": "Yes. When a vCard is detected, clicking 'Save to Phone Contacts' downloads a standard .vcf file that opens directly in iOS Contacts, Android Contacts, or Outlook."
      }
    ],
    "relatedToolSlugs": [
      "qr-code-generator",
      "barcode-scanner",
      "barcode-generator"
    ],
    "nextSteps": [
      "qr-code-generator",
      "barcode-scanner"
    ]
  },
  "barcode-generator": {
    "slug": "barcode-generator",
    "name": "Barcode Generator",
    "shortName": "Barcode Generator",
    "tagline": "Create EAN, UPC, Code 128 and other barcodes for print or web.",
    "category": "image-media",
    "description": "Generate custom barcodes in Code 128, EAN-13, UPC-A, Code 39, and ITF-14 formats. Download print-ready high-res PNG or vector SVG.",
    "longDescription": "Create industry-standard barcodes directly in your browser. Supports EAN-13, UPC-A, Code 128, Code 39, ITF-14, and Pharmacode with automatic checksum computation, custom dimensions, color customization, and instant print layout.",
    "iconName": "Barcode",
    "privacy": "local",
    "metaTitle": "Barcode Generator | Free Online Barcode Maker | TabBench",
    "metaDescription": "Create free standard barcodes online in Code 128, EAN-13, UPC, Code 39, and ITF-14. Customize size and colors, then download high-res PNG or SVG.",
    "keywords": [
      "barcode generator",
      "barcode maker",
      "create barcode online",
      "free barcode generator",
      "code 128 generator",
      "ean 13 barcode generator",
      "upc generator",
      "printable barcode maker"
    ],
    "aliases": [
      "ean 13",
      "upc",
      "code 128",
      "product barcode"
    ],
    "features": [
      "Supports Code 128, EAN-13, UPC-A, Code 39, ITF-14, and Pharmacode",
      "Automatic check digit and checksum calculation",
      "Customizable bar height, width, margin, and typography",
      "High-resolution PNG up to 4x scaling and scalable vector SVG",
      "Instant print barcode label sheet layout",
      "100% private browser client-side generation"
    ],
    "faqs": [
      {
        "question": "What is the difference between Code 128 and EAN-13?",
        "answer": "Code 128 is an alphanumeric standard used globally in shipping, inventory, and logistics. EAN-13 is a numeric-only 13-digit standard specifically designed for retail point-of-sale scanning worldwide."
      },
      {
        "question": "How do I print barcodes at high quality?",
        "answer": "For best print results on commercial packaging and labels, download the SVG vector format which scales losslessly to any DPI without blurring."
      }
    ],
    "relatedToolSlugs": [
      "barcode-scanner",
      "qr-code-generator",
      "qr-code-scanner"
    ],
    "nextSteps": [
      "barcode-scanner",
      "qr-code-generator"
    ]
  },
  "barcode-scanner": {
    "slug": "barcode-scanner",
    "name": "Barcode Scanner",
    "shortName": "Barcode Scanner",
    "tagline": "Scan product and shipping barcodes with your camera or an image.",
    "category": "image-media",
    "description": "Scan and read 1D and 2D barcodes using your camera or image uploads. Recognizes EAN-13, UPC, Code 128, Code 39, and more.",
    "longDescription": "Scan retail, shipping, and industrial barcodes client-side in real-time. Use your web camera or mobile camera, upload barcode photos, or paste from clipboard. Includes instant product lookup, audio confirmation, and batch scanning export to CSV.",
    "iconName": "ScanBarcode",
    "privacy": "local",
    "metaTitle": "Barcode Scanner & Reader Online | TabBench",
    "metaDescription": "Scan 1D and 2D barcodes online using your camera or image files. Fast, private reader for EAN, UPC, Code 128, and Code 39 with batch export.",
    "keywords": [
      "barcode scanner",
      "online barcode scanner",
      "scan barcode with camera",
      "barcode reader",
      "read ean 13",
      "upc barcode scanner",
      "free barcode reader",
      "batch barcode scanner"
    ],
    "aliases": [
      "barcode reader",
      "scan barcode",
      "ean scanner"
    ],
    "features": [
      "Live camera scanner with instant barcode symbology detection",
      "Supports EAN-13, EAN-8, UPC-A, Code 128, Code 39, ITF, and more",
      "Upload image files or paste screenshots directly (Ctrl+V)",
      "Continuous batch scanning mode with CSV and text export",
      "Instant product information search on Google",
      "Runs entirely in your browser with complete privacy"
    ],
    "faqs": [
      {
        "question": "Which barcode formats can this scanner read?",
        "answer": "It reads all major 1D linear barcodes including EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39, ITF, and Codabar, as well as 2D codes like QR Code and Data Matrix."
      },
      {
        "question": "Can I scan multiple barcodes in a warehouse or store?",
        "answer": "Yes. Enable 'Batch Scan Mode' to scan items continuously one after another. The scanner collects each barcode with timestamps and lets you export the full list as a CSV file."
      }
    ],
    "relatedToolSlugs": [
      "barcode-generator",
      "qr-code-scanner",
      "qr-code-generator"
    ],
    "nextSteps": [
      "barcode-generator",
      "qr-code-scanner"
    ]
  },
  "image-compressor": {
    "slug": "image-compressor",
    "name": "Image Compressor",
    "shortName": "Image Compressor",
    "tagline": "Shrink JPG, PNG and WebP images to a target size like 50 KB.",
    "category": "image-media",
    "description": "Compress image to exact target KB (e.g. under 50KB, 100KB, 200KB) with live quality adaptation and alerts.",
    "longDescription": "Compress JPG, PNG, and WebP images to your exact target file size in KB. Ideal for government portals, job applications, resumes, and websites with strict file size limits. 100% private in-browser compression.",
    "iconName": "ImageMinus",
    "privacy": "local",
    "metaTitle": "Image Compressor | TabBench",
    "metaDescription": "Compress JPEG, PNG, and WebP images directly in your browser without uploading files. Reduce file size while maintaining visual clarity.",
    "keywords": [
      "image compressor",
      "compress image online",
      "compress jpeg",
      "compress png",
      "reduce image file size",
      "compress image to 50kb",
      "compress image to 100kb",
      "compress image to 20kb",
      "photo compressor",
      "shrink image file",
      "reduce photo size",
      "image optimizer"
    ],
    "aliases": [
      "reduce image size",
      "compress photo",
      "image to 50kb",
      "image to 100kb",
      "compress jpg",
      "image optimizer",
      "image size"
    ],
    "features": [
      "Compress to exact KB target (e.g. 50KB, 100KB)",
      "Smart auto-downscaling algorithm",
      "Before/After size comparison",
      "100% client-side safe"
    ],
    "faqs": [
      {
        "question": "Can I compress an image to under 50 KB or 100 KB?",
        "answer": "Yes! Enter your desired target size in KB and our algorithm will automatically balance quality and resolution to meet your limit."
      }
    ],
    "relatedToolSlugs": [
      "png-to-jpg",
      "crop-image",
      "image-to-pdf"
    ],
    "nextSteps": [
      "image-resizer",
      "crop-image",
      "image-to-webp",
      "exif-viewer",
      "image-to-pdf"
    ]
  },
  "image-to-pdf": {
    "slug": "image-to-pdf",
    "name": "Image to PDF Converter",
    "shortName": "Image to PDF Converter",
    "tagline": "Combine JPG, PNG and WebP images into a single PDF.",
    "category": "pdf-docs",
    "description": "Convert JPG, PNG, and WebP images into PDF documents, or extract PDF pages as high-resolution images.",
    "longDescription": "Convert multiple photos and documents into a clean multi-page PDF, or convert PDF pages into high-res JPG/PNG images client-side with zero data uploads.",
    "iconName": "FilePlus2",
    "privacy": "local",
    "metaTitle": "Image to PDF Converter | TabBench",
    "metaDescription": "Convert JPG, PNG, and WebP images into clean, multi-page PDF documents. Reorder pages, adjust margins, and download instantly.",
    "keywords": [
      "image to pdf",
      "convert jpg to pdf",
      "png to pdf",
      "combine images to pdf",
      "convert photos to pdf",
      "jpg to pdf converter",
      "pictures to pdf document",
      "make pdf from photos",
      "scan to pdf online",
      "turn images into pdf"
    ],
    "aliases": [
      "jpg to pdf",
      "png to pdf",
      "photos to pdf",
      "scan to pdf"
    ],
    "features": [
      "Convert multiple images to multi-page PDF",
      "Convert PDF to JPG/PNG images",
      "Page orientation settings",
      "Zero server upload"
    ],
    "faqs": [
      {
        "question": "Can I merge multiple images into one PDF?",
        "answer": "Yes, upload multiple JPG or PNG images and arrange them to create a combined PDF document."
      }
    ],
    "relatedToolSlugs": [
      "pdf-to-word",
      "pdf-merge",
      "image-compressor"
    ],
    "nextSteps": [
      "pdf-merge",
      "pdf-editor",
      "add-page-numbers",
      "image-compressor"
    ]
  },
  "pdf-to-word": {
    "slug": "pdf-to-word",
    "name": "PDF to Word Converter",
    "shortName": "PDF to Word Converter",
    "tagline": "Turn a PDF into an editable Word document, or Word into PDF.",
    "category": "pdf-docs",
    "description": "Convert PDF documents to editable Microsoft Word (.docx) files, or convert Word documents to PDF.",
    "longDescription": "Easily extract text and formatting from PDF files into editable DOCX Word files, or convert Word (.docx) documents into clean PDF files right in your browser.",
    "iconName": "FileType",
    "privacy": "local",
    "metaTitle": "PDF to Word Converter | TabBench",
    "metaDescription": "Convert PDF documents to editable Word (.docx) files or Word to PDF in your browser. Fast, private conversion with no uploads.",
    "keywords": [
      "pdf to word",
      "word to pdf",
      "convert pdf to docx",
      "pdf to editable word",
      "pdf to doc online",
      "convert pdf to word doc",
      "word docx to pdf",
      "extract text from pdf",
      "pdf document to word"
    ],
    "aliases": [
      "pdf to docx",
      "word to pdf",
      "docx to pdf",
      "pdf to doc"
    ],
    "features": [
      "Convert PDF to editable DOCX",
      "Convert DOCX Word documents to PDF",
      "Preserves text structure",
      "Private browser processing"
    ],
    "faqs": [
      {
        "question": "Is the resulting Word document editable?",
        "answer": "Yes, it creates standard Microsoft Word .docx files compatible with Word, Google Docs, and LibreOffice."
      }
    ],
    "relatedToolSlugs": [
      "image-to-pdf",
      "pdf-merge",
      "unlock-pdf"
    ],
    "nextSteps": [
      "pdf-editor",
      "pdf-merge",
      "pdf-to-jpg",
      "image-to-text"
    ]
  },
  "watermark-remover": {
    "slug": "watermark-remover",
    "name": "Watermark Remover",
    "shortName": "Watermark Remover",
    "tagline": "Erase stamps, dates and logos from photos, or add your own watermark.",
    "category": "image-media",
    "description": "Remove watermarks, logos, dates, and stamps from images using smart inpainting, or add custom watermarks.",
    "longDescription": "Clean unwanted watermarks, timestamps, and logos from photos using client-side neighbor inpainting algorithms, or protect your images by adding custom text/image watermarks.",
    "iconName": "Eraser",
    "privacy": "local",
    "metaTitle": "Watermark Remover | TabBench",
    "metaDescription": "Erase watermarks, stamps, date logs, and unwanted objects from images client-side. Fast in-browser canvas retouching.",
    "keywords": [
      "watermark remover",
      "remove watermark from photo",
      "object eraser online",
      "erase stamp from image",
      "clean image watermark",
      "remove logo from photo",
      "erase date stamp image",
      "retouch photo watermark",
      "clean picture background"
    ],
    "aliases": [
      "remove watermark",
      "remove logo",
      "erase object",
      "add watermark"
    ],
    "features": [
      "Interactive watermark erase box",
      "Smart pixel inpainting algorithm",
      "Watermark adder mode",
      "Download clean image"
    ],
    "faqs": [
      {
        "question": "How does the watermark eraser work?",
        "answer": "Select the watermark area with your mouse; the inpainting algorithm blends surrounding textures to fill the area seamlessly."
      }
    ],
    "relatedToolSlugs": [
      "image-compressor",
      "crop-image",
      "png-to-jpg"
    ],
    "nextSteps": [
      "crop-image",
      "image-compressor",
      "image-resizer"
    ]
  },
  "png-to-jpg": {
    "slug": "png-to-jpg",
    "name": "PNG to JPG Converter",
    "shortName": "PNG to JPG Converter",
    "tagline": "Convert PNG to JPG, filling transparent areas with a colour you pick.",
    "category": "image-media",
    "description": "Convert PNG images to JPG with custom background fill for transparent areas and adjustable compression quality.",
    "longDescription": "Instant format conversion from PNG to JPG. Automatically fills transparent PNG backgrounds with clean white or custom colors when saving as JPG.",
    "iconName": "FileImage",
    "privacy": "local",
    "metaTitle": "PNG to JPG Converter | TabBench",
    "metaDescription": "Convert PNG images to JPG format with custom background color and compression quality settings. 100% private in your browser.",
    "keywords": [
      "png to jpg",
      "convert png to jpg",
      "png to jpeg converter",
      "transparent png to jpg",
      "image format converter",
      "change png to jpg",
      "turn png into jpeg",
      "export png as jpg"
    ],
    "aliases": [
      "png to jpeg",
      "convert png"
    ],
    "features": [
      "PNG to JPG conversion",
      "Custom background color for transparency",
      "Adjustable JPG quality slider",
      "Instant file size comparison"
    ],
    "faqs": [
      {
        "question": "What happens to transparent backgrounds when converting PNG to JPG?",
        "answer": "Because JPG does not support transparency, our tool fills transparent areas with clean white (or your chosen background color)."
      }
    ],
    "relatedToolSlugs": [
      "jpg-to-png",
      "image-to-webp",
      "image-compressor",
      "crop-image"
    ],
    "nextSteps": [
      "image-compressor",
      "image-resizer",
      "image-to-pdf"
    ]
  },
  "png-to-svg": {
    "slug": "png-to-svg",
    "name": "PNG to SVG Converter",
    "shortName": "PNG to SVG",
    "tagline": "Trace a PNG or JPG into a scalable SVG vector.",
    "category": "image-media",
    "description": "Convert raster PNG images into scalable vector SVG graphics with color quantization, threshold controls, and instant code export.",
    "longDescription": "Free in-browser PNG to SVG vectorizer. Convert raster PNG, JPG, and WebP graphics into clean, infinitely scalable vector SVG paths with color clustering, monochrome silhouette tracing, and pixel art preservation.",
    "iconName": "Layers",
    "privacy": "local",
    "metaTitle": "Free PNG to SVG Converter - Vectorize Images",
    "metaDescription": "Convert PNG images to scalable SVG vectors online. Features color layers, monochrome silhouettes, pixel art, and instant code export.",
    "keywords": [
      "png to svg",
      "convert png to svg",
      "vectorize png online",
      "image to svg converter",
      "png to vector",
      "raster to vector svg",
      "free svg converter"
    ],
    "aliases": [
      "vectorize",
      "image to svg",
      "raster to vector",
      "trace image"
    ],
    "features": [
      "Vectorize PNG, JPG, and WebP images into scalable SVG paths",
      "Color quantization modes with 2 to 32 palette colors",
      "High-contrast monochrome silhouette and stencil tracing",
      "Pixel art preservation mode for retro game icons",
      "Interactive zoom up to 400% with side-by-side inspection",
      "1-click SVG code copy and direct .svg file download"
    ],
    "faqs": [
      {
        "question": "How does PNG to SVG conversion work?",
        "answer": "The converter analyzes raster pixel data directly in your browser, groups neighboring pixels into color clusters or high-contrast luminance masks, and traces boundary contours into mathematical SVG vector paths."
      },
      {
        "question": "Can I scale the output SVG to any resolution?",
        "answer": "Yes! Unlike raster PNG images that lose quality and pixelate when enlarged, SVG files are defined mathematically and can scale infinitely to 4K, 8K, and billboard sizes with zero quality loss."
      },
      {
        "question": "Are my images uploaded to an external server?",
        "answer": "No. The entire vectorization engine runs locally inside your browser memory using HTML5 Canvas. Your images are never sent over the network."
      }
    ],
    "relatedToolSlugs": [
      "png-to-jpg",
      "jpg-to-png",
      "image-compressor",
      "image-resizer",
      "favicon-generator"
    ],
    "nextSteps": [
      "favicon-generator",
      "image-resizer",
      "color-converter"
    ]
  },
  "jpg-to-png": {
    "slug": "jpg-to-png",
    "name": "JPG to PNG Converter",
    "shortName": "JPG to PNG Converter",
    "tagline": "Convert JPG photos to lossless PNG.",
    "category": "image-media",
    "description": "Convert JPG and JPEG photos into lossless PNG format with crisp quality and zero compression artifacts.",
    "longDescription": "Convert standard JPEG and JPG photos into uncompressed PNG images. Great for graphic design, logos, and high-fidelity editing.",
    "iconName": "FileImage",
    "privacy": "local",
    "metaTitle": "JPG to PNG Converter | TabBench",
    "metaDescription": "Convert JPG and JPEG images to high-quality PNG format instantly. Retain maximum image clarity with client-side conversion.",
    "keywords": [
      "jpg to png",
      "convert jpg to png",
      "jpeg to png online",
      "convert photo to png",
      "lossless image converter",
      "make png from jpg",
      "turn jpeg into png",
      "export jpg as png"
    ],
    "aliases": [
      "jpeg to png",
      "convert jpg"
    ],
    "features": [
      "Lossless PNG export",
      "Fast client-side conversion",
      "Zero data upload",
      "High-fidelity color retention"
    ],
    "faqs": [
      {
        "question": "Does converting JPG to PNG improve image quality?",
        "answer": "It prevents further compression loss when you edit or save the file again, maintaining original pixel fidelity."
      }
    ],
    "relatedToolSlugs": [
      "png-to-jpg",
      "image-to-webp",
      "crop-image",
      "image-compressor"
    ],
    "nextSteps": [
      "png-to-svg",
      "image-compressor",
      "crop-image"
    ]
  },
  "image-to-webp": {
    "slug": "image-to-webp",
    "name": "Image to WebP Converter",
    "shortName": "Image to WebP Converter",
    "tagline": "Convert JPG and PNG to WebP for smaller, faster-loading images.",
    "category": "image-media",
    "description": "Convert JPG and PNG images into modern Google WebP format to reduce file sizes by 30% to 80% while retaining quality.",
    "longDescription": "Speed up your website load times and save bandwidth by converting bulky images to modern, high-efficiency WebP format.",
    "iconName": "ImageDown",
    "privacy": "local",
    "metaTitle": "Image to WebP Converter | TabBench",
    "metaDescription": "Convert JPG and PNG images into modern WebP format for faster web page loading. Batch conversion directly in your browser.",
    "keywords": [
      "image to webp",
      "convert jpg to webp",
      "convert png to webp",
      "webp converter online",
      "next-gen image converter",
      "compress to webp",
      "turn photo to webp",
      "make webp image"
    ],
    "aliases": [
      "jpg to webp",
      "png to webp",
      "webp converter"
    ],
    "features": [
      "Convert PNG and JPG to WebP",
      "Up to 80% file size reduction",
      "Lossy & Lossless quality slider",
      "Faster website load times"
    ],
    "faqs": [
      {
        "question": "What is WebP format?",
        "answer": "WebP is a modern image format developed by Google that provides superior lossless and lossy compression for web images."
      }
    ],
    "relatedToolSlugs": [
      "webp-to-jpg",
      "png-to-jpg",
      "image-compressor",
      "crop-image"
    ],
    "nextSteps": [
      "image-compressor",
      "image-resizer",
      "exif-viewer"
    ]
  },
  "webp-to-jpg": {
    "slug": "webp-to-jpg",
    "name": "WebP to JPG Converter",
    "shortName": "WebP to JPG Converter",
    "tagline": "Convert WebP images to JPG or PNG that open anywhere.",
    "category": "image-media",
    "description": "Convert WebP images into universally compatible JPG or PNG formats for easy sharing and opening on any device.",
    "longDescription": "Easily open and convert downloaded .webp images into standard JPG or PNG files that can be edited in Photoshop, Word, or shared anywhere.",
    "iconName": "ImageUp",
    "privacy": "local",
    "metaTitle": "WebP to JPG Converter | TabBench",
    "metaDescription": "Convert WebP images to standard JPG format for compatibility with older viewers and editors. Fast in-browser processing.",
    "keywords": [
      "webp to jpg",
      "convert webp to jpg",
      "webp to jpeg converter",
      "save webp as jpg",
      "webp image converter",
      "open webp file",
      "turn webp into jpeg",
      "webp to png converter"
    ],
    "aliases": [
      "webp to jpeg",
      "webp to png",
      "open webp"
    ],
    "features": [
      "Convert WebP to JPG & PNG",
      "Universal device compatibility",
      "Zero quality degradation",
      "Instant batch download"
    ],
    "faqs": [
      {
        "question": "Why should I convert WebP to JPG?",
        "answer": "Some older photo viewers and image editing apps do not natively support WebP files, while JPG works everywhere."
      }
    ],
    "relatedToolSlugs": [
      "image-to-webp",
      "png-to-jpg",
      "jpg-to-png",
      "crop-image"
    ],
    "nextSteps": [
      "image-compressor",
      "image-resizer",
      "crop-image"
    ]
  },
  "unlock-pdf": {
    "slug": "unlock-pdf",
    "name": "Unlock PDF",
    "shortName": "Unlock PDF",
    "tagline": "Remove the password and print or copy restrictions from PDFs you are allowed to open.",
    "category": "pdf-docs",
    "description": "Make an unrestricted copy of a protected PDF you can open — no password, no print or copy restrictions — entirely in your browser.",
    "longDescription": "Open a password-protected or restricted PDF you are entitled to use and save a copy with no password and no printing or copying restrictions. Pages are redrawn as high-resolution images, so the copy looks and prints the same. Everything happens in your browser; the file and password are never uploaded.",
    "iconName": "LockOpen",
    "privacy": "local",
    "metaTitle": "Unlock PDF - Reset Permissions",
    "metaDescription": "Reset owner print and copy permissions on your authorized PDF documents safely in your browser. Client-side processing with zero server uploads.",
    "keywords": [
      "unlock pdf",
      "reset pdf permissions",
      "remove pdf print restrictions",
      "pdf copy permission reset",
      "unlock owner pdf online",
      "remove edit lock from pdf"
    ],
    "aliases": [
      "remove pdf password",
      "pdf permissions",
      "decrypt pdf"
    ],
    "features": [
      "Removes print and copy restrictions",
      "Opens password-protected PDFs with your password",
      "Tells you when a PDF isn't locked at all",
      "File and password never uploaded"
    ],
    "faqs": [
      {
        "question": "Can it unlock password-protected files?",
        "answer": "Yes, if you know the password. Enter it once and the tool saves a copy with no password or restrictions. The copy stores each page as a high-resolution image, so it looks and prints the same but its text is not selectable."
      }
    ],
    "relatedToolSlugs": [
      "pdf-merge",
      "pdf-to-word",
      "image-to-pdf"
    ],
    "nextSteps": [
      "pdf-editor",
      "pdf-to-word",
      "pdf-merge"
    ]
  },
  "crop-image": {
    "slug": "crop-image",
    "name": "Crop Image",
    "shortName": "Crop Image",
    "tagline": "Crop to 1:1, 16:9, 9:16 or any custom size.",
    "category": "image-media",
    "description": "Crop photos to custom dimensions or standard aspect ratios (1:1, 16:9, 4:3, 9:16 Story) with live preview.",
    "longDescription": "Crop, frame, and resize your images for Instagram posts, YouTube thumbnails, profile pictures, and banners with precise pixel controls.",
    "iconName": "Crop",
    "privacy": "local",
    "metaTitle": "Crop Image | TabBench",
    "metaDescription": "Crop photos and graphics to custom dimensions or standard aspect ratios (16:9, 4:3, 1:1). Download crisp cropped images with zero upload.",
    "keywords": [
      "crop image",
      "image cropper online",
      "crop photo",
      "crop square image",
      "aspect ratio cropper",
      "crop picture online",
      "crop to 1:1 square",
      "crop 16:9 banner",
      "trim image borders",
      "resize and crop photo"
    ],
    "aliases": [
      "image cropper",
      "cut image",
      "trim photo",
      "square crop",
      "profile picture"
    ],
    "features": [
      "Presets for 1:1, 16:9, 4:3, 9:16 Story",
      "Freeform crop box",
      "Precise pixel dimension indicator",
      "High quality export"
    ],
    "faqs": [
      {
        "question": "Can I crop circular profile pictures?",
        "answer": "Yes, you can crop to 1:1 square ratio which fits circular avatar frames perfectly."
      }
    ],
    "relatedToolSlugs": [
      "image-compressor",
      "watermark-remover",
      "png-to-jpg"
    ],
    "nextSteps": [
      "image-resizer",
      "image-compressor",
      "favicon-generator",
      "watermark-remover"
    ]
  },
  "pdf-merge": {
    "slug": "pdf-merge",
    "name": "Merge PDF",
    "shortName": "Merge PDF",
    "tagline": "Combine several PDFs into one file, in the order you choose.",
    "category": "pdf-docs",
    "description": "Combine multiple PDF documents into a single organized PDF file entirely client-side in your browser.",
    "longDescription": "Merge multiple PDF files securely in your browser using pdf-lib. Reorder files, remove unwanted pages, and download the combined PDF with zero server upload.",
    "iconName": "Combine",
    "privacy": "local",
    "metaTitle": "Merge PDF | TabBench",
    "metaDescription": "Merge and combine multiple PDF documents into a single organized file. Reorder pages and files with client-side processing.",
    "keywords": [
      "merge pdf",
      "combine pdf",
      "combine pdf files",
      "pdf joiner",
      "merge pdf files free",
      "join pdf pages",
      "attach pdfs together",
      "combine multiple pdfs into one",
      "merge pdf documents online"
    ],
    "aliases": [
      "combine pdf",
      "join pdf",
      "pdf joiner",
      "merge pdf files"
    ],
    "features": [
      "Merge multiple PDFs",
      "Drag-and-drop file upload",
      "Zero server upload - 100% private",
      "Fast instant download"
    ],
    "faqs": [
      {
        "question": "Is it safe to merge sensitive documents?",
        "answer": "Yes, merging happens on your device using WebAssembly/JavaScript. No PDF data leaves your computer."
      }
    ],
    "relatedToolSlugs": [
      "pdf-compressor",
      "image-compressor",
      "qr-code-generator"
    ],
    "nextSteps": [
      "add-page-numbers",
      "split-pdf",
      "pdf-editor",
      "pdf-compressor"
    ]
  },
  "pdf-compressor": {
    "slug": "pdf-compressor",
    "name": "PDF Inspector",
    "shortName": "PDF Inspector",
    "tagline": "Count a PDF's pages and see its sizes, metadata, encryption and what makes it large.",
    "category": "pdf-docs",
    "description": "Count a PDF's pages and see its page sizes, document properties, encryption, form fields, and how much of the file is images and fonts.",
    "longDescription": "See what is inside a PDF before you send or shrink it: page count and paper sizes, title, author and other properties, PDF version, encryption, form fields, and whether images or embedded fonts make the file large. The file is read in your browser and never uploaded.",
    "iconName": "FileSearch",
    "privacy": "local",
    "metaTitle": "PDF Page Counter & Inspector | TabBench",
    "metaDescription": "Inspect PDF files, count pages, view document metadata, and learn practical steps to reduce PDF file size safely.",
    "keywords": [
      "pdf page counter",
      "pdf inspector",
      "pdf metadata viewer",
      "check pdf page count",
      "how to compress pdf",
      "pdf info inspector",
      "count pages in pdf",
      "view pdf properties",
      "inspect pdf document"
    ],
    "aliases": [
      "pdf page count",
      "count pdf pages",
      "pdf info",
      "pdf metadata",
      "pdf properties"
    ],
    "features": [
      "Page count and paper sizes",
      "Title, author, producer and dates",
      "Encryption and form field check",
      "Image and font size breakdown"
    ],
    "faqs": [
      {
        "question": "How are files processed?",
        "answer": "Files are parsed directly in browser memory."
      }
    ],
    "relatedToolSlugs": [
      "pdf-merge",
      "image-compressor",
      "word-counter"
    ],
    "nextSteps": [
      "pdf-merge",
      "split-pdf",
      "pdf-editor"
    ]
  },
  "age-calculator": {
    "slug": "age-calculator",
    "name": "Age Calculator",
    "shortName": "Age Calculator",
    "tagline": "Your exact age in years, months and days, plus your next birthday.",
    "category": "date-time",
    "description": "Calculate your exact age in years, months, weeks, days, hours, and minutes, plus next birthday countdown.",
    "longDescription": "Find out your exact age to the day and minute. View interesting milestones like days lived, total breaths, total heartbeats, and days until your next birthday.",
    "iconName": "Cake",
    "privacy": "local",
    "metaTitle": "Age Calculator | TabBench",
    "metaDescription": "Calculate your exact age in years, months, weeks, days, hours, and minutes from your date of birth. Accurate with leap-year handling.",
    "keywords": [
      "age calculator",
      "calculate age from dob",
      "chronological age calculator",
      "age in days",
      "birthday countdown",
      "exact age in years months days",
      "how old am i",
      "dob calculator online",
      "date of birth age"
    ],
    "aliases": [
      "how old am i",
      "date of birth",
      "dob",
      "birthday",
      "date"
    ],
    "features": [
      "Exact age in Years, Months, Days",
      "Total days, hours, minutes lived",
      "Next birthday countdown",
      "Day of week you were born"
    ],
    "formulas": [
      {
        "name": "Age Duration Calculation",
        "expression": "Years = CurrentYear - BirthYear (adjusted for month/day)",
        "explanation": "Calculate the exact elapsed calendar years, months, and remainder days from date of birth.",
        "example": "Born Jan 15, 2000 -> 26 years, 7 months, 1 day (as of Aug 2026)."
      }
    ],
    "faqs": [
      {
        "question": "Does this account for leap years?",
        "answer": "Yes, exact calendar math accounts for leap years and month length variations."
      }
    ],
    "relatedToolSlugs": [
      "date-difference-calculator",
      "percentage-calculator",
      "emi-calculator"
    ],
    "nextSteps": [
      "date-difference-calculator",
      "working-days-calculator",
      "bmi-calculator"
    ]
  },
  "gst-calculator": {
    "slug": "gst-calculator",
    "name": "GST Calculator",
    "shortName": "GST Calculator",
    "tagline": "Add or remove GST at 5%, 18% or 40%, with the CGST/SGST or IGST split.",
    "category": "calculators",
    "description": "Calculate GST (Goods & Services Tax) easily: Add GST to base amount or Reverse GST (extract tax from total) at the current 5%, 18% and 40% rates or any custom rate.",
    "longDescription": "Calculate inclusive and exclusive GST amounts in seconds. Determine CGST, SGST, IGST tax breakdown and find net pricing.",
    "iconName": "Receipt",
    "privacy": "local",
    "metaTitle": "GST Calculator | TabBench",
    "metaDescription": "Calculate GST amounts instantly with inclusive and exclusive tax rates. View clear CGST, SGST, and IGST breakdowns directly in your browser.",
    "keywords": [
      "gst calculator",
      "gst calculation online",
      "inclusive gst calculator",
      "exclusive gst calculator",
      "reverse gst",
      "calculate 18% gst",
      "cgst sgst calculator",
      "goods and services tax calculator",
      "tax calculator india"
    ],
    "aliases": [
      "gst inclusive",
      "gst exclusive",
      "reverse gst",
      "tax",
      "vat"
    ],
    "features": [
      "Add GST & Remove GST modes",
      "Current slabs: 5%, 18%, 40% (and 3% on gold)",
      "CGST and SGST split breakdown",
      "One-click copy"
    ],
    "formulas": [
      {
        "name": "GST Added (Exclusive)",
        "expression": "GST Amount = (Price × GST%) / 100",
        "explanation": "Total Amount = Price + GST Amount.",
        "example": "Rs. 1,000 with 18% GST = Rs. 1,000 + Rs. 180 = Rs. 1,180."
      },
      {
        "name": "Reverse GST (Inclusive)",
        "expression": "GST Amount = Price - (Price × (100 / (100 + GST%)))",
        "explanation": "Calculates the base price and extracted GST from a tax-inclusive total.",
        "example": "Rs. 1,180 with 18% GST -> Base Price = Rs. 1,000, GST = Rs. 180."
      }
    ],
    "faqs": [
      {
        "question": "What is CGST and SGST?",
        "answer": "For intra-state transactions, GST is split equally between Central GST (CGST) and State GST (SGST)."
      }
    ],
    "relatedToolSlugs": [
      "profit-margin-calculator",
      "discount-calculator",
      "emi-calculator"
    ],
    "nextSteps": [
      "discount-calculator",
      "profit-margin-calculator",
      "percentage-calculator"
    ]
  },
  "emi-calculator": {
    "slug": "emi-calculator",
    "name": "EMI Calculator",
    "shortName": "EMI Calculator",
    "tagline": "Monthly EMI, total interest and repayment schedule for any loan.",
    "category": "calculators",
    "description": "Calculate equated monthly installments (EMI) for home loans, car loans, and personal loans with total interest and amortization charts.",
    "longDescription": "Plan your loan repayment with our loan EMI calculator. Calculate monthly payments, total interest payable, and total cost of loan with interactive tenure sliders.",
    "iconName": "Landmark",
    "privacy": "local",
    "metaTitle": "EMI Calculator | TabBench",
    "metaDescription": "Calculate your monthly loan EMI, total payable interest, and amortization schedule instantly. Fast, accurate, and completely private.",
    "keywords": [
      "emi calculator",
      "loan emi calculator",
      "home loan emi",
      "car loan emi calculator",
      "monthly emi calculation",
      "personal loan emi calculator",
      "housing loan emi",
      "loan interest calculator",
      "monthly installment calculator"
    ],
    "aliases": [
      "loan calculator",
      "home loan",
      "car loan",
      "mortgage",
      "installment"
    ],
    "features": [
      "Monthly EMI calculation",
      "Total interest vs principal visualizer",
      "Flexible tenure (years or months)",
      "Amortization table breakdown"
    ],
    "formulas": [
      {
        "name": "Standard EMI Formula",
        "expression": "EMI = [P × R × (1+R)^N] / [(1+R)^N - 1]",
        "explanation": "P = Principal loan amount, R = Monthly interest rate (Annual % / 12 / 100), N = Number of monthly installments.",
        "example": "Loan $100,000 at 8% for 10 years (120 months) = $1,213.28 per month."
      }
    ],
    "faqs": [
      {
        "question": "Can I reduce my EMI by paying extra principal?",
        "answer": "Yes, prepaying principal reduces remaining tenure or monthly EMI obligation."
      }
    ],
    "relatedToolSlugs": [
      "gst-calculator",
      "profit-margin-calculator",
      "percentage-calculator"
    ],
    "nextSteps": [
      "compound-interest-calculator",
      "sip-calculator",
      "salary-calculator"
    ]
  },
  "discount-calculator": {
    "slug": "discount-calculator",
    "name": "Discount Calculator",
    "shortName": "Discount Calculator",
    "tagline": "Sale price and savings, including stacked discounts and coupons.",
    "category": "calculators",
    "description": "Calculate final sale price, discount amount saved, and double discount / stackable coupon savings instantly.",
    "longDescription": "Find out how much you save during sales and clearance events. Calculate percentage discounts, fixed cash discounts, and additional coupon codes.",
    "iconName": "Tag",
    "privacy": "local",
    "metaTitle": "Discount Calculator | TabBench",
    "metaDescription": "Calculate sale prices, percentage discounts, and stacked savings instantly. See exact savings and final prices with zero calculation errors.",
    "keywords": [
      "discount calculator",
      "sale price calculator",
      "percent off calculator",
      "double discount calculator",
      "final price after discount",
      "calculate savings",
      "coupon discount calculator",
      "clearance sale price",
      "how much will i save"
    ],
    "aliases": [
      "percent off",
      "sale price",
      "coupon"
    ],
    "features": [
      "Percent off and fixed amount discount",
      "Double discount (extra % off)",
      "Savings breakdown",
      "Visual discount tag"
    ],
    "formulas": [
      {
        "name": "Discounted Price Formula",
        "expression": "Sale Price = Original Price × (1 - Discount% / 100)",
        "explanation": "Savings = Original Price - Sale Price.",
        "example": "$80 item with 25% discount: Sale Price = $80 * 0.75 = $60 (You save $20)."
      }
    ],
    "faqs": [
      {
        "question": "How do double discounts work?",
        "answer": "An extra 10% off an already 50% discounted item applies to the discounted price, not the original MSRP."
      }
    ],
    "relatedToolSlugs": [
      "percentage-calculator",
      "gst-calculator",
      "profit-margin-calculator"
    ],
    "nextSteps": [
      "percentage-calculator",
      "gst-calculator",
      "profit-margin-calculator"
    ]
  },
  "profit-margin-calculator": {
    "slug": "profit-margin-calculator",
    "name": "Profit Margin Calculator",
    "shortName": "Profit Margin Calculator",
    "tagline": "Margin, markup and the selling price you need to hit a target.",
    "category": "business",
    "description": "Calculate gross profit margin, markup percentage, revenue, and cost price with clear visual breakdowns.",
    "longDescription": "Optimize your product pricing, ecommerce stores, and quotes. Understand the crucial mathematical difference between Margin and Markup.",
    "iconName": "BadgePercent",
    "privacy": "local",
    "metaTitle": "Profit Margin Calculator | TabBench",
    "metaDescription": "Calculate profit margins, markup percentages, gross profit, and required selling prices with instant formulas and visual breakdowns.",
    "keywords": [
      "profit margin calculator",
      "markup calculator",
      "gross profit margin calculator",
      "margin vs markup",
      "selling price calculator",
      "calculate profit margin",
      "cost price markup",
      "ecommerce margin calculator",
      "net profit calculator"
    ],
    "aliases": [
      "markup",
      "gross margin",
      "selling price"
    ],
    "features": [
      "Gross Margin & Markup calculation",
      "Required selling price estimator",
      "Margin vs Markup table"
    ],
    "formulas": [
      {
        "name": "Gross Profit Margin",
        "expression": "Margin % = ((Revenue - Cost) / Revenue) × 100",
        "explanation": "Margin calculates what fraction of each revenue dollar represents net profit after cost.",
        "example": "Cost = $60, Price = $100 -> Margin = 40%."
      }
    ],
    "faqs": [
      {
        "question": "Why is margin always lower than markup?",
        "answer": "Margin divides profit by the higher selling price, markup divides profit by the lower cost."
      }
    ],
    "relatedToolSlugs": [
      "percentage-calculator",
      "discount-calculator",
      "gst-calculator"
    ],
    "nextSteps": [
      "break-even-calculator",
      "gst-calculator",
      "discount-calculator"
    ]
  },
  "case-converter": {
    "slug": "case-converter",
    "name": "Case Converter",
    "shortName": "Case Converter",
    "tagline": "Switch text to UPPER, lower, Title, camelCase, snake_case and more.",
    "category": "text",
    "description": "Convert text between UPPERCASE, lowercase, Title Case, camelCase, snake_case, kebab-case, clean spaces, and count words.",
    "longDescription": "Manipulate and format text in your browser. Clean messy copy, format code identifiers, strip redundant spaces, and capitalize headings.",
    "iconName": "CaseSensitive",
    "privacy": "local",
    "metaTitle": "Case Converter | TabBench",
    "metaDescription": "Convert text between UPPERCASE, lowercase, Title Case, camelCase, snake_case, and kebab-case instantly. Fast, clean formatting in your browser.",
    "keywords": [
      "case converter",
      "uppercase converter",
      "lowercase converter",
      "title case converter",
      "camelcase converter",
      "snake case converter",
      "kebab case converter",
      "capital to small text",
      "sentence case online",
      "format text case"
    ],
    "aliases": [
      "uppercase",
      "lowercase",
      "title case",
      "sentence case",
      "camelcase",
      "snake case"
    ],
    "features": [
      "UPPERCASE, lowercase, Title Case, Sentence case",
      "camelCase, PascalCase, snake_case, kebab-case",
      "Clean extra whitespace"
    ],
    "faqs": [
      {
        "question": "What rules does Title Case follow?",
        "answer": "Capitalizes major words while keeping minor prepositions in lowercase."
      }
    ],
    "relatedToolSlugs": [
      "word-counter",
      "text-diff-checker",
      "json-formatter"
    ],
    "nextSteps": [
      "word-counter",
      "text-sorter",
      "slug-generator"
    ]
  },
  "date-difference-calculator": {
    "slug": "date-difference-calculator",
    "name": "Date Difference Calculator",
    "shortName": "Date Difference Calculator",
    "tagline": "Days, weeks and months between two dates, or add time to a date.",
    "category": "date-time",
    "description": "Calculate exact days, business days, weeks, months, and years between two dates or add/subtract time from a date.",
    "longDescription": "Calculate calendar days, working/business days, and time intervals between any two dates. Plan deadlines or add/subtract days from today.",
    "iconName": "CalendarRange",
    "privacy": "local",
    "metaTitle": "Date Difference Calculator | TabBench",
    "metaDescription": "Calculate the exact number of days, weeks, months, and business days between two dates. Fast, accurate calendar arithmetic in your browser.",
    "keywords": [
      "date difference calculator",
      "days between dates",
      "business days calculator",
      "working days between dates",
      "date duration",
      "days between two dates",
      "how many days until",
      "weeks between dates",
      "date interval calculator",
      "calendar days calculator"
    ],
    "aliases": [
      "days between dates",
      "date calculator",
      "days until",
      "countdown",
      "add days",
      "time difference",
      "date"
    ],
    "features": [
      "Total calendar days",
      "Business days (excluding weekends)",
      "Add or subtract days/weeks/months"
    ],
    "faqs": [
      {
        "question": "How does business day calculation work?",
        "answer": "Iterates through the range and excludes Saturdays and Sundays."
      }
    ],
    "relatedToolSlugs": [
      "age-calculator",
      "percentage-calculator",
      "emi-calculator"
    ],
    "nextSteps": [
      "working-days-calculator",
      "age-calculator",
      "unix-timestamp-converter"
    ]
  },
  "image-to-text": {
    "slug": "image-to-text",
    "name": "Image to Text (OCR)",
    "shortName": "Image to Text",
    "tagline": "Copy text out of screenshots, scans and photos (OCR).",
    "category": "ai-tools",
    "description": "Extract text from screenshots, scans and photos. Runs on your device, with an optional AI mode for handwriting.",
    "longDescription": "Read the text out of any image and get it back as editable, copyable text. The default recogniser runs entirely in your browser, so the image is never uploaded. An optional AI mode handles handwriting, tables and non-English scripts that on-device OCR cannot.",
    "iconName": "ScanText",
    "privacy": "cloud-optional",
    "metaTitle": "Image to Text (OCR) | TabBench",
    "metaDescription": "Extract text from an image free. Runs in your browser so nothing is uploaded, with an optional AI mode for handwriting, tables and other scripts.",
    "keywords": [
      "image to text",
      "extract text from image",
      "ocr online free",
      "photo to text converter",
      "screenshot to text",
      "picture to text",
      "scan to text",
      "handwriting to text",
      "jpg to text",
      "png to text"
    ],
    "aliases": [
      "ocr",
      "extract text from image",
      "picture to text",
      "scan text",
      "screenshot to text"
    ],
    "features": [
      "On-device OCR so the image never leaves your browser",
      "Optional AI mode for handwriting and tables",
      "Editable result with copy and .txt download",
      "Confidence score so you know what to double-check"
    ],
    "faqs": [
      {
        "question": "Is my image uploaded anywhere?",
        "answer": "Not in the default on-device mode: recognition runs in your browser and the image never leaves your device. The optional AI mode does upload it to Google's Gemini API, and the tool says so before you use it."
      },
      {
        "question": "Why is the first run slow?",
        "answer": "On-device mode downloads a recognition model of about 9MB the first time. Your browser caches it, so later runs start immediately and work offline."
      },
      {
        "question": "Can it read handwriting?",
        "answer": "On-device OCR is poor at handwriting. The AI mode handles it well, along with tables and non-Latin scripts."
      }
    ],
    "relatedToolSlugs": [
      "pdf-to-word",
      "crop-image",
      "image-compressor"
    ],
    "nextSteps": [
      "ai-text-summarizer",
      "word-counter",
      "pdf-to-word"
    ]
  },
  "hash-generator": {
    "slug": "hash-generator",
    "name": "Hash Generator",
    "shortName": "Hash Generator",
    "tagline": "Create MD5, SHA-1, SHA-256 and SHA-512 hashes of any text.",
    "category": "security",
    "description": "Generate MD5, SHA-1, SHA-256, and SHA-512 cryptographic hashes client-side in real-time.",
    "longDescription": "Compute secure cryptographic checksums and hashes for text strings using standard cryptographic algorithms right in your browser.",
    "iconName": "Fingerprint",
    "privacy": "local",
    "metaTitle": "Hash Generator | TabBench",
    "metaDescription": "Generate cryptographic MD5, SHA-1, SHA-256, and SHA-512 hashes instantly in your browser. Secure, fast, and private client-side hashing.",
    "keywords": [
      "hash generator",
      "sha256 generator",
      "md5 generator online",
      "sha512 generator",
      "hash text string",
      "sha256 hash generator",
      "md5 hash online",
      "sha512 checksum",
      "sha1 generator",
      "crypto hash maker"
    ],
    "aliases": [
      "md5",
      "sha256",
      "sha1",
      "checksum"
    ],
    "features": [
      "MD5, SHA-1, SHA-256, SHA-512 algorithms",
      "Live real-time hash generation",
      "One-click copy hash",
      "Uppercase and lowercase hex"
    ],
    "faqs": [
      {
        "question": "Can a hash be decrypted?",
        "answer": "No, cryptographic hash functions are one-way functions."
      }
    ],
    "relatedToolSlugs": [
      "password-generator",
      "base64-converter",
      "uuid-generator"
    ],
    "nextSteps": [
      "password-generator",
      "base64-converter"
    ]
  },
  "text-diff-checker": {
    "slug": "text-diff-checker",
    "name": "Text Diff Checker",
    "shortName": "Text Diff Checker",
    "tagline": "Compare two texts and see exactly what was added or removed.",
    "category": "text",
    "description": "Compare two text snippets side-by-side to highlight additions, deletions, and line-by-line differences.",
    "longDescription": "Find differences between two versions of text, code, or documentation. Visual line-by-line comparison highlighting exact edits.",
    "iconName": "GitCompareArrows",
    "privacy": "local",
    "metaTitle": "Text Diff Checker | TabBench",
    "metaDescription": "Compare two blocks of text side by side to find differences, added words, and removed lines. Private, instant in-browser comparison.",
    "keywords": [
      "text diff checker",
      "compare text online",
      "diff checker",
      "text comparison tool",
      "find differences in text",
      "compare two text files",
      "side by side text comparison",
      "text difference finder",
      "diff tool online"
    ],
    "aliases": [
      "compare text",
      "diff",
      "difference",
      "text compare"
    ],
    "features": [
      "Side-by-side or unified diff view",
      "Added and deleted line highlights",
      "Word-level change detection",
      "Zero server upload"
    ],
    "faqs": [
      {
        "question": "How does the diff algorithm work?",
        "answer": "It uses the Myers difference algorithm — the one behind git diff — to find the smallest set of added and removed lines. Lines that were edited rather than wholly added or removed are shown side by side with the changed words highlighted."
      }
    ],
    "relatedToolSlugs": [
      "word-counter",
      "case-converter",
      "json-formatter"
    ],
    "nextSteps": [
      "word-counter",
      "case-converter",
      "text-sorter"
    ]
  },
  "ai-explainer": {
    "slug": "ai-explainer",
    "name": "AI Formula Explainer",
    "shortName": "AI Formula Explainer",
    "tagline": "Plain-English explanations of formulas, calculations and code.",
    "category": "ai-tools",
    "description": "Get instant, plain-English explanations for complex formulas, financial calculations, regex patterns, or code snippets.",
    "longDescription": "An intelligent educational explainer that demystifies mathematical formulas, financial metrics, regex expressions, and code structures.",
    "iconName": "Sigma",
    "privacy": "cloud-optional",
    "metaTitle": "AI Formula Explainer | TabBench",
    "metaDescription": "Understand math formulas, financial metrics, code logic, and regex in plain English with instant AI-powered explanations.",
    "keywords": [
      "ai formula explainer",
      "explain math formula",
      "ai formula assistant",
      "explain regex online",
      "formula explainer",
      "explain code ai",
      "excel formula explainer",
      "regex pattern explainer",
      "ai code breakdown",
      "plain english formula assistant",
      "ai math demo"
    ],
    "aliases": [
      "explain formula",
      "explain code"
    ],
    "features": [
      "Plain English math breakdowns",
      "Business scenario interpretations",
      "Regex & code pattern explainer",
      "Interactive query assistant"
    ],
    "faqs": [
      {
        "question": "What can it explain?",
        "answer": "Ask anything about a formula, calculation, spreadsheet function, regex or code snippet and Google Gemini answers it. Hand-written explanations of common formulas — margin and markup, percentage change, compound interest, loan EMI, GST, SIP, BMI and JWT — work instantly and offline."
      }
    ],
    "relatedToolSlugs": [
      "percentage-calculator",
      "profit-margin-calculator",
      "json-formatter"
    ],
    "nextSteps": [
      "percentage-calculator",
      "regex-tester",
      "ai-json-explainer"
    ]
  },
  "split-pdf": {
    "slug": "split-pdf",
    "name": "Split PDF",
    "shortName": "Split PDF",
    "tagline": "Pull out specific pages or page ranges into a new PDF.",
    "category": "pdf-docs",
    "description": "Extract specific pages or page ranges from a PDF into a new document, entirely in your browser.",
    "longDescription": "Pull selected pages out of a PDF into a new file using simple range syntax like 1-3, 5, 8-10. Runs client-side with pdf-lib, so contracts and statements are never uploaded.",
    "iconName": "Split",
    "privacy": "local",
    "metaTitle": "Split PDF | TabBench",
    "metaDescription": "Split PDF files and extract specific pages or custom page ranges into new documents. Fast, secure, and processed in your browser.",
    "keywords": [
      "split pdf",
      "extract pages from pdf",
      "pdf splitter online",
      "separate pdf pages",
      "extract page range pdf",
      "cut pdf pages",
      "save specific pages from pdf",
      "separate pdf document",
      "divide pdf online"
    ],
    "aliases": [
      "extract pages",
      "separate pdf",
      "pdf splitter",
      "remove pages"
    ],
    "features": [
      "Range syntax like 1-3, 5, 8-10",
      "Live count of selected pages",
      "Lossless page copying",
      "Nothing is uploaded"
    ],
    "faqs": [
      {
        "question": "Does splitting reduce quality?",
        "answer": "No. Pages are copied across byte-for-byte, so text, vectors, and images are preserved exactly."
      }
    ],
    "relatedToolSlugs": [
      "pdf-merge",
      "rotate-pdf",
      "pdf-to-jpg"
    ],
    "nextSteps": [
      "pdf-merge",
      "rotate-pdf",
      "pdf-to-jpg",
      "add-page-numbers"
    ]
  },
  "pdf-to-jpg": {
    "slug": "pdf-to-jpg",
    "name": "PDF to JPG Converter",
    "shortName": "PDF to JPG Converter",
    "tagline": "Save every PDF page as a JPG or PNG image.",
    "category": "pdf-docs",
    "description": "Render every page of a PDF as a JPG or PNG image and download them individually or as a ZIP.",
    "longDescription": "Convert PDF pages into images at your chosen resolution using pdf.js. Download single pages or the whole document as a ZIP archive, with all rendering done inside your browser.",
    "iconName": "FileImage",
    "privacy": "local",
    "metaTitle": "PDF to JPG Converter | TabBench",
    "metaDescription": "Convert PDF pages into high-resolution JPG or PNG images (up to 288 DPI). Download individual pages or a ZIP archive.",
    "keywords": [
      "pdf to jpg",
      "pdf to image converter",
      "convert pdf to png",
      "extract images from pdf",
      "pdf pages to jpg",
      "convert pdf to images",
      "extract jpg from pdf",
      "pdf pages to png",
      "save pdf as photos",
      "pdf to image high res"
    ],
    "aliases": [
      "pdf to image",
      "pdf to png",
      "pdf pages to images"
    ],
    "features": [
      "JPG or PNG output",
      "Selectable render resolution",
      "Batch ZIP download",
      "Rendered in your browser"
    ],
    "faqs": [
      {
        "question": "What resolution should I choose?",
        "answer": "2x (about 144 DPI) suits screen use. Choose 3x or 4x for printing, which produces larger files."
      }
    ],
    "relatedToolSlugs": [
      "image-to-pdf",
      "split-pdf",
      "image-compressor"
    ],
    "nextSteps": [
      "image-compressor",
      "image-to-pdf",
      "split-pdf"
    ]
  },
  "rotate-pdf": {
    "slug": "rotate-pdf",
    "name": "Rotate PDF",
    "shortName": "Rotate PDF",
    "tagline": "Turn PDF pages 90°, 180° or 270° and save the fixed file.",
    "category": "pdf-docs",
    "description": "Rotate every page of a PDF by 90, 180, or 270 degrees and save the corrected document.",
    "longDescription": "Fix sideways or upside-down scans by rotating PDF pages. Rotation is added to any existing page rotation so already-landscape pages stay correct, and the file never leaves your browser.",
    "iconName": "RotateCw",
    "privacy": "local",
    "metaTitle": "Rotate PDF | TabBench",
    "metaDescription": "Rotate PDF pages clockwise or counter-clockwise (90°, 180°, 270°) and save the corrected document. 100% private in-browser.",
    "keywords": [
      "rotate pdf",
      "rotate pdf pages",
      "turn pdf sideways",
      "rotate pdf 90 degrees",
      "fix upside down pdf",
      "rotate pdf pages online",
      "change pdf orientation",
      "permanent pdf rotation",
      "flip pdf pages"
    ],
    "aliases": [
      "turn pdf",
      "pdf orientation",
      "rotate pages"
    ],
    "features": [
      "90, 180 or 270 degree rotation",
      "Respects existing page rotation",
      "Lossless — no re-encoding",
      "Nothing is uploaded"
    ],
    "faqs": [
      {
        "question": "Is the rotation permanent?",
        "answer": "Yes. The rotation is written into the downloaded PDF, so every reader displays it the same way."
      }
    ],
    "relatedToolSlugs": [
      "split-pdf",
      "pdf-merge",
      "add-page-numbers"
    ],
    "nextSteps": [
      "pdf-merge",
      "add-page-numbers",
      "split-pdf"
    ]
  },
  "add-page-numbers": {
    "slug": "add-page-numbers",
    "name": "Add Page Numbers to PDF",
    "shortName": "Add Page Numbers",
    "tagline": "Stamp page numbers on a PDF in the position you choose.",
    "category": "pdf-docs",
    "description": "Stamp sequential page numbers onto a PDF with a choice of position and starting number.",
    "longDescription": "Add clean page numbers to any PDF, choosing the corner they sit in and the number to start counting from. Useful for court filings, dissertations, and any document that must be paginated.",
    "iconName": "ListOrdered",
    "privacy": "local",
    "metaTitle": "Add Page Numbers to PDF | TabBench",
    "metaDescription": "Add page numbers to PDF documents with customizable placement, formatting, and starting numbers. Processed entirely in your browser.",
    "keywords": [
      "add page numbers to pdf",
      "number pdf pages",
      "pdf pagination online",
      "insert page numbers in pdf",
      "pdf page numbering",
      "number pdf pages online",
      "bates numbering pdf",
      "insert page numbers into document",
      "stamp page numbers pdf"
    ],
    "aliases": [
      "number pages",
      "pdf page numbering",
      "paginate pdf"
    ],
    "features": [
      "Bottom centre, bottom right or top right",
      "Custom starting number",
      "Clean Helvetica numbering",
      "Nothing is uploaded"
    ],
    "faqs": [
      {
        "question": "Can I start numbering from a page other than 1?",
        "answer": "Yes. Set any starting number, which is useful when front matter is numbered separately."
      }
    ],
    "relatedToolSlugs": [
      "pdf-merge",
      "split-pdf",
      "rotate-pdf"
    ],
    "nextSteps": [
      "pdf-merge",
      "pdf-editor",
      "rotate-pdf"
    ]
  },
  "image-resizer": {
    "slug": "image-resizer",
    "name": "Image Resizer",
    "shortName": "Image Resizer",
    "tagline": "Resize images to exact pixels or a percentage, keeping proportions.",
    "category": "image-media",
    "description": "Resize any image to exact pixel dimensions or a percentage, with aspect ratio locking.",
    "longDescription": "Change an image's pixel dimensions precisely, with an optional aspect-ratio lock and high-quality resampling. Export as JPG, PNG, or WebP without uploading anything.",
    "iconName": "Scaling",
    "privacy": "local",
    "metaTitle": "Image Resizer | TabBench",
    "metaDescription": "Resize images by exact width/height pixels or percentage scale. Maintain aspect ratios and download optimized images instantly.",
    "keywords": [
      "image resizer",
      "resize image online",
      "resize image by pixel",
      "resize photo percentage",
      "change image dimensions",
      "resize photo pixels",
      "change image width height",
      "scale image dimensions",
      "photo resizer online",
      "reduce image dimensions"
    ],
    "aliases": [
      "change image size",
      "image dimensions",
      "scale image",
      "resize photo",
      "image size"
    ],
    "features": [
      "Exact pixel width and height",
      "Aspect ratio lock",
      "25/50/75% quick presets",
      "JPG, PNG or WebP output"
    ],
    "faqs": [
      {
        "question": "Does resizing lose quality?",
        "answer": "Downscaling is essentially lossless to the eye. Enlarging cannot add detail that was never captured, so upscaled images look soft."
      }
    ],
    "relatedToolSlugs": [
      "image-compressor",
      "crop-image",
      "png-to-jpg"
    ],
    "nextSteps": [
      "image-compressor",
      "crop-image",
      "aspect-ratio-calculator",
      "favicon-generator"
    ]
  },
  "favicon-generator": {
    "slug": "favicon-generator",
    "name": "Favicon Generator",
    "shortName": "Favicon Generator",
    "tagline": "Turn a logo into every favicon and app icon size a site needs.",
    "category": "image-media",
    "description": "Turn a logo into a full set of favicon PNGs at every size browsers and phones request.",
    "longDescription": "Generate favicons at 16px through 512px from a single logo, including the 180px Apple touch icon, packaged as a ZIP with a ready-to-paste HTML snippet and web manifest.",
    "iconName": "AppWindow",
    "privacy": "local",
    "metaTitle": "Favicon Generator | TabBench",
    "metaDescription": "Generate multi-size website favicons (16x16, 32x32, 48x48, 180x180) and Apple touch icons from any logo or photo in seconds.",
    "keywords": [
      "favicon generator",
      "create favicon",
      "favicon from image",
      "png to favicon",
      "ico generator online",
      "make favicon online",
      "generate apple touch icon",
      "logo to favicon",
      "ico maker",
      "website icon generator"
    ],
    "aliases": [
      "favicon",
      "site icon",
      "apple touch icon",
      "app icon"
    ],
    "features": [
      "Nine sizes from 16px to 512px",
      "Apple touch icon at 180px",
      "ZIP with HTML snippet and manifest",
      "Transparent or solid background"
    ],
    "faqs": [
      {
        "question": "What source image works best?",
        "answer": "A square image of at least 512x512. Simple, high-contrast marks stay legible at 16px; detailed logos do not."
      }
    ],
    "relatedToolSlugs": [
      "image-resizer",
      "png-to-jpg",
      "crop-image"
    ],
    "nextSteps": [
      "png-to-svg",
      "image-resizer",
      "qr-code-generator"
    ]
  },
  "currency-converter": {
    "slug": "currency-converter",
    "name": "Currency Converter",
    "shortName": "Currency Converter",
    "tagline": "Convert between 160+ currencies at live exchange rates.",
    "category": "calculators",
    "description": "Convert dollar to rupee, rupee to dollar, and between 160+ world currencies at live mid-market exchange rates.",
    "longDescription": "Convert dollars to rupees, euros to rupees, and between more than 160 world currencies using live mid-market exchange rates, with the reverse rate and the bank margin explained alongside.",
    "iconName": "ArrowRightLeft",
    "privacy": "network",
    "privacyNote": "Fetches live exchange rates. The amounts you type are never sent.",
    "metaTitle": "Currency Converter | TabBench",
    "metaDescription": "Convert global currencies with live exchange rates. Compare foreign exchange values instantly across USD, EUR, GBP, INR, and 160+ currencies.",
    "keywords": [
      "currency converter",
      "exchange rate calculator",
      "currency exchange",
      "usd to inr",
      "eur to usd",
      "usd to inr converter",
      "dollar to rupee",
      "currency exchange rates",
      "convert money online",
      "euro to inr",
      "dirham to inr"
    ],
    "aliases": [
      "exchange rate",
      "usd to inr",
      "dollar to rupee",
      "forex",
      "money"
    ],
    "features": [
      "Live mid-market rates",
      "160+ currencies",
      "One-tap swap and reverse rate",
      "Popular pairs preset"
    ],
    "faqs": [
      {
        "question": "Why is my bank's rate worse than this?",
        "answer": "This shows the mid-market rate. Banks and cards add a margin of roughly 1-4%, plus any fixed transfer fee."
      }
    ],
    "relatedToolSlugs": [
      "percentage-calculator",
      "gst-calculator",
      "discount-calculator"
    ],
    "nextSteps": [
      "percentage-calculator",
      "gst-calculator",
      "salary-calculator"
    ]
  },
  "sample-file-generator": {
    "slug": "sample-file-generator",
    "name": "Sample File Generator",
    "shortName": "Sample File Generator",
    "tagline": "Create test images, PDFs, CSV, JSON or video at an exact file size.",
    "category": "developer",
    "description": "Generate dummy images, PDFs, Word files, CSV, JSON, and video at an exact file size for testing uploads.",
    "longDescription": "Create placeholder files at any size you specify — sample images, PDFs, DOCX, CSV, JSON, text, and short videos — with randomised content each time. Built for testing upload limits, forms, and file handling.",
    "iconName": "Shuffle",
    "privacy": "local",
    "metaTitle": "Sample File Generator | TabBench",
    "metaDescription": "Generate dummy files of any exact size across PDF, JPG, PNG, MP4, CSV, and JSON formats for upload and performance testing.",
    "keywords": [
      "sample file generator",
      "dummy file generator",
      "demo file generator",
      "random file generator",
      "test file download",
      "sample files for testing",
      "placeholder file generator",
      "mock file generator",
      "demo files"
    ],
    "aliases": [
      "dummy file",
      "test file",
      "mock data",
      "placeholder image",
      "sample pdf"
    ],
    "features": [
      "Exact target file size",
      "Image, PDF, Word, CSV, JSON, video",
      "Randomised content every time",
      "Copy small images as data URLs"
    ],
    "faqs": [
      {
        "question": "Are the files a real, valid format?",
        "answer": "Yes. Every file opens in its normal application; padding uses regions each format ignores."
      }
    ],
    "relatedToolSlugs": [
      "image-compressor",
      "pdf-compressor",
      "json-formatter"
    ],
    "nextSteps": [
      "image-compressor",
      "json-formatter",
      "json-to-csv"
    ]
  },
  "notepad": {
    "slug": "notepad",
    "name": "Online Notepad",
    "shortName": "Online Notepad",
    "tagline": "A quick notepad that saves to your browser as you type.",
    "category": "text",
    "description": "A distraction-free notepad that saves automatically to your browser. No account, no sync, no waiting.",
    "longDescription": "Jot notes, drafts, and snippets in a clean editor that autosaves to this browser as you type. Keep multiple notes, search across them, and export any note as a text file.",
    "iconName": "NotebookPen",
    "privacy": "local",
    "metaTitle": "Online Notepad | TabBench",
    "metaDescription": "A clean, distraction-free online notepad that autosaves your notes locally. No account required, 100% private, and works offline.",
    "keywords": [
      "online notepad",
      "notepad online",
      "quick notes online",
      "browser notepad autosave",
      "scratchpad online",
      "free online text editor",
      "demo notepad",
      "temporary notes autosave",
      "jot notes online",
      "browser scratchpad"
    ],
    "aliases": [
      "notes",
      "scratchpad",
      "text editor",
      "write"
    ],
    "features": [
      "Autosaves as you type",
      "Multiple notes with search",
      "Download any note as .txt",
      "Stored only in your browser"
    ],
    "faqs": [
      {
        "question": "Where are my notes stored?",
        "answer": "In this browser's local storage. They are not uploaded, and they will not appear on your other devices."
      }
    ],
    "relatedToolSlugs": [
      "word-counter",
      "case-converter",
      "text-diff-checker"
    ],
    "nextSteps": [
      "word-counter",
      "text-to-speech",
      "case-converter"
    ]
  },
  "text-to-speech": {
    "slug": "text-to-speech",
    "name": "Text to Speech",
    "shortName": "Text to Speech",
    "tagline": "Hear any text read aloud with your device's voices.",
    "category": "text",
    "description": "Read any text aloud using your device's own voices, with adjustable speed and pitch.",
    "longDescription": "Paste text and have it read aloud using the voices installed on your device. Adjust speed and pitch, pause and resume, and proofread by ear. Nothing is sent anywhere.",
    "iconName": "Volume2",
    "privacy": "local",
    "metaTitle": "Text to Speech | TabBench",
    "metaDescription": "Convert written text into natural spoken audio directly in your browser. Choose system voices, adjust speed and pitch, and listen instantly.",
    "keywords": [
      "text to speech",
      "text to speech online",
      "tts reader",
      "read text aloud",
      "voice reader online",
      "convert text to audio",
      "read aloud online",
      "speech synthesizer",
      "listen to article online",
      "tts voice generator"
    ],
    "aliases": [
      "tts",
      "read aloud",
      "voice",
      "speak text"
    ],
    "features": [
      "Uses your device's built-in voices",
      "Adjustable speed and pitch",
      "Pause, resume and stop",
      "Text never leaves your device"
    ],
    "faqs": [
      {
        "question": "Why do I only see a few voices?",
        "answer": "Voices come from your operating system. Install more in your system's speech or accessibility settings."
      }
    ],
    "relatedToolSlugs": [
      "speech-to-text",
      "word-counter",
      "notepad"
    ],
    "nextSteps": [
      "speech-to-text",
      "notepad"
    ]
  },
  "speech-to-text": {
    "slug": "speech-to-text",
    "name": "Speech to Text",
    "shortName": "Speech to Text",
    "tagline": "Dictate and get an editable transcript in 14 languages.",
    "category": "text",
    "description": "Dictate and get a live transcript you can edit, copy, or download. Supports Hindi, Tamil, and more.",
    "longDescription": "Speak and watch words appear as you talk, with support for English, Hindi, Bengali, Tamil, Telugu and more. Edit the transcript inline, then copy or download it. Note that browsers process speech in the cloud.",
    "iconName": "Mic",
    "privacy": "network",
    "privacyNote": "Uses your browser's speech recognition, which may process audio on your browser vendor's servers.",
    "metaTitle": "Speech to Text | TabBench",
    "metaDescription": "Dictate text and transcribe spoken voice into written text in real time. Free in-browser speech recognition with instant copying and export.",
    "keywords": [
      "speech to text",
      "voice to text",
      "voice dictation online",
      "transcribe audio in browser",
      "speech recognition online",
      "voice typing online",
      "audio to text transcriber",
      "live dictation tool",
      "speech transcriber hindi english"
    ],
    "aliases": [
      "dictation",
      "voice typing",
      "transcribe",
      "voice to text"
    ],
    "features": [
      "Live transcript as you speak",
      "14 languages including Hindi and Tamil",
      "Editable, copyable, downloadable",
      "No signup or install"
    ],
    "faqs": [
      {
        "question": "Is my voice sent to a server?",
        "answer": "In Chrome and Edge, yes — they use a cloud speech service. Safari transcribes on-device. This is a browser behaviour, not a site choice."
      }
    ],
    "relatedToolSlugs": [
      "text-to-speech",
      "notepad",
      "word-counter"
    ],
    "nextSteps": [
      "notepad",
      "ai-text-summarizer",
      "word-counter"
    ]
  },
  "video-player": {
    "slug": "video-player",
    "name": "Video Player",
    "shortName": "Video Player",
    "tagline": "Play MP4, WebM and MOV files from your device with speed control.",
    "category": "image-media",
    "description": "Play MP4, WebM, MOV and more straight from your device, with speed control, picture-in-picture and a playlist.",
    "longDescription": "Open any video your browser can decode and play it with full transport controls, adjustable speed, picture-in-picture and a multi-file playlist. Files play from disk and are never uploaded.",
    "iconName": "MonitorPlay",
    "privacy": "local",
    "metaTitle": "Video Player | TabBench",
    "metaDescription": "Play MP4, WebM, MOV, and local video files in your browser with speed controls, playlists, and picture-in-picture. Nothing uploaded.",
    "keywords": [
      "online video player",
      "video player online",
      "play mp4 online",
      "browser video player",
      "play webm video",
      "local video player",
      "play video in browser",
      "mov player online",
      "speed control video player"
    ],
    "aliases": [
      "mp4 player",
      "play video",
      "media player"
    ],
    "features": [
      "Plays MP4, WebM, MOV and Ogg",
      "0.5x to 2x playback speed",
      "Picture-in-picture and fullscreen",
      "Multi-file playlist"
    ],
    "faqs": [
      {
        "question": "Is my video uploaded?",
        "answer": "No. The file is read from disk and played locally, so even multi-gigabyte videos open instantly."
      }
    ],
    "relatedToolSlugs": [
      "audio-player",
      "video-cutter",
      "image-compressor"
    ],
    "nextSteps": [
      "video-cutter",
      "audio-remover",
      "audio-player"
    ]
  },
  "audio-player": {
    "slug": "audio-player",
    "name": "Audio Player",
    "shortName": "Audio Player",
    "tagline": "Play MP3, WAV, FLAC and M4A files with a playlist.",
    "category": "image-media",
    "description": "Play MP3, WAV, FLAC, M4A and OGG files with a playlist and speed control, entirely in your browser.",
    "longDescription": "Open audio files from your device and play them with a queue, adjustable speed and full transport controls. Useful for reviewing recordings and lectures without installing anything.",
    "iconName": "Music",
    "privacy": "local",
    "metaTitle": "Audio Player | TabBench",
    "metaDescription": "Play MP3, WAV, FLAC, M4A, and OGG audio files directly in your browser with playlist management and playback speed controls.",
    "keywords": [
      "online audio player",
      "audio player online",
      "play mp3 online",
      "flac player browser",
      "wav audio player",
      "play audio files online",
      "m4a player online",
      "browser music player",
      "audio speed controller"
    ],
    "aliases": [
      "mp3 player",
      "music player",
      "play audio"
    ],
    "features": [
      "MP3, WAV, FLAC, M4A, OGG",
      "Queue multiple files",
      "0.5x to 2x speed",
      "Nothing leaves your device"
    ],
    "faqs": [
      {
        "question": "Can I speed up a lecture recording?",
        "answer": "Yes — playback speed runs from 0.5x to 2x, and pitch is preserved by the browser."
      }
    ],
    "relatedToolSlugs": [
      "video-player",
      "speech-to-text",
      "text-to-speech"
    ],
    "nextSteps": [
      "video-player",
      "speech-to-text"
    ]
  },
  "pdf-editor": {
    "slug": "pdf-editor",
    "name": "PDF Editor",
    "shortName": "PDF Editor",
    "tagline": "Edit PDF text, fill forms, add signatures and reorder pages.",
    "category": "pdf-docs",
    "description": "Click any text in a PDF to retype it. Fill form fields, add text or signatures, and manage pages.",
    "longDescription": "Click a word on the page and retype it — the editor finds every line of text in your PDF and lets you replace it in place, matching the original position, size and colour. Also fills real form fields, adds text, images and signatures, and reorders, rotates or deletes pages. Everything runs in your browser.",
    "iconName": "FilePen",
    "privacy": "local",
    "metaTitle": "PDF Editor & Form Filler | TabBench",
    "metaDescription": "Edit PDF text, fill form fields, add annotations and signatures, and manage pages directly in your browser. No signup, zero uploads.",
    "keywords": [
      "pdf editor",
      "edit pdf online",
      "edit pdf text free",
      "fill pdf form online",
      "add signature to pdf",
      "sign pdf online",
      "draw on pdf",
      "pdf annotations",
      "fill form fields",
      "whiteout pdf",
      "redact pdf",
      "modify pdf"
    ],
    "aliases": [
      "edit pdf",
      "fill pdf form",
      "sign pdf",
      "pdf form filler",
      "annotate pdf",
      "add text to pdf"
    ],
    "features": [
      "Edit real PDF form fields",
      "Add text or cover and retype",
      "Insert signature or image",
      "Reorder, rotate and delete pages"
    ],
    "faqs": [
      {
        "question": "Can I edit text already in the PDF?",
        "answer": "If it is a form field, yes — directly. Otherwise cover it and type over the top, which is how PDF editors handle flattened text."
      }
    ],
    "relatedToolSlugs": [
      "split-pdf",
      "pdf-merge",
      "rotate-pdf"
    ],
    "nextSteps": [
      "add-page-numbers",
      "pdf-merge",
      "split-pdf",
      "pdf-to-word"
    ]
  },
  "video-cutter": {
    "slug": "video-cutter",
    "name": "Video Cutter",
    "shortName": "Video Cutter",
    "tagline": "Trim a video to a start and end point without re-encoding.",
    "category": "image-media",
    "description": "Trim a video to any start and end point without re-encoding — instant and lossless.",
    "longDescription": "Cut a clip out of any video by dragging start and end handles, then download it. The trim copies streams rather than re-encoding, so it finishes almost immediately and loses no quality.",
    "iconName": "Scissors",
    "privacy": "local",
    "metaTitle": "Video Cutter | TabBench",
    "metaDescription": "Trim and cut video clips to any start and end timestamp without re-encoding. Lossless, instant, and runs 100% locally in your browser.",
    "keywords": [
      "video cutter",
      "trim video online",
      "cut video free",
      "video trimmer online",
      "shorten video file",
      "cut mp4 video clip",
      "video splitter online",
      "trim mp4 without reencoding",
      "lossless video cutter"
    ],
    "aliases": [
      "trim video",
      "cut video",
      "clip video",
      "shorten video"
    ],
    "features": [
      "Lossless stream copy — no re-encode",
      "Drag to set start and end",
      "Preview before cutting",
      "Runs entirely in your browser"
    ],
    "faqs": [
      {
        "question": "Does trimming reduce quality?",
        "answer": "No. The cut copies streams rather than re-encoding, so the output is bit-identical to the source within the range you kept."
      }
    ],
    "relatedToolSlugs": [
      "audio-remover",
      "video-player",
      "image-compressor"
    ],
    "nextSteps": [
      "audio-remover",
      "video-player"
    ]
  },
  "audio-remover": {
    "slug": "audio-remover",
    "name": "Remove Audio from Video",
    "shortName": "Remove Audio from Video",
    "tagline": "Mute a video, or extract its audio track as a separate file.",
    "category": "image-media",
    "description": "Strip the sound from a video, or pull the audio out as a separate file — both without re-encoding.",
    "longDescription": "Mute a video by removing its audio track entirely, or extract that audio as an .m4a file. Both are stream copies, so the video keeps its exact original quality and the audio keeps its original bitrate.",
    "iconName": "VolumeX",
    "privacy": "local",
    "metaTitle": "Remove Audio from Video | TabBench",
    "metaDescription": "Mute video or extract audio tracks as separate files without re-encoding. Fast, lossless, and completely client-side.",
    "keywords": [
      "remove audio from video",
      "mute video online",
      "extract audio from video",
      "silent video maker",
      "strip audio track",
      "remove sound from mp4",
      "mute mp4 file online",
      "extract m4a from video",
      "remove audio track"
    ],
    "aliases": [
      "mute video",
      "remove sound",
      "extract audio",
      "video to audio"
    ],
    "features": [
      "Remove the audio track entirely",
      "Or extract audio as .m4a",
      "No re-encoding either way",
      "Nothing is uploaded"
    ],
    "faqs": [
      {
        "question": "Will the video quality change?",
        "answer": "No. The video stream is copied untouched; only the audio track is dropped."
      }
    ],
    "relatedToolSlugs": [
      "video-cutter",
      "audio-player",
      "video-player"
    ],
    "nextSteps": [
      "video-cutter",
      "audio-player"
    ]
  },
  "sip-calculator": {
    "slug": "sip-calculator",
    "name": "SIP Calculator",
    "shortName": "SIP Calculator",
    "tagline": "Project the future value of a monthly SIP investment.",
    "category": "calculators",
    "description": "Calculate returns on your Systematic Investment Plan (SIP) with annual growth projections.",
    "longDescription": "Estimate your mutual fund SIP wealth growth, total invested amount, and compounding gains with instant interactive year-by-year projections.",
    "iconName": "PiggyBank",
    "privacy": "local",
    "metaTitle": "SIP Calculator | TabBench",
    "metaDescription": "Calculate mutual fund SIP returns and maturity wealth with TabBench's free calculator. Live annual compounding breakdown and visual growth charts.",
    "keywords": [
      "sip calculator",
      "mutual fund sip calculator",
      "sip return calculator",
      "systematic investment plan",
      "sip maturity calculator",
      "monthly sip calculator",
      "calculate sip online"
    ],
    "aliases": [
      "mutual fund",
      "investment returns",
      "systematic investment plan"
    ],
    "features": [
      "Monthly investment slider",
      "Expected return rate projection",
      "Visual invested vs returns ratio",
      "Year-by-year growth table"
    ],
    "formulas": [
      {
        "name": "SIP Maturity Formula",
        "expression": "M = P × [((1 + i)^n - 1) / i] × (1 + i)",
        "explanation": "Where P is monthly deposit, i is periodic monthly interest rate (annual / 12), and n is total months.",
        "example": "10,000/mo for 10 years at 12% returns ~23.23 Lakhs on an investment of 12 Lakhs."
      }
    ],
    "faqs": [
      {
        "question": "What is a good expected rate of return for equity SIP?",
        "answer": "Historically, broad market index funds and diversified equity mutual funds have returned 12% to 14% CAGR over 10+ year horizons."
      }
    ],
    "relatedToolSlugs": [
      "compound-interest-calculator",
      "emi-calculator",
      "percentage-calculator"
    ],
    "nextSteps": [
      "compound-interest-calculator",
      "emi-calculator",
      "salary-calculator"
    ]
  },
  "compound-interest-calculator": {
    "slug": "compound-interest-calculator",
    "name": "Compound Interest Calculator",
    "shortName": "Compound Interest",
    "tagline": "See how savings grow with compounding and regular deposits.",
    "category": "calculators",
    "description": "Calculate compound interest with regular deposits, multiple compounding frequencies, and timeline breakdowns.",
    "longDescription": "Compute exact compound interest growth on initial deposits and optional monthly contributions across daily, monthly, quarterly, and annual compounding periods.",
    "iconName": "ChartLine",
    "privacy": "local",
    "metaTitle": "Compound Interest Calculator | TabBench",
    "metaDescription": "Calculate compound interest growth with initial deposits, monthly contributions, and flexible compounding frequencies. 100% private in-browser tool.",
    "keywords": [
      "compound interest calculator",
      "interest calculator",
      "compound interest formula",
      "daily compound interest",
      "monthly compound interest",
      "savings interest calculator"
    ],
    "aliases": [
      "interest calculator",
      "savings growth",
      "fd calculator"
    ],
    "features": [
      "Daily to annual compounding frequencies",
      "Optional monthly contribution support",
      "Effective Annual Rate (EAR) calculation",
      "Principal vs interest progress visualization"
    ],
    "formulas": [
      {
        "name": "Compound Interest Formula",
        "expression": "A = P(1 + r/n)^(nt)",
        "explanation": "Where P is principal, r is annual interest rate, n is compounding frequency per year, and t is time in years.",
        "example": "50,000 at 8% compounded monthly for 5 years yields ~74,492."
      }
    ],
    "faqs": [
      {
        "question": "What is the difference between simple and compound interest?",
        "answer": "Simple interest calculates returns only on the initial principal, while compound interest adds accumulated interest back to the principal for exponential growth."
      }
    ],
    "relatedToolSlugs": [
      "sip-calculator",
      "emi-calculator",
      "percentage-calculator"
    ],
    "nextSteps": [
      "sip-calculator",
      "emi-calculator",
      "percentage-calculator"
    ]
  },
  "bmi-calculator": {
    "slug": "bmi-calculator",
    "name": "BMI Calculator",
    "shortName": "BMI Calculator",
    "tagline": "Body Mass Index, healthy weight range and WHO category.",
    "category": "calculators",
    "description": "Calculate Body Mass Index (BMI), healthy weight range, and WHO classification for adults.",
    "longDescription": "Instant body mass index calculator supporting metric (cm/kg) and imperial (feet-inches/lbs) units with WHO classification categories and ideal weight ranges.",
    "iconName": "HeartPulse",
    "privacy": "local",
    "metaTitle": "BMI Calculator | TabBench",
    "metaDescription": "Calculate Body Mass Index (BMI) and ideal weight range instantly. Supports metric and imperial units with WHO classification categories.",
    "keywords": [
      "bmi calculator",
      "body mass index",
      "calculate bmi",
      "ideal weight calculator",
      "bmi chart",
      "healthy weight range",
      "bmi metric imperial"
    ],
    "aliases": [
      "body mass index",
      "healthy weight",
      "weight calculator"
    ],
    "features": [
      "Metric (cm/kg) and Imperial (ft-in/lbs)",
      "WHO classification categories",
      "Ideal healthy weight range",
      "BMI Prime calculation"
    ],
    "formulas": [
      {
        "name": "BMI Formula",
        "expression": "BMI = weight (kg) / [height (m)]²",
        "explanation": "Body weight in kilograms divided by the square of height in meters.",
        "example": "70 kg / (1.75 m)² = 22.86 (Normal weight)."
      }
    ],
    "faqs": [
      {
        "question": "What is considered a normal BMI score?",
        "answer": "According to the World Health Organization (WHO), a BMI between 18.5 and 24.9 is considered normal healthy weight for adults."
      }
    ],
    "relatedToolSlugs": [
      "age-calculator",
      "percentage-calculator"
    ],
    "nextSteps": [
      "age-calculator",
      "unit-converter"
    ]
  },
  "lorem-ipsum-generator": {
    "slug": "lorem-ipsum-generator",
    "name": "Lorem Ipsum Generator",
    "shortName": "Lorem Ipsum",
    "tagline": "Generate placeholder text by paragraphs, sentences or words.",
    "category": "text",
    "description": "Generate clean placeholder Lorem Ipsum text by paragraphs, sentences, words, or lists.",
    "longDescription": "A lightweight placeholder text generator for web designers, developers, and typesetters with customizable paragraph counts, HTML tag options, and instant one-click copying.",
    "iconName": "Pilcrow",
    "privacy": "local",
    "metaTitle": "Lorem Ipsum Generator | TabBench",
    "metaDescription": "Generate placeholder Lorem Ipsum text by paragraphs, sentences, words, or lists. Includes optional HTML tags and one-click copy.",
    "keywords": [
      "lorem ipsum generator",
      "dummy text generator",
      "placeholder text",
      "lorem ipsum",
      "latin text generator",
      "sample text generator"
    ],
    "aliases": [
      "placeholder text",
      "dummy text",
      "filler text"
    ],
    "features": [
      "Paragraphs, sentences, words & list items",
      "Optional HTML <p> / <li> tags",
      "Start with 'Lorem ipsum' toggle",
      "Live word and character counts"
    ],
    "faqs": [
      {
        "question": "Where does Lorem Ipsum originate?",
        "answer": "It comes from sections 1.10.32 and 1.10.33 of Cicero's 'de Finibus Bonorum et Malorum' written in 45 BC."
      }
    ],
    "relatedToolSlugs": [
      "word-counter",
      "case-converter",
      "slug-generator"
    ],
    "nextSteps": [
      "word-counter",
      "markdown-table-generator",
      "sample-file-generator"
    ]
  },
  "slug-generator": {
    "slug": "slug-generator",
    "name": "URL Slug Generator",
    "shortName": "Slug Generator",
    "tagline": "Turn a title into a clean, SEO-friendly URL slug.",
    "category": "text",
    "description": "Convert headlines and titles into clean, SEO-friendly URL slugs with customizable separators.",
    "longDescription": "Generate clean, URL-safe permalinks from any article title, product name, or headline with accent stripping, lowercase formatting, and optional stop word removal.",
    "iconName": "Link2",
    "privacy": "local",
    "metaTitle": "URL Slug Generator | TabBench",
    "metaDescription": "Convert headlines and titles into clean, SEO-friendly URL slugs with customizable separators, accent stripping, and lowercase formatting.",
    "keywords": [
      "slug generator",
      "url slug generator",
      "seo slug generator",
      "title to slug",
      "permalink generator",
      "url friendly string"
    ],
    "aliases": [
      "permalink",
      "url slug",
      "seo url"
    ],
    "features": [
      "Hyphen, underscore, and dot separators",
      "Diacritic and accent normalization",
      "Optional stop word removal",
      "Live blog URL preview"
    ],
    "faqs": [
      {
        "question": "What makes a good SEO URL slug?",
        "answer": "A good slug is concise, descriptive, lowercase, uses hyphens between words, and excludes special characters or punctuation."
      }
    ],
    "relatedToolSlugs": [
      "word-counter",
      "case-converter",
      "url-encoder-decoder"
    ],
    "nextSteps": [
      "utm-builder",
      "case-converter",
      "url-encoder-decoder"
    ]
  },
  "json-to-csv": {
    "slug": "json-to-csv",
    "name": "JSON to CSV Converter",
    "shortName": "JSON to CSV",
    "tagline": "Convert JSON arrays to CSV, and CSV back to JSON.",
    "category": "developer",
    "description": "Convert JSON arrays to CSV spreadsheets and CSV tables back to JSON with live preview and download.",
    "longDescription": "Bidirectional converter between JSON API payloads and CSV tabular data. Handles custom delimiters, quoted text cells, instant copy, and file downloads 100% in your browser.",
    "iconName": "FileSpreadsheet",
    "privacy": "local",
    "metaTitle": "JSON to CSV & CSV to JSON Converter | TabBench",
    "metaDescription": "Convert JSON to CSV spreadsheets and CSV to JSON arrays instantly in your browser. Supports custom delimiters, file upload, and direct download.",
    "keywords": [
      "json to csv",
      "csv to json",
      "convert json to spreadsheet",
      "json to excel",
      "csv parser",
      "json converter online"
    ],
    "aliases": [
      "csv to json",
      "json to excel",
      "spreadsheet"
    ],
    "features": [
      "Bidirectional JSON <-> CSV conversion",
      "Comma, semicolon, tab, and pipe delimiters",
      "Direct file upload (.json, .csv)",
      "Instant copy and file download"
    ],
    "faqs": [
      {
        "question": "Is my data uploaded to any server?",
        "answer": "No. The conversion runs completely within your browser's JavaScript memory. No data is sent over the network."
      }
    ],
    "relatedToolSlugs": [
      "json-formatter",
      "json-to-typescript",
      "base64-converter"
    ],
    "nextSteps": [
      "json-formatter",
      "json-to-typescript",
      "markdown-table-generator"
    ]
  },
  "regex-tester": {
    "slug": "regex-tester",
    "name": "Regex Tester",
    "shortName": "Regex Tester",
    "tagline": "Test regular expressions with live match and group highlighting.",
    "category": "developer",
    "description": "Test regular expressions with real-time match highlighting, capture group breakdown, and flags.",
    "longDescription": "Interactive JavaScript regex testing utility with live multi-match highlighting, capture group inspection, syntax validation, and a quick cheat sheet reference.",
    "iconName": "Regex",
    "privacy": "local",
    "metaTitle": "Regex Tester & Debugger | TabBench",
    "metaDescription": "Test regular expressions in real-time with live match highlighting, capture groups breakdown, flag toggles, and regex cheat sheet.",
    "keywords": [
      "regex tester",
      "regular expression tester",
      "regex debugger",
      "javascript regex tester",
      "regex matcher",
      "regex online"
    ],
    "aliases": [
      "regular expression",
      "regexp",
      "pattern matcher"
    ],
    "features": [
      "Live match highlighting",
      "Capture groups ($1, $2) breakdown",
      "Flag toggles (g, i, m, s, u)",
      "Built-in regex cheat sheet"
    ],
    "faqs": [
      {
        "question": "Which regex engine does this tool use?",
        "answer": "It uses your browser's native ECMAScript JavaScript RegExp engine supporting standard ES2024 features."
      }
    ],
    "relatedToolSlugs": [
      "json-formatter",
      "url-encoder-decoder",
      "cron-explainer"
    ],
    "nextSteps": [
      "ai-explainer",
      "text-diff-checker",
      "cron-explainer"
    ]
  },
  "html-entity-converter": {
    "slug": "html-entity-converter",
    "name": "HTML Entity Encoder & Decoder",
    "shortName": "HTML Entity Converter",
    "tagline": "Escape or unescape HTML characters as named, decimal or hex entities.",
    "category": "developer",
    "description": "Escape and unescape special HTML characters with named, decimal, and hex entity options.",
    "longDescription": "Convert reserved HTML characters into safe entities and decode encoded HTML entities back to plain text with instant live conversion.",
    "iconName": "CodeXml",
    "privacy": "local",
    "metaTitle": "HTML Entity Encoder & Decoder | TabBench",
    "metaDescription": "Encode reserved HTML characters to safe entities and decode HTML entities back to plain text. Supports named, decimal, and hex entities.",
    "keywords": [
      "html entity encoder",
      "html entity decoder",
      "escape html",
      "unescape html",
      "html entities online",
      "special characters html"
    ],
    "aliases": [
      "html escape",
      "html unescape",
      "html encode",
      "html decode"
    ],
    "features": [
      "Bidirectional encode and decode",
      "Named (&amp;), Decimal (&#38;), and Hex (&#x26;)",
      "Instant copy to clipboard",
      "Character count diagnostics"
    ],
    "faqs": [
      {
        "question": "Why do I need to escape HTML entities?",
        "answer": "Escaping characters like <, >, and & prevents browser rendering confusion and protects against Cross-Site Scripting (XSS) vulnerabilities."
      }
    ],
    "relatedToolSlugs": [
      "url-encoder-decoder",
      "base64-converter",
      "json-formatter"
    ],
    "nextSteps": [
      "url-encoder-decoder",
      "base64-converter"
    ]
  },
  "color-converter": {
    "slug": "color-converter",
    "name": "Color Converter",
    "shortName": "Color Converter",
    "tagline": "Convert HEX, RGB, HSL and CMYK and build matching palettes.",
    "category": "developer",
    "description": "Convert HEX, RGB, HSL, and CMYK color codes with harmonic palette generation and WCAG contrast previews.",
    "longDescription": "Comprehensive color conversion tool for web developers and UI designers. Converts across HEX, RGB, HSL, CMYK, CSS variables, and generates harmonic color schemes.",
    "iconName": "Palette",
    "privacy": "local",
    "metaTitle": "Color Converter & Palette Generator | TabBench",
    "metaDescription": "Convert colors between HEX, RGB, HSL, and CMYK with live preview, CSS custom properties, and complementary/triadic palette generation.",
    "keywords": [
      "color converter",
      "hex to rgb",
      "rgb to hex",
      "hex to hsl",
      "cmyk converter",
      "color palette generator",
      "css color converter"
    ],
    "aliases": [
      "hex to rgb",
      "rgb to hex",
      "color picker",
      "palette",
      "colour"
    ],
    "features": [
      "HEX, RGB, HSL, CMYK & CSS variables",
      "Live visual color picker",
      "Complementary, analogous & triadic harmonies",
      "One-click copy for all formats"
    ],
    "faqs": [
      {
        "question": "What is the difference between RGB and CMYK?",
        "answer": "RGB is an additive color model used for digital screens, while CMYK is a subtractive color model used for physical printing."
      }
    ],
    "relatedToolSlugs": [
      "contrast-checker",
      "favicon-generator",
      "base64-converter"
    ],
    "nextSteps": [
      "contrast-checker",
      "png-to-svg",
      "favicon-generator"
    ]
  },
  "salary-calculator": {
    "slug": "salary-calculator",
    "name": "Take-Home Salary Calculator",
    "shortName": "Salary Calculator",
    "tagline": "Estimate monthly in-hand pay from your annual CTC.",
    "category": "calculators",
    "description": "Calculate monthly take-home salary from annual CTC with tax slabs, PF, and deduction breakdown.",
    "longDescription": "Break down annual compensation (CTC) into monthly in-hand take-home salary, basic pay, HRA, Provident Fund (PF), and estimated income tax deductions.",
    "iconName": "Wallet",
    "privacy": "local",
    "metaTitle": "Salary Take-Home Pay Calculator | TabBench",
    "metaDescription": "Calculate monthly in-hand salary from annual CTC. Breakdown basic pay, HRA, Provident Fund (PF), and income tax deductions accurately.",
    "keywords": [
      "salary calculator",
      "in hand salary calculator",
      "ctc to in hand calculator",
      "take home pay calculator",
      "salary deduction calculator",
      "net salary calculator"
    ],
    "aliases": [
      "ctc to in hand",
      "take home pay",
      "net salary",
      "in hand salary"
    ],
    "features": [
      "Annual CTC to monthly in-hand conversion",
      "Variable bonus percentage adjustment",
      "New and old regime tax at FY 2025-26 rates",
      "Detailed annual salary structure breakdown"
    ],
    "formulas": [
      {
        "name": "Take-Home Salary Formula",
        "expression": "Monthly in-hand = (Fixed CTC − Employer PF − Employee PF − Professional tax − Income tax on fixed pay) / 12",
        "explanation": "Employer PF is part of CTC but goes to your PF account, so it is removed first. Income tax uses the FY 2025-26 slabs for the regime you choose, including the section 87A rebate and 4% cess.",
        "example": "₹12 lakh CTC with 10% variable pay and PF at 12% of basic: fixed gross ₹10,15,200, taxable income ₹10,60,200 (below ₹12 lakh, so no tax in the new regime) → about ₹79,000 a month in hand."
      }
    ],
    "faqs": [
      {
        "question": "What is the difference between CTC and in-hand salary?",
        "answer": "CTC (Cost to Company) includes all employer expenses such as bonuses and employer PF contributions, while in-hand salary is the actual amount deposited into your bank account after deductions."
      }
    ],
    "relatedToolSlugs": [
      "gst-calculator",
      "emi-calculator",
      "percentage-calculator"
    ],
    "nextSteps": [
      "emi-calculator",
      "sip-calculator",
      "gst-calculator"
    ]
  },
  "working-days-calculator": {
    "slug": "working-days-calculator",
    "name": "Business Days Calculator",
    "shortName": "Business Days",
    "tagline": "Count working days and hours between dates, minus weekends and holidays.",
    "category": "date-time",
    "description": "Calculate total business days and working hours between two dates excluding weekends and holidays.",
    "longDescription": "Accurately compute total working days between any two dates with customizable weekend days (Sat-Sun, Sun-only, Fri-Sat), public holiday exclusions, and working hours estimates.",
    "iconName": "CalendarCheck",
    "privacy": "local",
    "metaTitle": "Working Days & Business Days Calculator | TabBench",
    "metaDescription": "Calculate business days and working hours between dates with customizable weekend schedules and public holiday exclusions. 100% private.",
    "keywords": [
      "working days calculator",
      "business days calculator",
      "calculate working days",
      "days between dates excluding weekends",
      "working hours calculator",
      "business days between two dates"
    ],
    "aliases": [
      "working days",
      "workdays",
      "business days between dates",
      "exclude weekends",
      "date"
    ],
    "features": [
      "Customizable weekend schedules",
      "Custom public holiday exclusion list",
      "Total working hours calculation",
      "Calendar days vs business days distribution"
    ],
    "faqs": [
      {
        "question": "Does this calculator include both start and end dates?",
        "answer": "Yes, both start and end dates are evaluated inclusively in the date range."
      }
    ],
    "relatedToolSlugs": [
      "date-difference-calculator",
      "age-calculator",
      "unix-timestamp-converter"
    ],
    "nextSteps": [
      "date-difference-calculator",
      "age-calculator"
    ]
  },
  "unix-timestamp-converter": {
    "slug": "unix-timestamp-converter",
    "name": "Unix Timestamp Converter",
    "shortName": "Unix Timestamp",
    "tagline": "Convert epoch timestamps to readable dates and back.",
    "category": "date-time",
    "description": "Convert Unix epoch timestamps to human-readable UTC and local dates, with live ticking epoch clock.",
    "longDescription": "Bidirectional converter between Unix timestamps (seconds and milliseconds) and formatted UTC/local date-time strings with relative duration indicators.",
    "iconName": "Clock4",
    "privacy": "local",
    "metaTitle": "Unix Timestamp & Epoch Converter | TabBench",
    "metaDescription": "Convert Unix timestamps to human-readable UTC and local dates. Live ticking current epoch clock and reverse date-to-epoch converter.",
    "keywords": [
      "unix timestamp converter",
      "epoch converter",
      "timestamp to date",
      "date to epoch",
      "current unix timestamp",
      "epoch time online"
    ],
    "aliases": [
      "epoch converter",
      "timestamp to date",
      "date to timestamp",
      "date"
    ],
    "features": [
      "Live ticking epoch timestamp clock",
      "Seconds and milliseconds auto-detection",
      "UTC, ISO 8601, and local time conversions",
      "Relative time ('X hours ago') indicator"
    ],
    "faqs": [
      {
        "question": "What is Unix epoch time?",
        "answer": "Unix epoch time is the total number of seconds elapsed since 00:00:00 UTC on January 1, 1970, not counting leap seconds."
      }
    ],
    "relatedToolSlugs": [
      "date-difference-calculator",
      "working-days-calculator",
      "cron-explainer"
    ],
    "nextSteps": [
      "date-difference-calculator",
      "cron-explainer",
      "jwt-decoder"
    ]
  },
  "json-to-typescript": {
    "slug": "json-to-typescript",
    "name": "JSON to TypeScript Converter",
    "shortName": "JSON to TypeScript",
    "tagline": "Generate TypeScript interfaces from a JSON sample.",
    "category": "developer",
    "description": "Generate clean, typed TypeScript interfaces and type definitions from JSON API payloads.",
    "longDescription": "Instantly convert JSON objects and arrays into structured, nested TypeScript interfaces or type aliases with customizable root naming, optional properties, and readonly modifiers.",
    "iconName": "FileCode",
    "privacy": "local",
    "metaTitle": "JSON to TypeScript Generator | TabBench",
    "metaDescription": "Convert JSON payloads into clean, typed TypeScript interfaces and type aliases. Supports nested objects, readonly modifiers, and .ts file export.",
    "keywords": [
      "json to typescript",
      "json to ts",
      "json to interface",
      "typescript interface generator",
      "json to type",
      "generate typescript from json"
    ],
    "aliases": [
      "json to ts",
      "typescript interface",
      "json types"
    ],
    "features": [
      "Automatic nested interface generation",
      "Interface or Type alias output",
      "Optional and readonly field toggles",
      "Single-click copy and .ts file download"
    ],
    "faqs": [
      {
        "question": "Does this tool handle nested arrays and objects?",
        "answer": "Yes. It automatically extracts and names nested sub-objects into standalone exportable interfaces."
      }
    ],
    "relatedToolSlugs": [
      "json-formatter",
      "json-to-csv",
      "base64-converter"
    ],
    "nextSteps": [
      "json-formatter",
      "json-to-csv",
      "ai-json-explainer"
    ]
  },
  "cron-explainer": {
    "slug": "cron-explainer",
    "name": "Cron Expression Explainer",
    "shortName": "Cron Explainer",
    "tagline": "Read cron schedules in plain English and build new ones.",
    "category": "developer",
    "description": "Translate complex cron expressions into plain English schedules and build cron strings interactively.",
    "longDescription": "Understand and debug 5-part cron syntax with clear English explanations, field breakdowns, and common schedule presets for cron jobs.",
    "iconName": "CalendarClock",
    "privacy": "local",
    "metaTitle": "Cron Expression Explainer & Builder | TabBench",
    "metaDescription": "Translate cron expressions into plain English explanations. Includes 5-field syntax breakdown and common schedule presets.",
    "keywords": [
      "cron explainer",
      "cron expression builder",
      "cron generator",
      "cron schedule explainer",
      "crontab guru alternative",
      "explain cron syntax"
    ],
    "aliases": [
      "crontab",
      "cron schedule",
      "cron builder"
    ],
    "features": [
      "Plain English schedule translation",
      "5-field breakdown (Minute, Hour, Day, Month, Weekday)",
      "Common schedule preset library",
      "Instant copy to clipboard"
    ],
    "faqs": [
      {
        "question": "What do the 5 asterisks in a cron expression mean?",
        "answer": "The 5 fields represent: Minute (0-59), Hour (0-23), Day of the Month (1-31), Month (1-12), and Day of the Week (0-6, with 0 being Sunday)."
      }
    ],
    "relatedToolSlugs": [
      "unix-timestamp-converter",
      "regex-tester",
      "json-formatter"
    ],
    "nextSteps": [
      "unix-timestamp-converter",
      "regex-tester"
    ]
  },
  "utm-builder": {
    "slug": "utm-builder",
    "name": "UTM Builder",
    "shortName": "UTM Builder",
    "tagline": "Build campaign tracking links, or strip tracking from a URL.",
    "category": "business",
    "description": "Build marketing campaign tracking URLs and clean tracking parameters from existing links.",
    "longDescription": "Generate standardized UTM campaign tracking links for Google Analytics with utm_source, utm_medium, utm_campaign, utm_term, and utm_content. Also strips trackers for clean URLs.",
    "iconName": "Megaphone",
    "privacy": "local",
    "metaTitle": "UTM Campaign Builder & URL Cleaner | TabBench",
    "metaDescription": "Create Google Analytics UTM campaign tracking URLs and strip tracking parameters for clean links. Free, client-side digital marketing tool.",
    "keywords": [
      "utm builder",
      "utm generator",
      "campaign url builder",
      "google analytics utm builder",
      "clean utm parameters",
      "url tracker generator"
    ],
    "aliases": [
      "utm link",
      "campaign url",
      "utm generator",
      "remove utm"
    ],
    "features": [
      "Complete 5-parameter UTM generator",
      "Paste-to-parse existing URLs",
      "One-click tracker stripper (Clean URL)",
      "Instant copy to clipboard"
    ],
    "faqs": [
      {
        "question": "What are the essential UTM parameters?",
        "answer": "utm_source (where traffic comes from, e.g. google), utm_medium (marketing channel, e.g. cpc/email), and utm_campaign (the campaign name) are the standard required parameters."
      }
    ],
    "relatedToolSlugs": [
      "slug-generator",
      "url-encoder-decoder",
      "profit-margin-calculator"
    ],
    "nextSteps": [
      "url-encoder-decoder",
      "qr-code-generator",
      "slug-generator"
    ]
  },
  "break-even-calculator": {
    "slug": "break-even-calculator",
    "name": "Break-Even Calculator",
    "shortName": "Break-Even Calculator",
    "tagline": "Units and revenue needed to break even, plus projected ROI.",
    "category": "business",
    "description": "Calculate break-even units, break-even revenue, contribution margin, and projected ROI %.",
    "longDescription": "Analyze business profitability by calculating the exact sales volume and revenue required to cover fixed and variable costs, plus unit contribution margins.",
    "iconName": "Target",
    "privacy": "local",
    "metaTitle": "Break-Even & ROI Calculator | TabBench",
    "metaDescription": "Calculate business break-even sales volume, break-even revenue, unit contribution margin, and projected net profit/ROI percentage.",
    "keywords": [
      "break even calculator",
      "break even point",
      "calculate break even",
      "contribution margin calculator",
      "business roi calculator",
      "profitability analysis"
    ],
    "aliases": [
      "roi calculator",
      "contribution margin",
      "break even point"
    ],
    "features": [
      "Break-even units and revenue calculation",
      "Unit contribution margin and margin ratio",
      "Projected sales volume profit/loss",
      "Return on Investment (ROI) percentage"
    ],
    "formulas": [
      {
        "name": "Break-Even Units Formula",
        "expression": "Break-Even Units = Fixed Costs / (Price per Unit - Variable Cost per Unit)",
        "explanation": "Total fixed overhead divided by the profit margin generated per individual unit sold.",
        "example": "50,000 fixed costs with 80 price and 30 variable cost = 1,000 units to break even."
      }
    ],
    "faqs": [
      {
        "question": "What does contribution margin mean?",
        "answer": "Contribution margin is the portion of sales revenue from a single unit that remains after paying variable costs, which contributes towards covering fixed costs and generating profit."
      }
    ],
    "relatedToolSlugs": [
      "profit-margin-calculator",
      "discount-calculator",
      "gst-calculator"
    ],
    "nextSteps": [
      "profit-margin-calculator",
      "gst-calculator",
      "discount-calculator"
    ]
  },
  "contrast-checker": {
    "slug": "contrast-checker",
    "name": "Color Contrast Checker",
    "shortName": "Contrast Checker",
    "tagline": "Check text and background colours against WCAG AA and AAA.",
    "category": "developer",
    "description": "Test color contrast against WCAG 2.1 AA/AAA standards with real-time color blindness simulations.",
    "longDescription": "Ensure website accessibility by measuring exact luminance contrast ratios between text and background colors with WCAG 2.1 AA and AAA pass/fail ratings and color vision deficiency filters.",
    "iconName": "Contrast",
    "privacy": "local",
    "metaTitle": "WCAG Color Contrast Checker & Blindness Simulator | TabBench",
    "metaDescription": "Check color contrast compliance against WCAG 2.1 AA/AAA standards. Includes real-time Protanopia, Deuteranopia, and Tritanopia color blindness simulation.",
    "keywords": [
      "contrast checker",
      "wcag contrast checker",
      "color contrast calculator",
      "accessibility contrast checker",
      "color blindness simulator",
      "wcag 2.1 aa aaa"
    ],
    "aliases": [
      "wcag",
      "accessibility",
      "a11y",
      "color blindness",
      "contrast ratio"
    ],
    "features": [
      "Exact WCAG 2.1 contrast ratio calculation",
      "AA & AAA compliance badges for normal and large text",
      "Protanopia, Deuteranopia, Tritanopia simulations",
      "Live heading and paragraph preview box"
    ],
    "faqs": [
      {
        "question": "What is the minimum WCAG AA contrast ratio?",
        "answer": "WCAG 2.1 Level AA requires a contrast ratio of at least 4.5:1 for normal body text and at least 3.0:1 for large text (18pt / 24px or 14pt / 18.66px bold) and UI components."
      }
    ],
    "relatedToolSlugs": [
      "color-converter",
      "favicon-generator",
      "html-entity-converter"
    ],
    "nextSteps": [
      "color-converter",
      "png-to-svg"
    ]
  },
  "aspect-ratio-calculator": {
    "slug": "aspect-ratio-calculator",
    "name": "Aspect Ratio Calculator",
    "shortName": "Aspect Ratio Calculator",
    "tagline": "Work out ratios like 16:9 and the matching width or height.",
    "category": "image-media",
    "description": "Calculate aspect ratios, proportional dimensions, and social media image presets.",
    "longDescription": "Find simplified aspect ratios (16:9, 4:3, 1:1, 9:16) from pixel dimensions and automatically calculate proportional width or height during media resizing.",
    "iconName": "Ratio",
    "privacy": "local",
    "metaTitle": "Aspect Ratio Calculator & Resizer | TabBench",
    "metaDescription": "Calculate aspect ratios from dimensions and resize images proportionally. Includes 16:9, 4:3, 1:1, 9:16, and social media resolution presets.",
    "keywords": [
      "aspect ratio calculator",
      "image aspect ratio",
      "calculate aspect ratio",
      "16:9 calculator",
      "proportional resize calculator",
      "dimension calculator"
    ],
    "aliases": [
      "16:9",
      "resolution",
      "image dimensions",
      "scale dimensions"
    ],
    "features": [
      "Exact ratio simplification (e.g. 16:9)",
      "Proportional resize dimension calculation",
      "Visual scaled ratio preview box",
      "Social media and HD resolution presets"
    ],
    "formulas": [
      {
        "name": "Proportional Dimension Formula",
        "expression": "New Height = (New Width × Original Height) / Original Width",
        "explanation": "Calculates proportional dimension preserving the original aspect ratio without distortion.",
        "example": "Scaling 1920x1080 to a width of 1280 yields a proportional height of 720."
      }
    ],
    "faqs": [
      {
        "question": "What is the aspect ratio for YouTube thumbnails?",
        "answer": "YouTube thumbnails use a 16:9 aspect ratio with a recommended resolution of 1280x720 pixels (minimum width 640px)."
      }
    ],
    "relatedToolSlugs": [
      "image-resizer",
      "crop-image",
      "image-compressor"
    ],
    "nextSteps": [
      "image-resizer",
      "crop-image"
    ]
  },
  "exif-viewer": {
    "slug": "exif-viewer",
    "name": "EXIF Metadata Viewer",
    "shortName": "EXIF Viewer",
    "tagline": "See the camera, date and location hidden in a photo, and remove them.",
    "category": "image-media",
    "description": "Read camera EXIF data, GPS location and other hidden details in photos, and remove them without losing quality.",
    "longDescription": "View the metadata stored in JPEG, PNG, WebP, HEIC and TIFF photos — camera and lens, exposure settings, date taken, GPS location, serial numbers and embedded previews — and download a copy with it removed. Runs on your device; photos are never uploaded.",
    "iconName": "Camera",
    "privacy": "local",
    "metaTitle": "EXIF & Image Metadata Viewer | TabBench",
    "metaDescription": "Free EXIF viewer: see camera settings, date and GPS location in any photo, spot personal details, and remove metadata losslessly. Photos never leave your device.",
    "keywords": [
      "exif viewer",
      "image metadata viewer",
      "photo exif reader",
      "read exif online",
      "camera metadata inspector",
      "view photo info"
    ],
    "aliases": [
      "image metadata",
      "photo info",
      "camera data",
      "exif data"
    ],
    "features": [
      "Camera, lens, exposure, date and GPS details",
      "Flags location, serial numbers and names",
      "Lossless metadata removal for JPEG, PNG and WebP",
      "Photos are read on your device, never uploaded"
    ],
    "faqs": [
      {
        "question": "Are my photos uploaded to a server to read EXIF?",
        "answer": "No. The file is read in your browser's memory and never sent anywhere, including when you download the copy with metadata removed."
      }
    ],
    "relatedToolSlugs": [
      "aspect-ratio-calculator",
      "image-resizer",
      "image-compressor"
    ],
    "nextSteps": [
      "image-compressor",
      "image-resizer",
      "watermark-remover"
    ]
  },
  "markdown-table-generator": {
    "slug": "markdown-table-generator",
    "name": "Markdown Table Generator",
    "shortName": "Markdown Table Generator",
    "tagline": "Build Markdown and HTML tables in a spreadsheet-style grid.",
    "category": "developer",
    "description": "Create and edit Markdown tables in a visual spreadsheet grid with column alignment and HTML export.",
    "longDescription": "Visual spreadsheet editor to build, customize, and export GitHub Flavored Markdown and HTML tables with cell alignment controls and row/column management.",
    "iconName": "Table",
    "privacy": "local",
    "metaTitle": "Markdown Table Generator | TabBench",
    "metaDescription": "Create Markdown and HTML tables in an interactive visual spreadsheet editor with column alignment controls and one-click copy.",
    "keywords": [
      "markdown table generator",
      "markdown table editor",
      "create markdown table",
      "html table to markdown",
      "markdown grid editor",
      "github markdown table"
    ],
    "aliases": [
      "md table",
      "markdown",
      "table generator",
      "github table"
    ],
    "features": [
      "Spreadsheet-style grid with row and column controls",
      "Paste cells straight from Excel or Google Sheets",
      "Left, centre and right column alignment",
      "Markdown and HTML output, pipes escaped for you"
    ],
    "faqs": [
      {
        "question": "How do you align columns in Markdown tables?",
        "answer": "Use :--- for left alignment, :---: for center alignment, and ---: for right alignment in the header delimiter row."
      }
    ],
    "relatedToolSlugs": [
      "json-to-csv",
      "notepad",
      "slug-generator"
    ],
    "nextSteps": [
      "json-to-csv",
      "lorem-ipsum-generator",
      "notepad"
    ]
  },
  "ai-text-summarizer": {
    "slug": "ai-text-summarizer",
    "name": "AI Text Summarizer",
    "shortName": "AI Summarizer",
    "tagline": "Condense long text into a short summary or key bullet points.",
    "category": "ai-tools",
    "description": "Summarize long articles, essays, reports, and documents into key takeaways with instant local processing.",
    "longDescription": "Free online AI text summarizer that reduces lengthy text into concise summaries and structured bullet points. Runs privately in your browser with zero mandatory signups.",
    "iconName": "ListCollapse",
    "privacy": "cloud-optional",
    "metaTitle": "AI Text Summarizer | TabBench",
    "metaDescription": "Summarise articles, reports and email threads into a short paragraph or bullet points. Private on-device by default, with an optional Google Gemini mode.",
    "keywords": [
      "ai text summarizer",
      "summarize text online",
      "free article summarizer",
      "document summarizer",
      "ai summary generator",
      "text condensation",
      "key points extractor"
    ],
    "aliases": [
      "summarize",
      "summary",
      "tldr",
      "shorten text",
      "article summary"
    ],
    "features": [
      "Short, Medium, and Detailed summary lengths",
      "Instant bullet-point takeaways",
      "Zero server upload on-device privacy",
      "Word reduction percentage statistics"
    ],
    "faqs": [
      {
        "question": "Is my text uploaded to a server?",
        "answer": "Not with the default on-device engine, which runs entirely in your browser. Only if you choose Cloud AI is the text sent to Google Gemini to write the summary."
      },
      {
        "question": "Is there a limit on text length?",
        "answer": "There is no hard limit. Above about 8,000 characters a note suggests splitting the text, because very long input is slower and gives a less focused summary."
      }
    ],
    "relatedToolSlugs": [
      "ai-text-rewriter",
      "ai-text-simplifier",
      "ai-keyword-extractor",
      "word-counter"
    ],
    "nextSteps": [
      "ai-keyword-extractor",
      "ai-text-rewriter",
      "word-counter"
    ]
  },
  "ai-text-rewriter": {
    "slug": "ai-text-rewriter",
    "name": "AI Text Rewriter",
    "shortName": "AI Rewriter",
    "tagline": "Rewrite text in a professional, friendly, concise or formal tone.",
    "category": "ai-tools",
    "description": "Rewrite text in professional, friendly, concise, formal, or casual tones while preserving core meaning.",
    "longDescription": "Change the tone of emails, messages and paragraphs. The on-device engine makes safe, reviewable edits in your browser; the optional Cloud AI mode rewrites the whole text with Google Gemini.",
    "iconName": "PenLine",
    "privacy": "cloud-optional",
    "metaTitle": "AI Text Rewriter | TabBench",
    "metaDescription": "Change the tone of emails and messages: professional, formal, friendly, casual, concise or simple. Reviewable on-device edits, or a full rewrite with Google Gemini.",
    "keywords": [
      "ai text rewriter",
      "paraphrasing tool online",
      "rewrite email professional",
      "sentence rewriter free",
      "tone changer",
      "ai paraphraser"
    ],
    "aliases": [
      "paraphrase",
      "paraphraser",
      "reword",
      "change tone"
    ],
    "features": [
      "6 tones: professional, formal, friendly, casual, concise, simple",
      "Show changes: every edit highlighted",
      "Keeps facts, numbers, names and dates",
      "Private on-device mode, optional Gemini rewrite"
    ],
    "faqs": [
      {
        "question": "Does rewriting change my original facts or dates?",
        "answer": "No. The algorithmic rewriter is engineered to preserve factual figures, dates, proper nouns, and links."
      }
    ],
    "relatedToolSlugs": [
      "ai-text-summarizer",
      "ai-text-simplifier",
      "case-converter",
      "text-diff-checker"
    ],
    "nextSteps": [
      "ai-text-simplifier",
      "text-diff-checker",
      "word-counter"
    ]
  },
  "ai-text-simplifier": {
    "slug": "ai-text-simplifier",
    "name": "AI Text Simplifier",
    "shortName": "AI Simplifier",
    "tagline": "Turn dense or technical writing into plain, easy English.",
    "category": "ai-tools",
    "description": "Translate complex jargon, legalese, and dense academic text into plain, clear 8th-grade English.",
    "longDescription": "Transform convoluted writing into clear, accessible plain English with Flesch-Kincaid readability scoring and jargon reduction.",
    "iconName": "WandSparkles",
    "privacy": "cloud-optional",
    "metaTitle": "AI Text Simplifier | TabBench",
    "metaDescription": "Turn legal, technical and official text into plain English, with reading-ease scores before and after. Runs on your device, with an optional Gemini rewrite.",
    "keywords": [
      "ai text simplifier",
      "plain english translator",
      "simplify legalese online",
      "reading level improver",
      "jargon replacer",
      "clear writing tool"
    ],
    "aliases": [
      "plain english",
      "simplify text",
      "readability",
      "explain simply"
    ],
    "features": [
      "Plain-English replacements for 150+ wordy phrases and words",
      "Reading ease and school grade, before and after",
      "Flags sentences over 25 words",
      "Optional full rewrite with Google Gemini"
    ],
    "faqs": [
      {
        "question": "What reading level does this aim for?",
        "answer": "Plain English, which is a Flesch reading ease of 60 or more — roughly what a 13- to 15-year-old reads comfortably. The tool shows the score before and after so you can see how close you are."
      }
    ],
    "relatedToolSlugs": [
      "ai-text-rewriter",
      "ai-text-summarizer",
      "word-counter"
    ],
    "nextSteps": [
      "ai-text-summarizer",
      "ai-text-rewriter",
      "word-counter"
    ]
  },
  "ai-keyword-extractor": {
    "slug": "ai-keyword-extractor",
    "name": "AI Keyword Extractor",
    "shortName": "Keyword Extractor",
    "tagline": "Pull the main keywords and key phrases out of any text.",
    "category": "ai-tools",
    "description": "Extract ranked keywords, search tags, and multi-word key phrases from articles and text.",
    "longDescription": "Analyze text to extract high-relevance search keywords, tags, and n-gram phrases for SEO, indexing, and content research.",
    "iconName": "Tags",
    "privacy": "cloud-optional",
    "metaTitle": "AI Keyword Extractor | TabBench",
    "metaDescription": "Find the main keywords and key phrases in any text, with counts and density. Runs in your browser, with an optional Google Gemini mode.",
    "keywords": [
      "ai keyword extractor",
      "extract keywords from text",
      "seo keyword tag generator",
      "keyphrase extraction tool",
      "content tag finder",
      "n-gram extractor"
    ],
    "aliases": [
      "keywords",
      "tags",
      "seo keywords",
      "key phrases"
    ],
    "features": [
      "Ranked primary and secondary keywords",
      "Bigram and trigram keyphrase discovery",
      "Term frequency scoring",
      "Export as text or copy tags"
    ],
    "faqs": [
      {
        "question": "How are keywords ranked?",
        "answer": "Keywords are ranked using frequency distribution and statistical relevance while filtering common stopwords."
      }
    ],
    "relatedToolSlugs": [
      "ai-text-summarizer",
      "word-counter",
      "slug-generator"
    ],
    "nextSteps": [
      "slug-generator",
      "ai-text-summarizer",
      "word-counter"
    ]
  },
  "ai-json-explainer": {
    "slug": "ai-json-explainer",
    "name": "AI JSON Explainer",
    "shortName": "JSON Explainer",
    "tagline": "Get a plain-English walkthrough of what a JSON payload contains.",
    "category": "ai-tools",
    "description": "Analyze and explain JSON payloads, nested schemas, data structures, and potential security issues.",
    "longDescription": "Demystify complex API responses and JSON documents with deterministic schema visualization, field explanations, and architectural insights.",
    "iconName": "TextSearch",
    "privacy": "cloud-optional",
    "metaTitle": "AI JSON Explainer | TabBench",
    "metaDescription": "Understand any JSON: every field, type and format mapped, secrets and personal data flagged, and an optional plain-English explanation from Gemini.",
    "keywords": [
      "ai json explainer",
      "explain json payload",
      "json schema explainer",
      "api response analyzer",
      "json structure viewer",
      "understand json format"
    ],
    "aliases": [
      "explain json",
      "json structure",
      "json schema"
    ],
    "features": [
      "Deterministic AST structure parsing",
      "Field-by-field plain English breakdown",
      "Hierarchy depth and key count metrics",
      "Security anomaly and secret detection"
    ],
    "faqs": [
      {
        "question": "Is my JSON validated using AI?",
        "answer": "No, JSON syntax parsing is handled deterministically by the browser engine for 100% exact error detection, while AI provides the high-level explanation."
      }
    ],
    "relatedToolSlugs": [
      "json-formatter",
      "json-to-typescript",
      "json-to-csv"
    ],
    "nextSteps": [
      "json-formatter",
      "json-to-typescript",
      "json-to-csv"
    ]
  },
  "calculator": {
    "slug": "calculator",
    "name": "Calculator",
    "shortName": "Calculator",
    "tagline": "Standard and scientific calculator with history and keyboard input.",
    "category": "calculators",
    "description": "Standard and scientific calculator with memory keys, a calculation history and full keyboard support.",
    "longDescription": "A free, private online calculator with two modes: Standard for everyday arithmetic, percentages, squares and roots, and Scientific for trigonometry, logarithms, powers, factorials and brackets. It keeps a history of your results, has memory keys, and works with your keyboard. Everything is calculated in your browser.",
    "iconName": "Calculator",
    "privacy": "local",
    "metaTitle": "Free Online Calculator - Standard & Scientific",
    "metaDescription": "Free online calculator with standard and scientific modes, memory keys, calculation history and keyboard support. Runs entirely in your browser.",
    "keywords": [
      "simple calculator",
      "basic calculator",
      "calculator",
      "online calculator",
      "standard calculator",
      "scientific calculator online",
      "desktop calculator",
      "calculator with paper tape",
      "free math calculator",
      "calculator with history"
    ],
    "aliases": [
      "basic calculator",
      "scientific calculator",
      "math"
    ],
    "features": [
      "Standard mode with percent, reciprocal, square and square root keys",
      "Scientific mode with trigonometry (degrees or radians), logarithms, powers, factorials and brackets",
      "Calculation history: select any past result to use it again",
      "Memory keys (MC, MR, M+, M−, MS)",
      "Full keyboard and numpad support; Ctrl/Cmd+C copies the result",
      "Optional key sounds, off by default",
      "Calculations run in your browser; nothing is sent to a server"
    ],
    "formulas": [
      {
        "name": "Standard Arithmetic",
        "expression": "Result = Operand1 (±, ×, ÷) Operand2",
        "explanation": "Calculates basic operations following operator precedence rules.",
        "example": "250 × 1.18 = 295"
      },
      {
        "name": "Trigonometric Sine",
        "expression": "sin(θ) or sin⁻¹(x)",
        "explanation": "Computes the trigonometric sine in either Degrees (DEG) or Radians (RAD).",
        "example": "sin(30°) = 0.5"
      }
    ],
    "faqs": [
      {
        "question": "Can I use my physical computer keyboard with this calculator?",
        "answer": "Yes! Full keyboard support is active. You can type numbers 0-9, decimal point, standard operators (+, -, *, /), Enter or = for equals, Backspace to delete a digit, and Esc to clear."
      },
      {
        "question": "Does this calculator save my calculations?",
        "answer": "Yes. Each result you get with = is added to the History panel. Select a past result to use it in your next calculation, or clear the history at any time. It is kept in this browser for three days."
      },
      {
        "question": "Is my data private?",
        "answer": "Completely. All calculations happen 100% client-side inside your web browser. No numbers or equations are ever uploaded or transmitted to any server."
      },
      {
        "question": "How do I switch between Standard and Scientific modes?",
        "answer": "Use the Standard / Scientific switch above the calculator. Standard mode covers everyday arithmetic, percent, squares and square roots; Scientific mode adds trigonometry (sin, cos, tan and their inverses), logarithms (ln, log), powers (xʸ), cubes and cube roots, factorials, brackets and the constants π and e."
      }
    ],
    "relatedToolSlugs": [
      "percentage-calculator",
      "unit-converter",
      "discount-calculator",
      "emi-calculator"
    ],
    "nextSteps": [
      "percentage-calculator",
      "unit-converter",
      "discount-calculator"
    ]
  },
  "unit-converter": {
    "slug": "unit-converter",
    "name": "Unit Converter",
    "shortName": "Unit Converter",
    "tagline": "Convert length, weight, temperature, area, volume, speed and data.",
    "category": "calculators",
    "description": "Convert across 8 unit dimensions: length, mass/weight, temperature, area, volume, speed, digital storage, and time with live multi-unit comparison.",
    "longDescription": "A fast, comprehensive unit converter covering length, weight, temperature, area, volume, speed, digital storage, and time. Features real-time conversion across all units simultaneously in a clean comparison grid, 1-click unit swapping, and formula explanations.",
    "iconName": "Ruler",
    "privacy": "local",
    "metaTitle": "Unit Converter – Length, Weight & Temperature",
    "metaDescription": "Free universal unit converter for length, mass, temperature, area, volume, speed, data storage, and time. Instant multi-unit comparison grid.",
    "keywords": [
      "unit converter",
      "length converter",
      "weight converter",
      "temperature converter",
      "km to miles converter",
      "celsius to fahrenheit",
      "digital storage converter"
    ],
    "aliases": [
      "km to miles",
      "kg to lbs",
      "celsius to fahrenheit",
      "inches to cm",
      "measurement"
    ],
    "features": [
      "8 comprehensive measurement dimensions with over 60 standard units",
      "Real-time simultaneous comparison grid showing values across all units",
      "1-click unit swap button for rapid reciprocal conversions",
      "Instant copy to clipboard with precision formatting",
      "Common presets for everyday conversions like miles to km and lbs to kg",
      "100% private in-browser calculation with zero server latency"
    ],
    "formulas": [
      {
        "name": "Length (Kilometer to Mile)",
        "expression": "Miles = Kilometers × 0.621371",
        "explanation": "Converts metric kilometers to international statute miles.",
        "example": "10 km × 0.621371 = 6.21371 miles"
      },
      {
        "name": "Temperature (Celsius to Fahrenheit)",
        "expression": "°F = (°C × 9/5) + 32",
        "explanation": "Linear temperature scale conversion between Celsius and Fahrenheit.",
        "example": "(100°C × 9/5) + 32 = 212°F"
      }
    ],
    "faqs": [
      {
        "question": "Which measurement categories are supported?",
        "answer": "The converter supports 8 primary categories: Length & Distance, Weight & Mass, Temperature, Area, Volume & Capacity, Speed, Digital Storage, and Time."
      },
      {
        "question": "Does it show decimal vs binary digital storage?",
        "answer": "Yes. Digital storage covers both standard decimal units (KB, MB, GB, TB) and binary IEEE 1541 units (KiB, MiB, GiB) for accurate hardware and file size conversions."
      },
      {
        "question": "Can I copy the converted result easily?",
        "answer": "Yes, click the 'Copy Result' button or click on any tile in the live comparison grid to instantly copy the exact formatted value to your clipboard."
      }
    ],
    "relatedToolSlugs": [
      "calculator",
      "percentage-calculator",
      "currency-converter",
      "aspect-ratio-calculator"
    ],
    "nextSteps": [
      "currency-converter",
      "calculator",
      "aspect-ratio-calculator"
    ]
  },
  "stopwatch-timer": {
    "slug": "stopwatch-timer",
    "name": "Stopwatch & Timer",
    "shortName": "Stopwatch & Timer",
    "tagline": "A stopwatch with laps, and a countdown timer with an alarm.",
    "category": "date-time",
    "description": "Digital millisecond stopwatch with split and lap delta tracking, plus countdown timer with presets, synthesized chime alarms, and fullscreen mode.",
    "longDescription": "A free online precision digital stopwatch and countdown timer. Track split times, lap deltas with fastest/slowest lap highlighting, set custom countdown durations or one-click presets (including 25-minute Pomodoro), and enjoy synthesized audio chime alarms and fullscreen presentation mode.",
    "iconName": "Timer",
    "privacy": "local",
    "metaTitle": "Free Online Stopwatch & Countdown Timer",
    "metaDescription": "Free online precision stopwatch with lap tracking and countdown timer with sound alerts, presets, and fullscreen mode. 100% private in your browser.",
    "keywords": [
      "online stopwatch",
      "online timer",
      "countdown timer online",
      "stopwatch with laps",
      "pomodoro timer online",
      "timer with sound alarm",
      "millisecond stopwatch"
    ],
    "aliases": [
      "timer",
      "countdown",
      "pomodoro",
      "stopwatch",
      "alarm"
    ],
    "features": [
      "Centisecond (10ms) precision digital stopwatch with lap and split times",
      "Automated fastest and slowest lap highlighting with delta comparison",
      "Countdown timer with circular SVG progress ring and custom duration input",
      "Quick presets for 1m, 3m, 5m, 10m, 15m, 25m Pomodoro, and 45m Focus",
      "Synthesized harmonic audio chime alarm using Web Audio API",
      "Fullscreen presentation mode for meetings, workouts, and classrooms"
    ],
    "faqs": [
      {
        "question": "How accurate is this online stopwatch?",
        "answer": "The stopwatch tracks real elapsed wall-clock time using high-resolution browser timestamps, providing reliable 10-millisecond (centisecond) precision even if background tabs experience minor throttling."
      },
      {
        "question": "Does the countdown timer play a sound when it reaches zero?",
        "answer": "Yes! When the countdown timer completes, a melodic audio chime plays automatically. You can toggle audio on or off anytime using the sound control icon in the header."
      },
      {
        "question": "Can I export or copy my lap times?",
        "answer": "Yes, click 'Copy Laps' to copy a formatted list of all split and individual lap times directly to your clipboard for spreadsheets or workout logs."
      }
    ],
    "relatedToolSlugs": [
      "working-days-calculator",
      "date-difference-calculator",
      "unix-timestamp-converter"
    ],
    "nextSteps": [
      "working-days-calculator",
      "date-difference-calculator"
    ]
  },
  "text-sorter": {
    "slug": "text-sorter",
    "name": "Text Sorter & Deduplicator",
    "shortName": "Text Sorter",
    "tagline": "Sort lines A–Z or by length, and remove duplicate lines.",
    "category": "text",
    "description": "Sort lists alphabetically (A-Z, Z-A) or by length, remove duplicate lines, trim whitespace, shuffle, and add line numbers instantly.",
    "longDescription": "A fast, client-side list cleaner and text sorter. Alphabetize lines, sort in reverse, sort by character length, shuffle randomly, deduplicate with case-sensitive or insensitive matching, trim whitespace, and export or copy clean results in seconds.",
    "iconName": "ArrowDownAZ",
    "privacy": "local",
    "metaTitle": "Free Text Sorter & Duplicate Line Remover",
    "metaDescription": "Sort lists alphabetically A-Z, remove duplicate lines, sort by length, and trim whitespace online. Free, instant, and 100% private in your browser.",
    "keywords": [
      "text sorter",
      "alphabetize list online",
      "remove duplicate lines",
      "sort lines alphabetically",
      "list cleaner online",
      "line deduplicator",
      "sort text by length"
    ],
    "aliases": [
      "remove duplicate lines",
      "alphabetize",
      "sort list",
      "dedupe",
      "unique lines"
    ],
    "features": [
      "Alphabetical sorting (A-Z and Z-A) with natural alphanumeric recognition",
      "Sort by line length (shortest first or longest first) and random shuffle",
      "1-click duplicate line removal with case-sensitivity options",
      "Whitespace trimming and blank line removal filters",
      "Automatic sequential line numbering option",
      "Live before-and-after metrics: total lines, duplicates removed, and char counts"
    ],
    "faqs": [
      {
        "question": "Does this tool keep my list data private?",
        "answer": "Yes. All sorting and deduplication algorithms execute directly inside your browser memory. No text or lists are ever transmitted to an external server."
      },
      {
        "question": "How does natural alphanumeric sorting work?",
        "answer": "Natural sorting treats embedded numbers logically rather than strictly alphabetically, meaning 'item2' correctly precedes 'item10'."
      },
      {
        "question": "Can I remove duplicates without altering my original order?",
        "answer": "Yes! Simply choose 'None' for the sort order while keeping 'Deduplicate Lines' checked. The first occurrence of each unique line will be preserved in its original sequence."
      }
    ],
    "relatedToolSlugs": [
      "word-counter",
      "case-converter",
      "text-diff-checker",
      "slug-generator"
    ],
    "nextSteps": [
      "text-diff-checker",
      "case-converter",
      "word-counter"
    ]
  }
};

const CATEGORY_NAMES = Object.fromEntries(
  TOOL_CATEGORIES.map((c) => [c.id, c.name])
) as Record<ToolCategoryId, string>;

const POPULAR_SET = new Set(POPULAR_TOOL_SLUGS);

export const TOOLS_REGISTRY: Record<string, ToolDefinition> = Object.fromEntries(
  Object.entries(TOOL_SOURCE).map(([slug, tool]) => [
    slug,
    {
      ...tool,
      categoryName: CATEGORY_NAMES[tool.category],
      isPopular: POPULAR_SET.has(slug),
    },
  ])
);

export function getCategory(id: string): ToolCategory | undefined {
  return TOOL_CATEGORIES.find((c) => c.id === id);
}

export function getToolsBySlugs(slugs: string[]): ToolDefinition[] {
  return slugs
    .map((slug) => TOOLS_REGISTRY[slug])
    .filter((t): t is ToolDefinition => !!t);
}

/**
 * Next steps for the "What would you like to do next?" strip: the curated
 * workflow first, topped up with related tools so every tool has some.
 */
export function getNextTools(tool: ToolDefinition, limit = 4): ToolDefinition[] {
  const seen = new Set<string>([tool.slug]);
  const out: ToolDefinition[] = [];
  for (const slug of [...tool.nextSteps, ...tool.relatedToolSlugs]) {
    if (seen.has(slug)) continue;
    seen.add(slug);
    const t = TOOLS_REGISTRY[slug];
    if (t) out.push(t);
    if (out.length >= limit) break;
  }
  return out;
}

export function getAllTools(): ToolDefinition[] {
  return Object.values(TOOLS_REGISTRY);
}

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return TOOLS_REGISTRY[slug];
}

export function getToolsByCategory(category: string): ToolDefinition[] {
  return Object.values(TOOLS_REGISTRY).filter((tool) => tool.category === category);
}

export function getPopularTools(): ToolDefinition[] {
  return getToolsBySlugs(POPULAR_TOOL_SLUGS);
}

export function getRelatedTools(tool: ToolDefinition): ToolDefinition[] {
  return tool.relatedToolSlugs
    .map((slug) => TOOLS_REGISTRY[slug])
    .filter((t): t is ToolDefinition => !!t);
}
