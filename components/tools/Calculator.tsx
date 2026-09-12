"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import {
  Calculator as CalcIcon,
  Volume2,
  VolumeX,
  History,
  RotateCcw,
  Copy,
  Check,
  Printer,
  Trash2,
  Sliders,
  Sparkles,
  ArrowRight,
  Sun,
  X,
  Share2,
} from "lucide-react";
import confetti from "canvas-confetti";

interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: string;
}

export default function Calculator() {
  // Calculator Core State
  const [display, setDisplay] = useState<string>("0");
  const [expression, setExpression] = useState<string>("");
  const [isNewNumber, setIsNewNumber] = useState<boolean>(true);
  const [memory, setMemory] = usePersistentState<number>("calc_mem", 0);
  const [history, setHistory] = usePersistentState<HistoryItem[]>("calc_history", [
    {
      id: "demo-1",
      expression: "250 × 1.18",
      result: "295",
      timestamp: "Today",
    },
    {
      id: "demo-2",
      expression: "1,200 ÷ 12",
      result: "100",
      timestamp: "Today",
    },
  ]);

  // Mode and Features
  const [mode, setMode] = usePersistentState<"standard" | "scientific">("calc_mode", "standard");
  const [angleUnit, setAngleUnit] = usePersistentState<"DEG" | "RAD">("calc_angle", "DEG");
  const [soundEnabled, setSoundEnabled] = usePersistentState<boolean>("calc_sound", true);
  const [isSecondFunc, setIsSecondFunc] = useState<boolean>(false);
  const [isTapeOpen, setIsTapeOpen] = useState<boolean>(false);
  const [copiedResult, setCopiedResult] = useState<boolean>(false);
  const [lastKeyPressed, setLastKeyPressed] = useState<string | null>(null);

  // Audio Context Ref for synthesized realistic key click sounds
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playKeySound = useCallback(
    (type: "num" | "op" | "eq" | "clear" = "num") => {
      if (!soundEnabled || typeof window === "undefined") return;

      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContextClass();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") {
          ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;
        if (type === "eq") {
          osc.type = "sine";
          osc.frequency.setValueAtTime(587.33, now); // D5
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc.start(now);
          osc.stop(now + 0.12);
        } else if (type === "clear") {
          osc.type = "triangle";
          osc.frequency.setValueAtTime(260, now);
          osc.frequency.exponentialRampToValueAtTime(140, now + 0.06);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
          osc.start(now);
          osc.stop(now + 0.07);
        } else if (type === "op") {
          osc.type = "triangle";
          osc.frequency.setValueAtTime(440, now);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
          osc.start(now);
          osc.stop(now + 0.04);
        } else {
          // Standard tactile plastic snap
          osc.type = "sine";
          osc.frequency.setValueAtTime(320 + Math.random() * 40, now);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
          osc.start(now);
          osc.stop(now + 0.035);
        }
      } catch {
        // AudioContext not allowed or unsupported
      }

      // Mobile haptic vibration feedback
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(type === "eq" ? [12, 40, 15] : 8);
      }
    },
    [soundEnabled]
  );

  const triggerVisualKey = (keyId: string) => {
    setLastKeyPressed(keyId);
    setTimeout(() => setLastKeyPressed(null), 140);
  };

  // Helper formatting numbers with commas
  const formatDisplay = (val: string): string => {
    if (val === "Error" || val === "Infinity" || val === "-Infinity" || val === "NaN") {
      return val;
    }
    if (val.includes("e")) return val;

    const parts = val.split(".");
    const integerPart = parts[0];
    const decimalPart = parts[1] !== undefined ? `.${parts[1]}` : "";

    const isNegative = integerPart.startsWith("-");
    const absInt = isNegative ? integerPart.slice(1) : integerPart;

    const formattedInt = absInt.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${isNegative ? "-" : ""}${formattedInt}${decimalPart}`;
  };

  // Input Digits
  const handleDigit = (digit: string) => {
    playKeySound("num");
    triggerVisualKey(digit);

    if (display === "Error" || display === "NaN" || display === "Infinity") {
      setDisplay(digit);
      setIsNewNumber(false);
      return;
    }

    if (isNewNumber) {
      setDisplay(digit);
      setIsNewNumber(false);
    } else {
      if (display.replace(/[^\d]/g, "").length >= 16) return; // Prevent excessive overflow
      setDisplay(display === "0" ? digit : display + digit);
    }
  };

  // Decimal
  const handleDecimal = () => {
    playKeySound("num");
    triggerVisualKey(".");

    if (isNewNumber) {
      setDisplay("0.");
      setIsNewNumber(false);
    } else if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  // Operators (+, -, *, /)
  const handleOperator = (op: string, displayOp: string) => {
    playKeySound("op");
    triggerVisualKey(op);

    if (display === "Error") return;

    const currentNum = parseFloat(display);
    if (isNaN(currentNum)) return;

    setExpression(`${expression} ${display} ${displayOp}`.trim());
    setIsNewNumber(true);
  };

  // Calculate Result
  const handleEquals = () => {
    playKeySound("eq");
    triggerVisualKey("=");

    if (!expression && isNewNumber) return;

    const fullExpr = `${expression} ${display}`.trim();
    if (!fullExpr) return;

    try {
      // Clean display operators into JS Math expression
      let sanitized = fullExpr
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/−/g, "-")
        .replace(/\^/g, "**");

      // Balance open parentheses
      const openParen = (sanitized.match(/\(/g) || []).length;
      const closeParen = (sanitized.match(/\)/g) || []).length;
      if (openParen > closeParen) {
        sanitized += ")".repeat(openParen - closeParen);
      }

      // Safe evaluation of mathematical expression only
      if (/[^0-9+\-*/().\s*%^]/.test(sanitized)) {
        throw new Error("Invalid characters");
      }

      // Evaluate safely
      const fn = new Function(`return (${sanitized})`);
      const rawRes = fn();

      if (typeof rawRes !== "number" || isNaN(rawRes)) {
        setDisplay("Error");
        setExpression("");
        setIsNewNumber(true);
        return;
      }

      // Format clean precision to avoid 0.1 + 0.2 = 0.30000000000000004
      let cleanRes: string;
      if (!isFinite(rawRes)) {
        cleanRes = "Infinity";
      } else {
        const rounded = Math.round((rawRes + Number.EPSILON) * 1e12) / 1e12;
        cleanRes = String(rounded);
      }

      // Add to paper tape history
      const newHistoryItem: HistoryItem = {
        id: String(Date.now()),
        expression: fullExpr,
        result: cleanRes,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setHistory((prev) => [newHistoryItem, ...prev.slice(0, 49)]);

      setDisplay(cleanRes);
      setExpression("");
      setIsNewNumber(true);
    } catch {
      setDisplay("Error");
      setExpression("");
      setIsNewNumber(true);
    }
  };

  // Clear & Backspace
  const handleClear = () => {
    playKeySound("clear");
    triggerVisualKey("C");
    setDisplay("0");
    setExpression("");
    setIsNewNumber(true);
  };

  const handleClearEntry = () => {
    playKeySound("clear");
    triggerVisualKey("CE");
    setDisplay("0");
    setIsNewNumber(true);
  };

  const handleBackspace = () => {
    playKeySound("num");
    triggerVisualKey("DEL");

    if (display === "Error" || isNewNumber) {
      setDisplay("0");
      setIsNewNumber(true);
      return;
    }

    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
      setIsNewNumber(true);
    }
  };

  const handleToggleSign = () => {
    playKeySound("num");
    triggerVisualKey("+/-");

    if (display === "0" || display === "Error") return;
    if (display.startsWith("-")) {
      setDisplay(display.slice(1));
    } else {
      setDisplay(`-${display}`);
    }
  };

  const handlePercentage = () => {
    playKeySound("op");
    triggerVisualKey("%");

    const val = parseFloat(display);
    if (!isNaN(val)) {
      const res = val / 100;
      setDisplay(String(res));
      setIsNewNumber(true);
    }
  };

  // Scientific & Instant Operations
  const handleInstantMath = (operation: string) => {
    playKeySound("op");
    triggerVisualKey(operation);

    const val = parseFloat(display);
    if (isNaN(val) && operation !== "pi" && operation !== "e" && operation !== "rand") return;

    let res: number = 0;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;

    switch (operation) {
      case "sqrt":
        if (val < 0) {
          setDisplay("Error");
          return;
        }
        res = Math.sqrt(val);
        break;
      case "cbrt":
        res = Math.cbrt(val);
        break;
      case "sq":
        res = val * val;
        break;
      case "cube":
        res = val * val * val;
        break;
      case "inv":
        if (val === 0) {
          setDisplay("Error");
          return;
        }
        res = 1 / val;
        break;
      case "sin": {
        const angle = angleUnit === "DEG" ? toRad(val) : val;
        res = isSecondFunc ? (angleUnit === "DEG" ? toDeg(Math.asin(val)) : Math.asin(val)) : Math.sin(angle);
        break;
      }
      case "cos": {
        const angle = angleUnit === "DEG" ? toRad(val) : val;
        res = isSecondFunc ? (angleUnit === "DEG" ? toDeg(Math.acos(val)) : Math.acos(val)) : Math.cos(angle);
        break;
      }
      case "tan": {
        const angle = angleUnit === "DEG" ? toRad(val) : val;
        res = isSecondFunc ? (angleUnit === "DEG" ? toDeg(Math.atan(val)) : Math.atan(val)) : Math.tan(angle);
        break;
      }
      case "ln":
        if (val <= 0) {
          setDisplay("Error");
          return;
        }
        res = isSecondFunc ? Math.exp(val) : Math.log(val);
        break;
      case "log":
        if (val <= 0) {
          setDisplay("Error");
          return;
        }
        res = isSecondFunc ? Math.pow(10, val) : Math.log10(val);
        break;
      case "fact": {
        if (val < 0 || !Number.isInteger(val) || val > 170) {
          setDisplay("Error");
          return;
        }
        let f = 1;
        for (let i = 2; i <= val; i++) f *= i;
        res = f;
        break;
      }
      case "abs":
        res = Math.abs(val);
        break;
      case "pi":
        res = Math.PI;
        break;
      case "e":
        res = Math.E;
        break;
      case "rand":
        res = Math.random();
        break;
      default:
        return;
    }

    const clean = String(Math.round((res + Number.EPSILON) * 1e12) / 1e12);
    setDisplay(clean);
    setIsNewNumber(true);
  };

  // Memory Registers
  const handleMemory = (memAction: "MC" | "MR" | "M+" | "M-" | "MS") => {
    playKeySound("op");
    triggerVisualKey(memAction);

    const currentVal = parseFloat(display) || 0;
    switch (memAction) {
      case "MC":
        setMemory(0);
        break;
      case "MR":
        setDisplay(String(memory));
        setIsNewNumber(true);
        break;
      case "M+":
        setMemory((prev) => prev + currentVal);
        setIsNewNumber(true);
        break;
      case "M-":
        setMemory((prev) => prev - currentVal);
        setIsNewNumber(true);
        break;
      case "MS":
        setMemory(currentVal);
        setIsNewNumber(true);
        break;
    }
  };

  // Copy Result
  const handleCopyResult = () => {
    navigator.clipboard.writeText(display);
    setCopiedResult(true);
    confetti({ particleCount: 20, spread: 45, origin: { y: 0.85 } });
    setTimeout(() => setCopiedResult(false), 2000);
  };

  // Recall from Paper Tape History
  const recallHistoryItem = (item: HistoryItem) => {
    playKeySound("num");
    setDisplay(item.result);
    setIsNewNumber(true);
  };

  // Physical Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when focusing input or textarea outside calculator
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === ".") {
        e.preventDefault();
        handleDecimal();
      } else if (e.key === "+") {
        e.preventDefault();
        handleOperator("+", "+");
      } else if (e.key === "-") {
        e.preventDefault();
        handleOperator("-", "−");
      } else if (e.key === "*") {
        e.preventDefault();
        handleOperator("*", "×");
      } else if (e.key === "/") {
        e.preventDefault();
        handleOperator("/", "÷");
      } else if (e.key === "=" || e.key === "Enter") {
        e.preventDefault();
        handleEquals();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleClear();
      } else if (e.key === "%") {
        e.preventDefault();
        handlePercentage();
      } else if (e.key === "(" || e.key === ")") {
        e.preventDefault();
        setExpression((prev) => `${prev} ${e.key}`.trim());
        triggerVisualKey(e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [display, expression, isNewNumber]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Toolbar / Mode Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMode("standard")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              mode === "standard"
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <CalcIcon className="w-3.5 h-3.5" />
            <span>Standard Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("scientific")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              mode === "scientific"
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Scientific Studio</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
              soundEnabled
                ? "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 shadow-xs"
                : "bg-slate-200/60 dark:bg-slate-800/40 text-slate-400 border-transparent"
            }`}
            title={soundEnabled ? "Tactile click sound ON" : "Click sound MUTED"}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-blue-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            <span className="text-[11px] hidden sm:inline">{soundEnabled ? "Sound" : "Muted"}</span>
          </button>

          {/* Paper Tape Drawer Toggle */}
          <button
            type="button"
            onClick={() => setIsTapeOpen(!isTapeOpen)}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
              isTapeOpen
                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
            }`}
            title="Toggle calculation history tape"
          >
            <History className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">Tape History</span>
            {history.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-300 text-[10px] font-bold flex items-center justify-center">
                {history.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Calculator Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Center Column: Realistic Skeuomorphic Hardware Body */}
        <div className={`transition-all duration-300 ${isTapeOpen ? "lg:col-span-8" : "lg:col-span-12 max-w-2xl mx-auto"}`}>
          <div
            className="p-5 sm:p-7 rounded-[32px] border shadow-2xl relative overflow-hidden transition-all select-none"
            style={{
              background: "linear-gradient(175deg, #1e293b 0%, #0f172a 100%)",
              borderColor: "#334155",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
            }}
          >
            {/* Top Hardware Bezel: Solar Panel Strip & Brand */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-700/60">
              {/* Brand Label */}
              <div className="flex items-center gap-2">
                <div className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700 text-[10px] font-extrabold tracking-widest text-slate-300 uppercase shadow-inner">
                  TABBENCH
                </div>
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                  {mode === "scientific" ? "FX-991 MATRIX PRO" : "DESK MASTER 12"}
                </span>
              </div>

              {/* Realistic Photovoltaic Solar Panel */}
              <div
                className="w-28 sm:w-36 h-5 rounded-md border border-amber-950/80 shadow-inner flex items-center justify-evenly px-1 relative overflow-hidden"
                style={{
                  background: "linear-gradient(180deg, #3d2314 0%, #1f120a 100%)",
                }}
                title="Photovoltaic Solar Cell (Decorative Ambient Aesthetic)"
              >
                {/* Solar Cell Grid Lines */}
                <div className="w-[1px] h-full bg-amber-700/30" />
                <div className="w-[1px] h-full bg-amber-700/30" />
                <div className="w-[1px] h-full bg-amber-700/30" />
                <div className="w-[1px] h-full bg-amber-700/30" />
                {/* Light reflection glass sheen */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
              </div>
            </div>

            {/* Recessed Realistic LCD Display */}
            <div
              className="p-4 sm:p-5 rounded-2xl border mb-5 relative shadow-inner overflow-hidden"
              style={{
                background: "linear-gradient(180deg, #091312 0%, #030a09 100%)",
                borderColor: "#1e3a35",
                boxShadow: "inset 0 4px 10px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              {/* Status Flags Header */}
              <div className="flex items-center justify-between text-[11px] font-mono font-bold text-emerald-500/70 pb-1">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.2 rounded ${mode === "scientific" ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/50" : "opacity-30"}`}>
                    {angleUnit}
                  </span>
                  {memory !== 0 && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-400 border border-amber-800/50">
                      M
                    </span>
                  )}
                  {isSecondFunc && (
                    <span className="px-1.5 py-0.2 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/50">
                      2nd
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleCopyResult}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-emerald-400 transition"
                  title="Copy current value"
                >
                  {copiedResult ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-sans">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span className="font-sans">Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Expression Ticker (Sub-display) */}
              <div className="h-6 flex items-center justify-end font-mono text-xs text-emerald-600/80 dark:text-emerald-500/80 overflow-x-auto whitespace-nowrap scrollbar-none">
                {expression || "\u00A0"}
              </div>

              {/* Primary Digital Digits */}
              <div className="flex items-baseline justify-end overflow-x-auto whitespace-nowrap scrollbar-none py-1">
                <span
                  className="font-mono font-bold tracking-tight text-right text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.35)]"
                  style={{
                    fontSize: display.length > 12 ? "1.8rem" : display.length > 9 ? "2.3rem" : "2.85rem",
                    letterSpacing: "0.04em",
                  }}
                >
                  {formatDisplay(display)}
                </span>
              </div>
            </div>

            {/* Memory Buttons Row */}
            <div className="grid grid-cols-5 gap-2 mb-3">
              {[
                { id: "MC", label: "MC" },
                { id: "MR", label: "MR" },
                { id: "M+", label: "M+" },
                { id: "M-", label: "M-" },
                { id: "MS", label: "MS" },
              ].map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => handleMemory(btn.id as "MC" | "MR" | "M+" | "M-" | "MS")}
                  className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition active:scale-95 ${
                    lastKeyPressed === btn.id
                      ? "bg-blue-600 text-white border-blue-500 shadow-inner"
                      : "bg-slate-800/80 hover:bg-slate-750 text-slate-300 border-slate-700/60 shadow-xs"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Scientific Function Panel (When in Scientific Mode) */}
            {mode === "scientific" && (
              <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 mb-3 grid grid-cols-5 gap-1.5 sm:gap-2 animate-in fade-in duration-200">
                <button
                  type="button"
                  onClick={() => setIsSecondFunc(!isSecondFunc)}
                  className={`py-2 text-[11px] font-mono font-bold rounded-xl border transition ${
                    isSecondFunc
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-inner"
                      : "bg-slate-800/90 text-indigo-400 border-slate-700/70 hover:bg-slate-800"
                  }`}
                >
                  2nd
                </button>
                <button
                  type="button"
                  onClick={() => setAngleUnit(angleUnit === "DEG" ? "RAD" : "DEG")}
                  className="py-2 text-[11px] font-mono font-bold rounded-xl bg-slate-800/90 hover:bg-slate-800 text-emerald-400 border border-slate-700/70"
                >
                  {angleUnit}
                </button>
                <button
                  type="button"
                  onClick={() => handleInstantMath("sin")}
                  className="py-2 text-[11px] font-mono font-bold rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-300 border border-slate-700/70"
                >
                  {isSecondFunc ? "sin⁻¹" : "sin"}
                </button>
                <button
                  type="button"
                  onClick={() => handleInstantMath("cos")}
                  className="py-2 text-[11px] font-mono font-bold rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-300 border border-slate-700/70"
                >
                  {isSecondFunc ? "cos⁻¹" : "cos"}
                </button>
                <button
                  type="button"
                  onClick={() => handleInstantMath("tan")}
                  className="py-2 text-[11px] font-mono font-bold rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-300 border border-slate-700/70"
                >
                  {isSecondFunc ? "tan⁻¹" : "tan"}
                </button>

                <button
                  type="button"
                  onClick={() => handleInstantMath("ln")}
                  className="py-2 text-[11px] font-mono font-bold rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-300 border border-slate-700/70"
                >
                  {isSecondFunc ? "eˣ" : "ln"}
                </button>
                <button
                  type="button"
                  onClick={() => handleInstantMath("log")}
                  className="py-2 text-[11px] font-mono font-bold rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-300 border border-slate-700/70"
                >
                  {isSecondFunc ? "10ˣ" : "log"}
                </button>
                <button
                  type="button"
                  onClick={() => handleOperator("^", "^")}
                  className="py-2 text-[11px] font-mono font-bold rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-300 border border-slate-700/70"
                >
                  xʸ
                </button>
                <button
                  type="button"
                  onClick={() => handleInstantMath("sqrt")}
                  className="py-2 text-[11px] font-mono font-bold rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-300 border border-slate-700/70"
                >
                  √x
                </button>
                <button
                  type="button"
                  onClick={() => handleInstantMath("fact")}
                  className="py-2 text-[11px] font-mono font-bold rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-300 border border-slate-700/70"
                >
                  x!
                </button>

                <button
                  type="button"
                  onClick={() => handleInstantMath("pi")}
                  className="py-2 text-[11px] font-mono font-bold rounded-xl bg-slate-800/90 hover:bg-slate-800 text-amber-400 border border-slate-700/70"
                >
                  π
                </button>
                <button
                  type="button"
                  onClick={() => handleInstantMath("e")}
                  className="py-2 text-[11px] font-mono font-bold rounded-xl bg-slate-800/90 hover:bg-slate-800 text-amber-400 border border-slate-700/70"
                >
                  e
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playKeySound("op");
                    setExpression((prev) => `${prev} (`.trim());
                  }}
                  className="py-2 text-[11px] font-mono font-bold rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-300 border border-slate-700/70"
                >
                  (
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playKeySound("op");
                    setExpression((prev) => `${prev} )`.trim());
                  }}
                  className="py-2 text-[11px] font-mono font-bold rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-300 border border-slate-700/70"
                >
                  )
                </button>
                <button
                  type="button"
                  onClick={() => handleInstantMath("inv")}
                  className="py-2 text-[11px] font-mono font-bold rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-300 border border-slate-700/70"
                >
                  1/x
                </button>
              </div>
            )}

            {/* Main Tactile Keypad Grid */}
            <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
              {/* Row 1: Function Controls */}
              <button
                type="button"
                onClick={handleClear}
                className={`py-3.5 sm:py-4 text-sm font-bold rounded-2xl border transition active:scale-95 text-rose-300 border-rose-900/50 shadow-sm ${
                  lastKeyPressed === "C"
                    ? "bg-rose-700 shadow-inner"
                    : "bg-gradient-to-b from-rose-950/80 to-rose-900/70 hover:from-rose-900/80 hover:to-rose-850"
                }`}
                style={{
                  boxShadow: "0 4px 0 rgba(159, 18, 57, 0.4), 0 5px 10px rgba(0,0,0,0.3)",
                }}
              >
                C
              </button>

              <button
                type="button"
                onClick={handleClearEntry}
                className={`py-3.5 sm:py-4 text-sm font-bold rounded-2xl border transition active:scale-95 text-amber-300 border-amber-900/50 shadow-sm ${
                  lastKeyPressed === "CE"
                    ? "bg-amber-700 shadow-inner"
                    : "bg-gradient-to-b from-amber-950/80 to-amber-900/70 hover:from-amber-900/80"
                }`}
                style={{
                  boxShadow: "0 4px 0 rgba(180, 83, 9, 0.4), 0 5px 10px rgba(0,0,0,0.3)",
                }}
              >
                CE
              </button>

              <button
                type="button"
                onClick={handlePercentage}
                className="py-3.5 sm:py-4 text-sm font-bold rounded-2xl bg-gradient-to-b from-slate-800 to-slate-850 hover:from-slate-750 text-slate-200 border border-slate-700/80 active:scale-95 transition"
                style={{
                  boxShadow: "0 4px 0 rgba(15, 23, 42, 0.8), 0 5px 10px rgba(0,0,0,0.3)",
                }}
              >
                %
              </button>

              <button
                type="button"
                onClick={() => handleOperator("/", "÷")}
                className={`py-3.5 sm:py-4 text-lg font-bold rounded-2xl border transition active:scale-95 text-white border-amber-500/50 ${
                  lastKeyPressed === "/"
                    ? "bg-amber-700 shadow-inner"
                    : "bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-450 hover:to-amber-550"
                }`}
                style={{
                  boxShadow: "0 4px 0 rgba(180, 83, 9, 0.8), 0 5px 12px rgba(245, 158, 11, 0.3)",
                }}
              >
                ÷
              </button>

              {/* Row 2: 7, 8, 9, × */}
              {["7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleDigit(num)}
                  className={`py-3.5 sm:py-4 text-xl font-bold rounded-2xl border transition active:scale-95 text-white border-slate-650 ${
                    lastKeyPressed === num
                      ? "bg-slate-650 shadow-inner translate-y-0.5"
                      : "bg-gradient-to-b from-slate-750 to-slate-850 hover:from-slate-700"
                  }`}
                  style={{
                    boxShadow: "0 4px 0 rgba(15, 23, 42, 0.9), 0 5px 10px rgba(0,0,0,0.3)",
                  }}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleOperator("*", "×")}
                className={`py-3.5 sm:py-4 text-lg font-bold rounded-2xl border transition active:scale-95 text-white border-amber-500/50 ${
                  lastKeyPressed === "*"
                    ? "bg-amber-700 shadow-inner"
                    : "bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-450 hover:to-amber-550"
                }`}
                style={{
                  boxShadow: "0 4px 0 rgba(180, 83, 9, 0.8), 0 5px 12px rgba(245, 158, 11, 0.3)",
                }}
              >
                ×
              </button>

              {/* Row 3: 4, 5, 6, − */}
              {["4", "5", "6"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleDigit(num)}
                  className={`py-3.5 sm:py-4 text-xl font-bold rounded-2xl border transition active:scale-95 text-white border-slate-650 ${
                    lastKeyPressed === num
                      ? "bg-slate-650 shadow-inner translate-y-0.5"
                      : "bg-gradient-to-b from-slate-750 to-slate-850 hover:from-slate-700"
                  }`}
                  style={{
                    boxShadow: "0 4px 0 rgba(15, 23, 42, 0.9), 0 5px 10px rgba(0,0,0,0.3)",
                  }}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleOperator("-", "−")}
                className={`py-3.5 sm:py-4 text-lg font-bold rounded-2xl border transition active:scale-95 text-white border-amber-500/50 ${
                  lastKeyPressed === "-"
                    ? "bg-amber-700 shadow-inner"
                    : "bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-450 hover:to-amber-550"
                }`}
                style={{
                  boxShadow: "0 4px 0 rgba(180, 83, 9, 0.8), 0 5px 12px rgba(245, 158, 11, 0.3)",
                }}
              >
                −
              </button>

              {/* Row 4: 1, 2, 3, + */}
              {["1", "2", "3"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleDigit(num)}
                  className={`py-3.5 sm:py-4 text-xl font-bold rounded-2xl border transition active:scale-95 text-white border-slate-650 ${
                    lastKeyPressed === num
                      ? "bg-slate-650 shadow-inner translate-y-0.5"
                      : "bg-gradient-to-b from-slate-750 to-slate-850 hover:from-slate-700"
                  }`}
                  style={{
                    boxShadow: "0 4px 0 rgba(15, 23, 42, 0.9), 0 5px 10px rgba(0,0,0,0.3)",
                  }}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleOperator("+", "+")}
                className={`py-3.5 sm:py-4 text-lg font-bold rounded-2xl border transition active:scale-95 text-white border-amber-500/50 ${
                  lastKeyPressed === "+"
                    ? "bg-amber-700 shadow-inner"
                    : "bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-450 hover:to-amber-550"
                }`}
                style={{
                  boxShadow: "0 4px 0 rgba(180, 83, 9, 0.8), 0 5px 12px rgba(245, 158, 11, 0.3)",
                }}
              >
                +
              </button>

              {/* Row 5: +/-, 0, ., = */}
              <button
                type="button"
                onClick={handleToggleSign}
                className="py-3.5 sm:py-4 text-sm font-bold rounded-2xl bg-gradient-to-b from-slate-800 to-slate-850 hover:from-slate-750 text-slate-200 border border-slate-700/80 active:scale-95 transition"
                style={{
                  boxShadow: "0 4px 0 rgba(15, 23, 42, 0.8), 0 5px 10px rgba(0,0,0,0.3)",
                }}
              >
                ±
              </button>

              <button
                type="button"
                onClick={() => handleDigit("0")}
                className={`py-3.5 sm:py-4 text-xl font-bold rounded-2xl border transition active:scale-95 text-white border-slate-650 ${
                  lastKeyPressed === "0"
                    ? "bg-slate-650 shadow-inner translate-y-0.5"
                    : "bg-gradient-to-b from-slate-750 to-slate-850 hover:from-slate-700"
                }`}
                style={{
                  boxShadow: "0 4px 0 rgba(15, 23, 42, 0.9), 0 5px 10px rgba(0,0,0,0.3)",
                }}
              >
                0
              </button>

              <button
                type="button"
                onClick={handleDecimal}
                className={`py-3.5 sm:py-4 text-xl font-bold rounded-2xl border transition active:scale-95 text-white border-slate-650 ${
                  lastKeyPressed === "."
                    ? "bg-slate-650 shadow-inner translate-y-0.5"
                    : "bg-gradient-to-b from-slate-750 to-slate-850 hover:from-slate-700"
                }`}
                style={{
                  boxShadow: "0 4px 0 rgba(15, 23, 42, 0.9), 0 5px 10px rgba(0,0,0,0.3)",
                }}
              >
                .
              </button>

              <button
                type="button"
                onClick={handleEquals}
                className={`py-3.5 sm:py-4 text-xl font-bold rounded-2xl border transition active:scale-95 text-white border-blue-500/60 ${
                  lastKeyPressed === "="
                    ? "bg-blue-700 shadow-inner"
                    : "bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-550 hover:to-blue-650"
                }`}
                style={{
                  boxShadow: "0 4px 0 rgba(29, 78, 216, 0.8), 0 5px 15px rgba(37, 99, 235, 0.4)",
                }}
              >
                =
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Paper Tape History Drawer */}
        {isTapeOpen && (
          <div className="lg:col-span-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden animate-in slide-in-from-right duration-200 flex flex-col h-[560px]">
            {/* Tape Header */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Paper Tape Audit
                </span>
              </div>
              <div className="flex items-center gap-1">
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setHistory([])}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Clear history tape"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsTapeOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tape Receipt Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs">
                  <CalcIcon className="w-8 h-8 stroke-1 text-slate-300 dark:text-slate-700 mb-2" />
                  <p>Tape is clear.</p>
                  <p className="text-[10px] text-slate-500 mt-1">Calculations will print here continuously as you work.</p>
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => recallHistoryItem(item)}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-500/50 cursor-pointer group transition text-right"
                  >
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">{item.timestamp}</span>
                      <span className="group-hover:text-blue-500 transition">{item.expression}</span>
                    </div>
                    <div className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 mt-1">
                      = {formatDisplay(item.result)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Tape Footer */}
            {history.length > 0 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                <span>{history.length} operations logged</span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                  Click any row to reuse
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Guide Footnote */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900 dark:text-white">Keyboard Friendly:</span>
          <span className="hidden sm:inline">Use standard numbers 0–9, numpad, operators (+, -, *, /), Enter for =, and Backspace to delete.</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">Esc</kbd>
          <span>Clear</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 ml-2">Enter</kbd>
          <span>Calculate</span>
        </div>
      </div>
    </div>
  );
}
