"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, AlertTriangle, Volume2 } from "lucide-react";

/**
 * Text to speech via the browser's built-in SpeechSynthesis.
 *
 * Voices come from the operating system, so nothing is sent anywhere and this
 * genuinely keeps the site's client-side promise. The trade-off is that the
 * available voices differ per device — a visitor on Windows and one on a Mac
 * will see completely different lists.
 */
export default function TextToSpeech() {
  const [text, setText] = useState(
    "Type or paste any text here and press play to hear it read aloud."
  );
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [supported, setSupported] = useState(true);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      const missing = setTimeout(() => setSupported(false), 0);
      return () => clearTimeout(missing);
    }
    // Voices load asynchronously in most browsers, and the first call often
    // returns an empty array — hence the voiceschanged listener.
    const load = () => {
      const list = window.speechSynthesis.getVoices();
      if (list.length) {
        setVoices(list);
        setVoiceName((current) => current || list.find((v) => v.default)?.name || list[0].name);
      }
    };
    const prime = setTimeout(load, 0);
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      clearTimeout(prime);
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = () => {
    if (!text.trim()) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const voice = voices.find((v) => v.name === voiceName);
    if (voice) utter.voice = voice;
    utter.rate = rate;
    utter.pitch = pitch;
    utter.onend = () => {
      setSpeaking(false);
      setPaused(false);
    };
    utter.onerror = () => {
      setSpeaking(false);
      setPaused(false);
    };
    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
    setSpeaking(true);
    setPaused(false);
  };

  const togglePause = () => {
    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    } else {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  };

  if (!supported) {
    return (
      <div className="flex gap-2.5 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 dark:text-amber-200">
          This browser does not support speech synthesis. Chrome, Edge, Safari,
          and Firefox all do on desktop.
        </p>
      </div>
    );
  }

  const words = text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="tts-text" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Text to read aloud
        </label>
        <textarea
          id="tts-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={7}
          className="w-full resize-y rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 text-sm leading-relaxed text-slate-900 dark:text-slate-100 outline-none focus:border-blue-400"
        />
        <p className="text-[11px] text-slate-400 tabular-nums">
          {words} word{words === 1 ? "" : "s"} · about {Math.max(1, Math.round(words / (150 * rate)))} min to read aloud
        </p>
      </div>

      <div className="grid grid-cols-1 @md:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="tts-voice" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Voice
          </label>
          <select
            id="tts-voice"
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
            className="w-full cursor-pointer rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
          >
            {voices.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="tts-rate" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Speed <span className="font-normal text-slate-400">{rate.toFixed(1)}x</span>
          </label>
          <input id="tts-rate" type="range" min={0.5} max={2} step={0.1} value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer" />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="tts-pitch" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Pitch <span className="font-normal text-slate-400">{pitch.toFixed(1)}</span>
          </label>
          <input id="tts-pitch" type="range" min={0.5} max={2} step={0.1} value={pitch}
            onChange={(e) => setPitch(parseFloat(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={speak} disabled={!text.trim()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition cursor-pointer">
          <Play className="w-4 h-4" />
          {speaking ? "Restart" : "Play"}
        </button>
        {speaking && (
          <>
            <button onClick={togglePause}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer">
              {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {paused ? "Resume" : "Pause"}
            </button>
            <button onClick={stop}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer">
              <Square className="w-4 h-4" />
              Stop
            </button>
          </>
        )}
      </div>

      <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
        <Volume2 className="w-3 h-3 mt-0.5 shrink-0" />
        <span>
          Voices come from your own device, so your text is never sent anywhere.
          The list of available voices differs by operating system and browser —
          if you see only one or two, install more in your system settings.
        </span>
      </p>
    </div>
  );
}
