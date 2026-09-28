"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False during the server render and hydration, true afterwards. Use it for
 * output that can only be computed in the browser (canvas, DOM measurement)
 * so the first client render matches the server HTML.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
