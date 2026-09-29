"use client";

import * as React from "react";
import {
  Camera as CameraIcon,
  Grid3x3,
  ImageUp,
  Loader2,
  Moon,
  Pause,
  Play,
  Sparkles,
  SwitchCamera,
  Timer,
  Zap,
  ZapOff,
} from "lucide-react";
import { toast } from "sonner";
import fixWebmDuration from "fix-webm-duration";
import { Button } from "@/components/ui/button";
import { Notice, Segmented, ToggleRow, ToolSection } from "@/components/tool/kit";
import { AdjustPanel, FilterPanel } from "@/components/camera/look-controls";
import { ShotGallery, formatDuration, type Shot } from "@/components/camera/shot-gallery";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { markToolCompleted, markToolError } from "@/lib/analytics";
import { downloadBlob } from "@/lib/utils/download";
import {
  DEFAULT_LOOK,
  FILTERS,
  IDENTITY_LEVELS,
  NEUTRAL,
  computeUniforms,
  type Levels,
  type Look,
} from "@/lib/camera/filters";
import { blendLevels, measureLevels, mergeFrames } from "@/lib/camera/enhance";
import { FULL_CROP, LookRenderer, type Crop } from "@/lib/camera/renderer";
import {
  SHAPES,
  canvasToBlob,
  cropForShape,
  cropPixels,
  grabFrames,
  loadPhoto,
  lowLightFrameCount,
  samplePixels,
  sampleScene,
  thumbnail,
  type Shape,
} from "@/lib/camera/capture";
import {
  QUALITY,
  applyAdvanced,
  cameraSupported,
  extensionFor,
  isLowEndDevice,
  mediaErrorMessage,
  openCamera,
  pickRecorderType,
  recorderSupported,
  stopStream,
  timestampName,
  trackFeatures,
  type Facing,
  type Quality,
  type TrackFeatures,
} from "@/lib/camera/device";
import { cn } from "@/lib/utils";

type Mode = "photo" | "video";
type Panel = "filters" | "adjust" | "settings";
type Status = "idle" | "starting" | "live" | "error";
type TimerDelay = 0 | 3 | 10;

interface Prefs {
  quality: Quality | "auto";
  shape: Shape;
  mirror: boolean;
  mic: boolean;
  grid: boolean;
  timer: TimerDelay;
  lowLight: boolean;
  mode: Mode;
}

const DEFAULT_PREFS: Prefs = {
  quality: "auto",
  shape: "full",
  mirror: true,
  mic: true,
  grid: false,
  timer: 0,
  lowLight: false,
  mode: "photo",
};

/** The live preview is drawn at most this big; photos use the full frame. */
const PREVIEW_MAX = 1920;
const MAX_PHOTO_MB = 40;

interface Editing {
  /** The shot being re-edited, or null for a photo opened from the device. */
  shotId: string | null;
  source: HTMLCanvasElement;
  original: Blob;
  name: string;
  levels: Levels;
  restoreLook: Look;
  resumeCamera: boolean;
}

interface RecordingState {
  recorder: MediaRecorder;
  chunks: Blob[];
  mime: string;
  startedAt: number;
  pausedAt: number | null;
  pausedTotal: number;
  autoPaused: boolean;
  thumb: string;
  width: number;
  height: number;
  extraTracks: MediaStreamTrack[];
}

type VideoWithFrames = HTMLVideoElement & {
  requestVideoFrameCallback?: (cb: (now: number) => void) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

/** Old saved settings may miss newer keys; fill them from the defaults. */
function normaliseLook(l: Partial<Look> | undefined): Look {
  const filter = FILTERS.some((f) => f.id === l?.filter) ? l!.filter! : DEFAULT_LOOK.filter;
  return {
    filter,
    intensity: typeof l?.intensity === "number" ? l.intensity : 1,
    enhance: typeof l?.enhance === "boolean" ? l.enhance : true,
    adjust: { ...NEUTRAL, ...(l?.adjust ?? {}) },
  };
}

const noopSubscribe = () => () => {};

function useElementSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((s) => (s.width === width && s.height === height ? s : { width, height }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

function elapsedOf(rec: RecordingState, now = Date.now()): number {
  return (now - rec.startedAt - rec.pausedTotal - (rec.pausedAt ? now - rec.pausedAt : 0)) / 1000;
}

let idCounter = 0;
const newId = () => `${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

/** Pill toggles drawn over the picture: dark glass so they read on any image. */
function OverlayToggle({
  pressed,
  onClick,
  label,
  children,
  text,
}: {
  pressed?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  text?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-full px-2 text-xs font-medium backdrop-blur-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-white/60 [&_svg]:size-4",
        pressed ? "bg-white text-neutral-900 hover:bg-white/90" : "bg-black/45 text-white hover:bg-black/60"
      )}
    >
      {children}
      {text && <span className="hidden pr-0.5 @lg:inline">{text}</span>}
    </button>
  );
}

export default function Camera() {
  const [storedLook, setStoredLook] = usePersistentState<Look>("camera-look", DEFAULT_LOOK);
  const [storedPrefs, setStoredPrefs] = usePersistentState<Prefs>("camera-prefs", DEFAULT_PREFS);
  const look = React.useMemo(() => normaliseLook(storedLook), [storedLook]);
  const prefs = React.useMemo(() => ({ ...DEFAULT_PREFS, ...storedPrefs }), [storedPrefs]);
  const setLook = setStoredLook;
  const setPref = React.useCallback(
    <K extends keyof Prefs>(key: K, value: Prefs[K]) => setStoredPrefs((p) => ({ ...DEFAULT_PREFS, ...p, [key]: value })),
    [setStoredPrefs]
  );

  const lowEnd = React.useSyncExternalStore(noopSubscribe, isLowEndDevice, () => false);
  const quality: Quality = prefs.quality === "auto" ? (lowEnd ? "standard" : "high") : prefs.quality;

  const [status, setStatus] = React.useState<Status>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [facing, setFacing] = React.useState<Facing>("environment");
  const [actualFacing, setActualFacing] = React.useState<Facing>("environment");
  const [multipleCameras, setMultipleCameras] = React.useState(false);
  const [features, setFeatures] = React.useState<TrackFeatures>({ torch: false, zoom: null });
  const [torchOn, setTorchOn] = React.useState(false);
  const [zoom, setZoom] = React.useState(1);
  const [dims, setDims] = React.useState<{ w: number; h: number } | null>(null);
  const [glFailed, setGlFailed] = React.useState(false);
  const [shots, setShots] = React.useState<Shot[]>([]);
  const [openShot, setOpenShot] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [countdown, setCountdown] = React.useState<number | null>(null);
  const [recUi, setRecUi] = React.useState<{ elapsed: number; paused: boolean } | null>(null);
  const [editing, setEditing] = React.useState<Editing | null>(null);
  const [panel, setPanel] = React.useState<Panel>("filters");
  const [thumbs, setThumbs] = React.useState<Record<string, string>>({});
  const [flash, setFlash] = React.useState(0);
  const [zipping, setZipping] = React.useState(false);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const rendererRef = React.useRef<LookRenderer | null>(null);
  const captureRef = React.useRef<LookRenderer | null>(null);
  const thumbRef = React.useRef<LookRenderer | null>(null);
  const levelsRef = React.useRef<Levels>(IDENTITY_LEVELS);
  const recRef = React.useRef<RecordingState | null>(null);
  const countdownRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeOnShowRef = React.useRef(false);
  const shotsRef = React.useRef<Shot[]>([]);
  const mountedRef = React.useRef(true);
  /** Bumped by every start, so a slower earlier start cannot win the race. */
  const startIdRef = React.useRef(0);

  const mirror = prefs.mirror && actualFacing === "user";

  // Values the render loop and async handlers read without restarting.
  const live = React.useRef({ look, prefs, mirror, quality, facing, panel });
  React.useEffect(() => {
    live.current = { look, prefs, mirror, quality, facing, panel };
  }, [look, prefs, mirror, quality, facing, panel]);
  React.useEffect(() => {
    shotsRef.current = shots;
  }, [shots]);

  const crop: Crop = dims ? cropForShape(dims.w, dims.h, prefs.shape) : FULL_CROP;
  const contentAspect = editing
    ? editing.source.width / editing.source.height
    : dims && status === "live"
      ? (dims.w * crop.w) / (dims.h * crop.h)
      : null;

  const stageSize = useElementSize(stageRef);
  const fit = React.useMemo(() => {
    const { width, height } = stageSize;
    if (!contentAspect || !width || !height) return { width: "100%", height: "100%" };
    const w = Math.min(width, height * contentAspect);
    return { width: `${Math.round(w)}px`, height: `${Math.round(w / contentAspect)}px` };
  }, [stageSize, contentAspect]);

  // ---------------------------------------------------------------- renderers

  const getCaptureRenderer = React.useCallback(() => {
    if (!captureRef.current || captureRef.current.lost) {
      captureRef.current = LookRenderer.create(document.createElement("canvas"), { preserve: true });
    }
    return captureRef.current;
  }, []);

  const getPreviewRenderer = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    if (!rendererRef.current || rendererRef.current.lost) {
      rendererRef.current = LookRenderer.create(canvas);
      if (!rendererRef.current) setGlFailed(true);
    }
    return rendererRef.current;
  }, []);

  // ------------------------------------------------------------------ camera

  const stopCamera = React.useCallback(() => {
    stopStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setTorchOn(false);
  }, []);

  const startCamera = React.useCallback(
    async (opts: { facing?: Facing; quality?: Quality } = {}) => {
      if (!cameraSupported()) {
        setStatus("error");
        setError(
          typeof window !== "undefined" && !window.isSecureContext
            ? "The camera can only be used on a secure (https) page."
            : "This browser cannot use the camera. Try an up-to-date Chrome, Safari, Edge or Firefox."
        );
        return;
      }
      stopCamera();
      const startId = ++startIdRef.current;
      setStatus("starting");
      setError(null);
      try {
        const stream = await openCamera({
          facing: opts.facing ?? live.current.facing,
          quality: opts.quality ?? live.current.quality,
        });
        if (!mountedRef.current || startId !== startIdRef.current) {
          stopStream(stream);
          return;
        }
        streamRef.current = stream;
        const track = stream.getVideoTracks()[0];
        track?.addEventListener("ended", () => {
          if (streamRef.current !== stream) return;
          setStatus("error");
          setError("The camera stopped. It may have been disconnected or taken by another app.");
        });
        const video = videoRef.current!;
        video.srcObject = stream;
        // Some browsers only report the frame size once playback has started.
        const playing = video.play().catch(() => {});
        if (!video.videoWidth) {
          await new Promise<void>((resolve) => {
            const done = () => resolve();
            video.addEventListener("loadedmetadata", done, { once: true });
            video.addEventListener("resize", done, { once: true });
            setTimeout(done, 3000);
          });
        }
        await playing;
        const settings = track?.getSettings?.() ?? {};
        const coarse = window.matchMedia?.("(pointer: coarse)").matches;
        const f = settings.facingMode;
        setActualFacing(f === "user" || f === "environment" ? f : coarse ? "environment" : "user");
        setFeatures(trackFeatures(track));
        setZoom(typeof (settings as { zoom?: number }).zoom === "number" ? (settings as { zoom: number }).zoom : 1);
        setDims({ w: video.videoWidth, h: video.videoHeight });
        levelsRef.current = IDENTITY_LEVELS;
        setStatus("live");
        navigator.mediaDevices
          .enumerateDevices?.()
          .then((d) => setMultipleCameras(d.filter((x) => x.kind === "videoinput").length > 1))
          .catch(() => {});
      } catch (err) {
        if (!mountedRef.current || startId !== startIdRef.current) return;
        setStatus("error");
        setError(mediaErrorMessage(err));
        markToolError(err instanceof DOMException && err.name === "NotAllowedError" ? "camera_denied" : "camera_failed");
      }
    },
    [stopCamera]
  );

  // Open the camera as soon as the page is on screen, the way a camera app
  // does. Not while the page is prerendered in the background, and not when
  // access was already refused: the start screen then explains how to allow it.
  React.useEffect(() => {
    let cancelled = false;
    const open = async () => {
      if (!cameraSupported()) return;
      try {
        const permission = await navigator.permissions?.query({ name: "camera" as PermissionName });
        if (permission?.state === "denied") {
          if (!cancelled) {
            setStatus("error");
            setError(mediaErrorMessage(new DOMException("", "NotAllowedError")));
          }
          return;
        }
      } catch {
        /* Not every browser can report the camera permission; just try. */
      }
      if (!cancelled && !streamRef.current) void startCamera();
    };
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      document.removeEventListener("visibilitychange", onVisible);
      void open();
    };
    if (document.visibilityState === "visible") void open();
    else document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [startCamera]);

  // Live preview: draw each new camera frame through the look.
  React.useEffect(() => {
    if (status !== "live" || editing) return;
    const video = videoRef.current as VideoWithFrames | null;
    if (!video) return;
    const renderer = getPreviewRenderer();
    let cancelled = false;
    let handle = 0;
    let lastMeasure = 0;
    let target = levelsRef.current;
    const useVfc = typeof video.requestVideoFrameCallback === "function";

    const draw = (now: number) => {
      if (cancelled) return;
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (w && h) {
        setDims((d) => (d && d.w === w && d.h === h ? d : { w, h }));
        const { look: lk, prefs: pf, mirror: mr, quality: q } = live.current;
        const c = cropForShape(w, h, pf.shape);
        if (lk.enhance) {
          if (now - lastMeasure > 400) {
            lastMeasure = now;
            try {
              target = measureLevels(samplePixels(video, c));
            } catch {
              /* frame not readable yet */
            }
          }
          levelsRef.current = blendLevels(levelsRef.current, target, 0.15);
        } else {
          levelsRef.current = IDENTITY_LEVELS;
        }
        if (renderer && !renderer.lost) {
          // Keep the size fixed while recording so the video does not change shape.
          if (!recRef.current) {
            const size = cropPixels(w, h, c, Math.min(PREVIEW_MAX, Math.max(QUALITY[q].width, QUALITY[q].height)));
            renderer.resize(size.width, size.height);
          }
          renderer.render(video, computeUniforms(lk, levelsRef.current), { crop: c, mirror: mr });
        }
      }
      schedule();
    };
    const schedule = () => {
      handle = useVfc ? video.requestVideoFrameCallback!(draw) : requestAnimationFrame(draw);
    };
    schedule();
    return () => {
      cancelled = true;
      if (useVfc) video.cancelVideoFrameCallback?.(handle);
      else cancelAnimationFrame(handle);
    };
  }, [status, editing, getPreviewRenderer]);

  // Editing a photo: redraw when the look changes.
  React.useEffect(() => {
    if (!editing) return;
    const renderer = getPreviewRenderer();
    if (!renderer) return;
    const { width, height } = cropPixels(editing.source.width, editing.source.height, FULL_CROP, PREVIEW_MAX);
    renderer.resize(width, height);
    renderer.render(editing.source, computeUniforms(look, look.enhance ? editing.levels : IDENTITY_LEVELS));
  }, [editing, look, getPreviewRenderer]);

  // Filter swatches: every filter applied to the current scene.
  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const make = () => {
      const video = videoRef.current;
      const source: CanvasImageSource | null = editing
        ? editing.source
        : status === "live" && video?.videoWidth
          ? video
          : status === "live"
            ? null
            : sampleScene();
      if (!source) return;
      if (!thumbRef.current || thumbRef.current.lost) {
        thumbRef.current = LookRenderer.create(document.createElement("canvas"), { preserve: true });
      }
      const r = thumbRef.current;
      if (!r) return;
      const small = document.createElement("canvas");
      small.width = 96;
      small.height = 96;
      const img = new Image();
      img.src = thumbnail(source, 96, !editing && live.current.mirror);
      img.decode().then(() => {
        small.getContext("2d")!.drawImage(img, 0, 0);
        const enhance = live.current.look.enhance;
        const levels = enhance ? measureLevels(samplePixels(small, FULL_CROP)) : IDENTITY_LEVELS;
        r.resize(96, 96);
        if (!r.upload(small)) return;
        const out: Record<string, string> = {};
        for (const f of FILTERS) {
          r.draw(computeUniforms({ filter: f.id, intensity: 1, adjust: NEUTRAL, enhance }, levels));
          out[f.id] = r.canvas.toDataURL("image/jpeg", 0.8);
        }
        if (mountedRef.current) setThumbs(out);
      }, () => {});
    };
    const first = setTimeout(make, status === "live" && !editing ? 800 : 0);
    if (status === "live" && !editing) {
      interval = setInterval(() => {
        if (!document.hidden && !recRef.current && live.current.panel === "filters") make();
      }, 6000);
    }
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [status, editing, look.enhance]);

  // --------------------------------------------------------------- shots

  const addShot = React.useCallback((shot: Omit<Shot, "id" | "downloaded">) => {
    setShots((prev) => {
      let name = shot.name;
      const base = name.replace(/\.[^.]+$/, "");
      const ext = name.slice(base.length);
      for (let i = 2; prev.some((s) => s.name === name); i++) name = `${base}-${i}${ext}`;
      return [{ ...shot, name, id: newId(), downloaded: false }, ...prev];
    });
    markToolCompleted();
  }, []);

  const download = React.useCallback((shot: Shot) => {
    downloadBlob(shot.blob, shot.name);
    setShots((prev) => prev.map((s) => (s.id === shot.id ? { ...s, downloaded: true } : s)));
  }, []);

  const deleteShot = React.useCallback((shot: Shot) => {
    URL.revokeObjectURL(shot.url);
    setShots((prev) => prev.filter((s) => s.id !== shot.id));
  }, []);

  const clearShots = React.useCallback(() => {
    shotsRef.current.forEach((s) => URL.revokeObjectURL(s.url));
    setShots([]);
  }, []);

  const downloadAll = React.useCallback(async () => {
    const list = shotsRef.current;
    if (list.length === 1) return download(list[0]);
    setZipping(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      for (const s of [...list].reverse()) zip.file(s.name, s.blob);
      const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
      downloadBlob(blob, `${timestampName("camera")}.zip`);
      setShots((prev) => prev.map((s) => ({ ...s, downloaded: true })));
    } catch {
      toast.error("Could not make the ZIP file. Download the photos one at a time instead.");
    } finally {
      setZipping(false);
    }
  }, [download]);

  // ------------------------------------------------------------- photo

  /** Renders a frame through a look at full size and returns the JPEG and a thumbnail. */
  const renderPhoto = React.useCallback(
    async (source: HTMLCanvasElement, c: Crop, mirrored: boolean, lk: Look, levels: Levels) => {
      const r = getCaptureRenderer();
      const size = cropPixels(source.width, source.height, c, r?.maxSize ?? 4096);
      let out: HTMLCanvasElement;
      if (r && (r.resize(size.width, size.height), r.render(source, computeUniforms(lk, levels), { crop: c, mirror: mirrored }))) {
        out = r.canvas;
      } else {
        // No WebGL: save the frame as it is.
        out = document.createElement("canvas");
        out.width = size.width;
        out.height = size.height;
        const ctx = out.getContext("2d")!;
        if (mirrored) {
          ctx.translate(size.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(source, c.x * source.width, c.y * source.height, c.w * source.width, c.h * source.height, 0, 0, size.width, size.height);
      }
      // toBlob copies the pixels when called, so the renderer can be reused.
      const blob = canvasToBlob(out, "image/jpeg", 0.92);
      const thumb = thumbnail(out, 160);
      return { blob: await blob, thumb, width: size.width, height: size.height };
    },
    [getCaptureRenderer]
  );

  /** The frame as captured (cropped and mirrored, no look), kept for re-editing. */
  const originalOf = React.useCallback(async (source: HTMLCanvasElement, c: Crop, mirrored: boolean) => {
    const w = Math.round(source.width * c.w);
    const h = Math.round(source.height * c.h);
    const out = document.createElement("canvas");
    out.width = w;
    out.height = h;
    const ctx = out.getContext("2d")!;
    if (mirrored) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(source, c.x * source.width, c.y * source.height, w, h, 0, 0, w, h);
    return canvasToBlob(out, "image/jpeg", 0.95);
  }, []);

  const takePhoto = React.useCallback(
    async ({ allowLowLight = true } = {}) => {
      const video = videoRef.current;
      if (!video || !video.videoWidth || busy) return;
      const { look: lk, prefs: pf, mirror: mr } = live.current;
      setFlash((n) => n + 1);
      try {
        let frame: HTMLCanvasElement;
        if (allowLowLight && pf.lowLight) {
          setBusy("Hold still…");
          const w = video.videoWidth;
          const h = video.videoHeight;
          const { frames, width, height } = await grabFrames(video, lowLightFrameCount(w, h));
          setBusy("Merging frames…");
          await new Promise((r) => setTimeout(r, 30)); // let the label paint
          const merged = mergeFrames(frames);
          frame = document.createElement("canvas");
          frame.width = width;
          frame.height = height;
          frame.getContext("2d")!.putImageData(new ImageData(merged as Uint8ClampedArray<ArrayBuffer>, width, height), 0, 0);
        } else {
          // Freeze the frame so every later step reads the same picture.
          frame = document.createElement("canvas");
          frame.width = video.videoWidth;
          frame.height = video.videoHeight;
          frame.getContext("2d")!.drawImage(video, 0, 0);
        }
        setBusy("Saving…");
        const c = cropForShape(frame.width, frame.height, pf.shape);
        const levels = lk.enhance ? measureLevels(samplePixels(frame, c)) : IDENTITY_LEVELS;
        // Both JPEGs encode at the same time (browsers encode off the main thread).
        const [photo, original] = await Promise.all([renderPhoto(frame, c, mr, lk, levels), originalOf(frame, c, mr)]);
        addShot({
          kind: "photo",
          blob: photo.blob,
          url: URL.createObjectURL(photo.blob),
          name: `${timestampName("photo")}.jpg`,
          width: photo.width,
          height: photo.height,
          thumb: photo.thumb,
          createdAt: Date.now(),
          source: original,
          look: lk,
        });
      } catch {
        toast.error("The photo could not be saved. Try again, or choose Standard quality in Settings.");
        markToolError("photo_failed");
      } finally {
        setBusy(null);
      }
    },
    [busy, renderPhoto, originalOf, addShot]
  );

  // --------------------------------------------------------------- video

  /**
   * A thumbnail of the current frame with the look applied. Drawn afresh: the
   * preview canvas cannot be read back, because WebGL clears it after every
   * frame it shows.
   */
  const videoThumbnail = React.useCallback(
    (video: HTMLVideoElement) => {
      const { look: lk, prefs: pf, mirror: mr } = live.current;
      const r = getCaptureRenderer();
      if (!r) return thumbnail(video, 160, mr);
      const c = cropForShape(video.videoWidth, video.videoHeight, pf.shape);
      const size = cropPixels(video.videoWidth, video.videoHeight, c, 320);
      r.resize(size.width, size.height);
      if (!r.render(video, computeUniforms(lk, levelsRef.current), { crop: c, mirror: mr })) return thumbnail(video, 160, mr);
      return thumbnail(r.canvas, 160);
    },
    [getCaptureRenderer]
  );

  const finishRecording = React.useCallback(
    async (rec: RecordingState, durationSec: number) => {
      rec.extraTracks.forEach((t) => t.stop());
      if (!rec.chunks.length) {
        toast.error("Nothing was recorded. Try again.");
        return;
      }
      let blob = new Blob(rec.chunks, { type: rec.mime.split(";")[0] || "video/webm" });
      // Chrome and Firefox write WebM without a length, so players cannot seek.
      if (blob.type.includes("webm")) {
        try {
          blob = await fixWebmDuration(blob, durationSec * 1000, { logger: false });
        } catch {
          /* still playable, just not seekable */
        }
      }
      addShot({
        kind: "video",
        blob,
        url: URL.createObjectURL(blob),
        name: `${timestampName("video")}.${extensionFor(blob.type)}`,
        width: rec.width,
        height: rec.height,
        thumb: rec.thumb,
        createdAt: Date.now(),
        duration: durationSec,
      });
    },
    [addShot]
  );

  const stopRecording = React.useCallback(() => {
    const rec = recRef.current;
    if (!rec) return;
    const duration = elapsedOf(rec);
    recRef.current = null;
    setRecUi(null);
    rec.recorder.onstop = () => void finishRecording(rec, duration);
    try {
      if (rec.recorder.state !== "inactive") rec.recorder.stop();
      else void finishRecording(rec, duration);
    } catch {
      void finishRecording(rec, duration);
    }
  }, [finishRecording]);

  const startRecording = React.useCallback(async () => {
    const stream = streamRef.current;
    const canvas = canvasRef.current;
    if (!stream || recRef.current || busy) return;
    if (!recorderSupported()) {
      toast.error("This browser cannot record video. Try an up-to-date Chrome, Safari, Edge or Firefox.");
      return;
    }
    const { prefs: pf, quality: q } = live.current;
    const extra: MediaStreamTrack[] = [];
    let audio: MediaStreamTrack | null = null;
    if (pf.mic) {
      try {
        const mic = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        audio = mic.getAudioTracks()[0] ?? null;
        if (audio) extra.push(audio);
      } catch (err) {
        toast.warning("Recording without sound", { description: mediaErrorMessage(err, "microphone") });
      }
    }
    // What you see is what is recorded: the preview canvas carries the look.
    const useCanvas = !!canvas && !!rendererRef.current && !rendererRef.current.lost;
    let videoTrack: MediaStreamTrack;
    if (useCanvas) {
      videoTrack = canvas.captureStream(30).getVideoTracks()[0];
      extra.push(videoTrack);
    } else {
      videoTrack = stream.getVideoTracks()[0];
    }
    const mime = pickRecorderType(!!audio);
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(new MediaStream(audio ? [videoTrack, audio] : [videoTrack]), {
        ...(mime ? { mimeType: mime } : {}),
        videoBitsPerSecond: QUALITY[q].bitrate,
        ...(audio ? { audioBitsPerSecond: 128_000 } : {}),
      });
    } catch {
      extra.forEach((t) => t.stop());
      toast.error("Recording could not start in this browser.");
      markToolError("record_failed");
      return;
    }
    const video = videoRef.current!;
    const width = useCanvas ? canvas.width : video.videoWidth;
    const height = useCanvas ? canvas.height : video.videoHeight;
    const rec: RecordingState = {
      recorder,
      chunks: [],
      mime: recorder.mimeType || mime,
      startedAt: Date.now(),
      pausedAt: null,
      pausedTotal: 0,
      autoPaused: false,
      thumb: videoThumbnail(video),
      width,
      height,
      extraTracks: extra,
    };
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size) rec.chunks.push(e.data);
    };
    recorder.onerror = () => {
      toast.error("Recording stopped because of an error. What was recorded so far is saved.");
      if (recRef.current === rec) stopRecording();
    };
    recRef.current = rec;
    recorder.start(1000);
    setRecUi({ elapsed: 0, paused: false });
  }, [busy, stopRecording, videoThumbnail]);

  const togglePause = React.useCallback(() => {
    const rec = recRef.current;
    if (!rec) return;
    try {
      if (rec.pausedAt) {
        rec.recorder.resume();
        rec.pausedTotal += Date.now() - rec.pausedAt;
        rec.pausedAt = null;
      } else {
        rec.recorder.pause();
        rec.pausedAt = Date.now();
      }
      rec.autoPaused = false;
      setRecUi({ elapsed: elapsedOf(rec), paused: !!rec.pausedAt });
    } catch {
      /* pause is not supported everywhere */
    }
  }, []);

  // Recording clock.
  React.useEffect(() => {
    if (!recUi) return;
    const t = setInterval(() => {
      const rec = recRef.current;
      if (rec) setRecUi({ elapsed: elapsedOf(rec), paused: !!rec.pausedAt });
    }, 250);
    return () => clearInterval(t);
  }, [recUi]);

  // ---------------------------------------------------------- shutter

  const cancelCountdown = React.useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = null;
    setCountdown(null);
  }, []);

  const withTimer = React.useCallback(
    (action: () => void) => {
      const delay = live.current.prefs.timer;
      if (!delay) return action();
      let left = delay;
      setCountdown(left);
      countdownRef.current = setInterval(() => {
        left -= 1;
        if (left <= 0) {
          cancelCountdown();
          action();
        } else {
          setCountdown(left);
        }
      }, 1000);
    },
    [cancelCountdown]
  );

  const onShutter = () => {
    if (countdown !== null) return cancelCountdown();
    if (prefs.mode === "video") {
      if (recRef.current) return stopRecording();
      return withTimer(() => void startRecording());
    }
    withTimer(() => void takePhoto());
  };

  // ------------------------------------------------------------ controls

  const toggleTorch = async () => {
    const ok = await applyAdvanced(streamRef.current?.getVideoTracks()[0], { torch: !torchOn });
    if (ok) setTorchOn(!torchOn);
    else toast.error("The light could not be switched on for this camera.");
  };

  const setHardwareZoom = async (value: number) => {
    if (await applyAdvanced(streamRef.current?.getVideoTracks()[0], { zoom: value })) setZoom(value);
  };

  const switchCamera = () => {
    const next: Facing = actualFacing === "user" ? "environment" : "user";
    setFacing(next);
    void startCamera({ facing: next });
  };

  const changeQuality = (q: Quality) => {
    setPref("quality", q);
    if (status === "live" && !recRef.current) void startCamera({ quality: q });
  };

  // ------------------------------------------------------------ editing

  const beginEdit = React.useCallback(
    (draft: Omit<Editing, "restoreLook" | "resumeCamera" | "levels">, startLook: Look) => {
      const resume = status === "live";
      stopCamera();
      if (resume) setStatus("idle");
      setEditing({
        ...draft,
        levels: measureLevels(samplePixels(draft.source, FULL_CROP)),
        restoreLook: look,
        resumeCamera: resume,
      });
      setLook(startLook);
    },
    [status, stopCamera, look, setLook]
  );

  const editShot = async (shot: Shot) => {
    if (recRef.current) return;
    try {
      const source = await loadPhoto(shot.source ?? shot.blob);
      beginEdit({ shotId: shot.id, source, original: shot.source ?? shot.blob, name: shot.name }, normaliseLook(shot.look));
    } catch {
      toast.error("This photo could not be opened for editing.");
    }
  };

  const openPhotoFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Choose a photo (JPG, PNG, WebP or HEIC where supported).");
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) return toast.error(`Choose a photo smaller than ${MAX_PHOTO_MB} MB.`);
    if (recRef.current) return;
    try {
      setBusy("Opening photo…");
      const source = await loadPhoto(file);
      const base = file.name.replace(/\.[^.]+$/, "").replace(/[^\w.-]+/g, "-").slice(0, 60) || "photo";
      beginEdit({ shotId: null, source, original: file, name: `${base}-edited.jpg` }, { ...look, filter: "original", intensity: 1, adjust: NEUTRAL });
    } catch {
      toast.error("This photo could not be opened. Your browser may not support its format.");
      markToolError("photo_open_failed");
    } finally {
      setBusy(null);
    }
  };

  const endEdit = React.useCallback(
    (ed: Editing) => {
      setEditing(null);
      setLook(ed.restoreLook);
      if (ed.resumeCamera) void startCamera();
    },
    [setLook, startCamera]
  );

  const saveEdit = async () => {
    if (!editing) return;
    const ed = editing;
    setBusy("Saving…");
    try {
      const photo = await renderPhoto(ed.source, FULL_CROP, false, look, look.enhance ? ed.levels : IDENTITY_LEVELS);
      const url = URL.createObjectURL(photo.blob);
      if (ed.shotId) {
        setShots((prev) =>
          prev.map((s) => {
            if (s.id !== ed.shotId) return s;
            URL.revokeObjectURL(s.url);
            return { ...s, blob: photo.blob, url, thumb: photo.thumb, width: photo.width, height: photo.height, look, downloaded: false };
          })
        );
        markToolCompleted();
        toast.success("Changes saved");
      } else {
        addShot({
          kind: "photo",
          blob: photo.blob,
          url,
          name: ed.name,
          width: photo.width,
          height: photo.height,
          thumb: photo.thumb,
          createdAt: Date.now(),
          source: ed.original,
          look,
        });
        toast.success("Photo added to your photos below");
      }
      endEdit(ed);
    } catch {
      toast.error("The photo could not be saved. Try again.");
    } finally {
      setBusy(null);
    }
  };

  // --------------------------------------------------------- lifecycle

  // Release the camera when the tab is hidden (saves battery, frees the
  // camera for other apps) and bring it back on return. A recording keeps
  // the camera; one drawn through the preview pauses, because hidden tabs
  // stop drawing.
  React.useEffect(() => {
    const onVisibility = () => {
      const rec = recRef.current;
      if (document.hidden) {
        if (rec) {
          if (!rec.pausedAt && rec.extraTracks.some((t) => t.kind === "video") && rec.recorder.state === "recording") {
            try {
              rec.recorder.pause();
              rec.pausedAt = Date.now();
              rec.autoPaused = true;
            } catch {
              /* ignore */
            }
          }
          return;
        }
        if (streamRef.current) {
          resumeOnShowRef.current = true;
          stopCamera();
          cancelCountdown();
        }
      } else {
        if (rec?.autoPaused && rec.pausedAt) {
          try {
            rec.recorder.resume();
            rec.pausedTotal += Date.now() - rec.pausedAt;
            rec.pausedAt = null;
            rec.autoPaused = false;
          } catch {
            /* ignore */
          }
        }
        if (resumeOnShowRef.current) {
          resumeOnShowRef.current = false;
          void startCamera();
        }
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [startCamera, stopCamera, cancelCountdown]);

  // Warn before leaving with photos or a recording that were not downloaded.
  const unsaved = shots.some((s) => !s.downloaded) || !!recUi;
  React.useEffect(() => {
    if (!unsaved) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [unsaved]);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const rec = recRef.current;
      recRef.current = null;
      if (rec) {
        try {
          rec.recorder.stop();
        } catch {
          /* ignore */
        }
        rec.extraTracks.forEach((t) => t.stop());
      }
      if (countdownRef.current) clearInterval(countdownRef.current);
      stopStream(streamRef.current);
      rendererRef.current?.dispose();
      captureRef.current?.dispose();
      thumbRef.current?.dispose();
      shotsRef.current.forEach((s) => URL.revokeObjectURL(s.url));
    };
  }, []);

  // ------------------------------------------------------------------ view

  const recording = !!recUi;
  const isLive = status === "live" && !editing;
  const latest = shots[0];
  const zoomStops = features.zoom
    ? [features.zoom.min, 2, 4, 8].filter((v, i, a) => v <= features.zoom!.max && a.indexOf(v) === i && (i === 0 || v > features.zoom!.min))
    : [];

  const shutterLabel =
    countdown !== null
      ? "Cancel timer"
      : prefs.mode === "video"
        ? recording
          ? "Stop recording"
          : "Start recording"
        : "Take photo";

  return (
    <div className="space-y-8">
      <div className="grid gap-6 @4xl:grid-cols-[minmax(0,1fr)_19rem] @5xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0 space-y-4">
          {/* Viewfinder */}
          <div
            ref={stageRef}
            className={cn(
              "relative flex w-full items-center justify-center overflow-hidden rounded-xl border bg-muted/60 dark:bg-muted/25",
              "max-h-[min(72svh,40rem)] min-h-64",
              !contentAspect && "aspect-[3/4] @xl:aspect-[4/3]"
            )}
            style={contentAspect ? { aspectRatio: String(contentAspect) } : undefined}
          >
            {/* The camera feed. Kept in the page (not display:none) because
                some browsers stop updating hidden videos. */}
            <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              aria-hidden="true"
              className={cn(
                "absolute inset-0 size-full object-contain",
                glFailed && isLive ? "opacity-100" : "pointer-events-none opacity-0",
                glFailed && mirror && "-scale-x-100"
              )}
            />
            <div className="relative" style={fit}>
              <canvas
                ref={canvasRef}
                aria-label={editing ? "Photo being edited" : "Camera preview"}
                role="img"
                className={cn("block size-full", (isLive && !glFailed) || editing ? "opacity-100" : "opacity-0")}
              />
              {prefs.grid && (isLive || editing) && (
                <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                  <div className="absolute inset-y-0 left-1/3 w-px bg-white/45 shadow-[0_0_1px_rgba(0,0,0,0.4)]" />
                  <div className="absolute inset-y-0 left-2/3 w-px bg-white/45 shadow-[0_0_1px_rgba(0,0,0,0.4)]" />
                  <div className="absolute inset-x-0 top-1/3 h-px bg-white/45 shadow-[0_0_1px_rgba(0,0,0,0.4)]" />
                  <div className="absolute inset-x-0 top-2/3 h-px bg-white/45 shadow-[0_0_1px_rgba(0,0,0,0.4)]" />
                </div>
              )}
              {flash > 0 && isLive && (
                <div
                  key={flash}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-white animate-out fade-out-0 duration-300 fill-mode-forwards motion-reduce:hidden"
                />
              )}
            </div>

            {/* Quick toggles over the picture */}
            {isLive && !recording && (
              <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
                <div className="flex gap-1.5">
                  <OverlayToggle
                    pressed={look.enhance}
                    onClick={() => setLook((l) => ({ ...normaliseLook(l), enhance: !normaliseLook(l).enhance }))}
                    label="Enhance: auto brightness, colour and sharpness"
                    text="Enhance"
                  >
                    <Sparkles aria-hidden="true" />
                  </OverlayToggle>
                  {prefs.mode === "photo" && (
                    <OverlayToggle
                      pressed={prefs.lowLight}
                      onClick={() => setPref("lowLight", !prefs.lowLight)}
                      label="Low light: merges several frames for a cleaner photo"
                      text="Low light"
                    >
                      <Moon aria-hidden="true" />
                    </OverlayToggle>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <OverlayToggle
                    pressed={prefs.timer > 0}
                    onClick={() => setPref("timer", prefs.timer === 0 ? 3 : prefs.timer === 3 ? 10 : 0)}
                    label={prefs.timer ? `Timer: ${prefs.timer} seconds` : "Timer: off"}
                  >
                    <Timer aria-hidden="true" />
                    {prefs.timer > 0 && <span className="pr-0.5 tabular-nums">{prefs.timer}s</span>}
                  </OverlayToggle>
                  <OverlayToggle pressed={prefs.grid} onClick={() => setPref("grid", !prefs.grid)} label="Grid">
                    <Grid3x3 aria-hidden="true" />
                  </OverlayToggle>
                  {features.torch && (
                    <OverlayToggle pressed={torchOn} onClick={toggleTorch} label={torchOn ? "Light: on" : "Light: off"}>
                      {torchOn ? <Zap aria-hidden="true" /> : <ZapOff aria-hidden="true" />}
                    </OverlayToggle>
                  )}
                </div>
              </div>
            )}

            {recUi && (
              <div
                role="status"
                className="absolute top-2.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/55 px-3 py-1 text-sm font-medium text-white tabular-nums backdrop-blur-sm"
              >
                <span
                  aria-hidden="true"
                  className={cn("size-2 rounded-full bg-red-500", !recUi.paused && "animate-pulse motion-reduce:animate-none")}
                />
                {recUi.paused ? "Paused" : "Recording"} {formatDuration(recUi.elapsed)}
              </div>
            )}

            {isLive && zoomStops.length > 1 && !busy && (
              <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5" role="group" aria-label="Zoom">
                {zoomStops.map((z) => (
                  <OverlayToggle key={z} pressed={Math.abs(zoom - z) < 0.05} onClick={() => setHardwareZoom(z)} label={`Zoom ${z}×`}>
                    <span className="px-0.5 tabular-nums">{Number.isInteger(z) ? z : z.toFixed(1)}×</span>
                  </OverlayToggle>
                ))}
              </div>
            )}

            {countdown !== null && (
              <div
                aria-live="assertive"
                className="pointer-events-none absolute inset-0 flex items-center justify-center text-7xl font-semibold text-white tabular-nums drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
              >
                {countdown}
              </div>
            )}

            {busy && (
              <div
                role="status"
                className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm"
              >
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {busy}
              </div>
            )}

            {editing && (
              <span className="absolute top-2.5 left-2.5 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                Editing photo
              </span>
            )}

            {/* Start, starting and error states */}
            {!editing && status !== "live" && (
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="flex max-w-sm flex-col items-center gap-4 text-center">
                  {status === "starting" ? (
                    <>
                      <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
                      <p className="text-sm text-muted-foreground" role="status">
                        Starting the camera… If your browser asks, choose Allow.
                      </p>
                    </>
                  ) : (
                    <>
                      <span className="grid size-12 place-items-center rounded-full bg-background shadow-soft ring-1 ring-border">
                        <CameraIcon className="size-5 text-muted-foreground" aria-hidden="true" />
                      </span>
                      {status === "error" && error ? (
                        <Notice tone="error" className="text-left">
                          {error}
                        </Notice>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-base font-semibold text-foreground">Take clearer photos and videos</p>
                          <p className="text-sm text-muted-foreground">
                            Your browser will ask to use the camera. Photos and videos stay on this device.
                          </p>
                        </div>
                      )}
                      <div className="flex flex-wrap justify-center gap-2">
                        <Button size="lg" onClick={() => void startCamera()}>
                          <CameraIcon aria-hidden="true" /> {status === "error" ? "Try again" : "Start camera"}
                        </Button>
                        <Button size="lg" variant="outline" onClick={() => fileRef.current?.click()}>
                          <ImageUp aria-hidden="true" /> Edit a photo
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {glFailed && isLive && (
            <Notice tone="warning">
              This browser cannot draw the filters (WebGL is turned off or unavailable), so photos and videos are saved
              without them.
            </Notice>
          )}

          {/* Capture controls */}
          {editing ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="outline" size="lg" onClick={() => endEdit(editing)} disabled={!!busy}>
                Cancel
              </Button>
              <Button size="lg" onClick={saveEdit} disabled={!!busy}>
                {editing.shotId ? "Save changes" : "Save photo"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-center">
                <Segmented
                  size="sm"
                  ariaLabel="Camera mode"
                  value={prefs.mode}
                  onChange={(m) => {
                    if (!recording) setPref("mode", m);
                  }}
                  options={[
                    { value: "photo", label: "Photo" },
                    { value: "video", label: "Video" },
                  ]}
                />
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="flex justify-start">
                  {recording ? (
                    <Button variant="outline" size="icon-lg" onClick={togglePause} aria-label={recUi?.paused ? "Resume recording" : "Pause recording"}>
                      {recUi?.paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
                    </Button>
                  ) : latest ? (
                    <button
                      type="button"
                      onClick={() => setOpenShot(latest.id)}
                      aria-label="Open your latest photo or video"
                      className="size-11 overflow-hidden rounded-lg bg-muted ring-1 ring-border outline-none transition-shadow hover:ring-foreground/25 focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={latest.thumb} alt="" className="size-full object-cover" />
                    </button>
                  ) : (
                    <Button variant="outline" size="icon-lg" onClick={() => fileRef.current?.click()} aria-label="Edit a photo from this device" title="Edit a photo">
                      <ImageUp aria-hidden="true" />
                    </Button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onShutter}
                  disabled={!isLive || (!!busy && !recording)}
                  aria-label={shutterLabel}
                  title={shutterLabel}
                  className="group grid size-16 place-items-center rounded-full border-4 border-foreground/15 bg-background outline-none transition-transform focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span
                    className={cn(
                      "block transition-all duration-200",
                      countdown !== null
                        ? "size-6 rounded-md bg-foreground/70"
                        : prefs.mode === "video"
                          ? recording
                            ? "size-6 rounded-md bg-red-600"
                            : "size-12 rounded-full bg-red-600 group-hover:bg-red-700"
                          : "size-12 rounded-full bg-primary group-hover:bg-primary/85"
                    )}
                  />
                </button>

                <div className="flex justify-end">
                  {recording ? (
                    <Button variant="outline" size="icon-lg" onClick={() => void takePhoto({ allowLowLight: false })} aria-label="Take a photo while recording" title="Take a photo">
                      <CameraIcon aria-hidden="true" />
                    </Button>
                  ) : multipleCameras && isLive ? (
                    <Button variant="outline" size="icon-lg" onClick={switchCamera} aria-label="Switch camera" title="Switch camera">
                      <SwitchCamera aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Look and settings */}
        <aside className="min-w-0 space-y-5" aria-label="Camera options">
          <Segmented
            fill
            ariaLabel="Options"
            value={panel}
            onChange={setPanel}
            options={[
              { value: "filters", label: "Filters" },
              { value: "adjust", label: "Adjust" },
              { value: "settings", label: "Settings" },
            ]}
          />
          {panel === "filters" && <FilterPanel look={look} onChange={setLook} thumbs={thumbs} />}
          {panel === "adjust" && <AdjustPanel look={look} onChange={setLook} />}
          {panel === "settings" && (
            <ToolSection title="Settings">
              <div className="space-y-4">
                <ToggleRow
                  id="cam-enhance"
                  label="Enhance"
                  description="Balances brightness and colour and sharpens edges, the way a phone's camera app does."
                  checked={look.enhance}
                  onCheckedChange={(v) => setLook((l) => ({ ...normaliseLook(l), enhance: v }))}
                />
                <ToggleRow
                  id="cam-lowlight"
                  label="Low light"
                  description="Merges several frames into one photo to cut grain in dim light. Hold still for a moment."
                  checked={prefs.lowLight}
                  onCheckedChange={(v) => setPref("lowLight", v)}
                />
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-foreground" id="cam-quality">
                    Quality
                  </p>
                  <Segmented
                    fill
                    size="sm"
                    ariaLabel="Quality"
                    value={quality}
                    onChange={(q) => changeQuality(q)}
                    options={(Object.keys(QUALITY) as Quality[]).map((q) => ({ value: q, label: QUALITY[q].label }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    {QUALITY[quality].hint}
                    {dims && isLive ? ` Camera: ${dims.w} × ${dims.h}.` : ""}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-foreground">Photo shape</p>
                  <Segmented fill size="sm" ariaLabel="Photo shape" value={prefs.shape} onChange={(s) => setPref("shape", s)} options={SHAPES} />
                </div>
                <ToggleRow
                  id="cam-mirror"
                  label="Mirror front camera"
                  description="Save selfies the way you see them in the preview."
                  checked={prefs.mirror}
                  onCheckedChange={(v) => setPref("mirror", v)}
                />
                <ToggleRow
                  id="cam-mic"
                  label="Record sound"
                  description="Uses the microphone for videos. Asked for only when you start recording."
                  checked={prefs.mic}
                  onCheckedChange={(v) => setPref("mic", v)}
                />
              </div>
            </ToolSection>
          )}
          {!editing && (
            <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
              <ImageUp aria-hidden="true" /> Edit a photo from this device
            </Button>
          )}
        </aside>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          void openPhotoFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <ShotGallery
        shots={shots}
        openId={openShot}
        onOpenChange={setOpenShot}
        onDownload={download}
        onDownloadAll={downloadAll}
        onDelete={deleteShot}
        onClear={clearShots}
        onEdit={(s) => void editShot(s)}
        zipping={zipping}
      />
    </div>
  );
}
