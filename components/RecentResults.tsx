"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Clock, Download, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <section aria-labelledby="recent-results-heading" className="rounded-xl border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <h2 id="recent-results-heading" className="flex items-center gap-2 type-h4 text-foreground">
          <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
          Your recent files
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={async () => {
            await clearResults(toolSlug);
            refresh();
          }}
          className="text-muted-foreground"
        >
          <X aria-hidden="true" />
          Clear
        </Button>
      </div>

      <ul className="mt-3 space-y-1.5">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 rounded-lg border p-2 transition-colors hover:bg-accent/50">
            {IMAGE_TYPES.test(item.type) && urls[item.id] ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={urls[item.id]}
                alt=""
                className="size-10 shrink-0 rounded-md border object-cover"
              />
            ) : (
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-semibold uppercase text-muted-foreground">
                {(item.filename.split(".").pop() || "file").slice(0, 4)}
              </span>
            )}

            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">{item.filename}</span>
              <span className="block text-xs text-muted-foreground">
                {formatSize(item.size)} · {formatAge(item.createdAt)}
              </span>
            </span>

            <Button asChild variant="ghost" size="icon-sm">
              <a href={urls[item.id]} download={item.filename} aria-label={`Download ${item.filename} again`}>
                <Download aria-hidden="true" />
              </a>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={async () => {
                await deleteResult(item.id);
                refresh();
              }}
              aria-label={`Delete ${item.filename}`}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ul>

      <p className="mt-3 type-caption text-muted-foreground">
        Your last {RESULTS_PER_TOOL} files from this tool, kept in this browser for 7 days and then
        deleted automatically. They are never uploaded.
      </p>
    </section>
  );
}
