"use client";

import React, { useId, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Info, ShieldCheck, XCircle } from "lucide-react";
import { Field, Notice, Segmented, TextArea, ToolDivider, ToolSection } from "@/components/tool/kit";
import { Button } from "@/components/ui/button";
import { analyze, describeValue, parseHeaderBlocks, type Finding, type HeaderBlock, type Level } from "@/lib/http/headers";
import { getStatus } from "@/lib/http/status";
import { cn } from "@/lib/utils";

const SAMPLE_RESPONSE = `HTTP/2 200
content-type: text/html
cache-control: public, max-age=3600, s-maxage=600
etag: W/"5d8c72a5edda8d6a"
strict-transport-security: max-age=31536000; includeSubDomains
content-security-policy: default-src 'self'; script-src 'self' 'unsafe-inline'
x-content-type-options: nosniff
set-cookie: session=abc123; Path=/; Secure; HttpOnly; SameSite=Lax
set-cookie: theme=dark; Path=/
access-control-allow-origin: *
server: nginx/1.24.0
x-powered-by: Express
vary: Accept-Encoding, Cookie`;

const SAMPLE_REQUEST = `GET /api/orders?page=2 HTTP/1.1
Host: api.example.com
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36
Accept: application/json, text/plain;q=0.9, */*;q=0.8
Accept-Encoding: gzip, deflate, br
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.c2lnbmF0dXJl
Cookie: session=abc123; theme=dark
Origin: https://app.example.com
Sec-Fetch-Site: cross-site`;

const ICON: Record<Level, React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>> = { bad: XCircle, warn: AlertTriangle, info: Info, good: CheckCircle2 };
const TONE: Record<Level, string> = { bad: "text-destructive", warn: "text-warning", info: "text-muted-foreground", good: "text-success" };
const LABEL: Record<Level, string> = { bad: "Problem", warn: "Worth fixing", info: "Note", good: "Good" };

function FindingItem({ f }: { f: Finding }) {
  const Icon = ICON[f.level];
  return (
    <li className="flex items-start gap-3 px-3.5 py-3">
      <Icon aria-hidden="true" className={cn("mt-0.5 size-4 shrink-0", TONE[f.level])} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">
          <span className="sr-only">{LABEL[f.level]}: </span>
          {f.title}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">{f.detail}</p>
      </div>
    </li>
  );
}

function HeaderRow({ h, flagged }: { h: HeaderBlock["headers"][number]; flagged?: Level }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const parts = useMemo(() => (open ? describeValue(h.name, h.value) : null), [open, h.name, h.value]);
  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 px-3.5 py-2.5 text-left transition-colors outline-none hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-mono text-sm font-semibold break-all text-foreground">{h.name}</span>
            {h.info?.deprecated && <span className="rounded border px-1.5 text-[11px] text-warning">deprecated</span>}
            {h.info?.nonStandard && <span className="rounded border px-1.5 text-[11px] text-muted-foreground">non-standard</span>}
            {!h.info && <span className="rounded border px-1.5 text-[11px] text-muted-foreground">custom</span>}
            {flagged && flagged !== "good" && <span className={cn("text-[11px] font-medium", TONE[flagged])}>{LABEL[flagged]}</span>}
          </span>
          <span className="mt-0.5 block font-mono text-[13px] break-all text-muted-foreground">{h.value || "(empty)"}</span>
        </span>
        <ChevronDown aria-hidden="true" className={cn("mt-1 size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div id={id} className="space-y-3 border-t bg-muted/20 px-3.5 py-3">
          <p className="text-sm text-foreground">{h.info ? h.info.summary : h.name.toLowerCase().startsWith("x-") ? "A custom header (the X- prefix marks application-specific headers). Its meaning is defined by the service that sends it." : "Not a header this tool recognises. It may be a custom header defined by the service that sends it."}</p>
          {h.info && (
            <p className="text-xs text-muted-foreground">
              {h.info.category} · {h.info.kind === "both" ? "request and response" : h.info.kind} header · {h.info.spec}
              {h.info.example ? (
                <>
                  {" "}
                  · e.g. <code className="font-mono">{h.info.example}</code>
                </>
              ) : null}
            </p>
          )}
          {parts && parts.length > 0 && (
            <dl className="divide-y rounded-lg border bg-background text-sm">
              {parts.map((p, i) => (
                <div key={`${p.label}-${i}`} className="grid gap-1 px-3 py-2 @md:grid-cols-[minmax(8rem,14rem)_1fr] @md:gap-4">
                  <dt className="font-mono text-[13px] break-all text-foreground">{p.label}</dt>
                  <dd className="text-muted-foreground">{p.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </li>
  );
}

export default function HttpHeaderViewer() {
  const id = useId();
  // Pasted headers often hold tokens and cookies, so they are kept in memory only.
  const [text, setText] = useState("");
  const [pick, setPick] = useState(0);

  const blocks = useMemo(() => (text.length > 200_000 ? [] : parseHeaderBlocks(text)), [text]);
  const block = blocks[Math.min(pick, Math.max(blocks.length - 1, 0))];
  const analysis = useMemo(() => (block ? analyze(block) : null), [block]);
  const tooBig = text.length > 200_000;

  const flagByHeader = useMemo(() => {
    const order: Record<Level, number> = { bad: 0, warn: 1, info: 2, good: 3 };
    const map = new Map<string, Level>();
    for (const f of analysis?.findings ?? []) {
      if (!f.header) continue;
      const k = f.header.toLowerCase();
      const cur = map.get(k);
      if (!cur || order[f.level] < order[cur]) map.set(k, f.level);
    }
    return map;
  }, [analysis]);

  const counts = useMemo(() => {
    const c = { bad: 0, warn: 0, info: 0, good: 0 } as Record<Level, number>;
    for (const f of analysis?.findings ?? []) c[f.level]++;
    return c;
  }, [analysis]);

  const isResponse = block?.start ? block.start.kind === "response" : !!analysis?.security;

  return (
    <div className="space-y-8">
      <ToolSection title="Paste headers" description="From curl -I, your browser's developer tools (Network tab), a server log or an API client. A status line or request line is optional.">
        <Field label="HTTP headers" htmlFor={`${id}-in`}>
          <TextArea id={`${id}-in`} rows={9} value={text} onChange={(e) => { setText(e.target.value); setPick(0); }} placeholder={"HTTP/1.1 200 OK\nContent-Type: text/html; charset=utf-8\nCache-Control: max-age=3600"} spellCheck={false} className="font-mono" />
        </Field>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => { setText(SAMPLE_RESPONSE); setPick(0); }}>Try a response</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => { setText(SAMPLE_REQUEST); setPick(0); }}>Try a request</Button>
          {text && (
            <Button type="button" variant="ghost" size="sm" onClick={() => { setText(""); setPick(0); }}>
              Clear
            </Button>
          )}
          <span className="text-xs text-muted-foreground">Headers are read in your browser. Nothing is sent anywhere, so pasting real ones is fine, though you may want to remove tokens before sharing a screenshot.</span>
        </div>
      </ToolSection>

      {tooBig && <Notice tone="warning">That is over 200 KB. Paste only the header block, without the body.</Notice>}

      {!text.trim() && !tooBig && <p className="text-sm text-muted-foreground">Paste some headers, or try one of the examples, to see what each header means and what to fix.</p>}

      {text.trim() && blocks.length === 0 && !tooBig && <Notice tone="error">No headers found. Each header is a line like <code className="font-mono">Name: value</code>.</Notice>}

      {block && analysis && (
        <>
          <ToolDivider />
          {blocks.length > 1 && (
            <Segmented
              ariaLabel="Which message"
              value={String(Math.min(pick, blocks.length - 1))}
              onChange={(v) => setPick(Number(v))}
              options={blocks.map((b, i) => ({ value: String(i), label: b.start?.status ? `${b.start.kind === "response" ? "Response" : "Request"} ${i + 1} · ${b.start.status}` : `Message ${i + 1}` }))}
            />
          )}

          <ToolSection title="Summary">
            <dl className="grid grid-cols-2 gap-2.5 @xl:grid-cols-4">
              <div className="rounded-lg border bg-background px-3.5 py-3">
                <dt className="text-xs text-muted-foreground">Message</dt>
                <dd className="mt-0.5 truncate text-sm font-semibold text-foreground">
                  {block.start ? (block.start.kind === "response" ? `${block.start.status ?? ""} ${block.start.reason ?? getStatus(block.start.status ?? 0)?.name ?? ""}` : `${block.start.method} ${block.start.target}`) : isResponse ? "Response headers" : "Request headers"}
                </dd>
              </div>
              <div className="rounded-lg border bg-background px-3.5 py-3">
                <dt className="text-xs text-muted-foreground">Headers</dt>
                <dd className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">{block.headers.length}</dd>
              </div>
              <div className="rounded-lg border bg-background px-3.5 py-3">
                <dt className="text-xs text-muted-foreground">Problems / to fix</dt>
                <dd className={cn("mt-0.5 text-lg font-semibold tabular-nums", counts.bad ? "text-destructive" : counts.warn ? "text-warning" : "text-success")}>
                  {counts.bad} / {counts.warn}
                </dd>
              </div>
              {analysis.security && (
                <div className="rounded-lg border bg-background px-3.5 py-3">
                  <dt className="text-xs text-muted-foreground">Security headers</dt>
                  <dd className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
                    {analysis.security.present} of {analysis.security.total}
                  </dd>
                </div>
              )}
            </dl>
            {block.problems.map((p) => (
              <Notice key={p} tone="warning">
                {p}
              </Notice>
            ))}
          </ToolSection>

          {analysis.security && (
            <ToolSection title="Security checklist" description="The six headers most security scanners look for. Presence is not the same as a good value, so read the findings below too.">
              <ul className="grid gap-2 @md:grid-cols-2">
                {analysis.security.items.map((it) => (
                  <li key={it.label} className="flex items-center gap-2.5 rounded-lg border bg-background px-3.5 py-2.5 text-sm">
                    {it.ok ? <ShieldCheck aria-hidden="true" className="size-4 shrink-0 text-success" /> : <XCircle aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />}
                    <span className={it.ok ? "text-foreground" : "text-muted-foreground"}>{it.label}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{it.ok ? "set" : "missing"}</span>
                  </li>
                ))}
              </ul>
            </ToolSection>
          )}

          {analysis.caching && analysis.caching.summary.length > 0 && (
            <ToolSection title="What the caching headers mean">
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-foreground">
                {analysis.caching.summary.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </ToolSection>
          )}

          {analysis.findings.length > 0 && (
            <ToolSection title={`Findings (${analysis.findings.length})`}>
              <ul className="divide-y overflow-hidden rounded-lg border bg-card">
                {analysis.findings.map((f, i) => (
                  <FindingItem key={`${f.title}-${i}`} f={f} />
                ))}
              </ul>
            </ToolSection>
          )}

          <ToolSection title={`Every header (${block.headers.length})`} description="Select a header for its meaning and a breakdown of its value.">
            <ul className="divide-y overflow-hidden rounded-lg border bg-card">
              {block.headers.map((h, i) => (
                <HeaderRow key={`${h.name}-${i}`} h={h} flagged={flagByHeader.get(h.name.toLowerCase())} />
              ))}
            </ul>
          </ToolSection>
        </>
      )}
    </div>
  );
}
