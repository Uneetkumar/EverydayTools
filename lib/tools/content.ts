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
      "A JSON Web Token is three Base64URL-encoded segments separated by dots: a header describing the signing algorithm, a payload of claims, and a signature. The first two are readable by anyone — a JWT is signed, not encrypted. This tool decodes the header and payload, explains every claim in plain words, shows whether the token is valid, expired or not yet valid, and verifies the signature when you give it the secret or the issuer's public key (HS, RS, PS, ES and EdDSA algorithms, with PEM, JWK or JWKS keys). It can also create and sign test tokens. Everything happens in your browser with its built-in Web Crypto; tokens and keys are never sent anywhere.",
    howTo: {
      title: "How to decode and verify a JWT",
      steps: [
        "Paste the token. A “Bearer ” prefix, quotes or line breaks copied along with it are ignored.",
        "Check the status: whether it has expired or isn't valid yet, when it was issued and how long it lasts.",
        "Read the claims table — each value is explained, and times are shown as dates in your time zone.",
        "To confirm it's genuine, enter the secret (for HS256) or paste the issuer's public key or JWKS (for RS256, ES256 and others). A matching signature proves the token hasn't been changed.",
        "To make a test token instead, switch to Create a token, edit the claims and sign it with a secret or a generated test key.",
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
          "No, and this is the most important thing to understand about JWTs. Decoding only reverses the Base64URL encoding of the header and payload; anyone can do it. Verifying the signature needs the issuer's secret or public key. You can check it here with that key, but your servers must always verify every token themselves — a token can decode perfectly and still be forged.",
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
      "A UUID is a 128-bit identifier you can generate independently on any machine with a vanishing probability of collision — no coordination, no central sequence, no database round trip. This generator follows RFC 9562, the 2024 standard that replaced RFC 4122. Version 4 is 122 bits of randomness; version 7 starts with the creation time, so IDs sort in the order they were made, which keeps database indexes fast; versions 5 and 3 turn a namespace and a name into the same UUID every time. Make up to 1,000 at once in the format your code needs, or paste any UUID to see which version it is and, for time-based ones, when it was created. Everything uses your browser's cryptographic random source and stays on your device.",
    howTo: {
      title: "How to generate a UUID",
      steps: [
        "Pick a version: 4 for general use, 7 for database primary keys, 5 to derive an ID from a name such as a domain or URL.",
        "Choose how many you need — one for a quick test, or up to 1,000 for seed data. For version 5, type one name per line instead.",
        "Choose the format: standard, no hyphens, braces or urn:uuid:, and list them one per line, comma-separated, as JSON or as SQL values.",
        "Copy one, copy them all, or download the list. To check an existing UUID, switch to Inspect a UUID and paste it.",
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

  "qr-code-scanner": {
    intro:
      "This client-side QR code scanner reads and decodes QR codes directly inside your web browser. Using your device camera or image uploads, it automatically parses the contents — transforming raw payloads into structured contact cards (vCards), Wi-Fi network credentials, clickable URLs, calendar events, and payment links with zero server uploads.",
    howTo: {
      title: "How to scan and extract QR code data",
      steps: [
        "Select your preferred scanning mode: 'Upload Image or Paste' to analyze a saved photo or screenshot, or 'Live Camera Scanner' to point your camera at a physical QR code.",
        "When using camera mode, align the QR code inside the viewfinder box. The scanner recognizes the code automatically in milliseconds.",
        "Review the structured extracted data. Click 'Save to Phone Contacts' for vCards, 'Copy Wi-Fi Password' for networks, or 'Open Website' for web URLs.",
        "Switch to the 'Raw Payload' tab if you want to inspect or copy the exact underlying string encoded inside the QR matrix.",
      ],
    },
    useCases: [
      {
        title: "Extracting contact details from business cards",
        body:
          "Easily scan vCard QR codes on printed business cards, badges, and exhibition stands. Download the parsed .vcf file to import all phone numbers, email addresses, and job titles directly into your contacts.",
      },
      {
        title: "Revealing hidden Wi-Fi credentials",
        body:
          "Scan hospitality or office Wi-Fi QR codes to view the network SSID, authentication type, and password in plain text, making it easy to share credentials with non-camera devices.",
      },
      {
        title: "Auditing QR code security and destination URLs",
        body:
          "Inspect suspicious or unknown QR codes safely without automatically opening the browser. Review the destination link, protocol, and domain before choosing to open it.",
      },
    ],
    tips: [
      "Ensure sufficient lighting when scanning physical codes with your webcam or phone camera.",
      "If scanning a crumpled or glossy paper QR code, angle the device slightly to eliminate harsh light glare.",
      "You can paste screenshots directly into the scanner using Ctrl+V on Windows or Cmd+V on Mac.",
      "All image decoding runs locally in browser WebAssembly and JavaScript — no camera video or image data is ever uploaded.",
    ],
    extraFaqs: [
      {
        question: "Is my camera stream or uploaded photo sent to any server?",
        answer:
          "No. All image processing and barcode extraction happen entirely inside your browser using client-side JavaScript. TabBench never receives, stores, or transmits your photos or video feed.",
      },
      {
        question: "Can this tool read inverted (white on black) QR codes?",
        answer:
          "Yes. The decoding engine tests both standard dark-on-light and inverted light-on-dark orientations automatically.",
      },
      {
        question: "What types of QR codes can be automatically parsed?",
        answer:
          "The extractor parses standard website URLs, vCard 3.0 business cards, Wi-Fi networks (WPA/WEP/Open), iCal calendar events, email links (mailto and MATMSG), phone calls (tel), SMS messages, UPI payments, and JSON data.",
      },
    ],
  },

  "barcode-generator": {
    intro:
      "Barcodes encode numbers and text into parallel lines with varying widths and spacings, readable by laser scanners and camera readers across retail, logistics, and warehousing. This generator creates crisp, high-precision barcodes directly in your browser with automatic check-digit calculation and vector SVG export.",
    howTo: {
      title: "How to generate custom barcodes",
      steps: [
        "Choose the required barcode symbology standard: Code 128 for shipping & logistics, EAN-13 for international retail, UPC-A for US/Canada retail, or Code 39 for industrial assets.",
        "Enter your barcode value. If using EAN-13 or UPC-A, you can enter the initial digits and click 'Apply Check Digit' to let the system compute the mandatory check digit automatically.",
        "Adjust bar height, width, quiet zone margins, and toggle human-readable text below the barcode.",
        "Download your barcode as a high-resolution PNG for digital use or vector SVG for crisp, commercial print packaging.",
      ],
    },
    useCases: [
      {
        title: "Retail product packaging",
        body:
          "Generate EAN-13 or UPC-A barcodes for retail items, books, food packaging, and consumer goods compliant with point-of-sale checkout scanners.",
      },
      {
        title: "Warehouse inventory & logistics tracking",
        body:
          "Produce Code 128 barcodes for SKU inventory labels, pallet routing tags, bin locations, and shipping manifest tracking.",
      },
      {
        title: "Outer shipping carton marking",
        body:
          "Generate 14-digit ITF-14 barcodes engineered specifically to scan reliably when printed on coarse brown corrugated cardboard cartons.",
      },
    ],
    tips: [
      "Always maintain a clean quiet zone (margin) on both ends of the barcode — without margins, optical scanners cannot detect where the code begins.",
      "Always export as vector SVG for print production. Bitmap PNGs scaled up in printing software can blur bar edges and cause scan failures.",
      "High contrast is essential: always print dark bars (black or dark navy) on a clean white or light reflective background.",
      "Test printed sample barcodes with a physical scanner or phone scanner app before beginning large print runs.",
    ],
    extraFaqs: [
      {
        question: "What is the difference between Code 128 and EAN-13?",
        answer:
          "Code 128 can encode letters, numbers, and symbols, making it the dominant choice for logistics, courier labels, and asset tags. EAN-13 is strictly numeric (13 digits) and is reserved for retail point-of-sale scanning globally.",
      },
      {
        question: "How does the check digit calculation work?",
        answer:
          "Standards like EAN-13 and UPC-A use a modulo-10 algorithm with alternating weights (1 and 3). The generator computes this mathematically to ensure the final code passes scanner parity checks.",
      },
      {
        question: "Can I print barcode labels directly from the browser?",
        answer:
          "Yes. Click 'Print Label' to open an optimized print dialog that renders the vector barcode cleanly on your local desktop or thermal label printer.",
      },
    ],
  },

  "barcode-scanner": {
    intro:
      "This client-side Barcode Scanner reads 1D linear barcodes and 2D matrix symbologies in real time using your device camera or uploaded image files. Ideal for warehouse inventory checks, retail product lookups, and batch scanning without dedicated handheld hardware.",
    howTo: {
      title: "How to scan and read barcodes",
      steps: [
        "Select 'Upload Image or Paste' to drop a photo or screenshot, or 'Live Camera Scanner' for continuous real-time reading.",
        "Hold the barcode level within the viewfinder. The animated laser guide helps align horizontal barcodes for instant detection.",
        "Once scanned, view the detected barcode standard, decoded value, and click 'Search Product Info' to check retail item details on Google.",
        "Enable 'Batch Scan Mode' if you need to scan a succession of barcodes for inventory counting, then export the entire list to CSV.",
      ],
    },
    useCases: [
      {
        title: "Retail product lookup",
        body:
          "Scan EAN-13 or UPC barcodes on retail items to immediately look up product details, pricing, reviews, and specifications online.",
      },
      {
        title: "Warehouse inventory & stock audits",
        body:
          "Use batch scan mode on mobile or tablet to scan boxes, assets, and bin tags in sequence without stopping, exporting the final scan manifest as CSV.",
      },
      {
        title: "Shipping manifest verification",
        body:
          "Verify incoming and outgoing courier tracking numbers encoded in Code 128 or Code 39 format directly on your laptop webcam.",
      },
    ],
    tips: [
      "Hold the barcode perpendicular to the scanning line for the fastest read rates.",
      "If scanning with a smartphone, hold the camera roughly 15–20 cm away to allow the lens to focus crisply.",
      "Avoid strong reflections or glossy glare over the black bars by tilting the package slightly.",
      "The scanner supports multi-symbology auto-detection, meaning you do not need to configure the barcode format ahead of time.",
    ],
    extraFaqs: [
      {
        question: "Which 1D and 2D barcode types are supported?",
        answer:
          "The scanner detects EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39, Interleaved 2 of 5 (ITF), Codabar, QR Code, and Data Matrix.",
      },
      {
        question: "How does batch scanning work?",
        answer:
          "When Batch Scan Mode is turned on, the camera stays active after each scan and appends newly detected items to a list with timestamps, preventing accidental duplicates and offering a 1-click CSV download.",
      },
      {
        question: "Is internet access required to scan barcodes?",
        answer:
          "No. All barcode recognition runs 100% locally in your browser. Internet access is only utilized if you choose to click the external product search link.",
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

  "png-to-svg": {
    intro:
      "Raster PNG images are locked to fixed pixel grids — when enlarged for printing, high-DPI displays, or large banners, edges become blurry and jagged. This converter traces raster images into resolution-independent SVG vector graphics right in your browser. Whether you need color-quantized vector layers, crisp black-and-white silhouettes for vinyl cutting and logos, or retro pixel art preservation, our vectorizer generates clean mathematical SVG path geometry locally with zero file uploads.",
    howTo: {
      title: "How to convert PNG to SVG online",
      steps: [
        "Upload your PNG, JPG, or WebP image, or paste it directly from your clipboard.",
        "Choose your vectorization mode: 'Color Layers' for multi-colored graphics, 'Monochrome' for high-contrast stencils and logos, 'Pixel Art' for block graphics, or 'Embed SVG' for lossless container wrapping.",
        "Adjust color palette depth, threshold cutoff, and speckle noise suppression to fine-tune the resulting vectors.",
        "Inspect the live vectorized result in the side-by-side preview panel. Use the zoom controls (100% to 400%) to verify razor-sharp scalability.",
        "Click 'Download Vector SVG' to save the .svg file, or switch to the 'SVG XML Markup' tab to copy the code directly.",
      ],
    },
    useCases: [
      {
        title: "Logos & branding assets for responsive web design",
        body:
          "Transform raster company logos into lightweight SVG vectors that render perfectly sharp on everything from mobile screens to 8K retina displays.",
      },
      {
        title: "Vinyl cutting, laser engraving & embroidery",
        body:
          "Convert silhouettes, graphics, and stencils into vector cut paths compatible with Cricut, laser cutters, CNC machines, and embroidery software.",
      },
      {
        title: "Print media & merchandise scaling",
        body:
          "Scale up small PNG graphics for large-format t-shirt printing, signage, and billboards without pixelation or loss of detail.",
      },
    ],
    tips: [
      "For best results with logos and icons, use images with clean contrast and transparent or plain solid backgrounds.",
      "In Monochrome mode, adjust the Threshold slider to capture thin line details or reinforce heavier solid fills.",
      "Use the Noise/Speckle filter to eliminate isolated single-pixel artifacts and create cleaner, smaller SVG files.",
    ],
    extraFaqs: [
      {
        question: "Will the generated SVG lose quality when resized?",
        answer:
          "No. SVG files are vector-based and defined by mathematical paths and curves. You can scale them to any size without any degradation or pixelation.",
      },
      {
        question: "Can I edit the generated SVG in Illustrator or Figma?",
        answer:
          "Yes! The downloaded SVG contains standard vector <path> elements with fill attributes that you can import and edit in Adobe Illustrator, Figma, Inkscape, or Canva.",
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
        "The tool opens the document and redraws every page into a new PDF with no password or restrictions. If the file was never locked, it says so instead.",
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
        title: "Sharing a document without its password",
        body:
          "A statement protected with your date of birth is awkward to forward to an accountant. An unlocked copy can be shared without also sending the password.",
      },
    ],
    tips: [
      "If you do not know the user password, no tool can open the document — it is genuinely encrypted, and that is the point.",
      "Keep the original protected file. Unlocking produces a new copy rather than modifying the source.",
      "An unlocked PDF has no restrictions at all, so be deliberate about where you store and send it.",
      "The unlocked copy stores pages as images, so its text cannot be selected or searched. If you need the text, copy it from the original in a PDF reader after opening it with the password.",
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
      "This tool inspects a PDF rather than re-compressing it: it reports the page count and paper sizes, the document properties, whether it is encrypted, and how much of the file is images and embedded fonts, so you can see what you are dealing with before deciding how to shrink it. It does not re-encode the images inside the file, because doing that properly needs image codecs that pdf-lib does not provide. What follows is the approach that actually works, using the tools available here.",
    howTo: {
      title: "How to inspect a PDF and reduce its size",
      steps: [
        "Upload the PDF to see its page count, size, and metadata.",
        "Read the note under “What makes it this size”: it tells you whether scanned pages, images or embedded fonts carry the weight.",
        "Remove what you do not need. Use the Split PDF tool to extract only the pages you actually have to submit — this is usually the single biggest reduction available.",
        "If the file is a scan and still too large, rescan the original at 150–200 DPI rather than 600. Reducing the source resolution beats any post-processing.",
        "For a document you generated yourself, re-export it from the original application with image quality set lower.",
      ],
    },
    useCases: [
      {
        title: "Diagnosing an oversized PDF before you act",
        body:
          "A 30MB three-page PDF and a 30MB 200-page PDF need completely different fixes. Checking the page count first tells you which problem you have.",
      },
      {
        title: "Trimming a document to a submission limit",
        body:
          "When a form asks for one page of a statement, extracting that page removes far more weight than any compression setting would.",
      },
      {
        title: "Checking document metadata before sharing",
        body:
          "PDFs carry the title and author from whatever produced them, which sometimes reveals an internal filename or a colleague's name you would rather not send out.",
      },
    ],
    tips: [
      "Page count against file size is the fastest diagnostic: more than about 1MB per page means the pages are images, not text.",
      "Text-based PDFs exported from Word are already compact. If yours is large and text-only, the cause is usually embedded fonts or an oversized logo.",
      "Rescanning at a lower DPI is more effective than any amount of post-processing, and it does not stack compression artefacts.",
      "Splitting out the pages you need is lossless, unlike image re-compression.",
    ],
    extraFaqs: [
      {
        question: "Does this tool actually compress the PDF?",
        answer:
          "No, and it is worth being clear about that. It inspects the document and reports what is inside it. True PDF compression means decoding every embedded image, re-encoding it at lower quality, and rebuilding the file — which needs image codecs this browser-side library does not include. Anything claiming to do that purely with pdf-lib is re-saving your file and reporting the small difference as a saving.",
      },
      {
        question: "Then how do I actually make my PDF smaller?",
        answer:
          "In order of effectiveness: remove pages you do not need with the Split PDF tool, rescan the source at 150–200 DPI instead of 600, or re-export from the original application at lower image quality. For a scan that must keep every page at full fidelity, a desktop tool such as Ghostscript will do genuine image re-encoding.",
      },
      {
        question: "Why is my PDF so large in the first place?",
        answer:
          "Almost always embedded images. A page scanned at 600 DPI is roughly sixteen times the data of the same page at 150 DPI, with no visible benefit on screen or in ordinary print.",
      },
      {
        question: "Is my document uploaded to inspect it?",
        answer:
          "No. The PDF is parsed in your browser with pdf-lib and nothing is transmitted.",
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
        "Enter the amount and select the GST rate — 5%, 18% or 40% since 22 September 2025, or type another rate.",
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
          "That is determined by the HSN code for goods or the SAC code for services, as published by the GST Council. Since 22 September 2025 the main slabs are 5% and 18%, with 40% on luxury and sin goods, 3% on gold, and some items zero-rated or exempt. This calculator applies whichever rate you select — it cannot determine the correct classification for you, and misclassification is a compliance matter worth confirming with your accountant.",
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

  "image-to-text": {
    intro:
      "OCR turns a picture of text back into text you can select, search and edit. It matters more than it sounds: a scanned contract, a screenshot of an error message, a photographed receipt — all of them hold information your computer cannot read, because to the machine they are just coloured pixels arranged in shapes. This tool offers two recognisers with genuinely different trade-offs. The default runs entirely inside your browser: the image is never uploaded, it works offline once loaded, and there is no usage limit. The optional AI mode sends the image to Google and reads things the on-device engine cannot — handwriting, table layouts, and scripts other than Latin. Which one you should use depends less on quality than on what is in the picture.",
    howTo: {
      title: "How to extract text from an image",
      steps: [
        "Upload a PNG, JPG, WebP or BMP, or paste a screenshot straight from your clipboard.",
        "Leave the recogniser on On-device unless you need what the AI mode adds. On-device keeps the image on your machine.",
        "Press Extract text. The first on-device run downloads about 9MB of recognition data; after that it is cached and near-instant.",
        "Read the confidence score. Below about 70% you should expect mistakes and check the result against the image.",
        "Correct anything wrong directly in the output box, then copy it or download it as a .txt file.",
      ],
    },
    useCases: [
      {
        title: "Getting text out of a scanned PDF",
        body:
          "A scan has no text layer, which is why converting one to Word produces an empty document and why a PDF editor cannot find any words to change. Export the page as an image, run it through here, and you have text again. This is the single most common reason people need OCR.",
      },
      {
        title: "Copying from a screenshot",
        body:
          "Error messages, chat threads and slides are constantly shared as images. Rather than retyping a stack trace by hand, extract it and paste it into your terminal or a search box.",
      },
      {
        title: "Digitising receipts and invoices",
        body:
          "Photographs of receipts are awkward: the paper curves, the lighting is uneven, and the layout is columnar. The AI mode handles all three considerably better than the on-device engine, though it means uploading the image.",
      },
      {
        title: "Reading handwriting",
        body:
          "Classical OCR is built around printed letterforms and does poorly on handwriting. If your image is handwritten, the on-device mode will likely return nonsense and the AI mode is the only realistic option.",
      },
    ],
    tips: [
      "Resolution matters more than file size. A sharp 1000px-wide crop of the text beats a 12MP photo of the whole page.",
      "Straighten the image first if it was photographed at an angle: on-device OCR assumes roughly horizontal lines of text.",
      "Crop to just the region you need. Less surrounding clutter means fewer spurious characters.",
      "Low contrast is the most common cause of poor results. Dark text on a light background reads far better than grey on grey.",
      "The on-device engine is English-only here. For other scripts, use the AI mode.",
    ],
    extraFaqs: [
      {
        question: "Which mode should I use for something confidential?",
        answer:
          "On-device, without exception. It runs in your browser and the image never leaves your machine, so an ID card, a bank statement or a medical letter stays with you. The AI mode uploads the image to Google and should not be used for anything you would not email.",
      },
      {
        question: "Why is the accuracy lower than my phone's built-in scanner?",
        answer:
          "Phone scanners pre-process aggressively — deskewing, sharpening and thresholding the image before recognition, often using a dedicated model. Here you get the raw recogniser, so preparing the image yourself (crop, straighten, increase contrast) makes a large difference.",
      },
      {
        question: "Does it keep the original layout?",
        answer:
          "Reading order is preserved and line breaks are usually right, but columns and tables are flattened by the on-device engine. The AI mode is asked to keep table rows together with tab-separated columns, which holds up reasonably well.",
      },
    ],
  },
  "hash-generator": {
    intro:
      "A cryptographic hash reduces any input to a fixed-length fingerprint. The same input always produces the same hash, and any change — even a single bit — produces a completely different one. Hashes are used to verify downloads, detect changes, deduplicate content and sign messages. This generator hashes text or files of any size with MD5, SHA-1, SHA-256, SHA-384, SHA-512, SHA-3 and CRC32, and checks the result against a hash you paste from a download page. It can also produce HMAC signatures for checking webhooks. Files are read a few megabytes at a time in your browser, so even a multi-gigabyte download is never uploaded or held in memory at once.",
    howTo: {
      title: "How to check a file's hash",
      steps: [
        "Choose File and drop in the download, or choose Text and type or paste what you want to hash.",
        "Turn on the algorithms you need. SHA-256 is the usual choice; the one the publisher used is the one to compare.",
        "Paste the published hash into Check against a published hash. The matching row turns green, or you are told it doesn't match.",
        "Copy any hash in hex, upper-case hex or Base64. For webhook signatures, turn on HMAC and enter the secret key.",
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
      "A text hash that doesn't match is usually a line break: echo \"text\" | sha256sum hashes the text plus a newline. Use echo -n, or printf, to match what you type here.",
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
        "Type a question, or paste a formula, spreadsheet function, regex or code snippet. Free-form questions are answered by Google Gemini, so they need an internet connection.",
        "Press Explain, or Ctrl + Enter, and read the answer as it is written.",
        "Check anything you will rely on, especially numbers: AI answers can be confidently wrong.",
        "For common formulas — margin and markup, percentage change, compound interest, EMI, GST, SIP, BMI, JWT — pick a topic under \"Common formulas, explained\" for a checked explanation that works offline.",
        "Follow the link under each explanation to the matching calculator and try it with your own numbers.",
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
          "Some older email clients (such as legacy Outlook) do not render WebP images. Converting to JPG makes the image display in every email client.",
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
  "sample-file-generator": {
    intro:
      "Testing an upload form means finding a file of the right size, and hunting through your downloads folder for something near 2MB wastes a morning. This generates one to order: pick a type and a size and you get four freshly randomised files that are genuinely valid — the images open in an image viewer, the PDFs in a reader, the Word files in Word.",
    howTo: {
      title: "How to generate a sample file",
      steps: [
        "Pick a file type — image, PDF, Word, CSV, JSON, plain text, or a short video.",
        "Choose a target size from the presets, or type an exact figure in kilobytes.",
        "Generate. Four different samples appear, each with randomised content so no two look alike.",
        "Download the one you want, or copy a small image as a data URL to paste straight into HTML or CSS.",
      ],
    },
    useCases: [
      {
        title: "Testing an upload limit",
        body:
          "A form that claims to reject files over 2MB needs a file just under and just over that line. Generating both takes seconds and tells you whether the validation actually works.",
      },
      {
        title: "Filling a design or demo with placeholder media",
        body:
          "Randomised gradient images at the right dimensions stand in for real photography while a layout is still being built, without licensing anything.",
      },
      {
        title: "Exercising a file pipeline",
        body:
          "Storage quotas, virus scanners, thumbnail generators, and progress bars all behave differently on a 10KB file and a 10MB one. Having both on demand makes those paths easy to check.",
      },
    ],
    tips: [
      "The size is exact. Content is scaled close to the target, then the file is padded using bytes each format ignores — after JPEG's end marker, after a PDF's %%EOF, after a ZIP's central directory.",
      "Video is the exception: MediaRecorder chooses its own bitrate and the container cannot be padded, so length is what you control rather than size.",
      "Recording video happens in real time — a five-second clip takes five seconds.",
      "Every generation is random, so hitting Generate again gives you completely different files at the same size.",
    ],
    extraFaqs: [
      {
        question: "Are these real files or just padded junk?",
        answer:
          "Real files. Each one is generated properly for its format — the PDFs are built with pdf-lib and have actual pages and text, the Word files are valid OOXML, the images are drawn on a canvas. Padding only tops up the final byte count using regions the format specification says to ignore, so every file opens normally.",
      },
      {
        question: "Why is the video size not exact?",
        answer:
          "Because it is encoded by the browser's own recorder, which picks a bitrate based on the content, and WebM does not tolerate trailing bytes the way JPEG and PDF do. You choose the duration instead, and the resulting size will be in the right region rather than exact.",
      },
      {
        question: "Can I get a shareable link to the generated image?",
        answer:
          "Not a hosted one. This site has no server and stores nothing, so there is nowhere for a file to live at a public URL. What you can copy is a data URL for images under 200KB, which works pasted directly into HTML, CSS, or a Markdown file — self-contained, though much longer than a normal link.",
      },
      {
        question: "Is anything uploaded?",
        answer:
          "No. Every file is generated in your browser and written straight to your downloads. Nothing is transmitted.",
      },
      {
        question: "What is the largest file I can generate?",
        answer:
          "Sizes into the tens of megabytes work fine. Very large targets take longer and use memory proportional to the file, since the whole thing is held in the tab before download.",
      },
    ],
  },

  "notepad": {
    intro:
      "Most note apps want an account before they will let you write a sentence. This one opens straight into an empty page and saves as you type, to this browser and nowhere else. It is the right tool for the note you need for the next ten minutes — a phone number, a draft reply, something pasted out of a call — rather than the one you need on three devices next year.",
    howTo: {
      title: "How to use the online notepad",
      steps: [
        "Click New note and start typing. There is nothing to set up.",
        "Your text saves automatically a moment after you stop typing — the 'saved' marker confirms it.",
        "Create as many notes as you like; the first line becomes the title in the list.",
        "Filter across all notes once you have a few, and download any note as a .txt file.",
      ],
    },
    useCases: [
      {
        title: "A scratchpad during a call",
        body:
          "Names, numbers, and action items need somewhere to go immediately. Opening a tab is faster than opening an app, and the note is still there when you come back.",
      },
      {
        title: "Drafting before pasting elsewhere",
        body:
          "Writing a reply here rather than directly in a web form means a stray refresh does not lose the draft.",
      },
      {
        title: "Holding text between machines-worth of copying",
        body:
          "Somewhere to park a block of text while you reformat it, strip it, or run it through another tool on this site.",
      },
    ],
    tips: [
      "Notes are per-browser. Opening the site in a different browser, or in private mode, shows a different set.",
      "Clearing your browser's site data deletes them. Download anything you would be upset to lose.",
      "The first non-empty line becomes the title, so starting with a short heading keeps the list readable.",
      "It works offline once the page has loaded, since nothing about it needs the network.",
    ],
    extraFaqs: [
      {
        question: "Where exactly are my notes stored?",
        answer:
          "In this browser's localStorage, on this device. They are never uploaded, which is why there is no signup and why the tool works instantly. The trade-off is real: they will not sync to your phone, and clearing site data removes them.",
      },
      {
        question: "Will I lose my notes?",
        answer:
          "They persist across refreshes and browser restarts. They are lost if you clear site data, use private browsing, or open the site in a different browser. For anything important, use the download button to keep a .txt copy.",
      },
      {
        question: "Is there a size limit?",
        answer:
          "localStorage caps out at roughly 5MB per site, which is well over a million characters of notes. You would have to write a long book to reach it.",
      },
      {
        question: "Can other people see my notes?",
        answer:
          "Not through this site — nothing is transmitted and there is no server holding them. Anyone with access to your unlocked device and this browser profile can read them, exactly as with any local file.",
      },
    ],
  },

  "text-to-speech": {
    intro:
      "Hearing your own writing read back is the fastest proofreading trick there is — the ear catches clumsy sentences the eye slides over. This reads any text aloud using the voices already installed on your device, which means it starts instantly, costs nothing, and sends your text nowhere.",
    howTo: {
      title: "How to convert text to speech",
      steps: [
        "Paste or type the text you want read aloud.",
        "Pick a voice. The list comes from your operating system, so it differs between Windows, macOS, Android, and iOS.",
        "Adjust speed and pitch if the default reading is too fast or too flat.",
        "Press Play. You can pause and resume, or stop and restart after an edit.",
      ],
    },
    useCases: [
      {
        title: "Proofreading by ear",
        body:
          "A sentence that is hard to say is usually hard to read. Listening to a draft surfaces run-ons and repeated words far more reliably than re-reading it.",
      },
      {
        title: "Listening instead of reading",
        body:
          "An article or a long email can be listened to while doing something else, at a speed you control.",
      },
      {
        title: "Accessibility and language learning",
        body:
          "Hearing correct pronunciation alongside the written word helps both people with reading difficulties and anyone learning a new language.",
      },
    ],
    tips: [
      "Speed around 1.2–1.4x is comfortable for listening once you are used to it; 1.0 is better for proofreading.",
      "Voices are provided by your operating system. If you only see one or two, more can be installed in your system's speech or accessibility settings.",
      "Punctuation matters — commas and full stops become pauses, so badly punctuated text sounds wrong.",
      "Very long text may be cut short by the browser. Read it in sections if it stops early.",
    ],
    extraFaqs: [
      {
        question: "Is my text sent to a server?",
        answer:
          "No. Speech synthesis uses voices installed on your own device through the browser's built-in API, so the text is spoken locally and never transmitted. This is the opposite of the voice-to-text tool, which does rely on a cloud service.",
      },
      {
        question: "Why do the available voices differ from someone else's?",
        answer:
          "Because they come from the operating system rather than from this site. macOS, Windows, Android, and iOS each ship a different set, and browsers expose whatever is installed. Nothing here can add voices — that is a system setting.",
      },
      {
        question: "Can I download the audio as an MP3?",
        answer:
          "Not from this tool. The browser's speech API plays audio directly and does not expose it as a file that can be captured. Producing a downloadable audio file requires a server-side service, which would mean sending your text away.",
      },
      {
        question: "Why does it stop partway through long text?",
        answer:
          "Some browsers impose a limit on the length of a single utterance and cut off after a few thousand characters. Splitting the text into sections and playing them in turn is the reliable workaround.",
      },
    ],
  },

  "speech-to-text": {
    intro:
      "Speaking is roughly three times faster than typing, which makes dictation genuinely useful for first drafts, notes, and anything long. This turns speech into editable text live in the browser, with support for English, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati and more. One important caveat is stated up front: unlike the rest of this site, it is not fully private.",
    howTo: {
      title: "How to convert voice to text",
      steps: [
        "Choose your language. Accuracy drops sharply if the setting does not match what you are speaking.",
        "Press Start listening and allow microphone access when the browser asks.",
        "Speak normally. Words appear as you talk, with the in-progress phrase shown until it settles.",
        "Press Stop, then edit the transcript directly before copying or downloading it.",
      ],
    },
    useCases: [
      {
        title: "Drafting faster than you can type",
        body:
          "For a long email or a first draft, dictating and then editing is usually quicker than typing and editing, particularly on a phone.",
      },
      {
        title: "Capturing thoughts while away from a keyboard",
        body:
          "Notes taken by speaking are notes that actually get taken. Editing afterwards is far easier than reconstructing them from memory.",
      },
      {
        title: "Typing in Indian languages without a keyboard layout",
        body:
          "Dictating Hindi, Tamil, or Bengali avoids installing a keyboard layout or hunting for transliteration, which is where most people give up.",
      },
    ],
    tips: [
      "Say punctuation aloud — 'comma', 'full stop', 'new paragraph' — as most engines recognise these commands.",
      "A quiet room and a close microphone matter more than an expensive one.",
      "Speak in complete phrases rather than word by word; the engine uses surrounding context to choose between similar-sounding words.",
      "Firefox does not implement speech recognition. Use Chrome, Edge, or Safari.",
    ],
    extraFaqs: [
      {
        question: "Is my voice sent to a server?",
        answer:
          "In Chrome and Edge, yes. Those browsers stream the captured audio to a cloud speech service to transcribe it, and neither this site nor any website using the standard API can change that. Safari performs recognition on-device. Because of this, dictating confidential material is not advisable, and this tool does not carry the client-side privacy badge the rest of the site uses.",
      },
      {
        question: "Why does it stop listening on its own?",
        answer:
          "Browsers end a recognition session after a stretch of silence, and some cap the total length. Press Start again to continue — previously transcribed text is kept, so nothing is lost.",
      },
      {
        question: "Which languages are supported?",
        answer:
          "Fourteen are offered here, including English in US, UK, and Indian variants, plus Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Spanish, French, German, Arabic, and Japanese. Accuracy varies by language and accent, and the English variants matter — 'en-IN' recognises Indian English considerably better than 'en-US' does.",
      },
      {
        question: "How accurate is it?",
        answer:
          "Good for clear speech in a quiet room — typically well above ninety percent for common languages. It degrades with background noise, strong accents, technical vocabulary, and proper nouns. Treat the output as a draft to edit rather than a finished transcript.",
      },
      {
        question: "Does it work on a phone?",
        answer:
          "Yes, in Chrome on Android and Safari on iOS. Phone microphones are close to your mouth, which often makes accuracy better than on a laptop.",
      },
    ],
  },
  "video-player": {
    intro:
      "Sometimes you just need to watch a file without installing anything — a clip someone sent you, a recording off a camera, a download you want to check before filing. This opens video straight from your device and plays it with proper controls: a real seek bar, adjustable speed, picture-in-picture, and a playlist if you drop several files at once.",
    howTo: {
      title: "How to play a video file in your browser",
      steps: [
        "Drag a video onto the drop zone, or click it to browse. You can select several files at once.",
        "Press play. The file streams from disk, so even a multi-gigabyte video starts instantly.",
        "Adjust speed if you are reviewing footage — 1.5x is comfortable for most talking-head video.",
        "Use picture-in-picture to keep watching while you work in another tab.",
      ],
    },
    useCases: [
      {
        title: "Checking a file before you send it",
        body:
          "Confirming that an export actually plays, and that the audio is in sync, takes ten seconds here and saves sending a broken file.",
      },
      {
        title: "Reviewing footage at speed",
        body:
          "Skimming a long recording at 1.5x or 2x with keyboard seeking is far quicker than scrubbing a timeline in an editor.",
      },
      {
        title: "Watching on a machine you cannot install software on",
        body:
          "Locked-down work and library computers usually allow a browser and nothing else. This needs no installation at all.",
      },
    ],
    tips: [
      "Space plays and pauses, the arrow keys seek five seconds, and M mutes.",
      "MP4 (H.264) and WebM play everywhere. MKV containers and H.265 often will not, because browsers do not ship those decoders.",
      "Dropping several files builds a playlist, and playback advances automatically at the end of each.",
      "Nothing is uploaded, so this works offline once the page has loaded.",
    ],
    extraFaqs: [
      {
        question: "Is my video uploaded anywhere?",
        answer:
          "No. The file is opened with a local object URL and played directly from disk. There is no upload and no decode step, which is why even very large files start immediately — and why the tool works with no network connection.",
      },
      {
        question: "Why will my MKV file not play?",
        answer:
          "Because browsers do not include an MKV demuxer or an H.265 decoder, for licensing reasons. The tool detects the failure and tells you rather than showing a blank frame. Converting to MP4 (H.264) or WebM fixes it.",
      },
      {
        question: "Can I play several files in a row?",
        answer:
          "Yes. Select or drop multiple files and they queue up as a playlist, advancing automatically. You can reorder by removing and re-adding, and skip with the previous and next buttons.",
      },
      {
        question: "Does changing speed affect the pitch?",
        answer:
          "No. Browsers apply pitch correction automatically, so speech stays natural up to about 2x.",
      },
    ],
  },

  "audio-player": {
    intro:
      "A browser tab is often the fastest way to listen to a file — no media library to import into, no application to launch. This plays MP3, WAV, FLAC, M4A and OGG from your device, with a queue for several files and speed control that keeps voices sounding natural.",
    howTo: {
      title: "How to play an audio file online",
      steps: [
        "Drop your audio files in, or click to browse. Several at once builds a queue.",
        "Press play and use the seek bar to move around the recording.",
        "Raise the speed for lectures and interviews — pitch is corrected automatically, so voices do not sound comical.",
        "Remove a track from the queue with the cross that appears when you hover it.",
      ],
    },
    useCases: [
      {
        title: "Working through a lecture or interview recording",
        body:
          "Listening at 1.5x with easy five-second rewinds is the standard way to get through long recordings quickly without missing anything.",
      },
      {
        title: "Checking a voice note or a recording before sending it",
        body:
          "Confirming a file is audible and complete before you pass it on avoids the most common re-send.",
      },
      {
        title: "Playing files a media library will not import",
        body:
          "Rather than adding a one-off file to a music app, open it here and close the tab afterwards.",
      },
    ],
    tips: [
      "MP3, WAV, M4A and OGG play everywhere. FLAC works in most current browsers but not all.",
      "Space plays and pauses; the arrow keys move five seconds at a time.",
      "Pitch correction is applied automatically, so speech stays intelligible at 2x.",
      "Files never leave your device, which matters for recorded calls and interviews.",
    ],
    extraFaqs: [
      {
        question: "Which audio formats are supported?",
        answer:
          "Whatever your browser can decode — in practice MP3, WAV, M4A/AAC and OGG everywhere, and FLAC in most current browsers. Exotic formats such as WMA and APE generally will not play, because browsers do not ship those decoders.",
      },
      {
        question: "Is my audio uploaded?",
        answer:
          "No. Playback is entirely local, which is the point for recorded calls, interviews, and voice notes you would not want sitting on someone else's server.",
      },
      {
        question: "Will speeding up make voices sound strange?",
        answer:
          "No. Browsers apply pitch correction, so a recording at 1.5x or 2x sounds like someone talking faster rather than a chipmunk.",
      },
      {
        question: "Can I queue a whole folder?",
        answer:
          "Select multiple files in the picker, or drag a group in. They queue in the order given and advance automatically.",
      },
    ],
  },

  "pdf-editor": {
    intro:
      "Upload a PDF here and every line of text on the page becomes clickable. Click a word, retype it, save. Underneath, the editor is doing what a PDF actually permits: a PDF stores positioned glyphs rather than sentences, and its fonts are usually subset-embedded, so the original string genuinely cannot be rewritten in place. So when you click, the editor measures that text run, covers it with a rectangle painted in the page's own sampled background colour, and drops an editable copy on top at the same position, size and ink colour. The result is the edit you wanted, without pretending the format allows something it does not.",
    howTo: {
      title: "How to edit a PDF",
      steps: [
        "Upload the PDF. Every text run on the page is detected and lightly highlighted, and the status line tells you how many were found.",
        "Click any highlighted word or line. It is replaced with an editable copy in the same spot — edit the text in the panel on the right.",
        "Adjust size and colour there if the match is not exact, or drag the text to nudge its position.",
        "If the document has real form fields, the Form fields tab lists them. Editing those changes the document's actual data and is always the better option when available.",
        "Add a signature or logo with the Image button, place free text anywhere with Add text, then use the Pages tab to reorder, rotate or delete pages, and Save.",
      ],
    },
    useCases: [
      {
        title: "Correcting a name or a date",
        body:
          "The most common PDF edit there is, and a single click here. Click the name, type the correction, save. On an invoice or a letterhead where the text sits on a coloured band, the cover is painted in that band's colour rather than white, so the correction does not leave a pale rectangle behind it.",
      },
      {
        title: "Filling in an official form",
        body:
          "Government and bank PDFs frequently ship as real AcroForm documents. Editing those fields here produces a properly filled form rather than an image with text pasted on top.",
      },
      {
        title: "Signing a document",
        body:
          "Drop in a PNG of your signature, place it on the line, and save. No printing, signing and rescanning.",
      },
      {
        title: "Redacting information before sharing",
        body:
          "You can cover sensitive lines with black boxes, but understand exactly what that does: it hides the text visually while leaving it in the file, where copy-paste or any search tool will still find it. This is a real and frequently exploited mistake. Treat covering as tidying, never as redaction — for that, the underlying text must be removed, which needs specialist software.",
      },
    ],
    tips: [
      "Check the Form fields tab first. If fields exist, editing them is always better than covering and retyping.",
      "Click-to-edit picks the background and ink colours automatically. If a replacement looks slightly off against a gradient or an image, select the cover and set an exact colour with the picker.",
      "Replacing a word does not delete the original from the file — it is still there underneath. Never rely on this to hide account or ID numbers.",
      "Added text uses Helvetica. Non-Latin scripts such as Hindi, Tamil or Arabic will not render; use a form field, or place an image of the text instead.",
      "Undo holds the last 25 actions, and your original file is never modified — saving produces a new document.",
    ],
    extraFaqs: [
      {
        question: "Why can I not just click existing text and retype it?",
        answer:
          "Because a PDF does not contain editable text runs. It contains instructions to draw specific glyphs at specific coordinates, using a font that is usually subset-embedded — meaning only the characters already used are available. Typing a character that is not in the subset has no glyph to draw. Rewriting that properly requires font re-encoding and content-stream surgery, which no browser library can do reliably. Covering and retyping is the standard workaround, and it is what most PDF editors do underneath.",
      },
      {
        question: "What is the difference between form fields and added text?",
        answer:
          "A form field is real structured data in the document — editing it is genuine editing, and the field keeps its name and type. Added text is drawn onto the page as new content. Both survive saving and print identically, but form fields are the better option whenever they exist.",
      },
      {
        question: "Is covering text secure enough for redaction?",
        answer:
          "No, and this matters. A drawn rectangle hides text visually but the original characters may still exist in the file and can be recovered by copying the text or examining the content stream. For anything genuinely confidential, use software that removes the underlying content rather than covering it.",
      },
      {
        question: "Why does my Hindi or Arabic text not appear?",
        answer:
          "Added text is drawn in Helvetica, a standard PDF font that only covers Latin characters. Other scripts need an embedded font containing those glyphs. The practical workaround is to type the text elsewhere, screenshot it, and place it as an image.",
      },
      {
        question: "Is my document uploaded?",
        answer:
          "No. Pages are rendered with pdf.js and the new file is built with pdf-lib, both inside your browser. Nothing is transmitted — which matters, since the documents people most often need to edit are contracts, statements and identity papers.",
      },
    ],
  },

  "video-cutter": {
    intro:
      "Cutting a clip out of a video is usually the last thing standing between you and sending it — the interesting thirty seconds sit inside a four-minute recording, and everything you try either wants an account or spends ten minutes re-encoding. This trims by copying streams instead of re-encoding, which finishes almost instantly and loses nothing at all.",
    howTo: {
      title: "How to trim a video online",
      steps: [
        "Upload the video. It plays immediately from your device — nothing is sent anywhere.",
        "Drag the start and end handles. The preview jumps as you move them, so you can hear exactly where the cut lands.",
        "Check the clip length shown underneath.",
        "Press Trim & download. The first run fetches the video engine (about 32MB, once per browser); after that it is near-instant.",
      ],
    },
    useCases: [
      {
        title: "Sending only the part that matters",
        body:
          "A message limit or an attachment cap usually is not a size problem so much as a length problem. Cutting to the relevant thirty seconds solves both at once.",
      },
      {
        title: "Removing dead air at the start and end",
        body:
          "Screen recordings almost always begin with fumbling for the stop button. Trimming both ends takes seconds and makes a recording look deliberate.",
      },
      {
        title: "Pulling a clip out of a longer recording",
        body:
          "Grabbing one exchange out of a meeting recording, without opening an editor or re-exporting the whole file.",
      },
    ],
    tips: [
      "Cuts land on the nearest keyframe before your start point — usually within a second or two. That is the trade for it being instant and lossless.",
      "The engine downloads once per browser and is then cached, so the first cut is slower than every one after it.",
      "MP4 and WebM copy cleanly. MKV and unusual codecs sometimes cannot be stream-copied and will report an error rather than produce a broken file.",
      "Your original file is never modified — the trim downloads as a new file.",
    ],
    extraFaqs: [
      {
        question: "Does trimming reduce the quality?",
        answer:
          "No, and this is the main reason to use a stream copy. The kept portion is copied bit-for-bit rather than decoded and re-encoded, so the output is identical to the source within that range. Tools that re-encode lose a generation of quality every time.",
      },
      {
        question: "Why is my cut slightly off from where I set it?",
        answer:
          "Because a stream copy has to begin at a keyframe, and keyframes typically occur every one to two seconds. Landing exactly on an arbitrary frame would require re-encoding the whole clip, which in a browser would take minutes rather than seconds and would cost quality.",
      },
      {
        question: "Why does the first trim take longer?",
        answer:
          "The video engine is about 32MB and downloads the first time you use it. Your browser caches it afterwards, so subsequent trims — and the audio remover, which shares the same engine — start immediately.",
      },
      {
        question: "Is my video uploaded?",
        answer:
          "No. The processing runs inside your browser through WebAssembly, so the file never leaves your device. That is unusual for a video tool and is why this works on footage you would not hand to a website.",
      },
      {
        question: "Is there a file size limit?",
        answer:
          "The practical limit is your device's memory, since the file is held in the tab while it is processed. Clips of a few hundred megabytes are fine; multi-gigabyte files may exhaust memory on a phone.",
      },
    ],
  },

  "audio-remover": {
    intro:
      "Muting a video is one of those jobs that sounds trivial and usually is not — most tools re-encode the whole file to drop a track that could simply have been left out. Removing an audio stream requires no re-encoding at all, so this finishes in seconds and the video comes back with its picture completely untouched.",
    howTo: {
      title: "How to remove audio from a video",
      steps: [
        "Choose what you want: remove the audio from the video, or extract that audio as a separate file.",
        "Upload the video — it previews immediately, so you can confirm it is the right one.",
        "Press the button. The first run downloads the engine (about 32MB, once per browser).",
        "The result downloads automatically. Your original file is unchanged.",
      ],
    },
    useCases: [
      {
        title: "Silencing background noise or conversation",
        body:
          "Footage where the picture is fine but the audio has someone talking over it. Removing the track entirely is cleaner than trying to edit around it.",
      },
      {
        title: "Preparing video for a soundtrack",
        body:
          "Stripping the original audio before adding music avoids the two tracks fighting each other in an editor.",
      },
      {
        title: "Pulling audio out of a recording",
        body:
          "Extract mode gives you the audio at its original bitrate — useful for turning a recorded talk or interview into something you can listen to or transcribe.",
      },
    ],
    tips: [
      "Both modes are stream copies, so neither the video nor the extracted audio is re-encoded.",
      "Extraction produces .m4a because that is what most video files already carry internally; converting to MP3 would mean re-encoding and losing quality.",
      "If the tool reports no audio track, the file is already silent — nothing to remove.",
      "The engine is shared with the video cutter, so if you have used that already, this starts immediately.",
    ],
    extraFaqs: [
      {
        question: "Will removing the audio reduce video quality?",
        answer:
          "No. The video stream is copied across untouched and only the audio track is left out. The result is bit-identical picture, in a slightly smaller file.",
      },
      {
        question: "Why is the extracted audio .m4a rather than .mp3?",
        answer:
          "Because most video files already contain AAC audio, and .m4a is the container for it — so the audio can be copied out with no quality loss at all. Producing MP3 would mean decoding and re-encoding, which would be slower and measurably worse.",
      },
      {
        question: "Can I lower the volume instead of removing it?",
        answer:
          "Not here. Changing volume means re-encoding the audio, which is a different operation with different trade-offs. This tool is deliberately limited to the two things that can be done losslessly.",
      },
      {
        question: "Is my video uploaded?",
        answer:
          "No. Everything runs in your browser via WebAssembly and nothing is transmitted, which matters given how often the videos people want to mute are personal.",
      },
    ],
  },

  "sip-calculator": {
    intro:
      "A Systematic Investment Plan (SIP) is one of the most reliable wealth-building strategies, leveraging compounding and rupee-cost averaging to grow wealth over time. This calculator projects future maturity value, total principal invested, and estimated capital gains with live visual growth charts. Everything calculates locally on your device without saving your financial inputs.",
    howTo: {
      title: "How to calculate mutual fund SIP returns",
      steps: [
        "Enter your planned monthly investment amount into the deposit field or use the slider.",
        "Set your expected annual rate of return (e.g. 12% to 14% for diversified equity index funds).",
        "Choose your target investment duration in years to visualize long-term compounding.",
        "Review the estimated maturity wealth, wealth gain multiplier, and year-by-year annual growth breakdown table.",
      ],
    },
    useCases: [
      {
        title: "Retirement and long-term corpus planning",
        body:
          "Calculate how small monthly contributions over 15 to 25 years can compound into substantial retirement capital.",
      },
      {
        title: "Child higher education & milestone goals",
        body:
          "Determine the exact monthly SIP required to achieve a target corpus for college education or purchasing a home.",
      },
      {
        title: "Comparing SIP growth vs Fixed Deposits",
        body:
          "Compare the compounding power of disciplined equity investment against traditional fixed-return debt instruments.",
      },
    ],
    tips: [
      "Starting an SIP 5 years earlier can double your eventual corpus due to the exponential nature of compound interest.",
      "Equity mutual fund returns fluctuate in the short term; SIPs average out market volatility over 5+ year horizons.",
      "Increasing your SIP amount annually by 10% (Step-Up SIP) can significantly accelerate your wealth accumulation.",
      "All calculations assume reinvestment of returns with monthly compounding frequency.",
    ],
    extraFaqs: [
      {
        question: "What is rupee cost averaging in an SIP?",
        answer:
          "When markets fall, your fixed monthly allocation buys more fund units; when markets rise, it buys fewer units, averaging your cost per unit over time without requiring market timing.",
      },
      {
        question: "Is SIP return guaranteed?",
        answer:
          "No. Mutual fund and stock market investments carry market risk. Expected return rates (such as 12%) are historical reference estimates, not guaranteed bank rates.",
      },
    ],
  },

  "compound-interest-calculator": {
    intro:
      "Compound interest is interest calculated on the initial principal and also on the accumulated interest of previous periods. Often referred to as the eighth wonder of the world, compound interest accelerates savings dramatically over long timeframes. This tool calculates future values across daily, monthly, quarterly, and annual compounding schedules with optional monthly additions.",
    howTo: {
      title: "How to calculate compound interest",
      steps: [
        "Enter your starting principal deposit amount.",
        "Specify any additional regular monthly contributions you plan to make.",
        "Input the annual interest rate (APY/APR) and total investment time horizon in years.",
        "Select your account compounding frequency (e.g. daily, monthly, or annually) to compute the final maturity value.",
      ],
    },
    useCases: [
      {
        title: "High-yield savings accounts & Certificates of Deposit (CDs)",
        body:
          "Calculate the exact interest payout from banks compounding interest monthly or daily.",
      },
      {
        title: "Long-term investment portfolio compounding",
        body:
          "Model how reinvested dividend payments and asset growth accumulate over multiple decades.",
      },
      {
        title: "Loan and mortgage debt growth",
        body:
          "Understand how compounding interest affects unpaid loan balances or credit card debts over time.",
      },
    ],
    tips: [
      "Daily compounding yields slightly higher returns than annual compounding at the same nominal interest rate.",
      "The Rule of 72 provides a quick mental estimate: divide 72 by your interest rate to estimate how many years it takes to double your money.",
      "Consistent regular monthly contributions can outweigh the starting principal in long-term wealth building.",
    ],
    extraFaqs: [
      {
        question: "What is Effective Annual Rate (EAR)?",
        answer:
          "Effective Annual Rate is the true annual interest rate earned after accounting for the compounding frequency, which is higher than the nominal stated interest rate when compounding occurs more than once per year.",
      },
      {
        question: "How does compounding frequency impact returns?",
        answer:
          "More frequent compounding (e.g., daily vs annually) means accrued interest starts earning interest sooner, yielding a higher future value.",
      },
    ],
  },

  "bmi-calculator": {
    intro:
      "Body mass index compares your weight with your height to give one number that doctors use as a first screen for underweight, healthy weight, overweight and obesity. Enter your height and weight in metric or imperial units and this calculator shows your BMI, its WHO category, the healthy weight range for your height and your BMI Prime — your BMI divided by 25, the top of the normal range. It is a quick screening measure, not a diagnosis, and the notes below explain where it is and is not reliable.",
    howTo: {
      title: "How to calculate your BMI",
      steps: [
        "Choose metric (centimetres and kilograms) or imperial (feet, inches and pounds).",
        "Enter your height and your weight, ideally measured in the morning without shoes.",
        "Read your BMI and the category it falls in.",
        "Check the healthy weight range for your height to see how far you are from it, if at all.",
        "Use BMI Prime to see the figure as a share of the upper healthy limit: 1.00 is exactly at the limit.",
      ],
    },
    useCases: [
      {
        title: "A quick health check",
        body:
          "Someone 170 cm tall and weighing 72 kg has a BMI of 24.9 — just inside the WHO healthy range, but above the 23 threshold many doctors use for South Asian adults. Knowing both numbers is a good prompt for a conversation with a doctor.",
      },
      {
        title: "Setting a realistic target",
        body:
          "The healthy weight range for 170 cm is about 53.5 to 72 kg. Seeing the range, rather than a single ideal number, makes it easier to set a goal that is achievable and sustainable.",
      },
      {
        title: "Tracking change over time",
        body:
          "BMI changes in the same direction as weight for adults, so recording it every few weeks shows the trend without needing any equipment beyond a scale.",
      },
    ],
    tips: [
      "BMI does not distinguish muscle from fat. Athletes and people who do heavy strength training can have a high BMI with little body fat.",
      "For South Asian adults, many doctors and Indian guidelines treat 23 or more as overweight and 25 or more as obese, because diabetes and heart risks rise at lower BMI.",
      "Waist size adds information BMI misses: a waist above about 90 cm for men or 80 cm for women in Asian populations suggests excess abdominal fat.",
      "Adult BMI categories do not apply to children and teenagers, who are assessed on age- and sex-specific growth charts.",
    ],
    extraFaqs: [
      {
        question: "What is the BMI formula?",
        answer:
          "BMI = weight in kilograms ÷ (height in metres)². For 70 kg and 1.75 m that is 70 ÷ 3.0625 = 22.9. In imperial units the formula is 703 × weight in pounds ÷ (height in inches)².",
      },
      {
        question: "What are the WHO BMI categories?",
        answer:
          "Below 18.5 is underweight, 18.5 to 24.9 is normal, 25 to 29.9 is overweight and 30 or above is obese, with obesity further divided into classes I (30–34.9), II (35–39.9) and III (40 and above).",
      },
      {
        question: "Is BMI accurate during pregnancy or for older adults?",
        answer:
          "No, not on its own. Pregnancy weight gain is assessed differently, and in older adults a slightly higher BMI can be protective. Use the number as a starting point and ask a doctor what applies to you.",
      },
    ],
  },

  "lorem-ipsum-generator": {
    intro:
      "Lorem ipsum is scrambled Latin used as placeholder text, so a layout can be judged on its shape and typography without readers getting distracted by the words. This generator produces any amount of it — paragraphs, sentences, single words or list items — optionally wrapped in <p> or <li> tags for pasting straight into HTML, and optionally starting with the classic \"Lorem ipsum dolor sit amet\". Live word and character counts help you match the length of the real content that will replace it.",
    howTo: {
      title: "How to generate placeholder text",
      steps: [
        "Choose what to generate: paragraphs, sentences, words or list items.",
        "Set how many you need.",
        "Switch on HTML tags if you are pasting into code, so paragraphs arrive as <p> and list items as <li>.",
        "Choose whether the text starts with \"Lorem ipsum dolor sit amet…\".",
        "Copy the text, checking the word and character counts against the space it has to fill.",
      ],
    },
    useCases: [
      {
        title: "Page layouts and mock-ups",
        body:
          "Filling a blog template with three paragraphs of realistic length shows how line length, spacing and headings work before any real article exists.",
      },
      {
        title: "Testing components with long text",
        body:
          "Cards, buttons and table cells often break when text is longer than expected. Generating 40 words for a field designed for 10 is a quick way to find overflow bugs.",
      },
      {
        title: "Seeding demo data",
        body:
          "Product descriptions, comments and profile bios in a demo database look more convincing with varied placeholder text than with the same test sentence repeated.",
      },
    ],
    tips: [
      "Match the placeholder to the real content: marketing pages have short paragraphs, documentation has long ones.",
      "Replace placeholder text before anything goes live; search engines treat pages full of lorem ipsum as unfinished.",
      "Test with real text in other languages too. German words are longer and Hindi needs different line spacing, which lorem ipsum will not reveal.",
      "For forms and tables, use realistic sample data (names, amounts, dates) rather than Latin, so reviewers can judge the design properly.",
    ],
    extraFaqs: [
      {
        question: "What does lorem ipsum mean?",
        answer:
          "Very little. It is a scrambled passage from Cicero's De finibus bonorum et malorum, written in 45 BC, with words cut and altered so it reads like Latin without making sense.",
      },
      {
        question: "Why use Latin instead of \"text text text\"?",
        answer:
          "Repeated words create an unnatural pattern of word lengths. Lorem ipsum has a mix of short and long words similar to English, so paragraphs look like real text.",
      },
      {
        question: "Can I use the generated text in commercial projects?",
        answer:
          "Yes. Lorem ipsum is not copyrighted, and the generated text is free to use anywhere.",
      },
    ],
  },

  "slug-generator": {
    intro:
      "A slug is the readable part of a web address that identifies a page, such as best-budget-phones-2026 in example.com/blog/best-budget-phones-2026. Good slugs are short, lowercase, use hyphens between words and contain no spaces, accents or punctuation, because those get turned into unreadable codes like %20 when the link is shared. This generator converts any title into a clean slug as you type: it lowercases the text, turns accented letters into plain ones, removes symbols, can drop filler words like \"the\" and \"and\", and lets you choose hyphens, underscores or dots between words.",
    howTo: {
      title: "How to create an SEO-friendly URL slug",
      steps: [
        "Paste or type the title of the article, product or page.",
        "Watch the slug update live: letters are lowercased, accents are removed and punctuation disappears.",
        "Switch on stop-word removal to shorten long titles by dropping words such as a, the, of and and.",
        "Choose the separator. Hyphens are the standard for web addresses; underscores or dots suit file names and identifiers.",
        "Copy the slug and paste it into your CMS or file name.",
      ],
    },
    useCases: [
      {
        title: "Blog posts and articles",
        body:
          "A title like \"10 Tips for Saving Money on Groceries (2026 Edition!)\" becomes 10-tips-saving-money-groceries-2026-edition, which is short enough to read in search results and describes the page clearly.",
      },
      {
        title: "Product pages",
        body:
          "E-commerce platforms build product addresses from names that often include symbols and sizes. Cleaning them up first gives consistent, readable links across the catalogue.",
      },
      {
        title: "File and folder names",
        body:
          "Slugs are also safe file names: no spaces, no characters that break on another operating system, and they sort predictably. Use underscores if your team prefers them for files.",
      },
    ],
    tips: [
      "Keep slugs to about three to five meaningful words. Long slugs are cut off in search results and are harder to share.",
      "Do not change the slug of a page that is already published and indexed without setting up a 301 redirect from the old address.",
      "Leave dates out of slugs for content you plan to update, so the address does not look out of date next year.",
      "Google treats hyphens as word separators but joins words linked by underscores, which is why hyphens are recommended for web addresses.",
    ],
    extraFaqs: [
      {
        question: "Do URL slugs affect SEO?",
        answer:
          "A little. A descriptive slug helps people decide to click and gives search engines a small hint about the topic, but it is a minor factor compared with the page's content. The bigger benefit is a clean, trustworthy-looking link.",
      },
      {
        question: "What happens to accented and non-English characters?",
        answer:
          "Accented Latin letters are converted to their plain forms, so café becomes cafe and über becomes uber. Other symbols are removed. If your audience searches in another script, you may prefer to keep native characters in the address; browsers support them.",
      },
      {
        question: "Should I remove stop words?",
        answer:
          "For long titles, yes: dropping words such as the, a and of makes slugs shorter without losing meaning. Keep them when removing them changes the sense, as in \"to-do\" or a brand name.",
      },
    ],
  },

  "json-to-csv": {
    intro:
      "APIs speak JSON, but spreadsheets, finance teams and many import tools want CSV. This converter turns a JSON array of objects into a CSV table — one row per object and one column per key, collected from every object so no field is lost — and converts CSV back into JSON. You can choose a comma, semicolon, tab or pipe delimiter, open .json and .csv files directly, and copy or download the result. Everything runs in your browser, so customer exports and internal data stay on your computer.",
    howTo: {
      title: "How to convert JSON to CSV (and back)",
      steps: [
        "Choose the direction: JSON to CSV or CSV to JSON.",
        "Paste your data or open a .json or .csv file.",
        "Pick the delimiter your target program expects: comma for most tools, semicolon for Excel in many European locales, tab for pasting into sheets.",
        "Check the output. For JSON to CSV, the header row lists every key found in the data.",
        "Copy the result or download it as a file.",
      ],
    },
    useCases: [
      {
        title: "Opening an API export in Excel or Google Sheets",
        body:
          "An array of orders from an API becomes a sheet with one order per row, ready for filters, pivot tables and charts, without writing a script.",
      },
      {
        title: "Preparing a bulk import",
        body:
          "Many CRMs, email tools and e-commerce platforms import contacts or products only as CSV. Converting JSON from another system is often the missing step in a migration.",
      },
      {
        title: "Turning a spreadsheet into test data",
        body:
          "Going the other way, a sheet of sample users exported as CSV becomes a JSON array you can use as fixtures or seed data.",
      },
    ],
    tips: [
      "Nested objects and arrays are written into a single cell as JSON text. Flatten deeply nested data first if you need each value in its own column.",
      "Values containing the delimiter, quotes or line breaks are wrapped in quotes automatically, which is the CSV standard.",
      "If Excel shows everything in one column, it expected a different delimiter; try semicolon or use its Data → From Text import.",
      "Spreadsheets drop leading zeros from things like PIN codes and phone numbers. Format those columns as text when importing.",
    ],
    extraFaqs: [
      {
        question: "What JSON shape does the converter expect?",
        answer:
          "An array of objects, such as [{\"name\": \"Asha\", \"city\": \"Pune\"}, …], where each object becomes a row. Objects do not need identical keys; missing values are left empty.",
      },
      {
        question: "Are numbers and true/false kept when converting CSV to JSON?",
        answer:
          "CSV has no data types, so every value arrives as text. Check the JSON output and convert numbers and booleans in your code if the difference matters.",
      },
      {
        question: "Is there a size limit?",
        answer:
          "Only your device's memory. Files of a few megabytes convert instantly; very large files of tens of megabytes may make the tab pause while they are processed.",
      },
    ],
  },

  "regex-tester": {
    intro:
      "Regular expressions are compact patterns for finding and validating text — an email address, a date, every number in a log — but a single misplaced character changes what they match. This tester runs your pattern against sample text as you type, highlights every match, lists each one with its position and numbered capture groups, and lets you switch the g, i, m, s and u flags on and off. It uses your browser's own JavaScript regex engine, so a pattern that works here behaves the same in JavaScript and TypeScript code.",
    howTo: {
      title: "How to test a regular expression",
      steps: [
        "Type your pattern into the regular expression field, without the surrounding slashes.",
        "Paste sample text into the test string box: include text that should match and text that should not.",
        "Toggle the flags you need: g for every match, i to ignore case, m so ^ and $ work per line, s so . also matches newlines, u for full Unicode.",
        "Check the highlighted matches, then read the match list to see what each capture group caught.",
        "Use the cheat sheet for syntax you do not remember, and adjust the pattern until only the right text is highlighted.",
      ],
    },
    useCases: [
      {
        title: "Validating form input",
        body:
          "An Indian PIN code is six digits not starting with 0: ^[1-9][0-9]{5}$. Testing it against 560001, 056001 and 5600011 confirms it accepts the first and rejects the others before the pattern goes into your form.",
      },
      {
        title: "Extracting data from logs",
        body:
          "A pattern such as (\\d{3}) (\\d+)ms with the g flag pulls every status code and response time out of a pasted access log, with each part in its own capture group ready for your script.",
      },
      {
        title: "Find and replace in an editor",
        body:
          "VS Code and most editors support the same syntax. Getting the pattern and its groups right here first avoids a replace-all that rewrites the wrong lines.",
      },
    ],
    tips: [
      "Anchor validation patterns with ^ and $. Without them, [0-9]{6} also matches the first six digits of a ten-digit number.",
      "Quantifiers are greedy: <.+> matches from the first < to the last > on the line. Use <.+?> to stop at the nearest >.",
      "Escape characters that have special meaning when you want them literally: \\. for a dot, \\( for a bracket, \\$ for a dollar sign.",
      "Patterns with nested repeats such as (a+)+ can take exponential time on long input. Keep repeats simple for anything that runs on user data.",
      "Other languages differ in details — lookbehind support, named-group syntax, Unicode classes — so re-test patterns that will run outside JavaScript.",
    ],
    extraFaqs: [
      {
        question: "Why does my pattern only find the first match?",
        answer:
          "Without the g (global) flag a JavaScript regex stops after the first match. Switch g on to find every occurrence in the text.",
      },
      {
        question: "What is a capture group?",
        answer:
          "Anything inside plain round brackets is captured separately, so in (\\d{4})-(\\d{2}) the year is group 1 and the month is group 2. Use (?:...) when you need brackets for grouping but not a capture, and (?<name>...) to name a group.",
      },
      {
        question: "Is my test text sent anywhere?",
        answer:
          "No. Matching runs in your browser, so you can safely test patterns against real logs or data.",
      },
    ],
  },

  "html-entity-converter": {
    intro:
      "Some characters mean something to HTML: < starts a tag, & starts an entity and \" ends an attribute. To show them as text, or to paste code into a web page, they have to be written as entities such as &lt; and &amp;. This converter encodes text into HTML entities and decodes entities back into readable text, and lets you choose named entities (&amp;), decimal codes (&#38;) or hexadecimal codes (&#x26;). It runs in your browser, so you can paste private snippets safely.",
    howTo: {
      title: "How to encode or decode HTML entities",
      steps: [
        "Choose whether you want to encode text into entities or decode entities into text.",
        "Paste your text or HTML into the input box.",
        "When encoding, pick named, decimal or hexadecimal entities.",
        "Check the converted output and the character counts.",
        "Copy the result into your page, template or email.",
      ],
    },
    useCases: [
      {
        title: "Showing code on a web page",
        body:
          "To display <div class=\"card\"> in a tutorial, the angle brackets must be encoded or the browser will treat it as a real element and the example will disappear.",
      },
      {
        title: "Reading escaped text from an API or database",
        body:
          "Data that has been escaped more than once turns into strings like &amp;amp;quot;. Decoding shows the real text and reveals where the double escaping happened.",
      },
      {
        title: "Special characters in email templates",
        body:
          "Some email clients handle raw non-ASCII symbols badly. Encoding characters such as ₹, © and — as numeric entities makes them display reliably.",
      },
    ],
    tips: [
      "In ordinary page text you only must escape & and <. Inside attribute values, also escape the quote character you used to wrap the value.",
      "Named entities are easier to read; numeric entities work for every Unicode character, including ones without a name.",
      "Escaping output is only one part of preventing XSS. Frameworks such as React escape text automatically; the danger is in code that inserts raw HTML.",
      "Do not encode text twice. If you see &amp;lt; on a page, something escaped already-escaped text.",
    ],
    extraFaqs: [
      {
        question: "What is the difference between &amp;, &#38; and &#x26;?",
        answer:
          "They all produce the same & character. The first is a named entity, the second the character's decimal code point and the third its hexadecimal code point. Browsers treat them identically.",
      },
      {
        question: "Do I need entities for ₹ or emoji if my page is UTF-8?",
        answer:
          "Not in a correctly served UTF-8 page, which almost every modern site is; you can type the characters directly. Entities are still useful in systems that mangle non-ASCII text, such as some email and legacy tools.",
      },
      {
        question: "Is &nbsp; the same as a space?",
        answer:
          "No. &nbsp; is a non-breaking space: it looks like a space but stops the line from wrapping at that point, which is useful between a number and its unit, such as 10&nbsp;kg.",
      },
    ],
  },

  "color-converter": {
    intro:
      "The same colour is written differently depending on where it is used: HEX and RGB in CSS and design tools, HSL when you want to adjust lightness or saturation, and CMYK for print. This converter takes a colour in any of these formats, or from the colour picker, and shows it in all of them at once, ready to copy — including as a CSS custom property. It also suggests complementary, analogous and triadic harmonies, which are a quick starting point for a palette.",
    howTo: {
      title: "How to convert a colour",
      steps: [
        "Enter a colour as HEX (#1a73e8), RGB (rgb(26, 115, 232)) or HSL, or pick one with the colour picker.",
        "Read the same colour in HEX, RGB, HSL and CMYK.",
        "Copy the format you need with one click, including a ready-made CSS variable.",
        "Look at the harmony swatches for colours that go well with it.",
        "Click a harmony colour to convert that one as well.",
      ],
    },
    useCases: [
      {
        title: "Handing designs to developers",
        body:
          "A designer's HEX value can be turned into HSL for a stylesheet, which makes it easy to create lighter and darker shades by changing only the lightness value.",
      },
      {
        title: "Preparing artwork for print",
        body:
          "Screens mix light (RGB) and printers mix ink (CMYK). Converting a brand colour to CMYK gives the printer a starting value, although it should be checked against a printed proof, because some bright screen colours cannot be printed exactly.",
      },
      {
        title: "Building a small palette",
        body:
          "Complementary colours sit opposite each other on the colour wheel and make strong accents; analogous colours sit next to each other and feel calm. Using one of these as a starting point gives a palette that holds together.",
      },
    ],
    tips: [
      "HEX and RGB describe exactly the same colours; HEX is just the three RGB values written in base 16.",
      "Adjusting the L in HSL is the easiest way to make hover and pressed states for a button colour.",
      "CMYK conversions here are device-independent approximations. For accurate print colour, use the ICC profile your printer provides.",
      "Check text colours with a contrast checker as well: a pleasing palette is not automatically readable.",
    ],
    extraFaqs: [
      {
        question: "What is the difference between HEX and RGB?",
        answer:
          "None in the colour itself. rgb(255, 99, 71) and #FF6347 are the same tomato red: each pair of hex digits is one of the red, green and blue values from 0 to 255.",
      },
      {
        question: "Why does my colour look different in print?",
        answer:
          "Screens can show bright, saturated colours that ink cannot reproduce, especially vivid blues and greens. When converted to CMYK they are brought into the printable range, so they look duller on paper.",
      },
      {
        question: "What is HSL good for?",
        answer:
          "HSL describes colour as hue (the angle on the colour wheel), saturation and lightness, which matches how people think about colour. Changing one value gives a predictable result, unlike adjusting three RGB channels.",
      },
    ],
  },

  "salary-calculator": {
    intro:
      "Understanding the difference between gross Cost to Company (CTC) and actual monthly in-hand take-home salary is critical for job negotiations, financial planning, and budgeting. This calculator breaks down basic pay, HRA, special allowances, Provident Fund (PF) contributions, and income tax deductions across standard tax regimes.",
    howTo: {
      title: "How to calculate take-home salary from CTC",
      steps: [
        "Enter your total annual Cost to Company (CTC) figure.",
        "Set your variable performance bonus percentage (if applicable).",
        "Select the tax regime you file under — the new regime is the default unless you opt out.",
        "Choose how your employer calculates PF: 12% of basic, the ₹1,800-a-month cap, or no PF.",
        "Enter your state's professional tax (₹0 if your state does not levy it).",
        "Read your monthly in-hand pay, then the annual breakdown underneath to see where the rest of the CTC goes.",
      ],
    },
    useCases: [
      {
        title: "Evaluating job offers & salary negotiations",
        body:
          "Determine the real monthly disposable income from job offers with complex variable structures.",
      },
      {
        title: "Annual tax planning & financial budgeting",
        body:
          "Compare take-home compensation under the New and Old Tax Regimes to select the most tax-efficient structure.",
      },
    ],
    tips: [
      "From FY 2025-26, the new regime charges no tax on taxable income up to ₹12 lakh (section 87A rebate). With the ₹75,000 standard deduction, that means salary up to ₹12.75 lakh is tax-free.",
      "Just above ₹12 lakh, marginal relief applies: the tax can never be more than the income above ₹12 lakh, so a small raise never leaves you worse off.",
      "Employer PF is inside your CTC but paid into your PF account, which is why it never appears in your bank balance.",
      "Employee PF contributions earn statutory compound interest and provide tax-advantaged retirement savings.",
    ],
    extraFaqs: [
      {
        question: "Why is in-hand salary significantly lower than CTC?",
        answer:
          "CTC includes employer-side expenses such as Employer PF, gratuity, health insurance, and variable bonus pools, while in-hand salary is what you receive after all employer and employee deductions.",
      },
    ],
  },

  "working-days-calculator": {
    intro:
      "Counting working days by hand means remembering which days are weekends, which dates are holidays, and whether the first and last days count. This calculator does all of it: pick a start and end date, choose your weekend pattern (Saturday–Sunday, Sunday only, or Friday–Saturday for the Gulf), add the public holidays that apply to you, and it returns the number of working days, the weekend and holiday days it excluded, and the total working hours at the daily hours you set. Both the start and end dates are included, which is how most leave policies and contracts count.",
    howTo: {
      title: "How to count working days between two dates",
      steps: [
        "Choose the start date and the end date. Both days are included in the count.",
        "Pick the weekend that applies: Saturday and Sunday, Sunday only (common for six-day weeks in India), or Friday and Saturday.",
        "Add each public or company holiday that falls in the range. Holidays that land on a weekend are not subtracted twice.",
        "Set the working hours per day if you want a total in hours, for example 8 or 9.",
        "Read the working days, the breakdown of calendar, weekend and holiday days, and the total hours.",
      ],
    },
    useCases: [
      {
        title: "Planning leave",
        body:
          "Taking 23 December to 2 January off looks like eleven days, but with two weekends and two public holidays it may use only five or six days of leave. Counting before you apply tells you exactly how much of your balance a trip will use.",
      },
      {
        title: "Project and delivery deadlines",
        body:
          "When a client asks for delivery within 15 working days, counting forward over a festival week with a six-day work pattern gives a very different date from counting over an ordinary fortnight. The breakdown makes the date easy to explain.",
      },
      {
        title: "Payroll and attendance",
        body:
          "Salary for a partial month, overtime thresholds and attendance percentages are all based on working days in the period. Getting the base number right avoids small errors that repeat every month.",
      },
    ],
    tips: [
      "Public holidays differ by state and by employer in India. Add the list your company publishes rather than a national one.",
      "If your contract counts only one of the two end dates, subtract one day from the result.",
      "For notice periods, check whether your contract says working days or calendar days; the difference can be two weeks.",
      "A Friday–Saturday weekend is standard in several Gulf countries, while the UAE moved to Saturday–Sunday in 2022. Pick the pattern that matches the office, not the country's old rule.",
    ],
    extraFaqs: [
      {
        question: "Are the start and end dates both counted?",
        answer:
          "Yes. A range from Monday to Friday of the same week gives five working days. This matches how leave and delivery periods are normally counted. If you need an exclusive count, subtract one.",
      },
      {
        question: "What happens if a holiday falls on a weekend?",
        answer:
          "It is only removed once. The day is already excluded as a weekend day, so it does not reduce the working days again. Whether your employer gives a substitute day off is a policy question the calculator cannot know, so add that day as a holiday yourself.",
      },
      {
        question: "How are working hours calculated?",
        answer:
          "Working days multiplied by the hours per day you enter. It assumes the same hours every day; half days and shift patterns need to be adjusted by hand.",
      },
    ],
  },

  "unix-timestamp-converter": {
    intro:
      "A Unix timestamp is the number of seconds since 00:00:00 UTC on 1 January 1970 — the way most servers, databases and APIs store time, because it is a single number with no time zone attached. This converter turns a timestamp into a readable date in UTC, ISO 8601 and your local time, with a relative description such as \"3 hours ago\", and turns a date and time back into a timestamp. It recognises whether a number is in seconds or milliseconds from its length, and shows the current timestamp ticking live.",
    howTo: {
      title: "How to convert a Unix timestamp",
      steps: [
        "Paste a timestamp into the timestamp field. A 10-digit number is read as seconds; a 13-digit number as milliseconds, which is what JavaScript and many APIs use.",
        "Read the result in UTC, in ISO 8601 format for code and logs, and in your own time zone.",
        "Check the relative time to see at a glance whether the moment is in the past or future and how far away it is.",
        "To go the other way, pick a date and time and copy the timestamp in seconds or milliseconds.",
        "Use the live clock to grab the current timestamp for tests and database queries.",
      ],
    },
    useCases: [
      {
        title: "Reading logs and API responses",
        body:
          "Values like created_at: 1767225600 are meaningless at a glance. Converting them shows that this one is 1 January 2026 at 00:00 UTC — 5:30 in the morning in India — which is often the clue that explains an off-by-one-day bug.",
      },
      {
        title: "Setting expiry times",
        body:
          "Tokens, cookies and signed URLs expire at a timestamp. Picking a date and copying its timestamp is faster and less error-prone than adding 86,400 seconds per day by hand.",
      },
      {
        title: "Checking a JWT's exp claim",
        body:
          "The exp and iat fields in a JSON Web Token are Unix timestamps in seconds. Paste one here to see exactly when a token was issued and when it stops working.",
      },
    ],
    tips: [
      "Mixing seconds and milliseconds is the most common timestamp bug: a seconds value read as milliseconds lands in January 1970, and the reverse lands tens of thousands of years in the future.",
      "Store and transmit time as UTC timestamps, and convert to local time only when showing it to a person.",
      "32-bit signed timestamps run out on 19 January 2038. Use 64-bit integers for anything that must last beyond that date.",
      "ISO 8601 strings such as 2026-01-01T00:00:00Z sort correctly as text and are easy to read in logs, which is why many APIs use them instead of raw numbers.",
    ],
    extraFaqs: [
      {
        question: "Do Unix timestamps depend on the time zone?",
        answer:
          "No. A timestamp counts seconds from a fixed moment in UTC, so the same instant has the same timestamp everywhere in the world. Time zones only matter when the number is turned into a date for display.",
      },
      {
        question: "How do I tell if a timestamp is in seconds or milliseconds?",
        answer:
          "For current dates, seconds have 10 digits and milliseconds have 13. The converter detects this automatically. JavaScript's Date.now() returns milliseconds; most Unix tools, PHP and Python's time.time() return seconds.",
      },
      {
        question: "What does Unix time do with leap seconds?",
        answer:
          "It ignores them. Every day is treated as exactly 86,400 seconds, which keeps date arithmetic simple. The difference from astronomical time is handled by clock synchronisation, not by the timestamp.",
      },
    ],
  },

  "json-to-typescript": {
    intro:
      "Writing TypeScript types by hand for an API response is slow and easy to get wrong, especially when objects are nested three levels deep. Paste a sample of the JSON and this tool generates matching interfaces or type aliases: nested objects become their own named types, arrays get the type of their items, and you can mark every property optional or readonly and choose the name of the root type. The conversion runs in your browser, so internal API payloads never leave your machine.",
    howTo: {
      title: "How to generate TypeScript interfaces from JSON",
      steps: [
        "Paste a JSON object or array into the input box — ideally a real response that includes every field you expect.",
        "Set the root type name, for example UserResponse, so the generated code fits your naming.",
        "Choose interfaces or type aliases, and switch on optional or readonly properties if your code style needs them.",
        "Review the output: nested objects are extracted into separately named types that you can reuse.",
        "Copy the code or download it as a .ts file and drop it into your project.",
      ],
    },
    useCases: [
      {
        title: "Typing a third-party API",
        body:
          "When a service publishes JSON examples but no TypeScript types, generating them from a real response gives you autocompletion and compile-time checks in minutes, instead of discovering a misspelt field name in production.",
      },
      {
        title: "Starting a type from a config file",
        body:
          "Settings files and fixtures grow over time. Generating a type from the current file documents its shape and makes the compiler warn you when code reads a key that no longer exists.",
      },
      {
        title: "Reviewing an unfamiliar payload",
        body:
          "The generated types are also a compact outline of the data. Reading ten lines of interfaces is quicker than scrolling through five hundred lines of nested JSON.",
      },
    ],
    tips: [
      "Types are inferred from the sample you paste. A field that happens to be null or missing in the sample cannot be typed correctly, so use a response with every field filled in.",
      "Numbers that are sometimes sent as strings (\"25\") will be typed as string. Fix the type or the API, not both.",
      "Treat the output as a first draft: add union types for known string values, such as status: \"active\" | \"cancelled\", by hand.",
      "For data you do not control, validate it at runtime as well; TypeScript types disappear when the code is compiled and cannot stop a malformed response.",
    ],
    extraFaqs: [
      {
        question: "Should I use interface or type?",
        answer:
          "For plain object shapes they behave almost identically. Interfaces can be extended and merged, which suits public APIs; type aliases can also describe unions and mapped types. Follow whatever your codebase already uses.",
      },
      {
        question: "How are arrays of objects handled?",
        answer:
          "The item type is generated from the objects in the array and the property is typed as an array of it, for example items: Item[]. An empty array cannot reveal its item type, so include at least one item in the sample.",
      },
      {
        question: "Is my JSON uploaded anywhere?",
        answer:
          "No. Parsing and code generation happen in your browser, so you can safely paste responses that contain internal field names or real data.",
      },
    ],
  },

  "cron-explainer": {
    intro:
      "Cron expressions schedule jobs on Linux servers, in CI pipelines, cloud schedulers and many web frameworks, but five fields of numbers and asterisks are hard to read correctly. Paste an expression like 30 2 * * 1-5 and this explainer translates it into plain English — \"at 02:30 on weekdays\" — breaks down each field, and lists the next times it will run in your time zone or in UTC. It checks every value, warns about the mistakes that make jobs run at the wrong time, and understands names, @daily shortcuts and the L, W and # characters. Because the same text means different things in different schedulers, it can read an expression the way Linux crontab, Spring, Quartz or AWS EventBridge would. To write a new one, switch to the builder and pick how often it should run.",
    howTo: {
      title: "How to read a cron expression",
      steps: [
        "Paste or type a cron expression: minute, hour, day of month, month and day of week. Six- and seven-field expressions with seconds or a year are recognised too.",
        "If it came from Spring, Quartz or AWS, check that Read as shows the right scheduler — they number weekdays differently.",
        "Read the plain-English description and the field-by-field breakdown, and fix anything marked as an error or warning.",
        "Check the next run times, in your time zone or in UTC for GitHub Actions and cloud schedulers.",
        "Or switch to Build a schedule, choose how often it runs, and copy the expression into your crontab, workflow file or scheduler.",
      ],
    },
    useCases: [
      {
        title: "Checking a schedule before deploying",
        body:
          "A backup job meant for 2 a.m. daily written as * 2 * * * actually runs every minute between 2:00 and 2:59 — sixty times. Reading the explanation before deploying catches that kind of mistake.",
      },
      {
        title: "Understanding someone else's crontab",
        body:
          "Inherited servers often have dozens of undocumented jobs. Translating each line tells you what runs when, which is the first step to cleaning them up.",
      },
      {
        title: "Writing CI and cloud schedules",
        body:
          "GitHub Actions, Kubernetes CronJobs and most cloud schedulers use the same five-field syntax. Build the expression here, then paste it into the workflow file.",
      },
    ],
    tips: [
      "Most cron systems run in UTC unless configured otherwise. 30 3 * * * in UTC is 9:00 a.m. in India.",
      "When both day of month and day of week are set, classic cron runs the job when either matches, not only when both do.",
      "*/15 in the minute field means every 15 minutes starting at :00, not every 15 minutes from when the job was installed. A step that doesn't divide 60, such as */7, leaves a short gap at the end of each hour.",
      "GitHub Actions runs scheduled workflows at most every 5 minutes, in UTC, and may start them a few minutes late when it's busy.",
      "Avoid scheduling many jobs at exactly midnight or on the hour; spreading them by a few minutes reduces load spikes.",
    ],
    extraFaqs: [
      {
        question: "What do the symbols * , - and / mean?",
        answer:
          "* means every value, a comma separates a list (1,15), a hyphen gives a range (1-5 is Monday to Friday in the weekday field) and a slash gives a step (*/10 is every tenth value). They can be combined, for example 0-30/10.",
      },
      {
        question: "Is Sunday 0 or 7?",
        answer:
          "Both work in most implementations: the day-of-week field accepts 0 to 6 with 0 as Sunday, and many also accept 7 as Sunday. Using 0 is the most portable choice.",
      },
      {
        question: "Can cron run a job every 30 seconds?",
        answer:
          "Not in standard five-field cron, whose smallest unit is one minute. Some systems such as Quartz and certain cloud schedulers add a seconds field, but that syntax is not portable to Linux crontab.",
      },
    ],
  },

  "utm-builder": {
    intro:
      "UTM parameters are the tags — utm_source, utm_medium and utm_campaign, plus utm_content, utm_term and four newer ones that Google Analytics 4 reads — that tell your analytics where a visit came from. Without them, a click from your newsletter and a click from an Instagram bio both show up as unhelpful \"direct\" or \"referral\" traffic. This builder assembles a correctly encoded tracking link, starting from presets for the places people share links, shows which Google Analytics 4 channel the visits will be counted under, and warns about the mistakes that quietly spoil reports. It can also do the opposite job: explain every tag and tracking ID in a link someone sent you, and give you a clean copy without them.",
    howTo: {
      title: "How to build a UTM tracking link",
      steps: [
        "Paste the page you want people to land on into the website address field, for example https://example.com/pricing. A link that already has tags is read back into the fields.",
        "Choose where you will share it — Instagram, WhatsApp, a newsletter, Google Ads — to fill in Source and Medium, or type your own.",
        "Name the Campaign (diwali_sale_2026), and add Content to tell apart two links in the same campaign, such as header_button and footer_link.",
        "Check the Google Analytics 4 channel shown under the link and fix anything the tool warns about, then copy the link, test it or turn it into a QR code.",
        "To see what a link someone sent you contains, switch to Check or clean a link: every tag and tracking ID is explained, and you can copy a clean version.",
      ],
    },
    useCases: [
      {
        title: "Knowing which newsletter link people click",
        body:
          "Give every link in an email the same source and campaign but a different utm_content (hero_image, main_button, ps_link). In Google Analytics you can then see which placement actually drove visits and sign-ups instead of guessing.",
      },
      {
        title: "Comparing paid and organic social posts",
        body:
          "Tag the link in a boosted post with medium=paid_social and the same link in an ordinary post with medium=social. Both come from the same platform, but the reports keep them apart, so you can see what the ad spend added.",
      },
      {
        title: "Offline campaigns with QR codes",
        body:
          "Posters, flyers and packaging have no referrer at all, so their visits are invisible without tags. Build a link with source=poster and a campaign name, then turn it into a QR code, and every scan is counted under that campaign.",
      },
    ],
    tips: [
      "Analytics treats Email and email as two different sources. Pick one style — lowercase with underscores is the most common — and use it for every link.",
      "Medium decides the channel in Google Analytics 4. A site name such as facebook belongs in Source; putting it in Medium sends the visits to Unassigned.",
      "Never put email addresses, phone numbers or names in UTM tags. They end up in your analytics reports, which Google Analytics does not allow.",
      "Never add UTM tags to links between pages of your own site. They restart the session and credit the visit to your own campaign, wiping out the real source.",
      "Keep a simple sheet of the source, medium and campaign names your team uses, so the same campaign is not spelled three different ways.",
      "Long tagged links look untidy in posts. Put a short link or QR code in front of them; the tags still reach your analytics after the redirect.",
    ],
    extraFaqs: [
      {
        question: "Which UTM parameters are required?",
        answer:
          "Google Analytics needs utm_source to attribute a visit, and in practice you should always set utm_medium and utm_campaign as well, because reports group by them. utm_term and utm_content are optional and only worth adding when you need that extra detail.",
      },
      {
        question: "Will UTM tags hurt my SEO?",
        answer:
          "Not when your pages have a canonical tag pointing to the clean address, which most sites and platforms add automatically. Search engines then treat the tagged and untagged links as the same page. Do not use tagged links in your own navigation or sitemap.",
      },
      {
        question: "What are fbclid and gclid, and is it safe to remove them?",
        answer:
          "They are click identifiers that Facebook and Google Ads append to links so they can match a click to an ad. Removing them from a link you are sharing is safe — the page still opens normally — and it stops the link carrying tracking data to whoever you send it to.",
      },
    ],
  },

  "break-even-calculator": {
    intro:
      "The break-even point is the sales volume at which your income exactly covers your costs: below it every month is a loss, above it every extra sale is profit. This calculator works it out from three numbers you already know — monthly fixed costs, the variable cost of each unit, and your selling price — and shows the break-even quantity, the break-even revenue, the contribution each unit makes, and the profit or loss at the sales volume you expect. It is the quickest way to test whether a price, a new rent or a new hire still leaves the business viable.",
    howTo: {
      title: "How to calculate your break-even point",
      steps: [
        "Enter your fixed costs for the period: rent, salaries, software, loan repayments — anything you pay whether you sell one unit or a thousand.",
        "Enter the variable cost per unit: materials, packaging, shipping, payment fees and commission that rise with every sale.",
        "Enter the selling price per unit, after any discount you normally give.",
        "Read the break-even units and revenue. If the price is not above the variable cost, no volume can break even and the calculator tells you so.",
        "Enter the sales volume you expect to see the resulting profit or loss and the return on the costs involved.",
      ],
    },
    useCases: [
      {
        title: "Checking a price before launch",
        body:
          "A candle maker with ₹60,000 of monthly fixed costs, ₹180 of materials per candle and a ₹450 price contributes ₹270 per candle, so needs 223 sales a month to break even. If that is more than the market can take, the price, the costs or the plan has to change before launch, not after.",
      },
      {
        title: "Deciding whether a new cost is affordable",
        body:
          "Adding a ₹25,000-a-month employee to the business above raises the break-even point by about 93 candles a month. Seeing the extra volume needed in units makes it easy to judge whether the hire will pay for itself.",
      },
      {
        title: "Presenting a business plan",
        body:
          "Lenders and investors ask how many sales it takes to stop losing money. A break-even figure built from clear fixed and variable costs answers that directly and shows you understand your own unit economics.",
      },
    ],
    tips: [
      "The contribution margin (price minus variable cost) is the number to watch. Raising the price or cutting a variable cost increases it and lowers the break-even point immediately.",
      "Include every per-sale cost in the variable cost: payment gateway fees of 2%, marketplace commission and returns add up and are easy to forget.",
      "Break-even assumes you can sell the volume at that price. Compare the result with realistic demand, not with the capacity of your workshop.",
      "Run the numbers for your best and worst months. A seasonal business can break even over the year while losing money for several months in a row.",
    ],
    extraFaqs: [
      {
        question: "What is the break-even formula?",
        answer:
          "Break-even units = fixed costs ÷ (selling price − variable cost per unit). Break-even revenue = break-even units × selling price, or fixed costs ÷ contribution margin ratio. The part in brackets is the contribution margin: what each sale leaves over to pay fixed costs.",
      },
      {
        question: "Why does the calculator say I can never break even?",
        answer:
          "Because your selling price is at or below the variable cost of each unit. Every sale then loses money or makes nothing towards fixed costs, so selling more only makes the loss larger. The price has to rise or the unit cost has to fall.",
      },
      {
        question: "Should break-even include my own salary?",
        answer:
          "Yes, if you want the business to pay you. Add the amount you need to draw as a fixed cost. Otherwise the break-even point shows when the business stops losing money, not when it supports you.",
      },
    ],
  },

  "contrast-checker": {
    intro:
      "Text that is too close in colour to its background is hard to read for everyone and impossible for many people with low vision or colour blindness. This checker calculates the WCAG 2.1 contrast ratio between a text colour and a background colour, shows whether the pair passes AA and AAA for normal and large text, and previews real headings and paragraphs in those colours. It also simulates protanopia, deuteranopia and tritanopia, so you can see how the pair looks to people with the most common forms of colour blindness.",
    howTo: {
      title: "How to check colour contrast",
      steps: [
        "Enter the text colour and the background colour as HEX values, or pick them.",
        "Read the contrast ratio, from 1:1 (identical colours) to 21:1 (black on white).",
        "Check the AA and AAA results for normal text and for large text.",
        "Look at the preview to judge readability with real text, not just a number.",
        "Switch on the colour-blindness simulations to make sure important text and states are still distinguishable.",
      ],
    },
    useCases: [
      {
        title: "Checking brand colours before launch",
        body:
          "A light brand green on white often scores around 2.5:1 — fine for decoration but failing for body text. Finding this early lets you pick a darker shade for text and keep the bright one for backgrounds and icons.",
      },
      {
        title: "Meeting accessibility requirements",
        body:
          "Public-sector and many corporate sites must meet WCAG AA. Checking every text and background pair in your design system before build is much cheaper than fixing it after an audit.",
      },
      {
        title: "Buttons and form states",
        body:
          "Placeholder text, disabled buttons and error messages are the usual failures. Checking them — and checking that errors are not shown by colour alone — makes forms usable for more people.",
      },
    ],
    tips: [
      "AA needs 4.5:1 for normal text and 3:1 for large text (24 px, or about 19 px bold). AAA needs 7:1 and 4.5:1.",
      "Icons, input borders and focus rings are non-text elements and need at least 3:1 against what is next to them.",
      "Never rely on colour alone for meaning: add an icon or text to red error and green success states.",
      "Pure black on pure white is the maximum 21:1, but very dark grey on white (around 15:1) is often more comfortable for long reading.",
    ],
    extraFaqs: [
      {
        question: "How is the contrast ratio calculated?",
        answer:
          "Each colour's relative luminance is computed from its RGB values, then the ratio is (lighter + 0.05) ÷ (darker + 0.05). The result runs from 1:1 to 21:1 and does not depend on which colour is the text.",
      },
      {
        question: "What counts as large text in WCAG?",
        answer:
          "At least 18 points (24 CSS pixels) regular, or 14 points (about 18.7 CSS pixels) bold. Large text only needs 3:1 for AA because bigger letters are easier to read.",
      },
      {
        question: "Does WCAG 3 change these rules?",
        answer:
          "WCAG 3 is still a draft and proposes a different contrast method (APCA). WCAG 2.1 and 2.2 AA remain the standard that laws and procurement rules refer to, so check against them.",
      },
    ],
  },

  "aspect-ratio-calculator": {
    intro:
      "Aspect ratio is the proportion of width to height — 16:9 for most video, 4:5 for tall Instagram posts, 9:16 for Reels and Shorts. This calculator reduces any pixel size to its simplest ratio (1920 × 1080 becomes 16:9) and works out the missing side when you resize, so a 1600-pixel-wide image keeps its shape at exactly 900 pixels tall. Presets cover common video resolutions and social media formats, and a preview box shows the shape before you commit to it.",
    howTo: {
      title: "How to calculate an aspect ratio",
      steps: [
        "Enter the original width and height in pixels to see the simplified ratio.",
        "To resize, type the new width and the matching height is calculated, or type the height to get the width.",
        "Pick a preset such as 1080p, 4K, Instagram portrait or YouTube thumbnail to fill in standard sizes.",
        "Check the preview box to see the proportions at a glance.",
        "Copy the dimensions into your editor, export settings or CSS.",
      ],
    },
    useCases: [
      {
        title: "Resizing for social media",
        body:
          "A 3000 × 2000 photo is 3:2, which Instagram crops when posted as a 4:5 portrait. Knowing the ratio first tells you whether to crop, pad or choose a different format before you upload.",
      },
      {
        title: "Video exports and thumbnails",
        body:
          "YouTube expects 16:9. A 1280 × 720 thumbnail and a 3840 × 2160 video share that ratio, so neither is letterboxed. Checking the ratio avoids black bars and stretched faces.",
      },
      {
        title: "Responsive web layouts",
        body:
          "Reserving space for images and embeds with the CSS aspect-ratio property stops the page jumping as they load. Calculate the ratio of your media once and use it in the stylesheet.",
      },
    ],
    tips: [
      "Scaling an image down keeps quality; scaling up beyond the original pixel size makes it blurry whatever the ratio.",
      "Changing the ratio always means cropping or adding bars. Decide which part of the picture matters before converting 16:9 to 9:16.",
      "Screens are 16:9 or 16:10, most phone cameras shoot 4:3 photos, and most DSLRs shoot 3:2.",
      "For print, the ratio of the paper matters too: A-series paper is about 1:1.414, which neither 4:3 nor 3:2 matches exactly.",
    ],
    extraFaqs: [
      {
        question: "How is an aspect ratio simplified?",
        answer:
          "By dividing both sides by their greatest common divisor. For 1920 × 1080 the divisor is 120, giving 16:9. Some sizes do not reduce to familiar numbers; 1366 × 768 is really 683:384, which is approximately 16:9.",
      },
      {
        question: "What size should an Instagram post be?",
        answer:
          "Square posts are 1:1 (1080 × 1080), portrait posts 4:5 (1080 × 1350) and Reels and Stories 9:16 (1080 × 1920). Portrait takes up the most space in the feed.",
      },
      {
        question: "Is 16:9 the same as 1.78:1?",
        answer:
          "Yes. A ratio can be written as two whole numbers or as width divided by height: 16 ÷ 9 = 1.78. Cinema formats are usually written the second way, such as 2.39:1.",
      },
    ],
  },

  "exif-viewer": {
    intro:
      "Most photos carry hidden details written by the camera or phone: the make and model, lens, shutter speed, aperture and ISO, the exact date and time, the software used to edit it and, often, the GPS location where it was taken. This viewer reads that EXIF data from JPEG, PNG, WebP, HEIC and TIFF files, highlights anything personal — location, serial numbers, your name — and shows the small preview some cameras embed. It can also save a copy with the metadata removed, without re-compressing the image. The photo is read on your device and never uploaded.",
    howTo: {
      title: "How to view and remove photo metadata",
      steps: [
        "Drop a photo onto the box or choose one from your device. JPEG, PNG, WebP, HEIC and TIFF are supported.",
        "Read \"What this photo reveals\" for a summary of the personal details it contains.",
        "Check the grouped details: camera and lens, exposure settings, date and time, and image properties. Open All tags for the complete list.",
        "If the photo has a location, see the coordinates and open them in OpenStreetMap.",
        "Choose Download without metadata to save a clean copy. The picture data is copied unchanged, so there is no quality loss.",
      ],
    },
    useCases: [
      {
        title: "Checking a photo before posting it",
        body:
          "A picture taken at home on a phone with location turned on records the house's coordinates to within a few metres. Some sites strip this on upload and some do not; checking first, and removing it, means you do not have to rely on them.",
      },
      {
        title: "Selling items online",
        body:
          "Marketplace photos are often taken at home. Removing the metadata before uploading keeps your address, phone model and the date out of the listing.",
      },
      {
        title: "Learning from camera settings",
        body:
          "Photographers can see the exact shutter speed, aperture, ISO and focal length behind a shot they like, which is one of the fastest ways to learn exposure.",
      },
    ],
    tips: [
      "WhatsApp, Instagram and Facebook remove most metadata from photos they publish, but files sent as documents or by email keep all of it.",
      "Cropping a photo does not always update the embedded preview. If the preview shows the uncropped image, remove the metadata before sharing.",
      "Removing metadata keeps the colour profile and, by default, the orientation, so the photo still looks the same and is not turned sideways.",
      "To stop location being recorded in the first place, turn off location access for your camera app.",
    ],
    extraFaqs: [
      {
        question: "Is my photo uploaded to read the EXIF data?",
        answer:
          "No. The file is read in your browser's memory and never sent anywhere, including when you download the cleaned copy.",
      },
      {
        question: "Does removing metadata reduce image quality?",
        answer:
          "No. For JPEG, PNG and WebP the tool removes only the metadata sections and copies the compressed picture data byte for byte, so the image is identical.",
      },
      {
        question: "Why does my screenshot show no EXIF data?",
        answer:
          "Screenshots, most PNG images and pictures saved from social networks usually contain no camera metadata. That is normal and means there is nothing personal stored in the file.",
      },
    ],
  },

  "markdown-table-generator": {
    intro:
      "Markdown tables are fiddly to type by hand: every row needs the right number of pipes, and one missing separator breaks the whole table. This generator gives you a spreadsheet-style grid instead. Type into the cells or paste a block copied from Excel or Google Sheets, add or remove rows and columns, set each column to left, centre or right alignment, and copy neatly aligned Markdown or an equivalent HTML table, ready for a README, a GitHub issue, documentation or a blog post.",
    howTo: {
      title: "How to make a Markdown table",
      steps: [
        "Type your column headings into the first row of the grid.",
        "Fill in the cells, or paste a block of cells from a spreadsheet into any cell. Use the Row and Column buttons to grow the table.",
        "Click the alignment button in each heading to switch between left, centre and right: left for text, right for numbers, centre for short labels.",
        "Check the code below the grid, and switch between Markdown and HTML.",
        "Copy the output and paste it into your README, issue, wiki or editor.",
      ],
    },
    useCases: [
      {
        title: "README files and documentation",
        body:
          "Configuration options, command flags and supported versions are all easier to scan as a table. The grid makes it easy to keep columns consistent as the list grows.",
      },
      {
        title: "Comparisons in issues and pull requests",
        body:
          "Before-and-after benchmarks, browser support and option comparisons read far better as a table in a GitHub comment than as a list of sentences.",
      },
      {
        title: "Tables for sites that do not accept Markdown",
        body:
          "Some CMS editors and email tools need HTML. The HTML output gives a plain, unstyled table that inherits your site's styles.",
      },
    ],
    tips: [
      "Right-align columns of numbers so the digits line up and are easy to compare.",
      "Pipes and line breaks inside cells are escaped for you, so a value such as A | B stays in one cell.",
      "Markdown tables cannot merge cells or hold multiple paragraphs in one cell. For complex layouts, use the HTML output and edit it.",
      "Keep cells short. Long text makes the raw Markdown hard to edit, even though it renders fine.",
    ],
    extraFaqs: [
      {
        question: "How do you align columns in a Markdown table?",
        answer:
          "With colons in the separator row under the headings: :--- aligns left, :---: centres and ---: aligns right. The generator writes these for you from the alignment buttons.",
      },
      {
        question: "Does this work with GitHub Flavored Markdown?",
        answer:
          "Yes. Tables are part of GitHub Flavored Markdown and are also supported by GitLab, Bitbucket, Notion, Obsidian, Docusaurus and most static site generators.",
      },
      {
        question: "Can I put bold text or links in a cell?",
        answer:
          "Yes. Ordinary inline Markdown such as **bold**, `code` and [links](https://example.com) works inside table cells; block elements such as lists and headings do not.",
      },
    ],
  },

  "ai-text-summarizer": {
    intro:
      "Long reports, articles and email threads usually make three or four points. This summariser finds them for you, in two ways. The on-device engine runs in your browser: it scores every sentence by how much of the text's key vocabulary it contains, favours sentences that open paragraphs, avoids picking two that say the same thing, and returns the most informative ones in their original order — nothing leaves your device. The optional Cloud AI mode sends the text to Google Gemini, which writes a new summary in its own words, as a paragraph or as bullet points.",
    howTo: {
      title: "How to summarise text",
      steps: [
        "Choose the engine: On-device for private, instant summaries, or Cloud AI for a rewritten summary from Google Gemini.",
        "Paste your text or open a .txt or .md file. A few paragraphs or more gives the best results.",
        "Pick the length — Short, Medium or Detailed — and whether you want a paragraph or bullet points.",
        "Press Summarise, or Ctrl + Enter.",
        "Check the word counts to see how much shorter the summary is, then copy it or save it as a text file.",
      ],
    },
    useCases: [
      {
        title: "Getting through long reading",
        body:
          "A 2,000-word report takes about nine minutes to read. A medium summary gives you the main points in under one, so you can decide whether the full document deserves your time.",
      },
      {
        title: "Meeting notes and email threads",
        body:
          "Paste a long thread or a transcript and ask for bullet points to get the decisions and open questions without re-reading every message.",
      },
      {
        title: "Studying and research",
        body:
          "Summarising each section of a chapter in turn is a quick way to build revision notes. Use the on-device engine for exact sentences you can quote, and Cloud AI when you want a shorter paraphrase.",
      },
    ],
    tips: [
      "The on-device summary only uses sentences from your text, so it never invents facts. Cloud AI writes new sentences; check names and numbers against the original.",
      "Very short texts cannot be summarised much. If every sentence is kept, the text is already about as short as it can be.",
      "Remove headers, footers and navigation text before pasting a web page, or they will compete with the real content.",
      "For documents longer than a few thousand words, summarise section by section for better results.",
    ],
    extraFaqs: [
      {
        question: "What is the difference between the two engines?",
        answer:
          "On-device is extractive: it selects the most important sentences from your text, instantly and privately. Cloud AI is abstractive: Google Gemini reads the text and writes a new, usually shorter, summary. The first is exact; the second reads more naturally.",
      },
      {
        question: "Is my text stored or used for training?",
        answer:
          "On-device, the text never leaves your browser. In Cloud AI mode it is sent to Google's Gemini API to produce the summary and is handled under Google's API terms; TabBench does not store it.",
      },
      {
        question: "Does it work for languages other than English?",
        answer:
          "Cloud AI summarises most major languages, including Hindi. The on-device engine is tuned for English: it will still pick sentences in other languages, but its choice of key words is less reliable.",
      },
    ],
  },

  "ai-text-rewriter": {
    intro:
      "The same message can come across as careless, stiff or friendly depending on a few words. This rewriter adjusts the tone of your text — professional, formal, friendly, casual, concise or simple — in two ways. The on-device engine makes safe, rule-based edits in your browser: it fixes slang and text-speak, expands or adds contractions, removes filler and wordy phrases, and softens stiff openings, then shows every change so you can review it. The optional Cloud AI mode sends the text to Google Gemini, which rewrites it in the chosen tone while keeping the facts.",
    howTo: {
      title: "How to change the tone of your writing",
      steps: [
        "Choose the engine: On-device for private edits you can review, or Cloud AI for a full rewrite.",
        "Paste your email, message or paragraph.",
        "Pick a tone. The line under the tones describes what it does.",
        "Press Rewrite, or Ctrl + Enter.",
        "Use Show changes to see each edit highlighted, then copy the result.",
      ],
    },
    useCases: [
      {
        title: "Polishing a quick message to your manager",
        body:
          "\"Hey boss, I'm gonna be late, gotta reschedule our 1-on-1\" becomes \"Hello boss, I'm going to be late, we have to reschedule our one-to-one\" in the professional tone — the same message, without the slang.",
      },
      {
        title: "Making formal letters warmer",
        body:
          "Customer emails that start \"Dear Sir/Madam, we regret to inform you that…\" read as cold. The friendly tone turns that into \"Hi there, unfortunately…\" and adds natural contractions.",
      },
      {
        title: "Cutting word count",
        body:
          "The concise tone removes phrases such as \"in order to\", \"due to the fact that\" and \"at this point in time\", which is useful for word-limited forms, abstracts and social posts.",
      },
    ],
    tips: [
      "Always read the result before sending. Tone depends on context that no tool can fully judge.",
      "On-device edits are deliberately conservative: they only change words where the new version means the same thing. If nothing needs changing, the tool says so rather than altering your text.",
      "Cloud AI keeps facts, numbers, names and dates, but check them anyway when the message matters.",
      "For very important emails, rewrite once, then edit by hand; two passes through any tool can drift from what you meant.",
    ],
    extraFaqs: [
      {
        question: "Why did the on-device engine make only a few changes?",
        answer:
          "Because it only changes words and phrases it can replace safely without understanding the whole sentence, such as slang, contractions and wordy phrases. For a rewrite that restructures sentences, switch to Cloud AI.",
      },
      {
        question: "Will the rewritten text pass as my own writing?",
        answer:
          "On-device edits keep your sentences and only swap a few words, so the text stays yours. Cloud AI rewrites more heavily. If your school or employer has rules about AI-assisted writing, follow them.",
      },
      {
        question: "Is my text sent anywhere?",
        answer:
          "Not in on-device mode. In Cloud AI mode it is sent to Google Gemini to produce the rewrite and is not stored by TabBench.",
      },
    ],
  },

  "ai-text-simplifier": {
    intro:
      "Legal clauses, policies and technical documents are often written in long sentences full of words like \"notwithstanding\" and \"subsequent to\". This simplifier turns them into plain English and measures the difference with the Flesch reading-ease score and school grade level. The on-device engine replaces more than 150 wordy phrases and formal words with plain ones and splits sentences joined by semicolons, all in your browser. The optional Cloud AI mode sends the text to Google Gemini for a full plain-English rewrite. Both show before-and-after scores and flag sentences that are still too long.",
    howTo: {
      title: "How to simplify complex text",
      steps: [
        "Choose On-device for private word and phrase replacement, or Cloud AI for a full rewrite.",
        "Paste the text. The current reading-ease score appears under the box as you type.",
        "Press Simplify, or Ctrl + Enter.",
        "Compare the reading ease and grade before and after, and open Show changes to review each edit.",
        "Split any sentences listed under \"Still long\", then copy the result.",
      ],
    },
    useCases: [
      {
        title: "Understanding a contract or policy",
        body:
          "\"Notwithstanding the aforementioned stipulations, the contractor shall endeavour to expeditiously facilitate…\" becomes \"Despite the above conditions, the contractor must try to quickly help…\" — the obligation is suddenly clear.",
      },
      {
        title: "Writing for customers",
        body:
          "Help articles, notices and instructions work best at a reading ease of 60 or above. Measuring a draft and replacing jargon gets it there without dumbing down the content.",
      },
      {
        title: "Accessible public information",
        body:
          "Government and health guidance is read by people with a wide range of reading skills and by many who read English as a second language. Plain words and short sentences help all of them.",
      },
    ],
    tips: [
      "A reading ease of 60–70 is plain English; 30–50 is typical of academic writing; below 30 is very hard going.",
      "Sentences under about 20 words are easiest to follow. The tool lists anything over 25 words so you can split it.",
      "Keep technical terms your readers must know, but explain them the first time they appear.",
      "For legal text, use the simplified version to understand the meaning, and rely on the original wording for anything binding.",
    ],
    extraFaqs: [
      {
        question: "How is the reading-ease score calculated?",
        answer:
          "Flesch reading ease = 206.835 − 1.015 × (words ÷ sentences) − 84.6 × (syllables ÷ words). Long sentences and long words both lower the score. The grade level uses the related Flesch–Kincaid formula and approximates a US school grade.",
      },
      {
        question: "Why did my score barely change?",
        answer:
          "The on-device engine replaces words and phrases but cannot restructure long sentences, which have the biggest effect on the score. Split the sentences listed as still long, or use Cloud AI for a fuller rewrite.",
      },
      {
        question: "Does simplifying change the meaning?",
        answer:
          "It should not: the on-device replacements are chosen to mean the same thing in context, and Cloud AI is instructed to keep every fact and obligation. Still compare the two versions when accuracy matters.",
      },
    ],
  },

  "ai-keyword-extractor": {
    intro:
      "Keywords tell you what a piece of text is actually about — useful for SEO, tagging, research and checking that a page covers the topic you intended. This extractor lists the most important single words with how often each appears and its share of the text, and the key multi-word phrases. The on-device engine counts terms in your browser, folding plurals together and ignoring filler words, and finds phrases using the RAKE method. The optional Cloud AI mode asks Google Gemini to pick keywords by meaning and explain why each one matters.",
    howTo: {
      title: "How to extract keywords from text",
      steps: [
        "Choose On-device for private, instant counts, or Cloud AI for keywords chosen by meaning.",
        "Paste an article, product description or page copy.",
        "Pick how many keywords you want: 6, 10, 15 or 20.",
        "Press Extract keywords, or Ctrl + Enter.",
        "Read the keywords and key phrases, then copy them as comma-separated tags or save the list.",
      ],
    },
    useCases: [
      {
        title: "Checking a page before publishing",
        body:
          "If a guide to home solar power lists \"solar\", \"panels\" and \"electricity\" as its top keywords, it is on topic. If \"company\" and \"offer\" come first, the content is drifting into sales copy.",
      },
      {
        title: "Tagging articles and products",
        body:
          "The key phrases make good starting tags and categories. Copying them as comma-separated tags saves retyping them into a CMS or shop.",
      },
      {
        title: "Researching a topic",
        body:
          "Running several competing articles through the extractor shows which terms and sub-topics they all cover, and which ones your own piece is missing.",
      },
    ],
    tips: [
      "Density above about 3% for one keyword in a long article often reads as repetitive. Write for the reader, not the count.",
      "Repeated phrases are usually more meaningful than single words: \"battery storage\" says more than \"battery\".",
      "Remove navigation, footers and boilerplate before pasting a web page so they do not skew the counts.",
      "Keywords show what a text is about, not what people search for. Pair them with search volume data before making SEO decisions.",
    ],
    extraFaqs: [
      {
        question: "How are keywords ranked on-device?",
        answer:
          "By how often each word appears after removing common filler words and treating plurals as the same word. Phrases are scored with RAKE, which favours words that tend to appear inside longer phrases, and phrases that repeat get a bonus.",
      },
      {
        question: "What is keyword density?",
        answer:
          "The share of all words in the text taken by one keyword, as a percentage. If \"solar\" appears 5 times in 108 words, its density is 4.6%.",
      },
      {
        question: "Why do Cloud AI results differ?",
        answer:
          "Gemini chooses keywords by meaning, so it can pick an important term that appears only once, or a concept that is described but never named. The on-device counts are exact but purely statistical.",
      },
    ],
  },

  "ai-json-explainer": {
    intro:
      "Opening an unfamiliar API response or config file often means scrolling through hundreds of lines to work out what is in it. This explainer maps the whole structure in your browser: every field path with its type, the format of its values (dates, emails, URLs, IDs, IP addresses, tokens), what the field most likely means, and which fields are optional because only some items in a list have them. It also flags secrets and personal data, mixed types and numbers stored as text. Choose Cloud AI to add a written explanation from Google Gemini.",
    howTo: {
      title: "How to understand a JSON document",
      steps: [
        "Paste JSON or open a .json file. Use Format JSON to indent a minified payload.",
        "Leave the engine on On-device for a private structural analysis, or pick Cloud AI to add a written explanation.",
        "Press Explain JSON, or Ctrl + Enter. If the JSON is invalid, the exact line and column of the error are shown.",
        "Read the overview and the \"Worth knowing\" notes: secrets, personal data, inconsistent types and optional fields.",
        "Scan the field table, then copy or save the whole analysis as Markdown.",
      ],
    },
    useCases: [
      {
        title: "Integrating a new API",
        body:
          "The field table shows at once that invoices[].amount is sometimes a number and sometimes a string, and that note is present in only some invoices. Those are exactly the details that cause bugs when you write code against the API.",
      },
      {
        title: "Reviewing data before sharing it",
        body:
          "Before pasting a payload into a ticket, a chat or an AI tool, the explainer flags fields like api_key and email so you can remove them first.",
      },
      {
        title: "Documenting a payload",
        body:
          "Saving the analysis as Markdown gives you a ready-made field reference for a README or wiki page, with types and examples filled in.",
      },
    ],
    tips: [
      "Paste a real, complete sample. Fields that are missing or null in the sample cannot be described fully.",
      "\"[]\" in a path means every item of a list, so orders[].total is the total of each order.",
      "Field meanings are inferred from names and values. Treat them as a strong hint, and confirm with the API's documentation where it exists.",
      "Cloud AI sends the JSON to Google. Leave it on On-device, or remove sensitive values first, for production data.",
    ],
    extraFaqs: [
      {
        question: "Is my JSON checked by an AI model?",
        answer:
          "No. Validation and the structural analysis use the browser's own JSON parser and run on your device, so the error positions and field list are exact. Only the optional written explanation comes from Google Gemini.",
      },
      {
        question: "How does it decide a field is sensitive?",
        answer:
          "From the words in its name (password, secret, token, api_key, authorization and similar) and from its value, such as a signed JWT. Personal data is flagged from names like email, phone and address, and from values that look like emails, phone numbers or IP addresses.",
      },
      {
        question: "How large a file can it handle?",
        answer:
          "Several megabytes comfortably. For very large arrays the first 500 items are analysed, which is plenty to capture the shape of the data, and the notes say when that limit was reached.",
      },
    ],
  },

  "calculator": {
    intro:
      "A calculator should get out of the way. This one has a clear display that shows the whole expression as you type, large keys laid out like the calculators on Windows and phones, and a Scientific mode for trigonometry, logarithms, powers and brackets when you need more. Results go into a history list you can reuse, memory keys hold sub-totals, and everything works from the keyboard. All calculations run in your browser.",
    howTo: {
      title: "How to use the online calculator",
      steps: [
        "Click the keys or type with your keyboard or numpad.",
        "Enter numbers and operators (+, −, ×, ÷). The line above the result shows the expression so far.",
        "Press Enter or = to get the result. Answers are rounded to 12 decimal places, so 0.1 + 0.2 shows 0.3.",
        "Switch to Scientific for sin, cos, tan (in degrees or radians), ln, log, powers (xʸ), cubes and cube roots, factorials, brackets, π and e. Press 2nd for the inverse functions.",
        "Open History to see past results; select one to use it again.",
        "Use the memory keys (MC, MR, M+, M−, MS) to keep a running sub-total across calculations.",
      ],
    },
    useCases: [
      {
        title: "Everyday sums and bills",
        body:
          "Add up invoices, receipts and expenses; the history keeps each total so you can check your work or carry a result into the next sum.",
      },
      {
        title: "Percentages the way a desk calculator does them",
        body:
          "200 + 10 % gives 220 and 200 − 10 % gives 180, because after + or − the percent is taken of the first number. After × or ÷ it simply divides by 100.",
      },
      {
        title: "Homework and engineering",
        body:
          "Trigonometry in degrees or radians, logarithms, powers, roots and factorials, without a handheld scientific calculator.",
      },
    ],
    tips: [
      "Press Esc to clear everything, Delete to clear the current entry, and Backspace to remove the last digit.",
      "Press Ctrl+C (Cmd+C on a Mac) with nothing selected to copy the current result.",
      "Pressing a second operator replaces the first, so a mistyped + can be corrected by pressing − straight away.",
      "Key sounds are off by default; turn them on with the Sound button if you like audible feedback.",
    ],
    extraFaqs: [
      {
        question: "How does the calculator handle order of operations?",
        answer:
          "It follows standard precedence (BODMAS / PEMDAS): brackets first, then powers, then multiplication and division, then addition and subtraction. So 2 + 3 × 4 is 14, and (2 + 3) × 4 is 20.",
      },
      {
        question: "Is my history saved when I refresh the page?",
        answer:
          "Yes. The history and memory are kept in this browser's local storage for three days, then cleared automatically. They never leave your device.",
      },
    ],
  },

  "unit-converter": {
    intro:
      "Converting units across imperial and metric systems is a daily necessity for engineers, travelers, cooks, and students. This universal unit converter eliminates the guesswork by calculating values across 8 core physical dimensions — Length, Weight/Mass, Temperature, Area, Volume, Speed, Digital Storage, and Time. Instead of showing only a single converted number, it provides an interactive real-time comparison grid that shows how your measurement translates into every unit in that category simultaneously, complete with formulas and quick presets.",
    howTo: {
      title: "How to convert measurement units online",
      steps: [
        "Select your measurement category from the top tabs (e.g., Length, Weight, Temperature, or Digital Storage).",
        "Type your value into the 'From' input box.",
        "Choose your starting unit in the 'From' dropdown and target unit in the 'To' dropdown.",
        "View the converted value instantly in the right box. Click the swap button (⇄) anytime to reverse the conversion.",
        "Scroll down to inspect the Complete Comparison Grid to see your value translated across all units in the category.",
        "Click 'Copy Result' to copy the formatted number directly to your clipboard.",
      ],
    },
    useCases: [
      {
        title: "International travel & navigation",
        body:
          "Quickly convert highway speeds from km/h to mph, distances from kilometers to miles, and ambient weather temperatures from Celsius to Fahrenheit.",
      },
      {
        title: "Cooking & baking recipe scaling",
        body:
          "Translate European metric baking measurements (grams, milliliters) into US volume measures (cups, tablespoons, fluid ounces) effortlessly.",
      },
      {
        title: "IT & cloud storage planning",
        body:
          "Convert accurately between decimal storage metrics (GB, TB) and binary computing architectures (GiB, TiB) when provisioning cloud servers or purchasing storage.",
      },
    ],
    tips: [
      "Click any preset button under the converter for instant one-click calculations of popular everyday conversions.",
      "Click directly on any tile in the comparison grid to set that unit as your current target.",
    ],
    extraFaqs: [
      {
        question: "Are temperature conversions proportional?",
        answer:
          "No, temperature uses interval scaling with different zero-points. The converter uses exact formulas: °F = (°C × 9/5) + 32 and K = °C + 273.15.",
      },
    ],
  },

  "stopwatch-timer": {
    intro:
      "Whether you are timing sprints, measuring workout intervals, tracking productivity with Pomodoro sprints, or steeping tea, having a responsive, accurate timer is essential. This browser utility combines a precision millisecond digital stopwatch with a flexible countdown timer. The stopwatch includes lap recording with split times, lap deltas, and automated fastest/slowest lap highlighting. The countdown timer features an intuitive circular progress ring, one-click duration presets, fullscreen mode, and a synthesized melodic chime that alerts you when time expires.",
    howTo: {
      title: "How to use the digital stopwatch and countdown timer",
      steps: [
        "Switch between 'Digital Stopwatch' and 'Countdown Timer' using the top category selector.",
        "For the Stopwatch: Click 'Start' to begin timing. Click 'Lap' to record intermediate split times. Fastest laps are badged in green and slowest in amber.",
        "For the Timer: Select a quick preset (e.g., 5m, 10m, 25m Pomodoro) or enter your custom duration, then click 'Start'.",
        "When the countdown timer finishes, an audio alarm plays automatically with a visual alert.",
        "Click the Fullscreen icon to expand the timer for presentations, gym workouts, or kitchen cooking displays.",
      ],
    },
    useCases: [
      {
        title: "Athletic training & track split timing",
        body:
          "Measure lap times and analyze pacing improvements with centisecond precision and automated lap comparison.",
      },
      {
        title: "Pomodoro study & deep work sessions",
        body:
          "Boost productivity by working in uninterrupted 25-minute sprints followed by 5-minute cooldown periods.",
      },
      {
        title: "Presentations & public speaking",
        body:
          "Launch fullscreen mode on a podium or second screen to stay strictly within allotted presentation speaking times.",
      },
    ],
    tips: [
      "Use 'Copy Laps' on the stopwatch to paste a cleanly formatted log of all lap and split times into your notes or spreadsheet.",
      "The timer continues tracking elapsed time accurately even if you switch browser tabs.",
    ],
    extraFaqs: [
      {
        question: "Does the timer sound require downloading MP3 files?",
        answer:
          "No. The audio chime is synthesized entirely inside your browser via the Web Audio API, ensuring instantaneous playback with zero network dependency.",
      },
    ],
  },

  "text-sorter": {
    intro:
      "Organizing raw text, cleaning email lists, deduplicating inventory SKUs, and sorting data alphabetically are some of the most frequent administrative tasks in digital work. This tool processes text in real-time within your browser: alphabetize lines A to Z or reverse Z to A, sort by line length, shuffle randomly, deduplicate items with case sensitivity controls, trim whitespace, and append sequential numbering. All transformations execute locally with zero data transmission.",
    howTo: {
      title: "How to sort and clean text lists online",
      steps: [
        "Paste your text or list into the left 'Input Raw Text' box.",
        "Choose your sorting preference: Alphabetical (A → Z), Reverse (Z → A), Shortest First, Longest First, or Shuffle.",
        "Toggle cleaning options as needed: Deduplicate Lines, Trim Whitespace, Remove Blank Lines, or Line Numbering.",
        "Inspect the sorted and cleaned result in the right output panel.",
        "Review the live metrics footer showing original lines, final lines, and duplicates eliminated.",
        "Click 'Copy' to copy the result, or 'Save' to download a clean .txt file.",
      ],
    },
    useCases: [
      {
        title: "Deduplicating customer & subscriber lists",
        body:
          "Paste email addresses or user handles to strip identical entries instantly before running marketing campaigns or importing into databases.",
      },
      {
        title: "Alphabetizing bibliographies & indexes",
        body:
          "Sort references, authors, or index entries into clean alphabetical order with natural number handling.",
      },
      {
        title: "Developer log & code cleanup",
        body:
          "Sort enum lists, import statements, CSS properties, or environment variables while stripping unwanted whitespace and blank lines.",
      },
    ],
    tips: [
      "If you want to remove duplicates without sorting your lines, choose 'None' as the sort order while keeping 'Deduplicate Lines' checked.",
      "Natural alphanumeric sorting ensures numbers inside names like item1, item2, item10 are sorted logically.",
    ],
    extraFaqs: [
      {
        question: "Can I handle lists with thousands of items?",
        answer:
          "Yes. The sorting algorithms run in native browser JavaScript and comfortably process lists containing tens of thousands of lines within milliseconds.",
      },
    ],
  },

  "online-camera": {
    intro:
      "Laptop webcams and many phone browsers produce flat, grainy pictures: the camera hands the browser a raw video stream without the processing a phone's own camera app adds. This camera puts some of that processing back. Enhance measures every frame and gently corrects brightness, contrast and colour cast, then sharpens edges without sharpening grain. Low light merges several frames into one photo, which cuts noise in dim rooms while keeping anything that moved sharp. Face detection sets the exposure for the people in the picture, so a face in front of a bright window is not left in shadow, and keeps skin from being over-sharpened. Ten restrained filters and manual sliders let you set a look before you shoot, videos are recorded exactly as you see them, and full-screen mode turns the page into a camera app. Everything runs on your device and nothing is uploaded.",
    howTo: {
      title: "How to take better photos and videos in your browser",
      steps: [
        "Choose Start camera and allow access when your browser asks. On a phone, the back camera opens first; use the switch button for the front one.",
        "Leave Enhance on for balanced, sharper pictures. In a dim room, turn on Low light and hold still for a moment after pressing the shutter.",
        "Pick a filter under Filters and set its strength, or fine-tune brightness, contrast, warmth and more under Adjust.",
        "Press the shutter for a photo, or switch to Video and press record. Use the timer for group shots and the grid to line up the horizon.",
        "Choose Full screen to use it like a phone's camera app, with filters and settings a tap away. Press and hold the picture at any time to compare with the original.",
        "Open a photo or video from Your photos and videos to check it, change a photo's filter later, or download everything as a ZIP.",
      ],
    },
    useCases: [
      {
        title: "Clearer pictures from a laptop webcam",
        body:
          "Webcams struggle under indoor lighting: faces look grey and backgrounds noisy. Enhance lifts the midtones and removes colour casts from ceiling lights, and Low light cleans up the grain, which makes a real difference for profile pictures, document snaps and quick product shots.",
      },
      {
        title: "Recording a short clip or message",
        body:
          "Record a video greeting, a how-to clip or a quick update for a team without installing an app. Pause and resume while recording, and the video is saved as MP4 in browsers that support it so it plays on any phone.",
      },
      {
        title: "Giving an existing photo a consistent look",
        body:
          "Choose Edit a photo to apply the same filters and adjustments to a picture already on your device. Saving creates a new copy, and the camera, location and other details stored in the original file are not carried over.",
      },
    ],
    tips: [
      "Light matters more than any setting: face a window rather than sitting with it behind you.",
      "Low light works best when the camera is steady. People who move keep the detail from the first frame instead of leaving a ghost.",
      "On older phones choose Standard quality in Settings for a smoother preview and smaller videos.",
      "Photos and videos are kept only while the page is open. Download the ones you want to keep before you leave.",
      "Photos saved here contain no location or device details, so they are safe to share as they are.",
      "Face detection is built for faces within about two metres, as in selfies and video calls. It downloads about 3.5 MB the first time and is off by default on phones with little memory.",
    ],
    extraFaqs: [
      {
        question: "Does this camera make photos sharper than my phone's camera app?",
        answer:
          "Usually not: a phone's own app has direct access to the sensor and years of tuning. This tool closes much of the gap for webcams and in-browser cameras, which normally get none of that processing.",
      },
      {
        question: "What format are the videos?",
        answer:
          "MP4 in Safari and recent versions of Chrome and Edge, which plays everywhere. Firefox and older Chrome record WebM, which plays in most browsers and in VLC.",
      },
      {
        question: "Why is there no flash or zoom button?",
        answer:
          "Browsers only expose the flashlight and optical zoom on some Android phones, mostly in Chrome. When your camera supports them, the buttons appear on the preview.",
      },
    ],
  },

};

/** Returns the long-form content for a tool, if any has been written. */
export function getToolContent(slug: string): ToolContent | undefined {
  return TOOL_CONTENT[slug];
}
