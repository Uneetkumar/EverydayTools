/**
 * MIME types (media types) for the MIME Type Lookup and Content-Type Lookup
 * tools: an extension ⇄ type database, file-signature detection ("magic
 * numbers") that reads the first bytes of a file, a Content-Type header
 * parser and a list of what to send for common jobs. Types follow the IANA
 * registry; where the registry has no entry the widely used x- form is given.
 */

export type MimeCategory =
  | "Text"
  | "Code"
  | "Image"
  | "Audio"
  | "Video"
  | "Font"
  | "Archive"
  | "Document"
  | "Data"
  | "Application"
  | "3D model";

export interface MimeEntry {
  ext: string;
  type: string;
  description: string;
  category: MimeCategory;
  /** Not in the IANA registry (x- prefix or de-facto). */
  unregistered?: boolean;
  /** Also valid extensions or aliases for this exact type. */
  also?: string[];
}

type Row = [ext: string, type: string, description: string, category: MimeCategory, flag?: "x"];

/** ext, type, description, category, "x" = not registered. */
const ROWS: Row[] = [
  // Text & markup
  ["html", "text/html", "HTML document", "Text"],
  ["htm", "text/html", "HTML document", "Text"],
  ["css", "text/css", "Cascading style sheet", "Code"],
  ["js", "text/javascript", "JavaScript (RFC 9239)", "Code"],
  ["mjs", "text/javascript", "JavaScript module", "Code"],
  ["cjs", "text/javascript", "CommonJS module", "Code"],
  ["jsx", "text/jsx", "React JSX source", "Code", "x"],
  ["ts", "video/mp2t", "MPEG transport stream (and TypeScript, which has no registered type)", "Video"],
  ["tsx", "text/tsx", "TypeScript with JSX", "Code", "x"],
  ["json", "application/json", "JSON data", "Data"],
  ["jsonld", "application/ld+json", "JSON-LD linked data", "Data"],
  ["map", "application/json", "Source map", "Data"],
  ["webmanifest", "application/manifest+json", "Web app manifest", "Data"],
  ["geojson", "application/geo+json", "GeoJSON geographic data", "Data"],
  ["xml", "application/xml", "XML document", "Data"],
  ["xsl", "application/xslt+xml", "XSLT stylesheet", "Data"],
  ["xhtml", "application/xhtml+xml", "XHTML document", "Text"],
  ["rss", "application/rss+xml", "RSS feed", "Data"],
  ["atom", "application/atom+xml", "Atom feed", "Data"],
  ["svg", "image/svg+xml", "Scalable Vector Graphics", "Image"],
  ["txt", "text/plain", "Plain text", "Text"],
  ["text", "text/plain", "Plain text", "Text"],
  ["log", "text/plain", "Log file", "Text"],
  ["md", "text/markdown", "Markdown", "Text"],
  ["markdown", "text/markdown", "Markdown", "Text"],
  ["csv", "text/csv", "Comma-separated values", "Data"],
  ["tsv", "text/tab-separated-values", "Tab-separated values", "Data"],
  ["ics", "text/calendar", "iCalendar event", "Data"],
  ["vcf", "text/vcard", "vCard contact", "Data"],
  ["rtf", "application/rtf", "Rich Text Format", "Document"],
  ["yaml", "application/yaml", "YAML (RFC 9512)", "Data"],
  ["yml", "application/yaml", "YAML (RFC 9512)", "Data"],
  ["toml", "application/toml", "TOML configuration", "Data"],
  ["ini", "text/plain", "INI configuration", "Data"],
  ["sql", "application/sql", "SQL script", "Code"],
  ["sh", "application/x-sh", "Shell script", "Code", "x"],
  ["py", "text/x-python", "Python source", "Code", "x"],
  ["java", "text/x-java-source", "Java source", "Code", "x"],
  ["c", "text/x-c", "C source", "Code", "x"],
  ["cpp", "text/x-c++src", "C++ source", "Code", "x"],
  ["h", "text/x-chdr", "C header", "Code", "x"],
  ["go", "text/x-go", "Go source", "Code", "x"],
  ["rs", "text/rust", "Rust source", "Code", "x"],
  ["php", "application/x-httpd-php", "PHP script", "Code", "x"],
  ["rb", "application/x-ruby", "Ruby script", "Code", "x"],
  ["swift", "text/x-swift", "Swift source", "Code", "x"],
  ["kt", "text/x-kotlin", "Kotlin source", "Code", "x"],
  ["wasm", "application/wasm", "WebAssembly module", "Application"],
  ["vtt", "text/vtt", "WebVTT captions", "Text"],
  ["srt", "application/x-subrip", "SubRip subtitles", "Text", "x"],

  // Images
  ["png", "image/png", "PNG image", "Image"],
  ["jpg", "image/jpeg", "JPEG image", "Image"],
  ["jpeg", "image/jpeg", "JPEG image", "Image"],
  ["jfif", "image/jpeg", "JPEG image", "Image"],
  ["gif", "image/gif", "GIF image", "Image"],
  ["webp", "image/webp", "WebP image", "Image"],
  ["avif", "image/avif", "AVIF image", "Image"],
  ["apng", "image/apng", "Animated PNG", "Image"],
  ["bmp", "image/bmp", "Bitmap image", "Image"],
  ["ico", "image/vnd.microsoft.icon", "Windows icon (browsers also accept image/x-icon)", "Image"],
  ["cur", "image/x-icon", "Windows cursor", "Image", "x"],
  ["tif", "image/tiff", "TIFF image", "Image"],
  ["tiff", "image/tiff", "TIFF image", "Image"],
  ["heic", "image/heic", "HEIC image (iPhone photos)", "Image"],
  ["heif", "image/heif", "HEIF image", "Image"],
  ["jxl", "image/jxl", "JPEG XL image", "Image"],
  ["psd", "image/vnd.adobe.photoshop", "Photoshop document", "Image"],
  ["ai", "application/postscript", "Adobe Illustrator / PostScript", "Image"],
  ["eps", "application/postscript", "Encapsulated PostScript", "Image"],
  ["dng", "image/x-adobe-dng", "Adobe DNG raw photo", "Image", "x"],
  ["cr2", "image/x-canon-cr2", "Canon raw photo", "Image", "x"],
  ["nef", "image/x-nikon-nef", "Nikon raw photo", "Image", "x"],

  // Audio
  ["mp3", "audio/mpeg", "MP3 audio", "Audio"],
  ["wav", "audio/wav", "WAV audio (also audio/x-wav, audio/vnd.wave)", "Audio"],
  ["ogg", "audio/ogg", "Ogg audio", "Audio"],
  ["oga", "audio/ogg", "Ogg audio", "Audio"],
  ["opus", "audio/opus", "Opus audio", "Audio"],
  ["flac", "audio/flac", "FLAC lossless audio", "Audio"],
  ["aac", "audio/aac", "AAC audio", "Audio"],
  ["m4a", "audio/mp4", "MPEG-4 audio", "Audio"],
  ["weba", "audio/webm", "WebM audio", "Audio"],
  ["mid", "audio/midi", "MIDI music", "Audio"],
  ["midi", "audio/midi", "MIDI music", "Audio"],
  ["aiff", "audio/aiff", "AIFF audio", "Audio"],
  ["m3u", "audio/x-mpegurl", "Playlist", "Audio", "x"],
  ["m3u8", "application/vnd.apple.mpegurl", "HLS playlist", "Video"],

  // Video
  ["mp4", "video/mp4", "MPEG-4 video", "Video"],
  ["m4v", "video/x-m4v", "iTunes video", "Video", "x"],
  ["webm", "video/webm", "WebM video", "Video"],
  ["ogv", "video/ogg", "Ogg video", "Video"],
  ["mov", "video/quicktime", "QuickTime movie", "Video"],
  ["avi", "video/x-msvideo", "AVI video", "Video", "x"],
  ["mkv", "video/x-matroska", "Matroska video", "Video", "x"],
  ["wmv", "video/x-ms-wmv", "Windows Media video", "Video", "x"],
  ["flv", "video/x-flv", "Flash video", "Video", "x"],
  ["mpeg", "video/mpeg", "MPEG video", "Video"],
  ["mpg", "video/mpeg", "MPEG video", "Video"],
  ["3gp", "video/3gpp", "3GPP mobile video", "Video"],
  ["3g2", "video/3gpp2", "3GPP2 mobile video", "Video"],

  // Fonts
  ["woff", "font/woff", "Web Open Font Format", "Font"],
  ["woff2", "font/woff2", "Web Open Font Format 2", "Font"],
  ["ttf", "font/ttf", "TrueType font", "Font"],
  ["otf", "font/otf", "OpenType font", "Font"],
  ["eot", "application/vnd.ms-fontobject", "Embedded OpenType font", "Font"],

  // Documents
  ["pdf", "application/pdf", "PDF document", "Document"],
  ["doc", "application/msword", "Word 97–2003 document", "Document"],
  ["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Word document", "Document"],
  ["dotx", "application/vnd.openxmlformats-officedocument.wordprocessingml.template", "Word template", "Document"],
  ["xls", "application/vnd.ms-excel", "Excel 97–2003 workbook", "Document"],
  ["xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Excel workbook", "Document"],
  ["xlsm", "application/vnd.ms-excel.sheet.macroEnabled.12", "Excel workbook with macros", "Document"],
  ["ppt", "application/vnd.ms-powerpoint", "PowerPoint 97–2003 presentation", "Document"],
  ["pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "PowerPoint presentation", "Document"],
  ["odt", "application/vnd.oasis.opendocument.text", "OpenDocument text", "Document"],
  ["ods", "application/vnd.oasis.opendocument.spreadsheet", "OpenDocument spreadsheet", "Document"],
  ["odp", "application/vnd.oasis.opendocument.presentation", "OpenDocument presentation", "Document"],
  ["epub", "application/epub+zip", "EPUB e-book", "Document"],
  ["mobi", "application/x-mobipocket-ebook", "Kindle e-book (Mobipocket)", "Document", "x"],
  ["pages", "application/vnd.apple.pages", "Apple Pages document", "Document"],
  ["numbers", "application/vnd.apple.numbers", "Apple Numbers spreadsheet", "Document"],
  ["key", "application/vnd.apple.keynote", "Apple Keynote presentation", "Document"],
  ["xps", "application/vnd.ms-xpsdocument", "XPS document", "Document"],

  // Archives
  ["zip", "application/zip", "ZIP archive", "Archive"],
  ["gz", "application/gzip", "Gzip compressed file", "Archive"],
  ["tgz", "application/gzip", "Gzipped tar archive", "Archive"],
  ["tar", "application/x-tar", "Tape archive", "Archive", "x"],
  ["bz2", "application/x-bzip2", "Bzip2 compressed file", "Archive", "x"],
  ["xz", "application/x-xz", "XZ compressed file", "Archive", "x"],
  ["zst", "application/zstd", "Zstandard compressed file", "Archive"],
  ["7z", "application/x-7z-compressed", "7-Zip archive", "Archive", "x"],
  ["rar", "application/vnd.rar", "RAR archive", "Archive"],
  ["jar", "application/java-archive", "Java archive", "Archive"],
  ["war", "application/java-archive", "Java web archive", "Archive"],
  ["apk", "application/vnd.android.package-archive", "Android app package", "Archive"],
  ["ipa", "application/octet-stream", "iOS app package", "Archive"],
  ["dmg", "application/x-apple-diskimage", "macOS disk image", "Archive", "x"],
  ["iso", "application/x-iso9660-image", "Disc image", "Archive", "x"],
  ["deb", "application/vnd.debian.binary-package", "Debian package", "Archive"],
  ["rpm", "application/x-rpm", "RPM package", "Archive", "x"],
  ["msi", "application/x-msi", "Windows installer", "Archive", "x"],
  ["exe", "application/vnd.microsoft.portable-executable", "Windows executable", "Application"],
  ["dll", "application/vnd.microsoft.portable-executable", "Windows library", "Application"],
  ["bin", "application/octet-stream", "Binary data", "Application"],
  ["so", "application/octet-stream", "Shared library", "Application"],

  // Data & other application types
  ["sqlite", "application/vnd.sqlite3", "SQLite database", "Data"],
  ["db", "application/vnd.sqlite3", "SQLite database (typical)", "Data"],
  ["proto", "text/x-protobuf", "Protocol Buffers definition", "Data", "x"],
  ["pb", "application/x-protobuf", "Protocol Buffers message", "Data", "x"],
  ["parquet", "application/vnd.apache.parquet", "Apache Parquet", "Data"],
  ["avro", "application/avro", "Apache Avro", "Data", "x"],
  ["ndjson", "application/x-ndjson", "Newline-delimited JSON", "Data", "x"],
  ["jsonl", "application/jsonl", "JSON Lines", "Data", "x"],
  ["graphql", "application/graphql", "GraphQL query", "Data", "x"],
  ["gql", "application/graphql", "GraphQL query", "Data", "x"],
  ["pem", "application/x-pem-file", "PEM certificate or key", "Data", "x"],
  ["crt", "application/x-x509-ca-cert", "X.509 certificate", "Data", "x"],
  ["cer", "application/pkix-cert", "PKIX certificate", "Data"],
  ["p12", "application/x-pkcs12", "PKCS#12 key store", "Data", "x"],
  ["ttl", "text/turtle", "Turtle RDF", "Data"],
  ["kml", "application/vnd.google-earth.kml+xml", "Google Earth KML", "Data"],
  ["gpx", "application/gpx+xml", "GPS track", "Data"],
  ["torrent", "application/x-bittorrent", "BitTorrent metadata", "Data", "x"],
  ["swf", "application/x-shockwave-flash", "Flash movie (obsolete)", "Application", "x"],
  ["ps", "application/postscript", "PostScript", "Document"],
  ["ics", "text/calendar", "iCalendar event", "Data"],

  // 3D
  ["glb", "model/gltf-binary", "glTF binary 3D model", "3D model"],
  ["gltf", "model/gltf+json", "glTF 3D model", "3D model"],
  ["obj", "model/obj", "Wavefront OBJ 3D model", "3D model"],
  ["stl", "model/stl", "STL 3D model", "3D model"],
  ["usdz", "model/vnd.usdz+zip", "Apple USDZ AR model", "3D model"],
];

export const MIME_ENTRIES: MimeEntry[] = ROWS.map(([ext, type, description, category, flag]) => ({ ext, type, description, category, unregistered: flag === "x" }));

const BY_EXT = new Map<string, MimeEntry>();
for (const e of MIME_ENTRIES) if (!BY_EXT.has(e.ext)) BY_EXT.set(e.ext, e);
// A ".ts" file is far more likely TypeScript than a video stream; look-ups show both readings.
export function lookupExtension(extOrName: string): MimeEntry[] {
  const ext = extOrName.trim().toLowerCase().replace(/^.*\./, "").replace(/^\./, "");
  if (!ext) return [];
  const all = MIME_ENTRIES.filter((e) => e.ext === ext);
  if (ext === "ts") all.push({ ext: "ts", type: "text/typescript", description: "TypeScript source (not registered; servers usually send video/mp2t or text/plain)", category: "Code", unregistered: true });
  return all;
}

/** All extensions for a media type, exact match (parameters ignored). */
export function lookupType(type: string): MimeEntry[] {
  const t = type.trim().toLowerCase().split(";")[0].trim();
  if (!t) return [];
  if (t.endsWith("/*")) return MIME_ENTRIES.filter((e) => e.type.startsWith(t.slice(0, -1)));
  return MIME_ENTRIES.filter((e) => e.type === t);
}

export function searchMime(query: string): MimeEntry[] {
  const q = query.trim().toLowerCase().replace(/^\./, "");
  if (!q) return MIME_ENTRIES;
  const exactExt = MIME_ENTRIES.filter((e) => e.ext === q);
  const exactType = MIME_ENTRIES.filter((e) => e.type === q && e.ext !== q);
  const rest = MIME_ENTRIES.filter((e) => e.ext !== q && e.type !== q && (e.ext.startsWith(q) || e.type.includes(q) || e.description.toLowerCase().includes(q) || e.category.toLowerCase() === q));
  return [...exactExt, ...exactType, ...rest];
}

/** Types whose bodies compress well, so a server should enable gzip/brotli for them. */
export function isCompressible(type: string): boolean {
  const t = type.toLowerCase().split(";")[0].trim();
  return (
    t.startsWith("text/") ||
    /(?:^|[+/-])(json|xml|javascript|yaml|toml|csv|sql|graphql|wasm|svg|x-ndjson|jsonl|ld\+json|manifest\+json)$/.test(t) ||
    t === "image/svg+xml" ||
    t === "application/wasm" ||
    t === "font/ttf" ||
    t === "font/otf" ||
    t === "application/vnd.ms-fontobject" ||
    t === "image/bmp" ||
    t === "image/vnd.microsoft.icon" ||
    t === "application/x-tar" ||
    t === "application/rtf" ||
    t === "application/postscript" ||
    t === "application/x-sh"
  );
}

/* ---------------------------------------------------------- content-type */

export interface ParsedContentType {
  ok: boolean;
  type: string;
  subtype: string;
  /** "json" in application/vnd.api+json. */
  suffix?: string;
  tree: "standard" | "vendor" | "personal" | "unregistered";
  params: { name: string; value: string }[];
  issues: { level: "error" | "warning" | "info"; text: string }[];
}

const TOKEN = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
const TOP_LEVEL = ["application", "audio", "font", "haptics", "image", "message", "model", "multipart", "text", "video"];

export function parseContentType(value: string): ParsedContentType {
  const issues: ParsedContentType["issues"] = [];
  const parts = splitParams(value.trim());
  const main = parts.shift() ?? "";
  const slash = main.indexOf("/");
  const type = (slash === -1 ? main : main.slice(0, slash)).trim().toLowerCase();
  const subFull = (slash === -1 ? "" : main.slice(slash + 1)).trim().toLowerCase();
  const plus = subFull.lastIndexOf("+");
  const suffix = plus > 0 ? subFull.slice(plus + 1) : undefined;
  const params = parts.map((p) => {
    const eq = p.indexOf("=");
    return eq === -1 ? { name: p.trim().toLowerCase(), value: "" } : { name: p.slice(0, eq).trim().toLowerCase(), value: p.slice(eq + 1).trim().replace(/^"(.*)"$/, "$1") };
  });
  let ok = true;
  const bad = (t: string) => {
    ok = false;
    issues.push({ level: "error", text: t });
  };

  if (slash === -1 || !type || !subFull) bad("A media type needs the form type/subtype, for example text/html.");
  else {
    if (!TOKEN.test(type) || !TOKEN.test(subFull)) bad("The type and subtype may only contain letters, digits and - . + _ ! # $ & ^ ` | ~ % ' *.");
    if (!TOP_LEVEL.includes(type) && !type.startsWith("x-")) issues.push({ level: "warning", text: `"${type}" is not a registered top-level type. The registered ones are ${TOP_LEVEL.join(", ")}.` });
    if (type.startsWith("x-") || subFull.startsWith("x-")) issues.push({ level: "info", text: "The x- prefix marks an unregistered type. RFC 6648 discourages new ones, but many existing types such as application/x-www-form-urlencoded are permanent." });
  }
  if (/[A-Z]/.test(value.split(";")[0])) issues.push({ level: "info", text: "Media types are case-insensitive; lower case is the convention." });
  const charset = params.find((p) => p.name === "charset");
  if (charset) {
    if (!/^utf-?8$/i.test(charset.value)) issues.push({ level: "info", text: `charset=${charset.value}: UTF-8 is the only encoding you should need for new content.` });
    if (type === "application" && (subFull === "json" || suffix === "json")) issues.push({ level: "info", text: "JSON is always UTF-8, so a charset parameter is redundant (RFC 8259)." });
    if (type !== "text" && !(type === "application" && /xml|json|javascript|x-www-form-urlencoded/.test(subFull))) issues.push({ level: "info", text: "charset only has a defined meaning on text/* types and a few XML and form types." });
  } else if (type === "text" && subFull !== "event-stream") issues.push({ level: "info", text: "Add charset=utf-8 so clients don't have to guess the text encoding." });
  if (type === "multipart" && !params.some((p) => p.name === "boundary")) {
    issues.push({ level: "error", text: "multipart types require a boundary parameter, such as boundary=----abc123." });
    ok = false;
  }
  if (type === "application" && subFull === "javascript") issues.push({ level: "warning", text: "application/javascript is obsolete; RFC 9239 defines text/javascript for all JavaScript." });
  if (type === "text" && subFull === "json") issues.push({ level: "warning", text: "text/json is not registered. Use application/json." });
  if (type === "application" && subFull === "x-json") issues.push({ level: "warning", text: "application/x-json is a legacy name. Use application/json." });
  if (type === "application" && subFull === "x-javascript") issues.push({ level: "warning", text: "application/x-javascript is legacy; use text/javascript." });
  if (type === "text" && subFull === "xml") issues.push({ level: "info", text: "text/xml and application/xml mean the same, but text/xml can override the encoding declared inside the XML. application/xml is safer." });
  if (type === "application" && subFull === "octet-stream") issues.push({ level: "info", text: "application/octet-stream means \"unknown binary data\". Browsers download it instead of displaying it; use a specific type if you know one." });
  if (type === "application" && subFull === "x-www-form-urlencoded" && !params.length) issues.push({ level: "info", text: "This is the default for HTML forms; the body is key=value pairs joined by & with percent-encoding." });

  const tree: ParsedContentType["tree"] = subFull.startsWith("vnd.") ? "vendor" : subFull.startsWith("prs.") ? "personal" : subFull.startsWith("x-") || type.startsWith("x-") ? "unregistered" : "standard";
  return { ok, type, subtype: subFull, suffix, tree, params, issues };
}

function splitParams(v: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (const ch of v) {
    if (ch === '"') quoted = !quoted;
    if (ch === ";" && !quoted) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim()).filter((s, i) => i === 0 || s !== "");
}

/* ------------------------------------------------------------------- scenarios */

export interface ContentTypeRecipe {
  id: string;
  label: string;
  /** Who sets the header. */
  direction: "request" | "response" | "both";
  value: string;
  note: string;
  group: "API" | "Web page" | "Files" | "Streaming & data";
}

export const CONTENT_TYPE_RECIPES: ContentTypeRecipe[] = [
  { id: "json", label: "JSON API request or response", direction: "both", value: "application/json", group: "API", note: "The default for REST APIs. No charset is needed; JSON is always UTF-8." },
  { id: "problem", label: "API error (Problem Details)", direction: "response", value: "application/problem+json", group: "API", note: "RFC 9457 standard shape for error responses: type, title, status, detail." },
  { id: "jsonapi", label: "JSON:API", direction: "both", value: "application/vnd.api+json", group: "API", note: "Required by the JSON:API specification. Do not add parameters." },
  { id: "merge-patch", label: "JSON Merge Patch (PATCH)", direction: "request", value: "application/merge-patch+json", group: "API", note: "RFC 7396. Send only the fields to change; null deletes a field." },
  { id: "json-patch", label: "JSON Patch (PATCH)", direction: "request", value: "application/json-patch+json", group: "API", note: "RFC 6902. The body is an array of operations such as add, replace and remove." },
  { id: "graphql", label: "GraphQL over HTTP", direction: "both", value: "application/json", group: "API", note: "POST {\"query\": \"…\"} as JSON. Servers may reply with application/graphql-response+json, the newer standard type." },
  { id: "form", label: "HTML form (simple fields)", direction: "request", value: "application/x-www-form-urlencoded", group: "API", note: "key=value&key2=value2 with percent-encoding. Browsers use it for forms without file inputs." },
  { id: "multipart", label: "File upload / mixed form", direction: "request", value: "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxk", group: "API", note: "Let the browser or HTTP library set this: it must contain the exact boundary used in the body. Never hard-code it." },
  { id: "xml", label: "XML", direction: "both", value: "application/xml", group: "API", note: "Preferred over text/xml, which lets a charset in the header override the one inside the XML." },
  { id: "soap", label: "SOAP", direction: "request", value: "application/soap+xml; charset=utf-8", group: "API", note: "SOAP 1.2. SOAP 1.1 uses text/xml plus a SOAPAction header." },
  { id: "grpc", label: "gRPC", direction: "both", value: "application/grpc", group: "API", note: "Add +proto or +json for the message format if you need to state it (application/grpc+proto)." },
  { id: "protobuf", label: "Protocol Buffers", direction: "both", value: "application/x-protobuf", group: "API", note: "Not registered; application/protobuf and application/vnd.google.protobuf are also seen. Pick one and document it." },
  { id: "html", label: "Web page", direction: "response", value: "text/html; charset=utf-8", group: "Web page", note: "Always include charset, or declare it with <meta charset=\"utf-8\"> in the first 1024 bytes." },
  { id: "css", label: "Stylesheet", direction: "response", value: "text/css; charset=utf-8", group: "Web page", note: "A wrong type on a stylesheet makes browsers ignore it in strict mode." },
  { id: "js", label: "JavaScript and ES modules", direction: "response", value: "text/javascript; charset=utf-8", group: "Web page", note: "Module scripts are refused unless they come with a JavaScript MIME type; this is a common cause of a blank page." },
  { id: "manifest", label: "Web app manifest", direction: "response", value: "application/manifest+json", group: "Web page", note: "Serve manifest.webmanifest with this type so the browser can install the app." },
  { id: "svg", label: "SVG image", direction: "response", value: "image/svg+xml", group: "Web page", note: "Without it SVGs used in <img> do not render. It must also be compressed: enable gzip/brotli." },
  { id: "wasm", label: "WebAssembly", direction: "response", value: "application/wasm", group: "Web page", note: "Required for streaming compilation (WebAssembly.instantiateStreaming)." },
  { id: "font", label: "Web font", direction: "response", value: "font/woff2", group: "Web page", note: "Use font/woff2, font/woff, font/ttf or font/otf. Add Access-Control-Allow-Origin if fonts load from another domain." },
  { id: "pdf", label: "PDF", direction: "response", value: "application/pdf", group: "Files", note: "Pair it with Content-Disposition: inline to show in the browser or attachment; filename=\"…\" to download." },
  { id: "download", label: "Unknown binary / force download", direction: "response", value: "application/octet-stream", group: "Files", note: "Tells the browser it cannot display the file. Add Content-Disposition: attachment to name the download." },
  { id: "zip", label: "ZIP archive", direction: "response", value: "application/zip", group: "Files", note: "Do not gzip it again: it is already compressed." },
  { id: "csv", label: "CSV export", direction: "response", value: "text/csv; charset=utf-8", group: "Files", note: "Excel guesses the encoding; a UTF-8 byte-order mark at the start of the file helps it show accented characters." },
  { id: "image", label: "Image", direction: "response", value: "image/webp", group: "Files", note: "Match the actual bytes: image/png, image/jpeg, image/webp or image/avif. Wrong types are ignored by browsers or treated as a security risk." },
  { id: "text", label: "Plain text", direction: "response", value: "text/plain; charset=utf-8", group: "Files", note: "Browsers show it as text, never render HTML in it." },
  { id: "sse", label: "Server-Sent Events", direction: "response", value: "text/event-stream", group: "Streaming & data", note: "Also send Cache-Control: no-cache and keep the connection open. Do not add a charset; UTF-8 is required." },
  { id: "ndjson", label: "Newline-delimited JSON", direction: "both", value: "application/x-ndjson", group: "Streaming & data", note: "One JSON object per line, ideal for streaming. Not registered; application/jsonl is a newer alias." },
  { id: "yaml", label: "YAML", direction: "both", value: "application/yaml", group: "Streaming & data", note: "Registered in RFC 9512. Older systems use text/yaml or application/x-yaml." },
  { id: "rss", label: "RSS / Atom feed", direction: "response", value: "application/rss+xml", group: "Streaming & data", note: "Use application/atom+xml for Atom feeds." },
  { id: "calendar", label: "Calendar invite", direction: "response", value: "text/calendar; charset=utf-8", group: "Streaming & data", note: "For .ics files and email invitations." },
  { id: "jwt", label: "JSON Web Token", direction: "both", value: "application/jwt", group: "Streaming & data", note: "Only when the body is the bare token. Tokens usually travel in the Authorization header." },
];

/* --------------------------------------------------------------- file sniffing */

export interface SniffResult {
  type: string;
  ext: string;
  description: string;
  /** How sure the signature makes us. */
  confidence: "certain" | "likely" | "guess";
}

const startsWith = (b: Uint8Array, sig: number[], at = 0) => sig.every((v, i) => b[at + i] === v);
const ascii = (b: Uint8Array, at: number, len: number) => String.fromCharCode(...b.slice(at, at + len));

/** Identifies a file from its first bytes. Extension-independent: a renamed file is still found out. */
export function sniffBytes(bytes: Uint8Array, name = ""): SniffResult | null {
  const b = bytes;
  const s = (type: string, ext: string, description: string, confidence: SniffResult["confidence"] = "certain"): SniffResult => ({ type, ext, description, confidence });
  if (b.length < 4) return null;
  if (startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return s("image/png", "png", "PNG image");
  if (startsWith(b, [0xff, 0xd8, 0xff])) return s("image/jpeg", "jpg", "JPEG image");
  if (ascii(b, 0, 6) === "GIF87a" || ascii(b, 0, 6) === "GIF89a") return s("image/gif", "gif", "GIF image");
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP") return s("image/webp", "webp", "WebP image");
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WAVE") return s("audio/wav", "wav", "WAV audio");
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "AVI ") return s("video/x-msvideo", "avi", "AVI video");
  if (ascii(b, 0, 2) === "BM" && b.length > 14) return s("image/bmp", "bmp", "Bitmap image", "likely");
  if (startsWith(b, [0x00, 0x00, 0x01, 0x00])) return s("image/vnd.microsoft.icon", "ico", "Windows icon");
  if (startsWith(b, [0x49, 0x49, 0x2a, 0x00]) || startsWith(b, [0x4d, 0x4d, 0x00, 0x2a])) return s("image/tiff", "tiff", "TIFF image");
  if (ascii(b, 0, 4) === "8BPS") return s("image/vnd.adobe.photoshop", "psd", "Photoshop document");
  if (ascii(b, 0, 5) === "%PDF-") return s("application/pdf", "pdf", "PDF document");
  if (ascii(b, 0, 4) === "%!PS") return s("application/postscript", "ps", "PostScript");
  if (ascii(b, 0, 5) === "{\\rtf") return s("application/rtf", "rtf", "Rich Text Format");
  if (startsWith(b, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return s("application/x-ole-storage", "doc", "Legacy Office file (Word/Excel/PowerPoint 97–2003)", "likely");
  if (startsWith(b, [0x50, 0x4b, 0x03, 0x04]) || startsWith(b, [0x50, 0x4b, 0x05, 0x06])) {
    const ext = name.toLowerCase().replace(/^.*\./, "");
    const map: Record<string, [string, string]> = {
      docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Word document"],
      xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Excel workbook"],
      pptx: ["application/vnd.openxmlformats-officedocument.presentationml.presentation", "PowerPoint presentation"],
      odt: ["application/vnd.oasis.opendocument.text", "OpenDocument text"],
      ods: ["application/vnd.oasis.opendocument.spreadsheet", "OpenDocument spreadsheet"],
      epub: ["application/epub+zip", "EPUB e-book"],
      jar: ["application/java-archive", "Java archive"],
      apk: ["application/vnd.android.package-archive", "Android package"],
    };
    if (map[ext]) return s(map[ext][0], ext, `${map[ext][1]} (a ZIP container)`, "likely");
    return s("application/zip", "zip", "ZIP archive (also the container for docx, xlsx, jar, apk…)", "likely");
  }
  if (startsWith(b, [0x1f, 0x8b])) return s("application/gzip", "gz", "Gzip compressed data");
  if (ascii(b, 0, 3) === "BZh") return s("application/x-bzip2", "bz2", "Bzip2 compressed data", "likely");
  if (startsWith(b, [0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00])) return s("application/x-xz", "xz", "XZ compressed data");
  if (startsWith(b, [0x28, 0xb5, 0x2f, 0xfd])) return s("application/zstd", "zst", "Zstandard compressed data");
  if (startsWith(b, [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c])) return s("application/x-7z-compressed", "7z", "7-Zip archive");
  if (ascii(b, 0, 6) === "Rar!\x1a\x07") return s("application/vnd.rar", "rar", "RAR archive");
  if (b.length > 262 && ascii(b, 257, 5) === "ustar") return s("application/x-tar", "tar", "Tar archive");
  if (ascii(b, 0, 16) === "SQLite format 3\0") return s("application/vnd.sqlite3", "sqlite", "SQLite database");
  if (startsWith(b, [0x00, 0x61, 0x73, 0x6d])) return s("application/wasm", "wasm", "WebAssembly module");
  if (startsWith(b, [0x7f, 0x45, 0x4c, 0x46])) return s("application/x-elf", "elf", "ELF executable (Linux)", "likely");
  if (ascii(b, 0, 2) === "MZ") return s("application/vnd.microsoft.portable-executable", "exe", "Windows executable", "likely");
  if (startsWith(b, [0xca, 0xfe, 0xba, 0xbe])) return s("application/java-vm", "class", "Java class file or macOS universal binary", "guess");
  if (startsWith(b, [0xcf, 0xfa, 0xed, 0xfe]) || startsWith(b, [0xce, 0xfa, 0xed, 0xfe])) return s("application/x-mach-binary", "macho", "macOS executable", "likely");
  if (ascii(b, 0, 3) === "ID3" || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0 && (b[1] & 0x06) !== 0)) return s("audio/mpeg", "mp3", "MP3 audio", b[0] === 0x49 ? "certain" : "likely");
  if (ascii(b, 0, 4) === "OggS") return s("audio/ogg", "ogg", "Ogg container (audio or video)", "likely");
  if (ascii(b, 0, 4) === "fLaC") return s("audio/flac", "flac", "FLAC audio");
  if (ascii(b, 0, 4) === "MThd") return s("audio/midi", "mid", "MIDI music");
  if (ascii(b, 0, 4) === "FORM" && ascii(b, 8, 4) === "AIFF") return s("audio/aiff", "aiff", "AIFF audio");
  if (startsWith(b, [0x1a, 0x45, 0xdf, 0xa3])) return s("video/webm", "webm", "Matroska or WebM video", "likely");
  if (ascii(b, 0, 3) === "FLV") return s("video/x-flv", "flv", "Flash video", "likely");
  if (ascii(b, 4, 4) === "ftyp") {
    const brand = ascii(b, 8, 4);
    if (/^(avif|avis)$/.test(brand)) return s("image/avif", "avif", "AVIF image");
    if (/^(heic|heix|hevc|hevx|mif1|msf1)$/.test(brand)) return s("image/heic", "heic", "HEIC/HEIF image");
    if (brand === "qt  ") return s("video/quicktime", "mov", "QuickTime movie");
    if (/^(M4A |M4B )/.test(brand)) return s("audio/mp4", "m4a", "MPEG-4 audio");
    if (/^3g/.test(brand)) return s("video/3gpp", "3gp", "3GPP video");
    return s("video/mp4", "mp4", `MPEG-4 file (brand “${brand.trim()}”)`);
  }
  if (ascii(b, 0, 4) === "wOFF") return s("font/woff", "woff", "WOFF font");
  if (ascii(b, 0, 4) === "wOF2") return s("font/woff2", "woff2", "WOFF2 font");
  if (ascii(b, 0, 4) === "OTTO") return s("font/otf", "otf", "OpenType font");
  if (startsWith(b, [0x00, 0x01, 0x00, 0x00, 0x00])) return s("font/ttf", "ttf", "TrueType font", "likely");
  if (ascii(b, 0, 4) === "glTF") return s("model/gltf-binary", "glb", "glTF binary model");
  // Text formats, by content.
  const head = new TextDecoder("utf-8", { fatal: false }).decode(b.slice(0, 512));
  const trimmed = head.replace(/^﻿/, "").trimStart();
  if (/^<\?xml/i.test(trimmed)) return /<svg[\s>]/i.test(head) ? s("image/svg+xml", "svg", "SVG image") : s("application/xml", "xml", "XML document", "likely");
  if (/^<svg[\s>]/i.test(trimmed)) return s("image/svg+xml", "svg", "SVG image");
  if (/^<!doctype html|^<html[\s>]/i.test(trimmed)) return s("text/html", "html", "HTML document");
  if (/^[[{]/.test(trimmed)) {
    try {
      JSON.parse(new TextDecoder().decode(b));
      return s("application/json", "json", "JSON data");
    } catch {
      return s("application/json", "json", "Looks like JSON (may be truncated or invalid)", "guess");
    }
  }
  if (/^BEGIN:VCALENDAR/i.test(trimmed)) return s("text/calendar", "ics", "iCalendar file");
  if (/^BEGIN:VCARD/i.test(trimmed)) return s("text/vcard", "vcf", "vCard contact");
  if (/^-----BEGIN [A-Z ]+-----/.test(trimmed)) return s("application/x-pem-file", "pem", "PEM-encoded key or certificate");
  // Plain text if it is readable.
  let controls = 0;
  const sample = b.slice(0, Math.min(b.length, 2048));
  for (const v of sample) if (v < 9 || (v > 13 && v < 32)) controls++;
  if (controls === 0 && sample.length > 0) return s("text/plain", "txt", "Plain text", "guess");
  return null;
}

/** Human-readable size for the dropped file. */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const units = ["KB", "MB", "GB"];
  let v = n;
  let u = -1;
  do {
    v /= 1024;
    u++;
  } while (v >= 1024 && u < units.length - 1);
  return `${v < 10 ? v.toFixed(1) : Math.round(v)} ${units[u]}`;
}
