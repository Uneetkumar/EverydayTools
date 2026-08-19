/**
 * Long-tail guide pages.
 *
 * These target the specific, low-competition queries this site can realistically
 * rank for — "compress image to 50kb for form" rather than "image compressor",
 * which is owned by domains with a decade of authority. Each guide answers one
 * concrete question end to end and links to the tool that does the job.
 *
 * Every guide must carry genuinely distinct advice. Three near-identical pages
 * differing only in a KB number would be the doorway pattern Google demotes,
 * so the size-target guides differ by the context they serve: exam portals,
 * bank KYC, and signature fields all have different constraints.
 */
export interface GuideStep {
  title: string;
  body: string;
}

export interface Guide {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  /** Tool this guide sends the reader to. */
  toolSlug: string;
  toolLabel: string;
  /** Opening context, 2 paragraphs. */
  intro: string[];
  steps: GuideStep[];
  /** Practical notes rendered as a bullet list. */
  notes: string[];
  faqs: { question: string; answer: string }[];
  /** ISO date. Bump when the guide is meaningfully revised. */
  updated: string;
}

/** Reverse lookup: which guides are relevant to a given tool page. */
export function getGuidesForTool(slug: string): Guide[] {
  return GUIDES.filter((g) => g.toolSlug === slug);
}

export const GUIDES: Guide[] = [
  {
    slug: "compress-image-to-50kb",
    title: "How to compress an image to 50KB",
    metaTitle: "Compress Image to 50KB Online - Free & Instant",
    metaDescription:
      "Get any photo under 50KB for exam and government form uploads, without the image becoming unreadable. Free, runs in your browser.",
    keywords: [
      "compress image to 50kb", "reduce image size to 50kb", "photo 50kb",
      "image compress 50kb online", "50kb photo for form",
    ],
    toolSlug: "image-compressor",
    toolLabel: "Image Compressor",
    updated: "2026-08-19",
    intro: [
      "A 50KB limit is one of the tightest you will meet online, and it is the standard on Indian exam portals — SSC, UPSC, IBPS, railway and state recruitment boards all cap photographs at or near it. A photo straight from a phone camera is typically 3–5MB, so you need roughly a 99% reduction.",
      "The instinct is to crank compression quality down until the file fits. That is the wrong lever and it produces the blocky, smeared photograph that portals reject on review. The right approach is to cut the pixel dimensions first, because a photo only needs to be as large as the box it will be displayed in.",
    ],
    steps: [
      {
        title: "Check the portal's dimension requirement first",
        body:
          "Most forms specify pixels as well as kilobytes — commonly 200×230 or 300×350 for a photograph. If yours does, resize to exactly that before compressing. Hitting 50KB at 300×350 is easy; hitting it at 3000×4000 means destroying the image.",
      },
      {
        title: "Crop to the required framing",
        body:
          "Passport-style photographs want head and shoulders filling most of the frame. Cropping away background before compressing means every remaining pixel is spent on the part that matters, which is free quality.",
      },
      {
        title: "Resize to the target dimensions",
        body:
          "Reducing a 3000px-wide photo to 300px removes 99% of its pixels. That single step usually gets you close to 50KB before any quality compression is applied at all.",
      },
      {
        title: "Set 50KB as the target size",
        body:
          "Use the target-size mode rather than guessing at a quality percentage. The tool searches for the highest quality that still fits, so you get the best possible image at that budget rather than an arbitrary one.",
      },
      {
        title: "Check the result at full size before uploading",
        body:
          "Open the compressed file and look at the face at 100%. If features have gone blocky, your dimensions are still too large for the byte budget — go smaller on pixels and let the quality setting rise.",
      },
    ],
    notes: [
      "JPEG is nearly always the right format here. A PNG photograph at 50KB will look far worse, because PNG cannot discard detail the way JPEG can.",
      "If the portal also caps dimensions, satisfy those first — a file that is under 50KB but the wrong size is still rejected.",
      "Scanned signatures usually have a separate, smaller limit, often 10–20KB. Compress those separately rather than to the same target.",
      "Keep the original photograph. Compression is one-way, and you will likely need a larger version for another form.",
    ],
    faqs: [
      {
        question: "Why does my photo look blurry at 50KB?",
        answer:
          "Almost always because the pixel dimensions are still too large. At 3000×4000, fitting 50KB means roughly one byte for every 240 pixels, which no encoder can do cleanly. Resize to the dimensions the form asks for — typically around 300×350 — and the same 50KB becomes generous.",
      },
      {
        question: "What is the smallest a passport photo can go?",
        answer:
          "A 200×230 JPEG at moderate quality lands around 15–25KB and remains perfectly legible. Below roughly 10KB, facial detail degrades enough that a reviewer may reject it, so treat 50KB as comfortable rather than tight.",
      },
      {
        question: "Is my photo uploaded to compress it?",
        answer:
          "No. Compression runs on a canvas in your browser and the file never leaves your device — which matters, because these photographs are usually attached to identity documents.",
      },
    ],
  },
  {
    slug: "compress-image-to-100kb",
    title: "How to compress an image to 100KB",
    metaTitle: "Compress Image to 100KB Online - Free & Instant",
    metaDescription:
      "Reduce any photo to under 100KB for KYC, bank, and visa uploads while keeping it clearly legible. Free and fully private.",
    keywords: [
      "compress image to 100kb", "reduce image size to 100kb", "100kb photo",
      "image compressor 100kb", "kyc photo size",
    ],
    toolSlug: "image-compressor",
    toolLabel: "Image Compressor",
    updated: "2026-08-19",
    intro: [
      "100KB is the common ceiling for bank KYC, visa applications, and university admissions — noticeably more generous than the 50KB exam portals demand. At this budget you can keep a genuinely sharp image, so the goal shifts from survival to quality.",
      "The extra headroom means you can afford larger dimensions. Where a 50KB target forces you down to around 300px, 100KB comfortably supports 600–800px, which is the difference between a photograph that merely passes and one that looks professional when a reviewer opens it.",
    ],
    steps: [
      {
        title: "Aim for 600–800 pixels on the long edge",
        body:
          "This is the sweet spot for a 100KB budget. It is large enough to look sharp on a modern screen and small enough that the encoder is not fighting for every byte.",
      },
      {
        title: "Crop before resizing",
        body:
          "Removing irrelevant background first means the pixels you keep are spent on the subject. For a document scan, cropping away the desk around it often halves the file on its own.",
      },
      {
        title: "Target 100KB directly",
        body:
          "Set the size target and let the tool find the quality level that fits. At 600–800px this typically lands at quality 80–90, which is visually indistinguishable from the original.",
      },
      {
        title: "Verify text is still readable",
        body:
          "For scanned documents rather than portraits, zoom to 100% and check the smallest text. If it has softened, reduce dimensions slightly and re-run — legibility matters more than resolution for a document.",
      },
    ],
    notes: [
      "For scans of text-heavy documents, consider whether a PDF is accepted instead — it is often both smaller and clearer than a JPEG.",
      "KYC portals frequently accept 100KB for the photograph but far less for the signature. Read both limits before starting.",
      "If the file must also be a specific aspect ratio, crop to that ratio before resizing so nothing gets stretched.",
    ],
    faqs: [
      {
        question: "Is 100KB enough for a clear document scan?",
        answer:
          "Yes for a single page, if you resize sensibly. A page scanned at 800–1000px on the long edge and compressed to 100KB stays readable. Where 100KB fails is multi-page or very dense text, in which case a PDF is the better container.",
      },
      {
        question: "Should I use JPEG or PNG for a 100KB target?",
        answer:
          "JPEG for photographs and scans of printed pages. PNG only for screenshots, line art, or images with sharp text edges — and be aware that a photographic PNG will not reach 100KB at any usable size.",
      },
      {
        question: "How much quality do I actually lose?",
        answer:
          "At 600–800px and quality 80–90, effectively none that is visible at normal viewing size. The loss becomes noticeable below about quality 60, which a 100KB target rarely forces at these dimensions.",
      },
    ],
  },
  {
    slug: "compress-image-to-20kb",
    title: "How to compress an image or signature to 20KB",
    metaTitle: "Compress Image to 20KB - Signature & Photo Uploads",
    metaDescription:
      "Get a scanned signature or small photo under 20KB for form uploads without it becoming illegible. Free browser tool, no signup.",
    keywords: [
      "compress image to 20kb", "signature 20kb", "reduce signature size",
      "scanned signature size", "10kb signature upload",
    ],
    toolSlug: "image-compressor",
    toolLabel: "Image Compressor",
    updated: "2026-08-19",
    intro: [
      "A 20KB limit almost always means a signature field rather than a photograph. Exam and banking portals typically ask for a signature between 10KB and 20KB, often at around 140×60 pixels, and they reject anything larger without explanation.",
      "Signatures compress very differently from photographs. A signature is dark strokes on white — mostly flat area with sharp edges — which is the worst case for JPEG and the best case for aggressive resizing. Handling it like a photograph is why people end up with a grey, smudged scrawl.",
    ],
    steps: [
      {
        title: "Crop tight to the signature itself",
        body:
          "Remove all the surrounding paper. A signature occupying 90% of the frame at 140×60 is far clearer than one floating in a scan of a whole sheet, and dramatically smaller.",
      },
      {
        title: "Increase contrast before compressing if the scan is grey",
        body:
          "A phone photo of a signature often has a grey cast. Pushing it toward true black on true white both improves legibility and compresses better, because flat white areas cost almost nothing to store.",
      },
      {
        title: "Resize to the portal's stated dimensions",
        body:
          "Commonly 140×60. At that size, hitting 20KB requires almost no quality compression at all — the resize does essentially all the work.",
      },
      {
        title: "Target 20KB and check the strokes",
        body:
          "Look for broken or faded strokes at 100%. If they appear, the dimensions are fine but the quality floor is too low — usually a sign the image is still larger than it needs to be.",
      },
    ],
    notes: [
      "Sign on plain white unlined paper in black or dark blue ink. Lined paper adds detail that wastes your byte budget and confuses reviewers.",
      "Scan or photograph straight on. A skewed signature often fails automated checks even when it is under the size limit.",
      "If the portal offers a 10KB limit, the same approach works — go to 120×50 rather than compressing harder.",
    ],
    faqs: [
      {
        question: "Why does my signature look faded after compressing?",
        answer:
          "JPEG smooths sharp edges, and a signature is nothing but sharp edges. Fix it by resizing rather than compressing harder, and by increasing contrast first so the strokes are genuinely black rather than dark grey.",
      },
      {
        question: "What dimensions should a signature be?",
        answer:
          "Check your portal, but 140×60 pixels is the most common requirement on Indian exam and banking forms. Some accept up to 300×80. The stated dimensions almost always matter as much as the file size.",
      },
      {
        question: "Can I use PNG for a signature?",
        answer:
          "If the portal accepts it, yes — PNG handles sharp black-on-white strokes better than JPEG and can be very small for this kind of image. Many portals only accept JPEG, so check first.",
      },
    ],
  },
  {
    slug: "compress-pdf-to-100kb",
    title: "How to compress a PDF to 100KB",
    metaTitle: "Compress PDF to 100KB Online Free - No Upload",
    metaDescription:
      "Reduce a PDF under 100KB for portal uploads while keeping it readable. Runs in your browser, so documents are never uploaded.",
    keywords: [
      "compress pdf to 100kb", "reduce pdf size", "pdf 100kb online",
      "shrink pdf for upload", "pdf size reducer",
    ],
    toolSlug: "split-pdf",
    toolLabel: "Split PDF tool",
    updated: "2026-08-19",
    intro: [
      "Government and university portals routinely cap PDF uploads at 100KB, 200KB, or 2MB, and a scanned document sails past all three. A ten-page scan at 300 DPI is commonly 15–40MB, so this is not a small adjustment.",
      "Understanding why the file is large tells you how to shrink it. In almost every case the answer is images: a scanned PDF is a stack of photographs, and the text you see is pixels rather than characters. Compressing the images is therefore the whole job, and text-only PDFs exported from Word barely shrink because there is nothing image-shaped to remove.",
    ],
    steps: [
      {
        title: "Work out whether your PDF is a scan",
        body:
          "Try to select text in a PDF reader. If you can, it is a text PDF and already small — anything large about it is embedded images or fonts. If you cannot, it is a scan, and image compression will make a large difference.",
      },
      {
        title: "Remove pages you do not need to submit",
        body:
          "If the form asks for one page of a statement, split that page out first. Nothing shrinks a document like not including it.",
      },
      {
        title: "Rescan or re-export at a lower resolution",
        body:
          "This is the step that actually works, and it is worth being blunt: no browser-based tool re-encodes the images inside a PDF. Rescanning at 150–200 DPI instead of 600 cuts the data roughly sixteen-fold with no visible loss on screen or in ordinary print.",
      },
      {
        title: "If you cannot rescan, use a desktop tool",
        body:
          "For a scan you only have as a finished PDF, genuine image re-encoding needs something like Ghostscript on your own machine. That is an honest limitation of doing this in a browser tab.",
      },
      {
        title: "Confirm the smallest text is still readable",
        body:
          "Zoom to 100% and read the finest print on the page. A file that meets the limit but cannot be read will be rejected on review, which costs more time than starting again.",
      },
    ],
    notes: [
      "100KB is very tight for a multi-page scan. If your document runs to several pages, expect to reduce resolution rather than rely on compression alone.",
      "Be sceptical of any browser tool promising large PDF compression — most simply re-save the file and report the incidental difference as a saving.",
      "Text-based PDFs are already efficient. If yours is only text and still large, the cause is usually embedded fonts or an oversized logo image.",
    ],
    faqs: [
      {
        question: "Why will my PDF not go below a certain size?",
        answer:
          "Because you have reached the floor for its content. Once images are compressed and downsampled, what remains — fonts, vectors, document structure — cannot be reduced further without removing content. For a multi-page scan, that floor may simply be above 100KB.",
      },
      {
        question: "Does compressing a PDF make the text blurry?",
        answer:
          "Real text in a PDF is vector font data and is unaffected — it stays sharp at any zoom. Text inside a scanned image is pixels and will soften at aggressive settings. Which one you have determines how careful you need to be.",
      },
      {
        question: "Is my document uploaded to compress it?",
        answer:
          "No. The PDF is parsed and rewritten in your browser, so it never leaves your device. That matters for the bank statements and identity documents most often subject to these limits.",
      },
    ],
  },
  {
    slug: "reduce-image-size-without-losing-quality",
    title: "How to reduce image size without losing quality",
    metaTitle: "Reduce Image Size Without Losing Quality - Free",
    metaDescription:
      "The order of operations that shrinks a photo dramatically while keeping it sharp: crop, resize, then compress. Free and private.",
    keywords: [
      "reduce image size without losing quality", "compress image without quality loss",
      "shrink photo keep quality", "optimise image size",
    ],
    toolSlug: "image-resizer",
    toolLabel: "Image Resizer",
    updated: "2026-08-19",
    intro: [
      "\"Without losing quality\" is not quite achievable in the literal sense — every lossy compression discards something. What is achievable, and what people actually mean, is losing nothing you can see at the size the image will be viewed.",
      "The trick is the order of operations. Most people reach straight for a quality slider, which is the least effective lever and the most damaging. Cropping and resizing first removes far more bytes for zero visible cost, leaving compression with an easy job instead of an impossible one.",
    ],
    steps: [
      {
        title: "Crop away anything you do not need",
        body:
          "This is free. Pixels you remove cost nothing and improve the composition. On a photographed document, cropping the surrounding desk can halve the file before anything else happens.",
      },
      {
        title: "Resize to the dimensions it will actually be displayed at",
        body:
          "This is the big one. An image shown 800px wide on a page gains nothing from being 4000px wide — but it costs 25 times the pixels. Halving both dimensions removes 75% of the data with no visible change at display size.",
      },
      {
        title: "Only then apply compression",
        body:
          "With sensible dimensions, quality 80–85 is visually identical to the original for photographs. It is only when dimensions are far too large that the encoder is forced into visible artefacts.",
      },
      {
        title: "Choose the right format",
        body:
          "WebP typically produces files 25–35% smaller than JPEG at matching quality, and supports transparency. Use JPEG for maximum compatibility, PNG only for screenshots and line art.",
      },
    ],
    notes: [
      "Enlarging cannot add detail. Upscaling a small image interpolates from neighbouring pixels and always looks softer than a photograph genuinely captured at that size.",
      "Re-compressing an already-compressed JPEG stacks artefacts. Always work from the original.",
      "Screenshots and diagrams belong in PNG or WebP. JPEG puts visible halos around sharp text edges.",
      "Re-encoding strips EXIF, which removes GPS coordinates — useful before sharing photos publicly.",
    ],
    faqs: [
      {
        question: "What is the difference between resizing and compressing?",
        answer:
          "Resizing changes how many pixels the image has. Compressing changes how efficiently those pixels are stored. Resizing is the far bigger lever and, done to the display size, is effectively free in visual terms. Compression is what you apply afterwards to finish the job.",
      },
      {
        question: "Is WebP safe to use now?",
        answer:
          "Yes. Every current browser supports it, and it gives meaningfully smaller files than JPEG at equal quality with transparency support as a bonus. The main caveat is older software and some upload portals that only accept JPEG or PNG.",
      },
      {
        question: "What quality setting should I use?",
        answer:
          "80–85 for photographs is the standard sweet spot — visually indistinguishable from the original at normal viewing size. Below about 60, blocking artefacts appear around edges and in flat gradients like sky.",
      },
    ],
  },
  {
    slug: "convert-pdf-to-word-free",
    title: "How to convert a PDF to Word for free",
    metaTitle: "Convert PDF to Word Free - No Upload, No Signup",
    metaDescription:
      "Turn a PDF into an editable Word document in your browser. Learn what converts cleanly, what does not, and why scans need OCR.",
    keywords: [
      "convert pdf to word free", "pdf to word without signup",
      "pdf to editable word", "pdf to docx free",
    ],
    toolSlug: "pdf-to-word",
    toolLabel: "PDF to Word Converter",
    updated: "2026-08-19",
    intro: [
      "PDFs are designed to look identical everywhere, and that is exactly what makes them awkward to edit. The format stores positioned glyphs — this character, at this coordinate, in this font — rather than paragraphs, tables, or headings. A converter has to infer all of that structure back.",
      "Knowing this tells you what to expect. Text extracts accurately; structure is reconstructed and will need review. Anyone promising a perfect round trip from an arbitrary PDF is overselling, and understanding why saves a great deal of frustration.",
    ],
    steps: [
      {
        title: "Check the PDF has a real text layer",
        body:
          "Open it and try to select a sentence. If the text highlights, conversion will work well. If you cannot select anything, the page is an image and there is nothing to extract.",
      },
      {
        title: "Remove any password first",
        body:
          "Encrypted PDFs cannot be read by a converter. Unlock the document with the password you are entitled to use, then convert the unprotected copy.",
      },
      {
        title: "Convert and download the .docx",
        body:
          "The text is extracted page by page, with line breaks preserved based on the vertical position of each run.",
      },
      {
        title: "Fix structure in Word",
        body:
          "Expect to redo tables and multi-column layouts by hand. Headings usually need reapplying as styles. The text itself, including numbers, should be accurate — check figures anyway if they matter.",
      },
    ],
    notes: [
      "Scanned PDFs need optical character recognition, which is a fundamentally different process from text extraction. A converter that returns an empty document is telling you the file is a scan.",
      "Fonts not installed on your machine will be substituted by Word, which changes line breaks even when every character is correct.",
      "If you only need a few paragraphs, selecting and copying from a PDF reader is often faster than converting the whole document.",
    ],
    faqs: [
      {
        question: "Why is my converted Word document empty?",
        answer:
          "Because the PDF is a scan — a photograph of a page with no text layer to extract. This is by far the most common cause. Converting it requires OCR, which recognises characters from pixels and is a separate capability.",
      },
      {
        question: "Will tables and columns survive?",
        answer:
          "Usually not intact. A PDF does not record that something is a table; it records lines and text at coordinates. Simple single-column documents convert cleanly. Complex layouts need manual repair afterwards.",
      },
      {
        question: "Is my document uploaded to a server?",
        answer:
          "Not with this converter — extraction runs in your browser using pdf.js and the .docx is generated locally. That is worth checking with any converter you use, since contracts and reports are exactly the documents you would not want sitting on someone else's server.",
      },
    ],
  },
  {
    slug: "voice-typing-in-hindi",
    title: "How to do voice typing in Hindi (and other Indian languages)",
    metaTitle: "Hindi Voice Typing Online Free - Speak to Type",
    metaDescription:
      "Type Hindi, Tamil, Bengali and more by speaking, straight in your browser. No keyboard layout, no app install, no signup.",
    keywords: [
      "hindi voice typing", "voice typing in hindi online", "hindi speech to text",
      "bolkar likhna", "tamil voice typing", "indian language voice typing",
      "hindi typing without keyboard",
    ],
    toolSlug: "speech-to-text",
    toolLabel: "Voice to Text tool",
    updated: "2026-08-19",
    intro: [
      "Typing in Hindi, Tamil, or Bengali on a normal keyboard is genuinely awkward. You either install a language layout and relearn where every character sits, or you type phonetically in English and hope the transliteration guesses right. Most people give up and switch to English.",
      "Speaking is the way around it. Browser speech recognition handles Indian languages well, and it needs no keyboard layout, no app, and no account — you pick a language, press a button, and talk.",
    ],
    steps: [
      {
        title: "Pick the right language, not just the right country",
        body:
          "Choose Hindi for Hindi, Tamil for Tamil, and so on. If you are speaking Indian-accented English, choose English (India) rather than English (US) — the difference in accuracy is large, because the models are trained on different accents.",
      },
      {
        title: "Allow microphone access",
        body:
          "The browser asks once per site. If you decline by mistake, click the padlock or microphone icon in the address bar to grant it afterwards.",
      },
      {
        title: "Speak in complete phrases",
        body:
          "Recognition uses surrounding words to choose between similar-sounding options, so a full sentence transcribes better than the same words said one at a time.",
      },
      {
        title: "Say the punctuation",
        body:
          "Saying 'comma', 'full stop', and 'new paragraph' inserts them. Without this, you get one long unbroken sentence that takes longer to fix than it saved.",
      },
      {
        title: "Edit the transcript, then copy it",
        body:
          "The text area is editable. Correct any proper nouns and technical terms, then copy or download. Expect to fix names — those are what recognition gets wrong most.",
      },
    ],
    notes: [
      "Firefox does not implement speech recognition at all. Use Chrome, Edge, or Safari.",
      "A phone is often more accurate than a laptop, because the microphone is closer to your mouth.",
      "Background noise costs more accuracy than accent does. A quiet room matters more than an expensive microphone.",
      "Sessions end after a stretch of silence. Press start again — previously transcribed text is kept.",
    ],
    faqs: [
      {
        question: "Is Hindi voice typing accurate?",
        answer:
          "For clear speech in a quiet room, yes — comfortably usable for drafting messages, notes, and documents. It struggles with proper nouns, English technical terms mixed into Hindi, and heavy background noise. Treat it as a fast first draft you then edit, not a finished transcript.",
      },
      {
        question: "Do I need to install anything?",
        answer:
          "No. It runs in the browser using the speech API already built into Chrome, Edge, and Safari. There is no app, no keyboard layout, and no account.",
      },
      {
        question: "Is my voice private?",
        answer:
          "Not entirely, and this is worth knowing. Chrome and Edge send the audio to a cloud speech service to transcribe it; only Safari does it on-device. That is how the browser API works and no website using it can change that. Avoid dictating confidential material, and use Safari if on-device matters to you.",
      },
      {
        question: "Which Indian languages are supported?",
        answer:
          "Hindi, Bengali, Tamil, Telugu, Marathi, and Gujarati, plus English (India) for Indian-accented English. Accuracy is generally best for Hindi, which has the most training data behind it.",
      },
    ],
  },
  {
    slug: "convert-webp-to-jpg",
    title: "How to convert WebP to JPG (and when not to)",
    metaTitle: "Convert WebP to JPG Free - Fix Unsupported Images",
    metaDescription:
      "Turn WebP images into JPG or PNG so older software and upload forms accept them. Free, instant, and nothing is uploaded.",
    keywords: [
      "webp to jpg", "convert webp to jpg", "webp to png", "open webp file",
      "webp not supported", "save webp as jpg",
    ],
    toolSlug: "webp-to-jpg",
    toolLabel: "WebP to JPG Converter",
    updated: "2026-08-19",
    intro: [
      "Saving an image from the web increasingly gives you a .webp file, and then something refuses it — an upload form, an older photo editor, a printing service, a government portal. WebP is a genuinely better format, but support outside browsers is still patchy.",
      "Converting to JPG solves the compatibility problem immediately. It is worth understanding what you give up, though, because the conversion is not free: WebP is smaller at the same quality, so the JPG you get back will usually be a larger file.",
    ],
    steps: [
      {
        title: "Check whether you actually need to convert",
        body:
          "Every current browser displays WebP. If the image is for a website, keep it as WebP — it is smaller and looks the same. Convert only when a specific piece of software or a form rejects it.",
      },
      {
        title: "Choose JPG or PNG deliberately",
        body:
          "JPG for photographs. PNG if the image has transparency or sharp text edges, because JPG has no alpha channel and will fill transparent areas with a solid colour.",
      },
      {
        title: "Convert and check the file size",
        body:
          "Expect the JPG to be larger than the WebP was — often 25 to 35 percent larger at comparable quality. That is the cost of the older format, not a mistake.",
      },
      {
        title: "Compress afterwards if there is a size limit",
        body:
          "If the destination caps file size, run the converted JPG through an image compressor rather than converting again.",
      },
    ],
    notes: [
      "Converting WebP to JPG then back to WebP loses quality twice. Always work from the original.",
      "Animated WebP converts to a single still frame — JPG cannot hold animation.",
      "Transparency is lost when converting to JPG. Use PNG if you need to keep it.",
      "WebP is supported by every browser released in the last several years; the gaps are in desktop software and older upload systems.",
    ],
    faqs: [
      {
        question: "Why did my download come as a WebP?",
        answer:
          "Because the site serves WebP to browsers that support it, which is now all of them, and the browser saves what it received. It is not an error — the site is simply using a more efficient format.",
      },
      {
        question: "Will converting to JPG lose quality?",
        answer:
          "Slightly, since both are lossy and re-encoding always discards a little. At a high quality setting the difference is invisible in photographs. What is more noticeable is file size going up, because JPG is a less efficient format.",
      },
      {
        question: "Can I open a WebP without converting it?",
        answer:
          "Yes — drag it into any browser window. Recent versions of Windows Photos, macOS Preview, Photoshop, and GIMP also open WebP. Conversion is only needed for software or forms that specifically reject it.",
      },
      {
        question: "Is my image uploaded during conversion?",
        answer:
          "No. The file is decoded and re-encoded on a canvas in your browser, so it never leaves your device.",
      },
    ],
  },
];

export function getGuideBySlug(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
