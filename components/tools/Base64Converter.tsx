"use client";

import React, { useState } from "react";
import { Copy, Check, ArrowRightLeft, Trash2 } from "lucide-react";
import { markToolCompleted } from "@/lib/analytics";

export default function Base64Converter() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState<string>("Hello, TabBench!");
  const [urlSafe, setUrlSafe] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Encode function supporting UTF-8
  const encodeBase64 = (str: string, isUrlSafe: boolean) => {
    try {
      const utf8Bytes = new TextEncoder().encode(str);
      let binary = "";
      for (let i = 0; i < utf8Bytes.length; i++) {
        binary += String.fromCharCode(utf8Bytes[i]);
      }
      let encoded = btoa(binary);
      if (isUrlSafe) {
        encoded = encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      }
      return encoded;
    } catch {
      return "";
    }
  };

  // Decode function supporting UTF-8 & URL-safe
  const decodeBase64 = (str: string) => {
    try {
      let base64 = str.trim().replace(/-/g, "+").replace(/_/g, "/");
      while (base64.length % 4) {
        base64 += "=";
      }
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error("Invalid Base64 encoded string.");
      }
      throw new Error("Decoding error.");
    }
  };

  let output = "";
  let currentError = null;

  if (input) {
    if (mode === "encode") {
      output = encodeBase64(input, urlSafe);
    } else {
      try {
        output = decodeBase64(input);
      } catch (e: unknown) {
        if (e instanceof Error) currentError = e.message;
      }
    }
  }

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      markToolCompleted();
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 border rounded-lg bg-muted/60">
        <div className="flex space-x-2">
          <button
            onClick={() => setMode("encode")}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
              mode === "encode"
                ? "bg-background text-foreground shadow-xs dark:bg-input/50"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Encode Text to Base64
          </button>
          <button
            onClick={() => setMode("decode")}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
              mode === "decode"
                ? "bg-background text-foreground shadow-xs dark:bg-input/50"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Decode Base64 to Text
          </button>
        </div>

        {mode === "encode" && (
          <label className="flex items-center space-x-2 text-sm pr-2 cursor-pointer font-medium text-foreground">
            <input
              type="checkbox"
              checked={urlSafe}
              onChange={(e) => setUrlSafe(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span>URL-Safe Base64</span>
          </label>
        )}
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium text-foreground">
            <span>{mode === "encode" ? "Plain Text (Input)" : "Base64 String (Input)"}</span>
            <button
              onClick={() => setInput("")}
              className="text-rose-500 hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          </div>
          <textarea aria-label="Text to encode or decode"
            rows={8}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === "encode"
                ? "Type or paste plain text to encode..."
                : "Paste Base64 encoded string to decode..."
            }
            className="w-full p-3.5 font-mono text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        {/* Output */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium text-foreground">
            <span>{mode === "encode" ? "Base64 Output" : "Decoded Plain Text"}</span>
            {output && (
              <button
                onClick={handleCopy}
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied!" : "Copy Result"}
              </button>
            )}
          </div>
          <div className="relative">
            <textarea aria-label="Result"
              rows={8}
              readOnly
              value={currentError || output}
              placeholder="Result will appear here..."
              className={`w-full p-3.5 font-mono text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ${
                currentError
                  ? "border-rose-300 text-rose-500 dark:border-rose-800 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  : "dark:text-emerald-400 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
