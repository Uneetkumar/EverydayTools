import { ToolFaq } from "./registry";

/**
 * Long-form editorial content, kept separate from the registry so the tool
 * definitions stay readable. Everything here is rendered as static HTML at
 * build time and exists to give each tool page real depth instead of the
 * ~380-word stub pages we shipped first.
 */
export interface ToolContent {
  /** Opening paragraph rendered above the tool. 2-4 sentences. */
  intro: string;
  /** Numbered walkthrough. Rendered as an <ol>. */
  howTo: {
    title: string;
    steps: string[];
  };
  /** Scenario-driven sections. Each becomes an <h3> + paragraph. */
  useCases: {
    title: string;
    body: string;
  }[];
  /** Short practical bullets. */
  tips: string[];
  /** Appended to the registry's own faqs. */
  extraFaqs: ToolFaq[];
}

export const TOOL_CONTENT: Record<string, ToolContent> = {
  "json-formatter": {
    intro:
      "Unformatted JSON is hard to scan and harder to debug — a single missing comma in a 2,000-line API response can cost you an afternoon. This formatter parses your JSON with the browser's native engine, reports the exact line and column of any syntax error, and re-indents the result so nested structures become obvious at a glance. Nothing is uploaded: the parse happens in your tab, which matters when the payload contains tokens, customer records, or anything else you would not paste into a random website.",
    howTo: {
      title: "How to format JSON online",
      steps: [
        "Paste your raw JSON into the input box, or drop a .json file onto it.",
        "Choose your indentation — 2 spaces, 4 spaces, or tabs — to match your project's style guide.",
        "Click Format. Valid JSON is re-indented instantly; invalid JSON stops at the first error with a line number.",
        "Fix any reported syntax error and re-run. The most common causes are trailing commas and single quotes instead of double quotes.",
        "Use Minify to strip all whitespace when you need the smallest possible payload, then copy the result.",
      ],
    },
    useCases: [
      {
        title: "Debugging API responses",
        body:
          "When an endpoint returns a wall of unbroken text, formatting it is the fastest way to confirm the shape of the response — whether a field is nested one level deeper than you expected, or whether an array came back empty rather than absent.",
      },
      {
        title: "Validating config files before deploy",
        body:
          "A malformed package.json, tsconfig.json, or CI config will fail your build minutes after you push. Validating locally first turns a failed pipeline into a five-second check.",
      },
      {
        title: "Shrinking payloads for production",
        body:
          "Minified JSON removes every byte of indentation and newline. On large embedded configuration blobs this routinely cuts 20–30% of the transfer size with no change in meaning.",
      },
    ],
    tips: [
      "JSON requires double quotes around keys and string values — single quotes are a syntax error, even though JavaScript accepts them.",
      "Trailing commas after the final element of an array or object are invalid JSON, though most linters allow them in JavaScript source.",
      "JSON has no comment syntax. If your file has // or /* */ comments, it is JSON5 or JSONC, not JSON.",
      "NaN and Infinity are not valid JSON values; they must be encoded as strings or null.",
    ],
    extraFaqs: [
      {
        question: "What is the difference between formatting and validating JSON?",
        answer:
          "Validating checks whether the text is legal JSON and reports errors. Formatting re-indents already-valid JSON for readability. This tool does both in one pass: it must parse successfully before it can re-print, so a successful format is also proof of validity.",
      },
      {
        question: "Why does my JSON fail with 'Unexpected token' errors?",
        answer:
          "In order of frequency: a trailing comma before a closing bracket, single quotes instead of double quotes, an unescaped newline or quote inside a string, or an unquoted object key. The reported line number points at where the parser gave up, which is usually one character after the real mistake.",
      },
      {
        question: "Is there a size limit on the JSON I can format?",
        answer:
          "The practical limit is your device's available memory, since the whole document is parsed in the tab. Files up to a few megabytes format essentially instantly; very large documents in the tens of megabytes may briefly freeze the tab while parsing.",
      },
      {
        question: "Does formatting change my data?",
        answer:
          "No. Formatting changes only whitespace. Key order is preserved, and values are re-serialized exactly as parsed. The one thing to be aware of is that JSON numbers beyond JavaScript's safe integer range lose precision on any round-trip, which is a property of JSON itself rather than this tool.",
      },
      {
        question: "Can I use this for JSON Lines or NDJSON?",
        answer:
          "Not directly — those formats put one independent JSON document per line, which is not a single valid JSON document. Format each line separately, or wrap the lines in an array first.",
      },
    ],
  },

  "percentage-calculator": {
    intro:
      "Percentages are simple arithmetic that almost everyone gets wrong under time pressure, usually by confusing 'percent of' with 'percent change' or by reversing the base. This calculator handles the four questions people actually ask — what is X% of Y, X is what percent of Y, what is the change from X to Y, and what number is X% of — and shows the working so you can check it rather than trust it.",
    howTo: {
      title: "How to calculate a percentage",
      steps: [
        "Pick the calculation type that matches your question. 'Percent of' answers 'what is 15% of 240'; 'percent change' answers 'sales went from 240 to 300, by how much did they grow'.",
        "Enter your two numbers. The labels update to tell you which value belongs in which field.",
        "Read the result along with the formula breakdown shown underneath.",
        "For percent change, check the sign: a negative result is a decrease, a positive result is an increase.",
      ],
    },
    useCases: [
      {
        title: "Working out a tip or a service charge",
        body:
          "A 15% tip on a 1,240 bill is 186, for a total of 1,426. Using 'percent of' gives the tip alone; adding it to the bill gives what you actually pay.",
      },
      {
        title: "Measuring growth between two periods",
        body:
          "If revenue moved from 84,000 to 97,000, percent change gives +15.48%. This is the number to quote in a report — the absolute difference of 13,000 means little without the base.",
      },
      {
        title: "Reverse-engineering a total from a part",
        body:
          "If 45 students represent 18% of a cohort, the full cohort is 250. This is the calculation people most often get backwards, because the instinct is to multiply rather than divide.",
      },
    ],
    tips: [
      "A percentage increase followed by the same percentage decrease does not return you to the start: +20% then −20% leaves you 4% down.",
      "Percentage points and percent are different. A rate moving from 4% to 6% is a rise of 2 percentage points, but a 50% increase.",
      "To add X% to a number in one step, multiply by (1 + X/100). To remove it, divide by (1 + X/100) — do not subtract X%.",
    ],
    extraFaqs: [
      {
        question: "How do I calculate percentage change between two numbers?",
        answer:
          "Subtract the old value from the new value, divide by the old value, then multiply by 100. Going from 240 to 300: (300 − 240) ÷ 240 × 100 = 25%. The old value is always the denominator — using the new value is the single most common error.",
      },
      {
        question: "How do I remove a percentage that has already been added?",
        answer:
          "Divide rather than subtract. If a price of 118 already includes 18% tax, the pre-tax price is 118 ÷ 1.18 = 100, not 118 − 18% = 96.76. Subtracting applies the percentage to the wrong base.",
      },
      {
        question: "What does it mean when a percentage is over 100%?",
        answer:
          "It simply means the part is larger than the base. Growing from 40 to 100 is a 150% increase. Values over 100% are perfectly valid for change and ratio calculations, though not for a share of a whole.",
      },
      {
        question: "How do I calculate a percentage in reverse?",
        answer:
          "If you know the result and the percentage, divide the result by the percentage expressed as a decimal. 45 being 18% of an unknown total gives 45 ÷ 0.18 = 250.",
      },
      {
        question: "Why do two successive discounts not add up?",
        answer:
          "Because the second discount applies to the already-reduced price. A 20% discount followed by a 10% discount is a total reduction of 28%, not 30%, since 0.8 × 0.9 = 0.72.",
      },
    ],
  },

  "word-counter": {
    intro:
      "Word and character limits are enforced almost everywhere — meta descriptions at 160 characters, tweets at 280, university essays at 2,000 words, SMS at 160 per segment. This counter updates as you type and separates the counts that people conflate: characters with and without spaces, words, sentences, paragraphs, and estimated reading time. Your text stays in the browser, so it is safe for unpublished drafts and confidential documents.",
    howTo: {
      title: "How to count words and characters",
      steps: [
        "Type directly into the text area, or paste an existing draft.",
        "Watch the counts update live — there is no button to press.",
        "Check the specific metric your limit is measured in. Character limits usually include spaces; word limits usually do not count numbers separately.",
        "Use the reading time estimate to sanity-check length for a talk or a blog post.",
      ],
    },
    useCases: [
      {
        title: "Writing to a strict academic limit",
        body:
          "Most institutions count every word in the body text but exclude the bibliography and footnotes. Paste only the section that counts toward the limit rather than the whole document.",
      },
      {
        title: "Fitting SEO meta descriptions",
        body:
          "Google truncates meta descriptions around 155–160 characters on desktop and less on mobile. Counting characters including spaces before you publish avoids a description that ends mid-sentence in search results.",
      },
      {
        title: "Estimating speaking time",
        body:
          "Conference talks are usually planned at 130–150 words per minute of speech. A 20-minute slot is roughly 2,600–3,000 words of script.",
      },
    ],
    tips: [
      "Reading time here assumes about 225 words per minute, which is average for adult silent reading of general prose. Technical material runs slower.",
      "Hyphenated compounds like 'state-of-the-art' count as one word in most style guides but as four in some word processors — check which convention your institution uses.",
      "SMS messages switch from 160 characters to 70 per segment the moment you include a single emoji or non-Latin character.",
    ],
    extraFaqs: [
      {
        question: "How many pages is 1,000 words?",
        answer:
          "Roughly two pages double-spaced or one page single-spaced, in 12pt Times New Roman with one-inch margins. Font, spacing, and margins all change this, so treat it as an estimate rather than a rule.",
      },
      {
        question: "Does the counter include spaces in the character count?",
        answer:
          "Both figures are shown separately. Use 'characters including spaces' for social media and meta tags, and 'excluding spaces' for the rare systems that measure that way.",
      },
      {
        question: "How is reading time calculated?",
        answer:
          "Total words divided by 225 words per minute, rounded to the nearest minute. This reflects average adult silent reading speed for general prose; dense technical or legal text is typically read at 100–150 words per minute.",
      },
      {
        question: "Is my text sent anywhere?",
        answer:
          "No. Counting runs entirely in your browser's JavaScript, and the text never leaves your device. Nothing is logged, stored, or transmitted, which makes this safe for unpublished manuscripts and confidential material.",
      },
      {
        question: "How does it count sentences and paragraphs?",
        answer:
          "Sentences are split on terminal punctuation — full stops, question marks, and exclamation marks — and paragraphs on blank lines. Abbreviations such as 'e.g.' can occasionally inflate the sentence count.",
      },
    ],
  },

  "password-generator": {
    intro:
      "The strength of a password comes from entropy, not from cleverness. 'P@ssw0rd!' looks complex to a human and takes a cracking rig milliseconds, while a random 16-character string resists offline attack for longer than the systems protecting it will exist. This generator uses the browser's cryptographically secure random source rather than Math.random(), so the output is genuinely unpredictable, and it never transmits or stores what it produces.",
    howTo: {
      title: "How to generate a strong password",
      steps: [
        "Set the length. 16 characters is a sensible default; go to 20 or more for password managers, email, and anything financial.",
        "Choose character sets. Keeping uppercase, lowercase, digits, and symbols all enabled maximises entropy per character.",
        "Generate, then copy the result straight into your password manager rather than a notes app or a spreadsheet.",
        "Never reuse it. The value of a unique random password is destroyed the moment it protects two accounts.",
      ],
    },
    useCases: [
      {
        title: "Seeding a password manager",
        body:
          "Once a manager holds your credentials, you never type them, so length costs you nothing. Generating 24–32 character passwords for every stored account is effectively free security.",
      },
      {
        title: "Creating service and API credentials",
        body:
          "Machine-to-machine credentials are never typed by a human either, which makes them the ideal case for maximum length with the full symbol set enabled.",
      },
      {
        title: "Producing a temporary password for a new user",
        body:
          "When issuing an initial credential that will be changed on first login, generate it randomly rather than using a predictable pattern like the person's name plus a year.",
      },
    ],
    tips: [
      "Length beats complexity. A 20-character lowercase-only password has more entropy than a 10-character password using every symbol on the keyboard.",
      "Some systems silently truncate passwords at 16 or 20 characters. If a long password fails to work on re-entry, truncation is the likely cause.",
      "Turn off ambiguous characters only if the password must be read aloud or typed from paper — it slightly reduces entropy per character.",
      "A generated password is only as safe as where you store it. Do not email it to yourself.",
    ],
    extraFaqs: [
      {
        question: "Are the generated passwords stored or transmitted?",
        answer:
          "No. Generation happens entirely in your browser using the Web Crypto API, and the result exists only in your tab's memory and clipboard. There is no server request, no logging, and nothing persisted after you close the page.",
      },
      {
        question: "What password length should I actually use?",
        answer:
          "16 characters is a strong general baseline. Use 20 or more for your password manager's master password, primary email, and banking. Below 12 characters, a mixed-character password is within reach of a determined offline attack against a leaked hash.",
      },
      {
        question: "Is a random password better than a passphrase?",
        answer:
          "Per character, yes; per unit of memorability, no. A five-word random passphrase is roughly as strong as a 12-character random string and far easier to remember, which makes passphrases the better choice for the handful of passwords you must type from memory. Use random strings for everything a manager will remember for you.",
      },
      {
        question: "How is this different from Math.random()?",
        answer:
          "Math.random() is a fast pseudo-random generator that is not designed to resist prediction — given enough output, its future values can be inferred. This tool uses crypto.getRandomValues(), which draws from the operating system's cryptographically secure entropy pool and carries no such weakness.",
      },
      {
        question: "Should I change my passwords regularly?",
        answer:
          "Current guidance from NIST says no — forced periodic rotation pushes people toward predictable variations like appending a number. Change a password when there is evidence of compromise, and otherwise rely on uniqueness and length.",
      },
    ],
  },

  "base64-converter": {
    intro:
      "Base64 encodes arbitrary bytes using 64 printable ASCII characters, which lets binary data survive channels that only accept text — email bodies, JSON fields, data URIs, HTTP headers. It is an encoding, not encryption: anyone can decode it instantly, and it offers no confidentiality whatsoever. This converter runs both directions in your browser, so credentials and tokens you decode for debugging never touch a server.",
    howTo: {
      title: "How to encode and decode Base64",
      steps: [
        "Choose a direction — Encode turns plain text into Base64, Decode turns Base64 back into text.",
        "Paste your input. Leading and trailing whitespace is ignored.",
        "Read the result and copy it. Conversion happens as you type.",
        "If decoding fails, check for missing '=' padding at the end or for URL-safe characters ('-' and '_') that need converting back to '+' and '/'.",
      ],
    },
    useCases: [
      {
        title: "Inspecting Basic Auth headers",
        body:
          "An 'Authorization: Basic' header is just base64 of 'username:password'. Decoding it while debugging shows immediately whether the client is sending the credentials you expect.",
      },
      {
        title: "Building data URIs",
        body:
          "Small images and fonts can be embedded directly in CSS or HTML as base64 data URIs, removing a network round trip at the cost of about 33% more bytes.",
      },
      {
        title: "Moving binary through JSON",
        body:
          "JSON has no binary type, so file contents are conventionally base64-encoded into a string field before transport and decoded on receipt.",
      },
    ],
    tips: [
      "Base64 inflates data by roughly 33%. Three bytes of input become four characters of output.",
      "A string whose length is not a multiple of four is either truncated or missing its '=' padding.",
      "URL-safe Base64 (RFC 4648 §5) swaps '+' for '-' and '/' for '_' so the result survives being placed in a URL. JWTs use this variant.",
      "Never treat Base64 as a security measure — it is trivially reversible by design.",
    ],
    extraFaqs: [
      {
        question: "Is Base64 encryption?",
        answer:
          "No, and this distinction matters. Base64 is a reversible encoding with no key and no secret. Anyone who sees the encoded string can recover the original in one step. Encoding a password in Base64 provides exactly zero protection.",
      },
      {
        question: "Why does my Base64 string end in one or two equals signs?",
        answer:
          "Base64 processes input in three-byte groups that map to four output characters. When the input length is not divisible by three, '=' characters pad the final group. One '=' means the input had two bytes left over; two '=' means one byte.",
      },
      {
        question: "Why does decoding produce garbled characters?",
        answer:
          "Usually because the original bytes were not UTF-8 text — decoding a PNG to a text field will always look like noise. It can also mean the string is URL-safe Base64 that needs its '-' and '_' characters translated first.",
      },
      {
        question: "Can I encode files as well as text?",
        answer:
          "This converter handles text input. For files, the same principle applies — the browser reads the bytes and emits the Base64 string — but note that the result is about a third larger than the file, so very large files produce unwieldy output.",
      },
      {
        question: "Does Base64 handle emoji and non-English text?",
        answer:
          "Yes. Text is converted to UTF-8 bytes before encoding, so any Unicode character round-trips correctly, including emoji, accented Latin, Devanagari, and CJK scripts.",
      },
    ],
  },

  "jwt-decoder": {
    intro:
      "A JSON Web Token is three Base64URL-encoded segments separated by dots: a header describing the signing algorithm, a payload of claims, and a signature. The first two are readable by anyone — a JWT is signed, not encrypted. This decoder splits and pretty-prints the header and payload so you can check claims like expiry, issuer, and audience while debugging an auth flow, entirely inside your browser.",
    howTo: {
      title: "How to decode a JWT",
      steps: [
        "Paste the full token, including both dots and all three segments.",
        "Read the decoded header to see the signing algorithm ('alg') and key id ('kid').",
        "Read the payload for the claims that matter: 'exp' for expiry, 'iat' for issue time, 'sub' for subject, 'iss' for issuer, and 'aud' for audience.",
        "Convert the numeric timestamps — they are Unix seconds, not milliseconds — to check whether the token has expired.",
      ],
    },
    useCases: [
      {
        title: "Diagnosing 401 responses",
        body:
          "When an API rejects a token, decoding it usually explains why immediately: the 'exp' claim is in the past, or the 'aud' does not match the service you are calling.",
      },
      {
        title: "Verifying what an identity provider actually issues",
        body:
          "OIDC providers vary in which claims they include. Decoding a real token is faster than reading the documentation to find out whether email or roles are present.",
      },
      {
        title: "Checking token lifetime during development",
        body:
          "Comparing 'iat' and 'exp' shows the configured lifetime, which is useful when a session expires sooner than expected.",
      },
    ],
    tips: [
      "'exp' and 'iat' are seconds since the Unix epoch. Multiply by 1000 before passing them to JavaScript's Date constructor.",
      "An 'alg' value of 'none' is a red flag — it indicates an unsigned token, which no production verifier should accept.",
      "Decoding is not verification. A decoded token that looks correct may still have an invalid signature.",
      "Never paste a production token belonging to a real user into an online decoder that sends data to a server. This one does not.",
    ],
    extraFaqs: [
      {
        question: "Does decoding a JWT verify its signature?",
        answer:
          "No, and this is the most important thing to understand about JWTs. Decoding only reverses the Base64URL encoding of the header and payload. Verifying the signature requires the issuer's secret or public key and must happen server-side. A token can decode perfectly and still be forged.",
      },
      {
        question: "Is it safe to paste a token here?",
        answer:
          "Decoding runs entirely in your browser and the token is never transmitted. That said, treat any live token as a credential — anyone holding it can act as that user until it expires, so avoid pasting production tokens into tools generally, and revoke any token you suspect has been exposed.",
      },
      {
        question: "Why is my JWT payload readable by anyone?",
        answer:
          "Because signed JWTs are designed for integrity, not confidentiality. The signature proves the payload was not altered; it does not hide it. Never place passwords, full card numbers, or other secrets in JWT claims. If you need confidentiality, use JWE rather than JWS.",
      },
      {
        question: "What do the standard claim names mean?",
        answer:
          "'iss' is the issuer, 'sub' the subject (usually a user id), 'aud' the intended audience, 'exp' the expiry time, 'nbf' the earliest valid time, 'iat' the issue time, and 'jti' a unique token id. Anything else is a custom claim defined by whoever issued the token.",
      },
      {
        question: "Why does my token have only two segments?",
        answer:
          "An unsecured JWT with 'alg: none' has an empty signature, producing a trailing dot with nothing after it. More often, a two-segment token means the string was truncated in transit — check for a length limit in whatever logged or copied it.",
      },
    ],
  },

  "uuid-generator": {
    intro:
      "A UUID is a 128-bit identifier you can generate independently on any machine with a vanishing probability of collision — no coordination, no central sequence, no database round trip. Version 4 UUIDs, the kind this tool produces, are 122 bits of randomness. That is enough that generating a billion per second for a century still leaves the odds of a duplicate negligible. Generation uses the browser's cryptographic random source and happens entirely on your device.",
    howTo: {
      title: "How to generate a UUID",
      steps: [
        "Choose how many identifiers you need — one for a quick test, or a batch for seeding fixtures.",
        "Click Generate. Each UUID appears in the canonical 8-4-4-4-12 hyphenated form.",
        "Copy an individual value, or copy the whole batch at once for pasting into a seed script.",
        "Regenerate freely; every click produces entirely fresh values.",
      ],
    },
    useCases: [
      {
        title: "Assigning primary keys before insert",
        body:
          "Generating the id client-side lets you build an entire object graph with valid references before anything reaches the database, which simplifies offline-first and optimistic-update patterns considerably.",
      },
      {
        title: "Correlating requests across services",
        body:
          "A UUID attached to an incoming request and propagated through every downstream call turns a distributed trace into a single greppable string.",
      },
      {
        title: "Naming uploaded files safely",
        body:
          "Storing an upload under a UUID rather than its original filename removes an entire class of path traversal and collision problems in one step.",
      },
    ],
    tips: [
      "Version 4 UUIDs are random, so they scatter across a B-tree index. On very large tables this hurts insert performance — UUIDv7, which is time-ordered, is the modern answer.",
      "UUIDs are case-insensitive by specification but conventionally written in lowercase. Normalise before comparing as strings.",
      "Stored as text a UUID is 36 characters; stored as a native binary or uuid column it is 16 bytes. On large tables that difference is worth having.",
      "Do not treat a UUID as a secret. It is unguessable, but it is not an access control mechanism.",
    ],
    extraFaqs: [
      {
        question: "What is the chance two UUIDs collide?",
        answer:
          "Negligible in any realistic system. You would need to generate roughly 2.7 × 10^18 version 4 UUIDs before reaching a 50% chance of a single collision. For comparison, that is more identifiers than there are grains of sand on Earth.",
      },
      {
        question: "What is the difference between UUID v1, v4, and v7?",
        answer:
          "Version 1 derives from a timestamp and the machine's MAC address, which makes it sortable but leaks hardware information. Version 4 is purely random and leaks nothing, which is why it is the common default. Version 7 is a newer standard combining a timestamp prefix with randomness, giving you both database-friendly ordering and privacy. This tool generates version 4.",
      },
      {
        question: "Can I use UUIDs as database primary keys?",
        answer:
          "Yes, and it is common. The trade-off is index locality: random v4 values insert all over the index rather than at the end, which increases page splits on very high-volume tables. Store them in a native uuid or binary(16) column rather than as text, and consider UUIDv7 if insert throughput is a concern.",
      },
      {
        question: "Are these UUIDs cryptographically secure?",
        answer:
          "They are generated from crypto.getRandomValues(), the browser's cryptographically secure random source, so the values are unpredictable. That still does not make a UUID a suitable secret or session token on its own, because UUIDs routinely end up in logs, URLs, and analytics.",
      },
      {
        question: "Why do all version 4 UUIDs have a 4 in the same position?",
        answer:
          "The 13th hexadecimal digit is fixed to '4' to identify the version, and the 17th is constrained to 8, 9, a, or b to encode the variant. Those six bits are why a v4 UUID carries 122 bits of randomness rather than the full 128.",
      },
    ],
  },

  "url-encoder-decoder": {
    intro:
      "URLs may only contain a restricted set of ASCII characters, so anything else — spaces, ampersands, accented letters, emoji — must be percent-encoded to survive the trip. Get this wrong and a query parameter silently truncates at the first '&', or a redirect drops half its target. This tool encodes and decodes both full URLs and individual components, so you can pick the behaviour you actually need.",
    howTo: {
      title: "How to encode or decode a URL",
      steps: [
        "Choose Encode to make text safe for a URL, or Decode to turn percent-escapes back into readable characters.",
        "Decide whether you are handling a whole URL or a single parameter value — this matters, because a full URL must keep its ':', '/', and '?' intact while a parameter value must escape them.",
        "Paste your input and read the converted result.",
        "Check the output for '%25' sequences, which indicate the input was already encoded once.",
      ],
    },
    useCases: [
      {
        title: "Building query strings safely",
        body:
          "A search term containing '&' or '=' will break the parameter it sits in unless encoded. Encoding the value — not the whole URL — is the correct fix.",
      },
      {
        title: "Passing a URL as a parameter",
        body:
          "Redirect and callback parameters carry one URL inside another. The inner URL must be fully component-encoded, turning '://' into '%3A%2F%2F', or the outer URL's parser will misread it.",
      },
      {
        title: "Reading encoded links from logs",
        body:
          "Analytics and server logs store URLs encoded. Decoding makes it obvious what a user actually searched for or which campaign parameters were attached.",
      },
    ],
    tips: [
      "Spaces become '%20' in paths but may appear as '+' in query strings — both decode to a space, but only in the query component.",
      "Encoding an already-encoded string double-encodes it: '%20' becomes '%2520'. If you see '%25' in output you did not expect, that is the symptom.",
      "The characters - _ . ~ are unreserved and never need encoding.",
      "Fragment identifiers after '#' are never sent to the server, so encoding problems there are purely client-side.",
    ],
    extraFaqs: [
      {
        question: "What is the difference between encodeURI and encodeURIComponent?",
        answer:
          "encodeURI is for a complete URL and deliberately leaves structural characters like ':', '/', '?', and '#' alone so the URL stays valid. encodeURIComponent is for a single piece — one parameter value or path segment — and escapes those characters too. Using the wrong one is the most common source of broken links: encode a full URL with encodeURI, encode a value going into a parameter with encodeURIComponent.",
      },
      {
        question: "Why does my encoded URL have %2520 in it?",
        answer:
          "That is a double-encoded space. The text was encoded twice: ' ' became '%20', then the '%' in '%20' was itself encoded to '%25', producing '%2520'. Decode once and re-encode a single time to fix it.",
      },
      {
        question: "Do I need to encode non-English characters?",
        answer:
          "Yes for transmission, though modern browsers hide this. Characters outside ASCII are converted to UTF-8 bytes and each byte is percent-encoded, so 'é' becomes '%C3%A9'. The address bar displays the readable form while sending the encoded one.",
      },
      {
        question: "Should spaces be %20 or +?",
        answer:
          "'%20' is correct everywhere and always safe. '+' means a space only within the query string, under the older form-encoding rules. In a path segment, '+' is a literal plus sign — which is exactly why email addresses with '+' in them so often break.",
      },
      {
        question: "Is there a maximum URL length?",
        answer:
          "The specification sets no limit, but implementations do. Roughly 2,000 characters is the practical safe ceiling across browsers, servers, and proxies. Since encoding expands the string, a URL that fits before encoding may not after.",
      },
    ],
  },

  "qr-code-generator": {
    intro:
      "A QR code is a two-dimensional barcode that stores text — a URL, contact details, Wi-Fi credentials, a payment string — in a grid that any phone camera can read in a fraction of a second. This generator builds the code entirely in your browser and lets you download it at high resolution, which matters because a QR code scaled up from a low-resolution export will not scan reliably in print.",
    howTo: {
      title: "How to create a QR code",
      steps: [
        "Enter the content you want encoded. For a website, include the full https:// prefix so scanners open it directly rather than treating it as plain text.",
        "Adjust size and error-correction level if needed. Higher error correction survives damage and partial obstruction at the cost of a denser code.",
        "Preview the result and test it with your own phone camera before doing anything else.",
        "Download the image at the largest size offered, then scale down for your medium rather than scaling a small export up.",
      ],
    },
    useCases: [
      {
        title: "Printed marketing material",
        body:
          "Posters, flyers, and packaging use QR codes to bridge print and web. Print at a minimum of 2 × 2 cm for close-range scanning, and considerably larger for anything read from a distance.",
      },
      {
        title: "Sharing Wi-Fi access",
        body:
          "A Wi-Fi QR code lets guests join without typing a long passphrase. The encoded string follows the format WIFI:S:NetworkName;T:WPA;P:Password;; — note that anyone who photographs the code has your password permanently.",
      },
      {
        title: "Menus, tickets, and event check-in",
        body:
          "A code linking to a hosted page keeps the destination updatable after printing, which a code encoding the content directly cannot do.",
      },
    ],
    tips: [
      "Keep a quiet zone — clear margin — of at least four modules around the code. Codes cropped tight to the edge frequently fail to scan.",
      "Maintain strong contrast, with a dark code on a light background. Inverted codes are not reliably read by all scanners.",
      "Shorter content produces a less dense code that scans faster and from further away. Shorten long URLs before encoding.",
      "Always test the printed code, not just the screen version. Ink bleed on uncoated stock can close the gaps between modules.",
    ],
    extraFaqs: [
      {
        question: "Do these QR codes expire?",
        answer:
          "No. The code is a static image encoding your content directly, with no redirect service in between and no account tied to it. It will scan for as long as the image exists. The trade-off is that the destination cannot be changed after printing — if you need that, encode a URL you control and change where it points.",
      },
      {
        question: "What error correction level should I choose?",
        answer:
          "Level M (about 15% recovery) suits most screen and print use. Choose Q or H (25% and 30%) when the code will be printed small, placed on a curved surface, exposed to wear, or overlaid with a logo. Higher levels make the code denser, so do not use H by default.",
      },
      {
        question: "How much data can a QR code hold?",
        answer:
          "Up to about 4,296 alphanumeric characters or 7,089 digits at maximum size with minimum error correction. In practice, staying under roughly 300 characters keeps the code sparse enough to scan quickly with an ordinary phone camera.",
      },
      {
        question: "Can I put a logo in the middle?",
        answer:
          "Yes, if you raise the error correction level to Q or H first and keep the logo under about 20% of the code's area, centred. Always re-test after adding it — a logo that covers a positioning marker in a corner will break the code entirely.",
      },
      {
        question: "Is the QR code generated privately?",
        answer:
          "Yes. Encoding happens in your browser and the content you enter is never sent to a server. That matters for Wi-Fi passwords and anything else you would not want logged by a third-party generator.",
      },
    ],
  },

  "image-compressor": {
    intro:
      "Large images are the single biggest cause of slow pages and rejected uploads. Compressing an image trades a small amount of visual fidelity for a large reduction in file size, and for photographs the trade is usually invisible — a 4 MB phone photo commonly drops below 400 KB with no difference you can see at normal viewing size. This compressor uses the browser's own canvas encoder, so your images are never uploaded anywhere.",
    howTo: {
      title: "How to compress an image",
      steps: [
        "Select or drag in your image. JPEG, PNG, and WebP inputs are all supported.",
        "Set a target — either a quality level or a maximum file size such as 50 KB, 100 KB, or 200 KB.",
        "Optionally reduce the pixel dimensions. This is usually the largest single saving, since a 4000px-wide photo displayed at 800px is carrying 25 times the pixels it needs.",
        "Compare the preview against the original at full size, then download the result.",
      ],
    },
    useCases: [
      {
        title: "Meeting a strict upload limit",
        body:
          "Application portals, exam registrations, and government forms frequently cap photographs at 50 KB or 100 KB. Targeting the size directly gets you under the limit without repeated trial and error.",
      },
      {
        title: "Speeding up a website",
        body:
          "Images typically account for most of a page's transferred bytes. Compressing them is the highest-leverage change available for Largest Contentful Paint, which is a direct Google ranking signal.",
      },
      {
        title: "Attaching photos to email",
        body:
          "Most mail servers reject attachments over 20–25 MB. Compressing a set of photos usually brings a whole batch comfortably under the limit in one pass.",
      },
    ],
    tips: [
      "Resize before you compress. Cutting dimensions in half removes three-quarters of the pixels and dwarfs anything quality settings alone will achieve.",
      "JPEG quality 80 is the usual sweet spot for photographs — below about 60, blocking artefacts become visible around edges.",
      "PNG is lossless and suits screenshots, logos, and line art. Photographs saved as PNG are typically several times larger than they need to be.",
      "Compression is not reversible. Keep your originals, and never re-compress an already-compressed file repeatedly.",
    ],
    extraFaqs: [
      {
        question: "How do I compress an image to exactly 50 KB?",
        answer:
          "Set 50 KB as the target size and let the tool search for the quality level that lands under it. If the result looks poor, reduce the pixel dimensions first — at a smaller size, far less aggressive compression is needed to hit the same byte count.",
      },
      {
        question: "Will compressing reduce the visible quality?",
        answer:
          "Some quality is always discarded, but at moderate settings the loss is imperceptible at normal viewing sizes. Photographs tolerate this well. Screenshots, text, and sharp-edged graphics show artefacts much sooner, so use PNG or a high quality setting for those.",
      },
      {
        question: "Are my images uploaded to a server?",
        answer:
          "No. The file is read into your browser, drawn to a canvas, and re-encoded locally. Nothing is transmitted, which makes this usable for identity documents, medical images, and anything else you would not upload to an unknown service.",
      },
      {
        question: "Why is my PNG barely getting smaller?",
        answer:
          "PNG uses lossless compression, so there is a hard floor on how far it can shrink. If the image is a photograph, converting it to JPEG or WebP will reduce it dramatically. If it needs transparency, WebP keeps the alpha channel while compressing far better than PNG.",
      },
      {
        question: "Does compressing strip EXIF metadata?",
        answer:
          "Yes. Re-encoding through canvas discards EXIF, which removes GPS coordinates, camera model, and timestamps. That is a privacy benefit when sharing photos publicly, but worth knowing if you rely on that metadata.",
      },
    ],
  },

  "image-to-pdf": {
    intro:
      "Converting images to PDF turns a scattered set of photographs or scans into one document that opens identically on every device, prints predictably, and can be attached as a single file. This converter assembles your images into a PDF entirely inside the browser using pdf-lib, so scanned identity documents, contracts, and medical records never leave your device — which is precisely the category of file people most often convert.",
    howTo: {
      title: "How to convert images to PDF",
      steps: [
        "Add your images. Multiple files can be selected at once, and each becomes a page.",
        "Reorder the pages by dragging until the sequence is correct.",
        "Choose page size and orientation — A4 portrait for documents, or fit-to-image to preserve exact proportions.",
        "Generate and download. The PDF is built in your browser and saved directly to your device.",
      ],
    },
    useCases: [
      {
        title: "Submitting scanned documents",
        body:
          "Visa applications, university admissions, and bank onboarding almost always require a single PDF rather than loose images. Combining photographs of each page produces exactly what the portal expects.",
      },
      {
        title: "Turning whiteboard photos into notes",
        body:
          "A meeting's worth of whiteboard shots becomes one shareable document, in order, rather than a dozen images that arrive out of sequence in a chat thread.",
      },
      {
        title: "Archiving receipts for expenses",
        body:
          "Finance teams generally want one PDF per claim. Batching a month of receipt photographs into a single document takes seconds.",
      },
    ],
    tips: [
      "Crop and straighten before converting. A skewed photograph stays skewed in the PDF, and cropping away the desk around a document sharply reduces file size.",
      "Compress large photographs first if the PDF will be emailed — a dozen full-resolution phone photos easily exceeds a 25 MB attachment limit.",
      "Use A4 or Letter page size when the document will be printed; use fit-to-image when preserving the exact aspect ratio matters more.",
      "Check the page order in the preview before downloading. Reordering after the fact means starting again.",
    ],
    extraFaqs: [
      {
        question: "Are my images uploaded to a server?",
        answer:
          "No. The PDF is assembled in your browser with pdf-lib and written straight to your downloads folder. Nothing is transmitted or stored remotely, which is the main reason to use a client-side converter for passports, certificates, and financial documents.",
      },
      {
        question: "How many images can I combine into one PDF?",
        answer:
          "There is no fixed limit — the constraint is your device's memory, since every image is held in the tab while the document is built. Batches of 20–50 photographs are routine; several hundred high-resolution images may make the tab sluggish.",
      },
      {
        question: "Will the PDF be searchable?",
        answer:
          "No. Each page is an image, so the text within it is pixels rather than characters. Making it searchable requires OCR, which is a separate process. For a document you need to search or copy from, converting the original file is better than photographing it.",
      },
      {
        question: "Why is my PDF so large?",
        answer:
          "Because it contains the images at their original resolution — a modern phone camera produces 3–5 MB per shot, so ten pages is 30–50 MB. Compressing the images before conversion, or reducing their dimensions, is the fix.",
      },
      {
        question: "Which image formats are supported?",
        answer:
          "JPEG and PNG are embedded directly. Other formats the browser can decode, including WebP, are converted first. HEIC files from iPhones may need converting to JPEG beforehand, since browser support for HEIC decoding is still inconsistent.",
      },
    ],
  },

  "pdf-to-word": {
    intro:
      "PDFs are designed to look identical everywhere, which is exactly what makes them awkward to edit — the format stores positioned glyphs rather than paragraphs. Converting to Word extracts that text back into an editable document. This converter reads the PDF with pdf.js and writes a .docx in your browser, so contracts and reports are never uploaded to a third-party service.",
    howTo: {
      title: "How to convert a PDF to Word",
      steps: [
        "Select your PDF file. Text-based PDFs convert well; scanned pages do not, since they contain no text layer.",
        "Wait while each page's text layer is extracted — larger documents take a few seconds per page.",
        "Download the resulting .docx and open it in Word, Google Docs, or LibreOffice.",
        "Review the formatting. Expect to fix column breaks and table layout by hand; the text itself should transfer accurately.",
      ],
    },
    useCases: [
      {
        title: "Editing a contract you only have as a PDF",
        body:
          "Redlining requires editable text. Converting lets you make tracked changes and return a marked-up version rather than annotating a static file.",
      },
      {
        title: "Reusing content from a report",
        body:
          "Pulling several pages of text out of a PDF for a new document is far faster than retyping, and avoids transcription errors in figures.",
      },
      {
        title: "Translating or reformatting a document",
        body:
          "Translation tools and templates work on editable text. Converting is the necessary first step before either.",
      },
    ],
    tips: [
      "Check whether your PDF has a real text layer by trying to select text in a PDF reader. If you cannot select it, the page is an image and conversion will produce an empty document.",
      "Complex multi-column layouts and tables are where converters struggle most — plan to fix those manually.",
      "Password-protected PDFs must be unlocked before conversion.",
      "Fonts not installed on your machine will be substituted by Word, which changes line breaks even when the text is correct.",
    ],
    extraFaqs: [
      {
        question: "Why is my converted document empty?",
        answer:
          "Almost certainly because the PDF is a scan — a photograph of a page wrapped in a PDF container, with no text layer to extract. Optical character recognition is required to convert those, which is a fundamentally different process from text extraction.",
      },
      {
        question: "Will the layout be preserved exactly?",
        answer:
          "The text will be accurate; the layout will be approximate. PDFs position individual glyphs rather than storing paragraphs, tables, or columns as structures, so those have to be inferred. Simple single-column documents convert cleanly. Multi-column layouts, complex tables, and text wrapped around images usually need manual repair.",
      },
      {
        question: "Is my PDF uploaded anywhere?",
        answer:
          "No. Extraction runs in your browser using pdf.js, and the .docx is generated locally. The file never leaves your device — which is the reason to prefer this over a server-based converter for anything confidential.",
      },
      {
        question: "Can I convert a password-protected PDF?",
        answer:
          "Not while it is protected. Remove the password first using a PDF unlock tool with the password you are entitled to use, then convert the unprotected file.",
      },
      {
        question: "Are images in the PDF carried over?",
        answer:
          "This converter focuses on the text layer, so embedded images are generally not transferred. For a document that is mostly images with captions, extracting the images separately and rebuilding the document is usually faster than repairing a conversion.",
      },
    ],
  },

  "watermark-remover": {
    intro:
      "Removing a watermark from an image means reconstructing what was underneath it, and that information is genuinely gone — no tool can recover pixels the file never stored. What this eraser does is inpainting: you brush over the watermark and the surrounding pixels are blended inward to fill the gap. Over an even background such as sky, a wall, or paper the result is usually indistinguishable. Over busy detail it will look smudged, because there is nothing else to rebuild from. Everything runs on a canvas in your browser, so the image is never uploaded.",
    howTo: {
      title: "How to remove a watermark from an image",
      steps: [
        "Upload the image you own or have permission to edit.",
        "Set a brush size a little larger than the thickness of the watermark strokes — big enough to cover it, small enough not to eat surrounding detail.",
        "Brush over the watermark. Each pass blends in colours sampled from just outside the brush, so short strokes over an even background work better than one large sweep.",
        "Use Undo to step back a stroke, or Reset to return to the original image if a pass goes wrong.",
        "Download the cleaned image as a PNG.",
      ],
    },
    useCases: [
      {
        title: "Erasing a camera timestamp",
        body:
          "Date stamps burned into the corner of an old photograph usually sit over sky, grass, or a plain surface, which is the ideal case for inpainting — the fill has consistent surrounding colour to draw from.",
      },
      {
        title: "Cleaning up your own exported images",
        body:
          "Trial versions of design software stamp their output. If you have since licensed the software, removing the stamp from your own past exports saves regenerating them.",
      },
      {
        title: "Removing a stray object or blemish",
        body:
          "The same brush works for anything small and unwanted — a power line against sky, a mark on a scanned document, a spot on a wall.",
      },
    ],
    tips: [
      "Work in short strokes rather than one long drag. Each dab samples fresh surrounding colour, so several small passes blend better than one big one.",
      "Match the brush to the watermark. A brush much larger than the mark destroys detail around it that did not need replacing.",
      "Inpainting cannot invent texture. Over a face, patterned fabric, or dense foliage the filled area will read as a smudge no matter how carefully you brush.",
      "Zoom your browser in before working on a small watermark — the brush maps to image pixels, so a larger view gives finer control.",
      "Only remove watermarks from images you own or are licensed to modify.",
    ],
    extraFaqs: [
      {
        question: "Is it legal to remove a watermark?",
        answer:
          "It depends entirely on the image. Removing a timestamp from your own photograph, or a trial-software stamp from output you have since licensed, is ordinary editing. Removing a photographer's or stock library's watermark in order to use or publish their work is copyright infringement, and in many jurisdictions stripping rights-management information is a separate offence on top of it. Use this on images you own or have permission to modify.",
      },
      {
        question: "Why does the erased area look blurry or smudged?",
        answer:
          "Because inpainting reconstructs from surrounding pixels, and that is all the information available. Over an even background the reconstruction is convincing. Over detailed texture — hair, foliage, patterned fabric — there is no way to infer what the watermark covered, so the fill reads as a smooth patch. This is a limit of the technique, not a setting you can turn up.",
      },
      {
        question: "Can it remove a watermark covering the whole image?",
        answer:
          "Not usefully. Large diagonal watermarks spanning the full frame overlap too much varied content, so brushing them out replaces most of the picture with blended colour. Tools claiming to do this cleanly are generating plausible content rather than recovering the original.",
      },
      {
        question: "Is my image uploaded to a server?",
        answer:
          "No. The image is drawn to a canvas in your browser and every edit happens there. Nothing is transmitted, and the cleaned PNG is written straight to your downloads folder.",
      },
      {
        question: "Does it work on a phone or tablet?",
        answer:
          "Yes. The brush uses pointer events, so touch and stylus input work the same as a mouse, and the page will not scroll while you are brushing on the canvas.",
      },
      {
        question: "Why is the download a PNG when I uploaded a JPEG?",
        answer:
          "PNG is lossless, so the edit is saved without adding a fresh round of JPEG compression artefacts on top of the ones already there. If you need a smaller file, run the result through an image compressor afterwards.",
      },
    ],
  },

  "png-to-jpg": {
    intro:
      "PNG and JPEG solve different problems. PNG is lossless and supports transparency, which makes it right for logos, screenshots, and line art. JPEG is lossy and usually produces files several times smaller for photographs. Converting a photograph from PNG to JPEG is one of the easiest large file-size wins available — and this converter does it in your browser, with no upload.",
    howTo: {
      title: "How to convert PNG to JPG",
      steps: [
        "Select the PNG file, or several at once for batch conversion.",
        "Choose a JPEG quality level. 80–85 is the usual balance between size and fidelity.",
        "Pick a background colour if the PNG has transparency — JPEG cannot store an alpha channel, so transparent areas must be filled with something.",
        "Convert and download. Your original PNG is untouched.",
      ],
    },
    useCases: [
      {
        title: "Shrinking photographs saved as PNG",
        body:
          "A screenshot tool or a camera app set to PNG produces files many times larger than necessary for photographic content. Converting typically cuts 70–90% of the size with no visible difference.",
      },
      {
        title: "Meeting upload format requirements",
        body:
          "Many forms and older systems accept JPEG only. Converting is often the whole fix for a rejected upload.",
      },
      {
        title: "Reducing page weight on a website",
        body:
          "Photographic content served as PNG is one of the most common causes of a poor Largest Contentful Paint score. Converting is a one-step improvement.",
      },
    ],
    tips: [
      "Do not convert screenshots containing text — JPEG compression produces visible ringing around sharp edges. Keep those as PNG.",
      "Transparency is lost permanently. Decide on the background colour deliberately; white is the usual default but is wrong on a dark page.",
      "JPEG is lossy, so each save discards more information. Convert from the original PNG rather than re-saving a JPEG repeatedly.",
      "If you need both small files and transparency, WebP does both and is supported by every current browser.",
    ],
    extraFaqs: [
      {
        question: "What happens to transparency when converting PNG to JPG?",
        answer:
          "It is lost, because JPEG has no alpha channel. Every transparent pixel is replaced with the background colour you choose. If the original had a soft transparent shadow, that shadow will now blend into that flat colour, which looks wrong on any other background. When transparency matters, convert to WebP instead.",
      },
      {
        question: "Will converting reduce image quality?",
        answer:
          "Slightly, since JPEG is lossy. At quality 80–85 the loss is imperceptible in photographs. It is very visible in screenshots, diagrams, and anything with sharp text edges, where JPEG introduces halos that PNG does not.",
      },
      {
        question: "How much smaller will the JPEG be?",
        answer:
          "For photographic content, typically 70–90% smaller. For flat-colour graphics, logos, or screenshots, JPEG may actually produce a larger file than PNG while also looking worse — PNG compresses large areas of uniform colour extremely efficiently.",
      },
      {
        question: "Is JPG the same as JPEG?",
        answer:
          "Yes, identical. The three-letter extension is a holdover from MS-DOS filename limits. Both refer to the same format, and no system distinguishes between them today.",
      },
      {
        question: "Are my files uploaded during conversion?",
        answer:
          "No. Conversion happens on a canvas element in your browser. The image is never transmitted, so this is safe for private photographs and documents.",
      },
    ],
  },

  "unlock-pdf": {
    intro:
      "PDFs carry two different kinds of password. An owner password restricts what you may do — printing, copying, editing — while still letting anyone open the file. A user password encrypts the document so it cannot be opened at all without it. This tool removes protection from PDFs you are entitled to unlock, working entirely in your browser so the document and its password never reach a server.",
    howTo: {
      title: "How to unlock a PDF",
      steps: [
        "Upload the protected PDF.",
        "Enter the password if the document requires one to open. Permission-only restrictions may not need a password at all.",
        "Let the tool decrypt and rewrite the document without its restrictions.",
        "Download the unlocked copy. Your original file is unchanged.",
      ],
    },
    useCases: [
      {
        title: "Printing a statement you are entitled to",
        body:
          "Banks and utilities routinely issue statements with printing and copying disabled. Removing that restriction on your own statement makes it usable for a mortgage application or an expense claim.",
      },
      {
        title: "Combining protected documents",
        body:
          "Merge and split tools cannot process an encrypted PDF. Unlocking first is a prerequisite for almost any further editing.",
      },
      {
        title: "Making a document accessible",
        body:
          "Copy restrictions also block screen readers from extracting text. Removing them is often what makes a document usable for someone relying on assistive technology.",
      },
    ],
    tips: [
      "If you do not know the user password, no tool can open the document — it is genuinely encrypted, and that is the point.",
      "Keep the original protected file. Unlocking produces a new copy rather than modifying the source.",
      "An unlocked PDF has no restrictions at all, so be deliberate about where you store and send it.",
      "Only unlock documents you own or have permission to unlock.",
    ],
    extraFaqs: [
      {
        question: "Can this recover a password I have forgotten?",
        answer:
          "No. This tool removes restrictions from a document you can already open, or decrypts one using a password you supply. It does not crack or guess passwords. A PDF encrypted with a strong user password and no known password is not practically recoverable, which is exactly what encryption is for.",
      },
      {
        question: "What is the difference between the two PDF password types?",
        answer:
          "A user password (or open password) encrypts the file so it cannot be opened without it. An owner password (or permissions password) leaves the file readable but marks operations like printing and copying as disallowed — a restriction most readers voluntarily honour rather than one enforced by cryptography. Owner restrictions are therefore removable; user encryption is not, without the password.",
      },
      {
        question: "Is it legal to unlock a PDF?",
        answer:
          "For documents you own or are authorised to use, removing restrictions is ordinary file handling — printing your own bank statement, for instance. Circumventing protection on someone else's copyrighted document to redistribute it is a different matter and is restricted in most jurisdictions. Use this on documents you have the right to unlock.",
      },
      {
        question: "Is my password sent anywhere?",
        answer:
          "No. Decryption happens in your browser, and neither the file nor the password is transmitted. This is the main reason to avoid server-based unlock services for sensitive documents — those necessarily receive both.",
      },
      {
        question: "Will unlocking change the document's contents?",
        answer:
          "No. Text, images, and layout are preserved exactly. Only the encryption and permission flags are removed.",
      },
    ],
  },

  "crop-image": {
    intro:
      "Cropping removes everything outside a chosen rectangle — tightening composition, cutting out background clutter, or forcing an image to the exact aspect ratio a platform demands. Because cropping discards pixels rather than resampling them, the part you keep stays at its original quality. This cropper runs on canvas in your browser, so nothing is uploaded.",
    howTo: {
      title: "How to crop an image online",
      steps: [
        "Upload your image or drag it onto the canvas.",
        "Drag the crop handles to frame the area you want, or pick a fixed aspect ratio such as 1:1, 4:5, or 16:9.",
        "Fine-tune the edges — the preview shows exactly what will be kept.",
        "Apply the crop and download. The original file is not modified.",
      ],
    },
    useCases: [
      {
        title: "Preparing profile and cover photos",
        body:
          "Every platform enforces its own ratio. Cropping to 1:1 for a profile picture or 16:9 for a cover means the platform's own automatic crop never cuts off someone's head.",
      },
      {
        title: "Trimming scanned documents",
        body:
          "Cropping away the desk and shadow around a photographed document both improves legibility and substantially reduces file size before converting to PDF.",
      },
      {
        title: "Improving composition",
        body:
          "Cropping is the most effective single edit available for most photographs — removing dead space at the edges usually does more than any filter.",
      },
    ],
    tips: [
      "Crop before resizing. Cropping first means the resize operates only on pixels you are keeping.",
      "Check the output dimensions after cropping — a heavy crop of an already-small image can leave it too small to print or display sharply.",
      "Common ratios worth knowing: 1:1 for profile images, 4:5 for portrait social posts, 16:9 for video and cover images, 3:2 for standard photo prints.",
      "Cropping discards data permanently. Work from a copy if you may want the full frame later.",
    ],
    extraFaqs: [
      {
        question: "Does cropping reduce image quality?",
        answer:
          "No. Cropping removes pixels outside the selection but leaves the remaining pixels untouched at their original resolution. What changes is the total dimensions — crop tightly enough and the result may be too small for your intended use, which is a size problem rather than a quality one.",
      },
      {
        question: "What is the difference between cropping and resizing?",
        answer:
          "Cropping removes part of the image and keeps the rest at original quality. Resizing keeps the whole image and changes its pixel dimensions, which requires resampling and does soften detail when enlarging. They are often used together — crop for composition, then resize to target dimensions.",
      },
      {
        question: "How do I crop to an exact pixel size?",
        answer:
          "Use a fixed aspect ratio to constrain the shape, then check the reported output dimensions as you drag. If you need precise pixel dimensions larger than the crop can provide, crop to the correct ratio first and resize afterwards.",
      },
      {
        question: "Is my image uploaded to crop it?",
        answer:
          "No. The image is loaded into a canvas element in your browser and cropped locally. Nothing is transmitted or stored.",
      },
      {
        question: "Which formats can I crop?",
        answer:
          "Any format your browser can decode, including JPEG, PNG, WebP, and GIF. Note that cropping an animated GIF produces a static image, since the canvas captures a single frame.",
      },
    ],
  },

  "pdf-merge": {
    intro:
      "Merging combines several PDFs into one document with pages in the order you choose. It is the fix for the very common situation where a form, an application, or a submission portal accepts exactly one file and you have six. This merger uses pdf-lib in your browser, so contracts, statements, and identity documents are assembled locally and never uploaded.",
    howTo: {
      title: "How to merge PDF files",
      steps: [
        "Add all the PDFs you want to combine — select several at once, or add them one at a time.",
        "Drag to reorder until the sequence is right. Pages appear in the final document in exactly this order.",
        "Remove any file you added by mistake.",
        "Merge and download the combined PDF.",
      ],
    },
    useCases: [
      {
        title: "Assembling an application pack",
        body:
          "Visa, loan, and admissions portals frequently accept one attachment. Merging a passport scan, proof of address, and supporting letters produces the single file they require.",
      },
      {
        title: "Combining chapters or sections",
        body:
          "Reports written in parts by different people end up as separate exports. Merging produces the deliverable with continuous page flow.",
      },
      {
        title: "Consolidating monthly statements",
        body:
          "Twelve monthly PDFs become one annual document, which is far easier to archive and to send to an accountant.",
      },
    ],
    tips: [
      "Unlock any password-protected PDF before merging — encrypted files cannot be read by the merger.",
      "Page sizes are preserved per source document, so mixing A4 and Letter originals produces a document with varying page sizes. Normalise beforehand if it will be printed.",
      "Merging does not compress. Combining several large PDFs produces a file roughly the sum of the inputs; compress afterwards if there is a size limit.",
      "Check the page order in the preview before downloading rather than after.",
    ],
    extraFaqs: [
      {
        question: "Are my PDFs uploaded to a server?",
        answer:
          "No. Every file is read into your browser and the merged document is built locally with pdf-lib, then written straight to your downloads. Nothing is transmitted — which is the reason to use a client-side merger for financial and identity documents.",
      },
      {
        question: "How many PDFs can I merge at once?",
        answer:
          "There is no hard limit; the constraint is available memory, since all documents are held in the tab during the merge. Dozens of ordinary documents merge without difficulty. Merging many very large scanned files may make the tab unresponsive while it works.",
      },
      {
        question: "Does merging reduce quality?",
        answer:
          "No. Pages are copied across as-is, with their text, vector graphics, and embedded images intact. Merging is lossless — it is compression, not merging, that trades quality for size.",
      },
      {
        question: "Can I merge a password-protected PDF?",
        answer:
          "Not while it is encrypted. Remove the protection first with an unlock tool, then merge the unprotected file.",
      },
      {
        question: "Will bookmarks and form fields survive the merge?",
        answer:
          "Page content transfers reliably. Document-level features — bookmarks, form fields, and internal links — may not survive, and form fields with identical names across source documents can conflict. Flatten forms before merging if the filled values matter.",
      },
    ],
  },

  "pdf-compressor": {
    intro:
      "Most oversized PDFs are large for one reason: they contain high-resolution images that are far bigger than the page needs. Compression re-encodes those images at a sensible resolution and quality, which commonly cuts a scanned document by 60–80% while leaving it perfectly readable. This compressor works in your browser, so the document is never uploaded to be processed.",
    howTo: {
      title: "How to compress a PDF",
      steps: [
        "Upload the PDF you want to shrink.",
        "Choose a compression level. Higher compression means smaller files and softer images; lower keeps more detail.",
        "Let it process — image-heavy documents take longer than text-only ones.",
        "Check the reported size reduction, review a page or two, then download.",
      ],
    },
    useCases: [
      {
        title: "Getting under an email attachment limit",
        body:
          "Most mail servers reject attachments above 20–25 MB. A scanned contract frequently exceeds that and compresses comfortably underneath it.",
      },
      {
        title: "Meeting a portal's upload cap",
        body:
          "Government and university portals often cap uploads at 2 MB or 5 MB. Compression is usually the difference between a rejected and an accepted submission.",
      },
      {
        title: "Reducing storage and transfer cost",
        body:
          "Across an archive of thousands of scanned documents, a 70% reduction is a material saving in both storage and sync time.",
      },
    ],
    tips: [
      "Text-only PDFs are already small and compress very little — if your file is large, images are the cause.",
      "Scans at 600 DPI are usually unnecessary. 150–200 DPI is entirely legible on screen and in ordinary print.",
      "Compression is lossy for images. Keep the original if you may need full resolution later.",
      "If a PDF barely shrinks, it may contain embedded fonts or vector artwork rather than images, and there is little left to remove.",
    ],
    extraFaqs: [
      {
        question: "How much smaller will my PDF get?",
        answer:
          "It depends entirely on what is inside. Scanned documents and image-heavy presentations routinely drop 60–80%. A text-only PDF exported from Word is already efficiently encoded and may shrink by only a few percent, because there is nothing substantial to compress.",
      },
      {
        question: "Will compression make the text blurry?",
        answer:
          "Real text in a PDF is stored as vector font data and is not affected by compression at all — it stays sharp at any zoom. Text inside a scanned image is pixels, and will soften at aggressive settings. If your document is a scan, use a moderate level and check legibility.",
      },
      {
        question: "Is my document uploaded to a server?",
        answer:
          "No. The PDF is parsed and re-written in your browser. Nothing is transmitted, which matters for the confidential contracts and financial records that most often need compressing.",
      },
      {
        question: "Can I compress the same PDF twice?",
        answer:
          "You can, but you should not expect much. The second pass has far less to remove and will degrade image quality further for little gain. If one pass is not enough, reduce the source resolution before creating the PDF instead.",
      },
      {
        question: "Does compressing remove any content?",
        answer:
          "No pages, text, or images are removed. What changes is how images are encoded — at lower resolution and higher compression. Metadata and unused objects may also be discarded, which contributes a small additional saving.",
      },
    ],
  },

  "age-calculator": {
    intro:
      "Working out an exact age sounds trivial until leap years, differing month lengths, and the question of whether a birthday has already passed this year get involved. This calculator returns your age in years, months, and days from a date of birth to any reference date, and also expresses it in total months, weeks, and days — the figures that forms, visa applications, and medical records actually ask for.",
    howTo: {
      title: "How to calculate your exact age",
      steps: [
        "Enter the date of birth.",
        "Set the reference date. It defaults to today, but you can set a future date to check eligibility on a specific deadline.",
        "Read the primary result in years, months, and days.",
        "Use the alternative totals — months, weeks, days — when a form asks for age in those units.",
      ],
    },
    useCases: [
      {
        title: "Checking eligibility against a cut-off date",
        body:
          "School admissions, competitive exams, and pension thresholds are assessed on a fixed date rather than today. Setting the reference date answers the question exactly.",
      },
      {
        title: "Completing official forms",
        body:
          "Visa and immigration paperwork often wants age in completed years as of the application date, and sometimes in total months for children.",
      },
      {
        title: "Tracking an infant's age in weeks",
        body:
          "Paediatric vaccination schedules and developmental milestones are specified in weeks and months rather than years.",
      },
    ],
    tips: [
      "Age in completed years is the near-universal convention: you are 29 until the day of your 30th birthday, not from the year you turn 30.",
      "Leap years are handled automatically. Someone born on 29 February is conventionally treated as having a 28 February birthday in common years for legal purposes in most jurisdictions.",
      "Total days and total weeks will not divide evenly into the years-months-days figure, because months vary in length. Both are correct answers to different questions.",
    ],
    extraFaqs: [
      {
        question: "How is exact age calculated?",
        answer:
          "By counting completed years from the birth date to the reference date, then completed months from the last birthday, then remaining days. This is why the result is not simply the difference in calendar years — if your birthday has not yet occurred this year, you are one year younger than the year subtraction suggests.",
      },
      {
        question: "How does the calculator handle leap years?",
        answer:
          "It uses real calendar arithmetic rather than a fixed 365-day year, so every 29 February between the two dates is counted correctly. For a birthday of 29 February, the anniversary in a non-leap year is treated as 28 February, which matches the convention used by most legal and administrative systems.",
      },
      {
        question: "Why does my age in days seem higher than expected?",
        answer:
          "Because a year averages 365.25 days, not 365. Over 40 years that is an extra 10 days from leap days alone. Multiplying years by 365 always undercounts.",
      },
      {
        question: "Can I calculate age at a future date?",
        answer:
          "Yes — change the reference date to any date, past or future. This is the reliable way to check whether someone will meet an age requirement by a specific deadline.",
      },
      {
        question: "Is my date of birth stored?",
        answer:
          "No. The calculation runs in your browser and nothing is transmitted or saved. Dates of birth are personal data, so a client-side calculation is meaningfully safer than a server-based one.",
      },
    ],
  },

  "gst-calculator": {
    intro:
      "GST calculations go wrong in one specific way: people subtract the GST percentage from a GST-inclusive price. That is arithmetically incorrect, because the percentage was applied to the base amount, not to the total. This calculator handles both directions properly — adding GST to a base price, and extracting GST from an inclusive price — and splits the result into CGST and SGST where that applies.",
    howTo: {
      title: "How to calculate GST",
      steps: [
        "Choose the direction: add GST to an exclusive amount, or remove GST from an inclusive amount.",
        "Enter the amount and select the GST rate — commonly 5%, 12%, 18%, or 28%.",
        "Read the tax amount and the net and gross totals.",
        "For intra-state supply, use the CGST and SGST split, each being half the total rate.",
      ],
    },
    useCases: [
      {
        title: "Issuing a correct invoice",
        body:
          "Invoices must show the taxable value and the tax separately. Starting from the price you intend to charge inclusive of tax means working backwards to the taxable value.",
      },
      {
        title: "Reconciling supplier bills",
        body:
          "Checking that the tax charged matches the taxable value at the stated rate catches both supplier errors and incorrect rate classifications.",
      },
      {
        title: "Pricing to a round retail figure",
        body:
          "To land on a clean inclusive price, calculate backwards from the total to find the base price rather than adding tax to a round base.",
      },
    ],
    tips: [
      "To remove 18% GST from an inclusive amount, divide by 1.18 — do not subtract 18%. On ₹1,180 that gives ₹1,000, whereas subtracting gives ₹967.60, which is wrong.",
      "Intra-state supply splits the rate equally into CGST and SGST. Inter-state supply uses IGST at the full rate.",
      "The rate depends on the HSN or SAC classification of the goods or service, not on the transaction value.",
      "Round only the final figure. Rounding intermediate values introduces discrepancies that reconciliation will flag.",
    ],
    extraFaqs: [
      {
        question: "How do I remove GST from an inclusive price?",
        answer:
          "Divide the inclusive amount by (1 + rate/100). At 18%, an inclusive price of ₹1,180 gives a taxable value of ₹1,180 ÷ 1.18 = ₹1,000, and GST of ₹180. Subtracting 18% from ₹1,180 gives ₹967.60, which is wrong because the 18% was never calculated on ₹1,180 in the first place.",
      },
      {
        question: "What is the difference between CGST, SGST, and IGST?",
        answer:
          "For supply within a single state, the total rate is split equally between CGST (central) and SGST (state) — 18% becomes 9% plus 9%. For supply across state lines, the entire rate is charged as IGST. The total tax is identical either way; only the split between authorities differs.",
      },
      {
        question: "Which GST rate applies to my product?",
        answer:
          "That is determined by the HSN code for goods or the SAC code for services, as published by the GST Council. Common slabs are 5%, 12%, 18%, and 28%, with some items zero-rated or exempt. This calculator applies whichever rate you select — it cannot determine the correct classification for you, and misclassification is a compliance matter worth confirming with your accountant.",
      },
      {
        question: "Is GST calculated on the discounted price?",
        answer:
          "Yes. A discount shown on the invoice and agreed at or before the time of supply reduces the taxable value, so GST applies to the post-discount amount.",
      },
      {
        question: "Does this handle reverse charge or input credit?",
        answer:
          "No. This is a rate calculator for the tax on a single transaction. Reverse charge liability, input tax credit eligibility, and return filing are compliance processes that depend on your registration status and the nature of the supply.",
      },
    ],
  },

  "emi-calculator": {
    intro:
      "An EMI is a fixed monthly payment covering both interest and principal over the life of a loan. The instalment stays constant, but its composition shifts: early payments are mostly interest, later ones mostly principal. That is why paying an extra instalment in year one saves far more than the same amount in year eight. This calculator returns your EMI, total interest, and total repayment from the loan amount, rate, and tenure.",
    howTo: {
      title: "How to calculate your loan EMI",
      steps: [
        "Enter the principal — the amount actually borrowed, after any down payment.",
        "Enter the annual interest rate as quoted by the lender.",
        "Set the tenure in months or years.",
        "Read the monthly EMI, and check total interest — that figure, not the EMI, is what a longer tenure really costs you.",
      ],
    },
    useCases: [
      {
        title: "Comparing loan offers",
        body:
          "Two loans with the same EMI can differ substantially in total interest if their tenures differ. Comparing total repayment rather than monthly outgo is the honest comparison.",
      },
      {
        title: "Choosing a tenure",
        body:
          "Extending a home loan from 15 to 20 years visibly reduces the EMI while quietly adding a large amount of total interest. Seeing both numbers together makes the trade-off explicit.",
      },
      {
        title: "Checking affordability before applying",
        body:
          "Lenders generally want total EMI obligations below roughly 40–50% of net monthly income. Calculating first tells you what you can realistically borrow.",
      },
    ],
    tips: [
      "The standard formula is EMI = P × r × (1+r)^n ÷ ((1+r)^n − 1), where r is the monthly rate (annual ÷ 12 ÷ 100) and n is the number of months.",
      "Processing fees, insurance, and documentation charges sit outside the EMI. Ask for the effective annual rate including them.",
      "Prepayment early in the tenure saves disproportionately, because that is when the interest component is largest.",
      "A floating-rate EMI is only a snapshot — lenders usually adjust tenure rather than instalment when rates move.",
    ],
    extraFaqs: [
      {
        question: "How is EMI actually calculated?",
        answer:
          "Using the reducing-balance formula EMI = P × r × (1+r)^n ÷ ((1+r)^n − 1), where P is principal, r is the monthly interest rate, and n is the number of monthly instalments. Interest each month is charged on the outstanding balance, so as principal reduces the interest portion falls and the principal portion rises, while the total instalment stays fixed.",
      },
      {
        question: "Does a longer tenure make a loan cheaper?",
        answer:
          "It makes each month cheaper and the loan considerably more expensive overall. Interest accrues for longer on a balance that reduces more slowly. Extending a ₹50 lakh home loan at 9% from 15 to 20 years cuts the EMI by roughly ₹5,700 but adds around ₹16 lakh in total interest.",
      },
      {
        question: "How much does prepayment save?",
        answer:
          "It depends heavily on timing. A lump sum paid in the first few years removes principal that would otherwise have accrued interest for the entire remaining tenure, so the saving is large. The same amount paid near the end saves very little, because most of the interest has already been charged.",
      },
      {
        question: "Is the EMI shown the full monthly cost?",
        answer:
          "No. It covers principal and interest only. Processing fees, insurance premiums bundled by the lender, and for home loans the property taxes and maintenance charges are all additional. Ask the lender for the annual percentage rate including charges to compare offers fairly.",
      },
      {
        question: "What happens to my EMI if interest rates change?",
        answer:
          "On a fixed-rate loan, nothing. On a floating-rate loan, most lenders keep the instalment constant and adjust the tenure instead, so a rate rise extends how long you pay rather than increasing the monthly amount — until the tenure hits its ceiling, at which point the EMI itself rises.",
      },
    ],
  },

  "discount-calculator": {
    intro:
      "A discount calculation is simple in one direction and surprisingly error-prone in the others. This calculator handles the three questions that come up: what does an item cost after X% off, what percentage discount does a given saving represent, and what was the original price before a discount was applied. It also handles stacked discounts correctly, which almost nobody does mentally.",
    howTo: {
      title: "How to calculate a discount",
      steps: [
        "Enter the original price.",
        "Enter the discount percentage, or the sale price if you want to work out the percentage instead.",
        "Read the amount saved and the final price.",
        "For stacked offers, apply each discount in sequence rather than adding the percentages together.",
      ],
    },
    useCases: [
      {
        title: "Checking a sale price is what it claims",
        body:
          "Advertised discounts are sometimes calculated against an inflated list price, or simply mis-stated. Verifying takes seconds.",
      },
      {
        title: "Setting a promotional price",
        body:
          "Working backwards from the margin you need to the discount you can offer is the correct order for pricing a promotion.",
      },
      {
        title: "Comparing competing offers",
        body:
          "A flat amount off and a percentage off are only comparable once both are expressed the same way, which depends on the base price.",
      },
    ],
    tips: [
      "Stacked discounts multiply, they do not add: 20% off then a further 10% off is 28% total, because 0.8 × 0.9 = 0.72.",
      "'Buy one get one free' is a 50% discount across two units, not 100% off.",
      "To find the original price from a sale price, divide by (1 − discount/100). A ₹720 item after 20% off had a list price of ₹900.",
      "Check whether the discount applies before or after tax — it changes the final figure.",
    ],
    extraFaqs: [
      {
        question: "How do I calculate the final price after a discount?",
        answer:
          "Multiply the original price by (1 − discount/100). A ₹2,400 item at 35% off costs ₹2,400 × 0.65 = ₹1,560, with a saving of ₹840. Calculating the discount amount and subtracting it gives the same result in two steps.",
      },
      {
        question: "How do two discounts combine?",
        answer:
          "By multiplication, not addition. 30% off followed by 20% off is not 50% off — it is 0.7 × 0.8 = 0.56, a 44% total discount. This is why sequential offers always disappoint relative to the sum of their headline numbers.",
      },
      {
        question: "How do I find the original price from a sale price?",
        answer:
          "Divide the sale price by (1 − discount/100). An item selling at ₹1,275 after 15% off was originally ₹1,275 ÷ 0.85 = ₹1,500. Adding 15% back to ₹1,275 gives ₹1,466, which is wrong, because the 15% was calculated on the higher original price.",
      },
      {
        question: "What percentage discount is a given saving?",
        answer:
          "Divide the amount saved by the original price and multiply by 100. Saving ₹450 on a ₹1,800 item is a 25% discount. The original price is always the denominator.",
      },
      {
        question: "Should discount be applied before or after tax?",
        answer:
          "Normally before. The discount reduces the taxable value, and tax is then charged on the reduced amount. Applying tax first and discounting the total produces a different, generally incorrect figure for invoicing purposes.",
      },
    ],
  },

  "profit-margin-calculator": {
    intro:
      "Margin and markup are calculated from the same two numbers and are routinely confused, which is expensive. Margin is profit as a percentage of the selling price; markup is profit as a percentage of the cost. A 50% markup is a 33.3% margin — mistake one for the other when pricing and you will systematically under-earn. This calculator gives you both, plus the selling price needed to hit a target margin.",
    howTo: {
      title: "How to calculate profit margin",
      steps: [
        "Enter the cost price — what the item cost you, landed.",
        "Enter the selling price, or the margin you want to achieve.",
        "Read gross profit, margin percentage, and markup percentage side by side.",
        "Use the target-margin output to find the price you need to charge.",
      ],
    },
    useCases: [
      {
        title: "Pricing a new product",
        body:
          "Working from a target margin to a selling price is the correct direction. Starting from cost and applying a markup percentage is where the margin-versus-markup confusion causes underpricing.",
      },
      {
        title: "Assessing whether a discount is affordable",
        body:
          "A 20% discount on a product carrying a 30% margin cuts gross profit by roughly two-thirds. Seeing that before agreeing to the promotion is worthwhile.",
      },
      {
        title: "Comparing profitability across a range",
        body:
          "Absolute profit per unit says little on its own. Margin makes products with different price points directly comparable.",
      },
    ],
    tips: [
      "Margin = (price − cost) ÷ price. Markup = (price − cost) ÷ cost. The denominators differ, and that is the whole distinction.",
      "Margin can never reach 100%; markup has no upper limit.",
      "To convert markup to margin: margin = markup ÷ (1 + markup). A 60% markup is a 37.5% margin.",
      "Gross margin excludes overheads. A healthy gross margin with high fixed costs can still be a loss-making business.",
    ],
    extraFaqs: [
      {
        question: "What is the difference between margin and markup?",
        answer:
          "Both measure the same profit against different bases. Margin divides profit by the selling price; markup divides it by the cost. An item costing 100 and selling for 150 has a 50% markup but a 33.3% margin. Confusing them means pricing lower than intended, which is why the distinction matters commercially rather than just semantically.",
      },
      {
        question: "How do I find the price for a target margin?",
        answer:
          "Divide the cost by (1 − target margin). For a 40% margin on a cost of 60: 60 ÷ 0.6 = 100. Adding 40% to the cost gives 84, which yields only a 28.6% margin — a common and costly mistake.",
      },
      {
        question: "What is a good profit margin?",
        answer:
          "It is entirely sector-dependent. Grocery retail operates on low single-digit net margins at high volume; software routinely exceeds 80% gross margin. The useful comparison is against your own sector and your own trend over time, not against a universal benchmark.",
      },
      {
        question: "What is the difference between gross and net margin?",
        answer:
          "Gross margin counts only the direct cost of goods sold. Net margin subtracts everything else — salaries, rent, marketing, interest, tax. A business can have a strong gross margin and a negative net margin, which is a fixed-cost problem rather than a pricing one.",
      },
      {
        question: "How much extra volume does a discount need?",
        answer:
          "More than most people expect. On a 30% margin, a 10% discount cuts profit per unit by a third, so you need volume to rise by about 50% just to break even on the promotion.",
      },
    ],
  },

  "case-converter": {
    intro:
      "Changing text case by hand is tedious and error-prone, particularly for a heading that arrived in ALL CAPS or a list of identifiers that need converting between naming conventions. This converter switches between sentence case, lower, UPPER, Title Case, camelCase, PascalCase, snake_case, and kebab-case in one click, with the text staying in your browser throughout.",
    howTo: {
      title: "How to change text case",
      steps: [
        "Paste your text into the input area.",
        "Click the case you want. The conversion applies to the whole input.",
        "Review the result — Title Case in particular has conventions that automated conversion cannot always infer.",
        "Copy the output.",
      ],
    },
    useCases: [
      {
        title: "Fixing text pasted from another system",
        body:
          "Exports from legacy databases and older CMS platforms frequently arrive entirely in capitals. Converting to sentence case makes them publishable.",
      },
      {
        title: "Converting between naming conventions",
        body:
          "Moving identifiers between languages means moving between conventions — snake_case in Python, camelCase in JavaScript, PascalCase for classes, kebab-case for CSS and URLs.",
      },
      {
        title: "Preparing headlines",
        body:
          "Publications specify either title case or sentence case in their style guide. Converting is faster and more consistent than retyping.",
      },
    ],
    tips: [
      "Sentence case capitalises the first letter of each sentence only. Title Case capitalises most words but conventionally leaves short articles, conjunctions, and prepositions lowercase unless they start the line.",
      "Automated Title Case cannot know that 'iPhone' and 'eBay' are meant to start lowercase — check proper nouns and brand names afterwards.",
      "URL slugs should use kebab-case. Underscores work but hyphens are the long-standing convention for word separation in URLs.",
      "Converting to UPPER and back to lower loses the original capitalisation permanently. Keep the source if you might need it.",
    ],
    extraFaqs: [
      {
        question: "What is the difference between title case and sentence case?",
        answer:
          "Sentence case capitalises only the first word of each sentence plus proper nouns, exactly as you would write ordinary prose. Title case capitalises most words in a heading, typically excluding articles ('a', 'the'), short conjunctions ('and', 'but'), and short prepositions ('of', 'in') unless they appear first. Most publications now prefer sentence case for headings because it reads more naturally.",
      },
      {
        question: "What are camelCase, PascalCase, snake_case, and kebab-case?",
        answer:
          "They are conventions for joining words without spaces. camelCase starts lowercase and capitalises each subsequent word (userName). PascalCase capitalises every word including the first (UserName). snake_case joins words with underscores in lowercase (user_name). kebab-case uses hyphens (user-name). Each language community has settled on different defaults, which is why converting between them comes up so often.",
      },
      {
        question: "Does converting case work with accented and non-English text?",
        answer:
          "Yes. Conversion uses the browser's Unicode-aware case mapping, so accented Latin, Greek, and Cyrillic all convert correctly. Some language-specific rules — Turkish dotted and dotless i, for instance — follow the default Unicode mapping rather than locale-specific behaviour.",
      },
      {
        question: "Is my text sent to a server?",
        answer:
          "No. Conversion runs entirely in your browser and nothing is transmitted or stored.",
      },
      {
        question: "Can I undo a conversion?",
        answer:
          "Not within the tool once you convert — the original capitalisation is not retained. Keep a copy of the source text if you may need to return to it.",
      },
    ],
  },

  "date-difference-calculator": {
    intro:
      "Counting the gap between two dates by hand means tracking month lengths and leap years, which is exactly the sort of thing people get wrong by a day or two. This calculator returns the difference in years, months, and days, plus the totals in days, weeks, and months — and separately counts business days, which is what contracts and project plans usually actually mean.",
    howTo: {
      title: "How to calculate the days between two dates",
      steps: [
        "Enter the start date.",
        "Enter the end date. Order does not matter — the result is the absolute difference.",
        "Read the breakdown in years, months, and days, and the totals underneath.",
        "Use the business-day count when weekends should be excluded.",
      ],
    },
    useCases: [
      {
        title: "Tracking a notice or deadline period",
        body:
          "Contractual notice periods, statutory deadlines, and warranty windows are counted in days. An off-by-one error here has real consequences.",
      },
      {
        title: "Planning a project timeline",
        body:
          "Working days matter more than calendar days for delivery estimates, since a 30-day span contains roughly 21 working days.",
      },
      {
        title: "Counting down to an event",
        body:
          "Days until a launch, a wedding, or an exam — with weeks shown alongside, which is often the more useful unit for planning.",
      },
    ],
    tips: [
      "Decide whether your count is inclusive of both endpoints. A 'ten-day period' starting Monday may end on the second Wednesday or the second Thursday depending on the convention in force.",
      "Business-day counts here exclude weekends but not public holidays, which vary by country and region.",
      "Total months and the years-months-days breakdown will not match arithmetically, because months differ in length. Both figures are correct.",
      "For deadlines that matter legally, confirm which counting convention the governing document specifies.",
    ],
    extraFaqs: [
      {
        question: "Does the calculation include both the start and end dates?",
        answer:
          "The difference is exclusive by default — from 1 March to 8 March is 7 days. If your context counts both endpoints, as many contractual and rental periods do, add one to the result. Which convention applies is a question about your document, not about the arithmetic.",
      },
      {
        question: "How are leap years handled?",
        answer:
          "Automatically, using real calendar arithmetic. Every 29 February falling between the two dates is included in the day count. Using a fixed 365-day year to estimate long spans undercounts by roughly one day every four years.",
      },
      {
        question: "How are business days counted?",
        answer:
          "By excluding Saturdays and Sundays from the total. Public holidays are not excluded, because they vary by country, state, and sometimes industry — subtract those separately for your own calendar.",
      },
      {
        question: "Why do the months and days figures not add up neatly?",
        answer:
          "Because months have between 28 and 31 days. '2 months and 15 days' is a calendar-based description, while the total-days figure is an exact count. They describe the same interval in two different units and cannot be reconciled by simple multiplication.",
      },
      {
        question: "Can I calculate a difference across time zones?",
        answer:
          "This calculator works on calendar dates rather than timestamps, so time zones do not affect it. For precise durations between moments in different zones, you need a time-aware calculation instead.",
      },
    ],
  },

  "hash-generator": {
    intro:
      "A cryptographic hash reduces any input to a fixed-length fingerprint. The same input always produces the same hash, and any change — even a single bit — produces a completely different one. Hashes are used to verify file integrity, deduplicate content, and index data. This generator produces MD5, SHA-1, SHA-256, and SHA-512 digests in your browser, so the input is never transmitted.",
    howTo: {
      title: "How to generate a hash",
      steps: [
        "Enter or paste the text you want to hash.",
        "Choose the algorithm. SHA-256 is the sensible default for anything security-related.",
        "Read the resulting hexadecimal digest and copy it.",
        "To verify a download, compare your computed hash against the one published by the source — they must match exactly, character for character.",
      ],
    },
    useCases: [
      {
        title: "Verifying a downloaded file",
        body:
          "Projects publish a SHA-256 checksum alongside their releases. Computing the hash of what you downloaded and comparing confirms the file arrived intact and was not tampered with.",
      },
      {
        title: "Detecting whether content changed",
        body:
          "Comparing hashes of two versions is far faster than comparing the content itself, and works regardless of size.",
      },
      {
        title: "Deduplicating records",
        body:
          "Hashing a normalised representation of a record gives a compact key for identifying exact duplicates across a large dataset.",
      },
    ],
    tips: [
      "Hashing is one-way by design. There is no operation that recovers the input from the digest.",
      "MD5 and SHA-1 are both cryptographically broken — collisions can be constructed deliberately. Use them only for non-security checks like cache keys, never for signatures or integrity guarantees.",
      "Hashes are case-insensitive in hex representation but compare them exactly; a single differing character means a different input.",
      "Never hash passwords with a plain hash function. Password storage requires a slow, salted algorithm such as bcrypt, scrypt, or Argon2.",
    ],
    extraFaqs: [
      {
        question: "Can a hash be reversed or decrypted?",
        answer:
          "No. Hashing is a one-way function — the digest is a fixed size regardless of input length, so information is necessarily discarded. What sites advertising 'hash decryption' actually do is look the digest up in a precomputed table of common inputs. That works for 'password123'; it does not work for arbitrary data.",
      },
      {
        question: "Which hash algorithm should I use?",
        answer:
          "SHA-256 for essentially all new work — it is fast, widely supported, and has no known practical weakness. SHA-512 is a reasonable choice on 64-bit systems. Avoid MD5 and SHA-1 for anything security-relevant: practical collision attacks exist for both, meaning an attacker can construct two different files with the same digest.",
      },
      {
        question: "Why is MD5 still available if it is broken?",
        answer:
          "Because collision resistance is not always what you need. MD5 remains perfectly serviceable as a fast checksum for cache keys, deduplication, or detecting accidental corruption — situations with no adversary. It is unsuitable wherever someone might deliberately engineer a collision.",
      },
      {
        question: "Should I use this to hash passwords?",
        answer:
          "No. Fast hashes are the wrong tool for password storage precisely because they are fast, which lets an attacker test billions of guesses per second against a leaked database. Use a deliberately slow, salted algorithm — bcrypt, scrypt, or Argon2 — which is designed to make that expensive.",
      },
      {
        question: "Is my input sent anywhere?",
        answer:
          "No. Hashing runs in your browser using the Web Crypto API, and the input never leaves your device.",
      },
    ],
  },

  "text-diff-checker": {
    intro:
      "Spotting what changed between two versions of a document by reading both is unreliable — the eye skips over single-word edits and transposed lines. A diff compares them mechanically and highlights every addition, deletion, and modification. This checker runs the comparison in your browser, which makes it usable for contracts, drafts, and code you would not paste into an online service.",
    howTo: {
      title: "How to compare two texts",
      steps: [
        "Paste the original version into the left panel.",
        "Paste the revised version into the right panel.",
        "Read the highlighted result — additions and deletions are marked distinctly.",
        "Switch between side-by-side and unified views depending on whether you want context or compactness.",
      ],
    },
    useCases: [
      {
        title: "Reviewing contract revisions",
        body:
          "When a counterparty returns a document without tracked changes, a diff is the only reliable way to find what they altered.",
      },
      {
        title: "Comparing configuration files",
        body:
          "A single differing line between a working and a failing environment config is usually the whole explanation for an outage.",
      },
      {
        title: "Checking edits to a draft",
        body:
          "Comparing your draft against an editor's returned version shows precisely which changes were made rather than which were described.",
      },
    ],
    tips: [
      "Diffs are line-based by default, so reflowing a paragraph marks the whole paragraph as changed even if one word moved.",
      "Normalise line endings before comparing. A file saved on Windows and another on macOS can show every line as different purely because of CRLF versus LF.",
      "Trailing whitespace produces differences that are invisible on screen — enable whitespace-insensitive comparison if that noise dominates.",
      "For prose, word-level diffing is far more readable than line-level.",
    ],
    extraFaqs: [
      {
        question: "Why is the entire paragraph marked as changed when I edited one word?",
        answer:
          "Because line-based diffing treats a line as the unit of comparison, and an unwrapped paragraph is a single very long line. Any change within it marks the whole line. Word-level diffing gives much better results for prose; line-level is the right choice for code and configuration.",
      },
      {
        question: "Is my text uploaded for comparison?",
        answer:
          "No. The comparison algorithm runs in your browser and neither version is transmitted. That is what makes this appropriate for unpublished drafts, legal documents, and proprietary code.",
      },
      {
        question: "Can I compare files rather than pasted text?",
        answer:
          "Paste the contents of each file into the two panels. Binary formats such as .docx or .pdf will not compare usefully as raw text — extract the plain text first, then diff that.",
      },
      {
        question: "What is the difference between side-by-side and unified view?",
        answer:
          "Side-by-side shows both versions in parallel columns, which makes it easy to see what a line became. Unified shows one stream with additions and deletions interleaved, which is more compact and is the format used by version control tools.",
      },
      {
        question: "Why do two identical-looking texts show differences?",
        answer:
          "Almost always invisible characters: trailing spaces, tab-versus-space indentation, differing line endings, or a non-breaking space that looks exactly like a normal one. Enabling whitespace-insensitive comparison usually confirms this immediately.",
      },
    ],
  },

  "ai-explainer": {
    intro:
      "Formulas, financial metrics, and regular expressions are compact notation that assumes you already know the concept — which is exactly the problem when you do not. This explainer takes an expression or a term and returns a plain-English breakdown: what each part does, why the formula is constructed that way, and a worked example with real numbers.",
    howTo: {
      title: "How to get an explanation",
      steps: [
        "Enter the formula, metric, or pattern you want explained — for example a regex, a margin calculation, or an amortisation formula.",
        "Submit and read the breakdown, which separates what the expression computes from why it is built that way.",
        "Work through the example with your own numbers to confirm you have followed it.",
        "Follow the linked calculator to apply it to a real case.",
      ],
    },
    useCases: [
      {
        title: "Understanding a financial metric before using it",
        body:
          "Knowing why margin divides by price and markup divides by cost is what stops you from mixing them up later. The explanation is more durable than the formula.",
      },
      {
        title: "Decoding a regular expression",
        body:
          "Inherited regexes are notoriously opaque. A component-by-component breakdown is far faster than working through the syntax reference.",
      },
      {
        title: "Learning a calculation you keep looking up",
        body:
          "Formulas you re-derive every time are ones you never actually learned. An explanation of the reasoning tends to stick where the notation does not.",
      },
    ],
    tips: [
      "Be specific. 'Explain compound interest' returns something general; 'explain why compound interest uses (1+r)^n' returns the part you actually wanted.",
      "Ask for a worked example with your own numbers — following the arithmetic is what confirms understanding.",
      "Cross-check anything consequential. Explanations are a learning aid, not professional advice.",
    ],
    extraFaqs: [
      {
        question: "What kinds of things can this explain?",
        answer:
          "Mathematical and financial formulas, business metrics such as margin, markup, break-even, and ROI, regular expression patterns, JSON and data-format syntax, and the calculations behind the other tools on this site.",
      },
      {
        question: "Should I rely on this for financial or legal decisions?",
        answer:
          "No. It is an educational aid that explains how a calculation works. It does not know your circumstances, jurisdiction, or tax position, and it is not a substitute for a qualified accountant, financial adviser, or lawyer. Verify anything with real consequences.",
      },
      {
        question: "How is this different from searching for the formula?",
        answer:
          "A search returns the formula; this returns the reasoning behind it. Understanding why the denominator is the selling price in a margin calculation is what prevents the mistake, whereas memorising the formula generally does not.",
      },
      {
        question: "Can it explain formulas in other languages?",
        answer:
          "Mathematical notation is universal, so the expressions themselves are understood regardless. Explanations are returned in English.",
      },
    ],
  },

  "jpg-to-png": {
    intro:
      "Converting JPG photos to PNG is essential when you need uncompressed image fidelity, transparent layer readiness, or clean digital assets for graphic design and web publishing. Because JPEG uses lossy discrete cosine transform compression, re-saving a JPG repeatedly introduces compounding blur and compression artifacts. Our client-side JPG to PNG converter creates a crisp, 24-bit RGB PNG directly inside your browser memory without quality loss or server uploads.",
    howTo: {
      title: "How to convert JPG to PNG online",
      steps: [
        "Upload or drag-and-drop your JPG/JPEG image into the converter.",
        "The tool instantly decodes the raw image bitmap into uncompressed pixel data.",
        "Preview the converted PNG file size and resolution in real time.",
        "Click Download PNG to save your lossless high-quality image immediately.",
      ],
    },
    useCases: [
      {
        title: "Graphic design & UI asset preparation",
        body:
          "Designers converting stock photos or client mockups to PNG ensure that subsequent edits in Figma, Photoshop, or Canva do not degrade from repeated JPEG compression cycles.",
      },
      {
        title: "Website logo & icon conversion",
        body:
          "PNG provides sharp text rendering, high contrast edges, and zero pixel bleeding around logos, making it the preferred format for hero branding and UI elements.",
      },
      {
        title: "Print & publishing preparation",
        body:
          "Converting high-resolution JPEG photography to PNG preserves pristine color profiles and crisp lines for desktop publishing and marketing collateral.",
      },
    ],
    tips: [
      "Converting JPG to PNG cannot restore detail lost during original JPEG compression, but it permanently stops future compression degradation.",
      "PNG files have larger file sizes than JPGs because PNG uses lossless DEFLATE compression. If you need smaller web files, consider WebP.",
      "Everything runs 100% locally in your browser with zero server latency and total privacy.",
    ],
    extraFaqs: [
      {
        question: "Does converting JPG to PNG make the background transparent?",
        answer:
          "No. Standard JPGs have opaque backgrounds (often white). To make it transparent after converting, you can remove the background in any image editor.",
      },
      {
        question: "Is there any file size limit for JPG to PNG conversion?",
        answer:
          "Because processing happens entirely in your device's memory using HTML5 Canvas, you can convert large multi-megabyte photos instantly without server upload limits.",
      },
    ],
  },

  "image-to-webp": {
    intro:
      "WebP is Google's modern image format designed specifically for the web, delivering 25% to 80% smaller file sizes than comparable PNG and JPEG images while maintaining equivalent visual quality. Converting your website imagery to WebP drastically improves Google PageSpeed scores, lowers bandwidth consumption, and speeds up page load times on desktop and mobile devices. Our converter processes all images client-side with full quality control.",
    howTo: {
      title: "How to convert images to WebP format",
      steps: [
        "Select or drop any JPG, PNG, or GIF file into the upload zone.",
        "Adjust the compression quality slider (recommended: 85% to 92% for optimal balance of size and visual clarity).",
        "Compare the original versus converted file size savings in real time.",
        "Click Download WebP to get your optimized lightweight image.",
      ],
    },
    useCases: [
      {
        title: "Core Web Vitals & SEO optimization",
        body:
          "Google search ranking algorithms heavily prioritize fast Largest Contentful Paint (LCP). Switching hero images to WebP frequently cuts load times in half.",
      },
      {
        title: "E-commerce product catalog compression",
        body:
          "Online stores with thousands of product photos save gigabytes of CDN bandwidth and hosting costs by serving WebP images to mobile shoppers.",
      },
      {
        title: "Blog & content publishing",
        body:
          "Article screenshots and infographics load instantly even on slow 4G/3G mobile networks when compressed into modern WebP.",
      },
    ],
    tips: [
      "A quality setting of 85% is visually indistinguishable from 100% for 99% of web users while cutting 60% of the byte weight.",
      "WebP supports both lossy compression (like JPG) and lossless transparency (like PNG) in a single unified format.",
      "All modern browsers (Chrome, Safari, Firefox, Edge, iOS Safari, Android) natively support WebP.",
    ],
    extraFaqs: [
      {
        question: "How much smaller is WebP compared to PNG?",
        answer:
          "WebP is typically 26% smaller than PNGs in lossless mode, and 25-34% smaller than comparable JPEGs at equivalent SSIM visual quality.",
      },
      {
        question: "Are my uploaded images saved on a server?",
        answer:
          "No. All image encoding is performed strictly in your browser via the Canvas WebP encoder. No files are uploaded to any external server.",
      },
    ],
  },

  "webp-to-jpg": {
    intro:
      "While WebP is dominant on modern websites, many legacy desktop image editors, older operating systems, email clients, and printing services still require standard JPG or PNG files. Our WebP to JPG converter lets you effortlessly convert downloaded .webp images into universally compatible JPGs with adjustable quality and custom background color fill for transparent assets.",
    howTo: {
      title: "How to convert WebP to JPG online",
      steps: [
        "Upload your .webp image directly into the converter.",
        "Choose your desired JPG quality setting (default 92% for crystal-clear fidelity).",
        "Pick a background color fill if the source WebP contains transparent areas.",
        "Click Download JPG to save a universally compatible image file.",
      ],
    },
    useCases: [
      {
        title: "Editing downloaded web images in desktop software",
        body:
          "Older versions of Adobe Photoshop, Microsoft Paint, Word, and Illustrator cannot open .webp files. Converting to JPG makes them immediately editable.",
      },
      {
        title: "Email campaigns & newsletter templates",
        body:
          "Some older email clients (such as legacy Outlook) do not render WebP images. Converting to JPG guarantees 100% inbox compatibility.",
      },
      {
        title: "Social media and photo print kiosks",
        body:
          "Certain social media tools and in-store automated photo print kiosks only accept .jpg or .png uploads.",
      },
    ],
    tips: [
      "If your WebP image has a transparent background, select white (#ffffff) or your brand color for clean background fill.",
      "Use 92% or higher JPG quality to retain maximum sharpness.",
      "Batch convert multiple files seamlessly with instant in-browser processing.",
    ],
    extraFaqs: [
      {
        question: "Why can't I open WebP files on my computer?",
        answer:
          "Older operating systems (such as Windows 7 or macOS High Sierra) lack native WebP codecs. Converting to JPG solves compatibility across all devices.",
      },
      {
        question: "Does converting WebP to JPG reduce quality?",
        answer:
          "Our tool uses high-fidelity 92%+ JPEG encoding, ensuring visual degradation is virtually zero while creating a universally compatible file.",
      },
    ],
  },

  "split-pdf": {
    intro:
      "Splitting a PDF means copying the pages you want into a new document and leaving the rest behind. It is the fix for the everyday problem of needing to send one section of a long report, or file page 4 of a bank statement without disclosing the other eleven. This splitter copies pages losslessly with pdf-lib inside your browser, so the original document is never uploaded.",
    howTo: {
      title: "How to split a PDF and extract pages",
      steps: [
        "Upload the PDF. The page count appears once it has been read.",
        "Type the pages you want using ranges and single numbers, comma separated — for example 1-3, 5, 8-10.",
        "Check the count of selected pages shown underneath the field.",
        "Extract and download. The new PDF contains only those pages, in ascending order.",
      ],
    },
    useCases: [
      {
        title: "Sending one section of a long document",
        body:
          "Rather than emailing a 90-page report so somebody can read chapter three, extract those pages. It is smaller, faster to open, and avoids circulating material that was not asked for.",
      },
      {
        title: "Redacting by omission",
        body:
          "When a form asks for a single page of a statement, extracting that page is safer than sending the whole file. Pages you do not copy are not present in the output at all.",
      },
      {
        title: "Breaking a scan into per-document files",
        body:
          "A batch scan often produces one PDF containing several separate documents. Splitting on the page boundaries turns it back into individually filed papers.",
      },
    ],
    tips: [
      "Ranges are inclusive at both ends: 1-3 gives you pages 1, 2 and 3.",
      "Overlapping ranges are fine — each page is included once, so 1-5, 3-7 gives pages 1 to 7.",
      "Pages always come out in ascending order. To reorder them, extract first and then use a merge tool.",
      "Unlock a password-protected PDF before splitting; encrypted files cannot be read.",
    ],
    extraFaqs: [
      {
        question: "Does splitting reduce the quality of the pages?",
        answer:
          "No. Pages are copied as complete objects, so text stays as vector font data, images keep their original encoding, and nothing is re-compressed. A split page is byte-for-byte equivalent to the original.",
      },
      {
        question: "Can I split one PDF into many separate files at once?",
        answer:
          "This tool produces one new PDF per extraction. To create several files, run the extraction once per range — for a three-way split that is three passes with different ranges.",
      },
      {
        question: "Are my PDFs uploaded to a server?",
        answer:
          "No. The file is read into your browser and the new document is built locally with pdf-lib, then written straight to your downloads. Nothing is transmitted, which is why this is safe for contracts and financial records.",
      },
      {
        question: "Why does my page range produce fewer pages than expected?",
        answer:
          "Ranges are clamped to the document. Asking for 1-20 in a 12-page PDF yields 12 pages. Page numbering here is the physical position in the file, which may differ from printed numbers if the document has unnumbered front matter.",
      },
      {
        question: "Do bookmarks and form fields survive the split?",
        answer:
          "Page content transfers reliably. Document-level features such as bookmarks and interactive form fields may not, since they are stored outside the pages themselves. Flatten forms first if the filled values matter.",
      },
    ],
  },

  "pdf-to-jpg": {
    intro:
      "Converting PDF pages to images is what you need when something only accepts pictures — a social post, a slide, a forum, an upload form that rejects PDFs. Each page is rendered by pdf.js onto a canvas at whatever resolution you pick and encoded as JPG or PNG. Rendering happens in your browser, so the document is never uploaded.",
    howTo: {
      title: "How to convert a PDF to JPG",
      steps: [
        "Choose JPG for photographic pages or PNG for pages that are mostly text and line art.",
        "Set the resolution. 2x is about 144 DPI and is right for screens; 3x or 4x suits printing.",
        "Upload the PDF and wait while each page renders — larger documents take a moment per page.",
        "Download a single page by clicking its thumbnail, or use the button to get everything as a ZIP.",
      ],
    },
    useCases: [
      {
        title: "Posting a page where PDFs are not accepted",
        body:
          "Most social platforms and forums accept images but not PDFs. Converting the page you want to show is the whole solution.",
      },
      {
        title: "Dropping a page into a slide deck",
        body:
          "Pasting a rendered page into a presentation keeps its exact layout, which copying the text does not.",
      },
      {
        title: "Creating thumbnails or previews",
        body:
          "Rendering the first page produces a cover image for a document library or a download listing.",
      },
    ],
    tips: [
      "JPG is smaller for pages containing photographs; PNG is sharper for text and diagrams and avoids compression halos.",
      "Higher resolution multiplies file size quadratically — 4x is four times the pixels of 2x, not twice.",
      "Rendered pages are images, so the text inside them is no longer selectable or searchable.",
      "Very long documents at high resolution can use a lot of memory, since every page is held in the tab.",
    ],
    extraFaqs: [
      {
        question: "What resolution should I pick?",
        answer:
          "2x, roughly 144 DPI, is the sensible default for anything viewed on screen. Choose 3x or 4x when the image will be printed or zoomed into, and accept the larger file. 1x matches the PDF's own point size and is usually too soft.",
      },
      {
        question: "Will the text still be selectable in the image?",
        answer:
          "No. Rendering converts the page to pixels, so text becomes part of the picture. If you need the text itself, use a PDF-to-Word converter to extract the text layer instead.",
      },
      {
        question: "Why do my JPG pages have a white background?",
        answer:
          "JPEG has no alpha channel, so transparent regions must be filled with something and white is painted in first. Choose PNG if you need transparency preserved.",
      },
      {
        question: "Is the PDF uploaded to convert it?",
        answer:
          "No. pdf.js renders each page to a canvas inside your browser and the images are encoded locally. Nothing is transmitted at any point.",
      },
      {
        question: "How do I get all the pages in one download?",
        answer:
          "Use the ZIP button, which packages every rendered page into a single archive. A single-page document downloads directly as an image rather than a ZIP.",
      },
    ],
  },

  "rotate-pdf": {
    intro:
      "A scanner fed a page the wrong way round produces a PDF that everyone has to tilt their head to read. Rotating writes a corrected orientation into the file itself, so every reader and printer displays it the right way up. Rotation here is added to whatever the page already carries, which matters for documents that mix portrait and landscape pages.",
    howTo: {
      title: "How to rotate a PDF",
      steps: [
        "Upload the PDF you want to fix.",
        "Choose 90 degrees for a page on its side, 180 for one that is upside down, or 270 for a 90-degree turn the other way.",
        "Apply and download. The rotation is written into the new file.",
        "Open the result to confirm before discarding the original.",
      ],
    },
    useCases: [
      {
        title: "Fixing a sideways scan",
        body:
          "Documents fed into a scanner in landscape come out rotated. A single 90-degree turn makes the file readable without anyone adjusting their viewer.",
      },
      {
        title: "Correcting a phone photo turned into a PDF",
        body:
          "Photographs taken in portrait sometimes carry orientation metadata that survives into the PDF incorrectly. Rotating fixes the displayed result.",
      },
      {
        title: "Preparing a document for printing",
        body:
          "Printers honour the rotation stored in the file. Fixing it before printing avoids a wasted run of sideways pages.",
      },
    ],
    tips: [
      "Rotation is lossless — it sets a flag on each page rather than re-rendering anything, so quality is untouched.",
      "This tool rotates every page by the same amount. For a document where only some pages are wrong, split it, rotate the affected part, and merge back.",
      "Rotation is cumulative: applying 90 degrees twice is the same as 180.",
      "Keep the original until you have opened and checked the rotated copy.",
    ],
    extraFaqs: [
      {
        question: "Does rotating a PDF reduce its quality?",
        answer:
          "No. Rotation writes a value into each page's dictionary telling readers how to display it. No content is re-encoded, so text stays vector-sharp and images are untouched. File size is essentially unchanged.",
      },
      {
        question: "Will the rotation stick in every PDF reader?",
        answer:
          "Yes. The rotation is stored in the file rather than being a temporary view setting, so Acrobat, Preview, Chrome, and printers all honour it.",
      },
      {
        question: "Can I rotate only some pages?",
        answer:
          "Not in a single pass — this applies one rotation to the whole document. For mixed documents, extract the misoriented pages with the split tool, rotate those, then merge everything back in order.",
      },
      {
        question: "What is the difference between 90 and 270 degrees?",
        answer:
          "Both turn the page onto its side, in opposite directions. If 90 leaves the text running bottom-to-top, 270 is the one you want. It is quicker to try one and look than to reason about it.",
      },
      {
        question: "Is my file uploaded?",
        answer:
          "No. The PDF is read and rewritten in your browser with pdf-lib, and nothing is transmitted.",
      },
    ],
  },

  "add-page-numbers": {
    intro:
      "Plenty of documents must be paginated before they can be filed — court submissions, dissertations, tender responses, contracts referenced by page. Adding numbers by hand in a word processor means re-exporting the whole PDF; stamping them directly onto the existing file takes a second and changes nothing else about the document.",
    howTo: {
      title: "How to add page numbers to a PDF",
      steps: [
        "Upload the PDF.",
        "Pick where the numbers sit — bottom centre is the usual convention for printed documents.",
        "Set the starting number if the first page should not be numbered 1.",
        "Apply and download the numbered copy. The original is untouched.",
      ],
    },
    useCases: [
      {
        title: "Meeting a filing requirement",
        body:
          "Courts and tender processes frequently require every page numbered so that submissions can be referenced precisely. Unnumbered filings are routinely rejected.",
      },
      {
        title: "Paginating a merged document",
        body:
          "Combining several PDFs produces a file whose original page numbers restart at each section. Stamping a continuous sequence over the top makes the whole document navigable.",
      },
      {
        title: "Preparing a document for review",
        body:
          "Reviewers need to be able to say 'page 14, second paragraph'. Numbering is what makes that possible.",
      },
    ],
    tips: [
      "Bottom centre is the standard for printed documents; bottom right suits single-sided material read on screen.",
      "Set the starting number above 1 when front matter is numbered separately in roman numerals.",
      "Numbers are drawn on top of the existing content, so check they do not land over a footer or footnote.",
      "Number after merging, not before, or you will end up with two competing sequences.",
    ],
    extraFaqs: [
      {
        question: "Can I start numbering from a page other than the first?",
        answer:
          "You can set the starting number to any value, which shifts the whole sequence — set it to 3 and the first page shows 3. Skipping the first page entirely, so that page one is unnumbered, is not currently supported.",
      },
      {
        question: "Will the numbers overlap my existing content?",
        answer:
          "They are drawn on top, about 28 points in from the edge. That falls within the margin of most documents, but a page with an existing footer at the same position will collide. Check the output and choose a different corner if needed.",
      },
      {
        question: "Can I change the font or size of the numbers?",
        answer:
          "Not currently — numbers are drawn in 10pt Helvetica in mid grey, which is unobtrusive and prints cleanly. Position and starting number are the available controls.",
      },
      {
        question: "Does this change anything else in the document?",
        answer:
          "No. Existing text, images, and layout are untouched; a small text object is added to each page and the font is embedded so it renders identically everywhere.",
      },
      {
        question: "Is the PDF uploaded?",
        answer:
          "No. The document is modified in your browser with pdf-lib and saved directly to your device.",
      },
    ],
  },

  "image-resizer": {
    intro:
      "Resizing changes an image's pixel dimensions — the single most effective way to cut file size, and a hard requirement for platforms that specify exact dimensions. Reducing a 4000px photograph to 800px removes 96% of its pixels and usually looks identical at display size. This resizer uses the browser's high-quality canvas resampling, so nothing is uploaded.",
    howTo: {
      title: "How to resize an image",
      steps: [
        "Upload the image. Its original dimensions are shown so you know what you are starting from.",
        "Enter a target width or height. With the ratio lock on, the other dimension follows automatically.",
        "Or use a quick preset — 25%, 50%, and 75% of the original.",
        "Pick an output format and quality, then download. The filename records the new dimensions.",
      ],
    },
    useCases: [
      {
        title: "Meeting an exact size requirement",
        body:
          "Application portals and print services often specify precise pixel dimensions. Typing the numbers directly is faster and more reliable than dragging a crop handle.",
      },
      {
        title: "Cutting page weight on a website",
        body:
          "Serving a 4000px image in an 800px slot wastes most of the bytes downloaded. Resizing to the display size is the biggest single win available for Largest Contentful Paint.",
      },
      {
        title: "Preparing images for email or chat",
        body:
          "Halving both dimensions removes three-quarters of the pixels, which usually brings an oversized photo comfortably under an attachment limit.",
      },
    ],
    tips: [
      "Keep the ratio lock on unless you specifically want to distort the image — unlocking it stretches the picture.",
      "Downscaling is effectively lossless to the eye. Upscaling cannot add detail that was never captured, so enlarged images look soft no matter the setting.",
      "Resize before compressing. Fewer pixels means the compressor has far less work to do for the same visual result.",
      "WebP gives noticeably smaller files than JPG at the same quality and is supported by every current browser.",
    ],
    extraFaqs: [
      {
        question: "Does resizing reduce image quality?",
        answer:
          "Making an image smaller discards pixels but looks essentially identical at the new size, because there is more detail than the display can show. Making it larger is different — the extra pixels are interpolated from neighbours, so the result is softer than a photograph genuinely captured at that size.",
      },
      {
        question: "How do I resize without stretching the image?",
        answer:
          "Leave the aspect ratio lock enabled. Setting a width then updates the height proportionally. Unlocking it lets you set both independently, which distorts the picture — occasionally useful, usually not what you want.",
      },
      {
        question: "What is the difference between resizing and cropping?",
        answer:
          "Resizing keeps the whole image and changes its dimensions. Cropping keeps part of the image at original quality and throws the rest away. To hit an exact size with a different aspect ratio, crop to the right shape first, then resize.",
      },
      {
        question: "Which output format should I choose?",
        answer:
          "JPG for photographs, PNG for screenshots, logos, or anything needing transparency, WebP when you want the smallest file and transparency together. Note that exporting to JPG fills transparent areas with white, since JPEG has no alpha channel.",
      },
      {
        question: "Is my image uploaded?",
        answer:
          "No. The file is read into a canvas in your browser, resampled locally, and written straight to your downloads. Nothing is transmitted.",
      },
    ],
  },

  "favicon-generator": {
    intro:
      "A favicon is the small icon in a browser tab, a bookmark list, and a phone home screen — and modern platforms request it at a surprising number of sizes. Rather than exporting each one by hand, this generator renders your logo at every size browsers actually ask for and packages them as a ZIP with a ready-to-paste HTML snippet. Everything is drawn on a canvas in your browser.",
    howTo: {
      title: "How to generate a favicon",
      steps: [
        "Upload a square logo. At least 512×512 gives the best result at every output size.",
        "Choose a background — transparent for PNG-style logos, or a solid colour if your mark needs one behind it.",
        "Review the previews. Pay particular attention to 16px, which is what most people actually see.",
        "Download the ZIP and drop the files at the root of your site, then paste the snippet from README.txt into your <head>.",
      ],
    },
    useCases: [
      {
        title: "Launching a new site",
        body:
          "A missing favicon leaves a blank page icon in the tab, which reads as unfinished. It is a five-minute job that noticeably affects how polished a site feels.",
      },
      {
        title: "Supporting phone home screens",
        body:
          "The 180px Apple touch icon is what appears when someone adds your site to an iPhone home screen. Without it, iOS renders a screenshot of the page instead.",
      },
      {
        title: "Refreshing icons after a rebrand",
        body:
          "New logo, new icon set. Regenerating every size from the new mark takes seconds and keeps the sizes consistent.",
      },
    ],
    tips: [
      "Simple, high-contrast marks survive being shown at 16 pixels. Detailed logos with fine text turn to mush — consider a simplified variant for the icon.",
      "Non-square sources are fitted inside the square and centred rather than stretched, so a wide logo leaves space at top and bottom.",
      "Transparent backgrounds adapt to light and dark browser themes; a solid background will not.",
      "Browsers cache favicons aggressively. A hard refresh, or a fresh profile, is often needed to see a change.",
    ],
    extraFaqs: [
      {
        question: "Which favicon sizes do I actually need?",
        answer:
          "16 and 32 cover browser tabs and bookmarks, 180 is the Apple touch icon for iOS home screens, and 192 and 512 are used by Android and the web app manifest. The remaining sizes cover older platforms and high-density displays. The ZIP includes all of them, so you can drop in the full set and stop thinking about it.",
      },
      {
        question: "Do I need an .ico file?",
        answer:
          "Not any more for practical purposes. Every current browser accepts PNG favicons, which is why this generator produces PNGs. A multi-resolution .ico is only worth pursuing if you must support very old versions of Internet Explorer.",
      },
      {
        question: "Why does my logo look unreadable at 16px?",
        answer:
          "Because 16×16 is 256 pixels in total — far too few for fine detail or text. Icons that work at that size are simple bold shapes, typically a single letter or symbol. Most brands use a simplified mark for the favicon rather than the full logo.",
      },
      {
        question: "How do I install the favicons?",
        answer:
          "Copy the PNGs to the root of your site, then add the link tags from the included README.txt to your page head. The ZIP also contains a site.webmanifest referencing the 192 and 512 icons for Android and installable web apps.",
      },
      {
        question: "Is my logo uploaded anywhere?",
        answer:
          "No. Every size is rendered on a canvas in your browser and zipped locally, so unreleased branding never leaves your machine.",
      },
    ],
  },

  "currency-converter": {
    intro:
      "Exchange rates move constantly, and the number you see quoted in the news is almost never the number you get. This converter uses the mid-market rate — the midpoint between what buyers and sellers are trading at, and the rate banks quote each other. It is the honest benchmark to plan against, but be clear that it is not what your bank will give you: retail providers add a margin on top, which is where most of their money on a transfer is made.",
    howTo: {
      title: "How to convert currency",
      steps: [
        "Enter the amount you want to convert.",
        "Pick the currency you are converting from, then the one you want it in. USD to INR is the default.",
        "Read the converted figure, along with the rate in both directions underneath.",
        "Use the swap button to reverse the pair, or a popular-pair button to jump straight to a common conversion.",
      ],
    },
    useCases: [
      {
        title: "Checking what a transfer should cost",
        body:
          "Comparing your provider's quoted rate against the mid-market rate shows their margin immediately. On a large transfer, a 3% spread is often far more than the advertised 'zero fee' saved you.",
      },
      {
        title: "Pricing international invoices",
        body:
          "Freelancers and exporters billing in dollars need to know what a figure lands as in rupees. Because the rate moves between invoicing and payment, quoting from the current mid-market rate with a small buffer is the usual approach.",
      },
      {
        title: "Budgeting for travel or online purchases",
        body:
          "Card networks convert at close to mid-market and then add their own fee, so the mid-market figure is a reasonable floor for what a foreign purchase will cost you.",
      },
    ],
    tips: [
      "The mid-market rate is a benchmark, not an offer. Nobody sells you currency at it.",
      "A provider advertising 'no fees' usually recovers the cost in a wider spread. Compare the total amount received, not the fee.",
      "Rates from these providers update roughly daily, so this is right for planning and estimating rather than for timing a trade.",
      "Airport and hotel exchange desks are consistently the worst rates available — often 8-12% off mid-market.",
    ],
    extraFaqs: [
      {
        question: "Why does my bank give me a worse rate than this?",
        answer:
          "Because this is the mid-market rate — the midpoint of the interbank market — and no retail provider sells at it. Banks and card networks add a margin, typically 1-4% for a bank transfer and 0.5-2% for a card, sometimes alongside a fixed fee. A rate 3% below mid-market on a transfer of 100,000 rupees costs you 3,000 rupees, which is usually far more than any headline fee.",
      },
      {
        question: "How often are these rates updated?",
        answer:
          "The providers refresh roughly once a day, and the exact timestamp is shown beneath the result. That is appropriate for budgeting, invoicing, and comparing offers. It is not a live trading feed, so do not use it to time a transaction to the minute.",
      },
      {
        question: "Does this tool work offline like the others?",
        answer:
          "No, and it is the only one here that does not. A converter has to ask somebody what today's rate is, so it makes a request to an exchange-rate provider. That request contains no personal data — it just fetches the public rate table — but it does mean the tool needs a working connection, unlike the PDF and image tools.",
      },
      {
        question: "How many currencies are supported?",
        answer:
          "More than 160, covering every widely traded currency. The most searched ones are grouped at the top of each picker, with the full list underneath.",
      },
      {
        question: "What is the difference between the mid-market and the buy/sell rate?",
        answer:
          "Currency trades with two prices: a bid (what buyers will pay) and an ask (what sellers want). The mid-market rate sits exactly between them. Providers quote you a rate on the unfavourable side of that midpoint, and the gap is their spread.",
      },
      {
        question: "Can I use these figures for accounting or tax?",
        answer:
          "Check first. Tax authorities usually specify which rate to use — often a central bank reference rate on a particular date, or an annual average. The mid-market rate here may not match the one your jurisdiction requires, so confirm with your accountant before filing.",
      },
    ],
  },
};

/** Returns the long-form content for a tool, if any has been written. */
export function getToolContent(slug: string): ToolContent | undefined {
  return TOOL_CONTENT[slug];
}
