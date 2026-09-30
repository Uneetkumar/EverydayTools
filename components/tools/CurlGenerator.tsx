"use client";

import React, { useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { CodeBlock } from "@/components/tool/code-block";
import { Field, Notice, Segmented, TextArea, ToggleRow, ToolDivider, ToolSection } from "@/components/tool/kit";
import { RequestForm, draftToRequest, exampleDraft, requestToDraft, type RequestDraft } from "@/components/tool/request-form";
import { Button } from "@/components/ui/button";
import { buildCurl, parseCurl, type Shell } from "@/lib/http/curl";
import { TARGET_LABELS, generateCode, type CodeTarget } from "@/lib/http/codegen";
import { BODYLESS_METHODS } from "@/lib/http/request";

const ALSO: CodeTarget[] = ["fetch", "axios", "python-requests", "node-https"];

export default function CurlGenerator() {
  const id = useId();
  // Requests can hold tokens, so the form is kept in memory only.
  const [draft, setDraft] = useState<RequestDraft>(exampleDraft);
  const [shell, setShell] = useState<Shell>("bash");
  const [multiline, setMultiline] = useState(true);
  const [short, setShort] = useState(true);
  const [importing, setImporting] = useState(false);
  const [paste, setPaste] = useState("");
  const [pasteError, setPasteError] = useState("");
  const [also, setAlso] = useState<CodeTarget>("fetch");

  const request = useMemo(() => draftToRequest(draft), [draft]);
  const command = useMemo(() => (request.url ? buildCurl(request, { shell, multiline, short }) : ""), [request, shell, multiline, short]);
  const alsoCode = useMemo(() => (request.url ? generateCode(also, request, { errorHandling: true }) : null), [request, also]);

  const warnings = useMemo(() => {
    const w: string[] = [];
    const url = request.url;
    if (url && !/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) w.push("The URL has no scheme. curl assumes http://, so start it with https:// unless you mean plain HTTP.");
    if (url && /\s/.test(url)) w.push("The URL contains spaces. Encode them as %20.");
    if (BODYLESS_METHODS.has(request.method) && request.body.kind !== "none" && request.method !== "GET") w.push(`${request.method} requests do not carry a body.`);
    if (request.method === "GET" && request.body.kind !== "none") w.push("A body on a GET request is unusual: many servers and proxies ignore it. Consider POST, or move the data to query parameters.");
    if (request.options.insecure) w.push("-k turns off certificate verification, which removes the protection HTTPS gives. Use it only against servers you control, in testing.");
    if (request.basicAuth?.password) w.push("The command contains a password. It will be visible in your shell history and in the process list while it runs. Use an environment variable or --netrc for real credentials.");
    if (draft.auth.kind === "bearer" && draft.auth.token && draft.auth.token !== "YOUR_TOKEN") w.push("The command contains an access token. Anyone who sees the command can use it, so do not paste it into tickets or chat.");
    if (shell === "powershell") w.push("Uses curl.exe on purpose: in Windows PowerShell 5, plain curl is an alias for Invoke-WebRequest and accepts different options.");
    return w;
  }, [request, draft.auth, shell]);

  const loadFromCurl = () => {
    try {
      const r = parseCurl(paste);
      setDraft(requestToDraft(r.request));
      setImporting(false);
      setPaste("");
      setPasteError("");
      toast.success("Loaded into the form");
    } catch (e) {
      setPasteError((e as Error).message);
    }
  };

  return (
    <div className="space-y-8">
      <ToolSection
        title="Request"
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => setImporting((v) => !v)}>
            {importing ? "Cancel" : "Start from a curl command"}
          </Button>
        }
      >
        {importing && (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-3.5">
            <Field label="Paste a curl command" htmlFor={`${id}-paste`} hint="It is read into the form below, where you can change any part.">
              <TextArea id={`${id}-paste`} rows={4} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={"curl -X POST https://api.example.com/items \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"name\":\"Ada\"}'"} spellCheck={false} className="font-mono" />
            </Field>
            {pasteError && <Notice tone="error">{pasteError}</Notice>}
            <Button type="button" size="sm" onClick={loadFromCurl} disabled={!paste.trim()}>
              Load into the form
            </Button>
          </div>
        )}
        <RequestForm draft={draft} onChange={setDraft} urlPlaceholder="https://api.example.com/v1/users" />
      </ToolSection>

      <ToolDivider />

      <ToolSection title="Your curl command">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Segmented size="sm" ariaLabel="Shell" value={shell} onChange={setShell} options={[{ value: "bash", label: "Bash / zsh" }, { value: "powershell", label: "PowerShell" }, { value: "cmd", label: "Windows cmd" }]} />
        </div>
        <div className="grid gap-3 @md:grid-cols-2">
          <ToggleRow id={`${id}-ml`} label="One option per line" description="Easier to read and edit." checked={multiline} onCheckedChange={setMultiline} />
          <ToggleRow id={`${id}-short`} label="Short options" description="-H instead of --header." checked={short} onCheckedChange={setShort} />
        </div>
        <CodeBlock label={shell === "bash" ? "Terminal" : shell === "powershell" ? "PowerShell" : "Command Prompt"} code={command} maxHeight="22rem" empty="Enter a URL to generate the command." />
        {warnings.map((w) => (
          <Notice key={w} tone="warning">
            {w}
          </Notice>
        ))}
      </ToolSection>

      {alsoCode && (
        <ToolSection title="The same request in code" description="Convert to the language you are working in. Paste any curl command into the dedicated converters for more control.">
          <Segmented size="sm" ariaLabel="Language" value={also} onChange={setAlso} options={ALSO.map((t) => ({ value: t, label: TARGET_LABELS[t] }))} />
          <CodeBlock label={TARGET_LABELS[also]} code={alsoCode.code} maxHeight="22rem" />
          {alsoCode.notes.map((n) => (
            <Notice key={n} tone="info">
              {n}
            </Notice>
          ))}
        </ToolSection>
      )}
    </div>
  );
}
