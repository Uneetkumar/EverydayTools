"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { fetchManifest, offlineSupported, readState, saveEverything } from "@/lib/offline/store";

/**
 * Two jobs, on every page:
 *
 * - Says so when the device is offline, and that saved tools still work.
 * - Keeps a saved offline copy current. After a deploy, the next visit with a
 *   connection fetches what changed, quietly and only once the page is idle.
 *   Skipped on data-saver connections; /offline offers the update instead.
 */
export function OfflineStatus() {
  const [offline, setOffline] = useState(false);

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
    // Only where the service worker runs (the production build).
    if (process.env.NODE_ENV !== "production" || !offlineSupported() || !navigator.serviceWorker.controller) return;
    if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return;
    let cancelled = false;
    const run = async () => {
      if (cancelled || !navigator.onLine) return;
      const state = await readState();
      if (!state) return;
      const m = await fetchManifest();
      if (!m || m.version === state.version || cancelled) return;
      await saveEverything(m, state.packs).catch(() => undefined);
    };
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    const id = idle ? idle(() => void run(), { timeout: 15000 }) : window.setTimeout(() => void run(), 8000);
    return () => {
      cancelled = true;
      if (!idle) clearTimeout(id);
    };
  }, []);

  if (!offline) return null;
  return (
    <div role="status" className="border-b bg-muted/60">
      <div className="page-container flex flex-wrap items-center gap-x-2 gap-y-1 py-2 text-sm text-foreground">
        <WifiOff className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span>You&apos;re offline. Tools saved on this device still work.</span>
        <Link href="/offline" className="font-medium text-link underline-offset-4 hover:underline">
          See what&apos;s saved
        </Link>
      </div>
    </div>
  );
}
