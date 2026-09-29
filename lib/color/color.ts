/**
 * Colours: reading any CSS colour, converting between spaces (including
 * OKLCH, the perceptual space modern CSS uses), WCAG contrast, and finding
 * the nearest colour that passes.
 *
 * Internally a colour is sRGB with channels 0–1 plus alpha 0–1.
 */

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const round = (n: number, d = 0) => {
  const f = 10 ** d;
  return Math.round(n * f) / f;
};

// ── Parsing ────────────────────────────────────────────────────────────────

function num(token: string, percentOf: number): number | null {
  const m = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(%)?$/i.exec(token.trim());
  if (!m) return null;
  const v = Number(m[1]);
  return m[2] ? (v / 100) * percentOf : v;
}

function hue(token: string): number | null {
  const m = /^([+-]?(?:\d+\.?\d*|\.\d+))(deg|grad|rad|turn)?$/i.exec(token.trim());
  if (!m) return null;
  const v = Number(m[1]);
  switch ((m[2] ?? "deg").toLowerCase()) {
    case "grad":
      return (v * 360) / 400;
    case "rad":
      return (v * 180) / Math.PI;
    case "turn":
      return v * 360;
    default:
      return v;
  }
}

/** Splits "rgb(1 2 3 / 50%)" or "rgb(1, 2, 3, .5)" into channel tokens and alpha. */
function args(body: string): { parts: string[]; alpha: string | null } | null {
  const slash = body.split("/");
  if (slash.length > 2) return null;
  const main = slash[0].trim();
  const parts = main.includes(",") ? main.split(",").map((s) => s.trim()) : main.split(/\s+/);
  let alpha = slash[1]?.trim() ?? null;
  if (!alpha && parts.length === 4) alpha = parts.pop()!;
  return { parts, alpha };
}

function alphaOf(token: string | null): number | null {
  if (token === null) return 1;
  const a = num(token, 1);
  return a === null ? null : clamp01(a);
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}

function hwbToRgb(h: number, w: number, bl: number): [number, number, number] {
  if (w + bl >= 1) {
    const g = w / (w + bl);
    return [g, g, g];
  }
  return hslToRgb(h, 1, 0.5).map((c) => c * (1 - w - bl) + w) as [number, number, number];
}

/**
 * Reads #rgb, #rgba, #rrggbb, #rrggbbaa, rgb(), rgba(), hsl(), hsla(), hwb(),
 * oklab(), oklch() and "transparent". Names such as "tomato" need the
 * browser (see resolveNamed). Returns null if it can't be read.
 */
export function parseColor(input: string): Rgba | null {
  const t = input.trim().toLowerCase();
  if (!t) return null;
  if (t === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
  const hex = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(t);
  if (hex) {
    let h = hex[1];
    if (h.length <= 4) h = [...h].map((c) => c + c).join("");
    const v = (i: number) => parseInt(h.slice(i, i + 2), 16) / 255;
    return { r: v(0), g: v(2), b: v(4), a: h.length === 8 ? v(6) : 1 };
  }
  const fn = /^([a-z]+)\((.*)\)$/.exec(t);
  if (!fn) return null;
  const a = args(fn[2]);
  if (!a || a.parts.length !== 3) return null;
  const alpha = alphaOf(a.alpha);
  if (alpha === null) return null;
  const [p0, p1, p2] = a.parts;
  switch (fn[1]) {
    case "rgb":
    case "rgba": {
      const c = [num(p0, 255), num(p1, 255), num(p2, 255)];
      if (c.some((x) => x === null)) return null;
      const [r, g, b] = c.map((x) => clamp01(x! / 255));
      return { r, g, b, a: alpha };
    }
    case "hsl":
    case "hsla": {
      const h = hue(p0);
      const s = num(p1.endsWith("%") ? p1 : `${p1}%`, 1);
      const l = num(p2.endsWith("%") ? p2 : `${p2}%`, 1);
      if (h === null || s === null || l === null) return null;
      const [r, g, b] = hslToRgb(h, clamp01(s), clamp01(l));
      return { r, g, b, a: alpha };
    }
    case "hwb": {
      const h = hue(p0);
      const w = num(p1.endsWith("%") ? p1 : `${p1}%`, 1);
      const bl = num(p2.endsWith("%") ? p2 : `${p2}%`, 1);
      if (h === null || w === null || bl === null) return null;
      const [r, g, b] = hwbToRgb(h, clamp01(w), clamp01(bl));
      return { r, g, b, a: alpha };
    }
    case "oklab": {
      const L = num(p0, 1);
      const A = num(p1, 0.4);
      const B = num(p2, 0.4);
      if (L === null || A === null || B === null) return null;
      return { ...fitGamut(L, Math.hypot(A, B), (Math.atan2(B, A) * 180) / Math.PI), a: alpha };
    }
    case "oklch": {
      const L = num(p0, 1);
      const C = num(p1, 0.4);
      const H = hue(p2);
      if (L === null || C === null || H === null) return null;
      return { ...fitGamut(L, C, H), a: alpha };
    }
  }
  return null;
}

/** Resolves CSS colour names ("tomato", "rebeccapurple") with the browser. Browser only. */
export function resolveNamed(name: string): Rgba | null {
  if (!/^[a-z]+$/i.test(name.trim()) || typeof document === "undefined") return null;
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#010203";
  ctx.fillStyle = name.trim();
  const out = ctx.fillStyle;
  if (out === "#010203" && name.trim().toLowerCase() !== "#010203") return null;
  return parseColor(out);
}

export function readColor(input: string): Rgba | null {
  return parseColor(input) ?? resolveNamed(input);
}

// ── Spaces ─────────────────────────────────────────────────────────────────

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

/** OKLab from sRGB (Björn Ottosson, 2020). */
export function toOklab({ r, g, b }: Rgba): [number, number, number] {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToLinear(L: number, A: number, B: number): [number, number, number] {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

export function toOklch(c: Rgba): [number, number, number] {
  const [L, A, B] = toOklab(c);
  const C = Math.hypot(A, B);
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;
  return [L, C, C < 0.0002 ? 0 : H];
}

/**
 * OKLCH to sRGB. Colours outside sRGB keep their lightness and hue while
 * chroma is reduced until they fit (the CSS Color 4 approach).
 */
export function fitGamut(L: number, C: number, H: number): Rgba {
  const at = (c: number) => {
    const h = (H * Math.PI) / 180;
    return oklabToLinear(L, c * Math.cos(h), c * Math.sin(h));
  };
  const inside = (rgb: number[]) => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);
  let rgb = at(C);
  if (!inside(rgb)) {
    let lo = 0;
    let hi = C;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inside(at(mid))) lo = mid;
      else hi = mid;
    }
    rgb = at(lo);
  }
  const [r, g, b] = rgb.map((v) => clamp01(fromLinear(clamp01(v))));
  return { r, g, b, a: 1 };
}

export function toHsl({ r, g, b }: Rgba): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return [h, s, l];
}

export function toHsv({ r, g, b }: Rgba): [number, number, number] {
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  const [h] = toHsl({ r, g, b, a: 1 });
  return [h, max ? d / max : 0, max];
}

export function toCmyk({ r, g, b }: Rgba): [number, number, number, number] {
  const k = 1 - Math.max(r, g, b);
  if (k >= 1) return [0, 0, 0, 1];
  return [(1 - r - k) / (1 - k), (1 - g - k) / (1 - k), (1 - b - k) / (1 - k), k];
}

// ── Formatting ─────────────────────────────────────────────────────────────

const byte = (c: number) => Math.round(clamp01(c) * 255);
const hex2 = (c: number) => byte(c).toString(16).padStart(2, "0");

export function toHex(c: Rgba, withAlpha = c.a < 1): string {
  return `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}${withAlpha ? hex2(c.a) : ""}`.toUpperCase();
}

const alphaPart = (a: number) => (a < 1 ? ` / ${round(a * 100)}%` : "");

export function formats(c: Rgba): { key: string; label: string; value: string }[] {
  const [h, s, l] = toHsl(c);
  const [hv, sv, vv] = toHsv(c);
  const [L, C, H] = toOklch(c);
  const [, A, B] = toOklab(c);
  const [cy, m, y, k] = toCmyk(c);
  const white = 1 - Math.max(c.r, c.g, c.b);
  return [
    { key: "hex", label: "HEX", value: toHex(c) },
    { key: "rgb", label: "RGB", value: `rgb(${byte(c.r)} ${byte(c.g)} ${byte(c.b)}${alphaPart(c.a)})` },
    { key: "rgb-legacy", label: "RGB (comma syntax)", value: c.a < 1 ? `rgba(${byte(c.r)}, ${byte(c.g)}, ${byte(c.b)}, ${round(c.a, 2)})` : `rgb(${byte(c.r)}, ${byte(c.g)}, ${byte(c.b)})` },
    { key: "hsl", label: "HSL", value: `hsl(${round(h)} ${round(s * 100)}% ${round(l * 100)}%${alphaPart(c.a)})` },
    { key: "hwb", label: "HWB", value: `hwb(${round(h)} ${round(Math.min(c.r, c.g, c.b) * 100)}% ${round(white * 100)}%${alphaPart(c.a)})` },
    { key: "oklch", label: "OKLCH", value: `oklch(${round(L * 100, 2)}% ${round(C, 4)} ${round(H, 2)}${alphaPart(c.a)})` },
    { key: "oklab", label: "OKLab", value: `oklab(${round(L * 100, 2)}% ${round(A, 4)} ${round(B, 4)}${alphaPart(c.a)})` },
    { key: "hsv", label: "HSV / HSB", value: `hsv(${round(hv)}, ${round(sv * 100)}%, ${round(vv * 100)}%)` },
    { key: "cmyk", label: "CMYK (approximate)", value: `cmyk(${round(cy * 100)}%, ${round(m * 100)}%, ${round(y * 100)}%, ${round(k * 100)}%)` },
    { key: "float", label: "0–1 floats (GL, Swift, Unity)", value: `${round(c.r, 3)}, ${round(c.g, 3)}, ${round(c.b, 3)}${c.a < 1 ? `, ${round(c.a, 3)}` : ""}` },
  ];
}

// ── Contrast ───────────────────────────────────────────────────────────────

/** WCAG relative luminance. */
export function luminance({ r, g, b }: Rgba): number {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** A see-through colour as it appears over an opaque background. */
export function over(fg: Rgba, bg: Rgba): Rgba {
  const a = fg.a;
  return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
}

export function contrast(fg: Rgba, bg: Rgba): number {
  const base = bg.a < 1 ? over(bg, { r: 1, g: 1, b: 1, a: 1 }) : bg;
  const shown = fg.a < 1 ? over(fg, base) : fg;
  const [hi, lo] = [luminance(shown), luminance(base)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * The ratio for display: cut, never rounded up, so 4.499 shows as 4.49 and
 * doesn't look like a pass (WCAG thresholds are exact).
 */
export function ratioText(r: number): string {
  return (Math.floor(r * 100) / 100).toFixed(2);
}

export const WCAG = [
  { id: "aa", level: "AA", what: "Normal text", min: 4.5, sc: "1.4.3" },
  { id: "aa-large", level: "AA", what: "Large text", min: 3, sc: "1.4.3" },
  { id: "aaa", level: "AAA", what: "Normal text", min: 7, sc: "1.4.6" },
  { id: "aaa-large", level: "AAA", what: "Large text", min: 4.5, sc: "1.4.6" },
  { id: "ui", level: "AA", what: "Icons, borders and form controls", min: 3, sc: "1.4.11" },
] as const;

/**
 * The closest colour to `move` (same hue, as little lightness change as
 * possible) that reaches `target` against `other`. Tries both darker and
 * lighter and returns whichever changes the colour less.
 */
export function nearestPassing(move: Rgba, other: Rgba, target: number, moveIsText = true): Rgba | null {
  const [L0, C, H] = toOklch(move);
  const test = (L: number) => {
    const c = { ...fitGamut(L, C, H), a: move.a };
    return { c, ok: (moveIsText ? contrast(c, other) : contrast(other, c)) >= target + 0.005 };
  };
  const search = (towards: number): { c: Rgba; dist: number } | null => {
    if (!test(towards).ok) return null;
    let lo = L0;
    let hi = towards;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      if (test(mid).ok) hi = mid;
      else lo = mid;
    }
    return { c: test(hi).c, dist: Math.abs(hi - L0) };
  };
  const options = [search(0), search(1)].filter(Boolean) as { c: Rgba; dist: number }[];
  if (!options.length) return null;
  return options.sort((a, b) => a.dist - b.dist)[0].c;
}

// ── Colour vision ──────────────────────────────────────────────────────────

/** Machado, Oliveira & Fernandes (2009), full severity, applied to linear RGB. */
const CVD: Record<string, number[][]> = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

export type Vision = "protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia";

export function simulate(c: Rgba, type: Vision): Rgba {
  const lin = [toLinear(c.r), toLinear(c.g), toLinear(c.b)];
  if (type === "achromatopsia") {
    const y = fromLinear(0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]);
    return { r: y, g: y, b: y, a: c.a };
  }
  const m = CVD[type];
  const [r, g, b] = m.map((row) => clamp01(fromLinear(clamp01(row[0] * lin[0] + row[1] * lin[1] + row[2] * lin[2]))));
  return { r, g, b, a: c.a };
}

export function css(c: Rgba): string {
  return c.a < 1 ? `rgb(${byte(c.r)} ${byte(c.g)} ${byte(c.b)} / ${round(c.a, 3)})` : toHex(c, false);
}

// ── Palettes ───────────────────────────────────────────────────────────────

/** Rotates the hue in OKLCH, keeping lightness and chroma — even-looking harmonies. */
export function rotateHue(c: Rgba, degrees: number): Rgba {
  const [L, C, H] = toOklch(c);
  return { ...fitGamut(L, C, (H + degrees + 360) % 360), a: c.a };
}

/** Tints and shades from 50 to 950 like a Tailwind scale, spaced evenly in OKLCH lightness. */
export function scale(c: Rgba): { step: number; color: Rgba }[] {
  const [, C, H] = toOklch(c);
  const steps: [number, number][] = [
    [50, 0.97], [100, 0.93], [200, 0.87], [300, 0.79], [400, 0.7], [500, 0.62],
    [600, 0.54], [700, 0.46], [800, 0.38], [900, 0.3], [950, 0.23],
  ];
  return steps.map(([step, L]) => {
    // Very light and very dark steps can't hold much chroma.
    const edge = Math.min(1, Math.min(L, 1 - L) / 0.25);
    return { step, color: fitGamut(L, C * (0.35 + 0.65 * edge), H) };
  });
}
