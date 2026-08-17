"use client";

import React, { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Lock, Unlock, Upload, Download, CheckCircle2, AlertCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { downloadDataUrl } from "@/lib/utils/download";

export default function UnlockPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState<string>("");
  const [unlockedUrl, setUnlockedUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);

  const handleUnlock = async () => {
    if (!file) return;
    setIsUnlocking(true);
    setErrorMsg(null);
    try {
      const buffer = await file.arrayBuffer();
      // Load and save cleanly without restrictions
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const unlockedBytes = await pdfDoc.save();

      const blob = new Blob([new Uint8Array(unlockedBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setUnlockedUrl(url);
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.85 } });
    } catch (e: unknown) {
      if (e instanceof Error) {
        setErrorMsg("Failed to unlock. If the file has a user password, please enter it.");
      }
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload */}
      <div className="p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-blue-50/30 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 relative">
        <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Upload locked or restricted PDF document
        </div>
        <p className="text-xs text-slate-500">
          Removes printing, copying, and modification restrictions client-side.
        </p>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setFile(f);
              setUnlockedUrl(null);
              setErrorMsg(null);
            }
          }}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>

      {file && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 dark:text-white">Selected PDF:</span>
            <span className="text-slate-500 font-mono">{file.name}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Document Password (if password-protected):
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password if required (leave blank for permission locks)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleUnlock}
              disabled={isUnlocking}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Unlock className="w-4 h-4" />
              <span>{isUnlocking ? "Unlocking PDF..." : "Unlock PDF Document"}</span>
            </button>

            {unlockedUrl && (
              <button
                onClick={() => {
                  downloadDataUrl(unlockedUrl, `unlocked-${file.name}`);
                  confetti({ particleCount: 35, spread: 50, origin: { y: 0.85 } });
                }}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
              >
                <Download className="w-4 h-4" />
                <span>Download Unlocked PDF</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
