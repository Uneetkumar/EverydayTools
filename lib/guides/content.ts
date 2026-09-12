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
  {
    slug: "how-to-calculate-percentage-increase-and-decrease",
    title: "How to calculate percentage increase and decrease",
    metaTitle: "Calculate Percentage Change - Formula & Guide",
    metaDescription:
      "Learn how to calculate percentage increase and decrease with the exact mathematical formula, step-by-step examples, and common pitfalls.",
    keywords: [
      "how to calculate percentage increase",
      "percentage decrease formula",
      "percentage change formula",
      "calculate percent difference",
      "percentage growth formula",
      "percent change examples"
    ],
    toolSlug: "percentage-calculator",
    toolLabel: "Percentage Calculator",
    updated: "2026-09-13",
    intro: [
      "Percentage change measures how much a value grows or shrinks relative to where it started. It is one of the most widely used mathematical concepts in finance, retail, science, and everyday life — whether you are tracking sales growth, comparing discounts, or analyzing quarterly inflation.",
      "The most common mistake people make is calculating the change relative to the final value instead of the original starting value. Because the reference base shifts, an increase of 25% followed by a decrease of 20% brings you back to the exact starting number, while an increase of 50% followed by a decrease of 50% leaves you with a 25% net loss.",
    ],
    steps: [
      {
        title: "Identify the starting value and ending value",
        body:
          "Clearly label the initial figure (V₁) and the new figure (V₂). For example, if a product price rose from $80 to $100, your starting value is $80 and your final value is $100.",
      },
      {
        title: "Subtract the starting value from the final value",
        body:
          "Calculate the absolute difference: ΔV = V₂ - V₁. In our example, 100 - 80 = 20. If the difference is positive, it represents an increase; if negative, it represents a decrease.",
      },
      {
        title: "Divide the difference by the starting value",
        body:
          "Divide ΔV by the original value V₁: 20 / 80 = 0.25. Always divide by where you started, never where you ended up.",
      },
      {
        title: "Multiply by 100 to convert to a percentage",
        body:
          "Multiply the decimal by 100: 0.25 × 100 = +25%. The price experienced a 25% increase.",
      },
    ],
    notes: [
      "The formula is: Percentage Change = ((New Value - Old Value) / Old Value) × 100.",
      "A 100% increase means the value has doubled (2x original). A 200% increase means it has tripled (3x original).",
      "Percentage decreases cannot exceed 100% unless dealing with negative values (e.g. debt or temperatures).",
      "Percentage points are different from percentages: moving from 10% to 15% is a 5 percentage-point increase, but a 50% relative growth.",
    ],
    faqs: [
      {
        question: "Why does a 50% increase followed by a 50% decrease not equal 0% change?",
        answer:
          "Because the base changes. If you start with $100 and add 50%, you reach $150. If you then decrease $150 by 50%, you lose $75, leaving you with $75 — a 25% overall loss.",
      },
      {
        question: "Can percentage change be negative?",
        answer:
          "Yes. A negative result simply indicates a percentage decrease. For instance, -15% indicates the quantity shrank by 15% from its original baseline.",
      },
      {
        question: "How do I calculate what percentage one number is of another?",
        answer:
          "Divide the part by the whole and multiply by 100: (Part / Whole) × 100. For example, 25 out of 200 is (25 / 200) × 100 = 12.5%.",
      },
      {
        question: "What is the difference between percentage and percentile?",
        answer:
          "A percentage is a proportion out of 100. A percentile is a statistical rank indicating the percentage of scores or observations that fall below a given value in a dataset.",
      },
    ],
  },
  {
    slug: "how-loan-emi-is-calculated-formula-and-prepayment",
    title: "How loan EMI is calculated: formula and interest impact",
    metaTitle: "How Loan EMI is Calculated - Formula & Guide",
    metaDescription:
      "Understand the mathematical formula behind loan EMI calculation, how interest amortization works over time, and how prepayments save money.",
    keywords: [
      "how loan emi is calculated",
      "emi calculation formula",
      "equated monthly installment formula",
      "loan amortization schedule",
      "how emi prepayment works",
      "home loan emi calculation"
    ],
    toolSlug: "emi-calculator",
    toolLabel: "EMI Calculator",
    updated: "2026-09-13",
    intro: [
      "An Equated Monthly Installment (EMI) is the fixed monthly amount a borrower pays to a lender on a specified calendar date. Every EMI installment covers both the monthly interest accrued on the remaining balance and a partial repayment of the original loan principal.",
      "In the early years of any long-term loan (like a 20-year home loan), interest constitutes 70% to 80% of each EMI payment. Over time, as the outstanding principal declines, the interest share shrinks and the principal repayment share expands according to standard amortization tables.",
    ],
    steps: [
      {
        title: "Determine the monthly interest rate",
        body:
          "Bank interest rates are quoted annually. Convert the annual rate to a monthly decimal by dividing by 12 and then by 100: r = Annual Rate / (12 × 100). For an 8.4% loan, r = 8.4 / 1200 = 0.007.",
      },
      {
        title: "Calculate total payment tenure in months",
        body:
          "Multiply the loan tenure in years by 12: n = Years × 12. A 20-year loan has n = 240 monthly payments.",
      },
      {
        title: "Apply the reducing-balance amortization formula",
        body:
          "The standard formula is: EMI = [P × r × (1 + r)^n] / [(1 + r)^n - 1], where P is principal, r is monthly rate, and n is total months.",
      },
      {
        title: "Calculate total repayment and interest expense",
        body:
          "Total Repayment = EMI × n. Total Interest Paid = Total Repayment - Principal. For a $100,000 loan at 8.4% for 20 years, EMI is $861.50, and total interest paid over 20 years equals $106,760.",
      },
    ],
    notes: [
      "Prepaying even one extra EMI every calendar year can cut a 20-year loan tenure by 3 to 4 years.",
      "Fixed-rate loans keep the same EMI throughout, whereas floating-rate loans adjust either the tenure or the EMI when central bank benchmark rates move.",
      "Processing fees, statutory stamp duty, and mortgage insurance are one-off upfront costs and not included in basic EMI math.",
      "Check with your lender whether partial prepayments reduce the monthly EMI or shorten the remaining loan duration.",
    ],
    faqs: [
      {
        question: "Why is the interest portion so high in the first few years?",
        answer:
          "Interest is calculated each month on the remaining unpaid loan balance. In year one, the balance is at its highest, meaning monthly interest charges are maximized. As principal is gradually cleared, monthly interest drops.",
      },
      {
        question: "How much can I save by making regular prepayments?",
        answer:
          "On a 20-year loan, prepaying 5% of the outstanding balance annually or making one extra monthly payment each year routinely saves between 20% and 35% of the total cumulative interest.",
      },
      {
        question: "What happens to my EMI if interest rates increase on a floating loan?",
        answer:
          "Lenders usually keep the monthly EMI payment constant and extend the total number of remaining months (tenure). If the rate increase is steep, the EMI itself may also increase to prevent negative amortization.",
      },
      {
        question: "Can I use this formula for car and personal loans?",
        answer:
          "Yes, provided the loan uses reducing-balance interest. Be wary of flat-rate personal loans, where interest is charged on the entire original amount regardless of principal repaid, making the effective rate roughly double the advertised number.",
      },
    ],
  },
  {
    slug: "sip-vs-lump-sum-investment-returns-explained",
    title: "SIP vs lump sum investment: returns and compounding",
    metaTitle: "SIP vs Lump Sum Investing - Compounding Guide",
    metaDescription:
      "Compare Systematic Investment Plans (SIP) with lump sum investments. Understand rupee-cost averaging, compounding formulas, and market volatility.",
    keywords: [
      "sip vs lump sum",
      "systematic investment plan explained",
      "dollar cost averaging benefits",
      "how sip compounding works",
      "lump sum mutual fund returns",
      "sip return calculation formula"
    ],
    toolSlug: "sip-calculator",
    toolLabel: "SIP Calculator",
    updated: "2026-09-13",
    intro: [
      "When building wealth in mutual funds or index ETFs, investors typically choose between investing a single lump sum or setting up a Systematic Investment Plan (SIP) that transfers a fixed dollar amount at regular intervals.",
      "While a lump sum mathematically outperforms in a consistently rising bull market due to early capital deployment, SIPs protect retail investors against psychological panic and market timing risk through disciplined rupee-cost averaging.",
    ],
    steps: [
      {
        title: "Understand rupee-cost averaging",
        body:
          "When market prices drop, your fixed monthly SIP contribution buys more fund units. When prices peak, it buys fewer units. Over time, your average acquisition cost per unit is lower than the arithmetic average market price.",
      },
      {
        title: "Calculate monthly compounded SIP returns",
        body:
          "SIP returns use the future value of an annuity formula: M = P × [((1 + i)^n - 1) / i] × (1 + i), where P is monthly deposit, i is periodic interest rate (annual rate / 12), and n is total months.",
      },
      {
        title: "Compare against a one-off lump sum",
        body:
          "A lump sum compounds using standard compound growth: A = P × (1 + r)^t. If you invest $120,000 all at once at 12% for 10 years, it grows to $372,700. If you invest $1,000 monthly ($120,000 total) over 10 years at 12%, it grows to $232,300 because later deposits have less time to compound.",
      },
      {
        title: "Choose the strategy matching your cash flow",
        body:
          "Salaried earners benefit from automated monthly SIPs aligned with paychecks. Windfalls, bonuses, or property sale proceeds should either be invested lump sum or deployed via a Systematic Transfer Plan (STP) over 6 to 12 months.",
      },
    ],
    notes: [
      "Time in the market consistently beats timing the market for long investment horizons (>7 years).",
      "Step-up SIPs (increasing your monthly contribution by 5% to 10% each year with salary raises) can more than double your terminal portfolio value.",
      "Neither strategy protects against poor underlying asset selection; always choose low-cost, diversified index funds.",
      "SIP eliminates the emotional stress of trying to pick market bottoms.",
    ],
    faqs: [
      {
        question: "Is SIP completely safe from market crashes?",
        answer:
          "No. Equity mutual funds fluctuate with underlying market valuations. However, continued SIP investing during a crash is advantageous because you accumulate units at heavily discounted valuations.",
      },
      {
        question: "What is an STP (Systematic Transfer Plan)?",
        answer:
          "An STP parks a lump sum in a low-risk liquid or debt fund, then automatically transfers a fixed amount each month into an equity fund, combining capital preservation with dollar-cost averaging.",
      },
      {
        question: "What is a reasonable expected annual return for equity index funds?",
        answer:
          "Historically, broad equity indices (such as the S&P 500 or Nifty 50) have delivered 10% to 12% annualized nominal returns over 15+ year periods, though past performance never guarantees future returns.",
      },
      {
        question: "Can I pause or stop an ongoing SIP?",
        answer:
          "Yes. SIPs carry zero contractual lock-in. You can pause, modify the monthly amount, or cancel an SIP at any time without financial penalties from the fund house.",
      },
    ],
  },
  {
    slug: "gst-calculation-guide-inclusive-vs-exclusive",
    title: "How to calculate GST: inclusive vs exclusive formulas",
    metaTitle: "How to Calculate GST - Inclusive vs Exclusive",
    metaDescription:
      "Learn the exact mathematical formulas to add GST or remove GST from invoice prices across 5%, 12%, 18%, and 28% tax slabs with clear examples.",
    keywords: [
      "how to calculate gst",
      "gst inclusive formula",
      "gst exclusive formula",
      "remove gst from total price",
      "add gst to base price",
      "gst tax slab calculation"
    ],
    toolSlug: "gst-calculator",
    toolLabel: "GST Calculator",
    updated: "2026-09-13",
    intro: [
      "Goods and Services Tax (GST) is a unified indirect consumption tax levied on the supply of goods and services. Whether you are a business owner issuing client invoices or a consumer verifying retail receipts, calculating GST correctly is essential.",
      "The fundamental distinction in commercial invoicing is between GST Exclusive prices (where tax must be added on top of a net base figure) and GST Inclusive prices (where tax is already embedded inside the final sticker price and must be backed out).",
    ],
    steps: [
      {
        title: "Adding GST to a Net Base Amount (GST Exclusive)",
        body:
          "To find the tax amount: GST = Base Amount × (GST Rate / 100). To find the gross total: Total = Base Amount + GST Amount. For example, a $500 consulting service with 18% GST incurs $90 tax ($500 × 0.18), giving a final invoice total of $590.",
      },
      {
        title: "Removing GST from a Gross Total (GST Inclusive)",
        body:
          "When a price includes GST, dividing by 1 + (Rate/100) yields the original net base: Base Amount = Total Price / (1 + (GST Rate / 100)). The tax portion is: GST Amount = Total Price - Base Amount.",
      },
      {
        title: "Step-by-step inclusive tax extraction example",
        body:
          "If a retail laptop costs $1,180 including 18% GST: Base = $1,180 / 1.18 = $1,000. GST Paid = $1,180 - $1,000 = $180. Notice that 18% of $1,180 ($212.40) is incorrect because the tax was levied on $1,000, not $1,180.",
      },
      {
        title: "Splitting into CGST and SGST for domestic transactions",
        body:
          "Under multi-tier GST systems (such as in India), intrastate transactions divide the tax equally between Central GST (CGST) and State GST (SGST). For an 18% slab, CGST is 9% and SGST is 9%. Inter-state transactions apply 18% Integrated GST (IGST).",
      },
    ],
    notes: [
      "Common GST rate slabs are 0% (essential foods), 5% (transport/basic goods), 12% (processed items), 18% (services/electronics), and 28% (luxury/automobiles).",
      "Never calculate embedded GST by simply multiplying the gross total by the tax percentage.",
      "Businesses registered under GST can claim Input Tax Credit (ITC) for the tax paid on business purchases.",
      "Rounding of tax figures should follow statutory guidelines (usually to the nearest currency unit or cent).",
    ],
    faqs: [
      {
        question: "Why can't I just take 18% of the final receipt total?",
        answer:
          "Because the 18% tax was added to the base price, not the total. Calculating 18% of $118 gives $21.24, which overstates the true tax paid ($18.00) by over 17%.",
      },
      {
        question: "What is Input Tax Credit (ITC)?",
        answer:
          "Input Tax Credit allows registered businesses to deduct the GST they paid on business inputs from the GST they collect from customers, preventing cascading double taxation.",
      },
      {
        question: "What is the difference between zero-rated and GST-exempt items?",
        answer:
          "Exempt goods carry no GST and businesses cannot claim input credits on inputs. Zero-rated supplies (like exports) carry 0% GST and businesses remain eligible to claim back input credits.",
      },
      {
        question: "How does reverse charge mechanism (RCM) work?",
        answer:
          "Under RCM, the recipient of goods or services pays the tax directly to the government instead of the supplier, commonly applied to unregistered vendor supplies or legal services.",
      },
    ],
  },
  {
    slug: "png-vs-svg-vs-webp-complete-image-format-guide",
    title: "PNG vs SVG vs WebP: which image format to choose",
    metaTitle: "PNG vs SVG vs WebP - Complete Image Format Guide",
    metaDescription:
      "Compare PNG, SVG, and WebP image formats for web performance, file size, scalability, and transparency. Choose the best format for every graphic.",
    keywords: [
      "png vs svg vs webp",
      "vector vs raster graphics",
      "best web image format",
      "svg vs png for logos",
      "when to use webp",
      "lossless image format comparison"
    ],
    toolSlug: "png-to-svg",
    toolLabel: "PNG to SVG Converter",
    updated: "2026-09-13",
    intro: [
      "Selecting the wrong image format can severely bloat website load times, hurt Google Core Web Vitals, or cause logos and icons to look fuzzy on high-density Retina displays. Modern web design requires knowing when to use vector SVG, raster PNG, or modern compressed WebP.",
      "Each format was engineered for a distinct technical role: SVG represents shapes as mathematical code that scales infinitely; PNG stores exact pixels with lossless alpha transparency; and WebP provides superior modern compression for photographic and complex digital graphics.",
    ],
    steps: [
      {
        title: "Use SVG for vector graphics, icons, and company logos",
        body:
          "SVG (Scalable Vector Graphics) describes paths, lines, and colors with XML text. Because it contains math instead of pixels, an SVG logo remains pin-sharp at any zoom level or screen resolution while often weighing under 5KB.",
      },
      {
        title: "Use WebP for website photographs and hero banners",
        body:
          "Developed by Google, WebP offers both lossy and lossless compression. WebP photographs are routinely 25% to 35% smaller than comparable JPEGs at identical perceived visual quality, drastically accelerating Largest Contentful Paint (LCP).",
      },
      {
        title: "Use PNG when lossless fidelity and alpha channel are paramount",
        body:
          "PNG (Portable Network Graphics) is a lossless raster format. It is the best choice for screenshots, software UI mockups, medical diagrams, and raster graphics with semi-transparent drop shadows where WebP compression artifacts are unacceptable.",
      },
      {
        title: "Convert raster PNG logos to vector SVG when possible",
        body:
          "Converting low-resolution or raster logos into true vector SVG paths ensures crisp rendering across responsive layouts, removes pixelation, and enables CSS styling and dark mode fills.",
      },
    ],
    notes: [
      "SVG files can be styled with CSS and animated with JavaScript directly in the browser DOM.",
      "Never use SVG for photographic images; converting a photograph to SVG creates millions of geometric polygon nodes and produces multi-megabyte files.",
      "WebP is supported by all modern browsers (Chrome, Safari, Firefox, Edge).",
      "Always compress PNG files with lossy quantization or convert to WebP before deploying to production.",
    ],
    faqs: [
      {
        question: "Why should company logos always be in SVG format?",
        answer:
          "Because vector SVG renders at native device pixel density on all screens (4K, mobile, Retina) without blurry edges, and typically requires less bandwidth than raster PNG files.",
      },
      {
        question: "Can SVG images contain security vulnerabilities?",
        answer:
          "Yes. Because SVG is XML markup, it can contain embedded script tags that execute JavaScript if embedded as inline HTML. Always sanitize user-uploaded SVGs or serve them via standard image elements.",
      },
      {
        question: "Does WebP support transparency like PNG?",
        answer:
          "Yes. WebP supports full 8-bit alpha channel transparency in both lossy and lossless modes, frequently with 60% to 70% smaller file sizes than transparent PNG.",
      },
      {
        question: "When is JPG still preferable over WebP?",
        answer:
          "Only when exporting for legacy systems, older desktop print workflows, or offline embedded hardware that lack WebP codecs. For the open web, WebP is universally superior.",
      },
    ],
  },
  {
    slug: "how-to-convert-pdf-to-word-without-losing-formatting",
    title: "How to convert PDF to Word without losing formatting",
    metaTitle: "Convert PDF to Word Without Losing Formatting",
    metaDescription:
      "Step-by-step guide to converting PDF documents to editable Microsoft Word (.docx) files while preserving paragraphs, headings, and layouts.",
    keywords: [
      "how to convert pdf to word",
      "convert pdf to docx without losing formatting",
      "pdf to word free online",
      "editable word document from pdf",
      "preserve pdf layout in word",
      "scanned pdf to word text"
    ],
    toolSlug: "pdf-to-word",
    toolLabel: "PDF to Word Converter",
    updated: "2026-09-13",
    intro: [
      "PDFs are built for visual fidelity across operating systems — freezing fonts, coordinates, and margins in place so that a document prints identically everywhere. Microsoft Word documents, by contrast, are flowable semantic texts designed for editing, typing, and dynamic repagination.",
      "Translating a rigid PDF back into an editable DOCX file requires reconstructing text streams, paragraph hierarchies, and heading levels from raw visual coordinate fragments without corrupting the document layout.",
    ],
    steps: [
      {
        title: "Determine if your PDF is digital text or a scanned image",
        body:
          "Try highlighting text inside the PDF with your mouse cursor. If you can select individual words, it has a native digital text layer. If clicking selects the entire page as a block, the PDF is a flat photograph that requires Optical Character Recognition (OCR).",
      },
      {
        title: "Extract text streams while maintaining reading order",
        body:
          "Modern in-browser converters parse the PDF's internal Content Stream operator dictionary (`Tj` and `TJ` operators) to extract characters in sequential reading order rather than visual layout order.",
      },
      {
        title: "Map font sizes to semantic Word heading styles",
        body:
          "Good conversion algorithms detect large bold font fragments and translate them into Word Heading 1 and Heading 2 tags, ensuring your generated DOCX retains a clean table of contents and structural navigation.",
      },
      {
        title: "Review and refine formatting in Microsoft Word or Google Docs",
        body:
          "After conversion, open the `.docx` file in your word processor. Check multi-column sections, check that bullet lists are real list items rather than bullet character symbols, and verify margins.",
      },
    ],
    notes: [
      "Client-side converters process documents entirely in your browser memory, guaranteeing that sensitive contracts and financial statements are never uploaded to unknown servers.",
      "Complex multi-column magazine layouts or technical blueprints with nested tables may require minor margin adjustments after conversion.",
      "Embedded vector charts in PDFs are converted to standard Word paragraph blocks or vector drawing objects.",
      "Retain your original PDF master file as a permanent visual reference.",
    ],
    faqs: [
      {
        question: "Why do some converted Word documents show text inside boxes?",
        answer:
          "Cheap converters take the easy shortcut of wrapping every sentence in an absolute-positioned Word text box. This preserves visual appearance on paper but makes editing text nearly impossible.",
      },
      {
        question: "Can this tool convert scanned receipts and physical paperwork?",
        answer:
          "Pure client-side converters extract digital text layers. Scanned photocopies without text layers require OCR engines like Tesseract to interpret letterforms from pixel images.",
      },
      {
        question: "Will hyperlinks and email addresses survive conversion?",
        answer:
          "Yes. Standard PDF link annotations (`/URI` action dictionaries) are mapped to native Word hyperlinked text runs.",
      },
      {
        question: "Is it safe to convert confidential contracts online?",
        answer:
          "Yes, provided you use an in-browser client-side tool like TabBench where JavaScript processes the binary locally without transmitting document data across the internet.",
      },
    ],
  },
  {
    slug: "complete-guide-to-json-formatting-and-validation",
    title: "Complete guide to JSON formatting and validation",
    metaTitle: "JSON Formatting and Validation Guide",
    metaDescription:
      "Master JSON syntax rules, fix common errors like trailing commas and single quotes, and format nested API payloads cleanly in your browser.",
    keywords: [
      "json formatting guide",
      "how to validate json online",
      "json syntax rules and errors",
      "fix trailing comma json",
      "json minify vs beautify",
      "parse json api response"
    ],
    toolSlug: "json-formatter",
    toolLabel: "JSON Formatter",
    updated: "2026-09-13",
    intro: [
      "JavaScript Object Notation (JSON) is the universal data interchange standard powering modern web APIs, cloud microservices, and configuration files. Defined formally in RFC 8259 and ECMA-404, JSON is lightweight, language-agnostic, and straightforward for computers to parse.",
      "However, JSON's strict specification makes it unforgiving: a single misplaced comma, an unescaped control character, or a single quotation mark will cause strict parsers in Node.js, Python, or Go to crash immediately with a fatal syntax exception.",
    ],
    steps: [
      {
        title: "Understand the strict double-quote requirement",
        body:
          "Unlike standard JavaScript or Python dictionaries, JSON specifications mandate that all object keys and all string values MUST be enclosed in double quotation marks (`\"key\": \"value\"`). Single quotes (`'key'`) are strictly illegal.",
      },
      {
        title: "Eliminate trailing commas",
        body:
          "Trailing commas after the final element in an array (`[1, 2, 3,]`) or the final key-value pair in an object (`{\"a\": 1,}`) violate the JSON grammar specification and are the #1 cause of API validation failures.",
      },
      {
        title: "Indent nested structures for human readability",
        body:
          "Use a JSON Beautifier to format minified single-line API responses with consistent 2-space or 4-space indentation, making nested hierarchy, arrays, and null values immediately obvious to developers.",
      },
      {
        title: "Minify JSON before transmitting over networks",
        body:
          "When deploying configuration payloads or transferring large datasets across network sockets, minify the JSON to strip all whitespace, indentation, and newline characters, reducing payload size by 20% to 35%.",
      },
    ],
    notes: [
      "JSON supports only six data types: String, Number, Boolean, Null, Object, and Array. Functions, undefined, and Date objects are not valid JSON.",
      "Numbers in JSON cannot have leading zeros (`012` is invalid) and cannot represent `NaN` or `Infinity`.",
      "Keys inside JSON objects must be unique strings; duplicate keys lead to unpredictable parser behavior across different languages.",
      "Always validate configuration files (like `tsconfig.json` or `settings.json`) before committing code to prevent broken CI/CD pipelines.",
    ],
    faqs: [
      {
        question: "Why does JSON not support comments?",
        answer:
          "Douglas Crockford deliberately removed comments from the JSON standard in 2000 to prevent developers from putting parsing instructions or proprietary directives inside data payloads.",
      },
      {
        question: "How do I represent dates in JSON?",
        answer:
          "JSON has no native Date type. The universally accepted standard is to serialize dates as ISO 8601 UTC strings: `\"2026-09-13T10:30:00Z\"`.",
      },
      {
        question: "What is the difference between JSON and JSON5?",
        answer:
          "JSON5 is an expanded proposed standard that permits comments, single quotes, trailing commas, and hexadecimal numbers. However, standard web APIs still strictly expect vanilla JSON.",
      },
      {
        question: "Can JSON safely contain customer passwords or API secrets?",
        answer:
          "Plain JSON offers zero encryption. Any secrets stored in JSON files or API responses must be encrypted at rest and transmitted over secure TLS (HTTPS) connections.",
      },
    ],
  },
  {
    slug: "understanding-aspect-ratios-16-9-4-3-9-16-explained",
    title: "Understanding aspect ratios: 16:9, 4:3, 9:16 explained",
    metaTitle: "Aspect Ratios Explained - 16:9, 4:3 & 9:16 Guide",
    metaDescription:
      "A complete guide to display and video aspect ratios: formulas for calculating dimensions, resizing for social media, and preventing letterboxing.",
    keywords: [
      "aspect ratio explained",
      "16:9 aspect ratio dimensions",
      "9:16 vertical video ratio",
      "how to calculate aspect ratio",
      "aspect ratio formula",
      "letterbox pillarbox black bars"
    ],
    toolSlug: "aspect-ratio-calculator",
    toolLabel: "Aspect Ratio Calculator",
    updated: "2026-09-13",
    intro: [
      "Aspect ratio describes the proportional relationship between the width and height of an image, video, or digital screen. Written as two numbers separated by a colon (e.g. 16:9), it defines the geometric shape of the frame regardless of its physical size in inches or resolution in pixels.",
      "With modern content consumed across widescreen monitors, television screens, square social feeds, and vertical smartphones, understanding aspect ratios is essential to avoid unwanted distortion, stretching, or black letterboxing bars.",
    ],
    steps: [
      {
        title: "The Aspect Ratio Calculation Formula",
        body:
          "Aspect Ratio = Width / Height. To simplify pixel dimensions into standard ratios, divide both width and height by their Greatest Common Divisor (GCD). For 1920×1080: GCD is 120; 1920/120 = 16, 1080/120 = 9, yielding 16:9.",
      },
      {
        title: "16:9 Widescreen: The Standard for Video & Displays",
        body:
          "16:9 is the universal standard for YouTube, television broadcasts, desktop monitors, and laptops. Standard resolutions include 1920×1080 (1080p FHD), 2560×1440 (2K QHD), and 3840×2160 (4K UHD).",
      },
      {
        title: "9:16 Vertical Video: The Mobile Standard",
        body:
          "9:16 is simply 16:9 rotated 90 degrees. It is the mandatory format for mobile-first vertical video: Instagram Reels, TikTok, YouTube Shorts, and Snapchat. Standard resolution is 1080×1920 pixels.",
      },
      {
        title: "1:1 Square and 4:5 Portrait Ratios",
        body:
          "1:1 (1080×1080) and 4:5 (1080×1350) are popular feed formats for Instagram and e-commerce product carousels because they occupy maximum vertical screen space on mobile feeds without requiring fullscreen video expansion.",
      },
    ],
    notes: [
      "Letterboxing refers to horizontal black bars added above and below content when widescreen footage is shown on a taller screen.",
      "Pillarboxing refers to vertical black bars placed on the left and right when 4:3 or vertical footage is displayed on a widescreen display.",
      "An aspect ratio does not indicate resolution: both a 640×360 video and a 3840×2160 4K stream share the exact same 16:9 aspect ratio.",
      "Never stretch or squish footage to fit a different aspect ratio; always crop or letterbox to preserve natural subject geometry.",
    ],
    faqs: [
      {
        question: "Why did 16:9 replace the older 4:3 standard?",
        answer:
          "4:3 was the standard for vintage CRT televisions. In the late 1980s, SMPTE standardized 16:9 as an optimal geometric compromise between television and ultra-wide cinematic film formats (like 2.39:1).",
      },
      {
        question: "How do I calculate new height while keeping aspect ratio?",
        answer:
          "New Height = New Width / (Original Width / Original Height). For example, scaling a 1920×1080 image to a width of 800px gives: 800 / (1920 / 1080) = 450px height.",
      },
      {
        question: "What is cinematic 21:9 ultrawide?",
        answer:
          "21:9 (approximately 2.33:1 or 2.39:1) is the standard anamorphic widescreen format used by major Hollywood feature films, offering an immersive wide field of view.",
      },
      {
        question: "Does changing aspect ratio reduce video quality?",
        answer:
          "Cropping footage to fit a new ratio discards pixels outside the crop frame. If you crop 16:9 landscape to 9:16 vertical, you discard roughly two-thirds of the horizontal frame.",
      },
    ],
  },
  {
    slug: "how-to-read-and-remove-exif-metadata-for-privacy",
    title: "How to view and remove photo EXIF metadata for privacy",
    metaTitle: "How to View and Remove Photo EXIF Metadata",
    metaDescription:
      "Discover what hidden EXIF metadata lives inside your photos, including GPS coordinates, camera serials, and timestamps, and how to safely strip it.",
    keywords: [
      "how to remove exif data",
      "view photo metadata online",
      "remove gps coordinates from photos",
      "exif metadata privacy risks",
      "strip image metadata free",
      "photo location privacy guide"
    ],
    toolSlug: "exif-viewer",
    toolLabel: "EXIF Metadata Viewer",
    updated: "2026-09-13",
    intro: [
      "Every time you take a photo with a smartphone or digital camera, the device embeds an invisible data structure known as EXIF (Exchangeable Image File Format) directly inside the image file. This data travels with the image wherever it is shared or uploaded.",
      "While useful for photographers to check exposure settings, EXIF metadata routinely contains high-risk private information: exact GPS latitude and longitude coordinates of your home, timestamps showing daily routines, device serial numbers, and facial recognition tags.",
    ],
    steps: [
      {
        title: "Inspect what data your camera is embedding",
        body:
          "Drop your image into an in-browser EXIF viewer. Review the GPS tags (Latitude, Longitude, Altitude), capture timestamp, camera model (e.g. iPhone 15 Pro), lens focal length, aperture, and ISO settings.",
      },
      {
        title: "Identify sensitive geolocation coordinates",
        body:
          "If the `GPSLatitude` and `GPSLongitude` fields contain values, anyone downloading the image can paste those coordinates into Google Maps to pinpoint the exact location where the photo was taken within a 3-meter radius.",
      },
      {
        title: "Strip metadata before posting online",
        body:
          "When privacy matters (such as selling personal items on online marketplaces or sharing family photos on personal blogs), run the image through an EXIF stripper or re-encode it through an HTML5 canvas to permanently purge all metadata headers.",
      },
      {
        title: "Disable location tagging at the camera settings level",
        body:
          "On iOS, navigate to Settings → Privacy & Security → Location Services → Camera, and select 'Never'. On Android, open the Camera app settings and toggle off 'Save location' or 'Location tags'.",
      },
    ],
    notes: [
      "Major social networks (Twitter, Instagram, Facebook) automatically strip EXIF upon upload, but email attachments, cloud links, AirDrop, and personal websites preserve full EXIF.",
      "Stripping EXIF metadata reduces image file size by 5KB to 60KB per image.",
      "Re-saving an image through an in-browser canvas decodes raw pixels and re-encodes without copying any EXIF or IPTC metadata chunks.",
      "Professional photographers should keep EXIF intact on portfolio sites to showcase camera settings and copyright ownership.",
    ],
    faqs: [
      {
        question: "Can someone find my home address from a photo I took?",
        answer:
          "Yes, if location services were enabled on your camera and the photo was shared via direct file transfer, email, or a platform that does not sanitize EXIF metadata.",
      },
      {
        question: "Does removing EXIF metadata reduce photo visual quality?",
        answer:
          "No. EXIF is stored in a separate header block (APP1 segment in JPEG). Removing the header leaves the underlying image pixels completely untouched.",
      },
      {
        question: "What is IPTC and XMP metadata?",
        answer:
          "IPTC and XMP are metadata standards developed for news organizations and photo agencies to embed captions, keywords, copyright credits, and licensing terms into image files.",
      },
      {
        question: "Can stripped EXIF metadata ever be recovered?",
        answer:
          "No. Once the EXIF header segment is excised from the image file binary, the original metadata is permanently erased and cannot be reconstructed.",
      },
    ],
  },
  {
    slug: "how-to-calculate-compound-interest-with-examples",
    title: "How to calculate compound interest with practical examples",
    metaTitle: "Calculate Compound Interest - Formula & Guide",
    metaDescription:
      "Learn the compound interest formula A = P(1 + r/n)^(nt), see worked financial examples with annual and monthly compounding, and compare with simple interest.",
    keywords: [
      "how to calculate compound interest",
      "compound interest formula",
      "compound interest vs simple interest",
      "compounding frequency monthly daily",
      "compound growth calculation examples",
      "interest on interest explained"
    ],
    toolSlug: "compound-interest-calculator",
    toolLabel: "Compound Interest Calculator",
    updated: "2026-09-13",
    intro: [
      "Compound interest is interest calculated not only on the initial principal deposited or borrowed, but also on the accumulated interest from previous periods. Often referred to as 'interest on interest', compounding is the foundational engine of long-term wealth creation.",
      "Unlike simple interest, which grows linearly by adding a fixed dollar amount each year, compound interest expands exponentially. Over decades, the interest generated each year will vastly eclipse the original principal investment.",
    ],
    steps: [
      {
        title: "The Universal Compound Interest Formula",
        body:
          "The standard formula is: A = P × (1 + r/n)^(n × t), where A = Final accrued amount, P = Principal investment, r = Annual interest rate (decimal), n = Compounding frequency per year, and t = Time period in years.",
      },
      {
        title: "Define the compounding frequency (n)",
        body:
          "How often interest is added to the balance: Annual compounding: n = 1; Semi-annual: n = 2; Quarterly: n = 4; Monthly: n = 12; Daily: n = 365. Higher frequency compounding slightly increases total yield.",
      },
      {
        title: "Worked Step-by-Step Example",
        body:
          "Suppose you invest $10,000 at 8% annual interest compounded monthly for 10 years. P = 10,000, r = 0.08, n = 12, t = 10. A = 10,000 × (1 + 0.08/12)^(12 × 10) = 10,000 × (1.006667)^120 = $22,196.40. Total interest earned equals $12,196.40.",
      },
      {
        title: "Compare against simple interest",
        body:
          "Under simple interest (A = P + P×r×t), the same $10,000 at 8% for 10 years would yield only $8,000 in interest ($18,000 total). Compounding created an extra $4,196.40 for free.",
      },
    ],
    notes: [
      "The Rule of 72 provides a quick mental shortcut: divide 72 by the annual interest rate to find roughly how many years it takes your money to double (e.g. at 8%, 72 / 8 = 9 years).",
      "Inflation diminishes real purchasing power; always calculate real return by subtracting annual inflation from nominal interest yield.",
      "Compounding works equally against you in debt: high-interest credit cards (24%–36% APR) compound daily, causing unpaid balances to snowball rapidly.",
      "Starting 10 years earlier with half the monthly contribution routinely beats starting late with twice the contribution.",
    ],
    faqs: [
      {
        question: "Does compounding daily make a huge difference compared to monthly?",
        answer:
          "At normal interest rates (5%–10%), the difference between daily and monthly compounding is minimal (less than a 0.05% effective rate difference) due to diminishing returns at higher frequencies.",
      },
      {
        question: "What is continuous compounding?",
        answer:
          "Continuous compounding represents the mathematical upper limit where interest compounds infinitely every microsecond, calculated using Euler's number: A = P × e^(rt).",
      },
      {
        question: "What is the difference between APR and APY?",
        answer:
          "APR (Annual Percentage Rate) does not account for compounding within the year. APY (Annual Percentage Yield) reflects the true annual rate including compounding effects.",
      },
      {
        question: "Why is time considered the most important factor in compounding?",
        answer:
          "Because compounding is exponential (the time variable `t` sits in the exponent). Most wealth is accumulated in the final years of an investment horizon.",
      },
    ],
  },
  {
    slug: "regular-expressions-for-beginners-regex-cheat-sheet",
    title: "Regular expressions for beginners: a practical guide",
    metaTitle: "Regular Expressions for Beginners - Regex Guide",
    metaDescription:
      "Learn regex from scratch with practical character classes, quantifiers, lookaheads, and common validation patterns for emails, URLs, and phones.",
    keywords: [
      "regular expressions for beginners",
      "regex cheat sheet",
      "how to write regular expressions",
      "regex pattern matching examples",
      "regex email validation pattern",
      "learn regex syntax step by step"
    ],
    toolSlug: "regex-tester",
    toolLabel: "Regex Tester",
    updated: "2026-09-13",
    intro: [
      "A Regular Expression (regex) is a sequence of characters that specifies a search pattern in text. Ubiquitous across software development, data parsing, form validation, and command-line search tools like grep, regex allows you to match complex textual rules with a single string.",
      "While regex syntax can appear cryptic at first glance, it is built on a few logical building blocks: literal characters, character classes, quantifiers, anchors, and capture groups.",
    ],
    steps: [
      {
        title: "Understand Character Classes & Shorthands",
        body:
          "`\\d` matches any digit (0-9). `\\w` matches any word character (letters, numbers, underscore). `\\s` matches whitespace (spaces, tabs, newlines). `.` matches any character except newline. Bracket notation `[a-z]` matches any lowercase letter.",
      },
      {
        title: "Master Quantifiers: How Many Times to Match",
        body:
          "`*` matches 0 or more times. `+` matches 1 or more times. `?` matches 0 or 1 time (optional). `{3}` matches exactly 3 times. `{2,5}` matches between 2 and 5 times. Quantifiers are greedy by default; append `?` (`*?`, `+?`) for non-greedy matching.",
      },
      {
        title: "Use Anchors to Bind Positions",
        body:
          "`^` matches the beginning of a line or string. `$` matches the end of a line or string. For example, `^\\d{5}$` validates that an entire string consists of exactly 5 digits (a US ZIP code) with no leading or trailing characters.",
      },
      {
        title: "Group and Capture Patterns with Parentheses",
        body:
          "Parentheses `(abc)` create a capture group, allowing you to apply quantifiers to blocks or extract matched substrings. Non-capturing groups `(?:abc)` group patterns without saving memory overhead.",
      },
    ],
    notes: [
      "Always escape special regex characters (`.`, `*`, `+`, `?`, `^`, `$`, `(`, `)`, `[`, `]`, `\\`, `/`) with a preceding backslash when matching them literally.",
      "The `i` flag enables case-insensitive matching; the `g` flag enables global matching across the entire text; the `m` flag enables multi-line mode.",
      "Avoid nested quantifiers like `(a+)+$` on untrusted inputs, as they can cause exponential catastrophic backtracking (ReDoS).",
      "Test your regular expressions in an interactive regex tester with live highlighting before deploying to production code.",
    ],
    faqs: [
      {
        question: "What is catastrophic backtracking (ReDoS)?",
        answer:
          "Catastrophic backtracking happens when a regex engine explores an exponential number of permutations on ambiguous patterns that fail to match, locking up the CPU thread.",
      },
      {
        question: "Can regex completely validate every valid RFC 5322 email address?",
        answer:
          "A 100% compliant RFC 5322 email regex is hundreds of characters long. In practice, a simpler regex verifying basic structure (`^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$`) combined with an email verification confirmation link is standard.",
      },
      {
        question: "What is the difference between positive and negative lookaheads?",
        answer:
          "A positive lookahead `(?=...)` asserts that a pattern must follow without consuming characters. A negative lookahead `(?!...)` asserts that a pattern must NOT follow.",
      },
      {
        question: "Why does `\\d` match different characters in different languages?",
        answer:
          "In JavaScript, `\\d` matches only ASCII digits `[0-9]`. In Python 3, `\\d` matches all Unicode digits (including Arabic, Devanagari numerals) unless the ASCII flag is specified.",
      },
    ],
  },
  {
    slug: "unit-conversion-formulas-metric-to-imperial-table",
    title: "Metric to imperial unit conversion formulas and reference",
    metaTitle: "Metric to Imperial Conversion Formulas Guide",
    metaDescription:
      "A comprehensive reference guide for converting length, mass, volume, and temperature between metric and imperial systems with exact mathematical ratios.",
    keywords: [
      "metric to imperial conversion formulas",
      "kg to lbs conversion formula",
      "celsius to fahrenheit formula",
      "meters to feet conversion ratio",
      "unit conversion reference table",
      "convert imperial to metric"
    ],
    toolSlug: "unit-converter",
    toolLabel: "Unit Converter",
    updated: "2026-09-13",
    intro: [
      "The metric system (SI) is based on decimal powers of ten, making conversions between centimeters, meters, and kilometers simple multiplication. The imperial and US customary systems, however, rely on historical fractional definitions (12 inches to a foot, 16 ounces to a pound, 4 quarts to a gallon).",
      "Converting accurately between these systems is crucial in international engineering, cooking, global trade, science, and travel. By international treaty since 1959, all imperial units are defined by exact metric equivalents.",
    ],
    steps: [
      {
        title: "Length & Distance Conversions",
        body:
          "1 inch is defined as exactly 2.54 cm. 1 foot = 12 inches = 0.3048 m. 1 yard = 3 feet = 0.9144 m. 1 mile = 1.609344 km. To convert km to miles: divide by 1.609344 (or multiply by 0.621371).",
      },
      {
        title: "Mass & Weight Conversions",
        body:
          "1 pound (lb) is legally defined as exactly 0.45359237 kg. 1 kilogram ≈ 2.20462 lbs. 1 ounce (oz) = 28.3495 grams. 1 metric ton = 1,000 kg ≈ 2,204.62 lbs.",
      },
      {
        title: "Temperature Conversions: The Offset Difference",
        body:
          "Because Fahrenheit and Celsius have different zero points and degree scaling: °F = (°C × 9/5) + 32. °C = (°F - 32) × 5/9. Water freezes at 0°C (32°F) and boils at 100°C (212°F). At -40°, both scales intersect.",
      },
      {
        title: "Liquid Volume Conversions",
        body:
          "1 US Fluid Gallon = 3.78541 Liters. 1 Imperial Gallon (UK) = 4.54609 Liters. 1 Liter = 33.814 US fl oz. When following international recipes, always verify whether liquid ounces refer to US or UK customary measurements.",
      },
    ],
    notes: [
      "Never mix US customary gallons (3.785 L) with UK imperial gallons (4.546 L); the UK gallon is roughly 20% larger.",
      "The pound-force is a unit of force, whereas the kilogram is a unit of mass. On Earth's surface, 1 kg experiences roughly 9.80665 Newtons of gravitational force.",
      "Scientific work should always use the SI base units: meters, kilograms, seconds, and Kelvin.",
      "For quick estimation while driving: 100 km/h is approximately 62 mph; 50 km/h is approximately 31 mph.",
    ],
    faqs: [
      {
        question: "Why is 1 inch exactly 2.54 cm?",
        answer:
          "In the 1959 International Yard and Pound Agreement, the United States, United Kingdom, Canada, Australia, and South Africa officially defined the international yard as 0.9144 meters, making 1 inch exactly 25.4 millimeters.",
      },
      {
        question: "Why does the temperature formula require adding or subtracting 32?",
        answer:
          "Daniel Gabriel Fahrenheit set 0°F at the freezing point of a concentrated brine solution, which puts the freezing point of pure water at 32°F, creating a 32-degree offset from Celsius.",
      },
      {
        question: "What is a nautical mile?",
        answer:
          "A nautical mile is based on the circumference of the Earth (one minute of latitude) and is internationally standardized at exactly 1,852 meters (approx. 1.1508 statute miles).",
      },
      {
        question: "How do I convert square meters to square feet?",
        answer:
          "Multiply square meters by 10.7639 (because (3.28084 ft)² ≈ 10.7639 ft²). For example, an 80 m² apartment is 80 × 10.7639 ≈ 861 sq ft.",
      },
    ],
  },
];

export function getGuideBySlug(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
