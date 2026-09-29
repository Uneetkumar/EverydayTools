"use client";

import * as React from "react";
import { Download, FolderDown, Pencil, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { ToolSection } from "@/components/tool/kit";
import type { Look } from "@/lib/camera/filters";

export interface Shot {
  id: string;
  kind: "photo" | "video";
  blob: Blob;
  url: string;
  /** File name including the extension. */
  name: string;
  width: number;
  height: number;
  /** Small square JPEG data URL. */
  thumb: string;
  createdAt: number;
  /** Seconds, for videos. */
  duration?: number;
  /** Photos: the frame before the look was applied, so it can be re-edited. */
  source?: Blob;
  look?: Look;
  downloaded: boolean;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(h ? 2 : 1, "0");
  return `${h ? `${h}:` : ""}${mm}:${String(s % 60).padStart(2, "0")}`;
}

const TIME = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" });

export function ShotGallery({
  shots,
  openId,
  onOpenChange,
  onDownload,
  onDownloadAll,
  onDelete,
  onClear,
  onEdit,
  zipping,
}: {
  shots: Shot[];
  openId: string | null;
  onOpenChange: (id: string | null) => void;
  onDownload: (shot: Shot) => void;
  onDownloadAll: () => void;
  onDelete: (shot: Shot) => void;
  onClear: () => void;
  onEdit: (shot: Shot) => void;
  zipping: boolean;
}) {
  const [confirmClear, setConfirmClear] = React.useState(false);
  const open = shots.find((s) => s.id === openId) ?? null;
  const unsaved = shots.filter((s) => !s.downloaded).length;
  const total = shots.reduce((n, s) => n + s.blob.size, 0);

  return (
    <ToolSection
      title={shots.length ? `Your photos and videos (${shots.length})` : "Your photos and videos"}
      description={
        shots.length
          ? `${formatBytes(total)} in this tab. They stay on this device and are cleared when you leave the page, so download the ones you want to keep.`
          : undefined
      }
      actions={
        shots.length > 0 ? (
          <>
            <Button variant="ghost" size="sm" onClick={() => (unsaved ? setConfirmClear(true) : onClear())}>
              <Trash2 aria-hidden="true" /> Clear
            </Button>
            <Button variant="outline" size="sm" onClick={onDownloadAll} disabled={zipping}>
              <FolderDown aria-hidden="true" /> {zipping ? "Preparing…" : shots.length > 1 ? "Download all (ZIP)" : "Download"}
            </Button>
          </>
        ) : undefined
      }
    >
      {shots.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          Photos and videos you take appear here. Nothing is uploaded.
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-2 @md:grid-cols-4 @2xl:grid-cols-6 @4xl:grid-cols-8">
          {shots.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onOpenChange(s.id)}
                className="group relative block aspect-square w-full overflow-hidden rounded-lg bg-muted ring-1 ring-border outline-none transition-shadow hover:ring-foreground/25 focus-visible:ring-3 focus-visible:ring-ring/50"
                aria-label={`${s.kind === "video" ? "Video" : "Photo"} taken at ${TIME.format(s.createdAt)}${s.downloaded ? ", downloaded" : ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.thumb} alt="" className="size-full object-cover" draggable={false} />
                {s.kind === "video" && (
                  <span className="absolute bottom-1 left-1 inline-flex items-center gap-0.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white tabular-nums">
                    <Play className="size-2.5 fill-current" aria-hidden="true" />
                    {formatDuration(s.duration ?? 0)}
                  </span>
                )}
                {s.downloaded && (
                  <span className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white" aria-hidden="true">
                    <Download className="size-3" />
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!open} onOpenChange={(v) => !v && onOpenChange(null)}>
        {open && (
          <DialogContent className="gap-3 sm:max-w-2xl">
            <DialogTitle>{open.kind === "video" ? "Video" : "Photo"}</DialogTitle>
            <DialogDescription>
              {open.width} × {open.height} · {formatBytes(open.blob.size)} · {open.name.split(".").pop()?.toUpperCase()}
              {open.kind === "video" && open.duration ? ` · ${formatDuration(open.duration)}` : ""}
            </DialogDescription>
            <div className="flex items-center justify-center overflow-hidden rounded-lg bg-muted">
              {open.kind === "video" ? (
                <video src={open.url} controls playsInline className="max-h-[60svh] w-full" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={open.url} alt="Your photo" className="max-h-[60svh] w-auto object-contain" />
              )}
            </div>
            <DialogFooter className="sm:justify-between">
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  onDelete(open);
                  onOpenChange(null);
                }}
              >
                <Trash2 aria-hidden="true" /> Delete
              </Button>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                {open.kind === "photo" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      onOpenChange(null);
                      onEdit(open);
                    }}
                  >
                    <Pencil aria-hidden="true" /> Edit filters
                  </Button>
                )}
                <Button onClick={() => onDownload(open)}>
                  <Download aria-hidden="true" /> Download
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all photos and videos?</AlertDialogTitle>
            <AlertDialogDescription>
              {unsaved === 1 ? "1 of them has" : `${unsaved} of them have`} not been downloaded and will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep them</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onClear}>
              Clear all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ToolSection>
  );
}
