/**
 * UUIDs as defined by RFC 9562 (2024, replacing RFC 4122): generating
 * versions 1, 3, 4, 5 and 7, formatting them, and reading one back.
 */

export type UuidVersion = "v4" | "v7" | "v1" | "v5" | "v3";

export const VERSIONS: { value: UuidVersion; label: string; description: string }[] = [
  { value: "v4", label: "Version 4 — random", description: "The usual choice. 122 random bits; no information about when or where it was made." },
  { value: "v7", label: "Version 7 — time-ordered", description: "Starts with the time, so new IDs sort after old ones. Best for database keys." },
  { value: "v5", label: "Version 5 — from a name", description: "The same namespace and name always give the same UUID (SHA-1)." },
  { value: "v1", label: "Version 1 — time and node", description: "Legacy time-based format. Made here with a random node, never your device's address." },
  { value: "v3", label: "Version 3 — from a name (MD5)", description: "Like version 5 but with MD5. Use only to match an existing system." },
];

export const NAMESPACES: { value: string; label: string; id: string }[] = [
  { value: "dns", label: "DNS (domain names)", id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8" },
  { value: "url", label: "URL", id: "6ba7b811-9dad-11d1-80b4-00c04fd430c8" },
  { value: "oid", label: "OID", id: "6ba7b812-9dad-11d1-80b4-00c04fd430c8" },
  { value: "x500", label: "X.500 name", id: "6ba7b814-9dad-11d1-80b4-00c04fd430c8" },
];

export const NIL = "00000000-0000-0000-0000-000000000000";
export const MAX = "ffffffff-ffff-ffff-ffff-ffffffffffff";

const HEX = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));

export function stringify(b: Uint8Array): string {
  let s = "";
  for (let i = 0; i < 16; i++) {
    if (i === 4 || i === 6 || i === 8 || i === 10) s += "-";
    s += HEX[b[i]];
  }
  return s;
}

/** Reads a UUID written in any common way: braces, urn:uuid:, no hyphens, any case. */
export function parse(input: string): Uint8Array | null {
  const t = input
    .trim()
    .replace(/^urn:uuid:/i, "")
    .replace(/^\{|\}$/g, "")
    .replace(/^["']|["']$/g, "");
  const hex = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(t) ? t.replace(/-/g, "") : null;
  if (!hex) return null;
  const b = new Uint8Array(16);
  for (let i = 0; i < 16; i++) b[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return b;
}

function random(n: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(n));
}

function stamp(b: Uint8Array, version: number): Uint8Array {
  b[6] = (b[6] & 0x0f) | (version << 4);
  b[8] = (b[8] & 0x3f) | 0x80; // RFC 9562 variant (10xx)
  return b;
}

export function v4(): string {
  return stringify(stamp(random(16), 4));
}

/**
 * Makes version 7 UUIDs that keep increasing even within one millisecond:
 * the 12 bits after the time act as a counter (RFC 9562 §6.2, method 1),
 * starting from a random value in the lower half so there is room to count.
 */
export function v7Generator(now: () => number = Date.now) {
  let lastMs = -1;
  let counter = 0;
  return (): string => {
    let ms = now();
    if (ms <= lastMs) {
      counter++;
      if (counter > 0xfff) {
        lastMs++;
        counter = random(2)[0] & 0x7f;
      }
      ms = lastMs;
    } else {
      lastMs = ms;
      counter = ((random(2)[0] << 8) | random(1)[0]) & 0x7ff;
    }
    const b = random(16);
    // 48-bit big-endian millisecond timestamp.
    let t = ms;
    for (let i = 5; i >= 0; i--) {
      b[i] = t % 256;
      t = Math.floor(t / 256);
    }
    b[6] = 0x70 | (counter >> 8);
    b[7] = counter & 0xff;
    b[8] = (b[8] & 0x3f) | 0x80;
    return stringify(b);
  };
}

/** Milliseconds between 15 Oct 1582 (the Gregorian reform) and 1970. */
const GREGORIAN_MS = 12219292800000;

/**
 * Version 1 with a random node ID whose multicast bit is set, as RFC 9562
 * §6.10 recommends when no hardware address should be exposed. The time is
 * in 100-nanosecond steps, so up to 10,000 IDs fit in one millisecond; the
 * extra steps count IDs made in the same millisecond. (Split into two
 * numbers rather than using BigInt, which older phones lack.)
 */
export function v1Generator(now: () => number = Date.now) {
  const node = random(6);
  node[0] |= 0x01;
  const seq = random(2);
  const clockSeq = ((seq[0] << 8) | seq[1]) & 0x3fff;
  let lastMs = -1;
  let nsecs = 0;
  return (): string => {
    let ms = now();
    if (ms <= lastMs) {
      ms = lastMs;
      nsecs++;
      if (nsecs >= 10000) {
        ms = ++lastMs;
        nsecs = 0;
      }
    } else {
      lastMs = ms;
      nsecs = 0;
    }
    const g = ms + GREGORIAN_MS;
    const b = new Uint8Array(16);
    const tl = ((g & 0xfffffff) * 10000 + nsecs) % 0x100000000;
    b[0] = (tl >>> 24) & 0xff;
    b[1] = (tl >>> 16) & 0xff;
    b[2] = (tl >>> 8) & 0xff;
    b[3] = tl & 0xff;
    const tmh = ((g / 0x100000000) * 10000) & 0xfffffff;
    b[4] = (tmh >>> 8) & 0xff;
    b[5] = tmh & 0xff;
    b[6] = ((tmh >>> 24) & 0x0f) | 0x10;
    b[7] = (tmh >>> 16) & 0xff;
    b[8] = 0x80 | (clockSeq >> 8);
    b[9] = clockSeq & 0xff;
    b.set(node, 10);
    return stringify(b);
  };
}

/** Name-based UUID (version 5 with SHA-1, version 3 with MD5). */
export async function nameBased(version: 3 | 5, namespace: string, name: string): Promise<string> {
  const ns = parse(namespace);
  if (!ns) throw new Error("The namespace must be a UUID.");
  const nameBytes = new TextEncoder().encode(name);
  const data = new Uint8Array(16 + nameBytes.length);
  data.set(ns);
  data.set(nameBytes, 16);
  let digest: Uint8Array;
  if (version === 5) {
    digest = new Uint8Array(await crypto.subtle.digest("SHA-1", data));
  } else {
    const { createMD5 } = await import("hash-wasm");
    digest = (await createMD5()).init().update(data).digest("binary");
  }
  return stringify(stamp(digest.slice(0, 16), version));
}

// ── Formatting ─────────────────────────────────────────────────────────────

export type Style = "standard" | "compact" | "braces" | "urn";
export type ListStyle = "lines" | "comma" | "json" | "sql";

export function formatOne(u: string, style: Style, upper: boolean): string {
  let s = upper ? u.toUpperCase() : u;
  if (style === "compact") s = s.replace(/-/g, "");
  if (style === "braces") s = `{${s}}`;
  if (style === "urn") s = `urn:uuid:${s}`;
  return s;
}

export function formatList(items: string[], list: ListStyle): string {
  switch (list) {
    case "lines":
      return items.join("\n");
    case "comma":
      return items.join(", ");
    case "json":
      return JSON.stringify(items, null, 2);
    case "sql":
      return items.map((s) => `'${s}'`).join(",\n");
  }
}

// ── Reading ────────────────────────────────────────────────────────────────

export interface UuidInfo {
  canonical: string;
  version: number;
  versionName: string;
  variant: string;
  special?: "nil" | "max";
  /** Creation time for versions 1, 6 and 7. */
  time?: Date;
  /** Version 1 and 6: clock sequence and node. */
  clockSeq?: number;
  node?: string;
  nodeIsRandom?: boolean;
  notes: string[];
}

const VERSION_NAMES: Record<number, string> = {
  1: "Time-based (version 1)",
  2: "DCE Security (version 2)",
  3: "Name-based, MD5 (version 3)",
  4: "Random (version 4)",
  5: "Name-based, SHA-1 (version 5)",
  6: "Reordered time (version 6)",
  7: "Unix time-ordered (version 7)",
  8: "Custom (version 8)",
};

export function inspect(input: string): UuidInfo | { error: string } | null {
  if (!input.trim()) return null;
  const b = parse(input);
  if (!b) {
    const t = input.trim().replace(/^urn:uuid:/i, "");
    const onlyHex = /^[0-9a-f{}"'\s-]+$/i.test(t);
    const hexCount = t.replace(/[^0-9a-f]/gi, "").length;
    return {
      error:
        onlyHex && hexCount !== 32
          ? `A UUID has 32 hexadecimal digits; this has ${hexCount}.`
          : "That isn't a UUID. It should look like 123e4567-e89b-12d3-a456-426614174000.",
    };
  }
  const canonical = stringify(b);
  if (canonical === NIL) return { canonical, version: 0, versionName: "Nil UUID", variant: "—", special: "nil", notes: ["All zeros. Used to mean “no UUID”."] };
  if (canonical === MAX) return { canonical, version: 15, versionName: "Max UUID", variant: "—", special: "max", notes: ["All ones. RFC 9562 uses it as a sentinel, for example “the end of a range”."] };

  const version = b[6] >> 4;
  const v = b[8];
  const variant =
    (v & 0x80) === 0 ? "NCS (reserved, very old)" : (v & 0xc0) === 0x80 ? "RFC 9562 (standard)" : (v & 0xe0) === 0xc0 ? "Microsoft (reserved)" : "Reserved for future use";
  const info: UuidInfo = { canonical, version, versionName: VERSION_NAMES[version] ?? `Unknown (version ${version})`, variant, notes: [] };
  const standard = (v & 0xc0) === 0x80;

  if (standard && (version === 1 || version === 6)) {
    // 60-bit count of 100 ns steps since 1582, as high and low parts.
    const hex = canonical.replace(/-/g, "");
    let high: number;
    let low: number;
    if (version === 1) {
      const t = hex.slice(13, 16) + hex.slice(8, 12) + hex.slice(0, 8);
      high = parseInt(t.slice(0, 7), 16);
      low = parseInt(t.slice(7), 16);
    } else {
      const t = hex.slice(0, 12) + hex.slice(13, 16);
      high = parseInt(t.slice(0, 7), 16);
      low = parseInt(t.slice(7), 16);
    }
    const ticks = high * 0x100000000 + low;
    info.time = new Date(Math.floor(ticks / 10000) - GREGORIAN_MS);
    info.clockSeq = ((b[8] & 0x3f) << 8) | b[9];
    info.node = Array.from(b.slice(10), (x) => HEX[x]).join(":");
    info.nodeIsRandom = (b[10] & 0x01) === 1;
    info.notes.push(
      info.nodeIsRandom
        ? "The node was chosen at random (its multicast bit is set), so it doesn't identify a device."
        : "The node is probably the network card address of the machine that made it."
    );
  } else if (standard && version === 7) {
    let ms = 0;
    for (let i = 0; i < 6; i++) ms = ms * 256 + b[i];
    info.time = new Date(ms);
  } else if (standard && version === 4) {
    info.notes.push("122 of its 128 bits are random, so it says nothing about when or where it was made.");
  } else if (standard && (version === 3 || version === 5)) {
    info.notes.push("Made from a namespace and a name. It can't be turned back into the name, but the same inputs always give this UUID.");
  }
  if (!standard) info.notes.push("The variant bits aren't the standard ones, so the version number may not mean anything.");
  return info;
}
