"use client";

import React, { useId, useMemo, useState } from "react";
import { Copy, Download, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Notice, Segmented, TextArea, TextInput, ToggleRow, ToolDivider, ToolSection } from "@/components/tool/kit";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { copyText } from "@/lib/utils/clipboard";
import { downloadBlob } from "@/lib/utils/download";
import { emit, parseJson, type OutputKind } from "@/lib/json/infer";

const SAMPLE_JSON = `{
  "userId": 104,
  "username": "alex_dev",
  "email": "alex@example.com",
  "isActive": true,
  "profile": {
    "firstName": "Alex",
    "avatarUrl": "https://example.com/alex.jpg"
  },
  "tags": ["frontend", "react"],
  "projects": [
    { "id": "proj_1", "name": "Utility Bench", "stars": 120, "description": "Everyday tools" },
    { "id": "proj_2", "name": "Notes", "stars": 8, "description": null, "archived": true }
  ]
}`;

interface Options {
  rootName: string;
  kind: OutputKind;
  readonly: boolean;
  allOptional: boolean;
}

const DEFAULTS: Options = { rootName: "Root", kind: "interface", readonly: false, allOptional: false };

export default function JsonToTypeScript() {
  const id = useId();
  const [input, setInput] = useState(SAMPLE_JSON);
  const [stored, setOpts] = usePersistentState<Options>("json-ts-options", DEFAULTS);
  const opts = useMemo(() => ({ ...DEFAULTS, ...stored }), [stored]);

  const result = useMemo(() => {
    if (!input.trim()) return null;
    const parsed = parseJson(input);
    if ("error" in parsed) return parsed;
    return emit(parsed.value, opts);
  }, [input, opts]);

  const code = result && "code" in result ? result.code : "";
  const fileName = `${opts.rootName.replace(/[^\w-]+/g, "") || "types"}${opts.kind === "zod" ? ".schema" : ""}.ts`;

  return (
    <div className="space-y-8">
      <ToolSection
        title="JSON"
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setInput(SAMPLE_JSON)}>
              Sample
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setInput("")} disabled={!input}>
              <RotateCcw aria-hidden="true" /> Clear
            </Button>
          </>
        }
      >
        <Field label="JSON to convert" htmlFor={`${id}-json`} hint="Paste a real API response. Include several items of an array if they differ; all of them are used.">
          <TextArea id={`${id}-json`} rows={12} value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} className="font-mono text-sm" />
        </Field>
        {result && "error" in result && <Notice tone="error">{result.error}</Notice>}
      </ToolSection>

      <ToolSection title="Options">
        <div className="grid gap-4 @lg:grid-cols-2">
          <Field label="Name of the top-level type" htmlFor={`${id}-root`}>
            <TextInput id={`${id}-root`} value={opts.rootName} onChange={(e) => setOpts({ ...opts, rootName: e.target.value })} spellCheck={false} placeholder="UserResponse" />
          </Field>
          <Field label="Output">
            <Segmented
              ariaLabel="Output"
              value={opts.kind}
              onChange={(kind) => setOpts({ ...opts, kind })}
              options={[
                { value: "interface", label: "interface" },
                { value: "type", label: "type" },
                { value: "zod", label: "Zod schema" },
              ]}
            />
          </Field>
        </div>
        <div className="grid gap-4 @lg:grid-cols-2">
          <ToggleRow id={`${id}-ro`} label="Read-only fields" description="Adds readonly (or .readonly() for Zod)." checked={opts.readonly} onCheckedChange={(readonly) => setOpts({ ...opts, readonly })} />
          <ToggleRow
            id={`${id}-opt`}
            label="Make every field optional"
            description="Fields missing from some array items are optional either way."
            checked={opts.allOptional}
            onCheckedChange={(allOptional) => setOpts({ ...opts, allOptional })}
          />
        </div>
      </ToolSection>

      <ToolDivider />

      <ToolSection
        title={opts.kind === "zod" ? "Zod schema" : "TypeScript"}
        description={result && "names" in result ? `${result.names.length} type${result.names.length === 1 ? "" : "s"}: ${result.names.join(", ")}` : undefined}
      >
        <pre className="max-h-[32rem] overflow-auto rounded-lg border bg-muted/30 p-3.5 font-mono text-sm leading-relaxed text-foreground">
          {code || <span className="text-muted-foreground">The types appear here.</span>}
        </pre>
        {opts.kind === "zod" && code && <p className="text-xs text-muted-foreground">Needs the zod package: npm install zod. Validate with UserSchema.parse(data).</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" disabled={!code} onClick={() => downloadBlob(new Blob([code], { type: "text/typescript" }), fileName)}>
            <Download aria-hidden="true" /> Download {fileName}
          </Button>
          <Button
            disabled={!code}
            onClick={async () => {
              if (await copyText(code)) toast.success("Types copied");
            }}
          >
            <Copy aria-hidden="true" /> Copy
          </Button>
        </div>
      </ToolSection>
    </div>
  );
}
