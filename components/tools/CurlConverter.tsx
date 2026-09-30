"use client";

import React, { useId, useMemo, useState } from "react";
import { CodeBlock } from "@/components/tool/code-block";
import { Field, Notice, Segmented, TextArea, ToggleRow, ToolDivider, ToolSection } from "@/components/tool/kit";
import { Button } from "@/components/ui/button";
import { parseCurl } from "@/lib/http/curl";
import { TARGET_LABELS, generateCode, type CodeTarget } from "@/lib/http/codegen";
import { getHeader, mediaType } from "@/lib/http/request";

export type ConverterTarget = "fetch" | "axios" | "python" | "javascript";

const EXAMPLE = `curl -X POST 'https://api.example.com/v1/orders?expand=items' \\
  -H 'Authorization: Bearer YOUR_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -H 'Accept: application/json' \\
  -d '{"customer_id": 42, "items": [{"sku": "A-100", "qty": 2}], "gift": false}'`;

const FORM_EXAMPLE = `curl https://example.com/api/login \\
  -u 'ada:secret' \\
  -d 'remember=1' \\
  --data-urlencode 'note=needs a call back' \\
  --compressed`;

const UPLOAD_EXAMPLE = `curl -X POST https://example.com/upload \\
  -H 'X-Api-Key: abc123' \\
  -F 'title=Holiday photo' \\
  -F 'file=@/tmp/photo.jpg;type=image/jpeg'`;

const CONFIG: Record<ConverterTarget, { targets: CodeTarget[]; label: string }> = {
  fetch: { targets: ["fetch"], label: "Fetch" },
  axios: { targets: ["axios"], label: "Axios" },
  python: { targets: ["python-requests", "python-httpx", "python-urllib"], label: "Python" },
  javascript: { targets: ["fetch", "xhr", "node-https", "jquery", "axios"], label: "JavaScript" },
};

const RUN_NOTE: Record<CodeTarget, string> = {
  fetch: "Runs in browsers and in Node.js 18 or later. It needs no install.",
  xhr: "Runs in any browser. Not available in Node.js.",
  "node-https": "Runs in Node.js with no install (CommonJS shown).",
  jquery: "Needs jQuery on the page. Browser only.",
  axios: "Install with npm install axios. Works in browsers and Node.js.",
  "python-requests": "Install with pip install requests.",
  "python-httpx": "Install with pip install httpx.",
  "python-urllib": "Standard library: nothing to install.",
};

export default function CurlConverter({ target }: { target: ConverterTarget }) {
  const id = useId();
  const cfg = CONFIG[target];
  // Commands often contain tokens, so the text is not saved.
  const [input, setInput] = useState(EXAMPLE);
  const [lang, setLang] = useState<CodeTarget>(cfg.targets[0]);
  const [fetchStyle, setFetchStyle] = useState<"async" | "then">("async");
  const [axiosStyle, setAxiosStyle] = useState<"config" | "shorthand">("config");
  const [modules, setModules] = useState<"esm" | "cjs">("esm");
  const [errorHandling, setErrorHandling] = useState(true);
  const [matchCurlRedirects, setMatchCurlRedirects] = useState(false);
  const [parse, setParse] = useState<"auto" | "json" | "text">("auto");

  const parsed = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return { ok: true as const, ...parseCurl(input) };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  }, [input]);

  const out = useMemo(() => (parsed?.ok ? generateCode(lang, parsed.request, { fetchStyle, axiosStyle, modules, errorHandling, matchCurlRedirects, parse }) : null), [parsed, lang, fetchStyle, axiosStyle, modules, errorHandling, matchCurlRedirects, parse]);

  const req = parsed?.ok ? parsed.request : null;
  const body = req?.body;
  const bodyLabel = !body || body.kind === "none" ? "No body" : body.kind === "raw" ? (mediaType(getHeader(req!.headers, "content-type")) || "raw text") : body.kind === "urlencoded" ? "Form (urlencoded)" : body.kind === "multipart" ? "Multipart form" : "File";

  return (
    <div className="space-y-8">
      <ToolSection title="curl command" description="Paste one from API documentation, a bug report or your browser's “Copy as cURL”.">
        <Field label="curl command" htmlFor={`${id}-in`}>
          <TextArea id={`${id}-in`} rows={8} value={input} onChange={(e) => setInput(e.target.value)} placeholder={"curl https://api.example.com/items \\\n  -H 'Accept: application/json'"} spellCheck={false} autoCapitalize="off" className="font-mono" wrap="off" />
        </Field>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Try</span>
          {[
            ["JSON POST", EXAMPLE],
            ["Form + basic auth", FORM_EXAMPLE],
            ["File upload", UPLOAD_EXAMPLE],
          ].map(([label, text]) => (
            <Button key={label} type="button" variant="outline" size="xs" onClick={() => setInput(text)}>
              {label}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Read in your browser, not sent anywhere. It understands Bash, Windows cmd and PowerShell quoting, $&apos;…&apos; strings, line continuations and combined flags such as -sSL.</p>
      </ToolSection>

      {parsed && !parsed.ok && <Notice tone="error">{parsed.error}</Notice>}

      {parsed?.ok && out && (
        <>
          <ToolDivider />
          <ToolSection title={`${cfg.label} code`}>
            {cfg.targets.length > 1 && <Segmented size="sm" ariaLabel="Library" value={lang} onChange={setLang} options={cfg.targets.map((t) => ({ value: t, label: TARGET_LABELS[t] }))} />}
            <div className="grid gap-x-8 gap-y-3 @md:grid-cols-2">
              {lang === "fetch" && (
                <Field label="Style">
                  <Segmented size="sm" ariaLabel="Fetch style" value={fetchStyle} onChange={setFetchStyle} options={[{ value: "async", label: "async / await" }, { value: "then", label: ".then() chain" }]} />
                </Field>
              )}
              {lang === "axios" && (
                <>
                  <Field label="Call style">
                    <Segmented size="sm" ariaLabel="Axios style" value={axiosStyle} onChange={setAxiosStyle} options={[{ value: "config", label: "axios({ … })" }, { value: "shorthand", label: "axios.post(…)" }]} />
                  </Field>
                  <Field label="Modules">
                    <Segmented size="sm" ariaLabel="Module system" value={modules} onChange={setModules} options={[{ value: "esm", label: "import" }, { value: "cjs", label: "require" }]} />
                  </Field>
                </>
              )}
              <Field label="Print the response as">
                <Segmented size="sm" ariaLabel="Response format" value={parse} onChange={setParse} options={[{ value: "auto", label: "Auto" }, { value: "json", label: "JSON" }, { value: "text", label: "Text" }]} />
              </Field>
            </div>
            <div className="grid gap-x-8 gap-y-3 @md:grid-cols-2">
              <ToggleRow id={`${id}-err`} label="Check for errors" description="Throw or report when the status is not 2xx." checked={errorHandling} onCheckedChange={setErrorHandling} />
              <ToggleRow id={`${id}-redir`} label="Match curl's redirect behaviour" description="curl does not follow redirects unless you pass -L. Most libraries do by default." checked={matchCurlRedirects} onCheckedChange={setMatchCurlRedirects} />
            </div>
            <CodeBlock label={TARGET_LABELS[lang]} code={out.code} maxHeight="30rem" />
            <p className="text-xs text-muted-foreground">{RUN_NOTE[lang]}</p>
            {out.notes.map((n) => (
              <Notice key={n} tone="info">
                {n}
              </Notice>
            ))}
            {parsed.warnings.map((w) => (
              <Notice key={w} tone="warning">
                {w}
              </Notice>
            ))}
            {parsed.notes.map((n) => (
              <Notice key={n} tone="info">
                {n}
              </Notice>
            ))}
          </ToolSection>

          <ToolSection title="What was understood" description="Check this against the command to make sure nothing was misread.">
            <dl className="divide-y rounded-lg border text-sm">
              <div className="grid gap-1 px-3.5 py-2.5 @md:grid-cols-[8rem_1fr] @md:gap-4">
                <dt className="text-muted-foreground">Method</dt>
                <dd className="font-mono text-[13px] text-foreground">{req!.method}</dd>
              </div>
              <div className="grid gap-1 px-3.5 py-2.5 @md:grid-cols-[8rem_1fr] @md:gap-4">
                <dt className="text-muted-foreground">URL</dt>
                <dd className="font-mono text-[13px] break-all text-foreground">{req!.url}</dd>
              </div>
              <div className="grid gap-1 px-3.5 py-2.5 @md:grid-cols-[8rem_1fr] @md:gap-4">
                <dt className="text-muted-foreground">Headers</dt>
                <dd className="space-y-0.5 font-mono text-[13px] break-all text-foreground">{req!.headers.length ? req!.headers.map((h, i) => <div key={`${h.name}-${i}`}>{h.name}: {h.value}</div>) : <span className="text-muted-foreground">none</span>}</dd>
              </div>
              {req!.basicAuth && (
                <div className="grid gap-1 px-3.5 py-2.5 @md:grid-cols-[8rem_1fr] @md:gap-4">
                  <dt className="text-muted-foreground">Basic auth</dt>
                  <dd className="font-mono text-[13px] text-foreground">{req!.basicAuth.user}:{"•".repeat(Math.min(8, req!.basicAuth.password.length))}</dd>
                </div>
              )}
              <div className="grid gap-1 px-3.5 py-2.5 @md:grid-cols-[8rem_1fr] @md:gap-4">
                <dt className="text-muted-foreground">Body</dt>
                <dd className="text-foreground">{bodyLabel}</dd>
              </div>
            </dl>
          </ToolSection>
        </>
      )}
    </div>
  );
}
