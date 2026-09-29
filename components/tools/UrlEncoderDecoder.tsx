"use client";

import React, { useId, useMemo, useState } from "react";
import { ArrowUpDown, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Notice, OptionCards, Segmented, TextArea, ToggleRow, ToolDivider, ToolSection } from "@/components/tool/kit";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { copyText } from "@/lib/utils/clipboard";
import { TARGETS, breakDown, decodeUrlText, encodeUrlText, stillEncoded, type EncodeTarget } from "@/lib/url/encode";

type Mode = "encode" | "decode" | "parse";

interface Options {
  target: EncodeTarget;
  strict: boolean;
  perLine: boolean;
  plusIsSpace: boolean;
}

const DEFAULTS: Options = { target: "component", strict: false, perLine: false, plusIsSpace: true };

export default function UrlEncoderDecoder() {
  const id = useId();
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");
  const [opts, setOpts] = usePersistentState<Options>("url-encode-options", DEFAULTS);

  const result = useMemo(() => {
    if (!input || mode === "parse") return { text: "", invalid: [] as string[] };
    const lines = opts.perLine ? input.split("\n") : [input];
    if (mode === "encode") return { text: lines.map((l) => encodeUrlText(l, opts.target, { strict: opts.strict })).join("\n"), invalid: [] };
    const decoded = lines.map((l) => decodeUrlText(l, { plusIsSpace: opts.plusIsSpace }));
    return { text: decoded.map((d) => d.text).join("\n"), invalid: decoded.flatMap((d) => d.invalid) };
  }, [input, mode, opts]);

  const parsed = useMemo(() => (mode === "parse" ? breakDown(input) : null), [input, mode]);
  const twice = mode === "decode" && stillEncoded(result.text);

  const copy = async (text: string, what = "Copied") => {
    if (await copyText(text)) toast.success(what);
  };

  return (
    <div className="space-y-8">
      <Segmented
        ariaLabel="What do you want to do?"
        value={mode}
        onChange={setMode}
        options={[
          { value: "encode", label: "Encode" },
          { value: "decode", label: "Decode" },
          { value: "parse", label: "Break down a URL" },
        ]}
      />

      <ToolSection title={mode === "parse" ? "URL" : "Input"}>
        <Field
          label={mode === "encode" ? "Text to encode" : mode === "decode" ? "Encoded text" : "URL to break down"}
          htmlFor={`${id}-in`}
        >
          <TextArea
            id={`${id}-in`}
            rows={mode === "parse" ? 3 : 5}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === "encode"
                ? "red shoes & socks / size 10"
                : mode === "decode"
                  ? "red%20shoes%20%26%20socks"
                  : "https://shop.example.com/search?q=red+shoes&size=10#reviews"
            }
            spellCheck={false}
            className="font-mono"
          />
        </Field>

        {mode === "encode" && (
          <>
            <Field label="What is it?">
              <OptionCards
                ariaLabel="What the text is"
                value={opts.target}
                onChange={(target) => setOpts({ ...opts, target })}
                options={TARGETS}
                className="@xl:grid-cols-3"
              />
            </Field>
            {opts.target === "component" && (
              <ToggleRow
                id={`${id}-strict`}
                label="Also encode ! ' ( ) *"
                description="RFC 3986 reserves them. Some APIs (OAuth 1.0 signatures, AWS) need them encoded."
                checked={opts.strict}
                onCheckedChange={(strict) => setOpts({ ...opts, strict })}
              />
            )}
          </>
        )}
        {mode === "decode" && (
          <ToggleRow
            id={`${id}-plus`}
            label="+ means a space"
            description="True in query strings and form data. Turn off for paths, where + is a real plus sign."
            checked={opts.plusIsSpace}
            onCheckedChange={(plusIsSpace) => setOpts({ ...opts, plusIsSpace })}
          />
        )}
        {mode !== "parse" && (
          <ToggleRow
            id={`${id}-lines`}
            label="Each line separately"
            description="For a list of values: line breaks are kept instead of being encoded as %0A."
            checked={opts.perLine}
            onCheckedChange={(perLine) => setOpts({ ...opts, perLine })}
          />
        )}
      </ToolSection>

      <ToolDivider />

      {mode === "parse" ? (
        parsed && "error" in parsed ? (
          <Notice tone="error">{parsed.error}</Notice>
        ) : parsed ? (
          <>
            <ToolSection title="Parts">
              <dl className="divide-y rounded-lg border text-sm">
                {parsed.parts.map((p) => (
                  <div key={p.label} className="grid gap-1 px-3.5 py-2.5 @md:grid-cols-[8rem_1fr] @md:gap-4">
                    <dt className="text-muted-foreground">{p.label}</dt>
                    <dd className="min-w-0 font-mono break-all text-foreground">{p.value || "—"}</dd>
                  </div>
                ))}
              </dl>
            </ToolSection>
            <ToolSection title={`Query parameters (${parsed.params.length})`} description={parsed.params.length ? "Decoded, with + read as a space." : undefined}>
              {parsed.params.length ? (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-xs text-muted-foreground">
                      <tr>
                        <th scope="col" className="px-3.5 py-2 font-medium">Name</th>
                        <th scope="col" className="px-3.5 py-2 font-medium">Value</th>
                        <th scope="col" className="w-10 px-2 py-2">
                          <span className="sr-only">Copy</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {parsed.params.map((p, i) => (
                        <tr key={`${i}-${p.raw}`}>
                          <td className="px-3.5 py-2 align-top font-mono whitespace-nowrap text-foreground">{p.key}</td>
                          <td className="min-w-40 px-3.5 py-2 font-mono break-all text-foreground">{p.value || <span className="text-muted-foreground">(empty)</span>}</td>
                          <td className="px-2 py-1 align-top">
                            <Button variant="ghost" size="icon-sm" aria-label={`Copy the value of ${p.key}`} onClick={() => copy(p.value, "Value copied")}>
                              <Copy aria-hidden="true" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">This URL has no query string.</p>
              )}
            </ToolSection>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Paste a URL to see its parts and every query parameter, decoded.</p>
        )
      ) : (
        <ToolSection title="Result">
          <TextArea aria-label="Result" readOnly rows={5} value={result.text} className="font-mono" placeholder="The result appears here." />
          {result.invalid.length > 0 && (
            <Notice tone="warning">
              {result.invalid.length === 1 ? "One % sequence" : `${result.invalid.length} % sequences`} ({[...new Set(result.invalid)].slice(0, 4).join(", ")})
              {result.invalid.length === 1 ? " isn't" : " aren't"} valid and {result.invalid.length === 1 ? "was" : "were"} left as written. Everything else was decoded.
            </Notice>
          )}
          {twice && (
            <Notice tone="info">
              <span>The result still has %-escapes (such as %2520 becoming %20), so it was probably encoded twice. </span>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => setInput(result.text)}>
                Decode again
              </Button>
            </Notice>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              disabled={!result.text}
              onClick={() => {
                setInput(result.text);
                setMode(mode === "encode" ? "decode" : "encode");
              }}
            >
              <ArrowUpDown aria-hidden="true" /> Use as input
            </Button>
            <Button onClick={() => copy(result.text)} disabled={!result.text}>
              <Copy aria-hidden="true" /> Copy
            </Button>
          </div>
        </ToolSection>
      )}
    </div>
  );
}
