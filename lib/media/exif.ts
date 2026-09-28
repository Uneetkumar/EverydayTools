/**
 * Reading and removing photo metadata, entirely in the browser.
 *
 * Reads the TIFF/EXIF block from JPEG (APP1), PNG (eXIf), WebP (EXIF chunk),
 * TIFF files, and — by scanning for the "Exif\0\0" signature — HEIC/AVIF.
 * Removal is lossless for JPEG, PNG and WebP: metadata segments are dropped
 * and the compressed image data is copied byte for byte, so quality is
 * unchanged.
 */

export type ImageFormat = "jpeg" | "png" | "webp" | "tiff" | "heic" | "gif" | "bmp" | "other";

export interface ExifTag {
  ifd: "Image" | "Exif" | "GPS" | "Thumbnail";
  id: number;
  name: string;
  /** Human-readable value. */
  value: string;
  /** Parsed value for calculations (numbers, rationals as numbers, strings). */
  raw: unknown;
}

export interface GpsPosition {
  lat: number;
  lon: number;
  altitude?: number;
}

export interface MetadataReport {
  format: ImageFormat;
  tags: ExifTag[];
  gps: GpsPosition | null;
  orientation: number;
  /** Embedded preview image, if the EXIF block carries one. */
  thumbnail: Blob | null;
  hasXmp: boolean;
  hasIptc: boolean;
  hasIcc: boolean;
  /** PNG text chunks and JPEG comments. */
  comments: string[];
  /** Bytes of metadata found (EXIF + XMP + IPTC + comments). */
  metadataBytes: number;
}

/* ------------------------------------------------------------------ */
/* Format detection                                                    */
/* ------------------------------------------------------------------ */

export function detectFormat(b: Uint8Array): ImageFormat {
  if (b[0] === 0xff && b[1] === 0xd8) return "jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP") return "webp";
  if ((b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2a) || (b[0] === 0x4d && b[1] === 0x4d && b[3] === 0x2a)) return "tiff";
  if (ascii(b, 4, 4) === "ftyp") {
    const brand = ascii(b, 8, 4);
    if (/^(heic|heix|hevc|hevx|mif1|msf1|avif|avis)$/.test(brand)) return "heic";
  }
  if (ascii(b, 0, 3) === "GIF") return "gif";
  if (b[0] === 0x42 && b[1] === 0x4d) return "bmp";
  return "other";
}

function ascii(b: Uint8Array, start: number, len: number): string {
  let s = "";
  for (let i = start; i < start + len && i < b.length; i++) s += String.fromCharCode(b[i]);
  return s;
}

/* ------------------------------------------------------------------ */
/* TIFF / EXIF parsing                                                 */
/* ------------------------------------------------------------------ */

const IMAGE_TAGS: Record<number, string> = {
  0x010e: "Image description",
  0x010f: "Camera make",
  0x0110: "Camera model",
  0x0112: "Orientation",
  0x011a: "X resolution",
  0x011b: "Y resolution",
  0x0128: "Resolution unit",
  0x0131: "Software",
  0x0132: "Date modified",
  0x013b: "Artist",
  0x8298: "Copyright",
  0x0100: "Image width",
  0x0101: "Image height",
  0x0213: "YCbCr positioning",
};

const EXIF_TAGS: Record<number, string> = {
  0x829a: "Exposure time",
  0x829d: "F-number",
  0x8822: "Exposure program",
  0x8827: "ISO",
  0x9000: "EXIF version",
  0x9003: "Date taken",
  0x9004: "Date digitized",
  0x9010: "Time zone",
  0x9011: "Time zone (taken)",
  0x9201: "Shutter speed value",
  0x9202: "Aperture value",
  0x9204: "Exposure compensation",
  0x9205: "Max aperture",
  0x9206: "Subject distance",
  0x9207: "Metering mode",
  0x9208: "Light source",
  0x9209: "Flash",
  0x920a: "Focal length",
  0x9286: "User comment",
  0xa001: "Colour space",
  0xa002: "Pixel width",
  0xa003: "Pixel height",
  0xa402: "Exposure mode",
  0xa403: "White balance",
  0xa404: "Digital zoom",
  0xa405: "Focal length (35 mm)",
  0xa406: "Scene type",
  0xa420: "Unique image ID",
  0xa430: "Camera owner",
  0xa431: "Camera serial number",
  0xa432: "Lens specification",
  0xa433: "Lens make",
  0xa434: "Lens model",
  0xa435: "Lens serial number",
};

const GPS_TAGS: Record<number, string> = {
  0x0000: "GPS version",
  0x0001: "Latitude ref",
  0x0002: "Latitude",
  0x0003: "Longitude ref",
  0x0004: "Longitude",
  0x0005: "Altitude ref",
  0x0006: "Altitude",
  0x0007: "GPS time (UTC)",
  0x000c: "Speed unit",
  0x000d: "Speed",
  0x0010: "Direction ref",
  0x0011: "Direction",
  0x0012: "Map datum",
  0x001b: "Positioning method",
  0x001d: "GPS date",
};

const TYPE_SIZE: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8 };

interface Tiff {
  view: DataView;
  le: boolean;
}

function readValue(t: Tiff, type: number, count: number, offset: number): unknown {
  const { view, le } = t;
  const size = TYPE_SIZE[type] ?? 1;
  const one = (o: number): number | [number, number] => {
    switch (type) {
      case 1:
      case 7:
        return view.getUint8(o);
      case 6:
        return view.getInt8(o);
      case 3:
        return view.getUint16(o, le);
      case 8:
        return view.getInt16(o, le);
      case 4:
        return view.getUint32(o, le);
      case 9:
        return view.getInt32(o, le);
      case 5:
        return [view.getUint32(o, le), view.getUint32(o + 4, le)];
      case 10:
        return [view.getInt32(o, le), view.getInt32(o + 4, le)];
      case 11:
        return view.getFloat32(o, le);
      case 12:
        return view.getFloat64(o, le);
      default:
        return view.getUint8(o);
    }
  };
  if (type === 2) {
    let end = offset;
    while (end < offset + count && view.getUint8(end) !== 0) end++;
    const bytes = new Uint8Array(view.buffer, view.byteOffset + offset, end - offset);
    // EXIF strings are nominally ASCII, but phones write UTF-8.
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(bytes).trim();
    } catch {
      return new TextDecoder("latin1").decode(bytes).trim();
    }
  }
  if (type === 7) {
    const bytes = new Uint8Array(view.buffer, view.byteOffset + offset, Math.min(count, view.byteLength - offset));
    return bytes;
  }
  if (count === 1) return one(offset);
  const out: unknown[] = [];
  for (let i = 0; i < Math.min(count, 64); i++) out.push(one(offset + i * size));
  return out;
}

interface RawEntry {
  id: number;
  type: number;
  count: number;
  value: unknown;
}

function readIfd(t: Tiff, start: number): { entries: RawEntry[]; next: number } {
  const { view, le } = t;
  if (start <= 0 || start + 2 > view.byteLength) return { entries: [], next: 0 };
  const n = view.getUint16(start, le);
  const entries: RawEntry[] = [];
  for (let i = 0; i < n; i++) {
    const p = start + 2 + i * 12;
    if (p + 12 > view.byteLength) break;
    const id = view.getUint16(p, le);
    const type = view.getUint16(p + 2, le);
    const count = view.getUint32(p + 4, le);
    const bytes = (TYPE_SIZE[type] ?? 1) * count;
    const valueOffset = bytes <= 4 ? p + 8 : view.getUint32(p + 8, le);
    if (!TYPE_SIZE[type] || valueOffset + bytes > view.byteLength) continue;
    try {
      entries.push({ id, type, count, value: readValue(t, type, count, valueOffset) });
    } catch {
      /* a malformed tag is skipped, not fatal */
    }
  }
  const nextPos = start + 2 + n * 12;
  const next = nextPos + 4 <= view.byteLength ? view.getUint32(nextPos, le) : 0;
  return { entries, next };
}

const ratio = (v: unknown): number => {
  if (Array.isArray(v) && v.length === 2 && typeof v[0] === "number") return v[1] ? (v[0] as number) / (v[1] as number) : 0;
  if (typeof v === "number") return v;
  return NaN;
};

const trimNum = (n: number, d = 2) => String(Number(n.toFixed(d)));

const ORIENTATION = [
  "",
  "Normal",
  "Mirrored horizontally",
  "Rotated 180°",
  "Mirrored vertically",
  "Mirrored and rotated 90° CCW",
  "Rotated 90° CW",
  "Mirrored and rotated 90° CW",
  "Rotated 90° CCW",
];
const EXPOSURE_PROGRAM = ["Not defined", "Manual", "Normal program", "Aperture priority", "Shutter priority", "Creative", "Action", "Portrait", "Landscape"];
const METERING = ["Unknown", "Average", "Centre-weighted", "Spot", "Multi-spot", "Pattern", "Partial"];

function formatTag(ifd: ExifTag["ifd"], id: number, value: unknown): string {
  const r = ratio(value);
  if (ifd === "Exif") {
    switch (id) {
      case 0x829a:
        return r >= 1 ? `${trimNum(r, 1)} s` : r > 0 ? `1/${Math.round(1 / r)} s` : "—";
      case 0x829d:
      case 0x9202:
      case 0x9205:
        return `f/${trimNum(id === 0x829d ? r : Math.pow(2, r / 2), 1)}`;
      case 0x920a:
        return `${trimNum(r, 1)} mm`;
      case 0xa405:
        return `${value} mm`;
      case 0x9204:
        return `${r > 0 ? "+" : ""}${trimNum(r, 2)} EV`;
      case 0x9201:
        return r ? `1/${Math.round(Math.pow(2, r))} s` : "—";
      case 0x8822:
        return EXPOSURE_PROGRAM[value as number] ?? String(value);
      case 0x9207:
        return value === 255 ? "Other" : METERING[value as number] ?? String(value);
      case 0x9209: {
        const f = value as number;
        return f & 1 ? "Fired" : "Did not fire";
      }
      case 0xa001:
        return value === 1 ? "sRGB" : value === 0xffff ? "Uncalibrated" : String(value);
      case 0xa402:
        return ["Auto", "Manual", "Auto bracket"][value as number] ?? String(value);
      case 0xa403:
        return value === 1 ? "Manual" : "Auto";
      case 0xa406:
        return ["Standard", "Landscape", "Portrait", "Night"][value as number] ?? String(value);
      case 0xa432: {
        const arr = Array.isArray(value) ? value.map(ratio) : [];
        if (arr.length !== 4) break;
        const fl = arr[0] === arr[1] ? `${trimNum(arr[0], 0)} mm` : `${trimNum(arr[0], 0)}–${trimNum(arr[1], 0)} mm`;
        const ap = arr[2] === arr[3] || !arr[3] ? `f/${trimNum(arr[2], 1)}` : `f/${trimNum(arr[2], 1)}–${trimNum(arr[3], 1)}`;
        return `${fl} ${ap}`;
      }
      case 0x9000:
        return value instanceof Uint8Array ? String.fromCharCode(...value).replace(/^0/, "").replace(/(\d)(\d)$/, "$1.$2") : String(value);
      case 0x9286: {
        if (value instanceof Uint8Array) {
          const text = new TextDecoder().decode(value.slice(8)).replace(/\0+$/, "").trim();
          return text || "(empty)";
        }
        break;
      }
    }
  }
  if (ifd === "Image" || ifd === "Thumbnail") {
    if (id === 0x0112) return ORIENTATION[value as number] ?? String(value);
    if (id === 0x0128) return value === 2 ? "Inches" : value === 3 ? "Centimetres" : "None";
    if (id === 0x011a || id === 0x011b) return trimNum(r, 0);
  }
  if (ifd === "GPS") {
    if (id === 0x0002 || id === 0x0004) {
      const [d, m, s] = (value as unknown[]).map(ratio);
      return `${trimNum(d, 0)}° ${trimNum(m, 0)}′ ${trimNum(s, 2)}″`;
    }
    if (id === 0x0006) return `${trimNum(r, 1)} m`;
    if (id === 0x0007) {
      const [h, m, s] = (value as unknown[]).map(ratio);
      return [h, m, Math.floor(s)].map((n) => String(Math.floor(n)).padStart(2, "0")).join(":");
    }
    if (id === 0x0011 || id === 0x000d) return trimNum(r, 1);
    if (id === 0x0005) return value === 1 ? "Below sea level" : "Above sea level";
    if (id === 0x0000 && Array.isArray(value)) return value.join(".");
  }
  if (value instanceof Uint8Array) return `${value.length} bytes`;
  if (Array.isArray(value)) {
    if (value.length === 2 && typeof value[0] === "number") return trimNum(r, 4);
    return value.map((v) => (Array.isArray(v) ? trimNum(ratio(v), 4) : String(v))).join(", ");
  }
  return String(value);
}

/** Parse a TIFF block (the payload of an EXIF segment). */
export function parseTiff(buf: Uint8Array): {
  tags: ExifTag[];
  gps: GpsPosition | null;
  orientation: number;
  thumbnail: Blob | null;
} {
  const empty = { tags: [], gps: null, orientation: 1, thumbnail: null };
  if (buf.length < 8) return empty;
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const order = view.getUint16(0, false);
  if (order !== 0x4949 && order !== 0x4d4d) return empty;
  const le = order === 0x4949;
  if (view.getUint16(2, le) !== 42) return empty;
  const t: Tiff = { view, le };

  const tags: ExifTag[] = [];
  const push = (ifd: ExifTag["ifd"], names: Record<number, string>, entries: RawEntry[]) => {
    for (const e of entries) {
      if (e.id === 0x8769 || e.id === 0x8825 || e.id === 0xa005 || e.id === 0x927c) continue; // pointers, maker notes
      const name = names[e.id];
      if (!name) continue;
      tags.push({ ifd, id: e.id, name, value: formatTag(ifd, e.id, e.value), raw: e.value });
    }
  };

  const ifd0 = readIfd(t, view.getUint32(4, le));
  push("Image", IMAGE_TAGS, ifd0.entries);
  const orientation = (ifd0.entries.find((e) => e.id === 0x0112)?.value as number) || 1;

  const exifPtr = ifd0.entries.find((e) => e.id === 0x8769)?.value as number | undefined;
  if (exifPtr) push("Exif", EXIF_TAGS, readIfd(t, exifPtr).entries);

  let gps: GpsPosition | null = null;
  const gpsPtr = ifd0.entries.find((e) => e.id === 0x8825)?.value as number | undefined;
  if (gpsPtr) {
    const g = readIfd(t, gpsPtr).entries;
    push("GPS", GPS_TAGS, g);
    const get = (id: number) => g.find((e) => e.id === id)?.value;
    const dms = (v: unknown) => {
      if (!Array.isArray(v) || v.length < 3) return NaN;
      const [d, m, s] = v.map(ratio);
      return d + m / 60 + s / 3600;
    };
    let lat = dms(get(0x0002));
    let lon = dms(get(0x0004));
    if (String(get(0x0001)).toUpperCase() === "S") lat = -lat;
    if (String(get(0x0003)).toUpperCase() === "W") lon = -lon;
    // 0,0 is what some apps write when location was off.
    if (Number.isFinite(lat) && Number.isFinite(lon) && !(lat === 0 && lon === 0)) {
      const alt = ratio(get(0x0006));
      gps = {
        lat,
        lon,
        altitude: Number.isFinite(alt) ? (get(0x0005) === 1 ? -alt : alt) : undefined,
      };
    }
  }

  let thumbnail: Blob | null = null;
  if (ifd0.next) {
    const ifd1 = readIfd(t, ifd0.next);
    const off = ifd1.entries.find((e) => e.id === 0x0201)?.value as number | undefined;
    const len = ifd1.entries.find((e) => e.id === 0x0202)?.value as number | undefined;
    if (off && len && off + len <= buf.length && buf[off] === 0xff && buf[off + 1] === 0xd8) {
      thumbnail = new Blob([buf.slice(off, off + len)], { type: "image/jpeg" });
    }
  }

  return { tags, gps, orientation, thumbnail };
}

/* ------------------------------------------------------------------ */
/* Container walkers                                                   */
/* ------------------------------------------------------------------ */

interface Segment {
  start: number;
  end: number;
}

interface JpegScan {
  exif: Uint8Array | null;
  metaSegments: Segment[];
  hasXmp: boolean;
  hasIptc: boolean;
  hasIcc: boolean;
  comments: string[];
}

const EXIF_SIG = [0x45, 0x78, 0x69, 0x66, 0, 0];
const startsWith = (b: Uint8Array, at: number, sig: number[] | string) => {
  const arr = typeof sig === "string" ? [...sig].map((c) => c.charCodeAt(0)) : sig;
  for (let i = 0; i < arr.length; i++) if (b[at + i] !== arr[i]) return false;
  return true;
};

function scanJpeg(b: Uint8Array): JpegScan {
  const out: JpegScan = { exif: null, metaSegments: [], hasXmp: false, hasIptc: false, hasIcc: false, comments: [] };
  let p = 2;
  while (p + 4 <= b.length) {
    if (b[p] !== 0xff) break;
    const marker = b[p + 1];
    if (marker === 0xff) {
      p++;
      continue;
    }
    if (marker === 0xda || marker === 0xd9) break; // start of scan / end
    if (marker >= 0xd0 && marker <= 0xd7) {
      p += 2;
      continue;
    }
    const len = (b[p + 2] << 8) | b[p + 3];
    const dataStart = p + 4;
    const end = p + 2 + len;
    if (end > b.length) break;
    if (marker === 0xe1 && startsWith(b, dataStart, EXIF_SIG)) {
      if (!out.exif) out.exif = b.subarray(dataStart + 6, end);
      out.metaSegments.push({ start: p, end });
    } else if (marker === 0xe1) {
      if (startsWith(b, dataStart, "http://ns.adobe.com/")) out.hasXmp = true;
      out.metaSegments.push({ start: p, end });
    } else if (marker === 0xed) {
      out.hasIptc = true;
      out.metaSegments.push({ start: p, end });
    } else if (marker === 0xfe) {
      const text = new TextDecoder().decode(b.subarray(dataStart, end)).replace(/\0+$/, "").trim();
      if (text) out.comments.push(text);
      out.metaSegments.push({ start: p, end });
    } else if (marker === 0xe2 && startsWith(b, dataStart, "ICC_PROFILE")) {
      out.hasIcc = true;
    }
    p = end;
  }
  return out;
}

interface PngChunk {
  type: string;
  start: number;
  end: number;
  data: Uint8Array;
}

function pngChunks(b: Uint8Array): PngChunk[] {
  const chunks: PngChunk[] = [];
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let p = 8;
  while (p + 12 <= b.length) {
    const len = view.getUint32(p);
    const type = ascii(b, p + 4, 4);
    const end = p + 12 + len;
    if (end > b.length) break;
    chunks.push({ type, start: p, end, data: b.subarray(p + 8, p + 8 + len) });
    p = end;
    if (type === "IEND") break;
  }
  return chunks;
}

const PNG_META = new Set(["eXIf", "tEXt", "zTXt", "iTXt", "tIME"]);

interface RiffChunk {
  fourcc: string;
  start: number;
  end: number;
  data: Uint8Array;
}

function webpChunks(b: Uint8Array): RiffChunk[] {
  const chunks: RiffChunk[] = [];
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let p = 12;
  while (p + 8 <= b.length) {
    const fourcc = ascii(b, p, 4);
    const size = view.getUint32(p + 4, true);
    const end = p + 8 + size + (size & 1);
    chunks.push({ fourcc, start: p, end: Math.min(end, b.length), data: b.subarray(p + 8, Math.min(p + 8 + size, b.length)) });
    p = end;
  }
  return chunks;
}

/** Find an "Exif\0\0" + TIFF header anywhere — used for HEIC/AVIF. */
function scanForExif(b: Uint8Array): Uint8Array | null {
  const limit = Math.min(b.length - 10, 4 * 1024 * 1024);
  for (let i = 0; i < limit; i++) {
    if (b[i] === 0x45 && startsWith(b, i, EXIF_SIG)) {
      const t = i + 6;
      if ((b[t] === 0x49 && b[t + 1] === 0x49 && b[t + 2] === 0x2a) || (b[t] === 0x4d && b[t + 1] === 0x4d && b[t + 3] === 0x2a)) {
        return b.subarray(t);
      }
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export function readMetadata(b: Uint8Array): MetadataReport {
  const format = detectFormat(b);
  const report: MetadataReport = {
    format,
    tags: [],
    gps: null,
    orientation: 1,
    thumbnail: null,
    hasXmp: false,
    hasIptc: false,
    hasIcc: false,
    comments: [],
    metadataBytes: 0,
  };
  let tiff: Uint8Array | null = null;

  if (format === "jpeg") {
    const s = scanJpeg(b);
    tiff = s.exif;
    Object.assign(report, { hasXmp: s.hasXmp, hasIptc: s.hasIptc, hasIcc: s.hasIcc, comments: s.comments });
    report.metadataBytes = s.metaSegments.reduce((n, seg) => n + seg.end - seg.start, 0);
  } else if (format === "png") {
    for (const c of pngChunks(b)) {
      if (c.type === "eXIf") tiff = c.data;
      if (c.type === "iCCP") report.hasIcc = true;
      if (c.type === "tEXt" || c.type === "iTXt") {
        const text = new TextDecoder("latin1").decode(c.data);
        const [key, ...rest] = text.split("\0");
        if (key === "XML:com.adobe.xmp") report.hasXmp = true;
        else report.comments.push(`${key}: ${rest.filter(Boolean).join(" ").slice(0, 300)}`);
      }
      if (PNG_META.has(c.type)) report.metadataBytes += c.end - c.start;
    }
  } else if (format === "webp") {
    for (const c of webpChunks(b)) {
      if (c.fourcc === "EXIF") tiff = startsWith(c.data, 0, EXIF_SIG) ? c.data.subarray(6) : c.data;
      if (c.fourcc === "XMP ") report.hasXmp = true;
      if (c.fourcc === "ICCP") report.hasIcc = true;
      if (c.fourcc === "EXIF" || c.fourcc === "XMP ") report.metadataBytes += c.end - c.start;
    }
  } else if (format === "tiff") {
    tiff = b;
  } else if (format === "heic") {
    tiff = scanForExif(b);
  }

  if (tiff) {
    const parsed = parseTiff(tiff);
    Object.assign(report, parsed);
    if (format === "heic") report.metadataBytes = tiff.length;
  }
  return report;
}

/** Whether `stripMetadata` can remove metadata losslessly from this format. */
export function canStrip(format: ImageFormat): boolean {
  return format === "jpeg" || format === "png" || format === "webp";
}

/** A minimal big-endian TIFF block holding only an Orientation tag. */
function orientationTiff(orientation: number): Uint8Array {
  const b = new Uint8Array(26);
  const v = new DataView(b.buffer);
  b.set([0x4d, 0x4d, 0x00, 0x2a]);
  v.setUint32(4, 8);
  v.setUint16(8, 1); // one entry
  v.setUint16(10, 0x0112);
  v.setUint16(12, 3); // SHORT
  v.setUint32(14, 1);
  v.setUint16(18, orientation);
  v.setUint32(22, 0); // no next IFD
  return b;
}

let crcTable: Uint32Array | null = null;
function crc32(data: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = crcTable[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

/**
 * Remove EXIF, GPS, XMP, IPTC and comments. The colour profile is kept (it
 * changes how colours display), and so is the orientation — as a one-tag EXIF
 * block — so a portrait photo does not turn sideways.
 */
export function stripMetadata(b: Uint8Array, keepOrientation = true): Uint8Array {
  const format = detectFormat(b);
  const { orientation } = readMetadata(b);

  if (format === "jpeg") {
    const { metaSegments } = scanJpeg(b);
    const parts: Uint8Array[] = [b.subarray(0, 2)];
    if (keepOrientation && orientation > 1 && orientation <= 8) {
      const tiff = orientationTiff(orientation);
      const len = 2 + 6 + tiff.length;
      parts.push(new Uint8Array([0xff, 0xe1, len >> 8, len & 0xff, ...EXIF_SIG]), tiff);
    }
    let p = 2;
    for (const seg of metaSegments) {
      parts.push(b.subarray(p, seg.start));
      p = seg.end;
    }
    parts.push(b.subarray(p));
    return concat(parts);
  }

  if (format === "png") {
    const parts: Uint8Array[] = [b.subarray(0, 8)];
    for (const c of pngChunks(b)) {
      if (PNG_META.has(c.type)) continue;
      parts.push(b.subarray(c.start, c.end));
      if (c.type === "IHDR" && keepOrientation && orientation > 1 && orientation <= 8) {
        const tiff = orientationTiff(orientation);
        const typeAndData = concat([new Uint8Array([0x65, 0x58, 0x49, 0x66]), tiff]);
        const chunk = new Uint8Array(12 + tiff.length);
        const v = new DataView(chunk.buffer);
        v.setUint32(0, tiff.length);
        chunk.set(typeAndData, 4);
        v.setUint32(8 + tiff.length, crc32(typeAndData));
        parts.push(chunk);
      }
    }
    return concat(parts);
  }

  if (format === "webp") {
    const kept: Uint8Array[] = [];
    for (const c of webpChunks(b)) {
      if (c.fourcc === "EXIF" || c.fourcc === "XMP ") continue;
      const bytes = b.slice(c.start, c.end);
      // VP8X carries flags announcing EXIF (0x08) and XMP (0x04) chunks.
      if (c.fourcc === "VP8X") bytes[8] &= ~(0x08 | 0x04);
      kept.push(bytes);
    }
    const body = concat(kept);
    const out = new Uint8Array(12 + body.length);
    out.set(b.subarray(0, 12));
    new DataView(out.buffer).setUint32(4, 4 + body.length, true);
    out.set(body, 12);
    return out;
  }

  return b;
}

/** "12.9716, 77.5946" style decimal degrees, and a DMS rendering. */
export function formatCoordinate(value: number, axis: "lat" | "lon"): string {
  const hemi = axis === "lat" ? (value >= 0 ? "N" : "S") : value >= 0 ? "E" : "W";
  const a = Math.abs(value);
  const d = Math.floor(a);
  const mFloat = (a - d) * 60;
  const m = Math.floor(mFloat);
  const s = (mFloat - m) * 60;
  return `${d}° ${m}′ ${s.toFixed(1)}″ ${hemi}`;
}
