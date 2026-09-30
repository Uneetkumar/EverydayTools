"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * State kept in this browser's localStorage with no expiry. The shared
 * `usePersistentState` forgets after three days, which suits a half-filled form
 * but not a history meant to show a trend over weeks. Nothing here leaves the
 * device, and every storage call tolerates private windows and blocked storage.
 */
export function useStored<T>(key: string, initial: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(initial);
  const latest = useRef<T>(initial);

  // Read after mount (deferred a tick), so server and first client render agree.
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const raw = localStorage.getItem(key);
        if (raw !== null) {
          const value = JSON.parse(raw) as T;
          latest.current = value;
          setState(value);
        }
      } catch {
        /* storage blocked or corrupt: keep the default */
      }
    }, 0);
    return () => clearTimeout(id);
  }, [key]);

  const set = useCallback(
    (value: T | ((prev: T) => T)) => {
      const next = typeof value === "function" ? (value as (prev: T) => T)(latest.current) : value;
      latest.current = next;
      setState(next);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* storage full or blocked: the value still lives in memory for this visit */
      }
    },
    [key]
  );

  return [state, set];
}
