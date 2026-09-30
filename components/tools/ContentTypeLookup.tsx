"use client";

import React, { useId, useMemo, useState } from "react";
import DropZone from "@/components/ui/DropZone";
import { Field, Notice, Segmented, TextInput, ToolSection } from "@/components/tool/kit";
import CopyButton from "@/components/ui/CopyButton";
import { CONTENT_TYPE_RECIPES, formatBytes, isCompressible, lookupExtension, parseContentType, sniffBytes, type SniffResult } from "@/lib/http/mime";

type Tab = "send" | "check" | "file";
const GROUPS = ["API", "Web page", "Files", "Streaming & data"] as const;

function CheckTab() {
  const id = useId();
  const [value, setValue] = useState("application/json; charset=utf-8");
  const parsed = useMemo(() => (value.trim() ? parseContentType(value) : null), [value]);
  return (
    <div className="space-y-5">
      <Field label="Content-Type value" htmlFor={`${id}-ct`} hint="With or without the “Content-Type:” prefix.">
        <TextInput id={`${id}-ct`} value={value} onChange={(e) => setValue(e.target.value.replace(/^\s*content-type\s*:\s*/i, ""))} placeholder="text/html; charset=utf-8" spellCheck={false} autoCapitalize="off" className="font-mono" />
      </Field>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Try</span>
        {["application/json", "text/html; charset=UTF-8", "multipart/form-data", "application/javascript", "text/json", "image/svg+xml"].map((s) => (
          <button key={s} type="button" onClick={() => setValue(s)} className="rounded-full border bg-background px-2.5 py-0.5 font-mono text-xs text-foreground transition-colors hover:bg-muted">
            {s}
          </button>
        ))}
      </div>
      {parsed && (
        <>
          <dl className="divide-y rounded-lg border text-sm">
            {[
              ["Type", parsed.type || "—"],
              ["Subtype", parsed.subtype || "—"],
              ["Structured syntax suffix", parsed.suffix ? `+${parsed.suffix} (the content is ${parsed.suffix.toUpperCase()}-encoded)` : "none"],
              ["Registry tree", parsed.tree === "standard" ? "Standard" : parsed.tree === "vendor" ? "Vendor (vnd.)" : parsed.tree === "personal" ? "Personal (prs.)" : "Unregistered (x-)"],
              ...parsed.params.map((p) => [`Parameter: ${p.name}`, p.value || "(empty)"]),
              ["Compresses well?", parsed.ok ? (isCompressible(`${parsed.type}/${parsed.subtype}`) ? "Yes: enable gzip or brotli" : "Usually already compressed: skip it") : "—"],
            ].map(([k, v]) => (
              <div key={k} className="grid gap-1 px-3.5 py-2.5 @md:grid-cols-[14rem_1fr] @md:gap-4">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-mono text-[13px] break-all text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
          {parsed.issues.map((i) => (
            <Notice key={i.text} tone={i.level === "error" ? "error" : i.level === "warning" ? "warning" : "info"}>
              {i.text}
            </Notice>
          ))}
          {parsed.ok && parsed.issues.length === 0 && <Notice tone="success">This is a well-formed media type.</Notice>}
        </>
      )}
    </div>
  );
}

function FileTab() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ sniff: SniffResult | null; size: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const read = async (f: File) => {
    setFile(f);
    setBusy(true);
    try {
      const buf = await f.slice(0, 4096).arrayBuffer();
      setResult({ sniff: sniffBytes(new Uint8Array(buf), f.name), size: f.size });
    } finally {
      setBusy(false);
    }
  };

  const ext = file ? file.name.replace(/^.*\./, "").toLowerCase() : "";
  const byName = file && file.name.includes(".") ? lookupExtension(ext) : [];
  const browserType = file?.type || "";
  const sniff = result?.sniff ?? null;
  const bestType = sniff?.type ?? byName[0]?.type ?? "application/octet-stream";
  // Text types should say their encoding; event streams must not.
  const serveType = /^text\/(?!event-stream)/.test(bestType) ? `${bestType}; charset=utf-8` : bestType;
  const agree = sniff && byName.some((e) => e.type === sniff.type || (sniff.type === "application/zip" && /zip|openxml|opendocument|epub|java-archive|android/.test(e.type)));

  return (
    <div className="space-y-5">
      <DropZone
        onFileSelect={read}
        selectedFile={file}
        onClear={() => {
          setFile(null);
          setResult(null);
        }}
        maxSizeMB={2048}
        title="Drop a file to find its real type"
        subtitle="Only the first few kilobytes are read, in your browser. Nothing is uploaded."
        isProcessing={busy}
      />
      {file && result && (
        <>
          <dl className="divide-y rounded-lg border text-sm">
            {[
              ["File name", file.name],
              ["Size", formatBytes(result.size)],
              ["Type from the extension", byName.length ? byName.map((e) => e.type).join(" or ") : file.name.includes(".") ? `.${ext} is not in this tool's list` : "No extension"],
              ["Type reported by your browser", browserType || "(none)"],
              ["Type from the file's contents", sniff ? `${sniff.type} — ${sniff.description}${sniff.confidence !== "certain" ? ` (${sniff.confidence})` : ""}` : "Not recognised: probably a format without a signature"],
            ].map(([k, v]) => (
              <div key={k} className="grid gap-1 px-3.5 py-2.5 @md:grid-cols-[14rem_1fr] @md:gap-4">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-mono text-[13px] break-all text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
          {sniff && byName.length > 0 && !agree && <Notice tone="warning">The extension says <strong className="font-semibold">{byName[0].type}</strong> but the contents look like <strong className="font-semibold">{sniff.type}</strong>. Serving it under the wrong type can make browsers refuse it, or sniff it into something else. Rename the file or fix the type.</Notice>}
          {sniff && agree && <Notice tone="success">The extension and the contents agree.</Notice>}
          <Field label="Header to send when serving this file">
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3.5 py-2">
              <code className="min-w-0 flex-1 font-mono text-sm break-all text-foreground">Content-Type: {serveType}</code>
              <CopyButton text={`Content-Type: ${serveType}`} size="sm" />
            </div>
          </Field>
        </>
      )}
    </div>
  );
}

export default function ContentTypeLookup() {
  const [tab, setTab] = useState<Tab>("send");
  return (
    <div className="space-y-6">
      <Segmented ariaLabel="What do you need?" value={tab} onChange={setTab} options={[{ value: "send", label: "What should I send?" }, { value: "check", label: "Check a header" }, { value: "file", label: "Identify a file" }]} />
      {tab === "send" && (
        <div className="space-y-8">
          {GROUPS.map((g) => (
            <ToolSection key={g} title={g}>
              <ul className="divide-y overflow-hidden rounded-lg border bg-card">
                {CONTENT_TYPE_RECIPES.filter((r) => r.group === g).map((r) => (
                  <li key={r.id} className="px-3.5 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {r.label} <span className="ml-1 text-xs font-normal text-muted-foreground">{r.direction === "both" ? "request and response" : r.direction}</span>
                        </p>
                        <code className="mt-1 block font-mono text-[13px] break-all text-primary">Content-Type: {r.value}</code>
                        <p className="mt-1 text-sm text-muted-foreground">{r.note}</p>
                      </div>
                      <CopyButton text={`Content-Type: ${r.value}`} size="sm" />
                    </div>
                  </li>
                ))}
              </ul>
            </ToolSection>
          ))}
        </div>
      )}
      {tab === "check" && <CheckTab />}
      {tab === "file" && <FileTab />}
    </div>
  );
}
