"use client";

import React, { useId, useMemo, useState } from "react";
import { AlertTriangle, Info, XCircle } from "lucide-react";
import { CodeBlock } from "@/components/tool/code-block";
import { Field, Segmented, TextArea, ToolDivider, ToolSection } from "@/components/tool/kit";
import { buildUrl, parseUrl, type ParsedUrl, type UrlIssue } from "@/lib/http/url";
import { cn } from "@/lib/utils";

const SAMPLES = [
  "https://user:pass@shop.example.co.uk:8443/products/red%20shoes/?q=running+shoes&size=10&size=11&utm_source=news#reviews",
  "https://www.example.com/search?q=hello%20world&page=2",
  "http://localhost:3000/api/v1/users?token=abc123",
  "https://api.example.com/v2/items?filter[status]=open&filter[owner]=42&sort=-created",
];

const COLOR = {
  scheme: "text-brand-subtle-foreground bg-brand-subtle",
  auth: "text-warning bg-warning/10",
  host: "text-success bg-success/10",
  port: "text-foreground bg-muted",
  path: "text-foreground bg-muted/60",
  query: "text-primary bg-primary/10",
  hash: "text-muted-foreground bg-muted",
} as const;

function Anatomy({ u }: { u: ParsedUrl }) {
  const pieces: { key: keyof typeof COLOR; label: string; text: string }[] = [
    { key: "scheme", label: "scheme", text: `${u.scheme}://` },
    ...(u.username || u.password ? [{ key: "auth" as const, label: "credentials", text: `${u.username}${u.password ? `:${u.password.replace(/./g, "•")}` : ""}@` }] : []),
    { key: "host", label: "host", text: u.hostname },
    ...(u.port ? [{ key: "port" as const, label: "port", text: `:${u.port}` }] : []),
    ...(u.pathname && u.pathname !== "/" ? [{ key: "path" as const, label: "path", text: u.pathname }] : u.pathname === "/" && (u.search || u.hash) ? [{ key: "path" as const, label: "path", text: "/" }] : []),
    ...(u.search ? [{ key: "query" as const, label: "query", text: u.search }] : []),
    ...(u.hash ? [{ key: "hash" as const, label: "fragment", text: u.hash }] : []),
  ];
  return (
    <div>
      <p className="font-mono text-sm leading-loose break-all" aria-label="The URL, colour-coded by part">
        {pieces.map((p) => (
          <span key={p.label} title={p.label} className={cn("rounded px-0.5 py-0.5", COLOR[p.key])}>
            {p.text}
          </span>
        ))}
      </p>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {pieces.map((p) => (
          <li key={p.label} className="flex items-center gap-1.5">
            <span className={cn("inline-block size-2.5 rounded-sm", COLOR[p.key])} aria-hidden="true" />
            {p.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

const ISSUE_ICON = { error: XCircle, warning: AlertTriangle, info: Info } as const;
const ISSUE_TONE = { error: "text-destructive", warning: "text-warning", info: "text-muted-foreground" } as const;

function Issues({ issues }: { issues: UrlIssue[] }) {
  const order = { error: 0, warning: 1, info: 2 };
  const sorted = [...issues].sort((a, b) => order[a.level] - order[b.level]);
  return (
    <ul className="divide-y overflow-hidden rounded-lg border bg-card">
      {sorted.map((i) => {
        const Icon = ISSUE_ICON[i.level];
        return (
          <li key={i.title} className="flex items-start gap-3 px-3.5 py-3">
            <Icon aria-hidden="true" className={cn("mt-0.5 size-4 shrink-0", ISSUE_TONE[i.level])} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{i.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{i.detail}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

type Lang = "javascript" | "python" | "php" | "go";

function snippet(lang: Lang, url: string): string {
  const q = JSON.stringify(url);
  switch (lang) {
    case "javascript":
      return `const url = new URL(${q});\n\nurl.protocol;   // scheme with a colon\nurl.hostname;   // host without the port\nurl.port;       // "" when it is the default\nurl.pathname;   // path\nurl.searchParams.get("q");   // one query parameter\nurl.hash;       // fragment`;
    case "python":
      return `from urllib.parse import urlparse, parse_qs\n\nu = urlparse(${q})\nu.scheme, u.hostname, u.port, u.path\nparse_qs(u.query)   # {'q': ['…'], 'size': ['10', '11']}\nu.fragment`;
    case "php":
      return `<?php\n$parts = parse_url(${q});\n// scheme, host, port, user, pass, path, query, fragment\nparse_str($parts['query'] ?? '', $params);\nprint_r($params);`;
    case "go":
      return `u, err := url.Parse(${q})\nif err != nil { log.Fatal(err) }\n\nu.Scheme; u.Hostname(); u.Port(); u.Path\nu.Query().Get("q")   // net/url\nu.Fragment`;
  }
}

export default function UrlParser() {
  const id = useId();
  // URLs often carry tokens, so they stay in memory and are not saved.
  const [input, setInput] = useState(SAMPLES[0]);
  const [lang, setLang] = useState<Lang>("javascript");
  const [edit, setEdit] = useState<{ scheme: string; host: string; port: string; path: string; query: string; hash: string } | null>(null);

  const result = useMemo(() => parseUrl(input), [input]);
  const u = result.ok ? result.url : null;

  const rebuilt = useMemo(() => {
    if (!edit) return null;
    return buildUrl({ scheme: edit.scheme, host: edit.host, port: edit.port, path: edit.path, query: edit.query, hash: edit.hash });
  }, [edit]);

  const startEdit = () => {
    if (!u) return;
    setEdit({ scheme: u.scheme, host: u.hostname, port: u.port, path: u.pathname, query: u.search.replace(/^\?/, ""), hash: u.hash.replace(/^#/, "") });
  };

  return (
    <div className="space-y-8">
      <ToolSection title="URL" description="Paste a link, API endpoint or redirect target.">
        <Field label="URL to break down" htmlFor={`${id}-url`}>
          <TextArea id={`${id}-url`} rows={2} value={input} onChange={(e) => { setInput(e.target.value); setEdit(null); }} placeholder="https://example.com/path?name=value#section" spellCheck={false} autoCapitalize="off" className="font-mono" />
        </Field>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Try</span>
          {SAMPLES.map((s, i) => (
            <button key={s} type="button" onClick={() => { setInput(s); setEdit(null); }} className="rounded-full border bg-background px-2.5 py-0.5 text-xs text-foreground transition-colors hover:bg-muted">
              Example {i + 1}
            </button>
          ))}
        </div>
      </ToolSection>

      {!result.ok && input.trim() && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm">
          <p className="font-medium text-foreground">{result.error}</p>
          {result.suggestion && <p className="mt-0.5 text-muted-foreground">{result.suggestion}</p>}
        </div>
      )}

      {u && (
        <>
          <ToolDivider />
          <ToolSection title="Anatomy">
            <Anatomy u={u} />
          </ToolSection>

          <ToolSection title="Parts">
            <dl className="divide-y rounded-lg border text-sm">
              {(
                [
                  ["Scheme (protocol)", u.scheme, `Default port ${u.defaultPort ?? "—"}`],
                  ["Host", u.unicodeHostname ? `${u.hostname}  →  ${u.unicodeHostname}` : u.hostname, u.isIp ? "An IP address" : u.isLocal ? "A local or private address" : undefined],
                  ["Port", u.port || (u.defaultPort ? `${u.defaultPort} (default, not written)` : "—"), undefined],
                  ["Origin", u.origin, "Scheme + host + port: the unit browsers use for CORS and cookies"],
                  ["Username", u.username, undefined],
                  ["Password", u.password ? "•".repeat(Math.min(u.password.length, 12)) : "", u.password ? "Hidden here" : undefined],
                  ["Path", u.pathname, undefined],
                  ["Query string", u.search, `${u.query.length} parameter${u.query.length === 1 ? "" : "s"}`],
                  ["Fragment", u.hash, "Stays in the browser; not sent to the server"],
                  ["Normalised URL", u.href, "What the browser actually requests"],
                ] as [string, string, string | undefined][]
              )
                .filter(([, v]) => v !== "")
                .map(([label, value, note]) => (
                  <div key={label} className="grid gap-1 px-3.5 py-2.5 @md:grid-cols-[10rem_1fr] @md:gap-4">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="min-w-0">
                      <span className="font-mono text-[13px] break-all text-foreground">{value}</span>
                      {note && <span className="mt-0.5 block text-xs text-muted-foreground">{note}</span>}
                    </dd>
                  </div>
                ))}
            </dl>
            {u.labels.length > 1 && !u.isIp && (
              <p className="text-xs text-muted-foreground">
                Host labels, right to left: {u.labels.map((l, i) => (i === 0 ? `${l} (top level)` : l)).join(" → ")}. Finding the registrable domain (example.co.uk vs co.uk) needs the Public Suffix List, which this tool does not include.
              </p>
            )}
          </ToolSection>

          {u.pathSegments.length > 0 && (
            <ToolSection title={`Path segments (${u.pathSegments.length})`} description="Decoded.">
              <ol className="flex flex-wrap gap-1.5">
                {u.pathSegments.map((s, i) => (
                  <li key={`${s}-${i}`} className="rounded-md border bg-background px-2 py-1 font-mono text-[13px] text-foreground">
                    <span className="mr-1.5 text-xs text-muted-foreground">{i + 1}</span>
                    {s === "" ? "(empty)" : s}
                  </li>
                ))}
              </ol>
            </ToolSection>
          )}

          {u.query.length > 0 && (
            <ToolSection title={`Query parameters (${u.query.length})`} description="Decoded, with + read as a space. Use the Query Parameter Parser for JSON output and nested keys.">
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[26rem] text-left text-sm">
                  <thead className="bg-muted text-xs text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-3 py-2 font-medium">Name</th>
                      <th scope="col" className="px-3 py-2 font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {u.query.map((p, i) => (
                      <tr key={`${p.rawKey}-${i}`}>
                        <td className="px-3 py-2 font-mono text-[13px] break-all text-foreground">{p.key}</td>
                        <td className="px-3 py-2 font-mono text-[13px] break-all text-muted-foreground">{p.bare ? <em>(no value)</em> : p.value === "" ? <em>(empty)</em> : p.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ToolSection>
          )}

          {u.hashParams.length > 0 && (
            <ToolSection title="Fragment parameters" description="The fragment looks like key=value pairs (common in OAuth responses and single-page apps).">
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-left text-sm">
                  <tbody className="divide-y">
                    {u.hashParams.map((p, i) => (
                      <tr key={`${p.rawKey}-${i}`}>
                        <td className="px-3 py-2 font-mono text-[13px] break-all text-foreground">{p.key}</td>
                        <td className="px-3 py-2 font-mono text-[13px] break-all text-muted-foreground">{p.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ToolSection>
          )}

          {u.issues.length > 0 && (
            <ToolSection title={`Things to check (${u.issues.length})`}>
              <Issues issues={u.issues} />
            </ToolSection>
          )}

          <ToolDivider />

          <ToolSection title="Change a part and rebuild" description="Edit any piece and the URL is reassembled with correct encoding.">
            {!edit ? (
              <button type="button" onClick={startEdit} className="text-sm font-medium text-link hover:underline">
                Edit the parts of this URL
              </button>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 @md:grid-cols-[6rem_1fr_6rem]">
                  {[
                    ["Scheme", "scheme"],
                    ["Host", "host"],
                    ["Port", "port"],
                  ].map(([label, k]) => (
                    <Field key={k} label={label} htmlFor={`${id}-${k}`}>
                      <input id={`${id}-${k}`} value={edit[k as "scheme"]} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} spellCheck={false} className="h-10 w-full rounded-lg border border-input bg-background px-3 font-mono text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30" />
                    </Field>
                  ))}
                </div>
                {[
                  ["Path", "path"],
                  ["Query (without ?)", "query"],
                  ["Fragment (without #)", "hash"],
                ].map(([label, k]) => (
                  <Field key={k} label={label} htmlFor={`${id}-${k}`}>
                    <input id={`${id}-${k}`} value={edit[k as "path"]} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} spellCheck={false} className="h-10 w-full rounded-lg border border-input bg-background px-3 font-mono text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30" />
                  </Field>
                ))}
                <CodeBlock label="Rebuilt URL" code={rebuilt?.url ?? ""} wrap maxHeight="8rem" empty={rebuilt?.error ?? "Nothing to show yet."} />
              </div>
            )}
          </ToolSection>

          <ToolSection title="Parse it in code">
            <Segmented ariaLabel="Language" value={lang} onChange={setLang} options={[{ value: "javascript", label: "JavaScript" }, { value: "python", label: "Python" }, { value: "php", label: "PHP" }, { value: "go", label: "Go" }]} />
            <CodeBlock label={lang} code={snippet(lang, u.href)} maxHeight="14rem" />
          </ToolSection>
        </>
      )}
    </div>
  );
}
