"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, Sparkles, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";

interface MatchDetail {
  match: string;
  index: number;
  groups: string[];
}

const CHEAT_SHEET = [
  { pattern: "\\d", desc: "Any digit (0-9)" },
  { pattern: "\\w", desc: "Word char (a-z, A-Z, 0-9, _)" },
  { pattern: "\\s", desc: "Whitespace (space, tab, newline)" },
  { pattern: "^ / $", desc: "Start / End of string" },
  { pattern: "[abc]", desc: "Any character in set" },
  { pattern: "[^abc]", desc: "Any character NOT in set" },
  { pattern: "a+", desc: "1 or more of a" },
  { pattern: "a*", desc: "0 or more of a" },
  { pattern: "a?", desc: "0 or 1 of a (optional)" },
  { pattern: "(abc)", desc: "Capture group" },
];

export default function RegexTester() {
  const [pattern, setPattern] = useState<string>("([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})");
  const [flags, setFlags] = useState<{ g: boolean; i: boolean; m: boolean; s: boolean; u: boolean }>({
    g: true,
    i: true,
    m: false,
    s: false,
    u: false,
  });
  const [testString, setTestString] = useState<string>(
    "Hello team! Reach out to alice@example.com or support@tabbench.com for any billing inquiries. You can also cc dev-team@company.co.uk."
  );
  const [copied, setCopied] = useState<boolean>(false);

  const activeFlagsStr = Object.entries(flags)
    .filter(([_, active]) => active)
    .map(([flag]) => flag)
    .join("");

  const { matches, error, highlightedHtml } = useMemo(() => {
    if (!pattern) {
      return { matches: [], error: null, highlightedHtml: testString };
    }

    try {
      const regex = new RegExp(pattern, activeFlagsStr);
      const matchesList: MatchDetail[] = [];

      if (flags.g) {
        let m: RegExpExecArray | null;
        let lastIdx = 0;
        // Prevent infinite loops on zero-length matches
        while ((m = regex.exec(testString)) !== null) {
          matchesList.push({
            match: m[0],
            index: m.index,
            groups: m.slice(1),
          });
          if (regex.lastIndex === lastIdx) {
            regex.lastIndex++;
          }
          lastIdx = regex.lastIndex;
          if (matchesList.length > 500) break; // safety threshold
        }
      } else {
        const m = regex.exec(testString);
        if (m) {
          matchesList.push({
            match: m[0],
            index: m.index,
            groups: m.slice(1),
          });
        }
      }

      // Generate safely highlighted HTML
      const escape = (s: string) =>
        s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      let html = "";
      let curr = 0;
      matchesList.forEach((m, idx) => {
        if (m.index > curr) {
          html += escape(testString.substring(curr, m.index));
        }
        html += `<mark class="bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 rounded px-1 font-semibold" title="Match #${idx + 1}">${escape(m.match)}</mark>`;
        curr = m.index + m.match.length;
      });
      if (curr < testString.length) {
        html += escape(testString.substring(curr));
      }

      return { matches: matchesList, error: null, highlightedHtml: html };
    } catch (e) {
      return { matches: [], error: (e as Error).message, highlightedHtml: testString };
    }
  }, [pattern, activeFlagsStr, testString, flags.g]);

  const toggleFlag = (f: "g" | "i" | "m" | "s" | "u") => {
    setFlags((prev) => ({ ...prev, [f]: !prev[f] }));
  };

  return (
    <div className="space-y-6">
      {/* Pattern Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Regular Expression
          </label>
          {/* Flags toggles */}
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            {(["g", "i", "m", "s", "u"] as const).map((flagKey) => (
              <button
                key={flagKey}
                onClick={() => toggleFlag(flagKey)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  flags[flagKey]
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title={`Flag /${flagKey}/ - ${flagKey === "g" ? "Global" : flagKey === "i" ? "Case Insensitive" : flagKey === "m" ? "Multiline" : flagKey === "s" ? "DotAll" : "Unicode"}`}
              >
                {flagKey}
              </button>
            ))}
          </div>
        </div>

        {/* Pattern Input Container */}
        <div className="relative flex items-center">
          <span className="absolute left-3.5 font-mono text-slate-400 text-sm font-bold select-none">
            /
          </span>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
            className="w-full pl-7 pr-12 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <span className="absolute right-3.5 font-mono text-blue-600 dark:text-blue-400 text-sm font-bold select-none">
            /{activeFlagsStr}
          </span>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs font-medium text-rose-600 dark:text-rose-400 pt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Regex Error: {error}</span>
          </div>
        )}
      </div>

      {/* Editor & Highlight Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Test String Input */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>Test String</span>
            <span className="text-slate-400 font-mono text-[11px]">{testString.length} chars</span>
          </div>
          <textarea
            rows={8}
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            placeholder="Enter text to match against regex..."
            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y"
          />
        </div>

        {/* Live Match Highlighting */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
              Live Highlighted Matches ({matches.length})
            </span>
          </div>
          <div
            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 font-mono text-xs text-slate-900 dark:text-white min-h-[190px] overflow-auto whitespace-pre-wrap leading-relaxed"
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        </div>
      </div>

      {/* Match Breakdown & Cheat Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Match Groups List */}
        <div className="lg:col-span-7 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Match Details & Capture Groups
          </h3>
          {matches.length === 0 ? (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-500 italic text-center">
              No matches found with current pattern and flags.
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {matches.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                      Match #{idx + 1} (Index: {m.index})
                    </span>
                    <span className="font-mono text-slate-500 text-[11px] font-medium">
                      Length: {m.match.length}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs font-medium text-slate-900 dark:text-white break-all">
                    {m.match}
                  </div>
                  {m.groups.length > 0 && (
                    <div className="pl-2 border-l-2 border-blue-500/40 space-y-1 pt-1">
                      {m.groups.map((g, gIdx) => (
                        <div key={gIdx} className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                          <span className="text-slate-400 font-semibold">Group ${gIdx + 1}:</span> {g}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Reference Cheat Sheet */}
        <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
            <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Quick Regex Reference
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {CHEAT_SHEET.map((item, i) => (
              <div
                key={i}
                className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
              >
                <code className="font-bold text-blue-600 dark:text-blue-400 font-mono">{item.pattern}</code>
                <span className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
