"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { CheckCircle2, Copy, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import DropZone from "@/components/ui/DropZone";
import { Field, Notice, Segmented, TextArea, TextInput, ToggleRow, ToolDivider, ToolSection } from "@/components/tool/kit";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { copyText } from "@/lib/utils/clipboard";
import { markToolError } from "@/lib/analytics";
import {
  ALGOS,
  ALGO_BY_ID,
  findMatch,
  formatDigest,
  hashBytes,
  hashFile,
  hmacCapable,
  readExpected,
  utf8,
  type Algo,
  type Digests,
  type OutputFormat,
} from "@/lib/hash/hash";
import { cn } from "@/lib/utils";

const DEFAULT_ALGOS: Algo[] = ["md5", "sha1", "sha256", "sha512"];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 ? 2 : 1)} ${units[i]}`;
}

export default function HashGenerator() {
  const id = useId();
  const [mode, setMode] = useState<"text" | "file">("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [storedAlgos, setAlgos] = usePersistentState<Algo[]>("hash-algos", DEFAULT_ALGOS);
  const [format, setFormat] = usePersistentState<OutputFormat>("hash-format", "hex");
  const [hmacOn, setHmacOn] = useState(false);
  const [key, setKey] = useState("");
  const [expected, setExpected] = useState("");
  const [digests, setDigests] = useState<Digests | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [took, setTook] = useState<number | null>(null);
  const run = useRef(0);

  const algos = useMemo(() => {
    const valid = storedAlgos.filter((a) => a in ALGO_BY_ID);
    return valid.length ? valid : DEFAULT_ALGOS;
  }, [storedAlgos]);
  // Secret keys are never saved.
  const waitingForKey = hmacOn && !key;
  const keyText = hmacOn ? key : "";

  // Text: hash on every change, keeping only the latest result.
  useEffect(() => {
    if (mode !== "text") return;
    const ticket = ++run.current;
    if (!text || waitingForKey) {
      Promise.resolve().then(() => ticket === run.current && setDigests(null));
      return;
    }
    hashBytes(utf8(text), algos, keyText ? utf8(keyText) : null)
      .then((d) => ticket === run.current && setDigests(d))
      .catch(() => markToolError("hash_failed"));
  }, [mode, text, algos, keyText, waitingForKey]);

  // File: read in chunks with progress. A new file, algorithm or key starts
  // over; a key being typed waits for a pause first.
  useEffect(() => {
    if (mode !== "file") return;
    const ticket = ++run.current;
    if (!file || waitingForKey) {
      Promise.resolve().then(() => {
        if (ticket !== run.current) return;
        setDigests(null);
        setProgress(null);
      });
      return;
    }
    const timer = window.setTimeout(
      async () => {
        if (ticket !== run.current) return;
        setDigests(null);
        setTook(null);
        setProgress(0);
        const started = performance.now();
        try {
          const d = await hashFile(
            file,
            algos,
            keyText ? utf8(keyText) : null,
            (p) => ticket === run.current && setProgress(p),
            () => ticket !== run.current
          );
          if (!d || ticket !== run.current) return;
          setDigests(d);
          setTook(performance.now() - started);
          setProgress(null);
        } catch {
          if (ticket !== run.current) return;
          setProgress(null);
          toast.error("This file couldn't be read. It may have been moved or deleted.");
          markToolError("hash_file_read");
        }
      },
      keyText ? 400 : 0
    );
    return () => window.clearTimeout(timer);
  }, [mode, file, algos, keyText, waitingForKey]);

  const exp = useMemo(() => readExpected(expected), [expected]);
  const expOk = exp && !("error" in exp) ? exp : null;
  const match = digests && expOk ? findMatch(digests, expOk) : null;
  // A published hash of a length none of the chosen algorithms produce.
  const missing = expOk && !match ? (expOk.named ? [expOk.named] : expOk.candidates).filter((a) => !algos.includes(a)) : [];

  const toggleAlgo = (a: Algo) => {
    const next = algos.includes(a) ? algos.filter((x) => x !== a) : [...algos, a];
    if (next.length) setAlgos(ALGOS.map((x) => x.id).filter((x) => next.includes(x)));
  };

  const shown = ALGOS.filter((a) => algos.includes(a.id) && (!hmacOn || hmacCapable(a.id)));
  const weak = shown.some((a) => !a.secure && a.id !== "crc32");
  const bytes = useMemo(() => (mode === "text" ? utf8(text).length : 0), [mode, text]);
  const busy = progress !== null;

  const copyAll = async () => {
    if (!digests) return;
    const lines = shown
      .filter((a) => digests[a.id])
      .map((a) => `${hmacOn ? "HMAC-" : ""}${a.label}: ${formatDigest(digests[a.id]!, format)}`);
    if (await copyText(lines.join("\n"))) toast.success("All hashes copied");
  };

  return (
    <div className="space-y-8">
      <Segmented
        ariaLabel="What to hash"
        value={mode}
        onChange={(m) => {
          setMode(m);
          setDigests(null);
        }}
        options={[
          { value: "text", label: "Text" },
          { value: "file", label: "File" },
        ]}
      />

      {mode === "text" ? (
        <Field
          label="Text to hash"
          htmlFor={`${id}-text`}
          hint={text ? `${text.length.toLocaleString()} characters · ${bytes.toLocaleString()} bytes as UTF-8` : "Every character counts, including spaces and line breaks."}
        >
          <TextArea
            id={`${id}-text`}
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste text"
            spellCheck={false}
            className="font-mono"
          />
        </Field>
      ) : (
        <div className="space-y-2.5">
          <DropZone
            onFileSelect={(f) => {
              setFile(f);
              setTook(null);
            }}
            maxSizeMB={Infinity}
            title="Drop a file here or choose one"
            subtitle="Hashed in your browser, a few megabytes at a time. Nothing is uploaded."
            supportedFormatsText="Any file, any size"
            selectedFile={file}
            onClear={() => setFile(null)}
          />
          {busy && (
            <div className="space-y-1.5" role="status">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Hashing{file ? ` ${formatBytes(file.size)}` : ""}…</span>
                <span className="flex items-center gap-2 tabular-nums">
                  {Math.round((progress ?? 0) * 100)}%
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Stop hashing"
                    onClick={() => {
                      run.current++;
                      setProgress(null);
                      setFile(null);
                    }}
                  >
                    <X aria-hidden="true" />
                  </Button>
                </span>
              </div>
              <Progress value={(progress ?? 0) * 100} />
            </div>
          )}
          {took !== null && file && digests && (
            <p className="text-xs text-muted-foreground">
              Hashed {formatBytes(file.size)} in {took < 1000 ? `${Math.max(1, Math.round(took))} ms` : `${(took / 1000).toFixed(1)} s`}.
            </p>
          )}
        </div>
      )}

      <ToolSection title="Algorithms">
        <div role="group" aria-label="Algorithms" className="flex flex-wrap gap-1.5">
          {ALGOS.map((a) => {
            const on = algos.includes(a.id);
            const off = hmacOn && !hmacCapable(a.id);
            return (
              <button
                key={a.id}
                type="button"
                aria-pressed={on}
                disabled={off}
                onClick={() => toggleAlgo(a.id)}
                className={cn(
                  "h-8 rounded-full border px-3 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40",
                  on
                    ? "border-primary/50 bg-brand-subtle text-brand-subtle-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {a.label}
              </button>
            );
          })}
        </div>
        <div className="grid gap-4 @md:grid-cols-[1fr_auto] @md:items-start">
          <ToggleRow
            id={`${id}-hmac`}
            label="HMAC with a secret key"
            description="For checking webhook and API signatures. The key isn't saved."
            checked={hmacOn}
            onCheckedChange={setHmacOn}
          />
          <Segmented
            size="sm"
            ariaLabel="Output format"
            value={format}
            onChange={setFormat}
            options={[
              { value: "hex", label: "hex" },
              { value: "HEX", label: "HEX" },
              { value: "base64", label: "Base64" },
            ]}
          />
        </div>
        {hmacOn && (
          <Field label="Secret key" htmlFor={`${id}-key`} hint="Used exactly as typed, as UTF-8 text.">
            <TextInput
              id={`${id}-key`}
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="whsec_…"
              className="font-mono"
            />
          </Field>
        )}
      </ToolSection>

      <ToolDivider />

      <ToolSection
        title={hmacOn ? "HMAC signatures" : "Hashes"}
        actions={
          <Button variant="outline" size="sm" onClick={copyAll} disabled={!digests}>
            <Copy aria-hidden="true" /> Copy all
          </Button>
        }
      >
        <ul className="divide-y rounded-lg border" aria-live="polite">
          {shown.map((a) => {
            const d = digests?.[a.id];
            const value = d ? formatDigest(d, format) : "";
            const isMatch = match === a.id;
            return (
              <li key={a.id} className={cn("flex items-start gap-3 px-3.5 py-3", isMatch && "bg-success/5")}>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    {isMatch && <CheckCircle2 className="size-3.5 text-success" aria-hidden="true" />}
                    <span className={cn(isMatch && "text-success")}>
                      {hmacOn ? "HMAC-" : ""}
                      {a.label}
                    </span>
                    <span className="font-normal">· {a.bits}-bit</span>
                    {isMatch && <span className="text-success">· matches</span>}
                  </p>
                  <p className={cn("mt-1 font-mono text-sm break-all", value ? "text-foreground" : "text-muted-foreground")}>
                    {value || (busy ? "Working…" : waitingForKey ? "Enter a secret key" : mode === "text" ? "Type some text" : "Choose a file")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Copy ${a.label}`}
                  disabled={!value}
                  onClick={async () => {
                    if (await copyText(value)) toast.success(`${a.label} copied`);
                  }}
                >
                  <Copy aria-hidden="true" />
                </Button>
              </li>
            );
          })}
        </ul>
        {weak && (
          <p className="text-xs text-muted-foreground">
            MD5 and SHA-1 still catch accidental changes, but they can be forged. To check that a download hasn&apos;t been tampered with,
            compare its SHA-256.
          </p>
        )}
      </ToolSection>

      <ToolSection title="Check against a published hash" description="Paste the hash from the download page or the sender to see if it matches.">
        <Field label="Expected hash" htmlFor={`${id}-expected`} hint="Hex or Base64. Lines from sha256sum and values like sha384-… are fine too.">
          <TextInput
            id={`${id}-expected`}
            value={expected}
            onChange={(e) => setExpected(e.target.value)}
            placeholder="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
            spellCheck={false}
            autoComplete="off"
            className="font-mono"
            aria-invalid={exp && "error" in exp ? true : undefined}
          />
        </Field>
        {exp && "error" in exp && <Notice tone="error">{exp.error}</Notice>}
        {expOk && digests && match && (
          <Notice tone="success">
            Matches the {hmacOn ? "HMAC-" : ""}
            {ALGO_BY_ID[match].label} {hmacOn ? "signature" : "hash"}.{" "}
            {mode === "file" ? "The file is exactly the one that was published." : "The text gives exactly this value."}
          </Notice>
        )}
        {expOk && !match && missing.length > 0 && (
          <Notice tone="info">
            <span>
              That looks like a {missing.map((a) => ALGO_BY_ID[a].label).join(" or ")} value, which isn&apos;t turned on.{" "}
            </span>
            <span className="mt-2 flex flex-wrap gap-2">
              {missing.map((a) => (
                <Button key={a} size="sm" variant="outline" onClick={() => toggleAlgo(a)} disabled={hmacOn && !hmacCapable(a)}>
                  Check with {ALGO_BY_ID[a].label}
                </Button>
              ))}
            </span>
          </Notice>
        )}
        {expOk && digests && !match && missing.length === 0 && (
          <Notice tone="error">
            Doesn&apos;t match.{" "}
            {mode === "file"
              ? "The file is different from the one published — it may be incomplete or changed. Download it again from the official source."
              : "Every character counts: check for a trailing space or line break. On the command line, echo adds a line break unless you use echo -n."}
          </Notice>
        )}
      </ToolSection>
    </div>
  );
}
