"use client";

/**
 * The shared request editor behind the cURL Generator and the API Request
 * Builder: method and URL, query parameters, headers, body and
 * authentication, plus the conversion in both directions between the form's
 * state (RequestDraft) and the HttpRequest model the code generators use.
 */

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Field, Notice, SelectInput, Segmented, TextArea, TextInput, ToggleRow, UnitInput } from "@/components/tool/kit";
import { KeyValueEditor, activeRows, newRow, type KvRow } from "@/components/tool/kv-editor";
import { HEADER_INFO } from "@/lib/http/header-info";
import {
  type FormField,
  type HeaderPair,
  type HttpRequest,
  defaultOptions,
  getHeader,
  hasHeader,
  isJsonMedia,
  mediaType,
  setHeader,
  splitUrl,
} from "@/lib/http/request";
import { buildQuery, parseQuery } from "@/lib/http/url";

export type BodyKind = "none" | "json" | "text" | "form" | "multipart" | "file";
export type AuthKind = "none" | "basic" | "bearer" | "apikey";

export interface FormRow extends KvRow {
  isFile?: boolean;
  /** A picked file (API Request Builder only; never stored). */
  file?: File | null;
}

export interface RequestDraft {
  method: string;
  url: string;
  params: KvRow[];
  headers: KvRow[];
  bodyKind: BodyKind;
  bodyText: string;
  formRows: FormRow[];
  filePath: string;
  /** The picked file for a raw-file body (API Request Builder only; never stored). */
  bodyFile: File | null;
  auth: { kind: AuthKind; user: string; password: string; token: string; headerName: string };
  followRedirects: boolean;
  insecure: boolean;
  compressed: boolean;
  timeout: string;
  failOnError: boolean;
}

export const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
const BODY_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const emptyDraft = (): RequestDraft => ({
  method: "GET",
  url: "",
  params: [],
  headers: [],
  bodyKind: "none",
  bodyText: "",
  formRows: [],
  filePath: "",
  bodyFile: null,
  auth: { kind: "none", user: "", password: "", token: "", headerName: "X-API-Key" },
  followRedirects: false,
  insecure: false,
  compressed: false,
  timeout: "",
  failOnError: false,
});

export const exampleDraft = (): RequestDraft => ({
  ...emptyDraft(),
  method: "POST",
  url: "https://api.example.com/v1/users",
  headers: [newRow("Accept", "application/json")],
  bodyKind: "json",
  bodyText: '{\n  "name": "Ada Lovelace",\n  "email": "ada@example.com"\n}',
  auth: { kind: "bearer", user: "", password: "", token: "YOUR_TOKEN", headerName: "X-API-Key" },
});

/* ------------------------------------------------------------ conversions */

export function draftToRequest(d: RequestDraft): HttpRequest {
  let url = d.url.trim();
  const params = activeRows(d.params).map((r) => ({ key: r.key, value: r.value }));
  if (params.length) {
    const { base, query, hash } = splitUrl(url);
    const extra = buildQuery(params, { space: "percent" });
    url = `${base}?${[query, extra].filter(Boolean).join("&")}${hash}`;
  }
  let headers: HeaderPair[] = activeRows(d.headers).map((r) => ({ name: r.key.trim(), value: r.value })).filter((h) => h.name);
  let basicAuth: HttpRequest["basicAuth"];
  if (d.auth.kind === "basic" && (d.auth.user || d.auth.password)) basicAuth = { user: d.auth.user, password: d.auth.password };
  if (d.auth.kind === "bearer" && d.auth.token) headers = setHeader(headers, "Authorization", `Bearer ${d.auth.token}`);
  if (d.auth.kind === "apikey" && d.auth.headerName.trim() && d.auth.token) headers = setHeader(headers, d.auth.headerName.trim(), d.auth.token);

  let body: HttpRequest["body"] = { kind: "none" };
  const ct = (value: string) => {
    if (!hasHeader(headers, "content-type")) headers = [...headers, { name: "Content-Type", value }];
  };
  const fields = (): FormField[] =>
    d.formRows
      .filter((r) => r.enabled && r.key.trim() !== "")
      .map((r) => ({ name: r.key, value: r.isFile ? (r.file?.name ?? r.value) : r.value, file: r.isFile || undefined }));
  switch (d.bodyKind) {
    case "json":
      if (d.bodyText.trim() !== "") {
        body = { kind: "raw", text: d.bodyText };
        ct("application/json");
      }
      break;
    case "text":
      if (d.bodyText !== "") {
        body = { kind: "raw", text: d.bodyText };
        ct("text/plain");
      }
      break;
    case "form":
      if (fields().length) body = { kind: "urlencoded", fields: fields().map((f) => ({ name: f.name, value: f.value })) };
      break;
    case "multipart":
      if (fields().length) body = { kind: "multipart", fields: fields() };
      break;
    case "file":
      if (d.filePath.trim()) body = { kind: "file", path: d.filePath.trim() };
      break;
  }
  const timeout = Number(d.timeout);
  return {
    method: d.method,
    url,
    headers,
    body,
    basicAuth,
    options: { ...defaultOptions(), followRedirects: d.followRedirects, insecure: d.insecure, compressed: d.compressed, failOnError: d.failOnError, timeout: Number.isFinite(timeout) && timeout > 0 ? timeout : undefined },
  };
}

export function requestToDraft(r: HttpRequest): RequestDraft {
  const { base, query, hash } = splitUrl(r.url);
  const params = parseQuery(query).map((p) => newRow(p.key, p.value));
  let headers = r.headers.map((h) => newRow(h.name, h.value));
  const d = emptyDraft();
  d.method = r.method;
  d.url = `${base}${hash}`;
  d.params = params;
  d.followRedirects = r.options.followRedirects;
  d.insecure = r.options.insecure;
  d.compressed = r.options.compressed;
  d.failOnError = r.options.failOnError;
  d.timeout = r.options.timeout ? String(r.options.timeout) : "";
  if (r.basicAuth) d.auth = { ...d.auth, kind: "basic", user: r.basicAuth.user, password: r.basicAuth.password };
  const auth = getHeader(r.headers, "authorization");
  const bearer = auth && /^bearer\s+(.+)$/i.exec(auth);
  if (bearer) {
    d.auth = { ...d.auth, kind: "bearer", token: bearer[1] };
    headers = headers.filter((h) => h.key.toLowerCase() !== "authorization");
  }
  const b = r.body;
  const type = mediaType(getHeader(r.headers, "content-type"));
  if (b.kind === "raw") {
    d.bodyKind = isJsonMedia(type) ? "json" : "text";
    d.bodyText = b.text;
    if (isJsonMedia(type) && type === "application/json") headers = headers.filter((h) => h.key.toLowerCase() !== "content-type");
  } else if (b.kind === "urlencoded") {
    d.bodyKind = "form";
    d.formRows = b.fields.map((f) => ({ ...newRow(f.name, f.value) }));
    headers = headers.filter((h) => h.key.toLowerCase() !== "content-type" || mediaType(h.value) !== "application/x-www-form-urlencoded");
  } else if (b.kind === "multipart") {
    d.bodyKind = "multipart";
    d.formRows = b.fields.map((f) => ({ ...newRow(f.name, f.value), isFile: f.file }));
  } else if (b.kind === "file") {
    d.bodyKind = "file";
    d.filePath = b.path;
  }
  d.headers = headers;
  return d;
}

/* --------------------------------------------------------------------- UI */

const HEADER_NAMES = HEADER_INFO.filter((h) => h.kind !== "response").map((h) => h.name);

const TABS = ["params", "headers", "body", "auth", "options"] as const;
type Tab = (typeof TABS)[number];

export function RequestForm({ draft, onChange, localFiles = false, urlPlaceholder = "https://api.example.com/v1/users" }: { draft: RequestDraft; onChange: (d: RequestDraft) => void; localFiles?: boolean; urlPlaceholder?: string }) {
  const id = React.useId();
  const [tab, setTab] = React.useState<Tab>("body");
  const set = (patch: Partial<RequestDraft>) => onChange({ ...draft, ...patch });
  const counts: Record<Tab, number> = {
    params: activeRows(draft.params).length,
    headers: activeRows(draft.headers).length,
    body: draft.bodyKind === "none" ? 0 : 1,
    auth: draft.auth.kind === "none" ? 0 : 1,
    options: [draft.followRedirects, draft.insecure, draft.compressed, !!draft.timeout, draft.failOnError].filter(Boolean).length,
  };
  const label = (t: Tab, text: string) => (
    <span className="flex items-center gap-1.5">
      {text}
      {counts[t] > 0 && <span className="rounded-full bg-primary/15 px-1.5 text-[11px] leading-4 font-semibold text-brand-subtle-foreground">{counts[t]}</span>}
    </span>
  );

  const bodyForbidden = !BODY_METHODS.has(draft.method) && draft.bodyKind !== "none";

  const setForm = (formRows: FormRow[]) => set({ formRows });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[7.5rem_1fr] gap-2">
        <label className="sr-only" htmlFor={`${id}-method`}>
          Method
        </label>
        <SelectInput id={`${id}-method`} value={draft.method} onChange={(e) => set({ method: e.target.value })} className="font-mono font-semibold">
          {METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </SelectInput>
        <label className="sr-only" htmlFor={`${id}-url`}>
          URL
        </label>
        <TextInput id={`${id}-url`} value={draft.url} onChange={(e) => set({ url: e.target.value })} placeholder={urlPlaceholder} spellCheck={false} autoCapitalize="off" autoComplete="off" inputMode="url" className="font-mono" />
      </div>

      <Segmented ariaLabel="Request section" value={tab} onChange={setTab} options={TABS.map((t) => ({ value: t, label: label(t, t === "params" ? "Params" : t === "headers" ? "Headers" : t === "body" ? "Body" : t === "auth" ? "Auth" : "Options") }))} />

      {tab === "params" && (
        <div className="space-y-2">
          <KeyValueEditor rows={draft.params} onChange={(params) => set({ params })} label="Parameter" keyPlaceholder="name" valuePlaceholder="value" />
          <p className="text-xs text-muted-foreground">Added to the URL as a query string, encoded for you.</p>
        </div>
      )}

      {tab === "headers" && (
        <div className="space-y-2">
          <KeyValueEditor rows={draft.headers} onChange={(headers) => set({ headers })} label="Header" keyPlaceholder="Header-Name" valuePlaceholder="value" suggestions={HEADER_NAMES} />
        </div>
      )}

      {tab === "body" && (
        <div className="space-y-4">
          <Segmented
            ariaLabel="Body type"
            value={draft.bodyKind}
            onChange={(bodyKind) => set({ bodyKind })}
            options={[
              { value: "none", label: "None" },
              { value: "json", label: "JSON" },
              { value: "text", label: "Text" },
              { value: "form", label: "Form" },
              { value: "multipart", label: "Multipart" },
              { value: "file", label: "File" },
            ]}
          />
          {bodyForbidden && <Notice tone="warning">{draft.method} requests normally have no body. Some servers ignore it and browsers&apos; fetch refuses to send one.</Notice>}
          {(draft.bodyKind === "json" || draft.bodyKind === "text") && (
            <Field label={draft.bodyKind === "json" ? "JSON body" : "Text body"} htmlFor={`${id}-body`} hint={draft.bodyKind === "json" ? "Content-Type: application/json is added unless you set your own." : "Content-Type: text/plain is added unless you set your own."}>
              <TextArea id={`${id}-body`} rows={8} value={draft.bodyText} onChange={(e) => set({ bodyText: e.target.value })} spellCheck={false} className="font-mono" placeholder={draft.bodyKind === "json" ? '{ "name": "Ada" }' : "Raw text to send"} />
            </Field>
          )}
          {draft.bodyKind === "json" &&
            draft.bodyText.trim() !== "" &&
            (() => {
              try {
                JSON.parse(draft.bodyText);
                return null;
              } catch (e) {
                return <Notice tone="error">Not valid JSON: {(e as Error).message}</Notice>;
              }
            })()}
          {(draft.bodyKind === "form" || draft.bodyKind === "multipart") && (
            <div className="space-y-2">
              {draft.formRows.map((r) => (
                <div key={r.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-2 @md:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.4fr)_auto]">
                  <Switch checked={r.enabled} onCheckedChange={(v) => setForm(draft.formRows.map((x) => (x.id === r.id ? { ...x, enabled: v } : x)))} aria-label="Use this field" />
                  <TextInput aria-label="Field name" value={r.key} onChange={(e) => setForm(draft.formRows.map((x) => (x.id === r.id ? { ...x, key: e.target.value } : x)))} placeholder="name" spellCheck={false} className="font-mono" />
                  <Button type="button" variant="ghost" size="icon" aria-label="Remove field" onClick={() => setForm(draft.formRows.filter((x) => x.id !== r.id))} className="@md:order-last">
                    <Trash2 aria-hidden="true" />
                  </Button>
                  <div className="col-span-3 flex gap-2 @md:col-span-1">
                    {draft.bodyKind === "multipart" && (
                      <SelectInput aria-label="Field type" value={r.isFile ? "file" : "text"} onChange={(e) => setForm(draft.formRows.map((x) => (x.id === r.id ? { ...x, isFile: e.target.value === "file", file: null } : x)))} className="w-24 shrink-0">
                        <option value="text">Text</option>
                        <option value="file">File</option>
                      </SelectInput>
                    )}
                    {r.isFile && localFiles ? (
                      <input
                        type="file"
                        aria-label="File to upload"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          setForm(draft.formRows.map((x) => (x.id === r.id ? { ...x, file, value: file?.name ?? "" } : x)));
                        }}
                        className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-2 py-1.5 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-2.5 file:py-1 file:text-sm"
                      />
                    ) : (
                      <TextInput aria-label={r.isFile ? "File path" : "Field value"} value={r.value} onChange={(e) => setForm(draft.formRows.map((x) => (x.id === r.id ? { ...x, value: e.target.value } : x)))} placeholder={r.isFile ? "/path/to/file.png" : "value"} spellCheck={false} className="font-mono" />
                    )}
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setForm([...draft.formRows, { ...newRow() }])}>
                <Plus aria-hidden="true" /> Add field
              </Button>
              <p className="text-xs text-muted-foreground">{draft.bodyKind === "form" ? "Sent as application/x-www-form-urlencoded, the format of a plain HTML form." : "Sent as multipart/form-data, the format used for file uploads. The boundary is added for you."}</p>
            </div>
          )}
          {draft.bodyKind === "file" && (
            <Field label="File to send as the body" htmlFor={`${id}-file`} hint={localFiles ? "The raw contents of the file are sent as the request body." : "The raw contents of the file are sent (curl --data-binary @file)."}>
              {localFiles ? (
                <input
                  id={`${id}-file`}
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    set({ bodyFile: file, filePath: file?.name ?? "" });
                  }}
                  className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-2 py-1.5 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-2.5 file:py-1 file:text-sm"
                />
              ) : (
                <TextInput id={`${id}-file`} value={draft.filePath} onChange={(e) => set({ filePath: e.target.value })} placeholder="/path/to/data.bin" spellCheck={false} className="font-mono" />
              )}
            </Field>
          )}
        </div>
      )}

      {tab === "auth" && (
        <div className="space-y-4">
          <Segmented
            ariaLabel="Authentication"
            value={draft.auth.kind}
            onChange={(kind) => set({ auth: { ...draft.auth, kind } })}
            options={[
              { value: "none", label: "None" },
              { value: "bearer", label: "Bearer token" },
              { value: "basic", label: "Basic" },
              { value: "apikey", label: "API key" },
            ]}
          />
          {draft.auth.kind === "bearer" && (
            <Field label="Token" htmlFor={`${id}-token`} hint="Sent as Authorization: Bearer <token>. Use a placeholder here, not a real secret, if you are sharing the output.">
              <TextInput id={`${id}-token`} value={draft.auth.token} onChange={(e) => set({ auth: { ...draft.auth, token: e.target.value } })} spellCheck={false} autoComplete="off" className="font-mono" />
            </Field>
          )}
          {draft.auth.kind === "basic" && (
            <div className="grid gap-3 @md:grid-cols-2">
              <Field label="Username" htmlFor={`${id}-user`}>
                <TextInput id={`${id}-user`} value={draft.auth.user} onChange={(e) => set({ auth: { ...draft.auth, user: e.target.value } })} spellCheck={false} autoComplete="off" />
              </Field>
              <Field label="Password" htmlFor={`${id}-pass`}>
                <TextInput id={`${id}-pass`} type="password" value={draft.auth.password} onChange={(e) => set({ auth: { ...draft.auth, password: e.target.value } })} autoComplete="off" />
              </Field>
            </div>
          )}
          {draft.auth.kind === "apikey" && (
            <div className="grid gap-3 @md:grid-cols-2">
              <Field label="Header name" htmlFor={`${id}-hn`}>
                <TextInput id={`${id}-hn`} value={draft.auth.headerName} onChange={(e) => set({ auth: { ...draft.auth, headerName: e.target.value } })} spellCheck={false} className="font-mono" />
              </Field>
              <Field label="Key" htmlFor={`${id}-key`}>
                <TextInput id={`${id}-key`} value={draft.auth.token} onChange={(e) => set({ auth: { ...draft.auth, token: e.target.value } })} spellCheck={false} autoComplete="off" className="font-mono" />
              </Field>
            </div>
          )}
          {draft.auth.kind === "none" && <p className="text-sm text-muted-foreground">No credentials are added. You can still set an Authorization header by hand under Headers.</p>}
        </div>
      )}

      {tab === "options" && (
        <div className="grid gap-x-8 gap-y-4 @md:grid-cols-2">
          <ToggleRow id={`${id}-redir`} label="Follow redirects" description="curl -L. Off by default, like curl." checked={draft.followRedirects} onCheckedChange={(followRedirects) => set({ followRedirects })} />
          <ToggleRow id={`${id}-comp`} label="Ask for compressed responses" description="curl --compressed: Accept-Encoding and decoding." checked={draft.compressed} onCheckedChange={(compressed) => set({ compressed })} />
          <ToggleRow id={`${id}-fail`} label="Fail on HTTP errors" description="curl -f: treat 4xx and 5xx as failures." checked={draft.failOnError} onCheckedChange={(failOnError) => set({ failOnError })} />
          <ToggleRow id={`${id}-insec`} label="Skip certificate checks" description="curl -k. For local testing only; it disables the protection HTTPS gives." checked={draft.insecure} onCheckedChange={(insecure) => set({ insecure })} />
          <Field label="Timeout" htmlFor={`${id}-timeout`} hint="Give up after this many seconds (curl --max-time).">
            <UnitInput id={`${id}-timeout`} type="number" min={0} unit="seconds" value={draft.timeout} onChange={(e) => set({ timeout: e.target.value })} placeholder="none" />
          </Field>
        </div>
      )}
    </div>
  );
}
