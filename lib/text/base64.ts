/**
 * Base64 for text and files: standard and URL-safe alphabets, MIME line
 * wrapping, data: URIs, and recognising what decoded bytes are.
 */

export function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  // In slices: String.fromCharCode with a very long argument list overflows the stack.
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
  }
  return btoa(bin);
}

export interface EncodeOptions {
  urlSafe?: boolean;
  /** Break lines every 76 characters, as MIME email does. */
  wrap?: boolean;
}

export function encodeBase64(bytes: Uint8Array, o: EncodeOptions = {}): string {
  let s = bytesToBase64(bytes);
  if (o.urlSafe) s = s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  if (o.wrap) s = s.replace(/(.{76})(?=.)/g, "$1\n");
  return s;
}

export interface Decoded {
  bytes: Uint8Array;
  /** Media type given by a data: URI. */
  mime?: string;
  urlSafe: boolean;
}

/**
 * Decodes Base64 in either alphabet, with or without padding and line
 * breaks, or a whole data: URI.
 */
export function decodeBase64(input: string): Decoded | { error: string } {
  let t = input.trim();
  let mime: string | undefined;
  const data = /^data:([^;,]*)(;[^,]*)?,/i.exec(t);
  if (data) {
    if (!/;base64/i.test(data[2] ?? "")) return { error: "This data: URI isn't Base64 (it has no ;base64). Its text is already readable." };
    mime = data[1] || "text/plain";
    t = t.slice(data[0].length);
  }
  t = t.replace(/\s+/g, "");
  const badAt = t.search(/[^A-Za-z0-9+/\-_=]/);
  if (badAt >= 0) {
    return { error: `“${t[badAt]}” at position ${badAt + 1} isn't a Base64 character. Base64 uses only letters, digits, + / (or - _) and = at the end.` };
  }
  const pad = t.indexOf("=");
  if (pad >= 0 && !/^=+$/.test(t.slice(pad))) return { error: "= can only appear at the very end, as padding." };
  const urlSafe = /[-_]/.test(t);
  if (urlSafe && /[+/]/.test(t)) return { error: "This mixes the standard (+ /) and URL-safe (- _) alphabets, so it's probably damaged." };
  let b64 = t.replace(/=+$/, "").replace(/-/g, "+").replace(/_/g, "/");
  if (b64.length % 4 === 1) return { error: "The length doesn't work out — a character is missing or extra. Check that the whole value was copied." };
  while (b64.length % 4) b64 += "=";
  let bin: string;
  try {
    bin = atob(b64);
  } catch {
    return { error: "This isn't valid Base64." };
  }
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { bytes, mime, urlSafe };
}

/** Reads bytes as UTF-8 text, or null if they aren't text. */
export function asText(bytes: Uint8Array): string | null {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
  // Control characters other than tab and line breaks mean binary data.
  const control = text.match(/[\u0000-\u0008\u000E-\u001F\u007F]/g);
  if (control && control.length > Math.max(1, text.length / 100)) return null;
  return text;
}

export interface FileKind {
  mime: string;
  label: string;
  ext: string;
}

const starts = (b: Uint8Array, sig: number[], at = 0) => sig.every((v, i) => b[at + i] === v);

/** Recognises common file types from their first bytes. */
export function sniff(b: Uint8Array): FileKind | null {
  if (starts(b, [0x89, 0x50, 0x4e, 0x47])) return { mime: "image/png", label: "PNG image", ext: "png" };
  if (starts(b, [0xff, 0xd8, 0xff])) return { mime: "image/jpeg", label: "JPEG image", ext: "jpg" };
  if (starts(b, [0x47, 0x49, 0x46, 0x38])) return { mime: "image/gif", label: "GIF image", ext: "gif" };
  if (starts(b, [0x52, 0x49, 0x46, 0x46]) && starts(b, [0x57, 0x45, 0x42, 0x50], 8)) return { mime: "image/webp", label: "WebP image", ext: "webp" };
  if (starts(b, [0x00, 0x00, 0x01, 0x00])) return { mime: "image/x-icon", label: "Icon", ext: "ico" };
  if (starts(b, [0x42, 0x4d])) return { mime: "image/bmp", label: "BMP image", ext: "bmp" };
  if (starts(b, [0x66, 0x74, 0x79, 0x70], 4)) {
    const brand = String.fromCharCode(...b.slice(8, 12));
    if (/^(avif|avis)/.test(brand)) return { mime: "image/avif", label: "AVIF image", ext: "avif" };
    if (/^(heic|heix|mif1)/.test(brand)) return { mime: "image/heic", label: "HEIC image", ext: "heic" };
    return { mime: "video/mp4", label: "MP4 video", ext: "mp4" };
  }
  if (starts(b, [0x25, 0x50, 0x44, 0x46])) return { mime: "application/pdf", label: "PDF document", ext: "pdf" };
  if (starts(b, [0x50, 0x4b, 0x03, 0x04])) return { mime: "application/zip", label: "ZIP archive (or DOCX, XLSX)", ext: "zip" };
  if (starts(b, [0x1f, 0x8b])) return { mime: "application/gzip", label: "Gzip archive", ext: "gz" };
  if (starts(b, [0x49, 0x44, 0x33]) || starts(b, [0xff, 0xfb])) return { mime: "audio/mpeg", label: "MP3 audio", ext: "mp3" };
  if (starts(b, [0x4f, 0x67, 0x67, 0x53])) return { mime: "audio/ogg", label: "Ogg audio", ext: "ogg" };
  if (starts(b, [0x1a, 0x45, 0xdf, 0xa3])) return { mime: "video/webm", label: "WebM video", ext: "webm" };
  if (starts(b, [0x77, 0x4f, 0x46, 0x32])) return { mime: "font/woff2", label: "WOFF2 font", ext: "woff2" };
  if (starts(b, [0x77, 0x4f, 0x46, 0x46])) return { mime: "font/woff", label: "WOFF font", ext: "woff" };
  if (starts(b, [0x00, 0x61, 0x73, 0x6d])) return { mime: "application/wasm", label: "WebAssembly module", ext: "wasm" };
  const head = new TextDecoder().decode(b.slice(0, 512)).trimStart();
  if (/^(<\?xml[^>]*>\s*)?<svg[\s>]/i.test(head)) return { mime: "image/svg+xml", label: "SVG image", ext: "svg" };
  return null;
}

export function isImage(mime: string | undefined): boolean {
  return !!mime && /^image\/(png|jpeg|gif|webp|avif|bmp|x-icon|svg\+xml)$/.test(mime);
}
