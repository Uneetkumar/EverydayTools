"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import {
  Timer,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Flag,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Sparkles,
  Download,
  Copy,
  Check,
  Bell,
  Trash2,
} from "lucide-react";
import confetti from "canvas-confetti";

interface LapItem {
  id: number;
  overallMs: number;
  lapMs: number;
}

export default function StopwatchTimer() {
  const [tab, setTab] = usePersistentState<"stopwatch" | "timer">("st_tab", "stopwatch");
  const [soundEnabled, setSoundEnabled] = usePersistentState<boolean>("st_sound", true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // STOPWATCH STATE
  const [swTimeMs, setSwTimeMs] = useState<number>(0);
  const [swRunning, setSwRunning] = useState<boolean>(false);
  const [laps, setLaps] = useState<LapItem[]>([]);
  const [copiedLaps, setCopiedLaps] = useState<boolean>(false);
  const swTimerRef = useRef<number | null>(null);
  const swStartTimeRef = useRef<number>(0);

  // COUNTDOWN TIMER STATE
  const [timerDurationSec, setTimerDurationSec] = usePersistentState<number>("st_timer_dur", 300); // default 5m
  const [timerRemainingSec, setTimerRemainingSec] = useState<number>(300);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timerFinished, setTimerFinished] = useState<boolean>(false);
  const timerIntervalRef = useRef<number | null>(null);

  // Audio Context for synthesized chime
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playChime = useCallback(() => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      // Triple bell melodic chime
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const start = ctx.currentTime + idx * 0.16;
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);

        osc.start(start);
        osc.stop(start + 0.6);
      });
    } catch {
      // Audio not permitted
    }
  }, [soundEnabled]);

  // Stopwatch Loop
  useEffect(() => {
    if (swRunning) {
      swStartTimeRef.current = Date.now() - swTimeMs;
      swTimerRef.current = window.setInterval(() => {
        setSwTimeMs(Date.now() - swStartTimeRef.current);
      }, 10);
    } else if (swTimerRef.current) {
      clearInterval(swTimerRef.current);
    }
    return () => {
      if (swTimerRef.current) clearInterval(swTimerRef.current);
    };
  }, [swRunning]);

  // Timer Loop
  useEffect(() => {
    if (timerRunning && timerRemainingSec > 0) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimerRemainingSec((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            setTimerRunning(false);
            setTimerFinished(true);
            playChime();
            confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerRunning, playChime]);

  // Format Stopwatch Milliseconds
  const formatSwTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);

    const pad = (n: number) => String(n).padStart(2, "0");

    return {
      hours: pad(hours),
      minutes: pad(minutes),
      seconds: pad(seconds),
      centiseconds: pad(centiseconds),
    };
  };

  // Stopwatch Lap Action
  const handleLap = () => {
    const prevOverall = laps[0]?.overallMs || 0;
    const lapMs = swTimeMs - prevOverall;
    const newLap: LapItem = {
      id: laps.length + 1,
      overallMs: swTimeMs,
      lapMs: lapMs,
    };
    setLaps([newLap, ...laps]);
  };

  // Reset Stopwatch
  const handleResetStopwatch = () => {
    setSwRunning(false);
    setSwTimeMs(0);
    setLaps([]);
  };

  // Copy Laps
  const handleCopyLaps = () => {
    if (laps.length === 0) return;
    const text = laps
      .map((l) => {
        const lapT = formatSwTime(l.lapMs);
        const ovT = formatSwTime(l.overallMs);
        return `Lap ${l.id}: ${lapT.minutes}:${lapT.seconds}.${lapT.centiseconds} (Total: ${ovT.minutes}:${ovT.seconds}.${ovT.centiseconds})`;
      })
      .join("\n");

    navigator.clipboard.writeText(text);
    setCopiedLaps(true);
    setTimeout(() => setCopiedLaps(false), 2000);
  };

  // Timer Handlers
  const handleSetTimerPreset = (seconds: number) => {
    setTimerRunning(false);
    setTimerFinished(false);
    setTimerDurationSec(seconds);
    setTimerRemainingSec(seconds);
  };

  const handleResetTimer = () => {
    setTimerRunning(false);
    setTimerFinished(false);
    setTimerRemainingSec(timerDurationSec);
  };

  // Fastest & Slowest Lap Indices
  const fastestLapId = laps.length > 1 ? laps.reduce((prev, curr) => (curr.lapMs < prev.lapMs ? curr : prev)).id : null;
  const slowestLapId = laps.length > 1 ? laps.reduce((prev, curr) => (curr.lapMs > prev.lapMs ? curr : prev)).id : null;

  const swFormatted = formatSwTime(swTimeMs);

  // Timer Progress
  const timerPercent = timerDurationSec > 0 ? (timerRemainingSec / timerDurationSec) * 100 : 0;
  const timerMins = Math.floor(timerRemainingSec / 60);
  const timerSecs = timerRemainingSec % 60;

  return (
    <div className={`space-y-6 max-w-4xl mx-auto ${isFullscreen ? "fixed inset-0 z-50 bg-slate-900 p-8 flex flex-col justify-center max-w-none" : ""}`}>
      {/* Header Tabs & Sound Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTab("stopwatch")}
            className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl transition ${
              tab === "stopwatch"
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Digital Stopwatch</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("timer")}
            className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl transition ${
              tab === "timer"
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>Countdown Timer</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            title={soundEnabled ? "Audio Alarm Chime ON" : "Audio Chime Muted"}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-blue-600" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Presentation Mode"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* STOPWATCH TAB */}
      {tab === "stopwatch" && (
        <div className="space-y-6">
          <div className="p-8 sm:p-12 rounded-[32px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-radial from-blue-500/5 via-transparent to-transparent pointer-events-none" />

            {/* Stopwatch Large Digits */}
            <div className="font-mono font-bold tracking-tight text-slate-900 dark:text-white select-none">
              <span className="text-5xl sm:text-7xl lg:text-8xl">
                {swFormatted.minutes}:{swFormatted.seconds}
              </span>
              <span className="text-3xl sm:text-4xl lg:text-5xl text-blue-600 dark:text-blue-400 ml-2">
                .{swFormatted.centiseconds}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4 mt-8">
              {!swRunning ? (
                <button
                  type="button"
                  onClick={() => setSwRunning(true)}
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-600/30 active:scale-95 transition"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Start</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSwRunning(false)}
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-base shadow-lg shadow-amber-500/30 active:scale-95 transition"
                >
                  <Pause className="w-5 h-5 fill-current" />
                  <span>Pause</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleLap}
                disabled={!swRunning}
                className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-base border border-slate-200 dark:border-slate-700 disabled:opacity-40 transition active:scale-95"
              >
                <Flag className="w-4 h-4" />
                <span>Lap</span>
              </button>

              <button
                type="button"
                onClick={handleResetStopwatch}
                disabled={swTimeMs === 0 && laps.length === 0}
                className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-base border border-slate-200 dark:border-slate-700 disabled:opacity-40 transition active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Laps List Table */}
          {laps.length > 0 && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Recorded Laps ({laps.length})
                </h3>
                <button
                  type="button"
                  onClick={handleCopyLaps}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  {copiedLaps ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLaps ? "Copied Laps!" : "Copy Laps"}</span>
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-xs">
                {laps.map((lap) => {
                  const lapT = formatSwTime(lap.lapMs);
                  const ovT = formatSwTime(lap.overallMs);
                  const isFastest = lap.id === fastestLapId;
                  const isSlowest = lap.id === slowestLapId;

                  return (
                    <div
                      key={lap.id}
                      className="py-3 px-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-400 w-12">Lap {lap.id}</span>
                        {isFastest && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                            Fastest
                          </span>
                        )}
                        {isSlowest && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                            Slowest
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-6">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          +{lapT.minutes}:{lapT.seconds}.{lapT.centiseconds}
                        </span>
                        <span className="text-slate-400 text-[11px] w-24 text-right">
                          {ovT.minutes}:{ovT.seconds}.{ovT.centiseconds}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* COUNTDOWN TIMER TAB */}
      {tab === "timer" && (
        <div className="space-y-6">
          <div className="p-8 sm:p-12 rounded-[32px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center relative overflow-hidden">
            {/* Circular Progress Display */}
            <div className="flex flex-col items-center justify-center my-4">
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    className="stroke-slate-100 dark:stroke-slate-800"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    className={`transition-all duration-500 ${timerFinished ? "stroke-emerald-500" : "stroke-blue-600"}`}
                    strokeWidth="6"
                    strokeDasharray={276.46}
                    strokeDashoffset={276.46 * (1 - timerPercent / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center select-none font-mono">
                  {timerFinished ? (
                    <div className="flex flex-col items-center animate-bounce text-emerald-500">
                      <Bell className="w-8 h-8 mb-1" />
                      <span className="text-xl font-bold font-sans">Time&apos;s Up!</span>
                    </div>
                  ) : (
                    <div className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white">
                      {String(timerMins).padStart(2, "0")}:{String(timerSecs).padStart(2, "0")}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Timer Actions */}
            <div className="flex items-center justify-center gap-4 mt-6">
              {!timerRunning ? (
                <button
                  type="button"
                  onClick={() => {
                    if (timerFinished || timerRemainingSec === 0) {
                      setTimerRemainingSec(timerDurationSec);
                      setTimerFinished(false);
                    }
                    setTimerRunning(true);
                  }}
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-600/30 active:scale-95 transition"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Start</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setTimerRunning(false)}
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-base shadow-lg shadow-amber-500/30 active:scale-95 transition"
                >
                  <Pause className="w-5 h-5 fill-current" />
                  <span>Pause</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleResetTimer}
                className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-base border border-slate-200 dark:border-slate-700 transition active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            </div>

            {/* Quick Timer Presets */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                Quick Presets
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {[
                  { label: "1 min", sec: 60 },
                  { label: "3 min", sec: 180 },
                  { label: "5 min", sec: 300 },
                  { label: "10 min", sec: 600 },
                  { label: "15 min", sec: 900 },
                  { label: "25 min (Pomodoro)", sec: 1500 },
                  { label: "45 min (Focus)", sec: 2700 },
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleSetTimerPreset(p.sec)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                      timerDurationSec === p.sec
                        ? "bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-600 dark:text-blue-400"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
