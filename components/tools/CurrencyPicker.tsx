"use client";

import React, { useState, useRef, useEffect, useMemo, useId } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { CURRENCY_NAMES, CURRENCY_SYMBOLS } from "@/lib/currency/rates";

interface CurrencyPickerProps {
  value: string;
  onChange: (code: string) => void;
  codes: string[];
  popular: string[];
  label: string;
}

/**
 * Searchable currency selector.
 *
 * A native <select> with 160+ options means scrolling a long unlabelled list of
 * codes, which is unusable on mobile. This filters on code, full name, and
 * symbol as you type, so "rupee", "inr", and "₹" all find the same entry.
 */
export default function CurrencyPicker({
  value,
  onChange,
  codes,
  popular,
  label,
}: CurrencyPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const ordered = [
      ...popular.filter((c) => codes.includes(c)),
      ...codes.filter((c) => !popular.includes(c)).sort(),
    ];
    if (!q) return ordered;
    return ordered.filter((c) => {
      const name = (CURRENCY_NAMES[c] ?? "").toLowerCase();
      const symbol = (CURRENCY_SYMBOLS[c] ?? "").toLowerCase();
      return c.toLowerCase().includes(q) || name.includes(q) || symbol === q;
    });
  }, [query, codes, popular]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Keep the highlighted row in view while arrowing through a long list.
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  // Resetting query/highlight happens in the handlers that actually close or
  // retype, rather than in an effect reacting to them — same result, without
  // the extra render pass an effect-driven reset causes.
  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const commit = (code: string) => {
    onChange(code);
    close();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[activeIndex]) commit(results[activeIndex]);
    } else if (e.key === "Escape") {
      close();
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
        className="w-full flex items-center justify-between gap-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-slate-900 dark:text-white hover:border-blue-400 transition"
      >
        <span className="truncate text-left">
          <span className="font-semibold">{value}</span>
          <span className="text-slate-500 dark:text-slate-400">
            {CURRENCY_NAMES[value] ? ` — ${CURRENCY_NAMES[value]}` : ""}
          </span>
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Search: rupee, USD, ₹…"
              aria-controls={listId}
              aria-autocomplete="list"
              className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
            />
          </div>

          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={label}
            className="max-h-64 overflow-y-auto py-1"
          >
            {results.length === 0 && (
              <li className="px-3 py-3 text-xs text-slate-500">
                No currency matches “{query}”.
              </li>
            )}
            {results.map((code, i) => (
              <li
                key={code}
                role="option"
                aria-selected={code === value}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => commit(code)}
                className={`flex items-center justify-between gap-2 px-3 py-2 text-sm cursor-pointer ${
                  i === activeIndex
                    ? "bg-blue-50 dark:bg-blue-950/40"
                    : ""
                } ${code === value ? "font-semibold" : ""}`}
              >
                <span className="truncate text-slate-900 dark:text-white">
                  <span className="font-mono text-xs mr-2 text-blue-600 dark:text-blue-400">
                    {code}
                  </span>
                  {CURRENCY_NAMES[code] ?? code}
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  {CURRENCY_SYMBOLS[code] && (
                    <span className="text-slate-400">{CURRENCY_SYMBOLS[code]}</span>
                  )}
                  {code === value && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
