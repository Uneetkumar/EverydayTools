/**
 * JSON Web Tokens: decoding, explaining the claims, and checking or making
 * signatures with the browser's Web Crypto API. Nothing leaves the page.
 *
 * Supported algorithms (RFC 7518, RFC 8037): HS256/384/512, RS256/384/512,
 * PS256/384/512, ES256/384/512 and EdDSA (Ed25519, in browsers that have it).
 */

export type Json = Record<string, unknown>;

export interface DecodedJwt {
  /** The three (or five, for JWE) dot-separated segments. */
  parts: string[];
  kind: "jws" | "jwe";
  header: Json;
  /** The payload as JSON, or null when it isn't JSON (or is encrypted). */
  payload: Json | null;
  payloadText: string;
  signature: Uint8Array;
}

// ── Base64URL ──────────────────────────────────────────────────────────────

export function b64urlDecode(s: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(s)) throw new Error("not base64url");
  let b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const utf8 = (s: string) => new TextEncoder().encode(s);
const fromUtf8 = (b: Uint8Array) => new TextDecoder().decode(b);

// ── Decoding ───────────────────────────────────────────────────────────────

/** Removes what often comes along when a token is copied: "Bearer ", quotes, line breaks. */
export function cleanToken(input: string): string {
  return input
    .trim()
    .replace(/^(authorization:\s*)?bearer\s+/i, "")
    .replace(/^["']|["']$/g, "")
    .replace(/\s+/g, "");
}

const PART_NAMES = ["header", "payload", "signature"];

export function decodeJwt(input: string): { jwt: DecodedJwt } | { error: string } {
  const token = cleanToken(input);
  const parts = token.split(".");
  if (parts.length !== 3 && parts.length !== 5) {
    return {
      error:
        parts.length === 2
          ? "This has two parts. A JWT has three — header, payload and signature — separated by dots; the last one may be missing from the copy."
          : `A JWT has three parts separated by dots (or five if it's encrypted); this has ${parts.length}.`,
    };
  }
  const bad = parts.findIndex((p, i) => !/^[A-Za-z0-9_-]*$/.test(p) && !(parts.length === 3 && i === 2 && p === ""));
  if (bad >= 0) {
    return { error: `The ${parts.length === 3 ? PART_NAMES[bad] : `part ${bad + 1}`} contains characters that aren't allowed in a JWT (only letters, digits, - and _).` };
  }

  let header: Json;
  try {
    const h = JSON.parse(fromUtf8(b64urlDecode(parts[0])));
    if (!h || typeof h !== "object" || Array.isArray(h)) throw new Error();
    header = h;
  } catch {
    return { error: "The header isn't valid JSON, so this isn't a JWT. Check that the whole token was copied." };
  }

  if (parts.length === 5) {
    return { jwt: { parts, kind: "jwe", header, payload: null, payloadText: "", signature: new Uint8Array() } };
  }

  let payloadText: string;
  try {
    payloadText = fromUtf8(b64urlDecode(parts[1]));
  } catch {
    return { error: "The payload isn't valid Base64URL. Check that the whole token was copied." };
  }
  let payload: Json | null = null;
  try {
    const p = JSON.parse(payloadText);
    if (p && typeof p === "object" && !Array.isArray(p)) payload = p;
  } catch {
    /* a JWS can carry any payload; show it as text */
  }
  let signature: Uint8Array;
  try {
    signature = b64urlDecode(parts[2]);
  } catch {
    return { error: "The signature isn't valid Base64URL." };
  }
  return { jwt: { parts, kind: "jws", header, payload, payloadText, signature } };
}

// ── Explaining ─────────────────────────────────────────────────────────────

export interface ClaimInfo {
  name: string;
  help: string;
  time?: boolean;
}

/** Registered claims (RFC 7519) and ones OpenID Connect, OAuth and Microsoft add. */
export const CLAIMS: Record<string, ClaimInfo> = {
  iss: { name: "Issuer", help: "Who created and signed the token." },
  sub: { name: "Subject", help: "Who the token is about — usually a user ID." },
  aud: { name: "Audience", help: "Who the token is for. An API should reject tokens meant for someone else." },
  exp: { name: "Expires", help: "After this moment the token must be rejected.", time: true },
  nbf: { name: "Not before", help: "Before this moment the token must be rejected.", time: true },
  iat: { name: "Issued at", help: "When the token was created.", time: true },
  jti: { name: "JWT ID", help: "A unique ID, so the same token can't be used twice." },
  auth_time: { name: "Signed in at", help: "When the user last actually signed in.", time: true },
  azp: { name: "Authorised party", help: "The app the token was issued to." },
  client_id: { name: "Client ID", help: "The app the token was issued to." },
  scope: { name: "Scope", help: "The permissions granted." },
  scp: { name: "Scope", help: "The permissions granted." },
  roles: { name: "Roles", help: "Roles the user has in the app." },
  groups: { name: "Groups", help: "Groups the user belongs to." },
  nonce: { name: "Nonce", help: "Ties the token to one sign-in request, to stop replays." },
  sid: { name: "Session ID", help: "The sign-in session the token belongs to." },
  acr: { name: "Assurance level", help: "How strongly the user was authenticated." },
  amr: { name: "Sign-in methods", help: "How the user signed in, such as pwd or mfa." },
  at_hash: { name: "Access token hash", help: "Links an ID token to the access token issued with it." },
  c_hash: { name: "Code hash", help: "Links an ID token to the authorisation code issued with it." },
  name: { name: "Name", help: "The user's full name." },
  given_name: { name: "First name", help: "" },
  family_name: { name: "Last name", help: "" },
  preferred_username: { name: "Username", help: "" },
  email: { name: "Email", help: "" },
  email_verified: { name: "Email verified", help: "Whether the provider has confirmed the email address." },
  phone_number: { name: "Phone", help: "" },
  picture: { name: "Picture", help: "Link to the user's profile picture." },
  locale: { name: "Locale", help: "" },
  updated_at: { name: "Profile updated", help: "", time: true },
  tid: { name: "Tenant ID", help: "The Microsoft Entra directory the user belongs to." },
  oid: { name: "Object ID", help: "The user's ID in Microsoft Entra." },
  cnf: { name: "Confirmation", help: "The key the holder must prove they have (proof-of-possession)." },
  act: { name: "Actor", help: "Who is acting on the subject's behalf." },
};

export const HEADER_FIELDS: Record<string, ClaimInfo> = {
  alg: { name: "Algorithm", help: "How the token is signed." },
  typ: { name: "Type", help: "Usually JWT." },
  kid: { name: "Key ID", help: "Which of the issuer's keys signed it — look it up in their JWKS." },
  cty: { name: "Content type", help: "Set when the payload is itself a token." },
  jku: { name: "Key set URL", help: "Where the signing keys are published. Only trust URLs you expect." },
  x5u: { name: "Certificate URL", help: "Where the signing certificate is published." },
  x5t: { name: "Certificate thumbprint", help: "SHA-1 fingerprint of the signing certificate." },
  "x5t#S256": { name: "Certificate thumbprint", help: "SHA-256 fingerprint of the signing certificate." },
  enc: { name: "Encryption", help: "How the payload is encrypted." },
  zip: { name: "Compression", help: "The payload was compressed before encryption." },
};

export const ALG_NAMES: Record<string, string> = {
  HS256: "HMAC with SHA-256",
  HS384: "HMAC with SHA-384",
  HS512: "HMAC with SHA-512",
  RS256: "RSA with SHA-256",
  RS384: "RSA with SHA-384",
  RS512: "RSA with SHA-512",
  PS256: "RSA-PSS with SHA-256",
  PS384: "RSA-PSS with SHA-384",
  PS512: "RSA-PSS with SHA-512",
  ES256: "ECDSA P-256 with SHA-256",
  ES384: "ECDSA P-384 with SHA-384",
  ES512: "ECDSA P-521 with SHA-512",
  EdDSA: "Ed25519",
  Ed25519: "Ed25519",
  none: "Not signed",
};

export type TimeState =
  | { state: "none" }
  | { state: "valid"; expiresIn: number | null }
  | { state: "expired"; ago: number }
  | { state: "not-yet"; startsIn: number };

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** Whether the token's exp and nbf allow it to be used at `now` (ms). */
export function timeState(payload: Json | null, now: number): TimeState {
  const exp = num(payload?.exp);
  const nbf = num(payload?.nbf);
  if (exp === null && nbf === null) return { state: "none" };
  if (nbf !== null && now < nbf * 1000) return { state: "not-yet", startsIn: nbf * 1000 - now };
  if (exp !== null && now >= exp * 1000) return { state: "expired", ago: now - exp * 1000 };
  return { state: "valid", expiresIn: exp === null ? null : exp * 1000 - now };
}

/** "2 h 5 min", "3 days" — for lifetimes and countdowns. */
export function duration(ms: number): string {
  const s = Math.round(Math.abs(ms) / 1000);
  if (s < 60) return `${s} s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 48) return m % 60 ? `${h} h ${m % 60} min` : `${h} h`;
  const d = Math.round(h / 24);
  if (d < 90) return `${d} days`;
  if (d < 730) return `${Math.round(d / 30.44)} months`;
  return `${Math.round(d / 365.25)} years`;
}

/** Things worth knowing about how the token is built. */
export function headerWarnings(jwt: DecodedJwt): string[] {
  const out: string[] = [];
  const alg = String(jwt.header.alg ?? "");
  if (!alg) out.push("The header has no alg, so nothing says how the token is signed.");
  if (alg.toLowerCase() === "none") {
    out.push("This token isn't signed (alg: none). Anyone can create or change it, and servers must reject it.");
  } else if (jwt.kind === "jws" && jwt.signature.length === 0) {
    out.push("The signature part is empty, so the token can't be verified.");
  }
  if (typeof jwt.header.jku === "string" || typeof jwt.header.x5u === "string") {
    out.push("The header points to where its own keys are. A server should only fetch keys from addresses it already trusts.");
  }
  const p = jwt.payload;
  if (p) {
    const exp = num(p.exp);
    const iat = num(p.iat);
    if (exp !== null && exp > 1e11) out.push("exp looks like milliseconds. JWT times are in seconds, so this expiry is thousands of years away.");
    if (exp === null && jwt.kind === "jws") out.push("There's no exp, so this token never expires unless the server tracks it.");
    if (exp !== null && iat !== null && exp < iat) out.push("exp is before iat: the token expired before it was issued.");
  }
  return out;
}

// ── Keys and signatures ────────────────────────────────────────────────────

type Params = {
  import: RsaHashedImportParams | EcKeyImportParams | HmacImportParams | Algorithm;
  sign: AlgorithmIdentifier | RsaPssParams | EcdsaParams;
};

export const SUPPORTED_ALGS = ["HS256", "HS384", "HS512", "RS256", "RS384", "RS512", "PS256", "PS384", "PS512", "ES256", "ES384", "ES512", "EdDSA"];

export function algParams(alg: string): Params | null {
  const m = /^(HS|RS|PS|ES)(256|384|512)$/.exec(alg);
  if (m) {
    const bits = Number(m[2]);
    const hash = `SHA-${bits}`;
    switch (m[1]) {
      case "HS":
        return { import: { name: "HMAC", hash }, sign: "HMAC" };
      case "RS":
        return { import: { name: "RSASSA-PKCS1-v1_5", hash }, sign: "RSASSA-PKCS1-v1_5" };
      case "PS":
        return { import: { name: "RSA-PSS", hash }, sign: { name: "RSA-PSS", saltLength: bits / 8 } };
      case "ES": {
        const namedCurve = bits === 512 ? "P-521" : `P-${bits}`;
        return { import: { name: "ECDSA", namedCurve }, sign: { name: "ECDSA", hash } };
      }
    }
  }
  if (alg === "EdDSA" || alg === "Ed25519") return { import: { name: "Ed25519" }, sign: { name: "Ed25519" } };
  return null;
}

export const isHmac = (alg: string) => /^HS(256|384|512)$/.test(alg);

function pemBody(pem: string, label: RegExp): Uint8Array | null {
  const m = new RegExp(`-----BEGIN ${label.source}-----([\\s\\S]+?)-----END ${label.source}-----`).exec(pem);
  if (!m) return null;
  const b64 = m[1].replace(/\s+/g, "");
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

/** DER length bytes. */
function derLength(n: number): number[] {
  if (n < 0x80) return [n];
  const bytes: number[] = [];
  while (n > 0) {
    bytes.unshift(n & 0xff);
    n >>= 8;
  }
  return [0x80 | bytes.length, ...bytes];
}

/** Wraps a PKCS#1 "RSA PUBLIC KEY" in the SPKI structure Web Crypto reads. */
function pkcs1ToSpki(pkcs1: Uint8Array): Uint8Array {
  const algId = [0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00];
  const bitString = [0x03, ...derLength(pkcs1.length + 1), 0x00, ...pkcs1];
  const body = [...algId, ...bitString];
  return new Uint8Array([0x30, ...derLength(body.length), ...body]);
}

function parseJwk(text: string, kid: unknown): JsonWebKey | null {
  let j: unknown;
  try {
    j = JSON.parse(text);
  } catch {
    return null;
  }
  if (!j || typeof j !== "object") return null;
  const o = j as { keys?: JsonWebKey[] } & JsonWebKey;
  if (Array.isArray(o.keys)) {
    const keys = o.keys as (JsonWebKey & { kid?: string })[];
    return keys.find((k) => kid && k.kid === kid) ?? (keys.length === 1 ? keys[0] : null) ?? null;
  }
  return o.kty ? o : null;
}

export class KeyError extends Error {}

async function importKey(alg: string, keyText: string, use: "verify" | "sign", opts: { base64Secret?: boolean; kid?: unknown }): Promise<CryptoKey> {
  const p = algParams(alg);
  if (!p) throw new KeyError(`${alg || "This algorithm"} isn't supported here.`);
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new KeyError("This browser can't check signatures (it needs a secure https page).");

  if (isHmac(alg)) {
    let raw: Uint8Array;
    if (opts.base64Secret) {
      try {
        raw = b64urlDecode(keyText.trim().replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""));
      } catch {
        throw new KeyError("The secret isn't valid Base64.");
      }
    } else raw = utf8(keyText);
    if (!raw.length) throw new KeyError("Enter the secret.");
    return subtle.importKey("raw", raw as BufferSource, p.import, false, [use]);
  }

  const text = keyText.trim();
  if (!text) throw new KeyError(use === "verify" ? "Paste the public key." : "Paste the private key.");
  try {
    if (text.startsWith("{")) {
      const jwk = parseJwk(text, opts.kid);
      if (!jwk) throw new KeyError("That JSON isn't a JWK or a key set with a matching kid.");
      const clean = { ...jwk };
      delete (clean as { alg?: string }).alg;
      delete (clean as { key_ops?: string[] }).key_ops;
      delete (clean as { use?: string }).use;
      if (use === "verify") delete (clean as { d?: string }).d;
      return await subtle.importKey("jwk", clean, p.import, false, [use]);
    }
    if (use === "verify") {
      const spki = pemBody(text, /PUBLIC KEY/);
      if (spki) return await subtle.importKey("spki", spki as BufferSource, p.import, false, ["verify"]);
      const pkcs1 = pemBody(text, /RSA PUBLIC KEY/);
      if (pkcs1) return await subtle.importKey("spki", pkcs1ToSpki(pkcs1) as BufferSource, p.import, false, ["verify"]);
      if (/BEGIN CERTIFICATE/.test(text)) {
        throw new KeyError("That's a certificate. Paste its public key instead: openssl x509 -pubkey -noout -in cert.pem");
      }
      if (/PRIVATE KEY/.test(text)) throw new KeyError("That's a private key. Checking a signature needs only the public key.");
    } else {
      const pkcs8 = pemBody(text, /PRIVATE KEY/);
      if (pkcs8) return await subtle.importKey("pkcs8", pkcs8 as BufferSource, p.import, false, ["sign"]);
      if (/BEGIN (RSA|EC) PRIVATE KEY/.test(text)) {
        throw new KeyError("Convert the key to PKCS#8 first: openssl pkcs8 -topk8 -nocrypt -in key.pem");
      }
    }
  } catch (e) {
    if (e instanceof KeyError) throw e;
    throw new KeyError(`This key doesn't fit ${alg}. Check that it's the right type (${alg.startsWith("ES") ? "EC" : alg === "EdDSA" ? "Ed25519" : "RSA"}) and complete.`);
  }
  throw new KeyError(use === "verify" ? "Paste a PEM public key (-----BEGIN PUBLIC KEY-----) or a JWK." : "Paste a PEM private key (-----BEGIN PRIVATE KEY-----) or a JWK.");
}

export type VerifyResult = { ok: true } | { ok: false; reason: "mismatch" | "key"; message: string };

export async function verifyJwt(jwt: DecodedJwt, key: string, opts: { base64Secret?: boolean } = {}): Promise<VerifyResult> {
  const alg = String(jwt.header.alg ?? "");
  const p = algParams(alg);
  if (!p) return { ok: false, reason: "key", message: `Can't check ${alg || "an unsigned"} tokens.` };
  let k: CryptoKey;
  try {
    k = await importKey(alg, key, "verify", { ...opts, kid: jwt.header.kid });
  } catch (e) {
    return { ok: false, reason: "key", message: e instanceof Error ? e.message : "The key couldn't be read." };
  }
  const data = utf8(`${jwt.parts[0]}.${jwt.parts[1]}`);
  try {
    const ok = await crypto.subtle.verify(p.sign, k, jwt.signature as BufferSource, data as BufferSource);
    return ok ? { ok: true } : { ok: false, reason: "mismatch", message: "" };
  } catch {
    return { ok: false, reason: "mismatch", message: "" };
  }
}

export async function signJwt(
  header: Json,
  payload: Json,
  key: string,
  opts: { base64Secret?: boolean } = {}
): Promise<string> {
  const alg = String(header.alg ?? "");
  const p = algParams(alg);
  if (!p) throw new KeyError(`${alg} isn't supported here.`);
  const k = await importKey(alg, key, "sign", opts);
  const input = `${b64urlEncode(utf8(JSON.stringify(header)))}.${b64urlEncode(utf8(JSON.stringify(payload)))}`;
  const sig = new Uint8Array(await crypto.subtle.sign(p.sign, k, utf8(input) as BufferSource));
  return `${input}.${b64urlEncode(sig)}`;
}

function toPem(der: ArrayBuffer, label: string): string {
  let bin = "";
  for (const b of new Uint8Array(der)) bin += String.fromCharCode(b);
  const b64 = btoa(bin).replace(/(.{64})/g, "$1\n").trim();
  return `-----BEGIN ${label}-----\n${b64}\n-----END ${label}-----`;
}

/** A throwaway key pair for trying out an algorithm. */
export async function generateTestKeys(alg: string): Promise<{ privatePem: string; publicPem: string }> {
  const p = algParams(alg);
  if (!p || isHmac(alg)) throw new KeyError("Only RSA, EC and Ed25519 algorithms use key pairs.");
  const gen =
    "hash" in p.import && (alg.startsWith("RS") || alg.startsWith("PS"))
      ? { ...(p.import as RsaHashedImportParams), modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) }
      : p.import;
  const pair = (await crypto.subtle.generateKey(gen as RsaHashedKeyGenParams, true, ["sign", "verify"])) as CryptoKeyPair;
  const [priv, pub] = await Promise.all([
    crypto.subtle.exportKey("pkcs8", pair.privateKey),
    crypto.subtle.exportKey("spki", pair.publicKey),
  ]);
  return { privatePem: toPem(priv, "PRIVATE KEY"), publicPem: toPem(pub, "PUBLIC KEY") };
}
