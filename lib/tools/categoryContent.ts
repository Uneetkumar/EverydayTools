/**
 * Editorial copy for the category landing pages. Without this these pages
 * would be bare link lists, which is the definition of a thin doorway page —
 * exactly the pattern Google demotes on tool sites.
 */
export interface CategoryContent {
  /** Used as the page <h1>. Targets the head term for the category. */
  heading: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  /** Two to three paragraphs rendered under the heading. */
  body: string[];
  /** Category-level FAQs, rendered below the tool grid. */
  faqs: { question: string; answer: string }[];
}

export const CATEGORY_CONTENT: Record<string, CategoryContent> = {
  calculators: {
    heading: "Free online calculators for finance and everyday maths",
    metaTitle: "Free Online Calculators - EMI, GST, Percentage",
    metaDescription:
      "Free browser calculators for percentages, loan EMI, GST, and discounts. Instant results with the formula shown, no signup required.",
    keywords: [
      "online calculator",
      "percentage calculator",
      "emi calculator",
      "gst calculator",
      "discount calculator",
      "free financial calculator",
    ],
    body: [
      "Most everyday financial maths goes wrong in predictable ways: subtracting a percentage from a tax-inclusive total, adding two discounts together, or comparing loans by monthly instalment rather than total interest. Each calculator here shows the formula alongside the result, so you can check the reasoning rather than take the number on trust.",
      "Every calculation runs in your browser. Nothing you enter — salary figures, loan amounts, invoice values — is transmitted or stored anywhere, which is worth knowing given how much personal financial information typical online calculators collect.",
    ],
    faqs: [
      {
        question:
          "Are these calculators free to use?",
        answer:
          "Yes, entirely. There is no signup, no usage limit, and no paid tier. The calculations run in your browser, so there is no server cost to recover.",
      },
      {
        question:
          "Why do my results differ from another calculator?",
        answer:
          "Almost always because of a different convention rather than an arithmetic error — whether a percentage is applied before or after tax, whether a period is counted inclusively, or how rounding is handled. Each calculator here shows its formula so you can see exactly which convention is in use.",
      },
      {
        question:
          "Is my financial data stored?",
        answer:
          "No. Every figure you enter stays in your browser's memory and is discarded when you close the tab. Nothing is transmitted, logged, or associated with you.",
      },
    ],
  },
  "date-time": {
    heading: "Date and time calculators",
    metaTitle: "Date Calculators - Age & Days Between Dates",
    metaDescription:
      "Calculate exact age, the number of days between two dates, and working-day counts. Handles leap years correctly, free and private.",
    keywords: [
      "date calculator",
      "age calculator",
      "days between dates",
      "business days calculator",
      "date difference",
    ],
    body: [
      "Date arithmetic is deceptively hard by hand — months vary between 28 and 31 days, leap years add a day every four years, and 'ten days from Monday' means different things depending on whether the count is inclusive. These calculators use real calendar arithmetic rather than a fixed 365-day year, so long spans do not drift.",
      "Both calendar days and working days are reported where relevant, since contracts, notice periods, and project plans usually mean the latter even when they say the former.",
    ],
    faqs: [
      {
        question:
          "Do these calculators handle leap years?",
        answer:
          "Yes. They use real calendar arithmetic rather than a fixed 365-day year, so every 29 February in the range is counted. Estimating with 365 days per year drifts by roughly one day every four years.",
      },
      {
        question:
          "Does the day count include both the start and end date?",
        answer:
          "The difference is exclusive by default — 1 March to 8 March is 7 days. Many contracts count both endpoints, in which case add one. Which convention applies depends on your document, not on the arithmetic.",
      },
      {
        question:
          "Are public holidays excluded from business-day counts?",
        answer:
          "No, only weekends. Public holidays vary by country, state, and sometimes industry, so subtract those separately using your own calendar.",
      },
    ],
  },
  text: {
    heading: "Text and writing tools",
    metaTitle: "Free Text Tools - Word Counter & Case Converter",
    metaDescription:
      "Count words and characters, convert text case, and compare two versions of a document. Runs in your browser, safe for unpublished drafts.",
    keywords: [
      "word counter",
      "character counter",
      "case converter",
      "text diff checker",
      "compare text online",
    ],
    body: [
      "Writing tools that send your draft to a server are a poor fit for anything unpublished, confidential, or under embargo. These run entirely in the browser, so an unreleased press release or a manuscript under review never leaves your machine.",
      "The counters distinguish between the metrics that different systems actually measure — characters with and without spaces, words, sentences, and reading time — because a 160-character meta description limit and a 500-word essay limit are not measured the same way.",
    ],
    faqs: [
      {
        question:
          "Is my text sent to a server?",
        answer:
          "No. Every text tool here processes input in your browser. Nothing is uploaded, which makes these safe for unpublished drafts, embargoed material, and confidential documents.",
      },
      {
        question:
          "How many words is a typical page?",
        answer:
          "About 500 words single-spaced or 250 double-spaced, in 12pt with one-inch margins. Font and spacing change this substantially, so treat it as an estimate.",
      },
      {
        question:
          "Why does the word count differ from Microsoft Word?",
        answer:
          "Different tools treat hyphenated compounds, numbers, and symbols differently. 'State-of-the-art' is one word under most style guides and four under some processors. Differences of a percent or two are normal.",
      },
    ],
  },
  developer: {
    heading: "Developer and data tools",
    metaTitle: "Free Developer Tools - JSON, Base64, JWT",
    metaDescription:
      "Format JSON, decode JWTs, convert Base64, generate UUIDs, and encode URLs. Everything runs locally, so tokens and payloads stay private.",
    keywords: [
      "developer tools online",
      "json formatter",
      "jwt decoder",
      "base64 converter",
      "uuid generator",
      "url encoder",
    ],
    body: [
      "Debugging usually means pasting something sensitive into a tool — an API response with customer records, an auth header, a production token. Doing that on a site that posts the data to its own backend is a real risk, and one that has caused genuine incidents. Every tool in this category processes input in your browser and makes no network request with it.",
      "These cover the routine tasks that come up constantly in day-to-day work: making an unreadable JSON payload legible, checking why a token is being rejected, encoding a URL that keeps breaking, or generating identifiers for test fixtures.",
    ],
    faqs: [
      {
        question:
          "Is it safe to paste tokens and API responses here?",
        answer:
          "The processing itself is safe — everything runs in your browser and nothing is transmitted. Still treat any live credential as a credential: avoid pasting production tokens into tools generally, and revoke anything you suspect has been exposed.",
      },
      {
        question:
          "Do these tools work offline?",
        answer:
          "Once a page has loaded, the tools run without further network access, since all processing is local. The page itself still needs to load first.",
      },
      {
        question:
          "Why use these instead of a command-line tool?",
        answer:
          "For quick one-off checks there is nothing to install, and the output is formatted for reading rather than piping. For anything scripted or repeated, a command-line tool is the better choice.",
      },
    ],
  },
  "image-media": {
    heading: "Image tools and converters",
    metaTitle: "Free Image Tools - Compress, Convert & Crop",
    metaDescription:
      "Compress images to 50KB or 100KB, convert PNG to JPG, crop to any ratio, and generate QR codes. No upload, no watermark, no signup.",
    keywords: [
      "image compressor",
      "compress image to 50kb",
      "png to jpg converter",
      "crop image online",
      "qr code generator",
    ],
    body: [
      "Image tools are the category where uploading matters most, because the files involved are so often personal — passport photographs for a visa application, a signature scan, a photo of a document. These tools use the browser's own canvas and image APIs, so the file is read from disk into your tab and never sent anywhere.",
      "That also makes them fast. There is no upload wait and no download wait: compressing a 4 MB photograph to under 100 KB happens in the time it takes the preview to redraw.",
    ],
    faqs: [
      {
        question:
          "Are my images uploaded anywhere?",
        answer:
          "No. Images are read from disk into your browser tab and processed with the canvas API. Nothing is transmitted, which matters for the identity documents and personal photographs these tools are most often used on.",
      },
      {
        question:
          "Will compressing an image make it look worse?",
        answer:
          "At moderate settings the difference is imperceptible in photographs. Screenshots, diagrams, and anything with sharp text show artefacts much sooner — keep those as PNG.",
      },
      {
        question:
          "Is there a file size limit?",
        answer:
          "The practical limit is your device's memory, since the whole image is held in the tab. Ordinary photographs of any size from a phone or camera are handled without difficulty.",
      },
    ],
  },
  "pdf-docs": {
    heading: "PDF and document tools",
    metaTitle: "Free PDF Tools - Merge, Compress & Convert",
    metaDescription:
      "Merge PDFs, compress large files, remove passwords, convert images to PDF, and export to Word. Processed in your browser, never uploaded.",
    keywords: [
      "free pdf tools",
      "merge pdf",
      "compress pdf",
      "pdf to word",
      "unlock pdf",
      "image to pdf",
    ],
    body: [
      "PDFs are the format people use for exactly the documents they should be most careful with: contracts, bank statements, medical records, identity papers. Mainstream PDF services upload every one of those to a server, process them there, and rely on a retention policy to delete them afterwards.",
      "These tools use pdf-lib and pdf.js inside your browser instead. The document is parsed, modified, and written back to your downloads folder without a single byte being transmitted — which means there is no retention policy to rely on in the first place.",
    ],
    faqs: [
      {
        question:
          "Are my PDFs uploaded to a server?",
        answer:
          "No. Every PDF tool here uses pdf-lib or pdf.js inside your browser. The document is parsed and rewritten locally and the result is written straight to your downloads folder, so there is no retention policy to rely on.",
      },
      {
        question:
          "Can I edit a scanned PDF?",
        answer:
          "Only in limited ways. A scan is a photograph of a page with no text layer, so text cannot be extracted or edited without optical character recognition, which is a separate process.",
      },
      {
        question:
          "Why is my PDF so large?",
        answer:
          "Almost always because it contains high-resolution images — a scan at 600 DPI is many times larger than one at 200 DPI, with no visible benefit on screen. Compressing typically removes 60–80% for scanned documents.",
      },
    ],
  },
  security: {
    heading: "Security tools and generators",
    metaTitle: "Free Security Tools - Password & Hash Generator",
    metaDescription:
      "Generate cryptographically secure passwords and compute MD5, SHA-1, SHA-256, and SHA-512 hashes. Generated locally and never transmitted.",
    keywords: [
      "password generator",
      "strong password generator",
      "hash generator",
      "sha256 generator",
      "md5 hash",
    ],
    body: [
      "A password generated by a website that then transmits it is not a secure password, whatever the site says about its logging. These tools use the Web Crypto API in your browser — crypto.getRandomValues() for randomness and SubtleCrypto for hashing — so the output exists only in your tab.",
      "That distinction matters more than it sounds. Cryptographically secure randomness is what makes a generated password unpredictable, and it is not what Math.random() provides, despite how many generators rely on it.",
    ],
    faqs: [
      {
        question:
          "Are generated passwords ever transmitted?",
        answer:
          "No. Generation uses the Web Crypto API in your browser, and the result exists only in your tab's memory and clipboard. Nothing is sent, logged, or stored.",
      },
      {
        question:
          "Can a hash be reversed?",
        answer:
          "No. Hashing is one-way by design and discards information. Services advertising 'hash decryption' are looking the digest up in a table of common inputs, which works for weak passwords and not for arbitrary data.",
      },
      {
        question:
          "Should I hash passwords with SHA-256?",
        answer:
          "No. Fast hashes are the wrong tool for password storage precisely because they are fast. Use a deliberately slow, salted algorithm such as bcrypt, scrypt, or Argon2.",
      },
    ],
  },
  business: {
    heading: "Business and margin calculators",
    metaTitle: "Business Calculators - Profit Margin & Markup",
    metaDescription:
      "Calculate profit margin, markup, and the selling price needed to hit a target margin. Shows both figures side by side to avoid the usual mix-up.",
    keywords: [
      "profit margin calculator",
      "markup calculator",
      "margin vs markup",
      "selling price calculator",
      "gross margin",
    ],
    body: [
      "Margin and markup are computed from the same two numbers against different denominators, and confusing them is one of the most common and most expensive pricing errors there is. A 50% markup is a 33.3% margin — price a range on the wrong one and you under-earn on every unit.",
      "These calculators show margin and markup together, and work backwards from a target margin to the price you need to charge, which is the direction pricing decisions actually run.",
    ],
    faqs: [
      {
        question:
          "What is the difference between margin and markup?",
        answer:
          "Margin divides profit by the selling price; markup divides it by the cost. An item costing 100 and selling for 150 has a 50% markup but a 33.3% margin. Confusing the two is a common and expensive pricing error.",
      },
      {
        question:
          "How do I price for a target margin?",
        answer:
          "Divide the cost by (1 − target margin). For a 40% margin on a cost of 60, that is 60 ÷ 0.6 = 100. Adding 40% to the cost gives 84, which yields only a 28.6% margin.",
      },
      {
        question:
          "What is a good profit margin?",
        answer:
          "It is entirely sector-dependent — grocery retail runs on low single digits, software often exceeds 80% gross. Compare against your own sector and your own trend rather than a universal benchmark.",
      },
    ],
  },
  "ai-tools": {
    heading: "AI-powered explainers",
    metaTitle: "AI Formula Explainer - Maths, Finance & Regex",
    metaDescription:
      "Get plain-English explanations of formulas, financial metrics, and regular expressions, with worked examples you can follow.",
    keywords: [
      "ai formula explainer",
      "explain math formula",
      "explain regex",
      "financial formula explained",
    ],
    body: [
      "Formulas are compact notation that assumes you already understand the concept, which is unhelpful precisely when you do not. These explainers break an expression into its parts and explain why it is built that way, with a worked example using real numbers.",
      "Understanding why a margin calculation divides by price rather than cost is what stops the mistake recurring. Memorising the formula generally does not.",
    ],
    faqs: [
      {
        question:
          "Can I rely on these explanations for financial decisions?",
        answer:
          "No. They are an educational aid explaining how a calculation works. They do not know your circumstances, jurisdiction, or tax position and are not a substitute for a qualified professional.",
      },
      {
        question:
          "What can the explainer cover?",
        answer:
          "Mathematical and financial formulas, business metrics such as margin and break-even, regular expression patterns, data-format syntax, and the calculations behind the other tools on this site.",
      },
      {
        question:
          "How is this different from searching for the formula?",
        answer:
          "A search returns the formula; this returns the reasoning behind it. Understanding why a margin calculation divides by price is what prevents the mistake recurring.",
      },
    ],
  },
};

export function getCategoryContent(id: string): CategoryContent | undefined {
  return CATEGORY_CONTENT[id];
}
