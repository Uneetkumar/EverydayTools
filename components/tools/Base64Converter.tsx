"use client";

import React, { useState } from "react";
import { Copy, Check, ArrowRightLeft, Trash2 } from "lucide-react";
import confetti from "canvas-confetti";

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
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.85 } });
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <div className="flex space-x-2">
          <button
            onClick={() => setMode("encode")}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
              mode === "encode"
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Encode Text to Base64
          </button>
          <button
            onClick={() => setMode("decode")}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
              mode === "decode"
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Decode Base64 to Text
          </button>
        </div>

        {mode === "encode" && (
          <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 dark:text-slate-300 pr-2 cursor-pointer">
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
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>{mode === "encode" ? "Plain Text (Input)" : "Base64 String (Input)"}</span>
            <button
              onClick={() => setInput("")}
              className="text-rose-500 hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          </div>
          <textarea
            rows={8}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === "encode"
                ? "Type or paste plain text to encode..."
                : "Paste Base64 encoded string to decode..."
            }
            className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Output */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
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
            <textarea
              rows={8}
              readOnly
              value={currentError || output}
              placeholder="Result will appear here..."
              className={`w-full p-3.5 rounded-2xl border bg-slate-50 dark:bg-slate-950 text-xs font-mono focus:outline-none ${
                currentError
                  ? "border-rose-300 text-rose-500 dark:border-rose-800"
                  : "border-slate-200 dark:border-slate-800 text-slate-900 dark:text-emerald-400"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
