"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Copy, Download, ExternalLink, MapPin } from "lucide-react";
import { toast } from "sonner";
import DropZone from "@/components/ui/DropZone";
import { Button, buttonVariants } from "@/components/ui/button";
import { Notice, Stat, StatGrid, ToggleRow, ToolSection } from "@/components/tool/kit";
import { markToolCompleted, markToolError } from "@/lib/analytics";
import { copyText } from "@/lib/utils/clipboard";
import { downloadBlob } from "@/lib/utils/download";
import {
  ExifTag,
  MetadataReport,
  canStrip,
  formatCoordinate,
  readMetadata,
  stripMetadata,
} from "@/lib/media/exif";
import { cn } from "@/lib/utils";

const FORMAT_LABEL: Record<MetadataReport["format"], string> = {
  jpeg: "JPEG",
  png: "PNG",
  webp: "WebP",
  tiff: "TIFF",
  heic: "HEIC / AVIF",
  gif: "GIF",
  bmp: "BMP",
  other: "Unknown",
};

const MIME: Partial<Record<MetadataReport["format"], string>> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** Tags grouped the way a photographer reads them. Order within a group is display order. */
const GROUPS: { title: string; names: string[] }[] = [
  {
    title: "Camera and lens",
    names: ["Camera make", "Camera model", "Lens make", "Lens model", "Lens specification", "Camera serial number", "Lens serial number", "Camera owner"],
  },
  {
    title: "Exposure",
    names: [
      "Exposure time",
      "F-number",
      "ISO",
      "Focal length",
      "Focal length (35 mm)",
      "Exposure compensation",
      "Exposure program",
      "Exposure mode",
      "Metering mode",
      "Flash",
      "White balance",
      "Scene type",
    ],
  },
  {
    title: "Date and time",
    names: ["Date taken", "Date digitized", "Date modified", "Time zone (taken)", "Time zone", "GPS date", "GPS time (UTC)"],
  },
  {
    title: "Image",
    names: [
      "Pixel width",
      "Pixel height",
      "Orientation",
      "X resolution",
      "Resolution unit",
      "Colour space",
      "Software",
      "Artist",
      "Copyright",
      "Image description",
      "User comment",
      "Unique image ID",
      "EXIF version",
    ],
  },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** EXIF writes "2024:05:12 14:03:22" in the camera's local time, with no zone. */
function formatExifDate(v: string): string {
  const m = v.match(/^(\d{4}):(\d{2}):(\d{2})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) return v;
  const [, y, mo, d, h, mi, s] = m;
  const month = MONTHS[Number(mo) - 1];
  if (!month) return v;
  const date = `${Number(d)} ${month} ${y}`;
  return h ? `${date}, ${h}:${mi}${s ? `:${s}` : ""}` : date;
}

function displayValue(tag: ExifTag): string {
  if (["Date taken", "Date digitized", "Date modified", "GPS date"].includes(tag.name)) return formatExifDate(tag.value);
  return tag.value;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

interface Loaded {
  file: File;
  bytes: Uint8Array;
  report: MetadataReport;
  previewUrl: string;
  thumbUrl: string | null;
}

export default function ExifViewer() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);
  const [keepOrientation, setKeepOrientation] = useState(true);

  // Object URLs are released when the photo changes or the tool unmounts.
  useEffect(() => {
    if (!loaded) return;
    return () => {
      URL.revokeObjectURL(loaded.previewUrl);
      if (loaded.thumbUrl) URL.revokeObjectURL(loaded.thumbUrl);
    };
  }, [loaded]);

  const handleFile = async (file: File) => {
    setReading(true);
    setReadError(null);
    setDims(null);
    setPreviewFailed(false);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const report = readMetadata(bytes);
      if (report.format === "other") {
        setLoaded(null);
        setReadError(`"${file.name}" isn't a photo format that carries metadata. Choose a JPG, PNG, WebP, HEIC or TIFF file.`);
        markToolError("unsupported_format");
        return;
      }
      setLoaded({
        file,
        bytes,
        report,
        previewUrl: URL.createObjectURL(file),
        thumbUrl: report.thumbnail ? URL.createObjectURL(report.thumbnail) : null,
      });
      markToolCompleted();
    } catch {
      setLoaded(null);
      setReadError("This file could not be read. It may be damaged, or not an image.");
      markToolError("read_failed");
    } finally {
      setReading(false);
    }
  };

  const clear = () => {
    setLoaded(null);
    setDims(null);
    setReadError(null);
  };

  const report = loaded?.report;
  const byName = useMemo(() => new Map((report?.tags ?? []).map((t) => [t.name, t])), [report]);
  const get = (name: string) => byName.get(name);

  const findings = useMemo(() => {
    if (!report) return [];
    const list: { label: string; detail: string; sensitive: boolean }[] = [];
    if (report.gps) {
      list.push({
        label: "Location",
        detail: `${report.gps.lat.toFixed(5)}, ${report.gps.lon.toFixed(5)}: accurate enough to show the building the photo was taken in.`,
        sensitive: true,
      });
    }
    const serials = ["Camera serial number", "Lens serial number"].filter((n) => byName.has(n));
    if (serials.length) {
      list.push({ label: "Serial number", detail: "Links every photo from this camera to the same device.", sensitive: true });
    }
    const names = ["Artist", "Camera owner", "Copyright"].map((n) => byName.get(n)?.value).filter(Boolean);
    if (names.length) list.push({ label: "Name", detail: [...new Set(names)].join(" · "), sensitive: true });
    if (report.thumbnail) {
      list.push({
        label: "Embedded preview",
        detail: "A small copy of the photo. Some editors don't update it after cropping, so it can show the original.",
        sensitive: false,
      });
    }
    const taken = byName.get("Date taken") ?? byName.get("Date modified");
    if (taken) list.push({ label: "Date and time", detail: formatExifDate(taken.value), sensitive: false });
    const camera = [byName.get("Camera make")?.value, byName.get("Camera model")?.value].filter(Boolean).join(" ");
    if (camera) list.push({ label: "Camera", detail: camera, sensitive: false });
    if (byName.has("Software")) list.push({ label: "Software", detail: byName.get("Software")!.value, sensitive: false });
    if (report.hasXmp) list.push({ label: "XMP data", detail: "Editing details written by apps such as Lightroom or Photoshop.", sensitive: false });
    if (report.hasIptc) list.push({ label: "IPTC data", detail: "Captions, keywords or credits added by a photo manager.", sensitive: false });
    for (const c of report.comments.slice(0, 3)) list.push({ label: "Text", detail: c, sensitive: false });
    return list;
  }, [report, byName]);

  const hasMetadata = !!report && (report.tags.length > 0 || report.hasXmp || report.hasIptc || report.comments.length > 0);
  const strippable = !!report && canStrip(report.format);

  const baseName = loaded ? loaded.file.name.replace(/\.[^.]+$/, "") : "photo";

  const handleStrip = () => {
    if (!loaded || !report) return;
    try {
      const clean = stripMetadata(loaded.bytes, keepOrientation);
      const ext = loaded.file.name.match(/\.[^.]+$/)?.[0] ?? `.${report.format === "jpeg" ? "jpg" : report.format}`;
      const blob = new Blob([clean as BlobPart], { type: MIME[report.format] ?? loaded.file.type });
      downloadBlob(blob, `${baseName}-no-metadata${ext}`);
      const saved = loaded.bytes.length - clean.length;
      toast.success("Metadata removed", {
        description: saved > 0 ? `${formatBytes(saved)} of metadata taken out. Image data is unchanged.` : "Image data is unchanged.",
      });
      markToolCompleted();
    } catch {
      toast.error("Could not remove the metadata from this file.");
      markToolError("strip_failed");
    }
  };

  const asJson = () => {
    if (!report || !loaded) return "";
    const obj: Record<string, unknown> = {
      file: loaded.file.name,
      format: FORMAT_LABEL[report.format],
      size: loaded.file.size,
      ...(dims ? { width: dims.w, height: dims.h } : {}),
    };
    for (const t of report.tags) obj[`${t.ifd}.${t.name}`] = displayValue(t);
    if (report.gps) obj.location = { latitude: report.gps.lat, longitude: report.gps.lon, altitude: report.gps.altitude };
    return JSON.stringify(obj, null, 2);
  };

  const handleCopyJson = async () => {
    if (await copyText(asJson())) toast.success("Metadata copied as JSON");
  };

  if (!loaded) {
    return (
      <div className="space-y-4">
        <DropZone
          onFileSelect={handleFile}
          accept="image/*,.heic,.heif,.avif,.tif,.tiff"
          maxSizeMB={50}
          title="Drop a photo to read its metadata"
          subtitle="Read on your device. The photo is never uploaded."
          supportedFormatsText="JPG, PNG, WebP, HEIC, TIFF"
          isProcessing={reading}
        />
        {readError && <Notice tone="error">{readError}</Notice>}
      </div>
    );
  }

  const r = report!;

  return (
    <div className="space-y-8">
      <DropZone onFileSelect={handleFile} selectedFile={loaded.file} onClear={clear} />

      <div className="grid gap-6 @3xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Preview and file facts */}
        <div className="space-y-4">
          <div className="flex min-h-48 items-center justify-center overflow-hidden rounded-xl border bg-muted/40 p-2">
            {previewFailed ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                This browser can&apos;t display {FORMAT_LABEL[r.format]} images, but the metadata below was read from the file.
              </p>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={loaded.previewUrl}
                alt={`Preview of ${loaded.file.name}`}
                className="max-h-80 w-auto rounded-md object-contain"
                onLoad={(e) => setDims({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                onError={() => setPreviewFailed(true)}
              />
            )}
          </div>
          <StatGrid className="@xl:grid-cols-2">
            <Stat label="Format" value={FORMAT_LABEL[r.format]} />
            <Stat label="File size" value={formatBytes(loaded.file.size)} />
            <Stat
              label="Dimensions"
              value={
                dims
                  ? `${dims.w} × ${dims.h}`
                  : get("Pixel width") && get("Pixel height")
                    ? `${get("Pixel width")!.value} × ${get("Pixel height")!.value}`
                    : "—"
              }
              hint={dims ? `${((dims.w * dims.h) / 1e6).toFixed(1)} megapixels` : undefined}
            />
            <Stat label="Metadata found" value={r.metadataBytes ? formatBytes(r.metadataBytes) : "None"} />
          </StatGrid>
        </div>

        {/* What the file reveals, and removing it */}
        <ToolSection
          title="What this photo reveals"
          description={findings.length ? "Anyone you send the original file to can read these details." : undefined}
          actions={
            r.tags.length > 0 ? (
              <Button variant="ghost" size="sm" onClick={handleCopyJson}>
                <Copy aria-hidden="true" /> Copy as JSON
              </Button>
            ) : undefined
          }
        >
          {hasMetadata && findings.length === 0 ? (
            <Notice tone="success">
              Only technical details are stored, such as orientation or resolution. Nothing that identifies you, your camera
              or where the photo was taken.
            </Notice>
          ) : hasMetadata ? (
            <ul className="divide-y rounded-xl border">
              {findings.map((f, i) => (
                <li key={i} className="flex gap-3 px-4 py-3">
                  <span
                    aria-hidden="true"
                    className={cn("mt-1.5 size-2 shrink-0 rounded-full", f.sensitive ? "bg-warning" : "bg-muted-foreground/40")}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {f.label}
                      {f.sensitive && <span className="ml-2 text-xs font-normal text-warning">Personal</span>}
                    </p>
                    <p className="mt-0.5 break-words text-sm text-muted-foreground">{f.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Notice>
              No EXIF, XMP or IPTC metadata in this file. That is normal for screenshots, most PNGs, and photos saved from
              social networks, which remove metadata when you upload.
            </Notice>
          )}

          {findings.length > 0 && strippable && (
            <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
              <p className="text-sm text-foreground">
                Remove the metadata and keep the image exactly as it is. The picture data is copied byte for byte, so there
                is no quality loss.
              </p>
              {r.orientation > 1 && (
                <ToggleRow
                  id="exif-keep-orientation"
                  label="Keep orientation"
                  description="Without it this photo would appear sideways or upside down."
                  checked={keepOrientation}
                  onCheckedChange={setKeepOrientation}
                />
              )}
              <Button onClick={handleStrip}>
                <Download aria-hidden="true" /> Download without metadata
              </Button>
            </div>
          )}
          {findings.length > 0 && !strippable && (
            <Notice>
              Lossless removal works on JPEG, PNG and WebP files. Convert this {FORMAT_LABEL[r.format]} file to JPG first,
              then remove its metadata here.
            </Notice>
          )}
        </ToolSection>
      </div>

      {r.gps && (
        <ToolSection title="Location">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border px-4 py-3">
            <div className="flex min-w-0 items-start gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0 text-sm">
                <p className="font-medium text-foreground tabular-nums">
                  {r.gps.lat.toFixed(6)}, {r.gps.lon.toFixed(6)}
                </p>
                <p className="text-muted-foreground">
                  {formatCoordinate(r.gps.lat, "lat")} · {formatCoordinate(r.gps.lon, "lon")}
                  {r.gps.altitude !== undefined ? ` · ${Math.round(r.gps.altitude)} m altitude` : ""}
                </p>
              </div>
            </div>
            <a
              href={`https://www.openstreetmap.org/?mlat=${r.gps.lat.toFixed(6)}&mlon=${r.gps.lon.toFixed(6)}#map=16/${r.gps.lat.toFixed(6)}/${r.gps.lon.toFixed(6)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Open in OpenStreetMap <ExternalLink aria-hidden="true" />
            </a>
          </div>
        </ToolSection>
      )}

      {r.tags.length > 0 && (
        <div className="grid gap-x-8 gap-y-8 @3xl:grid-cols-2">
          {GROUPS.map((group) => {
            const rows = group.names.map((n) => byName.get(n)).filter((t): t is ExifTag => !!t);
            if (!rows.length) return null;
            return (
              <ToolSection key={group.title} title={group.title}>
                <dl className="divide-y rounded-xl border">
                  {rows.map((t) => (
                    <div key={t.name} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 px-4 py-2.5 text-sm">
                      <dt className="text-muted-foreground">{t.name}</dt>
                      <dd className="break-words text-foreground tabular-nums">{displayValue(t)}</dd>
                    </div>
                  ))}
                </dl>
              </ToolSection>
            );
          })}
        </div>
      )}

      {loaded.thumbUrl && (
        <ToolSection
          title="Embedded preview"
          description="The small copy stored inside the file. Compare it with the photo above: if you cropped the photo and this still shows the full frame, the original is recoverable from this file."
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={loaded.thumbUrl} alt="Thumbnail embedded in the photo's EXIF data" className="max-h-40 rounded-md border" />
        </ToolSection>
      )}

      {r.tags.length > 0 && (
        <details className="group rounded-xl border">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-foreground marker:hidden">
            All tags ({r.tags.length})
            <span className="ml-2 text-muted-foreground group-open:hidden">Show</span>
            <span className="ml-2 hidden text-muted-foreground group-open:inline">Hide</span>
          </summary>
          <div className="overflow-x-auto border-t">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">Group</th>
                  <th scope="col" className="px-4 py-2 font-medium">Tag</th>
                  <th scope="col" className="px-4 py-2 font-medium">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {r.tags.map((t) => (
                  <tr key={`${t.ifd}-${t.id}`}>
                    <td className="px-4 py-2 text-muted-foreground">{t.ifd}</td>
                    <td className="px-4 py-2 text-foreground">
                      {t.name}
                      <span className="ml-1.5 font-mono text-xs text-muted-foreground">0x{t.id.toString(16).padStart(4, "0")}</span>
                    </td>
                    <td className="px-4 py-2 break-all text-foreground">{displayValue(t)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
