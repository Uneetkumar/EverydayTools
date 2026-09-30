"use client";

import { useEffect, useState } from "react";
import { startTicker } from "@/lib/time/ticker";

/**
 * The current time in milliseconds, refreshed every `ms` while `active`. It
 * re-reads Date.now() each tick rather than counting ticks, so the value is
 * correct even if ticks arrive late. Returns 0 until mounted, so server and
 * first client renders match.
 */
export function useNow(active: boolean, ms = 200): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    // Mount: set the time once (deferred, so it is not a synchronous setState in the effect).
    const first = setTimeout(() => setNow(Date.now()), 0);
    if (!active) return () => clearTimeout(first);
    const stop = startTicker(() => setNow(Date.now()), ms);
    const onVisible = () => {
      if (document.visibilityState === "visible") setNow(Date.now());
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(first);
      stop();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [active, ms]);
  return now;
}
