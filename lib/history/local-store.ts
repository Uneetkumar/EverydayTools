"use client";

import { useSyncExternalStore } from "react";

/**
 * A tiny localStorage-backed store for per-browser conveniences (favorites,
 * recently used tools, recent searches).
 *
 * Built on useSyncExternalStore rather than useState + useEffect because
 * every page is prerendered: reading storage during render would mismatch the
 * static HTML, and reading it in an effect means a setState-in-effect cascade.
 * The server snapshot is always the empty value, so the static HTML and the
 * first client render agree, and React swaps in the stored value right after
 * hydration.
 *
 * Every access is wrapped: private browsing, a full quota or blocked site data
 * can all make storage throw, and a convenience feature must never break a
 * page.
 */
export interface LocalStore<T> {
  get(): T;
  set(next: T): void;
  update(fn: (prev: T) => T): void;
  clear(): void;
  useValue(): T;
}

export function createLocalStore<T>(
  key: string,
  empty: T,
  parse: (raw: unknown) => T
): LocalStore<T> {
  const listeners = new Set<() => void>();
  let cachedRaw: string | null | undefined;
  let cachedValue: T = empty;

  function read(): T {
    if (typeof window === "undefined") return empty;
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      return empty;
    }
    // Same string → same object, which useSyncExternalStore requires to avoid
    // re-rendering forever.
    if (raw === cachedRaw) return cachedValue;
    cachedRaw = raw;
    try {
      cachedValue = raw ? parse(JSON.parse(raw)) : empty;
    } catch {
      cachedValue = empty;
    }
    return cachedValue;
  }

  function emit() {
    for (const l of listeners) l();
  }

  function set(next: T) {
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* storage unavailable: the feature degrades to per-page only */
    }
    emit();
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    // Keeps other open tabs in sync.
    const onStorage = (e: StorageEvent) => {
      if (e.key === key || e.key === null) listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  return {
    get: read,
    set,
    update: (fn) => set(fn(read())),
    clear() {
      try {
        window.localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
      emit();
    },
    useValue() {
      return useSyncExternalStore(subscribe, read, () => empty);
    },
  };
}

export const stringArray = (max: number) => (raw: unknown): string[] =>
  Array.isArray(raw)
    ? raw.filter((x): x is string => typeof x === "string").slice(0, max)
    : [];
