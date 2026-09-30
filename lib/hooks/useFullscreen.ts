"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";

/**
 * Full-screen for one element. Uses the Fullscreen API where it exists and a
 * fixed overlay where it does not (iPhone Safari), so the control always
 * works. `overlay` tells the caller to add fixed-position classes.
 */
export function useFullscreen(ref: RefObject<HTMLElement | null>): { active: boolean; overlay: boolean; toggle: () => void } {
  const [native, setNative] = useState(false);
  const [overlay, setOverlay] = useState(false);

  useEffect(() => {
    const onChange = () => setNative(document.fullscreenElement === ref.current && !!ref.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [ref]);

  // Escape leaves the overlay fallback too.
  useEffect(() => {
    if (!overlay) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOverlay(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlay]);

  const toggle = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
      return;
    }
    if (overlay) {
      setOverlay(false);
      return;
    }
    if (typeof el.requestFullscreen === "function") {
      el.requestFullscreen().catch(() => setOverlay(true));
    } else setOverlay(true);
  }, [ref, overlay]);

  return { active: native || overlay, overlay, toggle };
}
