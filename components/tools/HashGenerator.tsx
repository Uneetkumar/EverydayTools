"use client";

import React, { useState } from "react";
import CryptoJS from "crypto-js";
import { Copy, Check, Lock, RefreshCw } from "lucide-react";
import { markToolCompleted } from "@/lib/analytics";

export default function HashGenerator() {
  const [text, setText] = useState<string>("Hello, TabBench!");
  const [uppercase, setUppercase] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const md5Hash = text ? CryptoJS.MD5(text).toString() : "";
  const sha1Hash = text ? CryptoJS.SHA1(text).toString() : "";
  const sha256Hash = text ? CryptoJS.SHA256(text).toString() : "";
  const sha512Hash = text ? CryptoJS.SHA512(text).toString() : "";

  const hashes = [
    { name: "MD5", value: uppercase ? md5Hash.toUpperCase() : md5Hash, bits: 128 },
    { name: "SHA-1", value: uppercase ? sha1Hash.toUpperCase() : sha1Hash, bits: 160 },
    { name: "SHA-256", value: uppercase ? sha256Hash.toUpperCase() : sha256Hash, bits: 256 },
    { name: "SHA-512", value: uppercase ? sha512Hash.toUpperCase() : sha512Hash, bits: 512 },
  ];

  const handleCopy = async (val: string, name: string) => {
    if (!val) return;
    try {
      await navigator.clipboard.writeText(val);
      setCopiedKey(name);
      markToolCompleted();
      setTimeout(() => setCopiedKey(null), 1500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm font-medium text-foreground">
          <span>Input String to Hash</span>
          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
            />
            <span>UPPERCASE Hex</span>
          </label>
        </div>
        <textarea aria-label="Text to hash"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste text to compute cryptographic hashes..."
          className="w-full p-3.5 font-mono text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      {/* Hash Results List */}
      <div className="space-y-3">
        {hashes.map((h) => (
          <div
            key={h.name}
            className="p-4 rounded-xl border space-y-1.5 bg-muted/30"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                {h.name} ({h.bits}-bit)
              </span>
              <button
                onClick={() => handleCopy(h.value, h.name)}
                className="flex items-center space-x-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                {copiedKey === h.name ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === h.name ? "Copied!" : "Copy"}</span>
              </button>
            </div>
            <div className="p-2.5 rounded-xl bg-background font-mono text-xs break-all select-all text-foreground">
              {h.value || "// Enter string above to compute"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
