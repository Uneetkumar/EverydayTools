"use client";

import React, { useEffect, useId, useMemo, useState } from "react";
import { ArrowUpDown, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import DropZone from "@/components/ui/DropZone";
import { Field, Notice, Segmented, Stat, StatGrid, TextArea, ToggleRow, ToolDivider, ToolSection } from "@/components/tool/kit";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { copyText } from "@/lib/utils/clipboard";
import { downloadBlob, downloadText } from "@/lib/utils/download";
import { markToolError } from "@/lib/analytics";
import { asText, decodeBase64, encodeBase64, isImage, sniff } from "@/lib/text/base64";

interface Options {
  urlSafe: boolean;
  wrap: boolean;
  dataUri: boolean;
}

/** Larger results are shown cut short; Copy and Download still use all of it. */
const PREVIEW_CHARS = 200_000;
const MAX_FILE_MB = 50;

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export default function Base64Converter() {
  const id = useId();
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [source, setSource] = useState<"text" | "file">("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [encoded, setEncoded] = useState("");
  const [opts, setOpts] = usePersistentState<Options>("base64-options", { urlSafe: false, wrap: false, dataUri: true });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Read a chosen file once; the options below re-encode it instantly.
  useEffect(() => {
    let live = true;
    if (!file) {
      Promise.resolve().then(() => live && setFileBytes(null));
      return () => {
        live = false;
      };
    }
    file
      .arrayBuffer()
      .then((b) => live && setFileBytes(new Uint8Array(b)))
      .catch(() => {
        toast.error("This file couldn't be read.");
        markToolError("base64_file_read");
      });
    return () => {
      live = false;
    };
  }, [file]);

  const encodeOut = useMemo(() => {
    if (mode !== "encode") return "";
    if (source === "text") return text ? encodeBase64(new TextEncoder().encode(text), opts) : "";
    if (!fileBytes || !file) return "";
    const b64 = encodeBase64(fileBytes, { urlSafe: opts.urlSafe && !opts.dataUri, wrap: opts.wrap && !opts.dataUri });
    return opts.dataUri ? `data:${file.type || sniff(fileBytes)?.mime || "application/octet-stream"};base64,${b64}` : b64;
  }, [mode, source, text, fileBytes, file, opts]);

  const decoded = useMemo(() => (mode === "decode" && encoded.trim() ? decodeBase64(encoded) : null), [mode, encoded]);
  const ok = decoded && !("error" in decoded) ? decoded : null;
  const decodedText = useMemo(() => (ok ? asText(ok.bytes) : null), [ok]);
  const kind = useMemo(() => (ok && decodedText === null ? sniff(ok.bytes) : null), [ok, decodedText]);
  const mime = ok?.mime ?? kind?.mime;
  const showImage = !!ok && isImage(mime) && (decodedText === null || mime === "image/svg+xml");

  // Image preview from the decoded bytes; the object URL is released when it changes.
  useEffect(() => {
    if (!ok || !showImage || !mime) {
      Promise.resolve().then(() => setPreviewUrl(null));
      return;
    }
    const url = URL.createObjectURL(new Blob([ok.bytes as BlobPart], { type: mime }));
    Promise.resolve().then(() => setPreviewUrl(url));
    return () => URL.revokeObjectURL(url);
  }, [ok, showImage, mime]);

  const downloadDecoded = () => {
    if (!ok) return;
    const ext = kind?.ext ?? (decodedText !== null ? "txt" : mime?.split("/")[1]?.replace("svg+xml", "svg") ?? "bin");
    downloadBlob(new Blob([ok.bytes as BlobPart], { type: mime ?? "application/octet-stream" }), `decoded.${ext}`);
  };

  const encodePreview = encodeOut.length > PREVIEW_CHARS ? `${encodeOut.slice(0, PREVIEW_CHARS)}…` : encodeOut;
  const inputBytes = source === "text" ? new TextEncoder().encode(text).length : (fileBytes?.length ?? 0);

  return (
    <div className="space-y-8">
      <Segmented
        ariaLabel="What do you want to do?"
        value={mode}
        onChange={setMode}
        options={[
          { value: "encode", label: "Encode to Base64" },
          { value: "decode", label: "Decode Base64" },
        ]}
      />

      {mode === "encode" ? (
        <>
          <ToolSection title="Input">
            <Segmented
              size="sm"
              ariaLabel="Encode text or a file"
              value={source}
              onChange={setSource}
              options={[
                { value: "text", label: "Text" },
                { value: "file", label: "File" },
              ]}
            />
            {source === "text" ? (
              <Field label="Text to encode" htmlFor={`${id}-text`} hint="Encoded as UTF-8, so every language and emoji works.">
                <TextArea id={`${id}-text`} rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="Hello, world!" spellCheck={false} className="font-mono" />
              </Field>
            ) : (
              <DropZone
                onFileSelect={setFile}
                maxSizeMB={MAX_FILE_MB}
                title="Drop a file here or choose one"
                subtitle="Images, fonts, PDFs — any file. Read in your browser; nothing is uploaded."
                selectedFile={file}
                onClear={() => setFile(null)}
              />
            )}
          </ToolSection>

          <ToolSection title="Options">
            {source === "file" && (
              <ToggleRow
                id={`${id}-datauri`}
                label="As a data: URI"
                description="Ready to paste into src=, url() or href: data:image/png;base64,…"
                checked={opts.dataUri}
                onCheckedChange={(dataUri) => setOpts({ ...opts, dataUri })}
              />
            )}
            {!(source === "file" && opts.dataUri) && (
              <>
                <ToggleRow
                  id={`${id}-urlsafe`}
                  label="URL-safe (Base64URL)"
                  description="Uses - and _ instead of + and /, without = padding. For URLs, file names and JWTs."
                  checked={opts.urlSafe}
                  onCheckedChange={(urlSafe) => setOpts({ ...opts, urlSafe })}
                />
                <ToggleRow
                  id={`${id}-wrap`}
                  label="Line breaks every 76 characters"
                  description="The MIME layout used in email. Leave off for anything else."
                  checked={opts.wrap}
                  onCheckedChange={(wrap) => setOpts({ ...opts, wrap })}
                />
              </>
            )}
          </ToolSection>

          <ToolDivider />

          <ToolSection title="Base64">
            {encodeOut && (
              <StatGrid className="@xl:grid-cols-3">
                <Stat label="Input" value={formatBytes(inputBytes)} />
                <Stat label="Base64" value={formatBytes(encodeOut.length)} hint={inputBytes ? `${Math.round((encodeOut.length / inputBytes - 1) * 100)}% larger` : undefined} />
                <Stat label="Characters" value={encodeOut.length.toLocaleString()} />
              </StatGrid>
            )}
            <TextArea aria-label="Base64 result" readOnly rows={6} value={encodePreview} className="font-mono text-xs md:text-xs" placeholder="The Base64 appears here." />
            {encodeOut.length > PREVIEW_CHARS && (
              <p className="text-xs text-muted-foreground">Showing the first {PREVIEW_CHARS.toLocaleString()} characters. Copy and Download include all of it.</p>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              {source === "text" && (
                <Button
                  variant="outline"
                  disabled={!encodeOut}
                  onClick={() => {
                    setEncoded(encodeOut);
                    setMode("decode");
                  }}
                >
                  <ArrowUpDown aria-hidden="true" /> Decode it
                </Button>
              )}
              <Button variant="outline" disabled={!encodeOut} onClick={() => downloadText(encodeOut, `${file && source === "file" ? file.name : "text"}.b64.txt`)}>
                <Download aria-hidden="true" /> Download
              </Button>
              <Button
                disabled={!encodeOut}
                onClick={async () => {
                  if (await copyText(encodeOut)) toast.success("Base64 copied");
                }}
              >
                <Copy aria-hidden="true" /> Copy
              </Button>
            </div>
          </ToolSection>
        </>
      ) : (
        <>
          <Field label="Base64 or data: URI" htmlFor={`${id}-b64`} hint="Standard or URL-safe, with or without padding and line breaks.">
            <TextArea
              id={`${id}-b64`}
              rows={6}
              value={encoded}
              onChange={(e) => setEncoded(e.target.value)}
              placeholder="SGVsbG8sIHdvcmxkIQ=="
              spellCheck={false}
              className="font-mono text-xs md:text-xs"
              aria-invalid={decoded && "error" in decoded ? true : undefined}
            />
          </Field>

          {decoded && "error" in decoded && <Notice tone="error">{decoded.error}</Notice>}

          {ok && (
            <>
              <ToolDivider />
              <StatGrid className="@xl:grid-cols-3">
                <Stat label="Decoded size" value={formatBytes(ok.bytes.length)} />
                <Stat label="Contents" value={decodedText !== null ? "Text" : (kind?.label ?? "Binary data")} hint={mime} />
                <Stat label="Alphabet" value={ok.urlSafe ? "URL-safe" : "Standard"} />
              </StatGrid>

              {previewUrl && (
                <div className="flex justify-center rounded-lg border bg-muted/30 p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element -- a local object URL, not an optimisable asset */}
                  <img src={previewUrl} alt="Decoded image" className="max-h-72 max-w-full object-contain" />
                </div>
              )}

              {decodedText !== null ? (
                <ToolSection title="Text">
                  <TextArea aria-label="Decoded text" readOnly rows={6} value={decodedText} className="font-mono" />
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button variant="outline" onClick={downloadDecoded}>
                      <Download aria-hidden="true" /> Download
                    </Button>
                    <Button
                      onClick={async () => {
                        if (await copyText(decodedText)) toast.success("Text copied");
                      }}
                    >
                      <Copy aria-hidden="true" /> Copy text
                    </Button>
                  </div>
                </ToolSection>
              ) : (
                <div className="space-y-3">
                  <Notice tone="info">
                    This is {kind ? `a ${kind.label.toLowerCase()}` : "binary data, not text"}. Download it to open it.
                  </Notice>
                  <div className="flex justify-end">
                    <Button onClick={downloadDecoded}>
                      <Download aria-hidden="true" /> Download {kind ? `.${kind.ext}` : "file"}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
