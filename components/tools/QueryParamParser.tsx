"use client";

import React, { useId, useMemo, useState } from "react";
import { CodeBlock } from "@/components/tool/code-block";
import { Field, Notice, Segmented, TextArea, ToggleRow, ToolDivider, ToolSection } from "@/components/tool/kit";
import { Button } from "@/components/ui/button";
import { TRACKERS } from "@/lib/url/tracking";
import { quoteArg } from "@/lib/http/curl";
import { buildQuery, parseQuery, queryToObject, type QueryParam } from "@/lib/http/url";

const SAMPLES = [
  "https://shop.example.com/search?q=red+shoes&size=10&size=11&color[]=red&color[]=blue&utm_source=newsletter&fbclid=IwAR0abc",
  "?filter[status]=open&filter[owner]=42&page=2&sort=-created&debug",
  "name=Ada+Lovelace&email=ada%40example.com&note=50%25+off",
];

type View = "table" | "json" | "code";

function trackerOf(key: string): string | null {
  if (key.toLowerCase().startsWith("utm_")) return "Campaign tag (UTM)";
  return TRACKERS[key.toLowerCase()]?.name ?? null;
}

export default function QueryParamParser() {
  const id = useId();
  // Links often carry tokens, so this is not saved.
  const [input, setInput] = useState(SAMPLES[0]);
  const [plus, setPlus] = useState(true);
  const [nested, setNested] = useState(true);
  const [view, setView] = useState<View>("table");
  const [lang, setLang] = useState<"javascript" | "python" | "php" | "curl">("javascript");

  const params = useMemo(() => parseQuery(input, { plusIsSpace: plus }), [input, plus]);
  const obj = useMemo(() => queryToObject(params, { brackets: nested }), [params, nested]);
  const json = useMemo(() => JSON.stringify(obj, null, 2), [obj]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of params) map.set(p.key, (map.get(p.key) ?? 0) + 1);
    return map;
  }, [params]);

  const tracking = params.filter((p) => trackerOf(p.key));
  const cleaned = useMemo(
    () =>
      buildQuery(
        params.filter((p) => !trackerOf(p.key)).map((p) => ({ key: p.key, value: p.value })),
        { space: "percent" }
      ),
    [params]
  );

  const code = useMemo(() => {
    const pairs = params.map((p) => [p.key, p.value] as const);
    switch (lang) {
      case "javascript":
        return `const params = new URLSearchParams(${JSON.stringify(input.includes("?") ? input.slice(input.indexOf("?")).split("#")[0] : input.split("#")[0])});\n\nparams.get(${JSON.stringify(params[0]?.key ?? "name")});   // first value\nparams.getAll(${JSON.stringify(params.find((p) => (counts.get(p.key) ?? 0) > 1)?.key ?? params[0]?.key ?? "name")});   // every value\nObject.fromEntries(params);   // last value wins for repeated names\n[...params];   // [${pairs.slice(0, 2).map(([k, v]) => `[${JSON.stringify(k)}, ${JSON.stringify(v)}]`).join(", ")}${pairs.length > 2 ? ", …" : ""}]`;
      case "python":
        return `from urllib.parse import parse_qs, parse_qsl, urlsplit\n\nquery = urlsplit(${JSON.stringify(input.trim())}).query\nparse_qs(query)    # {'name': ['value', ...]}: every value is a list\nparse_qsl(query)   # [('name', 'value'), ...] keeps order and repeats`;
      case "php":
        return `<?php\n$query = parse_url(${JSON.stringify(input.trim())}, PHP_URL_QUERY);\nparse_str($query, $params);\nprint_r($params);   // name[]=a&name[]=b becomes an array; repeated plain names keep the last`;
      case "curl":
        return `curl -G https://example.com/endpoint \\\n${params.map((p) => `  --data-urlencode ${quoteArg(`${p.key}=${p.value}`)}`).join(" \\\n") || "  --data-urlencode 'name=value'"}`;
    }
  }, [lang, params, input, counts]);

  const cells = (p: QueryParam) => {
    const notes: string[] = [];
    if ((counts.get(p.key) ?? 0) > 1) notes.push("repeated");
    if (p.bare) notes.push("no value");
    if (!p.valid) notes.push("bad % escape");
    const t = trackerOf(p.key);
    if (t) notes.push(t);
    return notes;
  };

  return (
    <div className="space-y-8">
      <ToolSection title="Query string or URL" description="With or without the leading ?, or a whole link.">
        <Field label="Query string" htmlFor={`${id}-q`}>
          <TextArea id={`${id}-q`} rows={3} value={input} onChange={(e) => setInput(e.target.value)} placeholder="?q=hello+world&page=2" spellCheck={false} autoCapitalize="off" className="font-mono" />
        </Field>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Try</span>
          {SAMPLES.map((s, i) => (
            <button key={s} type="button" onClick={() => setInput(s)} className="rounded-full border bg-background px-2.5 py-0.5 text-xs text-foreground transition-colors hover:bg-muted">
              Example {i + 1}
            </button>
          ))}
        </div>
        <div className="grid gap-3 @md:grid-cols-2">
          <ToggleRow id={`${id}-plus`} label="+ means a space" description="True for forms and most query strings. Turn off if a literal + is expected." checked={plus} onCheckedChange={setPlus} />
          <ToggleRow id={`${id}-nested`} label="Understand a[b]=1 and a[]=1" description="Builds nested objects and arrays like PHP, Rails and the qs library do." checked={nested} onCheckedChange={setNested} />
        </div>
      </ToolSection>

      {params.length === 0 ? (
        <p className="text-sm text-muted-foreground">{input.trim() ? "No parameters found. A query string looks like name=value&other=value." : "Paste a query string to parse it."}</p>
      ) : (
        <>
          <ToolDivider />
          <ToolSection
            title={`${params.length} parameter${params.length === 1 ? "" : "s"}`}
            description={`${counts.size} distinct name${counts.size === 1 ? "" : "s"}${[...counts.values()].some((n) => n > 1) ? " · some repeat" : ""}`}
            actions={<Segmented size="sm" ariaLabel="View" value={view} onChange={setView} options={[{ value: "table", label: "Table" }, { value: "json", label: "JSON" }, { value: "code", label: "Code" }]} />}
          >
            {view === "table" && (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[30rem] text-left text-sm">
                  <thead className="bg-muted text-xs text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-3 py-2 font-medium">#</th>
                      <th scope="col" className="px-3 py-2 font-medium">Name</th>
                      <th scope="col" className="px-3 py-2 font-medium">Value (decoded)</th>
                      <th scope="col" className="px-3 py-2 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {params.map((p, i) => (
                      <tr key={`${p.rawKey}-${i}`} className="align-top">
                        <td className="px-3 py-2 text-muted-foreground tabular-nums">{i + 1}</td>
                        <td className="px-3 py-2 font-mono text-[13px] break-all text-foreground">{p.key}</td>
                        <td className="px-3 py-2 font-mono text-[13px] break-all text-foreground">{p.bare ? <em className="text-muted-foreground">(no value)</em> : p.value === "" ? <em className="text-muted-foreground">(empty)</em> : p.value}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{cells(p).join(" · ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {view === "json" && <CodeBlock label="JSON" code={json} maxHeight="26rem" />}
            {view === "code" && (
              <>
                <Segmented size="sm" ariaLabel="Language" value={lang} onChange={setLang} options={[{ value: "javascript", label: "JavaScript" }, { value: "python", label: "Python" }, { value: "php", label: "PHP" }, { value: "curl", label: "curl" }]} />
                <CodeBlock label={lang} code={code} maxHeight="20rem" />
              </>
            )}
          </ToolSection>

          {tracking.length > 0 && (
            <ToolSection title={`Tracking parameters (${tracking.length})`} description="These identify how a visitor arrived and do not change what the page shows.">
              <Notice tone="info">
                Found: {tracking.map((p) => p.key).join(", ")}. Without them the query string is:
              </Notice>
              <CodeBlock label="Cleaned query string" code={cleaned ? `?${cleaned}` : "(empty)"} maxHeight="8rem" wrap />
              <div>
                <Button type="button" variant="outline" size="sm" onClick={() => setInput(cleaned ? `?${cleaned}` : "")}>
                  Replace input with the cleaned version
                </Button>
              </div>
            </ToolSection>
          )}
        </>
      )}
    </div>
  );
}
