"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, Upload, Trash2, Eye, Sun, Moon, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  ToolSection,
  Field,
  TextArea,
  Chips,
  Notice,
  ActionBar,
  ToolDivider,
} from "@/components/tool/kit";
import { Button } from "@/components/ui/button";

const PRESETS = [
  {
    label: "Star Icon",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f59e0b" width="48" height="48">
  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
</svg>`,
  },
  {
    label: "Checkmark Badge",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="48" height="48">
  <circle cx="12" cy="12" r="10" fill="#ecfdf5"/>
  <path d="m9 12 2 2 4-4"/>
</svg>`,
  },
  {
    label: "Heart Icon",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ef4444" width="48" height="48">
  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
</svg>`,
  },
];

function cleanSvg(raw: string): string {
  return raw
    .replace(/<\?xml.*?\?>/gi, "")
    .replace(/<!DOCTYPE.*?>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/>\s+</g, "><")
    .trim();
}

function svgToUtf8Uri(cleaned: string): string {
  // UTF-8 optimization: encode reserved characters
  const encoded = cleaned
    .replace(/"/g, "'")
    .replace(/%/g, "%25")
    .replace(/#/g, "%23")
    .replace(/{/g, "%7B")
    .replace(/}/g, "%7D")
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E")
    .replace(/\s+/g, " ");
  return `data:image/svg+xml,${encoded}`;
}

function svgToReactJsx(svg: string): string {
  if (!svg.trim()) return "";
  let jsx = svg
    .replace(/<\?xml.*?\?>/gi, "")
    .replace(/<!DOCTYPE.*?>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  const attrMap: Record<string, string> = {
    class: "className",
    "clip-path": "clipPath",
    "clip-rule": "clipRule",
    "fill-opacity": "fillOpacity",
    "fill-rule": "fillRule",
    "font-family": "fontFamily",
    "font-size": "fontSize",
    "font-weight": "fontWeight",
    "letter-spacing": "letterSpacing",
    "stroke-dasharray": "strokeDasharray",
    "stroke-dashoffset": "strokeDashoffset",
    "stroke-linecap": "strokeLinecap",
    "stroke-linejoin": "strokeLinejoin",
    "stroke-miterlimit": "strokeMiterlimit",
    "stroke-opacity": "strokeOpacity",
    "stroke-width": "strokeWidth",
    "stop-color": "stopColor",
    "stop-opacity": "stopOpacity",
    "xmlns:xlink": "xmlnsXlink",
    "xlink:href": "xlinkHref",
    tabindex: "tabIndex",
    crossorigin: "crossOrigin",
  };

  for (const [kebab, camel] of Object.entries(attrMap)) {
    const reg = new RegExp(`\\b${kebab}=`, "g");
    jsx = jsx.replace(reg, `${camel}=`);
  }

  // Handle inline style="..." to style={{...}}
  jsx = jsx.replace(/style="([^"]*)"/g, (_, styleStr: string) => {
    const entries = styleStr
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((rule) => {
        const [prop, ...valParts] = rule.split(":");
        const val = valParts.join(":").trim();
        const camelProp = prop.trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        return `${camelProp}: "${val}"`;
      });
    return `style={{ ${entries.join(", ")} }}`;
  });

  return jsx.trim();
}

export default function SvgToDataUri() {
  const [svgInput, setSvgInput] = useState(PRESETS[0].svg);
  const [darkCanvas, setDarkCanvas] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const cleaned = useMemo(() => cleanSvg(svgInput), [svgInput]);

  const utf8Uri = useMemo(() => {
    if (!cleaned) return "";
    return svgToUtf8Uri(cleaned);
  }, [cleaned]);

  const base64Uri = useMemo(() => {
    if (!cleaned) return "";
    try {
      const bytes = new TextEncoder().encode(cleaned);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const b64 = btoa(binary);
      return `data:image/svg+xml;base64,${b64}`;
    } catch {
      return "";
    }
  }, [cleaned]);

  const reactJsx = useMemo(() => {
    return svgToReactJsx(cleaned);
  }, [cleaned]);

  const cssBackground = useMemo(() => {
    return utf8Uri ? `background-image: url("${utf8Uri}");` : "";
  }, [utf8Uri]);

  const htmlImg = useMemo(() => {
    return utf8Uri ? `<img src="${utf8Uri}" alt="SVG Graphic" />` : "";
  }, [utf8Uri]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) setSvgInput(text);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      <ToolSection
        title="SVG to Data URI Encoder"
        description="Clean, minify, and encode raw SVG markup into modern UTF-8 and Base64 Data URIs for CSS and HTML."
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Chips
            value={null}
            onChange={(val) => {
              const p = PRESETS.find((x) => x.label === val);
              if (p) setSvgInput(p.svg);
            }}
            options={PRESETS.map((p) => ({ value: p.label, label: p.label }))}
            ariaLabel="SVG Presets"
          />

          <label className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1 text-xs font-medium cursor-pointer hover:bg-muted">
            <Upload className="size-3.5" /> Upload .svg
            <input type="file" accept=".svg,image/svg+xml" onChange={handleFileUpload} className="sr-only" />
          </label>
        </div>

        <Field label="Raw SVG Markup">
          <TextArea
            value={svgInput}
            onChange={(e) => setSvgInput(e.target.value)}
            className="font-mono text-xs leading-relaxed min-h-36"
            placeholder="<svg ...>...</svg>"
            aria-label="Raw SVG Input"
          />
        </Field>
      </ToolSection>

      <ToolDivider />

      {/* Live Preview Canvas */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Rendered Preview
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setDarkCanvas((d) => !d)}
            aria-label="Toggle dark preview canvas"
          >
            {darkCanvas ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          </Button>
        </div>

        <div
          className={`flex min-h-[160px] items-center justify-center rounded-xl border p-6 transition-colors ${
            darkCanvas ? "bg-zinc-950" : "bg-zinc-100 dark:bg-zinc-900"
          }`}
        >
          {utf8Uri ? (
            <img src={utf8Uri} alt="SVG Preview" className="max-h-32 max-w-full drop-shadow" />
          ) : (
            <span className="text-xs text-muted-foreground">No SVG to render</span>
          )}
        </div>
      </div>

      {/* Formats */}
      <ToolSection title="Encoded Outputs">
        <div className="space-y-3">
          {[
            {
              label: "React JSX Component",
              code: reactJsx,
              key: "jsx",
            },
            {
              label: "CSS background-image (Recommended)",
              code: cssBackground,
              key: "css",
            },
            {
              label: "UTF-8 Data URI (Compact & Readable)",
              code: utf8Uri,
              key: "utf8",
            },
            {
              label: "Base64 Data URI",
              code: base64Uri,
              key: "b64",
            },
            {
              label: "HTML <img> Tag",
              code: htmlImg,
              key: "html",
            },
          ].map((item) => (
            <div
              key={item.key}
              className="rounded-lg border bg-card p-3 shadow-soft space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(item.code, item.key)}
                  disabled={!item.code}
                  className="h-6 text-xs"
                >
                  {copiedKey === item.key ? (
                    <Check className="size-3 text-success mr-1" />
                  ) : (
                    <Copy className="size-3 mr-1" />
                  )}
                  Copy
                </Button>
              </div>
              <p className="font-mono text-xs text-foreground bg-muted/40 p-2 rounded break-all max-h-24 overflow-y-auto">
                {item.code || "N/A"}
              </p>
            </div>
          ))}
        </div>
      </ToolSection>
    </div>
  );
}
