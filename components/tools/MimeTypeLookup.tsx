"use client";

import React, { useId, useMemo, useState } from "react";
import { Search } from "lucide-react";
import CopyButton from "@/components/ui/CopyButton";
import { Chips, ToolSection } from "@/components/tool/kit";
import { Button } from "@/components/ui/button";
import { MIME_ENTRIES, isCompressible, searchMime, type MimeCategory } from "@/lib/http/mime";

const CATEGORIES: MimeCategory[] = ["Text", "Code", "Image", "Audio", "Video", "Font", "Document", "Archive", "Data", "Application", "3D model"];
const PAGE = 60;

const COMMON = ["json", "pdf", "png", "jpg", "svg", "mp4", "csv", "js", "webp", "docx"];

export default function MimeTypeLookup() {
  const id = useId();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<MimeCategory | null>(null);
  const [shown, setShown] = useState(PAGE);

  const results = useMemo(() => {
    const base = searchMime(query);
    return category ? base.filter((e) => e.category === category) : base;
  }, [query, category]);

  // Reverse view: an exact type typed in lists every extension that uses it.
  const typeHit = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q.includes("/") && !q.endsWith("/*") ? MIME_ENTRIES.filter((e) => e.type === q) : [];
  }, [query]);

  return (
    <div className="space-y-6">
      <ToolSection title="Find a MIME type" description="Type a file extension (pdf), a MIME type (image/webp) or a word (video, font, spreadsheet).">
        <div className="relative">
          <label htmlFor={`${id}-q`} className="sr-only">
            Search MIME types
          </label>
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id={`${id}-q`}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShown(PAGE);
            }}
            placeholder=".pdf, image/png, spreadsheet…"
            autoComplete="off"
            spellCheck={false}
            autoCapitalize="off"
            className="h-11 w-full rounded-lg border border-input bg-background pr-3 pl-9 font-mono text-base outline-none transition-colors placeholder:font-sans placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Common</span>
          {COMMON.map((c) => (
            <button key={c} type="button" onClick={() => { setQuery(c); setShown(PAGE); }} className="rounded-full border bg-background px-2.5 py-1 font-mono text-xs text-foreground transition-colors hover:bg-muted outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
              .{c}
            </button>
          ))}
        </div>
        <Chips ariaLabel="Category" value={category} onChange={(c) => { setCategory((cur) => (cur === c ? null : c)); setShown(PAGE); }} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
      </ToolSection>

      {typeHit.length > 0 && (
        <p className="rounded-lg border bg-brand-subtle/50 px-3.5 py-2.5 text-sm text-foreground">
          <span className="font-mono">{typeHit[0].type}</span> is used by {typeHit.length === 1 ? "the extension" : "these extensions"}: {typeHit.map((e) => `.${e.ext}`).join(", ")}. {isCompressible(typeHit[0].type) ? "It compresses well, so enable gzip or brotli for it." : "It is usually already compressed, so do not compress it again."}
        </p>
      )}

      {results.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing matches “{query}”. For an unknown binary file, servers send <span className="font-mono">application/octet-stream</span>.</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {results.length} match{results.length === 1 ? "" : "es"}
          </p>
          <div className="relative overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="bg-muted text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">Extension</th>
                  <th scope="col" className="px-3 py-2 font-medium">MIME type</th>
                  <th scope="col" className="px-3 py-2 font-medium">What it is</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium"><span className="sr-only">Copy</span></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {results.slice(0, shown).map((e, i) => (
                  <tr key={`${e.ext}-${e.type}-${i}`} className="align-top">
                    <td className="px-3 py-2 font-mono text-[13px] font-semibold text-foreground">.{e.ext}</td>
                    <td className="px-3 py-2 font-mono text-[13px] break-all text-foreground">
                      {e.type}
                      {e.unregistered && <span className="ml-1.5 rounded border px-1 font-sans text-[11px] text-muted-foreground" title="Not in the IANA registry, but widely used">unregistered</span>}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {e.description}
                      <span className="ml-1.5 text-xs">· {e.category}</span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <CopyButton text={e.type} size="sm" label="Copy" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {results.length > shown && (
            <div className="flex justify-center">
              <Button type="button" variant="outline" onClick={() => setShown((n) => n + PAGE * 2)}>
                Show more ({results.length - shown} left)
              </Button>
            </div>
          )}
        </>
      )}
      <p className="text-xs text-muted-foreground">{MIME_ENTRIES.length} common file types. “Unregistered” types (with an x- prefix or no IANA entry) are still the ones servers and browsers use for those formats.</p>
    </div>
  );
}
