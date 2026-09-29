/**
 * Looks for the camera: filter presets, manual adjustments, and the maths
 * that turns them into one set of shader uniforms.
 *
 * Every look is a combination of the same few operations (levels, a
 * highlight-safe brightness curve, an S-curve for contrast, vibrance, a 3×3
 * colour matrix, faded blacks and a vignette), so the live preview, a photo
 * and a video are all drawn by one small shader in a single pass. That keeps
 * older phones at full frame rate and guarantees the saved photo looks exactly
 * like the preview.
 */

export interface Adjustments {
  /** −1 … 1. Midtone brightness; highlights are never clipped. */
  exposure: number;
  /** −1 … 1 */
  contrast: number;
  /** −1 … 1. −1 is black and white. */
  saturation: number;
  /** −1 (cool) … 1 (warm) */
  warmth: number;
  /** 0 … 1. Unsharp mask that ignores fine grain. */
  sharpness: number;
  /** 0 … 1 */
  vignette: number;
}

export const NEUTRAL: Adjustments = {
  exposure: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  sharpness: 0,
  vignette: 0,
};

export const ADJUSTMENT_FIELDS: { key: keyof Adjustments; label: string; min: number }[] = [
  { key: "exposure", label: "Brightness", min: -1 },
  { key: "contrast", label: "Contrast", min: -1 },
  { key: "saturation", label: "Saturation", min: -1 },
  { key: "warmth", label: "Warmth", min: -1 },
  { key: "sharpness", label: "Sharpness", min: 0 },
  { key: "vignette", label: "Vignette", min: 0 },
];

export interface FilterPreset {
  id: string;
  name: string;
  adjust: Partial<Adjustments>;
  /** 0 … 1: how far to go to black and white. */
  mono?: number;
  /** Colour a black-and-white image is toned towards (sepia). */
  tone?: [number, number, number];
  /** 0 … 1: lifts the blacks for a matte, printed look. */
  fade?: number;
}

/**
 * Deliberately restrained: each preset is a nudge a photographer would make,
 * not an effect that announces itself.
 */
export const FILTERS: FilterPreset[] = [
  { id: "original", name: "Original", adjust: {} },
  { id: "vivid", name: "Vivid", adjust: { saturation: 0.3, contrast: 0.18 } },
  { id: "warm", name: "Warm", adjust: { warmth: 0.35, saturation: 0.06 } },
  { id: "cool", name: "Cool", adjust: { warmth: -0.32, contrast: 0.05 } },
  { id: "bright", name: "Bright", adjust: { exposure: 0.28, contrast: -0.06, saturation: 0.08 } },
  { id: "soft", name: "Soft", adjust: { contrast: -0.2, warmth: 0.08, saturation: -0.05 }, fade: 0.05 },
  { id: "film", name: "Film", adjust: { contrast: 0.12, saturation: -0.18, warmth: 0.12 }, fade: 0.08 },
  { id: "mono", name: "Mono", adjust: { contrast: 0.1 }, mono: 1 },
  { id: "noir", name: "Noir", adjust: { contrast: 0.45, vignette: 0.35 }, mono: 1 },
  { id: "sepia", name: "Sepia", adjust: { contrast: 0.05 }, mono: 1, tone: [1.08, 0.97, 0.8], fade: 0.05 },
];

export function getFilter(id: string): FilterPreset {
  return FILTERS.find((f) => f.id === id) ?? FILTERS[0];
}

/** Levels measured by auto-enhance (see enhance.ts). Identity = no change. */
export interface Levels {
  black: [number, number, number];
  scale: [number, number, number];
  gamma: number;
}

export const IDENTITY_LEVELS: Levels = { black: [0, 0, 0], scale: [1, 1, 1], gamma: 1 };

export interface Look {
  filter: string;
  /** 0 … 1 */
  intensity: number;
  adjust: Adjustments;
  enhance: boolean;
}

export const DEFAULT_LOOK: Look = { filter: "original", intensity: 1, adjust: NEUTRAL, enhance: true };

/** Extra polish auto-enhance adds on top of its measured levels. */
const ENHANCE_VIBRANCE = 0.18;
const ENHANCE_SHARPEN = 0.35;

export interface Uniforms {
  black: [number, number, number];
  scale: [number, number, number];
  gamma: number;
  /** Midtone multiplier for the curve c·m / (1 + (m−1)·c). */
  exposure: number;
  contrast: number;
  vibrance: number;
  /** Column-major 3×3, as WebGL expects. */
  matrix: Float32Array;
  offset: [number, number, number];
  fade: number;
  vignette: number;
  sharpen: number;
}

const LUMA = [0.2126, 0.7152, 0.0722] as const;

type Mat3 = number[]; // row-major while composing

function multiply(a: Mat3, b: Mat3): Mat3 {
  const out = new Array(9).fill(0);
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      for (let k = 0; k < 3; k++) out[r * 3 + c] += a[r * 3 + k] * b[k * 3 + c];
  return out;
}

function saturationMatrix(s: number): Mat3 {
  // s = 1 keeps colour, 0 is grey, >1 boosts.
  const [lr, lg, lb] = LUMA;
  return [
    lr + (1 - lr) * s, lg - lg * s, lb - lb * s,
    lr - lr * s, lg + (1 - lg) * s, lb - lb * s,
    lr - lr * s, lg - lg * s, lb + (1 - lb) * s,
  ];
}

function diag(r: number, g: number, b: number): Mat3 {
  return [r, 0, 0, 0, g, 0, 0, 0, b];
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Blends a preset with the manual sliders and the measured levels. */
export function computeUniforms(look: Look, levels: Levels = IDENTITY_LEVELS): Uniforms {
  const preset = getFilter(look.filter);
  const k = clamp(look.intensity, 0, 1);
  const p = (key: keyof Adjustments) => (preset.adjust[key] ?? 0) * k;
  const a = look.adjust;

  const exposure = clamp(p("exposure") + a.exposure, -1, 1);
  const contrast = clamp(p("contrast") + a.contrast, -1, 1);
  const saturation = clamp(p("saturation") + a.saturation, -1, 1);
  const warmth = clamp(p("warmth") + a.warmth, -1, 1);
  const sharpness = clamp(p("sharpness") + a.sharpness, 0, 1);
  const vignette = clamp(p("vignette") + a.vignette, 0, 1);
  const mono = (preset.mono ?? 0) * k;
  const fade = (preset.fade ?? 0) * k;

  // Colour: saturation, blended towards (toned) black and white, then white
  // balance last so warmth still tints a mono image. Positive saturation is
  // gentler than negative so +1 is not garish.
  let m = saturationMatrix(1 + (saturation >= 0 ? saturation * 0.8 : saturation));
  if (mono > 0) {
    const tone = preset.tone ?? [1, 1, 1];
    const grey: Mat3 = [
      LUMA[0] * tone[0], LUMA[1] * tone[0], LUMA[2] * tone[0],
      LUMA[0] * tone[1], LUMA[1] * tone[1], LUMA[2] * tone[1],
      LUMA[0] * tone[2], LUMA[1] * tone[2], LUMA[2] * tone[2],
    ];
    m = m.map((v, i) => v * (1 - mono) + grey[i] * mono);
  }
  m = multiply(diag(1 + warmth * 0.1, 1 + warmth * 0.01, 1 - warmth * 0.12), m);

  // Column-major for uniformMatrix3fv (transpose must be false in WebGL 1).
  const matrix = new Float32Array([m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]]);

  return {
    black: levels.black,
    scale: levels.scale,
    gamma: levels.gamma,
    exposure: Math.pow(2, exposure * 1.2),
    contrast,
    vibrance: look.enhance ? ENHANCE_VIBRANCE : 0,
    matrix,
    offset: [0, 0, 0],
    fade,
    vignette,
    sharpen: clamp(sharpness * 1.4 + (look.enhance ? ENHANCE_SHARPEN : 0), 0, 1.6),
  };
}

/** True when a look changes nothing, so recording can skip the shader. */
export function isNeutralLook(look: Look): boolean {
  const presetNeutral = look.filter === "original" || look.intensity === 0;
  const adjustNeutral = (Object.keys(NEUTRAL) as (keyof Adjustments)[]).every((k) => look.adjust[k] === 0);
  return presetNeutral && adjustNeutral && !look.enhance;
}

/**
 * The same maths as the fragment shader, for one pixel (0 … 1 channels). Used
 * by tests and kept next to the uniforms so the two cannot drift silently.
 * Sharpening and vignette depend on neighbours / position and are left out.
 */
export function applyToPixel(rgb: [number, number, number], u: Uniforms): [number, number, number] {
  let c = rgb.map((v, i) => clamp((v - u.black[i]) * u.scale[i], 0, 1));
  c = c.map((v) => Math.pow(v, u.gamma));
  const e = u.exposure;
  c = c.map((v) => (v * e) / (1 + (e - 1) * v));
  const s = c.map((v) => v * v * (3 - 2 * v));
  c = u.contrast >= 0 ? c.map((v, i) => v + (s[i] - v) * u.contrast) : c.map((v) => v + (0.5 - v) * -u.contrast * 0.5);
  const mx = Math.max(...c);
  const mn = Math.min(...c);
  const l = c[0] * LUMA[0] + c[1] * LUMA[1] + c[2] * LUMA[2];
  const vib = 1 + u.vibrance * (1 - (mx - mn));
  c = c.map((v) => l + (v - l) * vib);
  const m = u.matrix; // column-major
  const out = [0, 1, 2].map((r) => m[r] * c[0] + m[3 + r] * c[1] + m[6 + r] * c[2] + u.offset[r]);
  return out.map((v) => clamp(u.fade + v * (1 - u.fade), 0, 1)) as [number, number, number];
}
