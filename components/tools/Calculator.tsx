"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { Calculator as CalcIcon, Check, Copy, Delete, History, Trash2, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Segmented } from "@/components/tool/kit";
import { markToolCompleted } from "@/lib/analytics";
import { copyText } from "@/lib/utils/clipboard";
import { cn } from "@/lib/utils";

interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: string;
}

const OPERATORS = ["+", "−", "×", "÷", "^"];
const endsWithOperator = (expr: string) => OPERATORS.some((op) => expr.endsWith(op));

type KeyKind = "digit" | "fn" | "op" | "eq";

const KEY_BASE =
  "flex h-12 items-center justify-center rounded-xl tabular-nums @2xl:h-11 transition-colors outline-none select-none active:scale-[0.97] focus-visible:ring-3 focus-visible:ring-ring/50";
const KEY_KIND: Record<KeyKind, string> = {
  digit: "border bg-background text-xl font-medium text-foreground hover:bg-muted dark:bg-input/30 dark:hover:bg-input/60",
  fn: "bg-muted text-base font-medium text-foreground hover:bg-muted/70 dark:bg-muted/60 dark:hover:bg-muted",
  op: "bg-brand-subtle text-xl font-medium text-brand-subtle-foreground hover:bg-brand-subtle/70",
  eq: "bg-primary text-xl font-medium text-primary-foreground hover:bg-primary/90",
};

function Key({
  label,
  ariaLabel,
  kind,
  onClick,
  pressed,
  active,
  className,
}: {
  label: React.ReactNode;
  ariaLabel?: string;
  kind: KeyKind;
  onClick: () => void;
  /** Flashes when the matching keyboard key is pressed. */
  pressed?: boolean;
  /** An operator waiting for its second number. */
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active === undefined ? undefined : active}
      className={cn(
        KEY_BASE,
        KEY_KIND[kind],
        active && "bg-primary text-primary-foreground hover:bg-primary/90",
        pressed && "ring-3 ring-ring/40",
        className
      )}
    >
      {label}
    </button>
  );
}

function SciKey({
  label,
  ariaLabel,
  onClick,
  active,
  className,
}: {
  label: React.ReactNode;
  ariaLabel?: string;
  onClick: () => void;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={cn(
        // Fixed height when stacked above the keypad; stretches to the keypad's
        // row height when the panel sits beside it.
        "flex h-10 items-center justify-center rounded-lg text-sm font-medium transition-colors outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 @2xl:h-auto @2xl:text-base",
        active
          ? "bg-brand-subtle text-brand-subtle-foreground"
          : "text-foreground hover:bg-muted",
        className
      )}
    >
      {label}
    </button>
  );
}

export default function Calculator() {
  // Calculator Core State
  const [display, setDisplay] = useState<string>("0");
  const [expression, setExpression] = useState<string>("");
  const [isNewNumber, setIsNewNumber] = useState<boolean>(true);
  // True when the number on the display is already part of `expression`
  // (right after an operator or a closing bracket), so it isn't added twice.
  const [entryInExpr, setEntryInExpr] = useState<boolean>(false);
  const [memory, setMemory] = usePersistentState<number>("calc_mem", 0);
  const [history, setHistory] = usePersistentState<HistoryItem[]>("calc_history", []);

  // Mode and Features
  const [mode, setMode] = usePersistentState<"standard" | "scientific">("calc_mode", "standard");
  const [angleUnit, setAngleUnit] = usePersistentState<"DEG" | "RAD">("calc_angle", "DEG");
  const [soundEnabled, setSoundEnabled] = usePersistentState<boolean>("calc_sound", false);
  const [isSecondFunc, setIsSecondFunc] = useState<boolean>(false);
  const [isTapeOpen, setIsTapeOpen] = useState<boolean>(false);
  const [copiedResult, setCopiedResult] = useState<boolean>(false);
  const [lastKeyPressed, setLastKeyPressed] = useState<string | null>(null);

  // Audio Context Ref for synthesized key click sounds
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

      // Mobile haptic feedback, only when sound is on
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

  /**
   * A new number is starting. If the expression ends with a closing bracket,
   * "(2 + 3) 4" means "(2 + 3) × 4", so the multiplication is added.
   */
  const openSlot = () => {
    if (entryInExpr && expression.endsWith(")")) setExpression(`${expression} ×`);
    setEntryInExpr(false);
  };

  // Input Digits
  const handleDigit = (digit: string) => {
    playKeySound("num");
    triggerVisualKey(digit);

    if (display === "Error" || display === "NaN" || display === "Infinity") {
      setDisplay(digit);
      setIsNewNumber(false);
      setEntryInExpr(false);
      return;
    }

    if (isNewNumber) {
      openSlot();
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
      openSlot();
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

    if (entryInExpr) {
      // Two operators in a row: the second one replaces the first.
      if (endsWithOperator(expression)) {
        setExpression(`${expression.slice(0, -1).trimEnd()} ${displayOp}`);
      } else {
        setExpression(`${expression} ${displayOp}`.trim());
      }
    } else {
      const currentNum = parseFloat(display);
      if (isNaN(currentNum)) return;
      setExpression(`${expression} ${display} ${displayOp}`.trim());
    }
    setEntryInExpr(true);
    setIsNewNumber(true);
  };

  // Brackets
  const handleParen = (paren: "(" | ")") => {
    playKeySound("op");
    triggerVisualKey(paren);

    if (paren === "(") {
      if (!entryInExpr && !isNewNumber) {
        // "2 (" means "2 × ("
        setExpression(`${expression} ${display} × (`.trim());
      } else if (entryInExpr && expression.endsWith(")")) {
        setExpression(`${expression} × (`);
      } else {
        setExpression(`${expression} (`.trim());
      }
      setDisplay("0");
      setIsNewNumber(true);
      setEntryInExpr(false);
      return;
    }

    const open = (expression.match(/\(/g) || []).length;
    const close = (expression.match(/\)/g) || []).length;
    if (open <= close) return;
    if (entryInExpr && expression.endsWith(")")) {
      setExpression(`${expression} )`);
    } else {
      // Close over the number on the display (it isn't in the expression yet,
      // or an operator is still waiting for it).
      setExpression(`${expression} ${display} )`);
    }
    setEntryInExpr(true);
    setIsNewNumber(true);
  };

  // Calculate Result
  const handleEquals = () => {
    playKeySound("eq");
    triggerVisualKey("=");

    if (!expression && isNewNumber) return;

    const fullExpr = (entryInExpr && !endsWithOperator(expression) ? expression : `${expression} ${display}`).trim();
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
      if (/[^0-9+\-*/().\s*%^e]/.test(sanitized)) {
        throw new Error("Invalid characters");
      }

      // Evaluate safely
      const fn = new Function(`return (${sanitized})`);
      const rawRes = fn();

      if (typeof rawRes !== "number" || isNaN(rawRes)) {
        setDisplay("Error");
        setExpression("");
        setIsNewNumber(true);
        setEntryInExpr(false);
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

      const newHistoryItem: HistoryItem = {
        id: String(Date.now()),
        expression: fullExpr,
        result: cleanRes,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setHistory((prev) => [newHistoryItem, ...prev.slice(0, 49)]);
      markToolCompleted();

      setDisplay(cleanRes);
      setExpression("");
      setIsNewNumber(true);
      setEntryInExpr(false);
    } catch {
      setDisplay("Error");
      setExpression("");
      setIsNewNumber(true);
      setEntryInExpr(false);
    }
  };

  // Clear & Backspace
  const handleClear = () => {
    playKeySound("clear");
    triggerVisualKey("C");
    setDisplay("0");
    setExpression("");
    setIsNewNumber(true);
    setEntryInExpr(false);
  };

  const handleClearEntry = () => {
    playKeySound("clear");
    triggerVisualKey("CE");
    setDisplay("0");
    setIsNewNumber(true);
    // After ")" the display isn't a pending operand, so the expression stays complete.
    setEntryInExpr(expression.endsWith(")"));
  };

  const handleBackspace = () => {
    playKeySound("num");
    triggerVisualKey("DEL");

    if (entryInExpr) return;
    if (display === "Error" || isNewNumber) {
      setDisplay("0");
      setIsNewNumber(true);
      return;
    }

    if (display.length > 1 && display !== "-0" && !/^-\d$/.test(display)) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
      setIsNewNumber(true);
    }
  };

  const handleToggleSign = () => {
    playKeySound("num");
    triggerVisualKey("+/-");

    if (entryInExpr || display === "0" || display === "Error") return;
    if (display.startsWith("-")) {
      setDisplay(display.slice(1));
    } else {
      setDisplay(`-${display}`);
    }
  };

  /**
   * Percent works like a desk calculator: after + or − it is a share of the
   * number before the operator (200 + 10 % → 200 + 20); otherwise it divides
   * by 100 (200 × 10 % → 200 × 0.1).
   */
  const handlePercentage = () => {
    playKeySound("op");
    triggerVisualKey("%");

    if (entryInExpr) return;
    const val = parseFloat(display);
    if (isNaN(val)) return;
    const base = expression.match(/(-?\d+(?:\.\d+)?)\s*[+−]$/);
    const res = base ? (parseFloat(base[1]) * val) / 100 : val / 100;
    setDisplay(String(Math.round((res + Number.EPSILON) * 1e12) / 1e12));
    setIsNewNumber(true);
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
        if (!isSecondFunc && val <= 0) {
          setDisplay("Error");
          return;
        }
        res = isSecondFunc ? Math.exp(val) : Math.log(val);
        break;
      case "log":
        if (!isSecondFunc && val <= 0) {
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

    if (!isFinite(res) || isNaN(res)) {
      setDisplay("Error");
      setIsNewNumber(true);
      return;
    }
    const clean = String(Math.round((res + Number.EPSILON) * 1e12) / 1e12);
    openSlot();
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
        openSlot();
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
  const handleCopyResult = async () => {
    if (!(await copyText(display))) return;
    setCopiedResult(true);
    markToolCompleted();
    setTimeout(() => setCopiedResult(false), 2000);
  };

  // Recall from history
  const recallHistoryItem = (item: HistoryItem) => {
    playKeySound("num");
    openSlot();
    setDisplay(item.result);
    setIsNewNumber(true);
  };

  // Physical keyboard. The listener is registered once and always calls the
  // latest handler, so it never works with stale state or settings.
  const keyHandlerRef = useRef<(e: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    keyHandlerRef.current = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable)) return;

      // Ctrl/Cmd+C copies the result when no text is selected.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "c") {
        if (!window.getSelection()?.toString()) {
          e.preventDefault();
          void handleCopyResult();
        }
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === "." || e.key === ",") {
        e.preventDefault();
        handleDecimal();
      } else if (e.key === "+") {
        e.preventDefault();
        handleOperator("+", "+");
      } else if (e.key === "-") {
        e.preventDefault();
        handleOperator("-", "−");
      } else if (e.key === "*" || e.key === "x") {
        e.preventDefault();
        handleOperator("*", "×");
      } else if (e.key === "/") {
        e.preventDefault();
        handleOperator("/", "÷");
      } else if (e.key === "^") {
        e.preventDefault();
        handleOperator("^", "^");
      } else if (e.key === "=" || e.key === "Enter") {
        e.preventDefault();
        handleEquals();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === "Delete") {
        e.preventDefault();
        handleClearEntry();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleClear();
      } else if (e.key === "%") {
        e.preventDefault();
        handlePercentage();
      } else if (e.key === "(" || e.key === ")") {
        e.preventDefault();
        handleParen(e.key);
      }
    };
  });
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => keyHandlerRef.current(e);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // The operator waiting for its second number, highlighted on the keypad.
  const pendingOp = entryInExpr && endsWithOperator(expression) ? expression.slice(-1) : null;
  const shown = formatDisplay(display);
  const displaySize = shown.length > 16 ? "text-2xl" : shown.length > 11 ? "text-3xl" : "text-4xl";

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={mode}
          onChange={setMode}
          ariaLabel="Calculator mode"
          size="sm"
          options={[
            { value: "standard", label: "Standard" },
            { value: "scientific", label: "Scientific" },
          ]}
        />
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={soundEnabled}
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Key sounds on" : "Key sounds off"}
          >
            {soundEnabled ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
            <span className="hidden sm:inline">{soundEnabled ? "Sound on" : "Sound off"}</span>
          </Button>
          <Button
            type="button"
            variant={isTapeOpen ? "secondary" : "outline"}
            size="sm"
            aria-pressed={isTapeOpen}
            aria-controls="calc-history"
            onClick={() => setIsTapeOpen(!isTapeOpen)}
          >
            <History aria-hidden="true" />
            History
            {history.length > 0 && (
              <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">
                {history.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* History docks beside the calculator only when the container has room
          for both; otherwise it stacks below. Container queries, not viewport
          breakpoints, because the tool column is narrower than the window. */}
      <div
        className={cn(
          "flex flex-col gap-5",
          isTapeOpen && (mode === "scientific" ? "@5xl:flex-row @5xl:items-start @5xl:justify-center" : "@2xl:flex-row @2xl:items-start @2xl:justify-center")
        )}
      >
        {/* Calculator */}
        <div
          className={cn(
            "mx-auto w-full max-w-sm space-y-3",
            mode === "scientific" && "@2xl:max-w-2xl",
            isTapeOpen && (mode === "scientific" ? "@5xl:mx-0" : "@2xl:mx-0")
          )}
        >
          {/* Display */}
          <div className="rounded-xl border bg-muted/40 px-4 pt-2 pb-2.5">
            <div className="flex h-6 items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                {mode === "scientific" && <span className="rounded bg-background px-1.5 py-0.5 dark:bg-input/40">{angleUnit}</span>}
                {memory !== 0 && (
                  <span className="rounded bg-background px-1.5 py-0.5 dark:bg-input/40" title={`Memory: ${formatDisplay(String(memory))}`}>
                    M
                  </span>
                )}
                {isSecondFunc && <span className="rounded bg-background px-1.5 py-0.5 dark:bg-input/40">2nd</span>}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={handleCopyResult}
                aria-label={copiedResult ? "Copied" : "Copy result"}
                className="-mr-2 text-muted-foreground"
              >
                {copiedResult ? <Check aria-hidden="true" className="text-success" /> : <Copy aria-hidden="true" />}
                {copiedResult ? "Copied" : "Copy"}
              </Button>
            </div>
            <div className="min-h-5 overflow-x-auto overflow-y-hidden text-right font-mono text-sm whitespace-nowrap text-muted-foreground" aria-label="Expression">
              {expression || " "}
            </div>
            <output
              aria-live="polite"
              aria-label="Result"
              className={cn(
                "mt-0.5 block overflow-x-auto overflow-y-hidden text-right leading-tight font-semibold tracking-tight whitespace-nowrap tabular-nums text-foreground",
                displaySize,
                display === "Error" && "text-destructive"
              )}
            >
              {shown}
            </output>
          </div>

          {/* Memory */}
          <div className="grid grid-cols-5 gap-1" role="group" aria-label="Memory">
            {(
              [
                { id: "MC", label: "MC", aria: "Memory clear", needsMemory: true },
                { id: "MR", label: "MR", aria: "Memory recall", needsMemory: true },
                { id: "M+", label: "M+", aria: "Add to memory", needsMemory: false },
                { id: "M-", label: "M−", aria: "Subtract from memory", needsMemory: false },
                { id: "MS", label: "MS", aria: "Memory store", needsMemory: false },
              ] as const
            ).map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => handleMemory(btn.id)}
                disabled={btn.needsMemory && memory === 0}
                aria-label={btn.aria}
                title={btn.aria}
                className={cn(
                  "h-7 rounded-md text-xs font-medium text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40",
                  lastKeyPressed === btn.id && "bg-muted text-foreground"
                )}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className={cn(mode === "scientific" && "space-y-3 @2xl:grid @2xl:grid-cols-[minmax(0,3fr)_minmax(0,4fr)] @2xl:gap-3 @2xl:space-y-0")}>
          {/* Scientific functions. DOM order suits the 3 × 5 grid beside the
              keypad; the order-* classes restore the familiar 5 × 3 layout
              when the panel is stacked above it. */}
          {mode === "scientific" && (
            <div
              className="grid grid-cols-5 gap-1 rounded-xl border p-1.5 @2xl:grid-cols-3 @2xl:grid-rows-5 @2xl:gap-1.5"
              role="group"
              aria-label="Scientific functions"
            >
              <SciKey className="order-1 @2xl:order-none" label="2nd" ariaLabel="Second functions" active={isSecondFunc} onClick={() => setIsSecondFunc(!isSecondFunc)} />
              <SciKey
                className="order-2 @2xl:order-none"
                label={angleUnit}
                ariaLabel={`Angle unit: ${angleUnit === "DEG" ? "degrees" : "radians"}. Switch`}
                onClick={() => setAngleUnit(angleUnit === "DEG" ? "RAD" : "DEG")}
              />
              <SciKey className="order-11 @2xl:order-none" label="π" ariaLabel="Pi" onClick={() => handleInstantMath("pi")} />

              <SciKey className="order-3 @2xl:order-none" label={isSecondFunc ? "sin⁻¹" : "sin"} ariaLabel={isSecondFunc ? "Inverse sine" : "Sine"} onClick={() => handleInstantMath("sin")} />
              <SciKey className="order-4 @2xl:order-none" label={isSecondFunc ? "cos⁻¹" : "cos"} ariaLabel={isSecondFunc ? "Inverse cosine" : "Cosine"} onClick={() => handleInstantMath("cos")} />
              <SciKey className="order-5 @2xl:order-none" label={isSecondFunc ? "tan⁻¹" : "tan"} ariaLabel={isSecondFunc ? "Inverse tangent" : "Tangent"} onClick={() => handleInstantMath("tan")} />

              <SciKey className="order-6 @2xl:order-none" label={isSecondFunc ? "eˣ" : "ln"} ariaLabel={isSecondFunc ? "e to the power of x" : "Natural logarithm"} onClick={() => handleInstantMath("ln")} />
              <SciKey className="order-7 @2xl:order-none" label={isSecondFunc ? "10ˣ" : "log"} ariaLabel={isSecondFunc ? "10 to the power of x" : "Logarithm base 10"} onClick={() => handleInstantMath("log")} />
              <SciKey className="order-12 @2xl:order-none" label="e" ariaLabel="Euler's number" onClick={() => handleInstantMath("e")} />

              <SciKey className="order-8 @2xl:order-none" label="xʸ" ariaLabel="Power" onClick={() => handleOperator("^", "^")} />
              <SciKey
                className="order-9 @2xl:order-none"
                label={isSecondFunc ? "∛x" : "x³"}
                ariaLabel={isSecondFunc ? "Cube root" : "Cube"}
                onClick={() => handleInstantMath(isSecondFunc ? "cbrt" : "cube")}
              />
              <SciKey className="order-10 @2xl:order-none" label="x!" ariaLabel="Factorial" onClick={() => handleInstantMath("fact")} />

              <SciKey className="order-[13] @2xl:order-none" label="(" ariaLabel="Open bracket" onClick={() => handleParen("(")} />
              <SciKey className="order-[14] @2xl:order-none" label=")" ariaLabel="Close bracket" onClick={() => handleParen(")")} />
              <SciKey className="order-[15] @2xl:order-none" label="|x|" ariaLabel="Absolute value" onClick={() => handleInstantMath("abs")} />
            </div>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-4 gap-2" role="group" aria-label="Keypad">
            <Key kind="fn" label="%" ariaLabel="Percent" onClick={handlePercentage} pressed={lastKeyPressed === "%"} />
            <Key kind="fn" label="CE" ariaLabel="Clear entry" onClick={handleClearEntry} pressed={lastKeyPressed === "CE"} />
            <Key kind="fn" label="C" ariaLabel="Clear all" onClick={handleClear} pressed={lastKeyPressed === "C"} className="text-destructive" />
            <Key
              kind="fn"
              label={<Delete className="size-5" aria-hidden="true" />}
              ariaLabel="Backspace"
              onClick={handleBackspace}
              pressed={lastKeyPressed === "DEL"}
            />

            <Key kind="fn" label="¹⁄ₓ" ariaLabel="Reciprocal" onClick={() => handleInstantMath("inv")} pressed={lastKeyPressed === "inv"} />
            <Key kind="fn" label="x²" ariaLabel="Square" onClick={() => handleInstantMath("sq")} pressed={lastKeyPressed === "sq"} />
            <Key kind="fn" label="√x" ariaLabel="Square root" onClick={() => handleInstantMath("sqrt")} pressed={lastKeyPressed === "sqrt"} />
            <Key kind="op" label="÷" ariaLabel="Divide" onClick={() => handleOperator("/", "÷")} pressed={lastKeyPressed === "/"} active={pendingOp === "÷"} />

            {["7", "8", "9"].map((n) => (
              <Key key={n} kind="digit" label={n} onClick={() => handleDigit(n)} pressed={lastKeyPressed === n} />
            ))}
            <Key kind="op" label="×" ariaLabel="Multiply" onClick={() => handleOperator("*", "×")} pressed={lastKeyPressed === "*"} active={pendingOp === "×"} />

            {["4", "5", "6"].map((n) => (
              <Key key={n} kind="digit" label={n} onClick={() => handleDigit(n)} pressed={lastKeyPressed === n} />
            ))}
            <Key kind="op" label="−" ariaLabel="Subtract" onClick={() => handleOperator("-", "−")} pressed={lastKeyPressed === "-"} active={pendingOp === "−"} />

            {["1", "2", "3"].map((n) => (
              <Key key={n} kind="digit" label={n} onClick={() => handleDigit(n)} pressed={lastKeyPressed === n} />
            ))}
            <Key kind="op" label="+" ariaLabel="Add" onClick={() => handleOperator("+", "+")} pressed={lastKeyPressed === "+"} active={pendingOp === "+"} />

            <Key kind="digit" label="±" ariaLabel="Change sign" onClick={handleToggleSign} pressed={lastKeyPressed === "+/-"} className="text-lg" />
            <Key kind="digit" label="0" onClick={() => handleDigit("0")} pressed={lastKeyPressed === "0"} />
            <Key kind="digit" label="." ariaLabel="Decimal point" onClick={handleDecimal} pressed={lastKeyPressed === "."} />
            <Key kind="eq" label="=" ariaLabel="Equals" onClick={handleEquals} pressed={lastKeyPressed === "="} />
          </div>
          </div>
        </div>

        {/* History */}
        {isTapeOpen && (
          <section
            id="calc-history"
            aria-label="Calculation history"
            className={cn(
              "mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-xl border",
              mode === "scientific" ? "@5xl:mx-0 @5xl:h-[30rem] @5xl:w-72" : "@2xl:mx-0 @2xl:h-[30rem] @2xl:w-72"
            )}
          >
            <div className="flex items-center justify-between border-b px-3.5 py-2.5">
              <h3 className="text-sm font-semibold text-foreground">History</h3>
              <div className="flex items-center gap-0.5">
                {history.length > 0 && (
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => setHistory([])} aria-label="Clear history" title="Clear history">
                    <Trash2 aria-hidden="true" />
                  </Button>
                )}
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => setIsTapeOpen(false)} aria-label="Close history">
                  <X aria-hidden="true" />
                </Button>
              </div>
            </div>

            <div className="max-h-80 flex-1 overflow-y-auto p-1.5 @2xl:max-h-none">
              {history.length === 0 ? (
                <div className="flex h-full min-h-40 flex-col items-center justify-center gap-1 p-6 text-center">
                  <CalcIcon className="size-6 text-muted-foreground/60" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">No calculations yet.</p>
                  <p className="text-xs text-muted-foreground">Results appear here when you press =.</p>
                </div>
              ) : (
                <ul className="space-y-0.5">
                  {history.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => recallHistoryItem(item)}
                        className="w-full rounded-lg px-2.5 py-2 text-right transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                        aria-label={`Use ${formatDisplay(item.result)} (${item.expression})`}
                      >
                        <span className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>{item.timestamp}</span>
                          <span className="truncate font-mono">{item.expression}</span>
                        </span>
                        <span className="mt-0.5 block text-base font-semibold tabular-nums text-foreground">
                          = {formatDisplay(item.result)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {history.length > 0 && (
              <p className="border-t px-3.5 py-2 text-xs text-muted-foreground">
                Select a result to use it again. Kept in this browser for three days.
              </p>
            )}
          </section>
        )}
      </div>

      {/* Keyboard hint */}
      <p className="hidden flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground sm:flex">
        <span>Keyboard works too:</span>
        <span className="inline-flex items-center gap-1"><Kbd>0–9</Kbd><Kbd>+</Kbd><Kbd>−</Kbd><Kbd>*</Kbd><Kbd>/</Kbd></span>
        <span className="inline-flex items-center gap-1"><Kbd>Enter</Kbd> equals</span>
        <span className="inline-flex items-center gap-1"><Kbd>Backspace</Kbd> delete</span>
        <span className="inline-flex items-center gap-1"><Kbd>Esc</Kbd> clear</span>
      </p>
    </div>
  );
}
