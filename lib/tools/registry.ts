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
    "id": "calculators",
    "name": "Calculators & Finance",
    "description": "Percentage, discount, EMI, GST, SIP, and salary calculators",
    "icon": "Calculator"
  },
  {
    "id": "date-time",
    "name": "Date & Time",
    "description": "Age, date differences, business days, and timezone converters",
    "icon": "Clock"
  },
  {
    "id": "text",
    "name": "Text & Writing",
    "description": "Word counters, case converters, cleaners, and diff checkers",
    "icon": "Type"
  },
  {
    "id": "developer",
    "name": "Developer & Data",
    "description": "JSON formatters, Base64, JWT, UUID, URL encoders, and regex",
    "icon": "Code"
  },
  {
    "id": "image-media",
    "name": "Image & Media",
    "description": "Client-side image compressor, QR code generator, and format converter",
    "icon": "Image"
  },
  {
    "id": "pdf-docs",
    "name": "PDF & Documents",
    "description": "Client-side PDF merge, split, and document utilities",
    "icon": "FileText"
  },
  {
    "id": "security",
    "name": "Security & Generators",
    "description": "Secure password generator, hash generation, and token tools",
    "icon": "Shield"
  },
  {
    "id": "business",
    "name": "Business & Marketing",
    "description": "Profit margins, markup, break-even, and invoice calculations",
    "icon": "TrendingUp"
  },
  {
    "id": "ai-tools",
    "name": "AI-Powered Tools",
    "description": "AI formula explainer, text summarizer, and regex generator",
    "icon": "Sparkles"
  }
];

export const TOOLS_REGISTRY: Record<string, ToolDefinition> = {
  "json-formatter": {
    "slug": "json-formatter",
    "name": "JSON Formatter",
    "shortName": "JSON Formatter",
    "category": "developer",
    "categoryName": "Developer & Data",
    "description": "Format, validate, prettify, minify, and inspect JSON payloads with real-time error detection.",
    "longDescription": "A client-side developer utility to format unreadable JSON, detect syntax mistakes with exact line diagnostics, minify data, and inspect structures securely without data leaves your browser.",
    "iconName": "Code",
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
    "isPopular": true
  },
  "percentage-calculator": {
    "slug": "percentage-calculator",
    "name": "Percentage Calculator",
    "shortName": "Percentage Calculator",
    "category": "calculators",
    "categoryName": "Calculators & Finance",
    "description": "Calculate percentages, percentage increases, decreases, and differences with instant step-by-step formulas.",
    "longDescription": "Instant math tool for students, finance managers, shoppers, and researchers. Solve X% of Y, percentage increase/decrease, and percentage difference instantly.",
    "iconName": "Percent",
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
    "isPopular": true
  },
  "word-counter": {
    "slug": "word-counter",
    "name": "Word Counter",
    "shortName": "Word Counter",
    "category": "text",
    "categoryName": "Text & Writing",
    "description": "Count words, characters, sentences, paragraphs, and estimate reading & speaking time in real-time.",
    "longDescription": "Essential writing utility for essayists, copywriters, and social media managers. Track character limits for Twitter/X, Instagram, LinkedIn, and calculate estimated reading duration.",
    "iconName": "FileText",
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
    "isPopular": true
  },
  "password-generator": {
    "slug": "password-generator",
    "name": "Random Password Generator",
    "shortName": "Password Generator",
    "category": "security",
    "categoryName": "Security & Generators",
    "description": "Generate highly secure, cryptographically random passwords with customizable length, symbols, and memorability.",
    "longDescription": "Create uncrackable, cryptographically secure passwords using standard browser Crypto APIs. Customize length, uppercase, lowercase, numbers, and special symbols.",
    "iconName": "Shield",
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
    "isPopular": true
  },
  "base64-converter": {
    "slug": "base64-converter",
    "name": "Base64 Converter",
    "shortName": "Base64 Converter",
    "category": "developer",
    "categoryName": "Developer & Data",
    "description": "Encode text or decode Base64 strings instantly with live UTF-8 support and URL-safe mode.",
    "longDescription": "Convert plain text to Base64 and decode Base64 strings to readable UTF-8 text with instant one-click copy and error detection.",
    "iconName": "Binary",
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
    "isPopular": true
  },
  "jwt-decoder": {
    "slug": "jwt-decoder",
    "name": "JWT Decoder",
    "shortName": "JWT Decoder",
    "category": "developer",
    "categoryName": "Developer & Data",
    "description": "Decode JSON Web Tokens (Header, Payload, Signature) and inspect expiration timestamps safely in your browser.",
    "longDescription": "Debug JWT authentication tokens client-side. Inspect user claims, issuer, algorithm, and check whether the token is expired or valid.",
    "iconName": "Key",
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
    "isPopular": true
  },
  "uuid-generator": {
    "slug": "uuid-generator",
    "name": "UUID & GUID Generator",
    "shortName": "UUID Generator",
    "category": "developer",
    "categoryName": "Developer & Data",
    "description": "Generate cryptographically secure Version 4 UUIDs (GUIDs) in bulk with uppercase, hyphen, and quote formatting.",
    "longDescription": "Generate random v4 UUIDs for database primary keys, API tokens, and unique identifiers. Bulk generation up to 100 UUIDs at once.",
    "iconName": "Hash",
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
    "isPopular": true
  },
  "url-encoder-decoder": {
    "slug": "url-encoder-decoder",
    "name": "URL Encoder & Decoder",
    "shortName": "URL Encoder & Decoder",
    "category": "developer",
    "categoryName": "Developer & Data",
    "description": "Encode query parameters and special characters into percent-encoded URL format, or decode URLs to plain text.",
    "longDescription": "Quickly percent-encode URL strings and decode encoded URLs. Supports full URL encode and encodeURIComponent modes.",
    "iconName": "Link",
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
    "isPopular": true
  },
  "qr-code-generator": {
    "slug": "qr-code-generator",
    "name": "QR Code Generator",
    "shortName": "QR Code Generator",
    "category": "image-media",
    "categoryName": "Image & Media",
    "description": "Generate high-resolution custom QR codes for URLs, text, Wi-Fi passwords, emails, and phone numbers. Download as PNG or SVG.",
    "longDescription": "Create clean QR codes instantly in your browser. Customize colors, error correction level, and size. Download high-res PNG for print or web.",
    "iconName": "QrCode",
    "metaTitle": "QR Code Generator | TabBench",
    "metaDescription": "Create custom QR codes for URLs, WiFi networks, text, and contact cards. Customize colors, error correction, and download crisp PNGs.",
    "keywords": [
      "qr code generator",
      "create qr code",
      "custom qr code generator",
      "free qr code maker",
      "download qr code png",
      "generate qr online",
      "wifi qr code generator",
      "link to qr code",
      "barcode qr maker"
    ],
    "features": [
      "URL, Text, and WiFi modes",
      "Custom foreground & background colors",
      "Download as PNG",
      "High error correction"
    ],
    "faqs": [
      {
        "question": "Do these QR codes expire?",
        "answer": "No, these are standard static QR codes and will work indefinitely."
      }
    ],
    "relatedToolSlugs": [
      "image-compressor",
      "password-generator",
      "pdf-merge"
    ],
    "isPopular": true
  },
  "image-compressor": {
    "slug": "image-compressor",
    "name": "Image Compressor",
    "shortName": "Image Compressor",
    "category": "image-media",
    "categoryName": "Image & Media",
    "description": "Compress image to exact target KB (e.g. under 50KB, 100KB, 200KB) with live quality adaptation and alerts.",
    "longDescription": "Compress JPG, PNG, and WebP images to your exact target file size in KB. Ideal for government portals, job applications, resumes, and websites with strict file size limits. 100% private in-browser compression.",
    "iconName": "Image",
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
    "isPopular": true
  },
  "image-to-pdf": {
    "slug": "image-to-pdf",
    "name": "Image to PDF Converter",
    "shortName": "Image to PDF Converter",
    "category": "pdf-docs",
    "categoryName": "PDF & Documents",
    "description": "Convert JPG, PNG, and WebP images into PDF documents, or extract PDF pages as high-resolution images.",
    "longDescription": "Convert multiple photos and documents into a clean multi-page PDF, or convert PDF pages into high-res JPG/PNG images client-side with zero data uploads.",
    "iconName": "FilePlus",
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
    "isPopular": true
  },
  "pdf-to-word": {
    "slug": "pdf-to-word",
    "name": "PDF to Word Converter",
    "shortName": "PDF to Word Converter",
    "category": "pdf-docs",
    "categoryName": "PDF & Documents",
    "description": "Convert PDF documents to editable Microsoft Word (.docx) files, or convert Word documents to PDF.",
    "longDescription": "Easily extract text and formatting from PDF files into editable DOCX Word files, or convert Word (.docx) documents into clean PDF files right in your browser.",
    "iconName": "FileText",
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
    "isPopular": true
  },
  "watermark-remover": {
    "slug": "watermark-remover",
    "name": "Watermark Remover",
    "shortName": "Watermark Remover",
    "category": "image-media",
    "categoryName": "Image & Media",
    "description": "Remove watermarks, logos, dates, and stamps from images using smart inpainting, or add custom watermarks.",
    "longDescription": "Clean unwanted watermarks, timestamps, and logos from photos using client-side neighbor inpainting algorithms, or protect your images by adding custom text/image watermarks.",
    "iconName": "Sparkles",
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
    "isPopular": true
  },
  "png-to-jpg": {
    "slug": "png-to-jpg",
    "name": "PNG to JPG Converter",
    "shortName": "PNG to JPG Converter",
    "category": "image-media",
    "categoryName": "Image & Media",
    "description": "Convert PNG images to JPG with custom background fill for transparent areas and adjustable compression quality.",
    "longDescription": "Instant format conversion from PNG to JPG. Automatically fills transparent PNG backgrounds with clean white or custom colors when saving as JPG.",
    "iconName": "Image",
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
    "isPopular": true
  },
  "jpg-to-png": {
    "slug": "jpg-to-png",
    "name": "JPG to PNG Converter",
    "shortName": "JPG to PNG Converter",
    "category": "image-media",
    "categoryName": "Image & Media",
    "description": "Convert JPG and JPEG photos into lossless PNG format with crisp quality and zero compression artifacts.",
    "longDescription": "Convert standard JPEG and JPG photos into uncompressed PNG images. Great for graphic design, logos, and high-fidelity editing.",
    "iconName": "Image",
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
    "isPopular": true
  },
  "image-to-webp": {
    "slug": "image-to-webp",
    "name": "Image to WebP Converter",
    "shortName": "Image to WebP Converter",
    "category": "image-media",
    "categoryName": "Image & Media",
    "description": "Convert JPG and PNG images into modern Google WebP format to reduce file sizes by 30% to 80% while retaining quality.",
    "longDescription": "Speed up your website load times and save bandwidth by converting bulky images to modern, high-efficiency WebP format.",
    "iconName": "Image",
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
    "isPopular": true
  },
  "webp-to-jpg": {
    "slug": "webp-to-jpg",
    "name": "WebP to JPG Converter",
    "shortName": "WebP to JPG Converter",
    "category": "image-media",
    "categoryName": "Image & Media",
    "description": "Convert WebP images into universally compatible JPG or PNG formats for easy sharing and opening on any device.",
    "longDescription": "Easily open and convert downloaded .webp images into standard JPG or PNG files that can be edited in Photoshop, Word, or shared anywhere.",
    "iconName": "Image",
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
    "isPopular": true
  },
  "unlock-pdf": {
    "slug": "unlock-pdf",
    "name": "Unlock PDF",
    "shortName": "Unlock PDF",
    "category": "pdf-docs",
    "categoryName": "PDF & Documents",
    "description": "Remove owner password restrictions, copying, and printing locks from PDF files entirely in your browser.",
    "longDescription": "Unlock restricted PDF documents so you can copy text, print, and edit pages freely. 100% processed in browser memory with zero security risk.",
    "iconName": "Lock",
    "metaTitle": "Unlock PDF | TabBench",
    "metaDescription": "Unlock password-protected PDF files and remove print, copy, and edit restrictions safely in your browser. Zero server upload.",
    "keywords": [
      "unlock pdf",
      "remove pdf password",
      "unlock protected pdf",
      "pdf password remover",
      "remove pdf print restrictions",
      "decrypt pdf online",
      "unlock secured pdf",
      "pdf permission remover",
      "remove edit lock from pdf"
    ],
    "features": [
      "Remove restrictions and print locks",
      "Decrypt with known password",
      "Zero server upload",
      "Instant unlocked PDF download"
    ],
    "faqs": [
      {
        "question": "Can it unlock password-protected files?",
        "answer": "Yes. For user-encrypted PDFs, enter the password once to decrypt and save a permanently unrestricted copy."
      }
    ],
    "relatedToolSlugs": [
      "pdf-merge",
      "pdf-to-word",
      "image-to-pdf"
    ],
    "isPopular": true
  },
  "crop-image": {
    "slug": "crop-image",
    "name": "Crop Image",
    "shortName": "Crop Image",
    "category": "image-media",
    "categoryName": "Image & Media",
    "description": "Crop photos to custom dimensions or standard aspect ratios (1:1, 16:9, 4:3, 9:16 Story) with live preview.",
    "longDescription": "Crop, frame, and resize your images for Instagram posts, YouTube thumbnails, profile pictures, and banners with precise pixel controls.",
    "iconName": "Crop",
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
    "isPopular": true
  },
  "pdf-merge": {
    "slug": "pdf-merge",
    "name": "Merge PDF",
    "shortName": "Merge PDF",
    "category": "pdf-docs",
    "categoryName": "PDF & Documents",
    "description": "Combine multiple PDF documents into a single organized PDF file entirely client-side in your browser.",
    "longDescription": "Merge multiple PDF files securely in your browser using pdf-lib. Reorder files, remove unwanted pages, and download the combined PDF with zero server upload.",
    "iconName": "FilePlus",
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
    "isPopular": true
  },
  "pdf-compressor": {
    "slug": "pdf-compressor",
    "name": "PDF Page Counter & Inspector",
    "shortName": "PDF Inspector",
    "category": "pdf-docs",
    "categoryName": "PDF & Documents",
    "description": "Inspect PDF metadata, count pages, analyze embedded objects, and reduce document overhead.",
    "longDescription": "Analyze PDF documents, verify page dimensions, check encryption status, and optimize document structure client-side.",
    "iconName": "FileCheck",
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
    "features": [
      "Page count detection",
      "File size breakdown",
      "Document metadata viewer",
      "100% private"
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
    "isPopular": true
  },
  "age-calculator": {
    "slug": "age-calculator",
    "name": "Age Calculator",
    "shortName": "Age Calculator",
    "category": "date-time",
    "categoryName": "Date & Time",
    "description": "Calculate your exact age in years, months, weeks, days, hours, and minutes, plus next birthday countdown.",
    "longDescription": "Find out your exact age to the day and minute. View interesting milestones like days lived, total breaths, total heartbeats, and days until your next birthday.",
    "iconName": "Calendar",
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
    "isPopular": true
  },
  "gst-calculator": {
    "slug": "gst-calculator",
    "name": "GST Calculator",
    "shortName": "GST Calculator",
    "category": "calculators",
    "categoryName": "Calculators & Finance",
    "description": "Calculate GST (Goods & Services Tax) easily: Add GST to base amount or Reverse GST (extract tax from total) with standard 5%, 12%, 18%, 28% slabs.",
    "longDescription": "Calculate inclusive and exclusive GST amounts in seconds. Determine CGST, SGST, IGST tax breakdown and find net pricing.",
    "iconName": "Receipt",
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
    "features": [
      "Add GST & Remove GST modes",
      "Standard slabs: 5%, 12%, 18%, 28%",
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
    "isPopular": true
  },
  "emi-calculator": {
    "slug": "emi-calculator",
    "name": "EMI Calculator",
    "shortName": "EMI Calculator",
    "category": "calculators",
    "categoryName": "Calculators & Finance",
    "description": "Calculate equated monthly installments (EMI) for home loans, car loans, and personal loans with total interest and amortization charts.",
    "longDescription": "Plan your loan repayment with our loan EMI calculator. Calculate monthly payments, total interest payable, and total cost of loan with interactive tenure sliders.",
    "iconName": "TrendingUp",
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
    "isPopular": true
  },
  "discount-calculator": {
    "slug": "discount-calculator",
    "name": "Discount Calculator",
    "shortName": "Discount Calculator",
    "category": "calculators",
    "categoryName": "Calculators & Finance",
    "description": "Calculate final sale price, discount amount saved, and double discount / stackable coupon savings instantly.",
    "longDescription": "Find out how much you save during sales and clearance events. Calculate percentage discounts, fixed cash discounts, and additional coupon codes.",
    "iconName": "Tag",
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
    ]
  },
  "profit-margin-calculator": {
    "slug": "profit-margin-calculator",
    "name": "Profit Margin Calculator",
    "shortName": "Profit Margin Calculator",
    "category": "business",
    "categoryName": "Business & Marketing",
    "description": "Calculate gross profit margin, markup percentage, revenue, and cost price with clear visual breakdowns.",
    "longDescription": "Optimize your product pricing, ecommerce stores, and quotes. Understand the crucial mathematical difference between Margin and Markup.",
    "iconName": "TrendingUp",
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
    ]
  },
  "case-converter": {
    "slug": "case-converter",
    "name": "Case Converter",
    "shortName": "Case Converter",
    "category": "text",
    "categoryName": "Text & Writing",
    "description": "Convert text between UPPERCASE, lowercase, Title Case, camelCase, snake_case, kebab-case, clean spaces, and count words.",
    "longDescription": "Manipulate and format text in your browser. Clean messy copy, format code identifiers, strip redundant spaces, and capitalize headings.",
    "iconName": "Type",
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
    ]
  },
  "date-difference-calculator": {
    "slug": "date-difference-calculator",
    "name": "Date Difference Calculator",
    "shortName": "Date Difference Calculator",
    "category": "date-time",
    "categoryName": "Date & Time",
    "description": "Calculate exact days, business days, weeks, months, and years between two dates or add/subtract time from a date.",
    "longDescription": "Calculate calendar days, working/business days, and time intervals between any two dates. Plan deadlines or add/subtract days from today.",
    "iconName": "Clock",
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
    ]
  },
  "image-to-text": {
    "slug": "image-to-text",
    "name": "Image to Text (OCR)",
    "shortName": "Image to Text",
    "category": "ai-tools",
    "categoryName": "AI Tools",
    "description": "Extract text from screenshots, scans and photos. Runs on your device, with an optional AI mode for handwriting.",
    "longDescription": "Read the text out of any image and get it back as editable, copyable text. The default recogniser runs entirely in your browser, so the image is never uploaded. An optional AI mode handles handwriting, tables and non-English scripts that on-device OCR cannot.",
    "iconName": "ScanText",
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
    "isPopular": true
  },
  "hash-generator": {
    "slug": "hash-generator",
    "name": "Hash Generator",
    "shortName": "Hash Generator",
    "category": "security",
    "categoryName": "Security & Generators",
    "description": "Generate MD5, SHA-1, SHA-256, and SHA-512 cryptographic hashes client-side in real-time.",
    "longDescription": "Compute secure cryptographic checksums and hashes for text strings using standard cryptographic algorithms right in your browser.",
    "iconName": "Lock",
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
    ]
  },
  "text-diff-checker": {
    "slug": "text-diff-checker",
    "name": "Text Diff Checker",
    "shortName": "Text Diff Checker",
    "category": "text",
    "categoryName": "Text & Writing",
    "description": "Compare two text snippets side-by-side to highlight additions, deletions, and line-by-line differences.",
    "longDescription": "Find differences between two versions of text, code, or documentation. Visual line-by-line comparison highlighting exact edits.",
    "iconName": "GitCompare",
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
    "features": [
      "Side-by-side or unified diff view",
      "Added and deleted line highlights",
      "Word-level change detection",
      "Zero server upload"
    ],
    "faqs": [
      {
        "question": "How does the diff algorithm work?",
        "answer": "Compares lines sequentially to detect additions, deletions, and modifications."
      }
    ],
    "relatedToolSlugs": [
      "word-counter",
      "case-converter",
      "json-formatter"
    ]
  },
  "ai-explainer": {
    "slug": "ai-explainer",
    "name": "AI Formula Explainer",
    "shortName": "AI Formula Explainer",
    "category": "ai-tools",
    "categoryName": "AI-Powered Tools",
    "description": "Get instant, plain-English explanations for complex formulas, financial calculations, regex patterns, or code snippets.",
    "longDescription": "An intelligent educational explainer that demystifies mathematical formulas, financial metrics, regex expressions, and code structures.",
    "iconName": "Sparkles",
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
    "features": [
      "Plain English math breakdowns",
      "Business scenario interpretations",
      "Regex & code pattern explainer",
      "Interactive query assistant"
    ],
    "faqs": [
      {
        "question": "What topics can the AI explain?",
        "answer": "Calculators, percentages, margin vs markup, GST, loan amortization, JSON syntax, and regex patterns."
      }
    ],
    "relatedToolSlugs": [
      "percentage-calculator",
      "profit-margin-calculator",
      "json-formatter"
    ]
  },
  "split-pdf": {
    "slug": "split-pdf",
    "name": "Split PDF",
    "shortName": "Split PDF",
    "category": "pdf-docs",
    "categoryName": "PDF & Documents",
    "description": "Extract specific pages or page ranges from a PDF into a new document, entirely in your browser.",
    "longDescription": "Pull selected pages out of a PDF into a new file using simple range syntax like 1-3, 5, 8-10. Runs client-side with pdf-lib, so contracts and statements are never uploaded.",
    "iconName": "Scissors",
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
    "isPopular": true
  },
  "pdf-to-jpg": {
    "slug": "pdf-to-jpg",
    "name": "PDF to JPG Converter",
    "shortName": "PDF to JPG Converter",
    "category": "pdf-docs",
    "categoryName": "PDF & Documents",
    "description": "Render every page of a PDF as a JPG or PNG image and download them individually or as a ZIP.",
    "longDescription": "Convert PDF pages into images at your chosen resolution using pdf.js. Download single pages or the whole document as a ZIP archive, with all rendering done inside your browser.",
    "iconName": "Image",
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
    "isPopular": true
  },
  "rotate-pdf": {
    "slug": "rotate-pdf",
    "name": "Rotate PDF",
    "shortName": "Rotate PDF",
    "category": "pdf-docs",
    "categoryName": "PDF & Documents",
    "description": "Rotate every page of a PDF by 90, 180, or 270 degrees and save the corrected document.",
    "longDescription": "Fix sideways or upside-down scans by rotating PDF pages. Rotation is added to any existing page rotation so already-landscape pages stay correct, and the file never leaves your browser.",
    "iconName": "RotateCw",
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
    ]
  },
  "add-page-numbers": {
    "slug": "add-page-numbers",
    "name": "Add Page Numbers to PDF",
    "shortName": "Add Page Numbers",
    "category": "pdf-docs",
    "categoryName": "PDF & Documents",
    "description": "Stamp sequential page numbers onto a PDF with a choice of position and starting number.",
    "longDescription": "Add clean page numbers to any PDF, choosing the corner they sit in and the number to start counting from. Useful for court filings, dissertations, and any document that must be paginated.",
    "iconName": "Hash",
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
    ]
  },
  "image-resizer": {
    "slug": "image-resizer",
    "name": "Image Resizer",
    "shortName": "Image Resizer",
    "category": "image-media",
    "categoryName": "Image & Media",
    "description": "Resize any image to exact pixel dimensions or a percentage, with aspect ratio locking.",
    "longDescription": "Change an image's pixel dimensions precisely, with an optional aspect-ratio lock and high-quality resampling. Export as JPG, PNG, or WebP without uploading anything.",
    "iconName": "Scaling",
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
    "isPopular": true
  },
  "favicon-generator": {
    "slug": "favicon-generator",
    "name": "Favicon Generator",
    "shortName": "Favicon Generator",
    "category": "image-media",
    "categoryName": "Image & Media",
    "description": "Turn a logo into a full set of favicon PNGs at every size browsers and phones request.",
    "longDescription": "Generate favicons at 16px through 512px from a single logo, including the 180px Apple touch icon, packaged as a ZIP with a ready-to-paste HTML snippet and web manifest.",
    "iconName": "Star",
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
    ]
  },
  "currency-converter": {
    "slug": "currency-converter",
    "name": "Currency Converter",
    "shortName": "Currency Converter",
    "category": "calculators",
    "categoryName": "Calculators & Finance",
    "description": "Convert dollar to rupee, rupee to dollar, and between 160+ world currencies at live mid-market exchange rates.",
    "longDescription": "Convert dollars to rupees, euros to rupees, and between more than 160 world currencies using live mid-market exchange rates, with the reverse rate and the bank margin explained alongside.",
    "iconName": "ArrowRightLeft",
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
    "isPopular": true
  },
  "sample-file-generator": {
    "slug": "sample-file-generator",
    "name": "Sample & Dummy File Generator",
    "shortName": "Sample File Generator",
    "category": "developer",
    "categoryName": "Developer & Data",
    "description": "Generate dummy images, PDFs, Word files, CSV, JSON, and video at an exact file size for testing uploads.",
    "longDescription": "Create placeholder files at any size you specify — sample images, PDFs, DOCX, CSV, JSON, text, and short videos — with randomised content each time. Built for testing upload limits, forms, and file handling.",
    "iconName": "Shuffle",
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
    "isPopular": true
  },
  "sample-image-generator": {
    "slug": "sample-image-generator",
    "name": "Sample & Random Image Generator",
    "shortName": "Sample Image Generator",
    "category": "image-media",
    "categoryName": "Image & Media",
    "description": "Generate random placeholder images at an exact file size in JPG, PNG, or WebP.",
    "longDescription": "Create dummy images at any file size you specify, with randomised artwork and dimensions every time. Built for testing upload limits, filling layouts, and checking image pipelines.",
    "iconName": "Image",
    "metaTitle": "Sample Image Generator | TabBench",
    "metaDescription": "Generate placeholder and dummy images of any exact dimensions and file size. Perfect for web design, mockups, and upload testing.",
    "keywords": [
      "sample image generator",
      "random image generator",
      "dummy image generator",
      "demo image generator",
      "placeholder image download",
      "sample jpg test file",
      "test image generator",
      "random photo generator",
      "mock picture",
      "demo pictures"
    ],
    "features": [
      "Exact target file size",
      "JPG, PNG or WebP",
      "Randomised artwork and dimensions",
      "Copy small images as data URLs"
    ],
    "faqs": [
      {
        "question": "Are the images real image files?",
        "answer": "Yes. Each is drawn on a canvas and encoded properly, so it opens in any image viewer or editor."
      }
    ],
    "relatedToolSlugs": [
      "image-compressor",
      "image-resizer",
      "sample-file-generator"
    ],
    "isPopular": true
  },
  "sample-pdf-generator": {
    "slug": "sample-pdf-generator",
    "name": "Sample & Dummy PDF Generator",
    "shortName": "Sample PDF Generator",
    "category": "pdf-docs",
    "categoryName": "PDF & Documents",
    "description": "Generate dummy PDF files at an exact size, with a random number of pages and real text content.",
    "longDescription": "Create placeholder PDFs at any file size, each with a randomised page count and genuine text content built with pdf-lib. Useful for testing upload caps, PDF viewers, and document pipelines.",
    "iconName": "FileText",
    "metaTitle": "Sample PDF Generator | TabBench",
    "metaDescription": "Generate synthetic dummy PDF files of any exact file size with real pages and text for upload testing and PDF reader debugging.",
    "keywords": [
      "sample pdf generator",
      "dummy pdf download",
      "demo pdf generator",
      "random pdf generator",
      "sample pdf for testing",
      "test pdf file 1mb",
      "placeholder pdf generator",
      "mock pdf file",
      "demo document"
    ],
    "features": [
      "Exact target file size",
      "Random page count and content",
      "Valid PDF that opens anywhere",
      "Nothing is uploaded"
    ],
    "faqs": [
      {
        "question": "Do the PDFs actually open?",
        "answer": "Yes. They are built with pdf-lib and contain real pages, headings, and body text."
      }
    ],
    "relatedToolSlugs": [
      "pdf-merge",
      "split-pdf",
      "sample-file-generator"
    ]
  },
  "sample-video-generator": {
    "slug": "sample-video-generator",
    "name": "Sample & Dummy Video Generator",
    "shortName": "Sample Video Generator",
    "category": "image-media",
    "categoryName": "Image & Media",
    "description": "Generate a short random WebM video clip in your browser for testing uploads and players.",
    "longDescription": "Record a short animated WebM clip of any length between one and ten seconds, generated live in your browser. Useful for testing video uploads, players, and duration limits.",
    "iconName": "Shuffle",
    "metaTitle": "Sample Video Generator | TabBench",
    "metaDescription": "Generate synthetic test video files (WebM/MP4) with customizable resolution, framerate, and duration for media player testing.",
    "keywords": [
      "sample video generator",
      "dummy video download",
      "demo video generator",
      "random video generator",
      "test video file",
      "sample mp4 test clip",
      "sample webm generator",
      "mock video clip"
    ],
    "features": [
      "1 to 10 second clips",
      "640x360 VP9 WebM",
      "Randomised animation each time",
      "Recorded locally, never uploaded"
    ],
    "faqs": [
      {
        "question": "Can I choose the exact file size?",
        "answer": "No. The browser's recorder picks its own bitrate, so you choose the duration and the size follows."
      }
    ],
    "relatedToolSlugs": [
      "sample-image-generator",
      "sample-file-generator",
      "image-compressor"
    ]
  },
  "sample-data-generator": {
    "slug": "sample-data-generator",
    "name": "Sample Data Generator (CSV & JSON)",
    "shortName": "Sample Data Generator",
    "category": "developer",
    "categoryName": "Developer & Data",
    "description": "Generate dummy CSV, JSON, and plain text files at an exact size with realistic placeholder records.",
    "longDescription": "Create test data files at any size — CSV with headers and rows, JSON arrays of records, or plain text. Useful for testing importers, parsers, and upload limits.",
    "iconName": "Code",
    "metaTitle": "Sample Data Generator | TabBench",
    "metaDescription": "Generate realistic mock CSV and JSON datasets with names, emails, addresses, and timestamps for testing databases and APIs.",
    "keywords": [
      "sample data generator",
      "dummy csv generator",
      "mock json generator",
      "demo data generator",
      "random data generator",
      "sample test data",
      "generate fake csv data",
      "mock dataset"
    ],
    "features": [
      "CSV, JSON or plain text",
      "Exact target file size",
      "Realistic placeholder records",
      "Runs entirely in your browser"
    ],
    "faqs": [
      {
        "question": "Is the data realistic?",
        "answer": "It uses plausible names, emails, cities, and amounts — enough to exercise a parser or importer."
      }
    ],
    "relatedToolSlugs": [
      "json-formatter",
      "sample-file-generator",
      "text-diff-checker"
    ]
  },
  "notepad": {
    "slug": "notepad",
    "name": "Online Notepad",
    "shortName": "Online Notepad",
    "category": "text",
    "categoryName": "Text & Writing",
    "description": "A distraction-free notepad that saves automatically to your browser. No account, no sync, no waiting.",
    "longDescription": "Jot notes, drafts, and snippets in a clean editor that autosaves to this browser as you type. Keep multiple notes, search across them, and export any note as a text file.",
    "iconName": "FileText",
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
    "isPopular": true
  },
  "text-to-speech": {
    "slug": "text-to-speech",
    "name": "Text to Speech",
    "shortName": "Text to Speech",
    "category": "text",
    "categoryName": "Text & Writing",
    "description": "Read any text aloud using your device's own voices, with adjustable speed and pitch.",
    "longDescription": "Paste text and have it read aloud using the voices installed on your device. Adjust speed and pitch, pause and resume, and proofread by ear. Nothing is sent anywhere.",
    "iconName": "Volume2",
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
    "isPopular": true
  },
  "speech-to-text": {
    "slug": "speech-to-text",
    "name": "Speech to Text",
    "shortName": "Speech to Text",
    "category": "text",
    "categoryName": "Text & Writing",
    "description": "Dictate and get a live transcript you can edit, copy, or download. Supports Hindi, Tamil, and more.",
    "longDescription": "Speak and watch words appear as you talk, with support for English, Hindi, Bengali, Tamil, Telugu and more. Edit the transcript inline, then copy or download it. Note that browsers process speech in the cloud.",
    "iconName": "Mic",
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
    "isPopular": true
  },
  "video-downloader": {
    "slug": "video-downloader",
    "name": "Video Downloader",
    "shortName": "Video Downloader",
    "category": "image-media",
    "categoryName": "Image & Media",
    "description": "Download and inspect video files from direct, authorized, or self-hosted media streams.",
    "longDescription": "Inspect technical specifications including resolution, codecs, frame rate, bitrate, and duration from direct video URLs. Download permitted MP4, WebM, and MOV streams in original or extracted audio quality with zero server retention.",
    "iconName": "Video",
    "metaTitle": "Video Downloader | TabBench",
    "metaDescription": "Inspect, analyze, and download accessible online video streams. View stream details, resolutions, and media links.",
    "keywords": [
      "video downloader",
      "download video online",
      "inspect video stream",
      "web video downloader",
      "media stream inspector",
      "download video from url",
      "save online video",
      "mp4 video downloader",
      "stream video saver"
    ],
    "features": [
      "Direct MP4, WebM & MOV stream inspection",
      "Resolution, bitrate & codec analysis",
      "Quality selection with Highest Available badge",
      "Audio-only track extraction",
      "SSRF-protected secure retrieval",
      "100% private in-browser processing"
    ],
    "formulas": [
      {
        "name": "Video Bitrate & File Size Relationship",
        "expression": "File Size (MB) = (Bitrate (kbps) × Duration (seconds)) / 8000",
        "explanation": "The total file size of a video stream is directly determined by the combined video and audio bitrates multiplied by duration.",
        "example": "A 1080p stream at 5,000 kbps lasting 120 seconds = (5000 × 120) / 8000 = 75 MB."
      }
    ],
    "faqs": [
      {
        "question": "Can I download videos from YouTube, TikTok, or Instagram?",
        "answer": "This tool strictly respects platform terms of service and copyright laws. It does not bypass DRM, paywalls, authentication, or technical platform restrictions. Only direct, authorized, or user-owned media streams are supported."
      },
      {
        "question": "Are my inspected videos stored on TabBench servers?",
        "answer": "No. Processing is performed client-side in your browser. No files, URLs, or personal data are stored or retained on any server."
      }
    ],
    "relatedToolSlugs": [
      "youtube-video-downloader",
      "instagram-video-downloader",
      "crop-image"
    ],
    "isPopular": true
  },
  "youtube-video-downloader": {
    "slug": "youtube-video-downloader",
    "name": "YouTube Video Downloader",
    "shortName": "YouTube Downloader",
    "category": "image-media",
    "categoryName": "Image & Media",
    "description": "Inspect video resolution, codecs, and download permitted YouTube streams and creative assets.",
    "longDescription": "Analyze stream dimensions, frame rate, audio codecs, and download permitted or self-hosted video streams. Adheres to platform copyright policies without DRM circumvention.",
    "iconName": "Video",
    "metaTitle": "YouTube Video Downloader | TabBench",
    "metaDescription": "Analyze YouTube video streams, preview available resolutions, inspect audio/video tracks, and extract public media details.",
    "keywords": [
      "youtube video downloader",
      "youtube downloader",
      "download youtube video",
      "inspect youtube stream",
      "youtube media inspector",
      "youtube video download online",
      "save youtube video mp4",
      "youtube resolution inspector",
      "download public youtube stream"
    ],
    "features": [
      "YouTube stream analysis",
      "Resolution & audio track detection",
      "Highest quality auto-selection",
      "100% private in-browser"
    ],
    "faqs": [
      {
        "question": "Can I download copyrighted YouTube content?",
        "answer": "No. Only permitted, creative commons, or self-owned video streams are supported in compliance with platform terms."
      }
    ],
    "relatedToolSlugs": [
      "video-downloader",
      "instagram-video-downloader",
      "tiktok-video-downloader"
    ],
    "isPopular": true
  },
  "instagram-video-downloader": {
    "slug": "instagram-video-downloader",
    "name": "Instagram Video Downloader",
    "shortName": "Instagram Downloader",
    "category": "image-media",
    "categoryName": "Image & Media",
    "description": "Download and inspect Instagram Reels, Stories, and permitted video streams.",
    "longDescription": "Inspect aspect ratio (9:16 vertical / 1:1 square), resolution, and bitrate for Instagram videos and Reels. Download permitted media with zero server storage.",
    "iconName": "Video",
    "metaTitle": "Instagram Video Downloader | TabBench",
    "metaDescription": "Inspect and download Instagram Reels, stories, and video posts. Analyze public media streams directly in your browser.",
    "keywords": [
      "instagram video downloader",
      "download instagram reel",
      "instagram video download",
      "insta media inspector",
      "instagram reels downloader",
      "save insta video",
      "download instagram story",
      "ig video saver online"
    ],
    "features": [
      "Reels & vertical video inspection",
      "Direct media retrieval",
      "Resolution & codec analysis",
      "100% client-side private"
    ],
    "faqs": [
      {
        "question": "Can I download private Instagram posts?",
        "answer": "No. Private accounts and DRM-protected streams cannot and should not be accessed without explicit authorization."
      }
    ],
    "relatedToolSlugs": [
      "video-downloader",
      "tiktok-video-downloader",
      "facebook-video-downloader"
    ],
    "isPopular": true
  },
  "facebook-video-downloader": {
    "slug": "facebook-video-downloader",
    "name": "Facebook Video Downloader",
    "shortName": "Facebook Downloader",
    "category": "image-media",
    "categoryName": "Image & Media",
    "description": "Inspect and download public, authorized Facebook video streams.",
    "longDescription": "Check video resolution, aspect ratio, audio bitrate, and download authorized Facebook streams directly in your browser.",
    "iconName": "Video",
    "metaTitle": "Facebook Video Downloader | TabBench",
    "metaDescription": "Inspect public Facebook video streams, analyze resolutions, and download accessible media links quickly.",
    "keywords": [
      "facebook video downloader",
      "download facebook video",
      "fb video download online",
      "facebook stream inspector",
      "save facebook video mp4",
      "fb watch downloader",
      "facebook reel downloader"
    ],
    "features": [
      "Facebook stream analysis",
      "HD & SD format selection",
      "Audio track extraction",
      "Zero server retention"
    ],
    "faqs": [
      {
        "question": "Can I download private Facebook group videos?",
        "answer": "No. Only public, permitted, or self-hosted video streams are supported."
      }
    ],
    "relatedToolSlugs": [
      "video-downloader",
      "youtube-video-downloader",
      "instagram-video-downloader"
    ],
    "isPopular": true
  },
  "tiktok-video-downloader": {
    "slug": "tiktok-video-downloader",
    "name": "TikTok Video Downloader",
    "shortName": "TikTok Downloader",
    "category": "image-media",
    "categoryName": "Image & Media",
    "description": "Inspect video resolution and download permitted TikTok videos and creative assets.",
    "longDescription": "Analyze 9:16 vertical video properties, duration, audio codecs, and retrieve permitted TikTok video files without watermarks or quality loss.",
    "iconName": "Video",
    "metaTitle": "TikTok Video Downloader | TabBench",
    "metaDescription": "Inspect and download public TikTok videos. Analyze media streams, audio tracks, and video properties in your browser.",
    "keywords": [
      "tiktok video downloader",
      "download tiktok video",
      "tiktok downloader no watermark info",
      "tiktok stream inspector",
      "save tiktok video mp4",
      "tiktok clip downloader",
      "tiktok 9:16 video saver"
    ],
    "features": [
      "Vertical 9:16 video analysis",
      "HD resolution detection",
      "Audio track extraction",
      "No app install required"
    ],
    "faqs": [
      {
        "question": "Are videos downloaded in original quality?",
        "answer": "Yes. When you choose the Highest Available quality, media is retrieved without generational re-encoding."
      }
    ],
    "relatedToolSlugs": [
      "video-downloader",
      "instagram-video-downloader",
      "twitter-video-downloader"
    ],
    "isPopular": true
  },
  "twitter-video-downloader": {
    "slug": "twitter-video-downloader",
    "name": "Twitter Video Downloader",
    "shortName": "Twitter Downloader",
    "category": "image-media",
    "categoryName": "Image & Media",
    "description": "Download and inspect Twitter / X videos, GIFs, and media streams.",
    "longDescription": "Inspect video bitrates, dimensions, and audio tracks for Twitter (X) video clips and animated GIFs. Save authorized files directly to your device.",
    "iconName": "Video",
    "metaTitle": "Twitter Video Downloader | TabBench",
    "metaDescription": "Inspect and download Twitter / X videos and GIFs. Analyze video bitrate, resolution, and public media streams.",
    "keywords": [
      "twitter video downloader",
      "x video downloader",
      "download twitter video",
      "twitter gif download",
      "x media inspector",
      "download x video mp4",
      "save tweet video",
      "twitter mp4 downloader"
    ],
    "features": [
      "Twitter & X media stream analysis",
      "Multiple resolution options",
      "GIF & MP4 support",
      "100% private in browser"
    ],
    "faqs": [
      {
        "question": "Can I download Twitter GIFs as MP4?",
        "answer": "Yes. Twitter delivers animated GIFs as MP4 video streams, which can be downloaded directly."
      }
    ],
    "relatedToolSlugs": [
      "video-downloader",
      "tiktok-video-downloader",
      "youtube-video-downloader"
    ],
    "isPopular": true
  },
  "video-player": {
    "slug": "video-player",
    "name": "Video Player",
    "shortName": "Video Player",
    "category": "image-media",
    "categoryName": "Image & Media",
    "description": "Play MP4, WebM, MOV and more straight from your device, with speed control, picture-in-picture and a playlist.",
    "longDescription": "Open any video your browser can decode and play it with full transport controls, adjustable speed, picture-in-picture and a multi-file playlist. Files play from disk and are never uploaded.",
    "iconName": "Film",
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
      "video-downloader",
      "image-compressor"
    ],
    "isPopular": true
  },
  "audio-player": {
    "slug": "audio-player",
    "name": "Audio Player",
    "shortName": "Audio Player",
    "category": "image-media",
    "categoryName": "Image & Media",
    "description": "Play MP3, WAV, FLAC, M4A and OGG files with a playlist and speed control, entirely in your browser.",
    "longDescription": "Open audio files from your device and play them with a queue, adjustable speed and full transport controls. Useful for reviewing recordings and lectures without installing anything.",
    "iconName": "Music",
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
    ]
  },
  "pdf-editor": {
    "slug": "pdf-editor",
    "name": "PDF Editor & Form Filler",
    "shortName": "PDF Editor",
    "category": "pdf-docs",
    "categoryName": "PDF & Documents",
    "description": "Click any text in a PDF to retype it. Fill form fields, add text or signatures, and manage pages.",
    "longDescription": "Click a word on the page and retype it — the editor finds every line of text in your PDF and lets you replace it in place, matching the original position, size and colour. Also fills real form fields, adds text, images and signatures, and reorders, rotates or deletes pages. Everything runs in your browser.",
    "iconName": "FileText",
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
    "isPopular": true
  },
  "video-cutter": {
    "slug": "video-cutter",
    "name": "Video Cutter",
    "shortName": "Video Cutter",
    "category": "image-media",
    "categoryName": "Image & Media",
    "description": "Trim a video to any start and end point without re-encoding — instant and lossless.",
    "longDescription": "Cut a clip out of any video by dragging start and end handles, then download it. The trim copies streams rather than re-encoding, so it finishes almost immediately and loses no quality.",
    "iconName": "Scissors",
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
      "video-downloader"
    ],
    "isPopular": true
  },
  "audio-remover": {
    "slug": "audio-remover",
    "name": "Remove Audio from Video",
    "shortName": "Remove Audio from Video",
    "category": "image-media",
    "categoryName": "Image & Media",
    "description": "Strip the sound from a video, or pull the audio out as a separate file — both without re-encoding.",
    "longDescription": "Mute a video by removing its audio track entirely, or extract that audio as an .m4a file. Both are stream copies, so the video keeps its exact original quality and the audio keeps its original bitrate.",
    "iconName": "VolumeX",
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
    "isPopular": true
  },
  "sip-calculator": {
    "slug": "sip-calculator",
    "name": "SIP Calculator",
    "shortName": "SIP Calculator",
    "category": "calculators",
    "categoryName": "Calculators & Finance",
    "description": "Calculate returns on your Systematic Investment Plan (SIP) with annual growth projections.",
    "longDescription": "Estimate your mutual fund SIP wealth growth, total invested amount, and compounding gains with instant interactive year-by-year projections.",
    "iconName": "Calculator",
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
    "isPopular": true
  },
  "compound-interest-calculator": {
    "slug": "compound-interest-calculator",
    "name": "Compound Interest Calculator",
    "shortName": "Compound Interest",
    "category": "calculators",
    "categoryName": "Calculators & Finance",
    "description": "Calculate compound interest with regular deposits, multiple compounding frequencies, and timeline breakdowns.",
    "longDescription": "Compute exact compound interest growth on initial deposits and optional monthly contributions across daily, monthly, quarterly, and annual compounding periods.",
    "iconName": "TrendingUp",
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
    "isPopular": true
  },
  "bmi-calculator": {
    "slug": "bmi-calculator",
    "name": "BMI Calculator",
    "shortName": "BMI Calculator",
    "category": "calculators",
    "categoryName": "Calculators & Finance",
    "description": "Calculate Body Mass Index (BMI), healthy weight range, and WHO classification for adults.",
    "longDescription": "Instant body mass index calculator supporting metric (cm/kg) and imperial (feet-inches/lbs) units with WHO classification categories and ideal weight ranges.",
    "iconName": "Scale",
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
    "isPopular": true
  },
  "lorem-ipsum-generator": {
    "slug": "lorem-ipsum-generator",
    "name": "Lorem Ipsum Generator",
    "shortName": "Lorem Ipsum",
    "category": "text",
    "categoryName": "Text & Writing",
    "description": "Generate clean placeholder Lorem Ipsum text by paragraphs, sentences, words, or lists.",
    "longDescription": "A lightweight placeholder text generator for web designers, developers, and typesetters with customizable paragraph counts, HTML tag options, and instant one-click copying.",
    "iconName": "Type",
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
    "isPopular": true
  },
  "slug-generator": {
    "slug": "slug-generator",
    "name": "URL Slug Generator",
    "shortName": "Slug Generator",
    "category": "text",
    "categoryName": "Text & Writing",
    "description": "Convert headlines and titles into clean, SEO-friendly URL slugs with customizable separators.",
    "longDescription": "Generate clean, URL-safe permalinks from any article title, product name, or headline with accent stripping, lowercase formatting, and optional stop word removal.",
    "iconName": "Link",
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
    "isPopular": true
  },
  "json-to-csv": {
    "slug": "json-to-csv",
    "name": "JSON to CSV / CSV to JSON Converter",
    "shortName": "JSON to CSV",
    "category": "developer",
    "categoryName": "Developer & Data",
    "description": "Convert JSON arrays to CSV spreadsheets and CSV tables back to JSON with live preview and download.",
    "longDescription": "Bidirectional converter between JSON API payloads and CSV tabular data. Handles custom delimiters, quoted text cells, instant copy, and file downloads 100% in your browser.",
    "iconName": "FileSpreadsheet",
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
    "isPopular": true
  },
  "regex-tester": {
    "slug": "regex-tester",
    "name": "Regex Tester & Debugger",
    "shortName": "Regex Tester",
    "category": "developer",
    "categoryName": "Developer & Data",
    "description": "Test regular expressions with real-time match highlighting, capture group breakdown, and flags.",
    "longDescription": "Interactive JavaScript regex testing utility with live multi-match highlighting, capture group inspection, syntax validation, and a quick cheat sheet reference.",
    "iconName": "Code",
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
    "isPopular": true
  },
  "html-entity-converter": {
    "slug": "html-entity-converter",
    "name": "HTML Entity Encoder / Decoder",
    "shortName": "HTML Entity Converter",
    "category": "developer",
    "categoryName": "Developer & Data",
    "description": "Escape and unescape special HTML characters with named, decimal, and hex entity options.",
    "longDescription": "Convert reserved HTML characters into safe entities and decode encoded HTML entities back to plain text with instant live conversion.",
    "iconName": "Code",
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
    "isPopular": true
  },
  "color-converter": {
    "slug": "color-converter",
    "name": "Color Converter & Palette Generator",
    "shortName": "Color Converter",
    "category": "developer",
    "categoryName": "Developer & Data",
    "description": "Convert HEX, RGB, HSL, and CMYK color codes with harmonic palette generation and WCAG contrast previews.",
    "longDescription": "Comprehensive color conversion tool for web developers and UI designers. Converts across HEX, RGB, HSL, CMYK, CSS variables, and generates harmonic color schemes.",
    "iconName": "Palette",
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
    "isPopular": true
  },
  "salary-calculator": {
    "slug": "salary-calculator",
    "name": "Salary / Take-Home Pay Calculator",
    "shortName": "Salary Calculator",
    "category": "calculators",
    "categoryName": "Calculators & Finance",
    "description": "Calculate monthly take-home salary from annual CTC with tax slabs, PF, and deduction breakdown.",
    "longDescription": "Break down annual compensation (CTC) into monthly in-hand take-home salary, basic pay, HRA, Provident Fund (PF), and estimated income tax deductions.",
    "iconName": "DollarSign",
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
    "features": [
      "Annual CTC to monthly in-hand conversion",
      "Variable bonus percentage adjustment",
      "Provident Fund (PF) and standard deductions",
      "Detailed annual salary structure breakdown"
    ],
    "formulas": [
      {
        "name": "Take-Home Salary Formula",
        "expression": "Net Monthly Salary = (Fixed Annual CTC - Total Annual Deductions) / 12",
        "explanation": "Fixed compensation minus employee PF, income tax TDS, and professional tax, divided across 12 calendar months.",
        "example": "12 LPA CTC with 10% bonus yields ~85,000 to ~88,000 monthly take-home depending on tax regime."
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
    "isPopular": true
  },
  "working-days-calculator": {
    "slug": "working-days-calculator",
    "name": "Working Days & Business Days Calculator",
    "shortName": "Working Days",
    "category": "date-time",
    "categoryName": "Date & Time",
    "description": "Calculate total business days and working hours between two dates excluding weekends and holidays.",
    "longDescription": "Accurately compute total working days between any two dates with customizable weekend days (Sat-Sun, Sun-only, Fri-Sat), public holiday exclusions, and working hours estimates.",
    "iconName": "Calendar",
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
    "isPopular": true
  },
  "unix-timestamp-converter": {
    "slug": "unix-timestamp-converter",
    "name": "Unix Timestamp & Epoch Converter",
    "shortName": "Unix Timestamp",
    "category": "date-time",
    "categoryName": "Date & Time",
    "description": "Convert Unix epoch timestamps to human-readable UTC and local dates, with live ticking epoch clock.",
    "longDescription": "Bidirectional converter between Unix timestamps (seconds and milliseconds) and formatted UTC/local date-time strings with relative duration indicators.",
    "iconName": "Clock",
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
    "isPopular": true
  },
  "json-to-typescript": {
    "slug": "json-to-typescript",
    "name": "JSON to TypeScript Generator",
    "shortName": "JSON to TypeScript",
    "category": "developer",
    "categoryName": "Developer & Data",
    "description": "Generate clean, typed TypeScript interfaces and type definitions from JSON API payloads.",
    "longDescription": "Instantly convert JSON objects and arrays into structured, nested TypeScript interfaces or type aliases with customizable root naming, optional properties, and readonly modifiers.",
    "iconName": "Code",
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
    "isPopular": true
  },
  "cron-explainer": {
    "slug": "cron-explainer",
    "name": "Cron Expression Explainer & Builder",
    "shortName": "Cron Explainer",
    "category": "developer",
    "categoryName": "Developer & Data",
    "description": "Translate complex cron expressions into plain English schedules and build cron strings interactively.",
    "longDescription": "Understand and debug 5-part cron syntax with clear English explanations, field breakdowns, and common schedule presets for cron jobs.",
    "iconName": "Clock",
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
    "isPopular": true
  },
  "utm-builder": {
    "slug": "utm-builder",
    "name": "UTM Campaign Builder & Cleaner",
    "shortName": "UTM Builder",
    "category": "business",
    "categoryName": "Business & Marketing",
    "description": "Build marketing campaign tracking URLs and clean tracking parameters from existing links.",
    "longDescription": "Generate standardized UTM campaign tracking links for Google Analytics with utm_source, utm_medium, utm_campaign, utm_term, and utm_content. Also strips trackers for clean URLs.",
    "iconName": "Link",
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
    "isPopular": true
  },
  "break-even-calculator": {
    "slug": "break-even-calculator",
    "name": "Break-Even & ROI Calculator",
    "shortName": "Break-Even Calculator",
    "category": "business",
    "categoryName": "Business & Marketing",
    "description": "Calculate break-even units, break-even revenue, contribution margin, and projected ROI %.",
    "longDescription": "Analyze business profitability by calculating the exact sales volume and revenue required to cover fixed and variable costs, plus unit contribution margins.",
    "iconName": "TrendingUp",
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
    "isPopular": true
  },
  "contrast-checker": {
    "slug": "contrast-checker",
    "name": "WCAG Contrast Checker & Blindness Simulator",
    "shortName": "Contrast Checker",
    "category": "developer",
    "categoryName": "Developer & Data",
    "description": "Test color contrast against WCAG 2.1 AA/AAA standards with real-time color blindness simulations.",
    "longDescription": "Ensure website accessibility by measuring exact luminance contrast ratios between text and background colors with WCAG 2.1 AA and AAA pass/fail ratings and color vision deficiency filters.",
    "iconName": "Eye",
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
    "isPopular": true
  },
  "aspect-ratio-calculator": {
    "slug": "aspect-ratio-calculator",
    "name": "Aspect Ratio Calculator & Resizer",
    "shortName": "Aspect Ratio Calculator",
    "category": "image-media",
    "categoryName": "Image & Media",
    "description": "Calculate aspect ratios, proportional dimensions, and social media image presets.",
    "longDescription": "Find simplified aspect ratios (16:9, 4:3, 1:1, 9:16) from pixel dimensions and automatically calculate proportional width or height during media resizing.",
    "iconName": "Monitor",
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
    "isPopular": true
  },
  "exif-viewer": {
    "slug": "exif-viewer",
    "name": "EXIF & Image Metadata Viewer",
    "shortName": "EXIF Viewer",
    "category": "image-media",
    "categoryName": "Image & Media",
    "description": "Inspect camera EXIF data, dimensions, ISO, and file metadata completely in your browser.",
    "longDescription": "View embedded photo metadata including camera model, dimensions, file size, modification dates, and color profiles without uploading files to any server.",
    "iconName": "Camera",
    "metaTitle": "EXIF & Image Metadata Viewer | TabBench",
    "metaDescription": "Inspect photo EXIF metadata, camera info, dimensions, and file specs. 100% private client-side image analyzer.",
    "keywords": [
      "exif viewer",
      "image metadata viewer",
      "photo exif reader",
      "read exif online",
      "camera metadata inspector",
      "view photo info"
    ],
    "features": [
      "File size, format, and exact dimensions",
      "Modification timestamp diagnostics",
      "100% client-side privacy",
      "Photo preview container"
    ],
    "faqs": [
      {
        "question": "Are my photos uploaded to a server to read EXIF?",
        "answer": "No. The inspection runs entirely in your browser's local memory using FileReader API. Your images never leave your device."
      }
    ],
    "relatedToolSlugs": [
      "aspect-ratio-calculator",
      "image-resizer",
      "image-compressor"
    ],
    "isPopular": true
  },
  "markdown-table-generator": {
    "slug": "markdown-table-generator",
    "name": "Markdown Table Generator",
    "shortName": "Markdown Table Generator",
    "category": "developer",
    "categoryName": "Developer & Data",
    "description": "Create and edit Markdown tables in a visual spreadsheet grid with column alignment and HTML export.",
    "longDescription": "Visual spreadsheet editor to build, customize, and export GitHub Flavored Markdown and HTML tables with cell alignment controls and row/column management.",
    "iconName": "Table",
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
    "features": [
      "Interactive visual spreadsheet grid",
      "Column alignment controls (Left, Center, Right)",
      "Simultaneous Markdown and HTML code outputs",
      "One-click copy to clipboard"
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
    "isPopular": true
  },
  "ai-text-summarizer": {
    "slug": "ai-text-summarizer",
    "name": "AI Text Summarizer",
    "shortName": "AI Summarizer",
    "category": "ai-tools",
    "categoryName": "AI-Powered Tools",
    "description": "Summarize long articles, essays, reports, and documents into key takeaways with instant local processing.",
    "longDescription": "Free online AI text summarizer that reduces lengthy text into concise summaries and structured bullet points. Runs privately in your browser with zero mandatory signups.",
    "iconName": "Sparkles",
    "metaTitle": "AI Text Summarizer | TabBench",
    "metaDescription": "Summarize long articles, essays, and documents into concise summaries and key bullet points. 100% private in-browser AI processing.",
    "keywords": [
      "ai text summarizer",
      "summarize text online",
      "free article summarizer",
      "document summarizer",
      "ai summary generator",
      "text condensation",
      "key points extractor"
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
        "answer": "By default, On-Device AI runs entirely within your browser memory. Text is never sent to external servers."
      },
      {
        "question": "Is there a limit on text length?",
        "answer": "You can summarize articles up to 4,000 characters per run for optimal in-browser performance."
      }
    ],
    "relatedToolSlugs": [
      "ai-text-rewriter",
      "ai-text-simplifier",
      "ai-keyword-extractor",
      "word-counter"
    ],
    "isPopular": true
  },
  "ai-text-rewriter": {
    "slug": "ai-text-rewriter",
    "name": "AI Text Rewriter",
    "shortName": "AI Rewriter",
    "category": "ai-tools",
    "categoryName": "AI-Powered Tools",
    "description": "Rewrite text in professional, friendly, concise, formal, or casual tones while preserving core meaning.",
    "longDescription": "Intelligent in-browser text rewriter and paraphrasing tool that transforms tone, polishes vocabulary, and enhances clarity with zero server costs.",
    "iconName": "Sparkles",
    "metaTitle": "AI Text Rewriter | TabBench",
    "metaDescription": "Rewrite emails, essays, and text in professional, friendly, concise, or formal tones. Private client-side paraphrasing tool.",
    "keywords": [
      "ai text rewriter",
      "paraphrasing tool online",
      "rewrite email professional",
      "sentence rewriter free",
      "tone changer",
      "ai paraphraser"
    ],
    "features": [
      "6 Tone styles (Professional, Friendly, Concise, Formal, Casual, Simple)",
      "Preserves facts, dates, and numbers",
      "One-click copy and text download",
      "Instant private processing"
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
    "isPopular": true
  },
  "ai-text-simplifier": {
    "slug": "ai-text-simplifier",
    "name": "AI Text Simplifier",
    "shortName": "AI Simplifier",
    "category": "ai-tools",
    "categoryName": "AI-Powered Tools",
    "description": "Translate complex jargon, legalese, and dense academic text into plain, clear 8th-grade English.",
    "longDescription": "Transform convoluted writing into clear, accessible plain English with Flesch-Kincaid readability scoring and jargon reduction.",
    "iconName": "Sparkles",
    "metaTitle": "AI Text Simplifier | TabBench",
    "metaDescription": "Simplify legal, academic, and complex technical text into plain English. Free in-browser readability tool with instant jargon replacement.",
    "keywords": [
      "ai text simplifier",
      "plain english translator",
      "simplify legalese online",
      "reading level improver",
      "jargon replacer",
      "clear writing tool"
    ],
    "features": [
      "Automated complex jargon replacement",
      "Flesch-Kincaid readability index",
      "Passive voice and convoluted phrase reduction",
      "Zero signup required"
    ],
    "faqs": [
      {
        "question": "What reading level does this target?",
        "answer": "It targets an accessible 8th-grade plain-English reading standard suitable for general audiences."
      }
    ],
    "relatedToolSlugs": [
      "ai-text-rewriter",
      "ai-text-summarizer",
      "word-counter"
    ]
  },
  "ai-keyword-extractor": {
    "slug": "ai-keyword-extractor",
    "name": "AI Keyword Extractor",
    "shortName": "Keyword Extractor",
    "category": "ai-tools",
    "categoryName": "AI-Powered Tools",
    "description": "Extract ranked keywords, search tags, and multi-word key phrases from articles and text.",
    "longDescription": "Analyze text to extract high-relevance search keywords, tags, and n-gram phrases for SEO, indexing, and content research.",
    "iconName": "Sparkles",
    "metaTitle": "AI Keyword Extractor | TabBench",
    "metaDescription": "Extract primary keywords, secondary tags, and key phrases from text in your browser. Free client-side SEO utility.",
    "keywords": [
      "ai keyword extractor",
      "extract keywords from text",
      "seo keyword tag generator",
      "keyphrase extraction tool",
      "content tag finder",
      "n-gram extractor"
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
    ]
  },
  "ai-json-explainer": {
    "slug": "ai-json-explainer",
    "name": "AI JSON Explainer",
    "shortName": "JSON Explainer",
    "category": "ai-tools",
    "categoryName": "AI-Powered Tools",
    "description": "Analyze and explain JSON payloads, nested schemas, data structures, and potential security issues.",
    "longDescription": "Demystify complex API responses and JSON documents with deterministic schema visualization, field explanations, and architectural insights.",
    "iconName": "Sparkles",
    "metaTitle": "AI JSON Explainer | TabBench",
    "metaDescription": "Explain JSON structures, object hierarchies, data types, and security insights in plain English. Fast, private in-browser analysis.",
    "keywords": [
      "ai json explainer",
      "explain json payload",
      "json schema explainer",
      "api response analyzer",
      "json structure viewer",
      "understand json format"
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
    ]
  }
};

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
  return Object.values(TOOLS_REGISTRY).filter((tool) => tool.isPopular);
}

export function getRelatedTools(tool: ToolDefinition): ToolDefinition[] {
  return tool.relatedToolSlugs
    .map((slug) => TOOLS_REGISTRY[slug])
    .filter((t): t is ToolDefinition => !!t);
}
