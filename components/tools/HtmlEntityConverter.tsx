"use client";

import React, { useId, useMemo, useState } from "react";
import { ArrowUpDown, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Notice, Segmented, TextArea, ToolDivider, ToolSection } from "@/components/tool/kit";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { useIsClient } from "@/lib/hooks/useIsClient";
import { copyText } from "@/lib/utils/clipboard";
import {
  countReferences,
  decodeEntities,
  encodeEntities,
  looksDoubleEncoded,
  type EncodeScope,
  type EncodeStyle,
} from "@/lib/text/entities";

interface Options {
  scope: EncodeScope;
  style: EncodeStyle;
}

const EXAMPLE = '<p class="note">Tom & Jerry\'s café — 5 < 10 © 2026 😀</p>';

export default function HtmlEntityConverter() {
  const id = useId();
  const isClient = useIsClient();
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("");
  const [opts, setOpts] = usePersistentState<Options>("html-entity-options", { scope: "unsafe", style: "named" });

  const result = useMemo(() => {
    if (!input) return { text: "", count: 0 };
    if (mode === "encode") return encodeEntities(input, opts.scope, opts.style);
    // Decoding uses the browser's HTML parser, so it waits for the page to load.
    if (!isClient) return { text: "", count: 0 };
    return { text: decodeEntities(input), count: countReferences(input) };
  }, [input, mode, opts.scope, opts.style, isClient]);

  const twice = mode === "decode" && !!result.text && looksDoubleEncoded(result.text);

  const swap = () => {
    setInput(result.text);
    setMode(mode === "encode" ? "decode" : "encode");
  };

  return (
    <div className="space-y-8">
      <Segmented
        ariaLabel="What do you want to do?"
        value={mode}
        onChange={setMode}
        options={[
          { value: "encode", label: "Encode text for HTML" },
          { value: "decode", label: "Decode entities" },
        ]}
      />

      <ToolSection
        title={mode === "encode" ? "Text" : "HTML with entities"}
        actions={
          <Button variant="ghost" size="sm" onClick={() => setInput(mode === "encode" ? EXAMPLE : encodeEntities(EXAMPLE, "non-ascii", "named").text)}>
            Try an example
          </Button>
        }
      >
        <Field
          label={mode === "encode" ? "Text to encode" : "Text to decode"}
          htmlFor={`${id}-in`}
          hint={mode === "decode" ? "Every named entity in the HTML standard works, as do &#233; and &#xE9;. Tags are left as they are." : undefined}
        >
          <TextArea
            id={`${id}-in`}
            rows={6}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === "encode" ? '<p>Fish & chips — "£5"</p>' : "&lt;p&gt;Fish &amp; chips &mdash; &quot;&pound;5&quot;&lt;/p&gt;"}
            spellCheck={false}
            className="font-mono"
          />
        </Field>

        {mode === "encode" && (
          <div className="grid gap-4 @lg:grid-cols-2">
            <Field label="Encode">
              <Segmented
                size="sm"
                ariaLabel="Which characters to encode"
                value={opts.scope}
                onChange={(scope) => setOpts({ ...opts, scope })}
                options={[
                  { value: "unsafe", label: "& < > \" '" },
                  { value: "non-ascii", label: "+ non-ASCII" },
                  { value: "all", label: "Everything" },
                ]}
              />
            </Field>
            <Field label="Write as">
              <Segmented
                size="sm"
                ariaLabel="Entity style"
                value={opts.style}
                onChange={(style) => setOpts({ ...opts, style })}
                options={[
                  { value: "named", label: "&copy;" },
                  { value: "decimal", label: "&#169;" },
                  { value: "hex", label: "&#xA9;" },
                ]}
              />
            </Field>
          </div>
        )}
        {mode === "encode" && (
          <p className="text-xs text-muted-foreground">
            {opts.scope === "unsafe"
              ? "Enough to show any text safely inside HTML or a quoted attribute. Other characters stay readable."
              : opts.scope === "non-ascii"
                ? "Also writes accents, symbols and emoji as references, for places that only accept plain ASCII."
                : "Every character except spaces and line breaks — sometimes used to hide an email address from simple scrapers."}
          </p>
        )}
      </ToolSection>

      <ToolDivider />

      <ToolSection
        title="Result"
        description={
          result.text
            ? mode === "encode"
              ? `${result.count.toLocaleString()} character${result.count === 1 ? "" : "s"} encoded.`
              : `${result.count.toLocaleString()} entit${result.count === 1 ? "y" : "ies"} decoded.`
            : undefined
        }
      >
        <TextArea aria-label="Result" readOnly rows={6} value={result.text} className="font-mono" placeholder="The result appears here." />
        {twice && (
          <Notice tone="info">
            <span>The result still contains entities such as &amp;amp;, so the text was probably encoded twice. </span>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setInput(result.text)}>
              Decode again
            </Button>
          </Notice>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={swap} disabled={!result.text}>
            <ArrowUpDown aria-hidden="true" /> Use as input
          </Button>
          <Button
            onClick={async () => {
              if (await copyText(result.text)) toast.success("Copied");
            }}
            disabled={!result.text}
          >
            <Copy aria-hidden="true" /> Copy
          </Button>
        </div>
      </ToolSection>
    </div>
  );
}
