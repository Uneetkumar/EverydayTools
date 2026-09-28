"use client";

import React, { useState, useEffect, useCallback } from "react";
import ResultCard from "@/components/ResultCard";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { RefreshCw, Copy, Check, ShieldCheck, ShieldAlert, Sparkles } from "lucide-react";
import { markToolCompleted } from "@/lib/analytics";
import { toast } from "sonner";

/** Uniform random integer in [0, max) from the platform CSPRNG, without modulo bias. */
function secureRandomInt(max: number): number {
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  let x: number;
  do {
    crypto.getRandomValues(buf);
    x = buf[0];
  } while (x >= limit);
  return x % max;
}

export default function PasswordGenerator() {
  const [length, setLength] = usePersistentState<number>("pwd_length", 16);
  const [useUppercase, setUseUppercase] = usePersistentState<boolean>("pwd_upper", true);
  const [useLowercase, setUseLowercase] = usePersistentState<boolean>("pwd_lower", true);
  const [useNumbers, setUseNumbers] = usePersistentState<boolean>("pwd_num", true);
  const [useSymbols, setUseSymbols] = usePersistentState<boolean>("pwd_sym", true);
  const [excludeSimilar, setExcludeSimilar] = usePersistentState<boolean>("pwd_ex_sim", false);
  const [password, setPassword] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const sets = [
    useUppercase && (excludeSimilar ? "ABCDEFGHJKLMNPQRSTUVWXYZ" : "ABCDEFGHIJKLMNOPQRSTUVWXYZ"),
    useLowercase && (excludeSimilar ? "abcdefghijkmnopqrstuvwxyz" : "abcdefghijklmnopqrstuvwxyz"),
    useNumbers && (excludeSimilar ? "23456789" : "0123456789"),
    useSymbols && "!@#$%^&*()_+-=[]{}|;:,.<>?",
  ].filter(Boolean) as string[];
  const pool = sets.join("");

  const generatePassword = useCallback(() => {
    if (!pool) {
      setPassword("");
      return;
    }
    // One character from every chosen set, so ticking "numbers" always
    // yields a number; the rest from the full pool; then a shuffle so the
    // guaranteed characters are not always at the front.
    const chars = sets.map((set) => set[secureRandomInt(set.length)]);
    while (chars.length < length) chars.push(pool[secureRandomInt(pool.length)]);
    for (let i = chars.length - 1; i > 0; i--) {
      const j = secureRandomInt(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    setPassword(chars.slice(0, length).join(""));
    // sets is derived from the same flags listed below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length, useUppercase, useLowercase, useNumbers, useSymbols, excludeSimilar]);

  useEffect(() => {
    // Deferred so generating never happens synchronously inside the effect.
    const id = setTimeout(generatePassword, 0);
    return () => clearTimeout(id);
  }, [generatePassword]);

  // Strength from entropy: length × log2(size of the character pool). This
  // is what an attacker guessing at random has to search.
  const entropyBits = password && pool ? Math.round(password.length * Math.log2(new Set(pool).size)) : 0;
  const strength = Math.min(100, Math.round((entropyBits / 128) * 100));
  const strengthLabel =
    entropyBits >= 100 ? "Very strong" : entropyBits >= 70 ? "Strong" : entropyBits >= 50 ? "Moderate" : "Weak";
  const strengthColor =
    entropyBits >= 100
      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
      : entropyBits >= 70
      ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40"
      : "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40";

  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      markToolCompleted();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the password", { description: "Select it and copy it manually." });
    }
  };

  return (
    <div className="space-y-6">
      {/* Generated Password Output Box */}
      <div className="p-5 rounded-xl border text-slate-900 dark:text-white flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/30">
        <div className="font-mono text-lg sm:text-2xl font-semibold tracking-wide break-all text-slate-900 dark:text-slate-100" aria-live="polite">
          {password || "Select at least one character set"}
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <button aria-label="Generate new password"
            onClick={generatePassword}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition"
            title="Generate new password"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-lg text-xs transition bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Password</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Strength Indicator */}
      <div className="p-4 rounded-xl border space-y-2 bg-muted/30">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-slate-600 dark:text-slate-400">Password strength</span>
          <span className={`px-2 py-0.5 rounded-md ${strengthColor}`}>{strengthLabel} · ~{entropyBits} bits</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              entropyBits >= 100 ? "bg-emerald-500" : entropyBits >= 70 ? "bg-blue-500" : "bg-amber-500"
            }`}
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>

      {/* Customization Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-xl border bg-muted/30">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2 font-medium text-foreground">
              <span>Password Length</span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold">{length} characters</span>
            </div>
            <input aria-label="Password length"
              type="range"
              min={6}
              max={64}
              value={length}
              onChange={(e) => setLength(parseInt(e.target.value, 10))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {[12, 16, 20, 24, 32].map((len) => (
              <button
                key={len}
                onClick={() => setLength(len)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${
                  length === len
                    ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-800"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent"
                }`}
              >
                {len} Chars
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <label className="flex items-center space-x-2.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={useUppercase}
              onChange={(e) => setUseUppercase(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span>Include Uppercase Letters (A-Z)</span>
          </label>

          <label className="flex items-center space-x-2.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={useLowercase}
              onChange={(e) => setUseLowercase(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span>Include Lowercase Letters (a-z)</span>
          </label>

          <label className="flex items-center space-x-2.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={useNumbers}
              onChange={(e) => setUseNumbers(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span>Include Numbers (0-9)</span>
          </label>

          <label className="flex items-center space-x-2.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={useSymbols}
              onChange={(e) => setUseSymbols(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span>Include Special Symbols (!@#$%^&*)</span>
          </label>

          <label className="flex items-center space-x-2.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={excludeSimilar}
              onChange={(e) => setExcludeSimilar(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span>Exclude Similar Characters (i, l, 1, L, o, 0, O)</span>
          </label>
        </div>
      </div>
    </div>
  );
}
