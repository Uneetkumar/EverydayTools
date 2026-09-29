/**
 * Hashing text and files in the browser, and checking a hash someone
 * published against the one worked out here.
 *
 * Uses hash-wasm, which hashes incrementally: a file is read in chunks, so a
 * multi-gigabyte download can be checked without holding it in memory (the
 * browser's own crypto.subtle.digest needs the whole file at once and has no
 * MD5, SHA-3 or CRC32).
 */

import type { IHasher } from "hash-wasm";

export type Algo = "md5" | "sha1" | "sha256" | "sha384" | "sha512" | "sha3-256" | "sha3-512" | "crc32";

export interface AlgoInfo {
  id: Algo;
  label: string;
  bits: number;
  /** Safe against deliberate tampering today. */
  secure: boolean;
}

export const ALGOS: AlgoInfo[] = [
  { id: "md5", label: "MD5", bits: 128, secure: false },
  { id: "sha1", label: "SHA-1", bits: 160, secure: false },
  { id: "sha256", label: "SHA-256", bits: 256, secure: true },
  { id: "sha384", label: "SHA-384", bits: 384, secure: true },
  { id: "sha512", label: "SHA-512", bits: 512, secure: true },
  { id: "sha3-256", label: "SHA3-256", bits: 256, secure: true },
  { id: "sha3-512", label: "SHA3-512", bits: 512, secure: true },
  { id: "crc32", label: "CRC32", bits: 32, secure: false },
];

export const ALGO_BY_ID = Object.fromEntries(ALGOS.map((a) => [a.id, a])) as Record<Algo, AlgoInfo>;

async function baseHasher(algo: Algo): Promise<IHasher> {
  const w = await import("hash-wasm");
  switch (algo) {
    case "md5":
      return w.createMD5();
    case "sha1":
      return w.createSHA1();
    case "sha256":
      return w.createSHA256();
    case "sha384":
      return w.createSHA384();
    case "sha512":
      return w.createSHA512();
    case "sha3-256":
      return w.createSHA3(256);
    case "sha3-512":
      return w.createSHA3(512);
    case "crc32":
      return w.createCRC32();
  }
}

async function hasher(algo: Algo, hmacKey: Uint8Array | null): Promise<IHasher> {
  if (!hmacKey) return (await baseHasher(algo)).init();
  const w = await import("hash-wasm");
  return (await w.createHMAC(baseHasher(algo), hmacKey)).init();
}

export type Digests = Partial<Record<Algo, Uint8Array>>;

/** CRC32 is a checksum, not a keyed hash, so it has no HMAC form. */
export const hmacCapable = (a: Algo) => a !== "crc32";

export async function hashBytes(data: Uint8Array, algos: Algo[], hmacKey: Uint8Array | null = null): Promise<Digests> {
  const out: Digests = {};
  for (const a of algos) {
    if (hmacKey && !hmacCapable(a)) continue;
    out[a] = (await hasher(a, hmacKey)).update(data).digest("binary");
  }
  return out;
}

const CHUNK = 4 * 1024 * 1024;

/**
 * Hashes a file with every algorithm in one pass, reading 4 MB at a time.
 * `onProgress` gets the fraction done; `isCancelled` is checked between
 * chunks.
 */
export async function hashFile(
  file: Blob,
  algos: Algo[],
  hmacKey: Uint8Array | null,
  onProgress: (fraction: number) => void,
  isCancelled: () => boolean
): Promise<Digests | null> {
  const use = algos.filter((a) => !hmacKey || hmacCapable(a));
  const hashers = await Promise.all(use.map((a) => hasher(a, hmacKey)));
  for (let offset = 0; offset < file.size; offset += CHUNK) {
    if (isCancelled()) return null;
    const chunk = new Uint8Array(await file.slice(offset, offset + CHUNK).arrayBuffer());
    for (const h of hashers) h.update(chunk);
    onProgress(Math.min(1, (offset + chunk.length) / file.size));
  }
  if (isCancelled()) return null;
  const out: Digests = {};
  use.forEach((a, i) => (out[a] = hashers[i].digest("binary")));
  onProgress(1);
  return out;
}

export type OutputFormat = "hex" | "HEX" | "base64";

export function toHex(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += b.toString(16).padStart(2, "0");
  return s;
}

export function toBase64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export function formatDigest(bytes: Uint8Array, format: OutputFormat): string {
  if (format === "base64") return toBase64(bytes);
  const hex = toHex(bytes);
  return format === "HEX" ? hex.toUpperCase() : hex;
}

export interface Expected {
  bytes: Uint8Array;
  /** Algorithms whose output has this length. */
  candidates: Algo[];
  /** Algorithm named in the pasted text, such as "sha256:" or "sha384-". */
  named?: Algo;
}

const NAMES: Record<string, Algo> = {
  md5: "md5",
  sha1: "sha1",
  "sha-1": "sha1",
  sha256: "sha256",
  "sha-256": "sha256",
  sha384: "sha384",
  "sha-384": "sha384",
  sha512: "sha512",
  "sha-512": "sha512",
  "sha3-256": "sha3-256",
  "sha3-512": "sha3-512",
  crc32: "crc32",
};

function fromBase64(s: string): Uint8Array | null {
  try {
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

/**
 * Reads a hash as it is usually published: plain hex in either case, with
 * spaces or colons, "sha256:…", sha256sum's "hash  file" line, BSD's
 * "SHA256 (file) = hash", or a Subresource Integrity value "sha384-base64".
 */
export function readExpected(input: string): Expected | { error: string } | null {
  let t = input.trim();
  if (!t) return null;
  let named: Algo | undefined;

  const bsd = /^([A-Za-z0-9-]+)\s*\(.*\)\s*=\s*([A-Za-z0-9+/=_-]+)$/.exec(t);
  if (bsd) {
    named = NAMES[bsd[1].toLowerCase()];
    t = bsd[2];
  }
  const sri = /^(sha256|sha384|sha512)-([A-Za-z0-9+/=_-]+)$/i.exec(t);
  if (sri) {
    const bytes = fromBase64(sri[2]);
    if (!bytes) return { error: "That integrity value isn't valid Base64." };
    const algo = sri[1].toLowerCase() as Algo;
    return { bytes, candidates: candidatesFor(bytes.length), named: algo };
  }
  const prefixed = /^([A-Za-z0-9-]+)[:=]\s*(.+)$/.exec(t);
  if (prefixed && NAMES[prefixed[1].toLowerCase()]) {
    named = NAMES[prefixed[1].toLowerCase()];
    t = prefixed[2].trim();
  }
  // sha256sum / md5sum output: "hash  filename" (or "hash *filename") —
  // unless the whole thing is hex split into groups.
  const grouped = t.replace(/^0x/i, "").replace(/[\s:]/g, "");
  const sum = /^([0-9a-fA-F]{8,128})\s+\*?(.+)$/.exec(t);
  if (sum && !(/^[0-9a-fA-F]+$/.test(grouped) && candidatesFor(grouped.length / 2).length)) t = sum[1];

  const hex = t.replace(/^0x/i, "").replace(/[\s:]/g, "");
  if (/^[0-9a-fA-F]+$/.test(hex) && hex.length % 2 === 0 && candidatesFor(hex.length / 2).length) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    return { bytes, candidates: candidatesFor(bytes.length), named };
  }
  if (/^[A-Za-z0-9+/_-]+={0,2}$/.test(t)) {
    const bytes = fromBase64(t);
    if (bytes && candidatesFor(bytes.length).length) return { bytes, candidates: candidatesFor(bytes.length), named };
  }
  return { error: "That doesn't look like a hash. Paste the hex or Base64 value exactly as published." };
}

export function candidatesFor(byteLength: number): Algo[] {
  return ALGOS.filter((a) => a.bits / 8 === byteLength).map((a) => a.id);
}

export function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** The algorithm whose digest equals the expected value, if any. */
export function findMatch(digests: Digests, expected: Expected): Algo | null {
  for (const [algo, bytes] of Object.entries(digests) as [Algo, Uint8Array][]) {
    if (sameBytes(bytes, expected.bytes)) return algo;
  }
  return null;
}

export function utf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}
