"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Copy, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Chips,
  Field,
  Notice,
  OptionCards,
  Segmented,
  SelectInput,
  Stat,
  StatGrid,
  TextArea,
  TextInput,
  ToggleRow,
  ToolDivider,
  ToolSection,
  UnitInput,
} from "@/components/tool/kit";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { copyText } from "@/lib/utils/clipboard";
import { downloadText } from "@/lib/utils/download";
import {
  NAMESPACES,
  VERSIONS,
  formatList,
  formatOne,
  inspect,
  nameBased,
  parse,
  v1Generator,
  v4,
  v7Generator,
  type ListStyle,
  type Style,
  type UuidVersion,
} from "@/lib/uuid/uuid";

interface Format {
  style: Style;
  upper: boolean;
  list: ListStyle;
}

const DEFAULT_FORMAT: Format = { style: "standard", upper: false, list: "lines" };
const MAX_COUNT = 1000;
const LIST_ROWS = 10;

export default function UuidGenerator() {
  const id = useId();
  const [mode, setMode] = useState<"generate" | "inspect">("generate");
  const [version, setVersion] = usePersistentState<UuidVersion>("uuid-version", "v4");
  const [count, setCount] = usePersistentState<number>("uuid-count", 5);
  const [format, setFormat] = usePersistentState<Format>("uuid-format", DEFAULT_FORMAT);
  const [ns, setNs] = useState("dns");
  const [customNs, setCustomNs] = useState("");
  const [names, setNames] = useState("");
  const [uuids, setUuids] = useState<string[]>([]);
  const [inspectText, setInspectText] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  const v7 = useRef<(() => string) | null>(null);
  const v1 = useRef<(() => string) | null>(null);
  const safeCount = Math.min(MAX_COUNT, Math.max(1, Math.floor(count) || 1));
  const nameBasedVersion = version === "v5" || version === "v3";
  const namespaceId = ns === "custom" ? customNs : NAMESPACES.find((n) => n.value === ns)!.id;

  const generate = useCallback(() => {
    // Random values only in the browser, so the page's HTML never contains them.
    if (version === "v7") {
      v7.current ??= v7Generator();
      setUuids(Array.from({ length: safeCount }, v7.current));
    } else if (version === "v1") {
      v1.current ??= v1Generator();
      setUuids(Array.from({ length: safeCount }, v1.current));
    } else if (version === "v4") {
      setUuids(Array.from({ length: safeCount }, v4));
    }
  }, [version, safeCount]);

  useEffect(() => {
    if (nameBasedVersion) return;
    const t = window.setTimeout(generate, 0);
    return () => window.clearTimeout(t);
  }, [generate, nameBasedVersion]);

  // Name-based: one UUID per line of names.
  useEffect(() => {
    if (!nameBasedVersion) return;
    let live = true;
    const lines = names.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, MAX_COUNT);
    const t = window.setTimeout(async () => {
      if (!parse(namespaceId)) {
        if (live) {
          setUuids([]);
          setNameError(ns === "custom" && customNs ? "The custom namespace must be a UUID." : null);
        }
        return;
      }
      try {
        const out = await Promise.all(lines.map((l) => nameBased(version === "v5" ? 5 : 3, namespaceId, l)));
        if (live) {
          setUuids(out);
          setNameError(null);
        }
      } catch {
        if (live) setNameError("These UUIDs couldn't be made in this browser.");
      }
    }, 120);
    return () => {
      live = false;
      window.clearTimeout(t);
    };
  }, [nameBasedVersion, names, namespaceId, version, ns, customNs]);

  const formatted = useMemo(() => uuids.map((u) => formatOne(u, format.style, format.upper)), [uuids, format.style, format.upper]);
  const output = useMemo(() => formatList(formatted, format.list), [formatted, format.list]);
  const info = useMemo(() => inspect(inspectText), [inspectText]);
  const dateFmt = useMemo(() => new Intl.DateTimeFormat(undefined, { dateStyle: "full", timeStyle: "medium" }), []);

  const copyAll = async () => {
    if (await copyText(output)) toast.success(formatted.length === 1 ? "UUID copied" : `${formatted.length} UUIDs copied`);
  };

  const download = () => {
    const ext = format.list === "json" ? "json" : format.list === "sql" ? "sql" : "txt";
    downloadText(output, `uuids-${version}-${formatted.length}.${ext}`, ext === "json" ? "application/json" : "text/plain;charset=utf-8");
  };

  return (
    <div className="space-y-8">
      <Segmented
        ariaLabel="What do you want to do?"
        value={mode}
        onChange={setMode}
        options={[
          { value: "generate", label: "Generate" },
          { value: "inspect", label: "Inspect a UUID" },
        ]}
      />

      {mode === "generate" ? (
        <>
          <ToolSection title="Version">
            <OptionCards ariaLabel="UUID version" value={version} onChange={setVersion} options={VERSIONS} className="@lg:grid-cols-2" />
          </ToolSection>

          {nameBasedVersion ? (
            <ToolSection title="Namespace and names" description="Each line becomes one UUID. The same namespace and name always give the same result.">
              <div className="grid gap-4 @md:grid-cols-2">
                <Field label="Namespace" htmlFor={`${id}-ns`}>
                  <SelectInput id={`${id}-ns`} value={ns} onChange={(e) => setNs(e.target.value)}>
                    {NAMESPACES.map((n) => (
                      <option key={n.value} value={n.value}>
                        {n.label}
                      </option>
                    ))}
                    <option value="custom">Custom UUID…</option>
                  </SelectInput>
                </Field>
                {ns === "custom" ? (
                  <Field label="Custom namespace" htmlFor={`${id}-custom`} error={nameError ?? undefined}>
                    <TextInput
                      id={`${id}-custom`}
                      value={customNs}
                      onChange={(e) => setCustomNs(e.target.value)}
                      placeholder="Your app's own namespace UUID"
                      spellCheck={false}
                      className="font-mono"
                    />
                  </Field>
                ) : (
                  <Field label="Namespace UUID">
                    <p className="flex h-10 items-center truncate font-mono text-sm text-muted-foreground">{namespaceId}</p>
                  </Field>
                )}
              </div>
              <Field label="Names" htmlFor={`${id}-names`} hint={`One per line, up to ${MAX_COUNT.toLocaleString()}. Case and spaces matter.`}>
                <TextArea
                  id={`${id}-names`}
                  rows={4}
                  value={names}
                  onChange={(e) => setNames(e.target.value)}
                  placeholder={ns === "url" ? "https://example.com/page" : "example.com"}
                  spellCheck={false}
                  className="font-mono"
                />
              </Field>
            </ToolSection>
          ) : (
            <ToolSection title="How many">
              <div className="flex flex-wrap items-center gap-3">
                <UnitInput
                  unit={safeCount === 1 ? "UUID" : "UUIDs"}
                  aria-label="How many UUIDs"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={MAX_COUNT}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-40"
                />
                <Chips
                  ariaLabel="Quick amounts"
                  value={String(safeCount)}
                  onChange={(v) => setCount(Number(v))}
                  options={["1", "10", "100", "1000"].map((v) => ({ value: v, label: v }))}
                />
              </div>
            </ToolSection>
          )}

          <ToolSection title="Format">
            <div className="grid gap-4 @lg:grid-cols-2">
              <Field label="Each UUID" htmlFor={`${id}-style`}>
                <SelectInput id={`${id}-style`} value={format.style} onChange={(e) => setFormat({ ...format, style: e.target.value as Style })}>
                  <option value="standard">Standard (8-4-4-4-12)</option>
                  <option value="compact">No hyphens</option>
                  <option value="braces">{"{Braces}"} — Microsoft GUID</option>
                  <option value="urn">urn:uuid: prefix</option>
                </SelectInput>
              </Field>
              <Field label="List as" htmlFor={`${id}-list`}>
                <SelectInput id={`${id}-list`} value={format.list} onChange={(e) => setFormat({ ...format, list: e.target.value as ListStyle })}>
                  <option value="lines">One per line</option>
                  <option value="comma">Comma-separated</option>
                  <option value="json">JSON array</option>
                  <option value="sql">SQL values (&apos;…&apos;)</option>
                </SelectInput>
              </Field>
            </div>
            <ToggleRow
              id={`${id}-upper`}
              label="Upper case"
              description="RFC 9562 writes UUIDs in lower case; some Microsoft tools use upper case."
              checked={format.upper}
              onCheckedChange={(upper) => setFormat({ ...format, upper })}
            />
          </ToolSection>

          <ToolDivider />

          <ToolSection
            title={formatted.length === 1 ? "Your UUID" : `${formatted.length.toLocaleString()} UUIDs`}
            actions={
              !nameBasedVersion && (
                <Button variant="ghost" size="sm" onClick={generate}>
                  <RefreshCw aria-hidden="true" /> New
                </Button>
              )
            }
          >
            {nameError && ns !== "custom" && <Notice tone="error">{nameError}</Notice>}
            {formatted.length === 0 ? (
              <p className="text-sm text-muted-foreground">{nameBasedVersion ? "Type a name to get its UUID." : "Generating…"}</p>
            ) : formatted.length <= LIST_ROWS && format.list === "lines" ? (
              <ul className="divide-y rounded-lg border" aria-live="polite">
                {formatted.map((u, i) => (
                  <li key={`${i}-${u}`} className="flex items-center gap-3 px-3.5 py-2">
                    <span className="min-w-0 flex-1 font-mono text-sm break-all text-foreground">{u}</span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Copy this UUID"
                      onClick={async () => {
                        if (await copyText(u)) toast.success("UUID copied");
                      }}
                    >
                      <Copy aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <TextArea aria-label="Generated UUIDs" readOnly rows={10} value={output} className="font-mono text-sm" spellCheck={false} />
            )}
            {version === "v7" && formatted.length > 1 && (
              <p className="text-xs text-muted-foreground">Listed in the order they were made; sorting them gives the same order.</p>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={download} disabled={!formatted.length}>
                <Download aria-hidden="true" /> Download
              </Button>
              <Button onClick={copyAll} disabled={!formatted.length}>
                <Copy aria-hidden="true" /> {formatted.length === 1 ? "Copy" : "Copy all"}
              </Button>
            </div>
          </ToolSection>
        </>
      ) : (
        <>
          <Field label="UUID to inspect" htmlFor={`${id}-inspect`} hint="Any form works: with or without hyphens, in braces, or with urn:uuid:.">
            <TextInput
              id={`${id}-inspect`}
              value={inspectText}
              onChange={(e) => setInspectText(e.target.value)}
              placeholder="017f22e2-79b0-7cc3-98c4-dc0c0c07398f"
              spellCheck={false}
              autoComplete="off"
              className="font-mono"
              aria-invalid={info && "error" in info ? true : undefined}
            />
          </Field>
          {info && "error" in info && <Notice tone="error">{info.error}</Notice>}
          {info && !("error" in info) && (
            <>
              <StatGrid>
                <Stat label="Version" value={info.special ? info.versionName : `Version ${info.version}`} hint={info.special ? undefined : info.versionName} />
                <Stat label="Variant" value={info.variant.split(" (")[0]} hint={info.variant.includes("(") ? info.variant.slice(info.variant.indexOf("(") + 1, -1) : undefined} />
                <Stat label="Created" value={info.time ? info.time.toISOString().slice(0, 10) : "—"} hint={info.time ? dateFmt.format(info.time) : "Not recorded in this version"} />
                <Stat label="Valid" value="Yes" tone="success" hint="Well-formed UUID" />
              </StatGrid>
              <dl className="divide-y rounded-lg border text-sm">
                {[
                  ["Standard form", info.canonical],
                  ["Upper case", info.canonical.toUpperCase()],
                  ["No hyphens", info.canonical.replace(/-/g, "")],
                  ...(info.time ? [["Timestamp (UTC)", info.time.toISOString()]] : []),
                  ...(info.clockSeq !== undefined ? [["Clock sequence", String(info.clockSeq)]] : []),
                  ...(info.node ? [["Node", info.node]] : []),
                ].map(([k, v]) => (
                  <div key={k} className="grid gap-1 px-3.5 py-2.5 @md:grid-cols-[10rem_1fr] @md:gap-4">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="flex min-w-0 items-center justify-between gap-2">
                      <span className="min-w-0 font-mono break-all text-foreground">{v}</span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Copy ${k.toLowerCase()}`}
                        onClick={async () => {
                          if (await copyText(v)) toast.success("Copied");
                        }}
                      >
                        <Copy aria-hidden="true" />
                      </Button>
                    </dd>
                  </div>
                ))}
              </dl>
              {info.notes.map((n) => (
                <Notice key={n} tone="info">
                  {n}
                </Notice>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
