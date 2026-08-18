"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Clock, Download, Trash2, X } from "lucide-react";
import {
  listResults,
  deleteResult,
  clearResults,
  StoredResult,
  RESULTS_PER_TOOL,
} from "@/lib/history/results";

const IMAGE_TYPES = /^image\//;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatAge(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function RecentResults({ toolSlug }: { toolSlug: string }) {
  const [items, setItems] = useState<StoredResult[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    const found = await listResults(toolSlug);
    setItems(found);
    // Object URLs are created once per entry and revoked on replacement or
    // unmount; leaking them would pin the blobs in memory.
    setUrls((prev) => {
      Object.values(prev).forEach(URL.revokeObjectURL);
      const next: Record<string, string> = {};
      for (const item of found) next[item.id] = URL.createObjectURL(item.blob);
      return next;
    });
  }, [toolSlug]);

  useEffect(() => {
    const id = setTimeout(refresh, 0);
    return () => clearTimeout(id);
  }, [refresh]);

  useEffect(() => {
    return () => {
      Object.values(urls).forEach(URL.revokeObjectURL);
    };
    // Intentionally cleanup-only on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="recent-results-heading"
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3"
    >
      <div className="flex items-center justify-between gap-2">
        <h2
          id="recent-results-heading"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white"
        >
          <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          Your recent files
        </h2>
        <button
          onClick={async () => {
            await clearResults(toolSlug);
            refresh();
          }}
          className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-red-500 transition"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-3 p-2 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition"
          >
            {IMAGE_TYPES.test(item.type) && urls[item.id] ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={urls[item.id]}
                alt={item.filename}
                className="h-10 w-10 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-[9px] font-bold uppercase text-slate-500">
                {(item.filename.split(".").pop() || "file").slice(0, 4)}
              </span>
            )}

            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-slate-800 dark:text-slate-200">
                {item.filename}
              </span>
              <span className="block text-[10px] text-slate-400">
                {formatSize(item.size)} · {formatAge(item.createdAt)}
              </span>
            </span>

            <a
              href={urls[item.id]}
              download={item.filename}
              aria-label={`Download ${item.filename} again`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={async () => {
                await deleteResult(item.id);
                refresh();
              }}
              aria-label={`Delete ${item.filename}`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>

      <p className="text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
        Your last {RESULTS_PER_TOOL} files from this tool, kept in this browser
        for 7 days then deleted automatically. They are never uploaded.
      </p>
    </section>
  );
}
