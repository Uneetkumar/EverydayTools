"use client";

import React, { useId, useMemo, useState } from "react";
import { CodeBlock } from "@/components/tool/code-block";
import { Field, Notice, OptionCards, Segmented, TextArea, TextInput, ToggleRow, ToolDivider, ToolSection } from "@/components/tool/kit";
import { KeyValueEditor, activeRows, newRow, type KvRow } from "@/components/tool/kv-editor";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { quoteArg } from "@/lib/http/curl";
import { buildQuery, flattenObject, parseQuery, splitBase, type ArrayFormat } from "@/lib/http/url";

type Source = "rows" | "json" | "import";

const FORMATS: { value: ArrayFormat; label: string; description: string }[] = [
  { value: "repeat", label: "Repeat the name", description: "tag=a&tag=b — the default for HTML forms, Express, Flask and Go" },
  { value: "brackets", label: "Brackets", description: "tag[]=a&tag[]=b — PHP and Rails" },
  { value: "indices", label: "Indexed", description: "tag[0]=a&tag[1]=b — PHP, Laravel, qs" },
  { value: "comma", label: "Comma separated", description: "tag=a,b — some APIs, OpenAPI style=form explode=false" },
];

const DEFAULT_ROWS: KvRow[] = [newRow("q", "red shoes"), newRow("size", "10"), newRow("size", "11"), newRow("sort", "price asc")];
const DEFAULT_JSON = `{\n  "q": "red shoes",\n  "size": [10, 11],\n  "filter": { "status": "open", "tags": ["new", "sale"] }\n}`;

export default function QueryStringBuilder() {
  const id = useId();
  const [source, setSource] = useState<Source>("rows");
  const [base, setBase] = useState("https://api.example.com/search");
  const [rows, setRows] = useState<KvRow[]>(DEFAULT_ROWS);
  const [json, setJson] = useState(DEFAULT_JSON);
  const [imported, setImported] = useState("");
  const [opts, setOpts] = usePersistentState<{ format: ArrayFormat; space: "percent" | "plus"; sort: boolean; skipEmpty: boolean; encode: boolean }>("query-builder-options", { format: "repeat", space: "percent", sort: false, skipEmpty: false, encode: true });
  const [lang, setLang] = useState<"javascript" | "python" | "php" | "curl">("javascript");

  const entries = useMemo(() => {
    if (source === "rows") return { list: activeRows(rows).map((r) => ({ key: r.key, value: r.value })), error: null as string | null };
    if (source === "json") {
      try {
        const v: unknown = JSON.parse(json);
        if (v === null || typeof v !== "object" || Array.isArray(v)) return { list: [], error: "The JSON must be an object, like {\"name\": \"value\"}." };
        return { list: flattenObject(v, opts.format), error: null };
      } catch (e) {
        return { list: [], error: `Not valid JSON: ${(e as Error).message}` };
      }
    }
    return { list: parseQuery(imported).map((p) => ({ key: p.key, value: p.value })), error: null };
  }, [source, rows, json, imported, opts.format]);

  const query = useMemo(() => buildQuery(entries.list, opts), [entries.list, opts]);
  const { url, baseWarning } = useMemo(() => {
    const b = base.trim();
    if (!b) return { url: query ? `?${query}` : "", baseWarning: null as string | null };
    const parts = splitBase(b);
    const joined = `${parts.base}?${[parts.query, query].filter(Boolean).join("&")}${parts.hash}`;
    return { url: query || parts.query ? joined : parts.base + parts.hash, baseWarning: parts.query && query ? "The base URL already has a query string. The new parameters are added after it." : null };
  }, [base, query]);

  const code = useMemo(() => {
    const pairs = entries.list.filter((e) => e.key || e.value);
    switch (lang) {
      case "javascript": {
        const lines = ["const params = new URLSearchParams();", ...pairs.map((p) => `params.append(${JSON.stringify(p.key)}, ${JSON.stringify(p.value)});`)];
        return `${lines.join("\n")}\n\nconst url = \`${(base.trim() || "https://example.com/path").split("?")[0]}?\${params}\`;   // ${opts.space === "plus" ? "spaces become +" : "note: URLSearchParams writes spaces as +"}`;
      }
      case "python":
        return `from urllib.parse import urlencode\n\nparams = [\n${pairs.map((p) => `    (${JSON.stringify(p.key)}, ${JSON.stringify(p.value)}),`).join("\n")}\n]\nquery = urlencode(params)${opts.space === "percent" ? "  # spaces become +; use quote_via=quote for %20" : ""}\nurl = f"${(base.trim() || "https://example.com/path").split("?")[0]}?{query}"`;
      case "php": {
        const obj: Record<string, string | string[]> = {};
        for (const p of pairs) {
          const k = p.key.replace(/\[\]$/, "");
          const cur = obj[k];
          if (cur === undefined) obj[k] = p.value;
          else obj[k] = Array.isArray(cur) ? [...cur, p.value] : [cur, p.value];
        }
        const phpv = (v: string | string[]): string => (Array.isArray(v) ? `[${v.map((x) => `'${x.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`).join(", ")}]` : `'${v.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`);
        return `<?php\n$params = [\n${Object.entries(obj).map(([k, v]) => `    '${k.replace(/'/g, "\\'")}' => ${phpv(v)},`).join("\n")}\n];\n$url = '${(base.trim() || "https://example.com/path").split("?")[0]}?' . http_build_query($params);`;
      }
      case "curl":
        return `curl -G ${quoteArg((base.trim() || "https://example.com/path").split("?")[0])} \\\n${pairs.map((p) => `  --data-urlencode ${quoteArg(`${p.key}=${p.value}`)}`).join(" \\\n")}`;
    }
  }, [lang, entries.list, base, opts.space]);

  return (
    <div className="space-y-8">
      <ToolSection title="Parameters">
        <Segmented ariaLabel="Where do the parameters come from?" value={source} onChange={setSource} options={[{ value: "rows", label: "Rows" }, { value: "json", label: "From JSON" }, { value: "import", label: "Import" }]} />
        {source === "rows" && (
          <>
            <KeyValueEditor rows={rows} onChange={setRows} label="Parameter" keyPlaceholder="name" valuePlaceholder="value" />
            <p className="text-xs text-muted-foreground">Repeat a name on several rows to send several values. Switch a row off to leave it out without deleting it.</p>
          </>
        )}
        {source === "json" && (
          <Field label="JSON object" htmlFor={`${id}-json`} hint="Nested objects become filter[status]=open; arrays follow the array format below.">
            <TextArea id={`${id}-json`} rows={8} value={json} onChange={(e) => setJson(e.target.value)} spellCheck={false} className="font-mono" />
          </Field>
        )}
        {source === "import" && (
          <Field label="Existing query string or URL" htmlFor={`${id}-imp`} hint="It is decoded and re-encoded with the options below. Useful for switching a string between formats.">
            <TextArea id={`${id}-imp`} rows={3} value={imported} onChange={(e) => setImported(e.target.value)} placeholder="?q=red%20shoes&size=10&size=11" spellCheck={false} className="font-mono" />
          </Field>
        )}
        {entries.error && <Notice tone="error">{entries.error}</Notice>}
      </ToolSection>

      <ToolSection title="Options">
        <Field label="Arrays (repeated names)">
          <OptionCards ariaLabel="Array format" value={opts.format} onChange={(format) => setOpts({ ...opts, format })} options={FORMATS} className="@xl:grid-cols-2" />
        </Field>
        <div className="grid gap-x-8 gap-y-4 @md:grid-cols-2">
          <Field label="Spaces are written as">
            <Segmented ariaLabel="Space encoding" value={opts.space} onChange={(space) => setOpts({ ...opts, space })} options={[{ value: "percent", label: "%20" }, { value: "plus", label: "+" }]} />
          </Field>
          <ToggleRow id={`${id}-enc`} label="Encode special characters" description="Off leaves accents and symbols as typed, escaping only & = # % and spaces." checked={opts.encode} onCheckedChange={(encode) => setOpts({ ...opts, encode })} />
          <ToggleRow id={`${id}-sort`} label="Sort by name" description="A stable order, for signing and caching." checked={opts.sort} onCheckedChange={(sort) => setOpts({ ...opts, sort })} />
          <ToggleRow id={`${id}-skip`} label="Leave out empty values" checked={opts.skipEmpty} onCheckedChange={(skipEmpty) => setOpts({ ...opts, skipEmpty })} />
        </div>
      </ToolSection>

      <ToolDivider />

      <ToolSection title="Result">
        <Field label="Base URL (optional)" htmlFor={`${id}-base`} hint="Adds the query string to a full address.">
          <TextInput id={`${id}-base`} value={base} onChange={(e) => setBase(e.target.value)} placeholder="https://api.example.com/search" spellCheck={false} autoCapitalize="off" className="font-mono" />
        </Field>
        <CodeBlock label={`Query string · ${entries.list.length} parameter${entries.list.length === 1 ? "" : "s"}`} code={query ? `?${query}` : ""} wrap maxHeight="10rem" empty="Add a parameter to build a query string." />
        {base.trim() && url && <CodeBlock label="Full URL" code={url} wrap maxHeight="10rem" />}
        {baseWarning && <Notice tone="info">{baseWarning}</Notice>}
        {opts.format === "comma" && <Notice tone="info">Comma-separated values work only if the API documents them. A comma inside a value is indistinguishable from a separator, so such values need another format.</Notice>}
      </ToolSection>

      <ToolSection title="Do it in code">
        <Segmented size="sm" ariaLabel="Language" value={lang} onChange={setLang} options={[{ value: "javascript", label: "JavaScript" }, { value: "python", label: "Python" }, { value: "php", label: "PHP" }, { value: "curl", label: "curl" }]} />
        <CodeBlock label={lang} code={code} maxHeight="18rem" />
      </ToolSection>
    </div>
  );
}
