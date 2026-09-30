"use client";

import React, { useCallback, useEffect, useId, useMemo, useState } from "react";
import { ChevronDown, Link2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Chips, Notice, ToggleRow } from "@/components/tool/kit";
import { STATUS_CLASSES, STATUS_CODES, getStatus, searchStatus, statusClassOf, type StatusClass, type StatusCode } from "@/lib/http/status";
import { copyText } from "@/lib/utils/clipboard";
import { cn } from "@/lib/utils";

const COMMON = [200, 201, 204, 301, 302, 304, 400, 401, 403, 404, 429, 500, 502, 503];

const TONE: Record<StatusClass, string> = {
  "1xx": "bg-muted text-muted-foreground",
  "2xx": "bg-success/10 text-success",
  "3xx": "bg-brand-subtle text-brand-subtle-foreground",
  "4xx": "bg-warning/10 text-warning",
  "5xx": "bg-destructive/10 text-destructive",
};

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{children}</dd>
    </div>
  );
}

const RETRY: Record<NonNullable<StatusCode["retry"]>, string> = {
  yes: "Yes, retrying is reasonable",
  no: "No — fix the request first",
  after: "Yes, after waiting (back off)",
};

function Row({ s, open, onToggle, onPick }: { s: StatusCode; open: boolean; onToggle: () => void; onPick: (code: number) => void }) {
  const cls = statusClassOf(s.code);
  const panelId = useId();
  return (
    <li id={`status-${s.code}`} className="scroll-mt-24">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-3.5 py-3 text-left transition-colors outline-none hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
      >
        <span className={cn("mt-0.5 inline-flex h-7 min-w-12 shrink-0 items-center justify-center rounded-md font-mono text-sm font-semibold tabular-nums", TONE[cls])}>{s.code}</span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold text-foreground">{s.name}</span>
            {s.aka && <span className="text-xs text-muted-foreground">also “{s.aka.join("”, “")}”</span>}
            {s.unofficial && <span className="rounded border px-1.5 text-[11px] text-muted-foreground">not in the standard</span>}
            {s.obsolete && <span className="rounded border px-1.5 text-[11px] text-muted-foreground">obsolete</span>}
          </span>
          <span className="mt-0.5 block text-sm text-muted-foreground">{s.summary}</span>
        </span>
        <ChevronDown aria-hidden="true" className={cn("mt-1 size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div id={panelId} className="space-y-4 border-t bg-muted/20 px-3.5 py-4 @md:pl-[4.75rem]">
          <div>
            <h4 className="text-sm font-semibold text-foreground">When you see it</h4>
            <p className="mt-1 text-sm text-foreground">{s.when}</p>
          </div>
          {s.fix && (
            <div>
              <h4 className="text-sm font-semibold text-foreground">How to fix it</h4>
              <p className="mt-1 text-sm text-foreground">{s.fix}</p>
            </div>
          )}
          <dl className="grid gap-x-6 gap-y-3 @md:grid-cols-2">
            <Fact label="Class">
              {cls} · {STATUS_CLASSES[cls].name}
            </Fact>
            <Fact label="Defined in">{s.spec}</Fact>
            {s.headers && (
              <Fact label="Usually comes with">
                <span className="font-mono text-[13px]">{s.headers.join(", ")}</span>
              </Fact>
            )}
            {s.cacheable !== undefined && <Fact label="Cacheable by default">{s.cacheable ? "Yes" : "No"}</Fact>}
            {s.retry && <Fact label="Safe to retry?">{RETRY[s.retry]}</Fact>}
          </dl>
          {s.see && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">See also</span>
              {s.see.map((c) => (
                <button key={c} type="button" onClick={() => onPick(c)} className="rounded-full border bg-background px-2.5 py-0.5 font-mono text-xs text-foreground transition-colors hover:bg-muted">
                  {c} {getStatus(c)?.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                if (await copyText(`${s.code} ${s.name}`)) toast.success("Copied");
              }}
            >
              Copy “{s.code} {s.name}”
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                const url = `${location.origin}${location.pathname}#${s.code}`;
                if (await copyText(url)) toast.success("Link copied");
              }}
            >
              <Link2 aria-hidden="true" /> Copy link to this code
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

export default function HttpStatusLookup() {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [klass, setKlass] = useState<StatusClass | "all">("all");
  const [unofficial, setUnofficial] = useState(true);
  const [open, setOpen] = useState<number | null>(null);

  const select = useCallback((code: number) => {
    setOpen(code);
    setQuery("");
    setKlass("all");
    setUnofficial(true);
    try {
      history.replaceState(null, "", `#${code}`);
    } catch {
      /* some embedded browsers block it */
    }
    // Wait for the list to re-render, then bring the row into view.
    window.setTimeout(() => document.getElementById(`status-${code}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }), 50);
  }, []);

  // A link such as /tools/http-status-code-lookup#404 opens that code.
  useEffect(() => {
    const t = window.setTimeout(() => {
      const m = /^#(\d{3})$/.exec(window.location.hash);
      if (m && getStatus(Number(m[1]))) select(Number(m[1]));
    }, 0);
    return () => window.clearTimeout(t);
  }, [select]);

  const list = useMemo(() => {
    let base = searchStatus(query);
    if (klass !== "all") base = base.filter((s) => statusClassOf(s.code) === klass);
    if (!unofficial) base = base.filter((s) => !s.unofficial);
    return base;
  }, [query, klass, unofficial]);

  const exact = /^\d{3}$/.test(query.trim()) && !getStatus(Number(query.trim()));

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label htmlFor={inputId} className="sr-only">
          Search status codes
        </label>
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id={inputId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a code (404), a name (not found) or a word (rate limit, redirect)"
            autoComplete="off"
            spellCheck={false}
            className="h-11 w-full rounded-lg border border-input bg-background pr-3 pl-9 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Chips
            ariaLabel="Filter by class"
            value={klass === "all" ? null : klass}
            onChange={(v) => setKlass((k) => (k === v ? "all" : v))}
            options={(Object.keys(STATUS_CLASSES) as StatusClass[]).map((c) => ({ value: c, label: `${c} ${STATUS_CLASSES[c].name}` }))}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Most looked up</span>
          {COMMON.map((c) => (
            <button key={c} type="button" onClick={() => select(c)} className="rounded-full border bg-background px-2.5 py-0.5 font-mono text-xs text-foreground transition-colors hover:bg-muted">
              {c}
            </button>
          ))}
        </div>
        <ToggleRow id={`${inputId}-unofficial`} label="Include non-standard codes" description="nginx 499, Cloudflare 52x, Laravel 419 and others you meet in logs but are not in the official registry." checked={unofficial} onCheckedChange={setUnofficial} />
      </div>

      {exact && (
        <Notice tone="info">
          <strong className="font-semibold">{query.trim()}</strong> is not a status code in the registry or among the common non-standard ones. The class tells you the general meaning: {STATUS_CLASSES[statusClassOf(Number(query.trim()))]?.name ? `${statusClassOf(Number(query.trim()))} is “${STATUS_CLASSES[statusClassOf(Number(query.trim()))].name}”.` : "valid codes run from 100 to 599."}
        </Notice>
      )}

      {list.length === 0 ? (
        !exact && <p className="text-sm text-muted-foreground">No status code matches “{query}”. Try a number, or a word such as “redirect”, “timeout” or “auth”.</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {list.length} status code{list.length === 1 ? "" : "s"}
            {klass !== "all" ? ` in ${klass}` : ""}
          </p>
          <ul className="divide-y overflow-hidden rounded-lg border bg-card">
            {list.map((s) => (
              <Row key={s.code} s={s} open={open === s.code} onToggle={() => setOpen(open === s.code ? null : s.code)} onPick={select} />
            ))}
          </ul>
        </>
      )}

      <p className="text-xs text-muted-foreground">
        {STATUS_CODES.length} codes. Names follow RFC 9110, the current HTTP semantics standard; older names such as “Payload Too Large” are listed as alternates and searchable.
      </p>
    </div>
  );
}
