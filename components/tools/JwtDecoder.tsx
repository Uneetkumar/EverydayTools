"use client";

import React, { useState, useEffect } from "react";
import { Key, AlertCircle, CheckCircle, Clock, Copy, Check } from "lucide-react";

const SAMPLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsZXggRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNzk5OTk5OTk5fQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

export default function JwtDecoder() {
  const [token, setToken] = useState<string>(SAMPLE_JWT);
  const [copied, setCopied] = useState(false);
  // Expiry depends on the current time, which is not a pure value: reading
  // Date.now() during render bakes the *build* time into the static HTML and
  // then disagrees with the browser at hydration. Gate it on mount so the
  // server and first client render always agree, then evaluate for real.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // Primed off the synchronous effect path so the initial read does not
    // trigger a cascading render during mount.
    const prime = setTimeout(() => setNow(Date.now()), 0);
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(prime);
      clearInterval(id);
    };
  }, []);

  let headerObj = null;
  let payloadObj = null;
  let errorMsg = null;
  let isExpired = false;
  let expiryDateStr = "";

  if (token.trim()) {
    const parts = token.trim().split(".");
    if (parts.length !== 3) {
      errorMsg = "Invalid JWT structure. A valid JWT must have 3 parts separated by dots.";
    } else {
      try {
        const decodeBase64Url = (str: string) => {
          let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
          while (base64.length % 4) base64 += "=";
          return JSON.parse(decodeURIComponent(escape(atob(base64))));
        };

        headerObj = decodeBase64Url(parts[0]);
        payloadObj = decodeBase64Url(parts[1]);

        if (payloadObj && payloadObj.exp) {
          const expTimeMs = payloadObj.exp * 1000;
          isExpired = now !== null && now > expTimeMs;
          expiryDateStr = new Date(expTimeMs).toUTCString();
        }
      } catch (err: unknown) {
        errorMsg = "Failed to parse JWT payload. Ensure strings are valid Base64 JSON.";
      }
    }
  }

  const handleCopy = async (data: object | null) => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input JWT */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span>Encoded JSON Web Token</span>
          <button
            onClick={() => setToken(SAMPLE_JWT)}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Load Sample Token
          </button>
        </div>
        <textarea
          rows={4}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste JWT here (e.g. eyJhbGciOi...)..."
          className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 break-all"
        />
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Expiry Badge */}
      {payloadObj && payloadObj.exp && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium ${
            isExpired
              ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300"
              : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Token Status: <strong>{isExpired ? "Expired" : "Active / Valid"}</strong></span>
          </div>
          <span className="font-mono text-[11px]">{expiryDateStr}</span>
        </div>
      )}

      {/* Decoded Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="text-rose-600 dark:text-rose-400">Header: Algorithm & Token Type</span>
            {headerObj && (
              <button
                onClick={() => handleCopy(headerObj)}
                className="text-slate-400 hover:text-slate-600 text-[11px] flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
            )}
          </div>
          <pre className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-rose-400 overflow-x-auto min-h-[160px]">
            {headerObj ? JSON.stringify(headerObj, null, 2) : "// Decoded header will appear here"}
          </pre>
        </div>

        {/* Payload */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="text-blue-600 dark:text-blue-400">Payload: Data Claims</span>
            {payloadObj && (
              <button
                onClick={() => handleCopy(payloadObj)}
                className="text-slate-400 hover:text-slate-600 text-[11px] flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
            )}
          </div>
          <pre className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-blue-400 overflow-x-auto min-h-[160px]">
            {payloadObj ? JSON.stringify(payloadObj, null, 2) : "// Decoded payload claims will appear here"}
          </pre>
        </div>
      </div>
    </div>
  );
}
