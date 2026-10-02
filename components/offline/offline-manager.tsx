"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, CloudDownload, HardDrive, RefreshCw, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Notice } from "@/components/tool/kit";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { formatMB, totalBytes, type Inventory, type OfflineManifest, type OfflineState } from "@/lib/offline/plan";
import {
  bytesUsed,
  fetchManifest,
  inventory,
  offlineSupported,
  readState,
  removeEverything,
  saveEverything,
  StorageFullError,
  type Progress as SaveProgress,
} from "@/lib/offline/store";
import { cn } from "@/lib/utils";

type Phase = "loading" | "unavailable" | "ready" | "saving";

interface Snapshot {
  manifest: OfflineManifest;
  state: OfflineState | null;
  have: Inventory;
  used: number | null;
}

/**
 * Saves the whole site on this device: every tool page and its code, plus the
 * heavy engines a few tools need, chosen here. Shows what is saved, keeps it
 * up to date and removes it on request.
 */
export function OfflineManager({ toolNames }: { toolNames: Record<string, string> }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [packs, setPacks] = useState<string[]>([]);
  const [progress, setProgress] = useState<SaveProgress | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (!offlineSupported()) return setPhase("unavailable");
    const manifest = await fetchManifest();
    if (!manifest) return setPhase("unavailable");
    const [state, have, used] = await Promise.all([readState(), inventory(), bytesUsed()]);
    setSnap({ manifest, state, have, used });
    setPacks((current) => (current.length ? current : state?.packs ?? manifest.packs.filter((p) => p.suggested).map((p) => p.id)));
    setPhase("ready");
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void refresh(), 0);
    return () => {
      clearTimeout(t);
      abort.current?.abort();
    };
  }, [refresh]);

  const save = async () => {
    if (!snap) return;
    setProblem(null);
    setPhase("saving");
    const ac = new AbortController();
    abort.current = ac;
    try {
      const r = await saveEverything(snap.manifest, packs, { onProgress: setProgress, signal: ac.signal });
      if (r?.aborted) toast("Saving stopped", { description: "What was saved so far stays on this device. Save again to finish." });
      else if (r && r.failed.length) setProblem(`${r.failed.length} file${r.failed.length === 1 ? "" : "s"} could not be saved. Check your connection and save again; only the missing files are fetched.`);
      else toast.success("Saved for offline use", { description: "Every tool on this list now opens without a connection." });
    } catch (e) {
      setProblem(e instanceof StorageFullError ? "This device ran out of space. Free some up, or leave out the larger engines, and save again." : "Saving stopped because the connection dropped. Save again to finish; only the missing files are fetched.");
    } finally {
      abort.current = null;
      setProgress(null);
      await refresh();
    }
  };

  const remove = async () => {
    await removeEverything();
    toast("Offline copy removed", { description: "Pages you open from now on are saved again as you use them." });
    await refresh();
  };

  if (phase === "loading") return <div className="h-64 animate-pulse rounded-2xl border bg-card" aria-busy="true" aria-label="Checking what is saved" />;

  if (phase === "unavailable" || !snap) {
    return (
      <Notice tone="info">
        Offline saving is not available here. It needs a browser that supports installable web apps (Chrome, Edge, Safari 16.4 and later, Firefox) outside a private window, on the live site.
      </Notice>
    );
  }

  const { manifest: m, state, have, used } = snap;
  const pagesSaved = m.pages.filter((p) => have.pages.has(p.url)).length;
  const fullySaved = state?.version === m.version && pagesSaved === m.pages.length;
  const outdated = !!state && state.version !== m.version;
  const packSaved = (id: string) => m.packs.find((p) => p.id === id)?.files.every((f) => have.engines.has(f.url)) ?? false;
  const size = totalBytes(m, packs);
  const sameChoice = !!state && [...state.packs].sort().join() === [...packs].sort().join();
  const upToDate = fullySaved && sameChoice && m.packs.filter((p) => packs.includes(p.id)).every((p) => packSaved(p.id));
  const pct = progress && progress.bytesTotal > 0 ? Math.round((progress.bytesDone / progress.bytesTotal) * 100) : 0;

  return (
    <section aria-labelledby="offline-status" className="rounded-2xl border bg-card p-5 shadow-soft sm:p-6">
      <div className="flex items-start gap-3.5">
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", fullySaved ? "bg-success/15 text-success" : "bg-brand-subtle text-brand-subtle-foreground")}>
          {fullySaved ? <CheckCircle2 className="size-5" aria-hidden="true" /> : <CloudDownload className="size-5" aria-hidden="true" />}
        </span>
        <div className="min-w-0">
          <h2 id="offline-status" className="text-lg font-semibold text-foreground">
            {fullySaved ? "Saved on this device" : outdated ? "Your offline copy has an update" : "Save TabBench on this device"}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {fullySaved
              ? `All ${m.pages.length} pages and their code are saved${state ? `, last updated ${new Date(state.savedAt).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}` : ""}. They open without a connection.`
              : outdated
                ? "The site has changed since you saved it. Your saved copy still works; updating fetches only what changed."
                : `${pagesSaved} of ${m.pages.length} pages are saved so far, from the tools you have opened. Save the rest to use any tool offline.`}
          </p>
        </div>
      </div>

      {phase === "saving" && progress ? (
        <div className="mt-6 space-y-2.5" aria-live="polite">
          <Progress value={pct} aria-label="Saving for offline use" />
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground tabular-nums">
              {progress.done} of {progress.total} files · {formatMB(progress.bytesDone)} of {formatMB(progress.bytesTotal)}
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={() => abort.current?.abort()}>
              <X aria-hidden="true" /> Stop
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Keep this page open until it finishes. You can use other tabs meanwhile.</p>
        </div>
      ) : (
        <>
          <fieldset className="mt-6 space-y-2">
            <legend className="mb-2 text-sm font-medium text-foreground">What to save</legend>
            <div className="flex items-start gap-3 rounded-xl border bg-background px-3.5 py-3">
              <Checkbox checked disabled aria-label="Pages and code, always saved" className="mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">Every tool page and its code</p>
                <p className="text-xs text-muted-foreground">{m.pages.length} pages. Enough for every tool except those below.</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{formatMB(m.bytes.core + m.bytes.pages)}</span>
            </div>
            {m.packs.map((p) => {
              const id = `pack-${p.id}`;
              const on = packs.includes(p.id);
              return (
                <label key={p.id} htmlFor={id} className="flex cursor-pointer items-start gap-3 rounded-xl border bg-background px-3.5 py-3 transition-colors hover:bg-muted/50">
                  <Checkbox id={id} checked={on} onCheckedChange={(v) => setPacks((cur) => (v ? [...cur, p.id] : cur.filter((x) => x !== p.id)))} className="mt-0.5" />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 text-sm font-medium text-foreground">
                      {p.label}
                      {packSaved(p.id) && <span className="text-xs font-normal text-success">Saved</span>}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {p.note}. For {p.tools.map((s) => toolNames[s] ?? s).join(", ")}.
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{formatMB(p.bytes)}</span>
                </label>
              );
            })}
          </fieldset>

          {problem && (
            <Notice tone="warning" className="mt-4">
              {problem}
            </Notice>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {upToDate ? (
              <span className="inline-flex h-9 items-center gap-1.5 text-sm font-medium text-success">
                <CheckCircle2 className="size-4" aria-hidden="true" /> Up to date
              </span>
            ) : (
              <Button type="button" size="lg" onClick={() => void save()}>
                {outdated ? <RefreshCw aria-hidden="true" /> : <CloudDownload aria-hidden="true" />}
                {fullySaved ? "Save changes" : outdated ? "Update offline copy" : `Save for offline · ${formatMB(size)}`}
              </Button>
            )}
            {(state || pagesSaved > 0) && (
              <Button type="button" variant="outline" size="lg" onClick={() => void remove()}>
                <Trash2 aria-hidden="true" /> Remove offline copy
              </Button>
            )}
            {used !== null && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground sm:ml-auto">
                <HardDrive className="size-3.5" aria-hidden="true" /> TabBench uses {formatMB(used)} on this device
              </span>
            )}
          </div>
        </>
      )}
    </section>
  );
}
