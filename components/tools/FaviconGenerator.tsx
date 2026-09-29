"use client";

import React, { useEffect, useId, useMemo, useState } from "react";
import JSZip from "jszip";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import DropZone from "@/components/ui/DropZone";
import { Chips, Field, Segmented, TextInput, ToolDivider, ToolSection } from "@/components/tool/kit";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { copyText } from "@/lib/utils/clipboard";
import { downloadBlob } from "@/lib/utils/download";
import { markToolCompleted, markToolError } from "@/lib/analytics";
import { drawIcon, encodeIco, headTags, manifest, textSource, toPng, type IconStyle, type Shape } from "@/lib/image/favicon";
import { cn } from "@/lib/utils";

/** Every size as a separate PNG, for platforms that ask for a specific one. */
const PNG_SIZES = [16, 32, 48, 64, 128, 180, 192, 256, 512];
/** W3C maskable safe zone: the logo must fit a circle of 40% radius, so a square logo needs ~22% padding. */
const MASKABLE_PADDING = 0.22;

interface Settings {
  background: string;
  shape: Shape;
  padding: number;
  name: string;
  themeColor: string;
  text: string;
  textColor: string;
}

const DEFAULTS: Settings = {
  background: "transparent",
  shape: "square",
  padding: 0,
  name: "",
  themeColor: "#ffffff",
  text: "T",
  textColor: "#ffffff",
};

/** The solid colour to use where transparency isn't allowed (Apple, maskable). */
const solid = (bg: string) => (bg === "transparent" ? "#ffffff" : bg);

export default function FaviconGenerator() {
  const id = useId();
  const [source, setSource] = useState<"image" | "text">("image");
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [svgText, setSvgText] = useState<string | null>(null);
  const [stored, setSettings] = usePersistentState<Settings>("favicon-settings", DEFAULTS);
  const s = useMemo(() => ({ ...DEFAULTS, ...stored }), [stored]);
  const [previews, setPreviews] = useState<{ tab: string; apple: string; mask: string; sizes: { size: number; url: string }[] } | null>(null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setSettings({ ...s, [k]: v });

  // Load the chosen image; SVGs are also kept as text for icon.svg.
  useEffect(() => {
    let live = true;
    if (!file) {
      Promise.resolve().then(() => {
        if (!live) return;
        setImg(null);
        setSvgText(null);
      });
      return () => {
        live = false;
      };
    }
    const url = URL.createObjectURL(file);
    const el = new Image();
    el.onload = () => live && setImg(el);
    el.onerror = () => {
      if (!live) return;
      toast.error("This image couldn't be opened. Try a PNG, JPG or SVG.");
      markToolError("favicon_image_load");
    };
    el.src = url;
    const isSvg = file.type === "image/svg+xml" || /\.svg$/i.test(file.name);
    if (isSvg) file.text().then((t) => live && setSvgText(t));
    else Promise.resolve().then(() => live && setSvgText(null));
    return () => {
      live = false;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const src = useMemo(() => {
    if (source === "text") return s.text.trim() ? textSource(s.text, s.textColor) : null;
    return img;
  }, [source, s.text, s.textColor, img]);
  const vector = source === "image" && !!svgText;

  // For text icons a transparent background would leave white letters invisible.
  const style: IconStyle = useMemo(
    () => ({ background: source === "text" && s.background === "transparent" ? "#2563eb" : s.background, padding: s.padding, shape: s.shape }),
    [source, s.background, s.padding, s.shape]
  );
  const appleStyle: IconStyle = { background: solid(style.background), padding: Math.max(style.padding, 0.08), shape: "square" };
  const maskStyle: IconStyle = { background: solid(style.background), padding: Math.max(style.padding, MASKABLE_PADDING), shape: "square" };

  // Previews, redrawn shortly after a change.
  useEffect(() => {
    if (!src) {
      Promise.resolve().then(() => setPreviews(null));
      return;
    }
    const t = window.setTimeout(() => {
      setPreviews({
        tab: drawIcon(src, 32, style, vector).toDataURL(),
        apple: drawIcon(src, 180, { background: solid(style.background), padding: Math.max(style.padding, 0.08), shape: "square" }, vector).toDataURL(),
        mask: drawIcon(src, 192, { background: solid(style.background), padding: Math.max(style.padding, MASKABLE_PADDING), shape: "square" }, vector).toDataURL(),
        sizes: PNG_SIZES.map((size) => ({ size, url: drawIcon(src, size, style, vector).toDataURL() })),
      });
    }, 80);
    return () => window.clearTimeout(t);
  }, [src, style, vector]);

  const tags = headTags({ svg: vector, themeColor: s.themeColor });

  const downloadZip = async () => {
    if (!src) return;
    setBusy(true);
    try {
      const zip = new JSZip();
      const png = async (size: number, st: IconStyle) => new Uint8Array(await (await toPng(drawIcon(src, size, st, vector))).arrayBuffer());
      const icoImages = await Promise.all([16, 32, 48].map(async (size) => ({ size, png: await png(size, style) })));
      zip.file("favicon.ico", encodeIco(icoImages));
      if (svgText) zip.file("icon.svg", svgText);
      zip.file("apple-touch-icon.png", await png(180, appleStyle));
      zip.file("icon-192.png", await png(192, style));
      zip.file("icon-512.png", await png(512, style));
      zip.file("icon-maskable-512.png", await png(512, maskStyle));
      zip.file("site.webmanifest", manifest({ name: s.name, themeColor: s.themeColor, backgroundColor: solid(style.background) }));
      for (const size of PNG_SIZES) zip.file(`png/favicon-${size}x${size}.png`, await png(size, style));
      zip.file(
        "README.txt",
        [
          "Put these files at the root of your site (so /favicon.ico works), then add to <head>:",
          "",
          tags,
          "",
          "The png/ folder has every size separately, in case a platform asks for one.",
        ].join("\n")
      );
      downloadBlob(await zip.generateAsync({ type: "blob" }), "favicons.zip");
      markToolCompleted();
    } catch {
      toast.error("The icons couldn't be packed. Try again.");
      markToolError("favicon_zip");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <Segmented
        ariaLabel="Make the icon from"
        value={source}
        onChange={setSource}
        options={[
          { value: "image", label: "From a logo" },
          { value: "text", label: "From text or emoji" },
        ]}
      />

      {source === "image" ? (
        <DropZone
          onFileSelect={setFile}
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
          maxSizeMB={20}
          title="Drop your logo here or choose it"
          subtitle="A square SVG, or a PNG of at least 512×512, gives the sharpest result. Nothing is uploaded."
          supportedFormatsText="SVG, PNG, JPG, WebP"
          selectedFile={file}
          onClear={() => setFile(null)}
        />
      ) : (
        <div className="grid gap-4 @md:grid-cols-[1fr_auto]">
          <Field label="Letters or emoji" htmlFor={`${id}-text`} hint="One to three characters read best at 16 pixels.">
            <TextInput id={`${id}-text`} value={s.text} maxLength={8} onChange={(e) => set("text", e.target.value)} className="text-lg" />
          </Field>
          <Field label="Text colour" htmlFor={`${id}-tc`}>
            <input id={`${id}-tc`} type="color" value={s.textColor} onChange={(e) => set("textColor", e.target.value)} className="h-10 w-16 cursor-pointer rounded-lg border bg-background p-1" />
          </Field>
        </div>
      )}

      <ToolSection title="Style">
        <div className="grid gap-4 @lg:grid-cols-2">
          <Field label="Background">
            <div className="flex flex-wrap items-center gap-2">
              <Chips
                ariaLabel="Background"
                value={["transparent", "#ffffff", "#0f172a"].includes(s.background) ? s.background : "custom"}
                onChange={(v) => v !== "custom" && set("background", v)}
                options={[
                  { value: "transparent", label: "None" },
                  { value: "#ffffff", label: "White" },
                  { value: "#0f172a", label: "Dark" },
                  { value: "custom", label: "Colour" },
                ]}
              />
              <input
                aria-label="Background colour"
                type="color"
                value={s.background === "transparent" ? "#2563eb" : s.background}
                onChange={(e) => set("background", e.target.value)}
                className="h-8 w-12 cursor-pointer rounded-md border bg-background p-0.5"
              />
            </div>
          </Field>
          <Field label="Shape">
            <Segmented
              size="sm"
              ariaLabel="Shape"
              value={s.shape}
              onChange={(v) => set("shape", v)}
              options={[
                { value: "square", label: "Square" },
                { value: "rounded", label: "Rounded" },
                { value: "circle", label: "Circle" },
              ]}
            />
          </Field>
        </div>
        <Field label={`Padding: ${Math.round(s.padding * 100)}%`} htmlFor={`${id}-pad`} hint="Space around the logo. Small icons usually look best with little or none.">
          <input
            id={`${id}-pad`}
            type="range"
            min={0}
            max={0.3}
            step={0.01}
            value={s.padding}
            onChange={(e) => set("padding", Number(e.target.value))}
            className="w-full accent-primary"
          />
        </Field>
        <div className="grid gap-4 @lg:grid-cols-[1fr_auto]">
          <Field label="Site or app name" htmlFor={`${id}-name`} hint="Used in the web app manifest.">
            <TextInput id={`${id}-name`} value={s.name} onChange={(e) => set("name", e.target.value)} placeholder="My site" />
          </Field>
          <Field label="Theme colour" htmlFor={`${id}-theme`}>
            <input id={`${id}-theme`} type="color" value={s.themeColor} onChange={(e) => set("themeColor", e.target.value)} className="h-10 w-16 cursor-pointer rounded-lg border bg-background p-1" />
          </Field>
        </div>
      </ToolSection>

      <ToolDivider />

      <ToolSection title="Preview">
        {!previews ? (
          <p className="text-sm text-muted-foreground">{source === "image" ? "Choose a logo to see your icons." : "Type a letter or emoji."}</p>
        ) : (
          <>
            <div className="grid gap-3 @lg:grid-cols-3">
              <figure className="space-y-2 rounded-lg border p-3">
                <div className="space-y-1.5">
                  {[
                    ["bg-white text-neutral-800", "Light tab"],
                    ["bg-neutral-800 text-neutral-100", "Dark tab"],
                  ].map(([cls, label]) => (
                    <div key={label} className={cn("flex items-center gap-2 rounded-t-lg px-3 py-2 text-xs shadow-sm ring-1 ring-black/10", cls)}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL */}
                      <img src={previews.tab} alt="" width={16} height={16} />
                      <span className="truncate">{s.name || "My site"}</span>
                    </div>
                  ))}
                </div>
                <figcaption className="text-xs text-muted-foreground">Browser tab, 16 px</figcaption>
              </figure>
              <figure className="space-y-2 rounded-lg border p-3">
                <div className="flex h-[88px] items-center justify-center rounded-lg bg-gradient-to-br from-sky-200 to-indigo-300">
                  {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL */}
                  <img src={previews.apple} alt="" width={60} height={60} className="rounded-[14px] shadow-md" />
                </div>
                <figcaption className="text-xs text-muted-foreground">iPhone home screen (iOS rounds the corners)</figcaption>
              </figure>
              <figure className="space-y-2 rounded-lg border p-3">
                <div className="flex h-[88px] items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                  {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL */}
                  <img src={previews.mask} alt="" width={60} height={60} className="rounded-full shadow-md" />
                </div>
                <figcaption className="text-xs text-muted-foreground">Android installed app (round crop)</figcaption>
              </figure>
            </div>
            <div className="grid grid-cols-3 gap-2 @md:grid-cols-5 @2xl:grid-cols-9">
              {previews.sizes.map((p) => (
                <a
                  key={p.size}
                  href={p.url}
                  download={`favicon-${p.size}x${p.size}.png`}
                  className="flex flex-col items-center gap-1.5 rounded-lg border bg-muted/30 p-2.5 transition-colors hover:border-primary/40"
                  title={`Download ${p.size}×${p.size} PNG`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL */}
                  <img
                    src={p.url}
                    alt={`${p.size} by ${p.size} icon`}
                    width={Math.min(p.size, 48)}
                    height={Math.min(p.size, 48)}
                    style={{ imageRendering: p.size <= 32 ? "pixelated" : "auto" }}
                  />
                  <span className="font-mono text-xs text-muted-foreground">{p.size}px</span>
                </a>
              ))}
            </div>
            {style.background === "transparent" && (
              <p className="text-xs text-muted-foreground">
                The Apple and Android icons get a white background, because those platforms don&apos;t allow transparency. Pick a background colour
                to change it.
              </p>
            )}
          </>
        )}
      </ToolSection>

      <ToolSection title="Download">
        <ul className="grid gap-1 text-sm text-muted-foreground @md:grid-cols-2">
          <li><code className="text-foreground">favicon.ico</code> — 16, 32 and 48 px in one file</li>
          {vector && <li><code className="text-foreground">icon.svg</code> — your SVG, sharp at any size</li>}
          <li><code className="text-foreground">apple-touch-icon.png</code> — 180 px, solid background</li>
          <li><code className="text-foreground">icon-192.png</code>, <code className="text-foreground">icon-512.png</code> — for the manifest</li>
          <li><code className="text-foreground">icon-maskable-512.png</code> — padded for Android</li>
          <li><code className="text-foreground">site.webmanifest</code> and a <code className="text-foreground">png/</code> folder with every size</li>
        </ul>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-muted-foreground">Add to your page&apos;s &lt;head&gt;</h4>
            <Button
              variant="ghost"
              size="xs"
              onClick={async () => {
                if (await copyText(tags)) toast.success("Tags copied");
              }}
            >
              <Copy aria-hidden="true" /> Copy
            </Button>
          </div>
          <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-3.5 font-mono text-xs leading-relaxed text-foreground">{tags}</pre>
        </div>
        <div className="flex justify-end">
          <Button size="lg" onClick={downloadZip} disabled={!src || busy}>
            <Download aria-hidden="true" /> {busy ? "Packing…" : "Download all as ZIP"}
          </Button>
        </div>
      </ToolSection>
    </div>
  );
}
