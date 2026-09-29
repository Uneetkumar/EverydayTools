/**
 * Draws a camera frame or photo through a look (see filters.ts) with WebGL 1.
 *
 * WebGL 1 rather than WebGL 2 or a canvas 2D `filter`: it runs on practically
 * every phone from the last decade, while canvas filters are still missing in
 * Safari. One fragment shader does everything in a single pass — five texture
 * reads per pixel — so a 720p preview stays at the camera's frame rate on
 * old GPUs, and the same code renders the full-size photo.
 */

import type { Uniforms } from "./filters";

export interface Crop {
  /** Source rectangle in 0 … 1 texture coordinates. */
  x: number;
  y: number;
  w: number;
  h: number;
}

export const FULL_CROP: Crop = { x: 0, y: 0, w: 1, h: 1 };

const VERTEX = `
attribute vec2 a_pos;
uniform vec4 u_crop;
varying vec2 v_uv;
varying vec2 v_pos;
void main() {
  v_pos = a_pos;
  v_uv = u_crop.xy + vec2(a_pos.x * 0.5 + 0.5, 0.5 - a_pos.y * 0.5) * u_crop.zw;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 v_uv;
varying vec2 v_pos;
uniform sampler2D u_image;
uniform vec2 u_texel;
uniform float u_sharpen;
uniform vec3 u_black;
uniform vec3 u_scale;
uniform float u_gamma;
uniform float u_exposure;
uniform float u_contrast;
uniform float u_vibrance;
uniform mat3 u_matrix;
uniform vec3 u_offset;
uniform float u_fade;
uniform float u_vignette;
const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

void main() {
  vec3 c = texture2D(u_image, v_uv).rgb;
  if (u_sharpen > 0.0) {
    vec3 blur = (texture2D(u_image, v_uv + vec2(u_texel.x, 0.0)).rgb
      + texture2D(u_image, v_uv - vec2(u_texel.x, 0.0)).rgb
      + texture2D(u_image, v_uv + vec2(0.0, u_texel.y)).rgb
      + texture2D(u_image, v_uv - vec2(0.0, u_texel.y)).rgb) * 0.25;
    vec3 d = c - blur;
    // Ignore differences smaller than sensor grain, so edges get crisper
    // but flat areas do not get noisier.
    d = sign(d) * max(abs(d) - 0.012, 0.0);
    c += d * u_sharpen;
  }
  c = clamp((c - u_black) * u_scale, 0.0, 1.0);
  c = pow(c, vec3(u_gamma));
  c = c * u_exposure / (1.0 + (u_exposure - 1.0) * c);
  vec3 s = c * c * (3.0 - 2.0 * c);
  c = u_contrast >= 0.0 ? mix(c, s, u_contrast) : mix(c, vec3(0.5), -u_contrast * 0.5);
  float l = dot(c, LUMA);
  float sat = max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));
  c = mix(vec3(l), c, 1.0 + u_vibrance * (1.0 - sat));
  c = u_matrix * c + u_offset;
  c = u_fade + c * (1.0 - u_fade);
  if (u_vignette > 0.0) {
    float r = length(v_pos) * 0.7071;
    c *= 1.0 - u_vignette * 0.8 * smoothstep(0.4, 1.0, r);
  }
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

type Loc = WebGLUniformLocation | null;

export class LookRenderer {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private tex: WebGLTexture | null = null;
  private loc: Record<string, Loc> = {};
  readonly maxSize: number;
  lost = false;

  private constructor(canvas: HTMLCanvasElement, gl: WebGLRenderingContext) {
    this.canvas = canvas;
    this.gl = gl;
    const dims = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array;
    this.maxSize = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE) as number, dims[0], dims[1], 8192);
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this.lost = true;
    });
    this.setup();
  }

  /** Null when WebGL is unavailable (very old browsers, or blocked by the user). */
  static create(canvas: HTMLCanvasElement, { preserve = false } = {}): LookRenderer | null {
    try {
      const gl = canvas.getContext("webgl", {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        // Needed where the result is read back with toBlob after drawing.
        preserveDrawingBuffer: preserve,
      }) as WebGLRenderingContext | null;
      return gl ? new LookRenderer(canvas, gl) : null;
    } catch {
      return null;
    }
  }

  private setup() {
    const gl = this.gl;
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? "shader");
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link");
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    for (const name of [
      "u_crop", "u_image", "u_texel", "u_sharpen", "u_black", "u_scale", "u_gamma", "u_exposure",
      "u_contrast", "u_vibrance", "u_matrix", "u_offset", "u_fade", "u_vignette",
    ]) {
      this.loc[name] = gl.getUniformLocation(prog, name);
    }

    this.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    // Camera frames are rarely a power of two: WebGL 1 then needs clamping
    // and no mipmaps.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(this.loc.u_image, 0);
  }

  /** Sets the output size in pixels, clamped to what the GPU can draw. */
  resize(width: number, height: number): { width: number; height: number } {
    const k = Math.min(1, this.maxSize / Math.max(width, height));
    const w = Math.max(1, Math.round(width * k));
    const h = Math.max(1, Math.round(height * k));
    if (this.canvas.width !== w) this.canvas.width = w;
    if (this.canvas.height !== h) this.canvas.height = h;
    return { width: w, height: h };
  }

  private srcW = 1;
  private srcH = 1;

  /** Uploads a frame or photo. Returns false if it could not be read yet. */
  upload(source: TexImageSource): boolean {
    if (this.lost) return false;
    const { width, height } = sourceSize(source);
    if (!width || !height) return false;
    const gl = this.gl;
    try {
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    } catch {
      return false;
    }
    this.srcW = width;
    this.srcH = height;
    return true;
  }

  /**
   * Draws the uploaded source into the canvas. `crop` selects part of it (for
   * a square photo, say) and `mirror` flips it for the front camera.
   */
  draw(u: Uniforms, { crop = FULL_CROP, mirror = false }: { crop?: Crop; mirror?: boolean } = {}) {
    if (this.lost) return;
    const gl = this.gl;
    const { width, height } = this.canvas;
    gl.viewport(0, 0, width, height);
    const l = this.loc;
    gl.uniform4f(l.u_crop, mirror ? crop.x + crop.w : crop.x, crop.y, mirror ? -crop.w : crop.w, crop.h);
    // One output pixel in texture units (never less than one source pixel),
    // so sharpening works at the scale the result is seen at.
    gl.uniform2f(l.u_texel, Math.max(1 / this.srcW, crop.w / width), Math.max(1 / this.srcH, crop.h / height));
    gl.uniform1f(l.u_sharpen, u.sharpen);
    gl.uniform3fv(l.u_black, u.black);
    gl.uniform3fv(l.u_scale, u.scale);
    gl.uniform1f(l.u_gamma, u.gamma);
    gl.uniform1f(l.u_exposure, u.exposure);
    gl.uniform1f(l.u_contrast, u.contrast);
    gl.uniform1f(l.u_vibrance, u.vibrance);
    gl.uniformMatrix3fv(l.u_matrix, false, u.matrix);
    gl.uniform3fv(l.u_offset, u.offset);
    gl.uniform1f(l.u_fade, u.fade);
    gl.uniform1f(l.u_vignette, u.vignette);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  render(source: TexImageSource, u: Uniforms, opts?: { crop?: Crop; mirror?: boolean }): boolean {
    if (!this.upload(source)) return false;
    this.draw(u, opts);
    return true;
  }

  /** Frees the GPU memory now rather than whenever the page is collected. */
  dispose() {
    try {
      this.gl.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      /* already gone */
    }
    this.lost = true;
  }
}

/** Pixel size of anything WebGL can upload. */
export function sourceSize(source: TexImageSource | CanvasImageSource): { width: number; height: number } {
  if (typeof HTMLVideoElement !== "undefined" && source instanceof HTMLVideoElement)
    return { width: source.videoWidth, height: source.videoHeight };
  if (typeof HTMLImageElement !== "undefined" && source instanceof HTMLImageElement)
    return { width: source.naturalWidth, height: source.naturalHeight };
  if (typeof VideoFrame !== "undefined" && source instanceof VideoFrame)
    return { width: source.displayWidth, height: source.displayHeight };
  const s = source as { width: number | SVGAnimatedLength; height: number | SVGAnimatedLength };
  return {
    width: typeof s.width === "number" ? s.width : s.width.baseVal.value,
    height: typeof s.height === "number" ? s.height : s.height.baseVal.value,
  };
}
