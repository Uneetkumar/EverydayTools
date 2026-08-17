"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds

interface StorageEnvelope<T> {
  data: T;
  timestamp: number;
}

/**
 * Saves and retrieves state in localStorage with a 3-day expiration TTL.
 * 100% Client-side and private to the user's browser.
 */
export function getSavedToolState<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = localStorage.getItem(`edt_persist_${key}`);
    if (!raw) return defaultValue;

    const parsed: StorageEnvelope<T> = JSON.parse(raw);
    if (!parsed || typeof parsed.timestamp !== "number") return defaultValue;

    // Check if data is within 3 days
    if (Date.now() - parsed.timestamp > THREE_DAYS_MS) {
      localStorage.removeItem(`edt_persist_${key}`);
      return defaultValue;
    }

    return parsed.data;
  } catch (err) {
    console.warn(`Error reading localStorage for key ${key}:`, err);
    return defaultValue;
  }
}

export function saveToolState<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    const envelope: StorageEnvelope<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(`edt_persist_${key}`, JSON.stringify(envelope));
  } catch (err) {
    console.warn(`Error writing localStorage for key ${key}:`, err);
  }
}

export function clearSavedToolState(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`edt_persist_${key}`);
  } catch (err) {
    console.warn(`Error clearing localStorage for key ${key}:`, err);
  }
}

/**
 * Custom React hook that automatically synchronizes state with local device storage (3-day TTL)
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T
): [T, (val: T | ((prev: T) => T)) => void, () => void, boolean] {
  const [state, setState] = useState<T>(initialValue);
  const [hasRestored, setHasRestored] = useState<boolean>(false);
  const isInitialMount = useRef(true);

  // Restore saved state on initial client mount
  useEffect(() => {
    const saved = getSavedToolState<T>(key, initialValue);
    setState(saved);
    setHasRestored(true);
    isInitialMount.current = false;
  }, [key]);

  // Persist state whenever it changes (after initial mount)
  useEffect(() => {
    if (!isInitialMount.current && hasRestored) {
      saveToolState<T>(key, state);
    }
  }, [key, state, hasRestored]);

  const resetState = useCallback(() => {
    clearSavedToolState(key);
    setState(initialValue);
  }, [key, initialValue]);

  return [state, setState, resetState, hasRestored];
}
