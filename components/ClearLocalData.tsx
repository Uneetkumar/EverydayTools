"use client";

import React, { useState } from "react";
import { Trash2, Check } from "lucide-react";
import { clearResults } from "@/lib/history/results";
import { clearRecent } from "@/lib/history/recent";

/**
 * One control that removes everything this site has written to the device.
 *
 * A privacy policy that describes local storage but offers no way to clear it
 * puts the burden on the reader to go digging through browser settings. This
 * is the actionable half of the disclosure.
 */
export default function ClearLocalData() {
  const [done, setDone] = useState(false);
  const [working, setWorking] = useState(false);

  const clearEverything = async () => {
    setWorking(true);
    try {
      await clearResults();
      clearRecent();
      // Tool preferences and per-tool histories all use the same prefix.
      try {
        const keys = Object.keys(localStorage).filter(
          (k) => k.startsWith("et_") || k.startsWith("qr_")
        );
        keys.forEach((k) => localStorage.removeItem(k));
      } catch {
        /* storage may be unavailable */
      }
      setDone(true);
      setTimeout(() => setDone(false), 4000);
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 not-prose">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        This removes every saved file, your recently-used list, and all tool
        preferences from this browser immediately.
      </p>
      <button
        onClick={clearEverything}
        disabled={working}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold transition"
      >
        {done ? <Check className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
        <span>{done ? "Everything cleared" : "Clear all local data"}</span>
      </button>
    </div>
  );
}
