"use client";

import { useEffect } from "react";

/** Keeps the screen on while `active` (where the browser supports it). Released automatically when the tab is hidden. */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const request = async () => {
      try {
        const l = await navigator.wakeLock.request("screen");
        if (cancelled) void l.release();
        else lock = l;
      } catch {
        /* denied, or the page is hidden */
      }
    };
    void request();
    // The lock is dropped whenever the page is hidden; take it again on return.
    const onVisible = () => {
      if (document.visibilityState === "visible" && (!lock || lock.released)) void request();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release().catch(() => undefined);
    };
  }, [active]);
}
