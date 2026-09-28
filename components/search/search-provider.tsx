"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { prefetchToolIndex } from "@/lib/tools/use-tool-index";

/**
 * Global tool search.
 *
 * Owns the open state so every entry point — the header button, the hero
 * search, the mobile menu, ⌘K and "/" — opens the same palette. The palette
 * itself (cmdk + dialog, and the tool index it searches) is loaded the first
 * time it is needed and warmed on idle, so it adds nothing to a page's
 * initial JavaScript.
 */
const CommandSearch = dynamic(() => import("./command-search"), { ssr: false });

interface SearchContextValue {
  open: (initialQuery?: string) => void;
}

const SearchContext = React.createContext<SearchContextValue>({ open: () => {} });

export function useSearch() {
  return React.useContext(SearchContext);
}

function isTypingTarget(el: EventTarget | null): boolean {
  const node = el as HTMLElement | null;
  if (!node) return false;
  return (
    node.tagName === "INPUT" ||
    node.tagName === "TEXTAREA" ||
    node.tagName === "SELECT" ||
    node.isContentEditable
  );
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [initialQuery, setInitialQuery] = React.useState("");
  // Each open gets a fresh palette instance, so it starts from the query it
  // was opened with instead of whatever was typed last time.
  const [session, setSession] = React.useState(0);
  const openRef = React.useRef(false);
  React.useEffect(() => {
    openRef.current = isOpen;
  }, [isOpen]);

  const open = React.useCallback((q?: string) => {
    setInitialQuery(q ?? "");
    setSession((n) => n + 1);
    setMounted(true);
    setIsOpen(true);
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (openRef.current) setIsOpen(false);
        else open();
      } else if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey && !isTypingTarget(e.target)) {
        e.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", onKey);

    // Warm the palette and its data once the page is idle, so the first open
    // is instant without costing the initial load anything.
    const warm = () => {
      prefetchToolIndex();
      void import("./command-search");
    };
    // Called as window methods: a detached requestIdleCallback throws
    // "Illegal invocation" in Chrome. Safari has no requestIdleCallback.
    const hasIdle = "requestIdleCallback" in window;
    const handle = hasIdle ? window.requestIdleCallback(warm) : window.setTimeout(warm, 2500);

    return () => {
      window.removeEventListener("keydown", onKey);
      if (hasIdle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, [open]);

  const value = React.useMemo(() => ({ open }), [open]);

  return (
    <SearchContext.Provider value={value}>
      {children}
      {mounted && (
        <CommandSearch
          key={session}
          open={isOpen}
          onOpenChange={setIsOpen}
          initialQuery={initialQuery}
        />
      )}
    </SearchContext.Provider>
  );
}
