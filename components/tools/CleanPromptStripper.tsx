"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, Trash2, Eraser, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  ToolSection,
  Field,
  TextArea,
  ToggleRow,
  StatGrid,
  Stat,
  Chips,
  ActionBar,
  ToolDivider,
} from "@/components/tool/kit";
import { Button } from "@/components/ui/button";

const PRESETS = [
  {
    label: "Web Scrape with HTML",
    text: `<div class="article-body">
  <h1>Quarterly Financial Review</h1>
  <p>Please reach out to our chief accountant at <strong>sarah.connor@cyberdyne.io</strong> or call +1 (555) 019-2834 for wire transfers.</p>
  <!-- Internal server metadata -->
  <span class="meta" data-ip="192.168.10.45">Node ID: 8492</span>
  <p>AWS Access Key: AKIAIOSFODNN7EXAMPLE</p>
</div>`,
  },
  {
    label: "Code with Heavy Comments",
    text: `// ============================================
// Auth Handler Controller
// Author: Dev Team (internal@acme.com)
// ============================================

/*
 * Validates the incoming JWT bearer token
 * and checks redis cache for revoked sessions.
 */
export async function handleAuth(req: Request) {
  // Extract authorization header
  const authHeader = req.headers.get("authorization"); // Bearer token
  if (!authHeader) return new Response("Unauthorized", { status: 401 });

  // Connect to database
  const clientIp = "10.0.4.12"; // Server IP
  return { ok: true };
}`,
  },
  {
    label: "Markdown with PII & Links",
    text: `# Incident Post-Mortem Report

On **October 12, 2024**, our primary gateway cluster suffered degraded latency.
For questions, contact the on-call engineer at [john.doe@enterprise.com](mailto:john.doe@enterprise.com) or phone \`+44 20 7946 0958\`.

### Root Cause
A misconfigured firewall rule blocked incoming traffic from \`172.16.254.1\`.
Visa Card ending in \`4532 0150 9283 1092\` was mistakenly logged in debug headers.`,
  },
];

function cleanPrompt(
  input: string,
  options: {
    stripHtml: boolean;
    stripMarkdown: boolean;
    stripComments: boolean;
    stripEmptyLines: boolean;
    maskPii: boolean;
  }
): string {
  let text = input;

  // Markdown headings look exactly like "# comment" lines; when Markdown is
  // being stripped anyway, unwrap them first so the comment pass below keeps
  // their text.
  if (options.stripMarkdown) {
    text = text.replace(/^#{1,6}\s+/gm, "");
  }

  // 1. Strip Comments
  if (options.stripComments) {
    text = text
      .replace(/\/\*[\s\S]*?\*\//g, "") // Block comments /* */
      .replace(/<!--[\s\S]*?-->/g, "") // HTML comments <!-- -->
      .replace(/(?<!:)\/\/.*$/gm, "") // Line comments and inline // comments (preserving http://, https://)
      // Inline "# comment" needs a space after the #, so "issue #42" and
      // "color: #fff" survive.
      .replace(/(?<=\s)#\s.*$/gm, "")
      .replace(/^\s*#(?![#!]).*$/gm, ""); // Standalone script line comments # (not #! shebangs)
  }

  // 2. Strip HTML tags
  if (options.stripHtml) {
    text = text.replace(/<[^>]*>/g, " ");
  }

  // 3. Strip Markdown
  if (options.stripMarkdown) {
    text = text
      .replace(/^#{1,6}\s+/gm, "") // Headers
      .replace(/\*\*([^*\n]+)\*\*/g, "$1") // Bold **text**
      .replace(/(?<![\w*])\*([^*\n]+)\*(?![\w*])/g, "$1") // Italics *text*
      // Underscore emphasis only at word edges, so snake_case names such as
      // user_id_value are left alone.
      .replace(/(?<!\w)__([^_\n]+)__(?!\w)/g, "$1") // Bold __text__
      .replace(/(?<!\w)_([^_\n]+)_(?!\w)/g, "$1") // Italics _text_
      .replace(/`([^`]+)`/g, "$1") // Inline code `text`
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Links [text](url) -> text
      .replace(/^>\s+/gm, "") // Blockquotes
      .replace(/^[-*+]\s+/gm, ""); // Unordered list bullets
  }

  // 4. Mask PII
  if (options.maskPii) {
    // Emails
    text = text.replace(
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g,
      "[EMAIL_REDACTED]"
    );
    // Cards and IPs first: the looser phone pattern would otherwise claim
    // part of a 16-digit card number.
    // Credit card patterns
    text = text.replace(
      /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
      "[CARD_REDACTED]"
    );
    // IPv4 addresses
    text = text.replace(
      /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
      "[IP_REDACTED]"
    );
    // Phone numbers: international "+" numbers in groups (+44 20 7946 0958),
    // Indian mobiles (98765 43210, +91-9876543210), then North American
    // 10-digit numbers.
    text = text.replace(/\+\d{1,3}(?:[-.\s]?\(?\d{2,5}\)?){2,4}\b/g, "[PHONE_REDACTED]");
    text = text.replace(/(?<!\d)(?:0)?[6-9]\d{4}[-\s]?\d{5}\b/g, "[PHONE_REDACTED]");
    text = text.replace(
      /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
      "[PHONE_REDACTED]"
    );
    // AWS Key pattern
    text = text.replace(/\bAKIA[0-9A-Z]{16}\b/g, "[AWS_KEY_REDACTED]");
  }

  // 5. Strip excessive blank lines and trailing whitespace
  if (options.stripEmptyLines) {
    text = text
      .split("\n")
      .map((l) => l.trimEnd())
      .filter((line, idx, arr) => {
        if (!line.trim()) {
          // Keep at most 1 empty line in a row
          return idx === 0 || arr[idx - 1].trim() !== "";
        }
        return true;
      })
      .join("\n")
      .trim();
  }

  return text;
}

export default function CleanPromptStripper() {
  const [inputText, setInputText] = useState(PRESETS[0].text);
  const [stripHtml, setStripHtml] = useState(true);
  const [stripMarkdown, setStripMarkdown] = useState(false);
  const [stripComments, setStripComments] = useState(true);
  const [stripEmptyLines, setStripEmptyLines] = useState(true);
  const [maskPii, setMaskPii] = useState(true);
  const [copied, setCopied] = useState(false);

  const cleanedText = useMemo(() => {
    return cleanPrompt(inputText, {
      stripHtml,
      stripMarkdown,
      stripComments,
      stripEmptyLines,
      maskPii,
    });
  }, [inputText, stripHtml, stripMarkdown, stripComments, stripEmptyLines, maskPii]);

  const stats = useMemo(() => {
    const origChars = inputText.length;
    const cleanChars = cleanedText.length;
    const savedChars = Math.max(0, origChars - cleanChars);
    const savedTokens = Math.round(savedChars / 4);
    const reductionPercent = origChars > 0 ? ((savedChars / origChars) * 100).toFixed(1) : "0";

    return {
      origChars,
      cleanChars,
      savedChars,
      savedTokens,
      reductionPercent,
    };
  }, [inputText, cleanedText]);

  const copyResult = () => {
    navigator.clipboard.writeText(cleanedText);
    setCopied(true);
    toast.success("Cleaned prompt copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <ToolSection
        title="Prompt & Context Cleaner (PII Redaction & Markdown Stripper)"
        description="Optimize prompt payload sizes and prevent privacy leaks before sending context to LLMs, ChatGPT, or vector databases."
      >
        <Chips
          value={null}
          onChange={(val) => {
            const p = PRESETS.find((x) => x.label === val);
            if (p) setInputText(p.text);
          }}
          options={PRESETS.map((p) => ({ value: p.label, label: p.label }))}
          ariaLabel="Cleaner Presets"
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 rounded-lg border bg-card p-4">
          <ToggleRow
            id="strip-html"
            label="Strip HTML / XML Tags"
            description="Removes <div...> and markup"
            checked={stripHtml}
            onCheckedChange={setStripHtml}
          />
          <ToggleRow
            id="mask-pii"
            label="Mask PII & Secrets"
            description="Redacts emails, IPs, cards, and keys"
            checked={maskPii}
            onCheckedChange={setMaskPii}
          />
          <ToggleRow
            id="strip-comments"
            label="Strip Code Comments"
            description="Removes //, /* */, and <!-- -->"
            checked={stripComments}
            onCheckedChange={setStripComments}
          />
          <ToggleRow
            id="strip-markdown"
            label="Strip Markdown Syntax"
            description="Removes #, **, links, and bullets"
            checked={stripMarkdown}
            onCheckedChange={setStripMarkdown}
          />
          <ToggleRow
            id="strip-empty-lines"
            label="Collapse Blank Lines"
            description="Trims redundant spacing"
            checked={stripEmptyLines}
            onCheckedChange={setStripEmptyLines}
          />
        </div>
      </ToolSection>

      <ToolDivider />

      <ToolSection title="Savings & Efficiency">
        <StatGrid>
          <Stat
            label="Tokens Saved"
            value={`~${stats.savedTokens.toLocaleString()}`}
            tone="success"
            hint="Estimated LLM BPE tokens"
          />
          <Stat label="Size Reduction" value={`${stats.reductionPercent}%`} />
          <Stat label="Clean Characters" value={stats.cleanChars.toLocaleString()} />
          <Stat label="Original Characters" value={stats.origChars.toLocaleString()} />
        </StatGrid>
      </ToolSection>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Raw Input (Docs / Code / Scrapes)
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInputText("")}
              className="h-7 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3 mr-1" /> Clear
            </Button>
          </div>
          <TextArea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste raw text, HTML, or code here..."
            className="font-mono text-xs leading-relaxed min-h-80"
            aria-label="Raw Input Context"
          />
        </div>

        {/* Output */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Cleaned & Sanitized Context
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={copyResult}
              disabled={!cleanedText}
              className="h-7 text-xs"
            >
              {copied ? <Check className="size-3 text-success mr-1" /> : <Copy className="size-3 mr-1" />}
              Copy Clean Context
            </Button>
          </div>
          <TextArea
            value={cleanedText}
            readOnly
            placeholder="Cleaned prompt will appear here..."
            className="font-mono text-xs leading-relaxed min-h-80 bg-muted/30"
            aria-label="Cleaned Output Context"
          />
        </div>
      </div>
    </div>
  );
}
