"use client";

import React, { useId, useMemo, useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Chips, Field, Notice, Segmented, TextArea, TextInput, ToggleRow, ToolDivider, ToolSection, UnitInput } from "@/components/tool/kit";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { copyText } from "@/lib/utils/clipboard";
import { DEFAULT_SLUG, encodedLength, slugify, type SlugOptions } from "@/lib/text/slug";

/** Search results show about this much of a URL; longer slugs are cut off there. */
const LONG_SLUG = 75;

export default function SlugGenerator() {
  const id = useId();
  const [input, setInput] = useState("");
  const [stored, setOpts] = usePersistentState<SlugOptions>("slug-options", DEFAULT_SLUG);
  const [base, setBase] = usePersistentState<string>("slug-base-url", "");
  // Saved options from before a setting existed get its default.
  const opts = useMemo(() => ({ ...DEFAULT_SLUG, ...stored }), [stored]);

  const lines = useMemo(() => input.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 500), [input]);
  const slugs = useMemo(() => lines.map((l) => ({ title: l, slug: slugify(l, opts) })), [lines, opts]);
  const lost = slugs.filter((s) => !s.slug).length;
  const prefix = base.trim() ? (base.trim().endsWith("/") ? base.trim() : `${base.trim()}/`) : "";

  const set = <K extends keyof SlugOptions>(k: K, v: SlugOptions[K]) => setOpts({ ...opts, [k]: v });

  return (
    <div className="space-y-8">
      <ToolSection title="Titles">
        <Field label="Title or headline" htmlFor={`${id}-in`} hint="One per line to make several slugs at once.">
          <TextArea
            id={`${id}-in`}
            rows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"How to Build a Fast & Modern Web App in 2026!\nनमस्ते भारत"}
          />
        </Field>
      </ToolSection>

      <ToolSection title="Options">
        <div className="grid gap-4 @lg:grid-cols-2">
          <Field label="Separator">
            <Segmented
              size="sm"
              ariaLabel="Word separator"
              value={opts.separator}
              onChange={(v) => set("separator", v)}
              options={[
                { value: "-", label: "Hyphen -" },
                { value: "_", label: "Underscore _" },
                { value: ".", label: "Dot ." },
                { value: "/", label: "Slash /" },
              ]}
            />
          </Field>
          <Field label="Maximum length" hint="Cut at a word boundary. 0 means no limit.">
            <div className="flex flex-wrap items-center gap-2">
              <UnitInput
                unit="chars"
                aria-label="Maximum length"
                type="number"
                inputMode="numeric"
                min={0}
                max={500}
                value={opts.maxLength}
                onChange={(e) => set("maxLength", Math.max(0, Math.min(500, Math.floor(Number(e.target.value) || 0))))}
                className="w-32"
              />
              <Chips
                ariaLabel="Common lengths"
                value={String(opts.maxLength)}
                onChange={(v) => set("maxLength", Number(v))}
                options={[
                  { value: "0", label: "No limit" },
                  { value: "50", label: "50" },
                  { value: "75", label: "75" },
                ]}
              />
            </div>
          </Field>
        </div>
        <div className="grid gap-4 @lg:grid-cols-2">
          <ToggleRow id={`${id}-lower`} label="Lower case" description="URLs can be case-sensitive; lower case avoids duplicates." checked={opts.lowercase} onCheckedChange={(v) => set("lowercase", v)} />
          <ToggleRow
            id={`${id}-unicode`}
            label="Keep other scripts"
            description="हिंदी stays हिंदी instead of becoming hindi. Browsers and search engines support it."
            checked={opts.keepUnicode}
            onCheckedChange={(v) => set("keepUnicode", v)}
          />
          <ToggleRow id={`${id}-symbols`} label="Symbols as words" description="& becomes and, @ becomes at, % becomes percent." checked={opts.symbolsAsWords} onCheckedChange={(v) => set("symbolsAsWords", v)} />
          <ToggleRow
            id={`${id}-stop`}
            label="Drop small words"
            description="Removes a, the, of, to and similar English words for shorter slugs."
            checked={opts.removeStopWords}
            onCheckedChange={(v) => set("removeStopWords", v)}
          />
          <ToggleRow id={`${id}-nums`} label="Remove numbers" description="Leave out years and counts that may date the page." checked={opts.removeNumbers} onCheckedChange={(v) => set("removeNumbers", v)} />
        </div>
        <Field label="Preview on your site" htmlFor={`${id}-base`} hint="Optional, for a preview of the full address. Not saved anywhere but this browser.">
          <TextInput id={`${id}-base`} type="url" inputMode="url" value={base} onChange={(e) => setBase(e.target.value)} placeholder="https://example.com/blog/" spellCheck={false} />
        </Field>
      </ToolSection>

      <ToolDivider />

      <ToolSection
        title={slugs.length > 1 ? `${slugs.length} slugs` : "Slug"}
        actions={
          slugs.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (await copyText(slugs.map((s) => prefix + s.slug).join("\n"))) toast.success("All slugs copied");
              }}
            >
              <Copy aria-hidden="true" /> Copy all
            </Button>
          )
        }
      >
        {slugs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Type a title to get its slug.</p>
        ) : (
          <ul className="divide-y rounded-lg border" aria-live="polite">
            {slugs.map((s, i) => {
              const long = s.slug.length > LONG_SLUG;
              const encoded = encodedLength(s.slug);
              return (
                <li key={`${i}-${s.title}`} className="flex items-start gap-3 px-3.5 py-2.5">
                  <div className="min-w-0 flex-1">
                    {slugs.length > 1 && <p className="truncate text-xs text-muted-foreground">{s.title}</p>}
                    <p className="font-mono text-sm break-all text-foreground">
                      {prefix && <span className="text-muted-foreground">{prefix}</span>}
                      {s.slug || <span className="text-muted-foreground">(nothing left)</span>}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {s.slug.length} characters
                      {encoded !== s.slug.length && ` · ${encoded} once encoded in a URL`}
                      {long && <span className="text-warning"> · long for search results</span>}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Copy this slug"
                    disabled={!s.slug}
                    onClick={async () => {
                      if (await copyText(prefix + s.slug)) toast.success(prefix ? "URL copied" : "Slug copied");
                    }}
                  >
                    <Copy aria-hidden="true" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
        {lost > 0 && (
          <Notice tone="info">
            {lost === 1 ? "One title has" : `${lost} titles have`} no letters this tool can convert to Latin. Turn on Keep other scripts to use them as
            they are.
          </Notice>
        )}
      </ToolSection>
    </div>
  );
}
