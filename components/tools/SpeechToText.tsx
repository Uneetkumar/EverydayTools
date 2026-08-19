"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Copy, Check, Trash2, Download, AlertTriangle } from "lucide-react";
import { downloadText } from "@/lib/utils/download";

/**
 * Voice to text via the Web Speech API.
 *
 * ⚠️ PRIVACY: unlike almost every other tool here, this is NOT purely local.
 * Chrome and Edge stream the captured audio to a cloud service for recognition;
 * only Safari does it on-device. That is a property of the browser API, not
 * something this site can change, so the tool says so plainly rather than
 * carrying the site's usual client-side claim.
 */

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [i: number]: { isFinal: boolean; 0: { transcript: string } };
  };
}

const LANGUAGES = [
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "en-IN", label: "English (India)" },
  { code: "hi-IN", label: "Hindi" },
  { code: "bn-IN", label: "Bengali" },
  { code: "ta-IN", label: "Tamil" },
  { code: "te-IN", label: "Telugu" },
  { code: "mr-IN", label: "Marathi" },
  { code: "gu-IN", label: "Gujarati" },
  { code: "es-ES", label: "Spanish" },
  { code: "fr-FR", label: "French" },
  { code: "de-DE", label: "German" },
  { code: "ar-SA", label: "Arabic" },
  { code: "ja-JP", label: "Japanese" },
];

export default function SpeechToText() {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [lang, setLang] = useState("en-US");
  const [finalText, setFinalText] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const recogRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const id = setTimeout(() => {
      if (!w.SpeechRecognition && !w.webkitSpeechRecognition) setSupported(false);
    }, 0);
    return () => {
      clearTimeout(id);
      recogRef.current?.stop();
    };
  }, []);

  const start = () => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;

    setError(null);
    const recog = new Ctor();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = lang;

    recog.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          setFinalText((prev) => (prev ? `${prev} ${chunk.trim()}` : chunk.trim()));
        } else {
          live += chunk;
        }
      }
      setInterim(live);
    };
    recog.onerror = (e) => {
      setError(
        e.error === "not-allowed"
          ? "Microphone permission was denied. Allow it in your browser's address bar and try again."
          : e.error === "no-speech"
          ? "No speech detected. Check that the right microphone is selected."
          : `Recognition error: ${e.error}`
      );
      setListening(false);
    };
    recog.onend = () => {
      setListening(false);
      setInterim("");
    };

    recogRef.current = recog;
    recog.start();
    setListening(true);
  };

  const stop = () => {
    recogRef.current?.stop();
    setListening(false);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(finalText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (!supported) {
    return (
      <div className="flex gap-2.5 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">
          This browser does not support speech recognition. It works in Chrome,
          Edge, and Safari; Firefox does not implement it.
        </p>
      </div>
    );
  }

  const words = finalText.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <label htmlFor="stt-lang" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Language
          </label>
          <select
            id="stt-lang"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            disabled={listening}
            className="cursor-pointer rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white disabled:opacity-50"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>

        {listening ? (
          <button onClick={stop}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition cursor-pointer">
            <Square className="w-4 h-4" />
            Stop listening
          </button>
        ) : (
          <button onClick={start}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition cursor-pointer">
            <Mic className="w-4 h-4" />
            Start listening
          </button>
        )}

        {listening && (
          <span className="flex items-center gap-2 text-xs font-medium text-red-600 dark:text-red-400">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
            </span>
            Listening…
          </span>
        )}
      </div>

      {error && (
        <div className="flex gap-2.5 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-200">{error}</p>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="stt-out" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Transcript
        </label>
        <textarea
          id="stt-out"
          value={finalText + (interim ? (finalText ? " " : "") + interim : "")}
          onChange={(e) => {
            setFinalText(e.target.value);
            setInterim("");
          }}
          rows={9}
          placeholder="Press Start listening and speak. Words appear here as you talk, and you can edit them afterwards."
          className="w-full resize-y rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 text-sm leading-relaxed text-slate-900 dark:text-slate-100 outline-none focus:border-blue-400"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400 tabular-nums">
            {words} word{words === 1 ? "" : "s"} · {finalText.length} characters
          </span>
          <div className="flex gap-2">
            <button onClick={copy} disabled={!finalText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition cursor-pointer">
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button onClick={() => downloadText(finalText, "transcript.txt")} disabled={!finalText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition cursor-pointer">
              <Download className="w-3 h-3" />
              .txt
            </button>
            <button onClick={() => { setFinalText(""); setInterim(""); }} disabled={!finalText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px] font-semibold hover:text-red-500 disabled:opacity-40 transition cursor-pointer">
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2.5 p-4 rounded-xl bg-sky-50 dark:bg-sky-950/25 border border-sky-200 dark:border-sky-900/40">
        <AlertTriangle className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed text-sky-900 dark:text-sky-200">
          <strong>This tool is not fully private.</strong> Chrome and Edge send
          your audio to a cloud speech service to transcribe it; only Safari
          does the recognition on-device. That is how the browser&rsquo;s speech
          API works and is outside this site&rsquo;s control. Avoid dictating
          confidential material, and use Safari if on-device processing matters.
        </p>
      </div>
    </div>
  );
}
