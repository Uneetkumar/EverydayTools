"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CloudDownload, Loader2, WifiOff } from "lucide-react";
import { Notice } from "@/components/tool/kit";
import type { ToolPrivacy } from "@/lib/tools/registry";
import { formatMB, planTool, type Job } from "@/lib/offline/plan";
import { fetchManifest, inventory, offlineSupported, saveJobs } from "@/lib/offline/store";

type Status = "hidden" | "saved" | "can-save" | "saving" | "failed";

/**
 * Under a tool's privacy note: whether the tool is saved for offline use, with
 * a one-tap way to save it (and the engine it needs). Tools that need the
 * internet say so instead, and warn when the device is offline.
 */
export function ToolOffline({ slug, privacy }: { slug: string; privacy: ToolPrivacy }) {
  const [status, setStatus] = useState<Status>("hidden");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [offline, setOffline] = useState(false);
  const path = `/tools/${slug}`;

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    const t = setTimeout(update, 0);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      clearTimeout(t);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    // Only where the service worker runs (the production build). On a first
    // visit it is still installing, so wait for it rather than skip.
    if (privacy === "network" || process.env.NODE_ENV !== "production" || !offlineSupported()) return;
    let live = true;
    void (async () => {
      await navigator.serviceWorker.ready;
      const m = await fetchManifest();
      if (!live || !m) return;
      // Saved means the page, all of the app's code and the tool's engine:
      // some code loads only when a button is pressed (exports, converters).
      const todo = planTool(m, path, await inventory());
      if (!live) return;
      setJobs(todo);
      setStatus(todo.length === 0 ? "saved" : "can-save");
    })();
    return () => {
      live = false;
    };
  }, [path, privacy]);

  if (privacy === "network") {
    return offline ? (
      <Notice tone="warning" className="mt-3">
        You&apos;re offline. This tool needs an internet connection to work. <Link href="/offline" className="font-medium text-link underline-offset-4 hover:underline">Tools that work offline</Link>
      </Notice>
    ) : null;
  }
  if (status === "hidden") return null;

  const bytes = jobs.reduce((s, j) => s + j.bytes, 0);
  const save = async () => {
    setStatus("saving");
    try {
      await saveJobs(jobs);
      setJobs([]);
      setStatus("saved");
    } catch {
      setStatus("failed");
    }
  };

  return (
    <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
      {status === "saved" ? (
        <>
          <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden="true" />
          <span>Saved for offline use on this device.</span>
        </>
      ) : (
        <>
          {offline ? <WifiOff className="size-4 shrink-0" aria-hidden="true" /> : <CloudDownload className="size-4 shrink-0" aria-hidden="true" />}
          <span>{status === "failed" ? "Could not save it. Check your connection." : "Works offline once saved."}</span>
          {!offline && (
            <button
              type="button"
              onClick={() => void save()}
              disabled={status === "saving"}
              className="inline-flex items-center gap-1 rounded font-medium text-link underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-60"
            >
              {status === "saving" && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
              {status === "saving" ? "Saving…" : `Save this tool (${formatMB(bytes)})`}
            </button>
          )}
          <Link href="/offline" className="underline-offset-4 hover:underline">
            or all tools
          </Link>
        </>
      )}
    </p>
  );
}
