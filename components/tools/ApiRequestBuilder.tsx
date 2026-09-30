"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Loader2, Send, Square } from "lucide-react";
import { toast } from "sonner";
import { CodeBlock } from "@/components/tool/code-block";
import { Field, Notice, Segmented, TextArea, ToolDivider, ToolSection } from "@/components/tool/kit";
import { RequestForm, draftToRequest, exampleDraft, requestToDraft, type RequestDraft } from "@/components/tool/request-form";
import { Button } from "@/components/ui/button";
import { buildCurl, parseCurl } from "@/lib/http/curl";
import { TARGET_LABELS, generateCode, type CodeTarget } from "@/lib/http/codegen";
import { formatBytes } from "@/lib/http/mime";
import { type HttpRequest, effectiveHeaders, isForbiddenBrowserHeader } from "@/lib/http/request";
import { getStatus } from "@/lib/http/status";
import { cn } from "@/lib/utils";

const MAX_SHOWN = 1_000_000;
const TIMEOUT_MS = 30_000;

interface Sent {
  status: number;
  statusText: string;
  ms: number;
  bytes: number;
  headers: [string, string][];
  contentType: string;
  body: string;
  truncated: boolean;
  imageUrl?: string;
  redirected: boolean;
  finalUrl: string;
}

interface Failure {
  message: string;
  /** What the no-cors probe (GET/HEAD only) found out. */
  probe?: "reachable" | "unreachable";
}

const CODE_TARGETS: CodeTarget[] = ["fetch", "axios", "python-requests", "node-https", "xhr", "jquery", "python-httpx", "python-urllib"];

/** Turns the shared request model into what fetch() accepts, keeping only what a browser may send. */
function toFetchInit(r: HttpRequest): { url: string; init: RequestInit; dropped: string[] } {
  const dropped: string[] = [];
  const headers = new Headers();
  for (const h of effectiveHeaders(r, { contentType: false })) {
    if (isForbiddenBrowserHeader(h.name)) {
      dropped.push(h.name);
      continue;
    }
    try {
      headers.append(h.name, h.value);
    } catch {
      dropped.push(h.name);
    }
  }
  let body: BodyInit | undefined;
  const b = r.body;
  if (b.kind === "raw") body = b.text;
  else if (b.kind === "urlencoded") {
    const sp = new URLSearchParams();
    b.fields.forEach((f) => sp.append(f.name, f.value));
    body = sp;
  }
  const init: RequestInit = { method: r.method, headers, cache: "no-store", credentials: "omit", redirect: "follow" };
  if (body !== undefined && r.method !== "GET" && r.method !== "HEAD") init.body = body;
  return { url: r.url, init, dropped };
}

function prettyBody(text: string, type: string): string {
  if (/json/i.test(type) || /^\s*[[{]/.test(text)) {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      /* show as received */
    }
  }
  return text;
}

export default function ApiRequestBuilder() {
  const id = useId();
  // Requests may carry tokens: the form is never saved.
  const [draft, setDraft] = useState<RequestDraft>(() => ({ ...exampleDraft(), method: "GET", url: "https://httpbin.org/get", headers: [], bodyKind: "none", bodyText: "", auth: { ...exampleDraft().auth, kind: "none", token: "" } }));
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Sent | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [dropped, setDropped] = useState<string[]>([]);
  const [view, setView] = useState<"body" | "headers" | "raw">("body");
  const [code, setCode] = useState<CodeTarget | "curl">("curl");
  const [importing, setImporting] = useState(false);
  const [paste, setPaste] = useState("");
  const [pasteError, setPasteError] = useState("");
  const abort = useRef<AbortController | null>(null);
  const cancelled = useRef(false);
  const imageUrl = useRef<string | null>(null);

  useEffect(
    () => () => {
      abort.current?.abort();
      if (imageUrl.current) URL.revokeObjectURL(imageUrl.current);
    },
    []
  );

  const request = useMemo(() => draftToRequest(draft), [draft]);
  const urlError = useMemo(() => {
    const u = request.url.trim();
    if (!u) return "Enter a URL.";
    try {
      const parsed = new URL(u);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "Only http:// and https:// URLs can be requested from a browser.";
    } catch {
      return "That is not a valid URL. It needs a scheme, such as https://.";
    }
    return null;
  }, [request.url]);

  const mixed = useMemo(() => {
    if (typeof window === "undefined" || urlError) return false;
    try {
      const u = new URL(request.url);
      return window.location.protocol === "https:" && u.protocol === "http:" && !["localhost", "127.0.0.1", "[::1]"].includes(u.hostname);
    } catch {
      return false;
    }
  }, [request.url, urlError]);

  const preflight = useMemo(() => {
    const simpleMethod = ["GET", "HEAD", "POST"].includes(request.method);
    const custom = request.headers.filter((h) => !["accept", "accept-language", "content-language", "content-type", "range"].includes(h.name.toLowerCase()));
    const ct = request.headers.find((h) => h.name.toLowerCase() === "content-type")?.value.split(";")[0].trim().toLowerCase();
    const simpleType = !ct || ["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"].includes(ct);
    return !(simpleMethod && custom.length === 0 && !request.basicAuth && simpleType);
  }, [request]);

  const send = async () => {
    if (urlError || running) return;
    setRunning(true);
    setResult(null);
    setFailure(null);
    if (imageUrl.current) {
      URL.revokeObjectURL(imageUrl.current);
      imageUrl.current = null;
    }
    const controller = new AbortController();
    abort.current = controller;
    cancelled.current = false;
    const limitMs = request.options.timeout ? request.options.timeout * 1000 : TIMEOUT_MS;
    const timer = window.setTimeout(() => controller.abort(), limitMs);
    const { url, init, dropped: d } = toFetchInit(request);
    let formBody: FormData | null = null;
    if (request.body.kind === "multipart") {
      formBody = new FormData();
      draft.formRows
        .filter((r) => r.enabled && r.key.trim())
        .forEach((r) => {
          if (r.isFile) {
            if (r.file) formBody!.append(r.key, r.file, r.file.name);
          } else formBody!.append(r.key, r.value);
        });
      init.body = formBody;
    } else if (request.body.kind === "file" && draft.bodyFile) init.body = draft.bodyFile;
    setDropped(d);
    const t0 = performance.now();
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      const buf = await res.arrayBuffer();
      const ms = performance.now() - t0;
      const contentType = res.headers.get("content-type") ?? "";
      const isImage = /^image\/(png|jpe?g|gif|webp|avif|svg\+xml|bmp|x-icon)/i.test(contentType);
      let body = "";
      let truncated = false;
      let image: string | undefined;
      if (isImage) {
        image = URL.createObjectURL(new Blob([buf], { type: contentType }));
        imageUrl.current = image;
      } else {
        const slice = buf.byteLength > MAX_SHOWN ? buf.slice(0, MAX_SHOWN) : buf;
        truncated = buf.byteLength > MAX_SHOWN;
        body = new TextDecoder("utf-8", { fatal: false }).decode(slice);
      }
      const headers: [string, string][] = [];
      res.headers.forEach((v, k) => headers.push([k, v]));
      setResult({ status: res.status, statusText: res.statusText, ms, bytes: buf.byteLength, headers, contentType, body, truncated, imageUrl: image, redirected: res.redirected, finalUrl: res.url });
      setView("body");
    } catch (e) {
      if (controller.signal.aborted) {
        setFailure({ message: cancelled.current ? "Cancelled." : `Stopped: no complete response within ${Math.round(limitMs / 1000)} seconds.` });
      } else {
        // A GET or HEAD can be repeated safely without reading it: if that succeeds, the server answered and the browser is only refusing to show the response (CORS).
        let probe: Failure["probe"];
        if (request.method === "GET" || request.method === "HEAD") {
          try {
            await fetch(url, { method: request.method, mode: "no-cors", cache: "no-store", credentials: "omit", signal: typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(8000) : undefined });
            probe = "reachable";
          } catch {
            probe = "unreachable";
          }
        }
        setFailure({ message: (e as Error).message || "The request failed.", probe });
      }
    } finally {
      window.clearTimeout(timer);
      abort.current = null;
      setRunning(false);
    }
  };

  const loadFromCurl = () => {
    try {
      setDraft(requestToDraft(parseCurl(paste).request));
      setImporting(false);
      setPaste("");
      setPasteError("");
      toast.success("Loaded into the form");
    } catch (e) {
      setPasteError((e as Error).message);
    }
  };

  const examples: { label: string; draft: () => RequestDraft }[] = [
    { label: "GET a JSON API", draft: () => ({ ...exampleDraft(), method: "GET", url: "https://jsonplaceholder.typicode.com/posts/1", headers: [], bodyKind: "none", bodyText: "", auth: { ...exampleDraft().auth, kind: "none", token: "" } }) },
    { label: "POST JSON", draft: () => ({ ...exampleDraft(), method: "POST", url: "https://httpbin.org/post", headers: [], bodyKind: "json", bodyText: '{\n  "name": "Ada Lovelace",\n  "role": "analyst"\n}', auth: { ...exampleDraft().auth, kind: "none", token: "" } }) },
    { label: "GitHub zen", draft: () => ({ ...exampleDraft(), method: "GET", url: "https://api.github.com/zen", headers: [], bodyKind: "none", bodyText: "", auth: { ...exampleDraft().auth, kind: "none", token: "" } }) },
  ];

  const generated = useMemo(() => {
    if (!request.url) return "";
    if (code === "curl") return buildCurl(request, { multiline: true });
    return generateCode(code, request, { errorHandling: true }).code;
  }, [request, code]);

  const okStatus = result && result.status >= 200 && result.status < 300;
  const statusInfo = result ? getStatus(result.status) : undefined;

  return (
    <div className="space-y-8">
      <ToolSection
        title="Request"
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => setImporting((v) => !v)}>
            {importing ? "Cancel" : "Import a curl command"}
          </Button>
        }
      >
        {importing && (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-3.5">
            <Field label="Paste a curl command" htmlFor={`${id}-paste`}>
              <TextArea id={`${id}-paste`} rows={4} value={paste} onChange={(e) => setPaste(e.target.value)} spellCheck={false} className="font-mono" placeholder={"curl https://api.example.com/items -H 'Accept: application/json'"} />
            </Field>
            {pasteError && <Notice tone="error">{pasteError}</Notice>}
            <Button type="button" size="sm" onClick={loadFromCurl} disabled={!paste.trim()}>
              Load into the form
            </Button>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Try a public test API</span>
          {examples.map((e) => (
            <Button key={e.label} type="button" variant="outline" size="xs" onClick={() => setDraft(e.draft())}>
              {e.label}
            </Button>
          ))}
        </div>
        <RequestForm draft={draft} onChange={setDraft} localFiles />
        <div className="flex flex-wrap items-center justify-end gap-2">
          {urlError && draft.url.trim() && <span className="mr-auto text-sm text-destructive">{urlError}</span>}
          {running ? (
            <Button type="button" variant="outline" onClick={() => { cancelled.current = true; abort.current?.abort(); }}>
              <Square aria-hidden="true" /> Cancel
            </Button>
          ) : null}
          <Button type="button" onClick={send} disabled={running || !!urlError}>
            {running ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Send aria-hidden="true" />} {running ? "Sending…" : "Send request"}
          </Button>
        </div>
        {mixed && <Notice tone="warning">This page is on HTTPS, and browsers block requests from it to plain http:// addresses (mixed content). Use https://, or run the request with curl from a terminal.</Notice>}
        {preflight && !urlError && (
          <Notice tone="info">
            This request needs a CORS preflight: the browser first asks the server, with an OPTIONS request, whether this site may send it. If the API does not allow it, the request fails before it is sent.
          </Notice>
        )}
        <p className="text-xs text-muted-foreground">Requests go directly from your browser to the address you enter. TabBench does not see them, route them through a server, or store them. Anything you type is sent to that server, so use test credentials when you can.</p>
      </ToolSection>

      {(result || failure) && <ToolDivider />}

      {failure && (
        <ToolSection title="The request failed">
          <Notice tone="error">{failure.message}</Notice>
          {failure.probe === "reachable" && (
            <Notice tone="info">
              <strong className="font-semibold">The server answered, but the browser won&apos;t show the response.</strong> A test request without reading the reply succeeded, which almost always means the server does not send <code className="font-mono">Access-Control-Allow-Origin</code> for this site (CORS). Fix it on the server, or call the API from your own backend or a terminal. The curl tab below gives the exact command.
            </Notice>
          )}
          {failure.probe === "unreachable" && (
            <Notice tone="info">
              <strong className="font-semibold">The server could not be reached at all.</strong> Check the address, your connection, the server&apos;s HTTPS certificate, and whether an ad blocker or firewall is stopping the request. localhost addresses only work if the server is running on this computer.
            </Notice>
          )}
          {!failure.probe && !/Stopped|Cancelled/.test(failure.message) && (
            <Notice tone="info">
              For methods other than GET and HEAD the tool does not retry, because repeating them could change data. Common causes: the server does not allow this site through CORS, it rejected the preflight (OPTIONS) request, or it is unreachable. A terminal is not limited by CORS, so try the curl command below.
            </Notice>
          )}
        </ToolSection>
      )}

      {result && (
        <ToolSection title="Response">
          <dl className="grid grid-cols-2 gap-2.5 @xl:grid-cols-4">
            <div className="rounded-lg border bg-background px-3.5 py-3">
              <dt className="text-xs text-muted-foreground">Status</dt>
              <dd className={cn("mt-0.5 text-lg font-semibold tabular-nums", okStatus ? "text-success" : result.status >= 400 ? "text-destructive" : "text-foreground")}>
                {result.status} <span className="text-sm font-medium">{result.statusText || statusInfo?.name}</span>
              </dd>
            </div>
            <div className="rounded-lg border bg-background px-3.5 py-3">
              <dt className="text-xs text-muted-foreground">Time</dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">{result.ms < 1000 ? `${Math.round(result.ms)} ms` : `${(result.ms / 1000).toFixed(2)} s`}</dd>
            </div>
            <div className="rounded-lg border bg-background px-3.5 py-3">
              <dt className="text-xs text-muted-foreground">Size</dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">{formatBytes(result.bytes)}</dd>
            </div>
            <div className="min-w-0 rounded-lg border bg-background px-3.5 py-3">
              <dt className="text-xs text-muted-foreground">Content-Type</dt>
              <dd className="mt-0.5 truncate font-mono text-sm text-foreground" title={result.contentType}>{result.contentType || "—"}</dd>
            </div>
          </dl>
          {result.redirected && <Notice tone="info">The browser followed a redirect. The final URL was {result.finalUrl}.</Notice>}
          {dropped.length > 0 && <Notice tone="warning">The browser does not let scripts set {[...new Set(dropped)].join(", ")}, so {dropped.length === 1 ? "it was" : "they were"} left out of this request. curl would send {dropped.length === 1 ? "it" : "them"}.</Notice>}
          <Segmented size="sm" ariaLabel="Response view" value={view} onChange={setView} options={[{ value: "body", label: "Body" }, { value: "headers", label: `Headers (${result.headers.length})` }, { value: "raw", label: "Raw" }]} />
          {view === "body" &&
            (result.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={result.imageUrl} alt="The image returned by the server" className="max-h-96 max-w-full rounded-lg border bg-muted/30 object-contain" />
            ) : (
              <CodeBlock label={result.truncated ? `Showing the first ${formatBytes(MAX_SHOWN)}` : "Body"} code={prettyBody(result.body, result.contentType)} maxHeight="28rem" wrap empty="The response has no body." />
            ))}
          {view === "headers" && (
            <>
              {result.headers.length ? (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full min-w-[26rem] text-left text-sm">
                    <tbody className="divide-y">
                      {result.headers.map(([k, v]) => (
                        <tr key={k} className="align-top">
                          <th scope="row" className="px-3 py-2 font-mono text-[13px] font-medium break-all text-foreground">{k}</th>
                          <td className="px-3 py-2 font-mono text-[13px] break-all text-muted-foreground">{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No headers are visible.</p>
              )}
              <p className="text-xs text-muted-foreground">Browsers show only the headers a cross-origin server lists in Access-Control-Expose-Headers, plus a short safe list. Others exist but cannot be read by a web page; curl -i shows them all.</p>
            </>
          )}
          {view === "raw" && <CodeBlock label="Status line and headers, then the body" code={`HTTP ${result.status} ${result.statusText}\n${result.headers.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${result.imageUrl ? "(image)" : result.body}`} maxHeight="28rem" wrap />}
        </ToolSection>
      )}

      <ToolDivider />

      <ToolSection title="Use this request elsewhere" description="The same request as a command or in code. Nothing here is limited by the browser's rules.">
        <Segmented size="sm" ariaLabel="Format" value={code} onChange={(v) => setCode(v as CodeTarget | "curl")} options={[{ value: "curl", label: "curl" }, ...CODE_TARGETS.slice(0, 4).map((t) => ({ value: t, label: TARGET_LABELS[t] }))]} />
        <CodeBlock label={code === "curl" ? "curl" : TARGET_LABELS[code]} code={generated} maxHeight="24rem" empty="Enter a URL to generate code." />
      </ToolSection>
    </div>
  );
}
