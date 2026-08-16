"use client";

import React, { useState, useEffect, useCallback } from "react";
import ResultCard from "@/components/ResultCard";
import { RefreshCw, Copy, Check, ShieldCheck, ShieldAlert, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

export default function PasswordGenerator() {
  const [length, setLength] = useState<number>(16);
  const [useUppercase, setUseUppercase] = useState<boolean>(true);
  const [useLowercase, setUseLowercase] = useState<boolean>(true);
  const [useNumbers, setUseNumbers] = useState<boolean>(true);
  const [useSymbols, setUseSymbols] = useState<boolean>(true);
  const [excludeSimilar, setExcludeSimilar] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const generatePassword = useCallback(() => {
    let chars = "";
    if (useUppercase) chars += excludeSimilar ? "ABCDEFGHJKLMNPQRSTUVWXYZ" : "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (useLowercase) chars += excludeSimilar ? "abcdefghijkmnopqrstuvwxyz" : "abcdefghijklmnopqrstuvwxyz";
    if (useNumbers) chars += excludeSimilar ? "23456789" : "0123456789";
    if (useSymbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";

    if (!chars) {
      setPassword("");
      return;
    }

    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
    setPassword(result);
  }, [length, useUppercase, useLowercase, useNumbers, useSymbols, excludeSimilar]);

  useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  // Calculate strength score (0 to 100)
  const getStrength = () => {
    let score = 0;
    if (password.length >= 12) score += 30;
    else if (password.length >= 8) score += 15;
    if (useUppercase && /[A-Z]/.test(password)) score += 20;
    if (useLowercase && /[a-z]/.test(password)) score += 15;
    if (useNumbers && /[0-9]/.test(password)) score += 15;
    if (useSymbols && /[^A-Za-z0-9]/.test(password)) score += 20;
    return Math.min(score, 100);
  };

  const strength = getStrength();
  const strengthLabel =
    strength >= 80 ? "Very Strong" : strength >= 60 ? "Strong" : strength >= 40 ? "Moderate" : "Weak";
  const strengthColor =
    strength >= 80
      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
      : strength >= 60
      ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40"
      : "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40";

  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.85 } });
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Generated Password Output Box */}
      <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-inner flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="font-mono text-lg sm:text-2xl font-bold tracking-wider break-all text-emerald-400">
          {password || "Select at least one character set"}
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={generatePassword}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            title="Generate new password"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
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
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-slate-600 dark:text-slate-400">Password Strength:</span>
          <span className={`px-2 py-0.5 rounded-md ${strengthColor}`}>{strengthLabel} ({strength}%)</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              strength >= 80 ? "bg-emerald-500" : strength >= 60 ? "bg-blue-500" : "bg-amber-500"
            }`}
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>

      {/* Customization Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <span>Password Length</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">{length} characters</span>
            </div>
            <input
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
