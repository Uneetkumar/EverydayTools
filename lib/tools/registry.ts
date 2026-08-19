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

export interface ToolDefinition {
  slug: string;
  name: string;
  shortName: string;
  category:
    | "calculators"
    | "business"
    | "date-time"
    | "text"
    | "developer"
    | "image-media"
    | "pdf-docs"
    | "security"
    | "ai-tools";
  categoryName: string;
  description: string;
  longDescription: string;
  iconName: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  features: string[];
  formulas?: ToolFormula[];
  faqs: ToolFaq[];
  relatedToolSlugs: string[];
  isPopular?: boolean;
}

export const TOOL_CATEGORIES = [
  {
    id: "calculators",
    name: "Calculators & Finance",
    description: "Percentage, discount, EMI, GST, SIP, and salary calculators",
    icon: "Calculator",
  },
  {
    id: "date-time",
    name: "Date & Time",
    description: "Age, date differences, business days, and timezone converters",
    icon: "Clock",
  },
  {
    id: "text",
    name: "Text & Writing",
    description: "Word counters, case converters, cleaners, and diff checkers",
    icon: "Type",
  },
  {
    id: "developer",
    name: "Developer & Data",
    description: "JSON formatters, Base64, JWT, UUID, URL encoders, and regex",
    icon: "Code",
  },
  {
    id: "image-media",
    name: "Image & Media",
    description: "Client-side image compressor, QR code generator, and format converter",
    icon: "Image",
  },
  {
    id: "pdf-docs",
    name: "PDF & Documents",
    description: "Client-side PDF merge, split, and document utilities",
    icon: "FileText",
  },
  {
    id: "security",
    name: "Security & Generators",
    description: "Secure password generator, hash generation, and token tools",
    icon: "Shield",
  },
  {
    id: "business",
    name: "Business & Marketing",
    description: "Profit margins, markup, break-even, and invoice calculations",
    icon: "TrendingUp",
  },
  {
    id: "ai-tools",
    name: "AI-Powered Tools",
    description: "AI formula explainer, text summarizer, and regex generator",
    icon: "Sparkles",
  },
];

export const TOOLS_REGISTRY: Record<string, ToolDefinition> = {
  // 1. JSON Formatter
  "json-formatter": {
    slug: "json-formatter",
    name: "JSON Formatter & Validator",
    shortName: "JSON Formatter",
    category: "developer",
    categoryName: "Developer & Data",
    description: "Format, validate, prettify, minify, and inspect JSON payloads with real-time error detection.",
    longDescription: "A client-side developer utility to format unreadable JSON, detect syntax mistakes with exact line diagnostics, minify data, and inspect structures securely without data leaves your browser.",
    iconName: "Code",
    metaTitle: "Free JSON Formatter & Validator Online - Prettify & Minify",
    metaDescription: "Format and validate JSON instantly in your browser. Prettify with 2/4 spaces or tabs, minify, and fix syntax errors.",
    keywords: ["json formatter", "json validator", "prettify json", "minify json", "json parser"],
    features: ["Prettify with 2/4 spaces or tab", "Minify JSON", "Syntax error line indicators", "100% private in-browser"],
    faqs: [
      { question: "Is my JSON stored?", answer: "No. Everything runs purely in your local browser JavaScript memory." }
    ],
    relatedToolSlugs: ["base64-converter", "jwt-decoder", "uuid-generator"],
    isPopular: true,
  },

  // 2. Percentage Calculator
  "percentage-calculator": {
    slug: "percentage-calculator",
    name: "Percentage Calculator",
    shortName: "Percentage",
    category: "calculators",
    categoryName: "Calculators & Finance",
    description: "Calculate percentages, percentage increases, decreases, and differences with instant step-by-step formulas.",
    longDescription: "Instant math tool for students, finance managers, shoppers, and researchers. Solve X% of Y, percentage increase/decrease, and percentage difference instantly.",
    iconName: "Percent",
    metaTitle: "Percentage Calculator - Fast % Increase, Decrease & Difference",
    metaDescription: "Free percentage calculator: find X% of Y, percentage change, and percentage difference with formulas.",
    keywords: ["percentage calculator", "percent increase", "percent decrease", "percentage difference"],
    features: ["X% of Y calculation", "% Increase/decrease", "% Difference", "Step-by-step formula cards"],
    formulas: [
      {
        name: "Percentage of a Number",
        expression: "P = (X / 100) × Y",
        explanation: "Divide percentage by 100 and multiply by the total value.",
        example: "15% of 200 = (15 / 100) * 200 = 30."
      }
    ],
    faqs: [
      { question: "How to calculate percent mentally?", answer: "Find 10% by shifting the decimal left, then scale accordingly." }
    ],
    relatedToolSlugs: ["discount-calculator", "gst-calculator", "emi-calculator"],
    isPopular: true,
  },

  // 3. Word & Character Counter
  "word-counter": {
    slug: "word-counter",
    name: "Word & Character Counter",
    shortName: "Word Counter",
    category: "text",
    categoryName: "Text & Writing",
    description: "Count words, characters, sentences, paragraphs, and estimate reading & speaking time in real-time.",
    longDescription: "Essential writing utility for essayists, copywriters, and social media managers. Track character limits for Twitter/X, Instagram, LinkedIn, and calculate estimated reading duration.",
    iconName: "FileText",
    metaTitle: "Word Counter & Character Counter Online - Free Writing Stats",
    metaDescription: "Count words, characters with/without spaces, sentences, paragraphs, and reading time in real-time.",
    keywords: ["word counter", "character counter", "letter count", "word count online", "reading time calculator"],
    features: ["Live words and characters counter", "Counts without spaces", "Sentence and paragraph breakdown", "Estimated reading time"],
    faqs: [
      { question: "What is average reading speed?", answer: "Average reading speed is 200 to 250 words per minute." }
    ],
    relatedToolSlugs: ["case-converter", "text-diff-checker", "password-generator"],
    isPopular: true,
  },

  // 4. Password Generator
  "password-generator": {
    slug: "password-generator",
    name: "Strong Password Generator",
    shortName: "Password Generator",
    category: "security",
    categoryName: "Security & Generators",
    description: "Generate highly secure, cryptographically random passwords with customizable length, symbols, and memorability.",
    longDescription: "Create uncrackable, cryptographically secure passwords using standard browser Crypto APIs. Customize length, uppercase, lowercase, numbers, and special symbols.",
    iconName: "Shield",
    metaTitle: "Strong Password Generator - Secure & Random Online",
    metaDescription: "Generate strong, secure passwords with custom length, symbols, numbers, and strength score.",
    keywords: ["password generator", "strong password generator", "random password", "secure password"],
    features: ["Cryptographically secure (window.crypto)", "Customizable length (6 to 64 chars)", "Symbol and number toggles", "Password strength meter"],
    faqs: [
      { question: "Are passwords saved anywhere?", answer: "Never. Passwords are generated directly on your device via CSPRNG." }
    ],
    relatedToolSlugs: ["uuid-generator", "hash-generator", "base64-converter"],
    isPopular: true,
  },

  // 5. Base64 Encoder / Decoder
  "base64-converter": {
    slug: "base64-converter",
    name: "Base64 Encoder / Decoder",
    shortName: "Base64",
    category: "developer",
    categoryName: "Developer & Data",
    description: "Encode text or decode Base64 strings instantly with live UTF-8 support and URL-safe mode.",
    longDescription: "Convert plain text to Base64 and decode Base64 strings to readable UTF-8 text with instant one-click copy and error detection.",
    iconName: "Binary",
    metaTitle: "Base64 Encoder & Decoder Online - Fast & Private",
    metaDescription: "Encode text to Base64 and decode Base64 to text with UTF-8 support. Fast, client-side, and free.",
    keywords: ["base64 encoder", "base64 decoder", "base64 encode online", "decode base64"],
    features: ["Encode text to Base64", "Decode Base64 to UTF-8", "URL-safe format toggle", "Instant live preview"],
    faqs: [
      { question: "What is Base64 used for?", answer: "Base64 encodes binary data into ASCII characters for safe transmission in JSON, email, and URLs." }
    ],
    relatedToolSlugs: ["jwt-decoder", "url-encoder-decoder", "json-formatter"],
    isPopular: true,
  },

  // 6. JWT Decoder
  "jwt-decoder": {
    slug: "jwt-decoder",
    name: "JWT Decoder & Expiration Checker",
    shortName: "JWT Decoder",
    category: "developer",
    categoryName: "Developer & Data",
    description: "Decode JSON Web Tokens (Header, Payload, Signature) and inspect expiration timestamps safely in your browser.",
    longDescription: "Debug JWT authentication tokens client-side. Inspect user claims, issuer, algorithm, and check whether the token is expired or valid.",
    iconName: "Key",
    metaTitle: "JWT Decoder Online - Decode JSON Web Token Payload & Expiry",
    metaDescription: "Decode JWT header, payload, and signature without sending tokens to any server. Check token expiration instantly.",
    keywords: ["jwt decoder", "decode jwt", "jwt token inspect", "jwt expiration checker"],
    features: ["Decodes Header and Payload", "Formatted JSON inspection", "Live token expiration status", "Zero network transmission"],
    faqs: [
      { question: "Is it safe to paste JWT tokens here?", answer: "Yes, decoding is performed purely in client JavaScript with no network requests." }
    ],
    relatedToolSlugs: ["base64-converter", "uuid-generator", "json-formatter"],
    isPopular: true,
  },

  // 7. UUID Generator
  "uuid-generator": {
    slug: "uuid-generator",
    name: "UUID / GUID Generator",
    shortName: "UUID Generator",
    category: "developer",
    categoryName: "Developer & Data",
    description: "Generate cryptographically secure Version 4 UUIDs (GUIDs) in bulk with uppercase, hyphen, and quote formatting.",
    longDescription: "Generate random v4 UUIDs for database primary keys, API tokens, and unique identifiers. Bulk generation up to 100 UUIDs at once.",
    iconName: "Hash",
    metaTitle: "UUID Generator - Generate Secure v4 UUIDs / GUIDs Online",
    metaDescription: "Generate random v4 UUIDs / GUIDs in bulk. Customize hyphens, uppercase, and quotes.",
    keywords: ["uuid generator", "guid generator", "v4 uuid", "generate uuid online"],
    features: ["RFC 4122 compliant v4 UUIDs", "Bulk generation (1 to 100)", "Hyphen and uppercase options", "One-click copy all"],
    faqs: [
      { question: "What is a UUID v4?", answer: "A Version 4 UUID is a 128-bit number generated using cryptographically random numbers." }
    ],
    relatedToolSlugs: ["password-generator", "base64-converter", "json-formatter"],
    isPopular: true,
  },

  // 8. URL Encoder / Decoder
  "url-encoder-decoder": {
    slug: "url-encoder-decoder",
    name: "URL Encoder / Decoder",
    shortName: "URL Encoder",
    category: "developer",
    categoryName: "Developer & Data",
    description: "Encode query parameters and special characters into percent-encoded URL format, or decode URLs to plain text.",
    longDescription: "Quickly percent-encode URL strings and decode encoded URLs. Supports full URL encode and encodeURIComponent modes.",
    iconName: "Link",
    metaTitle: "URL Encoder & Decoder Online - Percent Encoding Tool",
    metaDescription: "Encode and decode URLs and query parameters online with percent encoding. Fast and client-side.",
    keywords: ["url encoder", "url decoder", "percent encode", "encodeuricomponent online"],
    features: ["encodeURIComponent support", "decodeURIComponent support", "Live conversion", "One-click copy"],
    faqs: [
      { question: "Why encode URLs?", answer: "URLs can only contain certain ASCII characters. Special characters like spaces or symbols must be percent-encoded." }
    ],
    relatedToolSlugs: ["base64-converter", "jwt-decoder", "json-formatter"],
    isPopular: true,
  },

  // 9. QR Code Generator
  "qr-code-generator": {
    slug: "qr-code-generator",
    name: "QR Code Generator",
    shortName: "QR Generator",
    category: "image-media",
    categoryName: "Image & Media",
    description: "Generate high-resolution custom QR codes for URLs, text, Wi-Fi passwords, emails, and phone numbers. Download as PNG or SVG.",
    longDescription: "Create clean QR codes instantly in your browser. Customize colors, error correction level, and size. Download high-res PNG for print or web.",
    iconName: "QrCode",
    metaTitle: "Free QR Code Generator - Create Custom QR Codes Online",
    metaDescription: "Generate free QR codes for links, text, Wi-Fi, and contact cards. Download PNG/SVG with custom colors.",
    keywords: ["qr code generator", "create qr code", "free qr generator", "qr code maker"],
    features: ["URL, Text, and WiFi modes", "Custom foreground & background colors", "Download as PNG", "High error correction"],
    faqs: [
      { question: "Do these QR codes expire?", answer: "No, these are standard static QR codes and will work indefinitely." }
    ],
    relatedToolSlugs: ["image-compressor", "password-generator", "pdf-merge"],
    isPopular: true,
  },

  // 10. Image Compressor (Target Size KB)
  "image-compressor": {
    slug: "image-compressor",
    name: "Image Compressor (Compress to Target KB)",
    shortName: "Image Compressor",
    category: "image-media",
    categoryName: "Image & Media",
    description: "Compress image to exact target KB (e.g. under 50KB, 100KB, 200KB) with live quality adaptation and alerts.",
    longDescription: "Compress JPG, PNG, and WebP images to your exact target file size in KB. Ideal for government portals, job applications, resumes, and websites with strict file size limits. 100% private in-browser compression.",
    iconName: "Image",
    metaTitle: "Compress Image to Specific KB (50KB, 100KB, 200KB) Online",
    metaDescription: "Compress JPG, PNG, WebP to exact target KB size online. Set custom file size limits with live compression alerts.",
    keywords: ["image compressor to 50kb", "compress image to 100kb", "reduce image size in kb", "target size compressor"],
    features: ["Compress to exact KB target (e.g. 50KB, 100KB)", "Smart auto-downscaling algorithm", "Before/After size comparison", "100% client-side safe"],
    faqs: [
      { question: "Can I compress an image to under 50 KB or 100 KB?", answer: "Yes! Enter your desired target size in KB and our algorithm will automatically balance quality and resolution to meet your limit." }
    ],
    relatedToolSlugs: ["png-to-jpg", "crop-image", "image-to-pdf"],
    isPopular: true,
  },

  // 11. Image to PDF & PDF to Image
  "image-to-pdf": {
    slug: "image-to-pdf",
    name: "Image to PDF & PDF to Image Converter",
    shortName: "Image to PDF",
    category: "pdf-docs",
    categoryName: "PDF & Documents",
    description: "Convert JPG, PNG, and WebP images into PDF documents, or extract PDF pages as high-resolution images.",
    longDescription: "Convert multiple photos and documents into a clean multi-page PDF, or convert PDF pages into high-res JPG/PNG images client-side with zero data uploads.",
    iconName: "FilePlus",
    metaTitle: "Image to PDF & PDF to Image Converter Online - Fast & Free",
    metaDescription: "Convert images (JPG, PNG) to PDF or extract PDF pages to images. 100% private client-side converter.",
    keywords: ["image to pdf", "jpg to pdf", "png to pdf", "pdf to image", "pdf to jpg"],
    features: ["Convert multiple images to multi-page PDF", "Convert PDF to JPG/PNG images", "Page orientation settings", "Zero server upload"],
    faqs: [
      { question: "Can I merge multiple images into one PDF?", answer: "Yes, upload multiple JPG or PNG images and arrange them to create a combined PDF document." }
    ],
    relatedToolSlugs: ["pdf-to-word", "pdf-merge", "image-compressor"],
    isPopular: true,
  },

  // 12. PDF to Word & Word to PDF
  "pdf-to-word": {
    slug: "pdf-to-word",
    name: "PDF to Word & Word to PDF Converter",
    shortName: "PDF to Word",
    category: "pdf-docs",
    categoryName: "PDF & Documents",
    description: "Convert PDF documents to editable Microsoft Word (.docx) files, or convert Word documents to PDF.",
    longDescription: "Easily extract text and formatting from PDF files into editable DOCX Word files, or convert Word (.docx) documents into clean PDF files right in your browser.",
    iconName: "FileText",
    metaTitle: "PDF to Word & Word to PDF Converter - Free & Private Online",
    metaDescription: "Convert PDF to Word (.docx) or Word to PDF in your browser. Fast, editable, and 100% secure.",
    keywords: ["pdf to word", "word to pdf", "convert pdf to docx", "docx to pdf online"],
    features: ["Convert PDF to editable DOCX", "Convert DOCX Word documents to PDF", "Preserves text structure", "Private browser processing"],
    faqs: [
      { question: "Is the resulting Word document editable?", answer: "Yes, it creates standard Microsoft Word .docx files compatible with Word, Google Docs, and LibreOffice." }
    ],
    relatedToolSlugs: ["image-to-pdf", "pdf-merge", "unlock-pdf"],
    isPopular: true,
  },

  // 13. Watermark Remover & Editor
  "watermark-remover": {
    slug: "watermark-remover",
    name: "Watermark Remover & Image Cleaner",
    shortName: "Watermark Remover",
    category: "image-media",
    categoryName: "Image & Media",
    description: "Remove watermarks, logos, dates, and stamps from images using smart inpainting, or add custom watermarks.",
    longDescription: "Clean unwanted watermarks, timestamps, and logos from photos using client-side neighbor inpainting algorithms, or protect your images by adding custom text/image watermarks.",
    iconName: "Sparkles",
    metaTitle: "Watermark Remover Online - Remove Watermarks from Images Free",
    metaDescription: "Erase watermarks, logos, text stamps, and dates from images online. Private client-side inpainting tool.",
    keywords: ["watermark remover", "remove watermark from photo", "erase watermark online", "image inpainting tool"],
    features: ["Interactive watermark erase box", "Smart pixel inpainting algorithm", "Watermark adder mode", "Download clean image"],
    faqs: [
      { question: "How does the watermark eraser work?", answer: "Select the watermark area with your mouse; the inpainting algorithm blends surrounding textures to fill the area seamlessly." }
    ],
    relatedToolSlugs: ["image-compressor", "crop-image", "png-to-jpg"],
    isPopular: true,
  },

  // 14. PNG to JPG Converter
  "png-to-jpg": {
    slug: "png-to-jpg",
    name: "PNG to JPG Converter",
    shortName: "PNG to JPG",
    category: "image-media",
    categoryName: "Image & Media",
    description: "Convert PNG images to JPG with custom background fill for transparent areas and adjustable compression quality.",
    longDescription: "Instant format conversion from PNG to JPG. Automatically fills transparent PNG backgrounds with clean white or custom colors when saving as JPG.",
    iconName: "Image",
    metaTitle: "PNG to JPG Converter Online - Free Image Format Tool",
    metaDescription: "Convert PNG to JPG with custom background fill online. High quality, instant, and 100% private in browser.",
    keywords: ["png to jpg", "convert png to jpg", "png to jpeg online", "image format converter"],
    features: ["PNG to JPG conversion", "Custom background color for transparency", "Adjustable JPG quality slider", "Instant file size comparison"],
    faqs: [
      { question: "What happens to transparent backgrounds when converting PNG to JPG?", answer: "Because JPG does not support transparency, our tool fills transparent areas with clean white (or your chosen background color)." }
    ],
    relatedToolSlugs: ["jpg-to-png", "image-to-webp", "image-compressor", "crop-image"],
    isPopular: true,
  },

  // 14b. JPG to PNG Converter
  "jpg-to-png": {
    slug: "jpg-to-png",
    name: "JPG to PNG Converter",
    shortName: "JPG to PNG",
    category: "image-media",
    categoryName: "Image & Media",
    description: "Convert JPG and JPEG photos into lossless PNG format with crisp quality and zero compression artifacts.",
    longDescription: "Convert standard JPEG and JPG photos into uncompressed PNG images. Great for graphic design, logos, and high-fidelity editing.",
    iconName: "Image",
    metaTitle: "JPG to PNG Converter Online - Convert JPG to Lossless PNG",
    metaDescription: "Convert JPG and JPEG to PNG online for free. Fast, lossless, and processed 100% locally in your browser.",
    keywords: ["jpg to png", "convert jpg to png", "jpeg to png online", "lossless image converter"],
    features: ["Lossless PNG export", "Fast client-side conversion", "Zero data upload", "High-fidelity color retention"],
    faqs: [
      { question: "Does converting JPG to PNG improve image quality?", answer: "It prevents further compression loss when you edit or save the file again, maintaining original pixel fidelity." }
    ],
    relatedToolSlugs: ["png-to-jpg", "image-to-webp", "crop-image", "image-compressor"],
    isPopular: true,
  },

  // 14c. Image to WebP Converter
  "image-to-webp": {
    slug: "image-to-webp",
    name: "Image to WebP Converter",
    shortName: "Image to WebP",
    category: "image-media",
    categoryName: "Image & Media",
    description: "Convert JPG and PNG images into modern Google WebP format to reduce file sizes by 30% to 80% while retaining quality.",
    longDescription: "Speed up your website load times and save bandwidth by converting bulky images to modern, high-efficiency WebP format.",
    iconName: "Image",
    metaTitle: "Image to WebP Converter - Convert JPG & PNG to WebP Free",
    metaDescription: "Convert PNG and JPG images to lightweight WebP format online. Reduce image file size by up to 80% with quality controls.",
    keywords: ["image to webp", "png to webp", "jpg to webp", "convert to webp online"],
    features: ["Convert PNG and JPG to WebP", "Up to 80% file size reduction", "Lossy & Lossless quality slider", "Faster website load times"],
    faqs: [
      { question: "What is WebP format?", answer: "WebP is a modern image format developed by Google that provides superior lossless and lossy compression for web images." }
    ],
    relatedToolSlugs: ["webp-to-jpg", "png-to-jpg", "image-compressor", "crop-image"],
    isPopular: true,
  },

  // 14d. WebP to JPG Converter
  "webp-to-jpg": {
    slug: "webp-to-jpg",
    name: "WebP to JPG / PNG Converter",
    shortName: "WebP to JPG",
    category: "image-media",
    categoryName: "Image & Media",
    description: "Convert WebP images into universally compatible JPG or PNG formats for easy sharing and opening on any device.",
    longDescription: "Easily open and convert downloaded .webp images into standard JPG or PNG files that can be edited in Photoshop, Word, or shared anywhere.",
    iconName: "Image",
    metaTitle: "WebP to JPG & PNG Converter - Convert WebP Images Free",
    metaDescription: "Convert WebP to JPG or PNG online. Universal compatibility for downloaded web images. Fast, free, and private.",
    keywords: ["webp to jpg", "webp to png", "convert webp", "open webp image"],
    features: ["Convert WebP to JPG & PNG", "Universal device compatibility", "Zero quality degradation", "Instant batch download"],
    faqs: [
      { question: "Why should I convert WebP to JPG?", answer: "Some older photo viewers and image editing apps do not natively support WebP files, while JPG works everywhere." }
    ],
    relatedToolSlugs: ["image-to-webp", "png-to-jpg", "jpg-to-png", "crop-image"],
    isPopular: true,
  },

  // 15. Unlock PDF
  "unlock-pdf": {
    slug: "unlock-pdf",
    name: "Unlock PDF & Remove Password Restrictions",
    shortName: "Unlock PDF",
    category: "pdf-docs",
    categoryName: "PDF & Documents",
    description: "Remove owner password restrictions, copying, and printing locks from PDF files entirely in your browser.",
    longDescription: "Unlock restricted PDF documents so you can copy text, print, and edit pages freely. 100% processed in browser memory with zero security risk.",
    iconName: "Lock",
    metaTitle: "Unlock PDF Online - Remove PDF Password & Copy Restrictions",
    metaDescription: "Remove password restrictions, copy protections, and print locks from PDF documents online safely.",
    keywords: ["unlock pdf", "remove pdf password", "pdf permission remover", "unlock protected pdf"],
    features: ["Remove restrictions and print locks", "Decrypt with known password", "Zero server upload", "Instant unlocked PDF download"],
    faqs: [
      { question: "Can it unlock password-protected files?", answer: "Yes. For user-encrypted PDFs, enter the password once to decrypt and save a permanently unrestricted copy." }
    ],
    relatedToolSlugs: ["pdf-merge", "pdf-to-word", "image-to-pdf"],
    isPopular: true,
  },

  // 16. Crop Image
  "crop-image": {
    slug: "crop-image",
    name: "Crop Image & Aspect Ratio Tool",
    shortName: "Crop Image",
    category: "image-media",
    categoryName: "Image & Media",
    description: "Crop photos to custom dimensions or standard aspect ratios (1:1, 16:9, 4:3, 9:16 Story) with live preview.",
    longDescription: "Crop, frame, and resize your images for Instagram posts, YouTube thumbnails, profile pictures, and banners with precise pixel controls.",
    iconName: "Crop",
    metaTitle: "Crop Image Online - Free Aspect Ratio & Photo Cropper",
    metaDescription: "Crop images online with custom aspect ratios (1:1 square, 16:9, 4:3). Fast, accurate, and private.",
    keywords: ["crop image", "crop photo online", "square image crop", "16:9 crop tool", "photo aspect ratio"],
    features: ["Presets for 1:1, 16:9, 4:3, 9:16 Story", "Freeform crop box", "Precise pixel dimension indicator", "High quality export"],
    faqs: [
      { question: "Can I crop circular profile pictures?", answer: "Yes, you can crop to 1:1 square ratio which fits circular avatar frames perfectly." }
    ],
    relatedToolSlugs: ["image-compressor", "watermark-remover", "png-to-jpg"],
    isPopular: true,
  },

  // 11. PDF Merge
  "pdf-merge": {
    slug: "pdf-merge",
    name: "PDF Merge & Combine",
    shortName: "PDF Merge",
    category: "pdf-docs",
    categoryName: "PDF & Documents",
    description: "Combine multiple PDF documents into a single organized PDF file entirely client-side in your browser.",
    longDescription: "Merge multiple PDF files securely in your browser using pdf-lib. Reorder files, remove unwanted pages, and download the combined PDF with zero server upload.",
    iconName: "FilePlus",
    metaTitle: "Merge PDF Online - Combine PDF Files Free & Privately",
    metaDescription: "Merge and combine multiple PDF files into one. Fast, free, and processed 100% locally in your browser.",
    keywords: ["merge pdf", "combine pdf", "pdf joiner", "merge pdf files free"],
    features: ["Merge multiple PDFs", "Drag-and-drop file upload", "Zero server upload - 100% private", "Fast instant download"],
    faqs: [
      { question: "Is it safe to merge sensitive documents?", answer: "Yes, merging happens on your device using WebAssembly/JavaScript. No PDF data leaves your computer." }
    ],
    relatedToolSlugs: ["pdf-compressor", "image-compressor", "qr-code-generator"],
    isPopular: true,
  },

  // 12. PDF Compressor
  "pdf-compressor": {
    slug: "pdf-compressor",
    name: "PDF Page Counter & Compressor Info",
    shortName: "PDF Utility",
    category: "pdf-docs",
    categoryName: "PDF & Documents",
    description: "Inspect PDF metadata, count pages, analyze embedded objects, and reduce document overhead.",
    longDescription: "Analyze PDF documents, verify page dimensions, check encryption status, and optimize document structure client-side.",
    iconName: "FileCheck",
    metaTitle: "PDF Utility & Inspector - Page Counter & Optimizer",
    metaDescription: "Inspect PDF files, count pages, view document details, and prepare files for sharing.",
    keywords: ["pdf compressor", "pdf page counter", "pdf inspector", "pdf tool online"],
    features: ["Page count detection", "File size breakdown", "Document metadata viewer", "100% private"],
    faqs: [
      { question: "How are files processed?", answer: "Files are parsed directly in browser memory." }
    ],
    relatedToolSlugs: ["pdf-merge", "image-compressor", "word-counter"],
    isPopular: true,
  },

  // 13. Age Calculator
  "age-calculator": {
    slug: "age-calculator",
    name: "Age Calculator & Birthday Countdown",
    shortName: "Age Calculator",
    category: "date-time",
    categoryName: "Date & Time",
    description: "Calculate your exact age in years, months, weeks, days, hours, and minutes, plus next birthday countdown.",
    longDescription: "Find out your exact age to the day and minute. View interesting milestones like days lived, total breaths, total heartbeats, and days until your next birthday.",
    iconName: "Calendar",
    metaTitle: "Age Calculator - Calculate Exact Age in Years, Months, Days",
    metaDescription: "Calculate your exact age today in years, months, days, hours, and find your next birthday countdown.",
    keywords: ["age calculator", "calculate age", "how old am i", "birthday countdown", "exact age in days"],
    features: ["Exact age in Years, Months, Days", "Total days, hours, minutes lived", "Next birthday countdown", "Day of week you were born"],
    formulas: [
      {
        name: "Age Duration Calculation",
        expression: "Years = CurrentYear - BirthYear (adjusted for month/day)",
        explanation: "Calculate the exact elapsed calendar years, months, and remainder days from date of birth.",
        example: "Born Jan 15, 2000 -> 26 years, 7 months, 1 day (as of Aug 2026)."
      }
    ],
    faqs: [
      { question: "Does this account for leap years?", answer: "Yes, exact calendar math accounts for leap years and month length variations." }
    ],
    relatedToolSlugs: ["date-difference-calculator", "percentage-calculator", "emi-calculator"],
    isPopular: true,
  },

  // 14. GST Calculator
  "gst-calculator": {
    slug: "gst-calculator",
    name: "GST Calculator (Add / Remove GST)",
    shortName: "GST Calculator",
    category: "calculators",
    categoryName: "Calculators & Finance",
    description: "Calculate GST (Goods & Services Tax) easily: Add GST to base amount or Reverse GST (extract tax from total) with standard 5%, 12%, 18%, 28% slabs.",
    longDescription: "Calculate inclusive and exclusive GST amounts in seconds. Determine CGST, SGST, IGST tax breakdown and find net pricing.",
    iconName: "Receipt",
    metaTitle: "GST Calculator - Calculate GST Inclusive & Exclusive Amounts",
    metaDescription: "Free online GST Calculator. Add GST or remove GST from total price. Supports 5%, 12%, 18%, 28% tax slabs with CGST/SGST split.",
    keywords: ["gst calculator", "calculate gst", "reverse gst calculator", "gst tax slabs", "inclusive gst formula"],
    features: ["Add GST & Remove GST modes", "Standard slabs: 5%, 12%, 18%, 28%", "CGST and SGST split breakdown", "One-click copy"],
    formulas: [
      {
        name: "GST Added (Exclusive)",
        expression: "GST Amount = (Price × GST%) / 100",
        explanation: "Total Amount = Price + GST Amount.",
        example: "Rs. 1,000 with 18% GST = Rs. 1,000 + Rs. 180 = Rs. 1,180."
      },
      {
        name: "Reverse GST (Inclusive)",
        expression: "GST Amount = Price - (Price × (100 / (100 + GST%)))",
        explanation: "Calculates the base price and extracted GST from a tax-inclusive total.",
        example: "Rs. 1,180 with 18% GST -> Base Price = Rs. 1,000, GST = Rs. 180."
      }
    ],
    faqs: [
      { question: "What is CGST and SGST?", answer: "For intra-state transactions, GST is split equally between Central GST (CGST) and State GST (SGST)." }
    ],
    relatedToolSlugs: ["profit-margin-calculator", "discount-calculator", "emi-calculator"],
    isPopular: true,
  },

  // 15. EMI Calculator
  "emi-calculator": {
    slug: "emi-calculator",
    name: "Loan EMI Calculator",
    shortName: "EMI Calculator",
    category: "calculators",
    categoryName: "Calculators & Finance",
    description: "Calculate equated monthly installments (EMI) for home loans, car loans, and personal loans with total interest and amortization charts.",
    longDescription: "Plan your loan repayment with our loan EMI calculator. Calculate monthly payments, total interest payable, and total cost of loan with interactive tenure sliders.",
    iconName: "TrendingUp",
    metaTitle: "EMI Calculator - Calculate Home, Car & Personal Loan Monthly EMI",
    metaDescription: "Calculate loan EMI, total interest, and total repayment amount with amortization breakdown and visual pie chart.",
    keywords: ["emi calculator", "loan emi calculator", "home loan emi", "car loan emi", "calculate monthly emi"],
    features: ["Monthly EMI calculation", "Total interest vs principal visualizer", "Flexible tenure (years or months)", "Amortization table breakdown"],
    formulas: [
      {
        name: "Standard EMI Formula",
        expression: "EMI = [P × R × (1+R)^N] / [(1+R)^N - 1]",
        explanation: "P = Principal loan amount, R = Monthly interest rate (Annual % / 12 / 100), N = Number of monthly installments.",
        example: "Loan $100,000 at 8% for 10 years (120 months) = $1,213.28 per month."
      }
    ],
    faqs: [
      { question: "Can I reduce my EMI by paying extra principal?", answer: "Yes, prepaying principal reduces remaining tenure or monthly EMI obligation." }
    ],
    relatedToolSlugs: ["gst-calculator", "profit-margin-calculator", "percentage-calculator"],
    isPopular: true,
  },

  // 16. Discount Calculator
  "discount-calculator": {
    slug: "discount-calculator",
    name: "Discount & Sale Price Calculator",
    shortName: "Discount",
    category: "calculators",
    categoryName: "Calculators & Finance",
    description: "Calculate final sale price, discount amount saved, and double discount / stackable coupon savings instantly.",
    longDescription: "Find out how much you save during sales and clearance events. Calculate percentage discounts, fixed cash discounts, and additional coupon codes.",
    iconName: "Tag",
    metaTitle: "Discount Calculator - Calculate Sale Price & Money Saved",
    metaDescription: "Calculate discounted price and total savings from percentage or cash discounts with extra coupon support.",
    keywords: ["discount calculator", "sale price calculator", "percent off calculator", "shopping discount"],
    features: ["Percent off and fixed amount discount", "Double discount (extra % off)", "Savings breakdown", "Visual discount tag"],
    formulas: [
      {
        name: "Discounted Price Formula",
        expression: "Sale Price = Original Price × (1 - Discount% / 100)",
        explanation: "Savings = Original Price - Sale Price.",
        example: "$80 item with 25% discount: Sale Price = $80 * 0.75 = $60 (You save $20)."
      }
    ],
    faqs: [
      { question: "How do double discounts work?", answer: "An extra 10% off an already 50% discounted item applies to the discounted price, not the original MSRP." }
    ],
    relatedToolSlugs: ["percentage-calculator", "gst-calculator", "profit-margin-calculator"],
  },

  // 17. Profit Margin Calculator
  "profit-margin-calculator": {
    slug: "profit-margin-calculator",
    name: "Profit Margin & Markup Calculator",
    shortName: "Profit Margin",
    category: "business",
    categoryName: "Business & Marketing",
    description: "Calculate gross profit margin, markup percentage, revenue, and cost price with clear visual breakdowns.",
    longDescription: "Optimize your product pricing, ecommerce stores, and quotes. Understand the crucial mathematical difference between Margin and Markup.",
    iconName: "TrendingUp",
    metaTitle: "Profit Margin & Markup Calculator - Pricing & Revenue Analysis",
    metaDescription: "Calculate profit margin, markup percentage, gross profit, and required selling price with visual breakdowns.",
    keywords: ["profit margin calculator", "markup calculator", "margin vs markup", "gross profit"],
    features: ["Gross Margin & Markup calculation", "Required selling price estimator", "Margin vs Markup table"],
    formulas: [
      {
        name: "Gross Profit Margin",
        expression: "Margin % = ((Revenue - Cost) / Revenue) × 100",
        explanation: "Margin calculates what fraction of each revenue dollar represents net profit after cost.",
        example: "Cost = $60, Price = $100 -> Margin = 40%."
      }
    ],
    faqs: [
      { question: "Why is margin always lower than markup?", answer: "Margin divides profit by the higher selling price, markup divides profit by the lower cost." }
    ],
    relatedToolSlugs: ["percentage-calculator", "discount-calculator", "gst-calculator"],
  },

  // 18. Case Converter
  "case-converter": {
    slug: "case-converter",
    name: "Case Converter & Text Cleaner",
    shortName: "Case Converter",
    category: "text",
    categoryName: "Text & Writing",
    description: "Convert text between UPPERCASE, lowercase, Title Case, camelCase, snake_case, kebab-case, clean spaces, and count words.",
    longDescription: "Manipulate and format text in your browser. Clean messy copy, format code identifiers, strip redundant spaces, and capitalize headings.",
    iconName: "Type",
    metaTitle: "Case Converter Online - UPPERCASE, Title Case, camelCase & Text Cleaner",
    metaDescription: "Convert text to UPPERCASE, lowercase, Title Case, Sentence case, camelCase, kebab-case, snake_case.",
    keywords: ["case converter", "title case converter", "camelcase converter", "text cleaner"],
    features: ["UPPERCASE, lowercase, Title Case, Sentence case", "camelCase, PascalCase, snake_case, kebab-case", "Clean extra whitespace"],
    faqs: [
      { question: "What rules does Title Case follow?", answer: "Capitalizes major words while keeping minor prepositions in lowercase." }
    ],
    relatedToolSlugs: ["word-counter", "text-diff-checker", "json-formatter"],
  },

  // 19. Date Difference Calculator
  "date-difference-calculator": {
    slug: "date-difference-calculator",
    name: "Date Difference & Duration Calculator",
    shortName: "Date Difference",
    category: "date-time",
    categoryName: "Date & Time",
    description: "Calculate exact days, business days, weeks, months, and years between two dates or add/subtract time from a date.",
    longDescription: "Calculate calendar days, working/business days, and time intervals between any two dates. Plan deadlines or add/subtract days from today.",
    iconName: "Clock",
    metaTitle: "Date Difference Calculator - Days, Weeks, Business Days Between Dates",
    metaDescription: "Calculate exact days, weeks, months, years, and business working days between two dates.",
    keywords: ["date difference calculator", "days between dates", "business days calculator", "working days"],
    features: ["Total calendar days", "Business days (excluding weekends)", "Add or subtract days/weeks/months"],
    faqs: [
      { question: "How does business day calculation work?", answer: "Iterates through the range and excludes Saturdays and Sundays." }
    ],
    relatedToolSlugs: ["age-calculator", "percentage-calculator", "emi-calculator"],
  },

  // 20. Hash Generator (MD5, SHA-256)
  "hash-generator": {
    slug: "hash-generator",
    name: "Hash Generator (MD5, SHA-256, SHA-512)",
    shortName: "Hash Generator",
    category: "security",
    categoryName: "Security & Generators",
    description: "Generate MD5, SHA-1, SHA-256, and SHA-512 cryptographic hashes client-side in real-time.",
    longDescription: "Compute secure cryptographic checksums and hashes for text strings using standard cryptographic algorithms right in your browser.",
    iconName: "Lock",
    metaTitle: "Hash Generator - MD5, SHA-256, SHA-512 Online Hash Tool",
    metaDescription: "Generate cryptographic hashes (MD5, SHA-1, SHA-256, SHA-512) instantly in your browser. 100% private.",
    keywords: ["hash generator", "sha256 generator", "md5 generator", "sha512 online", "hash string"],
    features: ["MD5, SHA-1, SHA-256, SHA-512 algorithms", "Live real-time hash generation", "One-click copy hash", "Uppercase and lowercase hex"],
    faqs: [
      { question: "Can a hash be decrypted?", answer: "No, cryptographic hash functions are one-way functions." }
    ],
    relatedToolSlugs: ["password-generator", "base64-converter", "uuid-generator"],
  },

  // 21. Text Diff Checker
  "text-diff-checker": {
    slug: "text-diff-checker",
    name: "Text Diff & Comparison Checker",
    shortName: "Text Diff",
    category: "text",
    categoryName: "Text & Writing",
    description: "Compare two text snippets side-by-side to highlight additions, deletions, and line-by-line differences.",
    longDescription: "Find differences between two versions of text, code, or documentation. Visual line-by-line comparison highlighting exact edits.",
    iconName: "GitCompare",
    metaTitle: "Text Diff Checker - Compare Two Texts Side by Side",
    metaDescription: "Compare two text documents online. Find added, removed, and modified lines with highlighted visual diffs.",
    keywords: ["text diff checker", "compare text online", "diff checker", "text comparison"],
    features: ["Side-by-side or unified diff view", "Added and deleted line highlights", "Word-level change detection", "Zero server upload"],
    faqs: [
      { question: "How does the diff algorithm work?", answer: "Compares lines sequentially to detect additions, deletions, and modifications." }
    ],
    relatedToolSlugs: ["word-counter", "case-converter", "json-formatter"],
  },

  // 22. AI Formula & Tool Explainer
  "ai-explainer": {
    slug: "ai-explainer",
    name: "AI Tool & Formula Explainer",
    shortName: "AI Explainer",
    category: "ai-tools",
    categoryName: "AI-Powered Tools",
    description: "Get instant, plain-English explanations for complex formulas, financial calculations, regex patterns, or code snippets.",
    longDescription: "An intelligent educational explainer that demystifies mathematical formulas, financial metrics, regex expressions, and code structures.",
    iconName: "Sparkles",
    metaTitle: "AI Formula & Math Explainer - Plain English Explanations",
    metaDescription: "Understand math formulas, financial metrics, and regex in plain English with instant AI explanations.",
    keywords: ["ai explainer", "explain math formula", "ai formula assistant", "explain regex online"],
    features: ["Plain English math breakdowns", "Business scenario interpretations", "Regex & code pattern explainer", "Interactive query assistant"],
    faqs: [
      { question: "What topics can the AI explain?", answer: "Calculators, percentages, margin vs markup, GST, loan amortization, JSON syntax, and regex patterns." }
    ],
    relatedToolSlugs: ["percentage-calculator", "profit-margin-calculator", "json-formatter"],
  },

  // 32. Split PDF
  "split-pdf": {
    slug: "split-pdf",
    name: "Split PDF & Extract Pages",
    shortName: "Split PDF",
    category: "pdf-docs",
    categoryName: "PDF & Documents",
    description: "Extract specific pages or page ranges from a PDF into a new document, entirely in your browser.",
    longDescription: "Pull selected pages out of a PDF into a new file using simple range syntax like 1-3, 5, 8-10. Runs client-side with pdf-lib, so contracts and statements are never uploaded.",
    iconName: "Scissors",
    metaTitle: "Split PDF Online Free - Extract Pages from PDF",
    metaDescription: "Split a PDF and extract any pages or ranges into a new file. Free, no signup, and processed entirely in your browser.",
    keywords: ["split pdf", "extract pages from pdf", "pdf splitter", "separate pdf pages", "pdf page extractor"],
    features: ["Range syntax like 1-3, 5, 8-10", "Live count of selected pages", "Lossless page copying", "Nothing is uploaded"],
    faqs: [
      { question: "Does splitting reduce quality?", answer: "No. Pages are copied across byte-for-byte, so text, vectors, and images are preserved exactly." }
    ],
    relatedToolSlugs: ["pdf-merge", "rotate-pdf", "pdf-to-jpg"],
    isPopular: true,
  },

  // 33. PDF to JPG
  "pdf-to-jpg": {
    slug: "pdf-to-jpg",
    name: "PDF to JPG & PNG Converter",
    shortName: "PDF to JPG",
    category: "pdf-docs",
    categoryName: "PDF & Documents",
    description: "Render every page of a PDF as a JPG or PNG image and download them individually or as a ZIP.",
    longDescription: "Convert PDF pages into images at your chosen resolution using pdf.js. Download single pages or the whole document as a ZIP archive, with all rendering done inside your browser.",
    iconName: "Image",
    metaTitle: "PDF to JPG Converter Free - Convert PDF Pages to Images",
    metaDescription: "Convert PDF pages to JPG or PNG images at up to 288 DPI. Download individually or as a ZIP. Free and fully client-side.",
    keywords: ["pdf to jpg", "pdf to png", "convert pdf to image", "pdf page to image", "extract images from pdf"],
    features: ["JPG or PNG output", "Selectable render resolution", "Batch ZIP download", "Rendered in your browser"],
    faqs: [
      { question: "What resolution should I choose?", answer: "2x (about 144 DPI) suits screen use. Choose 3x or 4x for printing, which produces larger files." }
    ],
    relatedToolSlugs: ["image-to-pdf", "split-pdf", "image-compressor"],
    isPopular: true,
  },

  // 34. Rotate PDF
  "rotate-pdf": {
    slug: "rotate-pdf",
    name: "Rotate PDF Pages",
    shortName: "Rotate PDF",
    category: "pdf-docs",
    categoryName: "PDF & Documents",
    description: "Rotate every page of a PDF by 90, 180, or 270 degrees and save the corrected document.",
    longDescription: "Fix sideways or upside-down scans by rotating PDF pages. Rotation is added to any existing page rotation so already-landscape pages stay correct, and the file never leaves your browser.",
    iconName: "RotateCw",
    metaTitle: "Rotate PDF Online Free - Fix Sideways PDF Pages",
    metaDescription: "Rotate PDF pages by 90, 180, or 270 degrees and download the fixed file. Free, private, and runs in your browser.",
    keywords: ["rotate pdf", "turn pdf pages", "fix sideways pdf", "rotate pdf online free", "pdf orientation"],
    features: ["90, 180 or 270 degree rotation", "Respects existing page rotation", "Lossless — no re-encoding", "Nothing is uploaded"],
    faqs: [
      { question: "Is the rotation permanent?", answer: "Yes. The rotation is written into the downloaded PDF, so every reader displays it the same way." }
    ],
    relatedToolSlugs: ["split-pdf", "pdf-merge", "add-page-numbers"],
  },

  // 35. Add Page Numbers to PDF
  "add-page-numbers": {
    slug: "add-page-numbers",
    name: "Add Page Numbers to PDF",
    shortName: "Add Page Numbers",
    category: "pdf-docs",
    categoryName: "PDF & Documents",
    description: "Stamp sequential page numbers onto a PDF with a choice of position and starting number.",
    longDescription: "Add clean page numbers to any PDF, choosing the corner they sit in and the number to start counting from. Useful for court filings, dissertations, and any document that must be paginated.",
    iconName: "Hash",
    metaTitle: "Add Page Numbers to PDF Free - Number PDF Pages",
    metaDescription: "Add page numbers to a PDF online. Choose position and starting number. Free, no signup, processed in your browser.",
    keywords: ["add page numbers to pdf", "number pdf pages", "pdf pagination", "insert page numbers pdf"],
    features: ["Bottom centre, bottom right or top right", "Custom starting number", "Clean Helvetica numbering", "Nothing is uploaded"],
    faqs: [
      { question: "Can I start numbering from a page other than 1?", answer: "Yes. Set any starting number, which is useful when front matter is numbered separately." }
    ],
    relatedToolSlugs: ["pdf-merge", "split-pdf", "rotate-pdf"],
  },

  // 36. Image Resizer
  "image-resizer": {
    slug: "image-resizer",
    name: "Image Resizer by Pixels & Percent",
    shortName: "Image Resizer",
    category: "image-media",
    categoryName: "Image & Media",
    description: "Resize any image to exact pixel dimensions or a percentage, with aspect ratio locking.",
    longDescription: "Change an image's pixel dimensions precisely, with an optional aspect-ratio lock and high-quality resampling. Export as JPG, PNG, or WebP without uploading anything.",
    iconName: "Scaling",
    metaTitle: "Image Resizer Online Free - Resize Images by Pixel",
    metaDescription: "Resize images to exact pixel dimensions or by percentage. Lock aspect ratio and export as JPG, PNG, or WebP. Free and private.",
    keywords: ["image resizer", "resize image online", "change image dimensions", "resize photo pixels", "image size changer"],
    features: ["Exact pixel width and height", "Aspect ratio lock", "25/50/75% quick presets", "JPG, PNG or WebP output"],
    faqs: [
      { question: "Does resizing lose quality?", answer: "Downscaling is essentially lossless to the eye. Enlarging cannot add detail that was never captured, so upscaled images look soft." }
    ],
    relatedToolSlugs: ["image-compressor", "crop-image", "png-to-jpg"],
    isPopular: true,
  },

  // 37. Favicon Generator
  "favicon-generator": {
    slug: "favicon-generator",
    name: "Favicon Generator from Image",
    shortName: "Favicon Generator",
    category: "image-media",
    categoryName: "Image & Media",
    description: "Turn a logo into a full set of favicon PNGs at every size browsers and phones request.",
    longDescription: "Generate favicons at 16px through 512px from a single logo, including the 180px Apple touch icon, packaged as a ZIP with a ready-to-paste HTML snippet and web manifest.",
    iconName: "Star",
    metaTitle: "Favicon Generator Free - Create Favicons from Image",
    metaDescription: "Generate favicon PNGs from any logo at 16 to 512 pixels, with Apple touch icon and manifest. Free, no signup, client-side.",
    keywords: ["favicon generator", "create favicon", "favicon from image", "apple touch icon generator", "website icon generator"],
    features: ["Nine sizes from 16px to 512px", "Apple touch icon at 180px", "ZIP with HTML snippet and manifest", "Transparent or solid background"],
    faqs: [
      { question: "What source image works best?", answer: "A square image of at least 512x512. Simple, high-contrast marks stay legible at 16px; detailed logos do not." }
    ],
    relatedToolSlugs: ["image-resizer", "png-to-jpg", "crop-image"],
  },

  // 38. Currency Converter
  "currency-converter": {
    slug: "currency-converter",
    name: "Currency Converter",
    shortName: "Currency Converter",
    category: "calculators",
    categoryName: "Calculators & Finance",
    description: "Convert dollar to rupee, rupee to dollar, and between 160+ world currencies at live mid-market exchange rates.",
    longDescription: "Convert dollars to rupees, euros to rupees, and between more than 160 world currencies using live mid-market exchange rates, with the reverse rate and the bank margin explained alongside.",
    iconName: "ArrowRightLeft",
    metaTitle: "Currency Converter - Live Exchange Rates",
    metaDescription: "Convert dollar to rupee and 160+ other currencies at live mid-market rates. Reverse rate shown instantly. Free, no signup, updated daily.",
    // Broad aliases so the on-site search matches how people actually type:
    // "dollar", "rupee", "$", "₹", "exchange" all reach this tool.
    keywords: [
      "dollar to rupee", "rupee to dollar", "usd to inr", "inr to usd",
      "dollar", "rupee", "usd", "inr", "$", "₹",
      "currency converter", "currency exchange", "exchange rate",
      "money converter", "forex rate", "live exchange rate",
      "euro to rupee", "eur to inr", "euro", "eur", "€",
      "pound to rupee", "gbp to inr", "pound", "gbp", "£",
      "dirham to rupee", "aed to inr", "dirham", "aed",
      "riyal to rupee", "sar to inr", "riyal", "sar",
      "cad to inr", "aud to inr", "sgd to inr", "yen", "jpy",
      "convert currency", "1 usd to inr", "dollar rate today",
    ],
    features: ["Live mid-market rates", "160+ currencies", "One-tap swap and reverse rate", "Popular pairs preset"],
    faqs: [
      { question: "Why is my bank's rate worse than this?", answer: "This shows the mid-market rate. Banks and cards add a margin of roughly 1-4%, plus any fixed transfer fee." }
    ],
    relatedToolSlugs: ["percentage-calculator", "gst-calculator", "discount-calculator"],
    isPopular: true,
  },

  // 39. Sample / Dummy File Generator
  "sample-file-generator": {
    slug: "sample-file-generator",
    name: "Sample File Generator",
    shortName: "Sample Files",
    category: "developer",
    categoryName: "Developer & Data",
    description: "Generate dummy images, PDFs, Word files, CSV, JSON, and video at an exact file size for testing uploads.",
    longDescription: "Create placeholder files at any size you specify — sample images, PDFs, DOCX, CSV, JSON, text, and short videos — with randomised content each time. Built for testing upload limits, forms, and file handling.",
    iconName: "Shuffle",
    metaTitle: "Sample File Generator - Dummy Image, PDF & Video",
    metaDescription: "Generate dummy files at an exact size: sample images, PDFs, Word docs, CSV, JSON and video. Free, random each time, no signup.",
    keywords: [
      "sample file generator", "dummy file generator", "test file generator",
      "sample image download", "dummy image generator", "sample pdf download",
      "dummy pdf", "sample docx", "test file 1mb", "sample video download",
      "placeholder image", "dummy data file", "sample csv", "sample json",
      "generate file of specific size", "10mb test file",
    ],
    features: ["Exact target file size", "Image, PDF, Word, CSV, JSON, video", "Randomised content every time", "Copy small images as data URLs"],
    faqs: [
      { question: "Are the files a real, valid format?", answer: "Yes. Every file opens in its normal application; padding uses regions each format ignores." }
    ],
    relatedToolSlugs: ["image-compressor", "pdf-compressor", "json-formatter"],
    isPopular: true,
  },

  // 40. Sample Image Generator
  "sample-image-generator": {
    slug: "sample-image-generator",
    name: "Sample Image Generator",
    shortName: "Sample Images",
    category: "image-media",
    categoryName: "Image & Media",
    description: "Generate random placeholder images at an exact file size in JPG, PNG, or WebP.",
    longDescription: "Create dummy images at any file size you specify, with randomised artwork and dimensions every time. Built for testing upload limits, filling layouts, and checking image pipelines.",
    iconName: "Image",
    metaTitle: "Sample Image Generator - Dummy Image Any Size",
    metaDescription: "Generate placeholder images at an exact file size in JPG, PNG or WebP. Random artwork each time, free, no signup.",
    keywords: ["sample image", "dummy image generator", "placeholder image", "sample image download", "test image 1mb", "random image generator", "fake image generator"],
    features: ["Exact target file size", "JPG, PNG or WebP", "Randomised artwork and dimensions", "Copy small images as data URLs"],
    faqs: [
      { question: "Are the images real image files?", answer: "Yes. Each is drawn on a canvas and encoded properly, so it opens in any image viewer or editor." }
    ],
    relatedToolSlugs: ["image-compressor", "image-resizer", "sample-file-generator"],
    isPopular: true,
  },

  // 41. Sample PDF Generator
  "sample-pdf-generator": {
    slug: "sample-pdf-generator",
    name: "Sample PDF Generator",
    shortName: "Sample PDFs",
    category: "pdf-docs",
    categoryName: "PDF & Documents",
    description: "Generate dummy PDF files at an exact size, with a random number of pages and real text content.",
    longDescription: "Create placeholder PDFs at any file size, each with a randomised page count and genuine text content built with pdf-lib. Useful for testing upload caps, PDF viewers, and document pipelines.",
    iconName: "FileText",
    metaTitle: "Sample PDF Generator - Dummy PDF of Any Size",
    metaDescription: "Generate dummy PDF files at an exact size with real pages and text. Free, random each time, processed in your browser.",
    keywords: ["sample pdf", "dummy pdf generator", "sample pdf download", "test pdf file", "pdf 1mb sample", "placeholder pdf", "fake pdf generator"],
    features: ["Exact target file size", "Random page count and content", "Valid PDF that opens anywhere", "Nothing is uploaded"],
    faqs: [
      { question: "Do the PDFs actually open?", answer: "Yes. They are built with pdf-lib and contain real pages, headings, and body text." }
    ],
    relatedToolSlugs: ["pdf-merge", "split-pdf", "sample-file-generator"],
  },

  // 42. Sample Video Generator
  "sample-video-generator": {
    slug: "sample-video-generator",
    name: "Sample Video Generator",
    shortName: "Sample Videos",
    category: "image-media",
    categoryName: "Image & Media",
    description: "Generate a short random WebM video clip in your browser for testing uploads and players.",
    longDescription: "Record a short animated WebM clip of any length between one and ten seconds, generated live in your browser. Useful for testing video uploads, players, and duration limits.",
    iconName: "Shuffle",
    metaTitle: "Sample Video Generator - Dummy WebM Test Clip",
    metaDescription: "Generate a short sample video for testing uploads and players. Choose the length, recorded in your browser, free.",
    keywords: ["sample video", "dummy video generator", "sample video download", "test video file", "placeholder video", "short test clip"],
    features: ["1 to 10 second clips", "640x360 VP9 WebM", "Randomised animation each time", "Recorded locally, never uploaded"],
    faqs: [
      { question: "Can I choose the exact file size?", answer: "No. The browser's recorder picks its own bitrate, so you choose the duration and the size follows." }
    ],
    relatedToolSlugs: ["sample-image-generator", "sample-file-generator", "image-compressor"],
  },

  // 43. Sample Data File Generator
  "sample-data-generator": {
    slug: "sample-data-generator",
    name: "Sample CSV & JSON Generator",
    shortName: "Sample Data",
    category: "developer",
    categoryName: "Developer & Data",
    description: "Generate dummy CSV, JSON, and plain text files at an exact size with realistic placeholder records.",
    longDescription: "Create test data files at any size — CSV with headers and rows, JSON arrays of records, or plain text. Useful for testing importers, parsers, and upload limits.",
    iconName: "Code",
    metaTitle: "Sample CSV & JSON Generator - Dummy Data Files",
    metaDescription: "Generate dummy CSV, JSON and text files at an exact size with realistic placeholder records. Free and instant.",
    keywords: ["sample csv", "dummy csv generator", "sample json file", "test data generator", "dummy data file", "sample csv download", "large csv for testing"],
    features: ["CSV, JSON or plain text", "Exact target file size", "Realistic placeholder records", "Runs entirely in your browser"],
    faqs: [
      { question: "Is the data realistic?", answer: "It uses plausible names, emails, cities, and amounts — enough to exercise a parser or importer." }
    ],
    relatedToolSlugs: ["json-formatter", "sample-file-generator", "text-diff-checker"],
  },
};

export function getAllTools(): ToolDefinition[] {
  return Object.values(TOOLS_REGISTRY);
}

export function getPopularTools(): ToolDefinition[] {
  return Object.values(TOOLS_REGISTRY).filter((t) => t.isPopular);
}

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return TOOLS_REGISTRY[slug];
}

export function getToolsByCategory(category: string): ToolDefinition[] {
  return Object.values(TOOLS_REGISTRY).filter((t) => t.category === category);
}

export function getRelatedTools(tool: ToolDefinition): ToolDefinition[] {
  return tool.relatedToolSlugs
    .map((slug) => TOOLS_REGISTRY[slug])
    .filter(Boolean) as ToolDefinition[];
}
