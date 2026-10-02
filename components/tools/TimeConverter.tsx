"use client";

import React, { useEffect, useId, useMemo, useState } from "react";
import {
  Clock,
  Copy,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  Notice,
  Stat,
  StatGrid,
  ToolDivider,
  ToolSection,
  TextInput
} from "@/components/tool/kit";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { copyText } from "@/lib/utils/clipboard";
import { cn } from "@/lib/utils";

function pad(n: number, width = 2): string {
  return String(Math.floor(Math.max(0, n))).padStart(width, "0");
}

function getPeriodIcon(hours24: number) {
  if (hours24 >= 5 && hours24 < 12) return Sunrise;
  if (hours24 >= 12 && hours24 < 17) return Sun;
  if (hours24 >= 17 && hours24 < 21) return Sunset;
  return Moon;
}

function getPeriodDescription(hours24: number, minutes: number): string {
  if (hours24 === 0 && minutes === 0) return "Midnight";
  if (hours24 === 12 && minutes === 0) return "Noon / Midday";
  if (hours24 >= 0 && hours24 < 5) return "Late Night / Dawn";
  if (hours24 >= 5 && hours24 < 12) return "Morning";
  if (hours24 >= 12 && hours24 < 17) return "Afternoon";
  if (hours24 >= 17 && hours24 < 21) return "Evening";
  return "Night";
}

function toMilitaryPronunciation(h: number, m: number): string {
  const numWords: Record<number, string> = {
    0: "Zero", 1: "Zero One", 2: "Zero Two", 3: "Zero Three", 4: "Zero Four",
    5: "Zero Five", 6: "Zero Six", 7: "Zero Seven", 8: "Zero Eight", 9: "Zero Nine",
    10: "Ten", 11: "Eleven", 12: "Twelve", 13: "Thirteen", 14: "Fourteen",
    15: "Fifteen", 16: "Sixteen", 17: "Seventeen", 18: "Eighteen", 19: "Nineteen",
    20: "Twenty", 21: "Twenty-One", 22: "Twenty-Two", 23: "Twenty-Three",
    24: "Twenty-Four", 30: "Thirty", 40: "Forty", 45: "Forty-Five", 50: "Fifty",
  };

  const getHourWord = (hour: number) => {
    if (hour === 0) return "Zero Hundred";
    if (hour <= 23) return numWords[hour] || `${hour}`;
    return `${hour}`;
  };

  const getMinuteWord = (min: number) => {
    if (min === 0) return h === 0 ? "" : "Hundred";
    if (min < 10) return `Zero ${numWords[min] ? numWords[min].replace("Zero ", "") : min}`;
    if (numWords[min]) return numWords[min];
    const tens = Math.floor(min / 10) * 10;
    const ones = min % 10;
    return `${numWords[tens] || tens}-${numWords[ones] ? numWords[ones].replace("Zero ", "") : ones}`;
  };

  if (m === 0) {
    if (h === 0) return "Zero Hundred Hours";
    return `${getHourWord(h)} Hundred Hours`;
  }

  return `${getHourWord(h)} ${getMinuteWord(m)} Hours`;
}

function toNaturalSpoken(h12: number, m: number, p: "AM" | "PM", h24: number): string {
  if (h24 === 0 && m === 0) return "Twelve Midnight";
  if (h24 === 12 && m === 0) return "Twelve Noon";

  const periodWord = p === "AM" ? "in the morning" : h24 < 17 ? "in the afternoon" : h24 < 21 ? "in the evening" : "at night";

  if (m === 0) {
    return `${h12} o'clock ${periodWord}`;
  }
  if (m === 15) {
    return `Quarter past ${h12} ${periodWord}`;
  }
  if (m === 30) {
    return `Half past ${h12} ${periodWord}`;
  }
  if (m === 45) {
    const nextHour = h12 === 12 ? 1 : h12 + 1;
    return `Quarter to ${nextHour} ${periodWord}`;
  }

  return `${h12}:${pad(m)} ${periodWord}`;
}

const REFERENCE_HOURS = Array.from({ length: 24 }, (_, i) => {
  const h24 = i;
  const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  const period = h24 < 12 ? "AM" : "PM";
  const military = `${pad(h24)}00 hrs`;
  const desc = getPeriodDescription(h24, 0);
  return {
    h24,
    formatted24: `${pad(h24)}:00`,
    formatted12: `${h12}:00 ${period}`,
    military,
    desc,
    period,
  };
});

function parseSmartTime(str: string): {h: number, m: number, s: number, isAmbiguous?: boolean} | null {
  str = str.trim().toLowerCase();
  if (!str) return null;

  if (str === "midnight" || str === "0" || str === "00" || str === "0000") return {h: 0, m: 0, s: 0};
  if (str === "noon") return {h: 12, m: 0, s: 0};
  
  if (str === "12") return {h: 12, m: 0, s: 0, isAmbiguous: true};

  if (/^\d{4}$/.test(str)) {
    const h = parseInt(str.substring(0, 2), 10);
    const m = parseInt(str.substring(2, 4), 10);
    if (h < 24 && m < 60) return {h, m, s: 0};
  }
  if (/^\d{6}$/.test(str)) {
    const h = parseInt(str.substring(0, 2), 10);
    const m = parseInt(str.substring(2, 4), 10);
    const s = parseInt(str.substring(4, 6), 10);
    if (h < 24 && m < 60 && s < 60) return {h, m, s};
  }
  
  const ampmMatch = str.match(/^(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?\s*(am|pm|a|p)$/);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10);
    const m = parseInt(ampmMatch[2] || "0", 10);
    const s = parseInt(ampmMatch[3] || "0", 10);
    const p = ampmMatch[4].startsWith('a') ? 'AM' : 'PM';
    
    if (m >= 60 || s >= 60) return null;
    if (h > 12) return null;
    if (h === 0) return null;
    
    if (p === 'AM' && h === 12) h = 0;
    if (p === 'PM' && h !== 12) h += 12;
    return {h, m, s};
  }

  const standardMatch = str.match(/^(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?$/);
  if (standardMatch) {
    const h = parseInt(standardMatch[1], 10);
    const m = parseInt(standardMatch[2] || "0", 10);
    const s = parseInt(standardMatch[3] || "0", 10);
    
    if (m >= 60 || s >= 60) return null;
    
    if (!standardMatch[2]) {
      if (h >= 1 && h <= 12) return {h, m, s, isAmbiguous: true};
      if (h < 24) return {h, m, s};
      return null;
    }
    if (h < 24) return {h, m, s};
  }
  
  return null;
}

export default function TimeConverter() {
  const id = useId();
  const [inputStr, setInputStr] = usePersistentState<string>("time-converter-input", "");
  const [includeSeconds, setIncludeSeconds] = usePersistentState<boolean>("time-converter-seconds", false);
  const [canonicalTime, setCanonicalTime] = useState<{h: number; m: number; s: number} | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isAmbiguous, setIsAmbiguous] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    let strToParse = inputStr;
    if (!strToParse) {
      const now = new Date();
      strToParse = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      setInputStr(strToParse);
    }
    
    const parsed = parseSmartTime(strToParse);
    if (parsed) {
      setCanonicalTime({h: parsed.h, m: parsed.m, s: parsed.s});
      setIsAmbiguous(!!parsed.isAmbiguous);
      setParseError(null);
    } else if (strToParse) {
      setCanonicalTime(null);
      setIsAmbiguous(false);
      setParseError("Could not parse time format.");
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputStr(val);
    
    if (!val.trim()) {
      setCanonicalTime(null);
      setIsAmbiguous(false);
      setParseError(null);
      return;
    }

    const parsed = parseSmartTime(val);
    if (parsed) {
      setCanonicalTime({h: parsed.h, m: parsed.m, s: parsed.s});
      setIsAmbiguous(!!parsed.isAmbiguous);
      setParseError(null);
    } else {
      setCanonicalTime(null);
      setIsAmbiguous(false);
      setParseError("Invalid time format.");
    }
  };

  const setTimeFromValues = (h: number, m: number, s: number = 0) => {
    const val = `${pad(h)}:${pad(m)}${s > 0 ? ':' + pad(s) : ''}`;
    setInputStr(val);
    setCanonicalTime({h, m, s});
    setIsAmbiguous(false);
    setParseError(null);
  };

  const handleSetCurrentTime = () => {
    const now = new Date();
    setTimeFromValues(now.getHours(), now.getMinutes(), now.getSeconds());
    toast.success("Set to current local time");
  };

  const handleCopy = async (text: string, key: string, label: string) => {
    try {
      await copyText(text);
      setCopiedKey(key);
      toast.success(`Copied ${label}`);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const adjustMinutes = (delta: number) => {
    if (!canonicalTime) return;
    const { h, m, s } = canonicalTime;
    const totalMinutes = h * 60 + m + delta;
    const wrapped = ((totalMinutes % 1440) + 1440) % 1440;
    const newH = Math.floor(wrapped / 60);
    const newM = wrapped % 60;
    setTimeFromValues(newH, newM, s);
  };

  // Precompute derived values based on canonicalTime
  const time = useMemo(() => {
    if (!canonicalTime) return null;
    const { h: hours24, m: minutes, s: seconds } = canonicalTime;
    const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
    const period = hours24 < 12 ? "AM" : "PM";
    return { hours24, hours12, minutes, seconds, period };
  }, [canonicalTime]);

  const formatted12 = useMemo(() => {
    if (!time) return "--:--";
    const base = `${time.hours12}:${pad(time.minutes)}`;
    return includeSeconds ? `${base}:${pad(time.seconds)} ${time.period}` : `${base} ${time.period}`;
  }, [time, includeSeconds]);

  const formatted24 = useMemo(() => {
    if (!time) return "--:--";
    const base = `${pad(time.hours24)}:${pad(time.minutes)}`;
    return includeSeconds ? `${base}:${pad(time.seconds)}` : base;
  }, [time, includeSeconds]);

  const militaryTime = useMemo(() => {
    if (!time) return "---- hrs";
    const base = `${pad(time.hours24)}${pad(time.minutes)}`;
    return includeSeconds ? `${base}:${pad(time.seconds)} hrs` : `${base} hrs`;
  }, [time, includeSeconds]);

  const militarySpoken = useMemo(
    () => (time ? toMilitaryPronunciation(time.hours24, time.minutes) : ""),
    [time]
  );

  const naturalSpoken = useMemo(
    () => (time ? toNaturalSpoken(time.hours12, time.minutes, time.period as "AM" | "PM", time.hours24) : ""),
    [time]
  );

  const periodDesc = useMemo(
    () => (time ? getPeriodDescription(time.hours24, time.minutes) : "Unknown"),
    [time]
  );

  const PeriodIcon = useMemo(() => (time ? getPeriodIcon(time.hours24) : Clock), [time]);

  const dayProgressPercent = useMemo(() => {
    if (!time) return "0.0";
    const totalSecs = time.hours24 * 3600 + time.minutes * 60 + time.seconds;
    return ((totalSecs / 86400) * 100).toFixed(1);
  }, [time]);

  const totalMinutesPassed = time ? time.hours24 * 60 + time.minutes : 0;
  const decimalHours = time ? (time.hours24 + time.minutes / 60 + time.seconds / 3600).toFixed(2) : "0.00";

  if (!hasMounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-64 rounded-xl border bg-muted/30" />
          <div className="h-64 rounded-xl border bg-card" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleSetCurrentTime}
            className="h-9 gap-1.5 text-xs font-medium"
            title="Fill with current local time"
          >
            <Clock className="size-3.5 text-muted-foreground" />
            <span>Current Time</span>
          </Button>
        </div>
      </div>

      {/* Main Interactive Converter Box */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Input Panel */}
        <div className="flex flex-col space-y-5 rounded-xl border bg-muted/30 p-4 sm:p-5">
          <Field label="Enter a time" htmlFor={`${id}-time-input`} hint="Try: 1430, 2:30 PM, 17:45, 09:00, midnight, noon">
            <TextInput
              id={`${id}-time-input`}
              value={inputStr}
              onChange={handleInputChange}
              placeholder="e.g. 14:30 or 2:30 PM"
              autoComplete="off"
              spellCheck={false}
            />
          </Field>

          {parseError && (
            <p className="text-sm font-medium text-destructive">{parseError}</p>
          )}

          {isAmbiguous && (
            <Notice tone="info">
              The time "{inputStr}" is ambiguous. Showing as {time?.period} by default. You can type "{inputStr} AM" or "{inputStr} PM" to be specific.
            </Notice>
          )}

          {/* Stepper Quick-Adjust Pills */}
          <div className="space-y-1.5 pt-2">
            <span className="text-xs font-medium text-muted-foreground">Quick Steppers</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "-1 hour", delta: -60 },
                { label: "+1 hour", delta: 60 },
                { label: "-15 min", delta: -15 },
                { label: "+15 min", delta: 15 },
                { label: "-30 min", delta: -30 },
                { label: "+30 min", delta: 30 },
              ].map(({ label, delta }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => adjustMinutes(delta)}
                  disabled={!canonicalTime}
                  className="rounded-md border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto">
            {/* Options: Include Seconds toggle */}
            <div className="flex items-center justify-between border-t pt-3">
              <label htmlFor={`${id}-secs-toggle`} className="cursor-pointer text-xs font-medium text-muted-foreground">
                Include seconds in conversion
              </label>
              <input
                id={`${id}-secs-toggle`}
                type="checkbox"
                checked={includeSeconds}
                onChange={(e) => setIncludeSeconds(e.target.checked)}
                className="size-4 rounded border-input text-primary focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Output Showcase Card */}
        <div className="flex flex-col justify-between rounded-xl border bg-card p-4 shadow-soft sm:p-5">
          <div className={cn(!canonicalTime && "opacity-50 grayscale transition-opacity")}>
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Converted Result
              </span>
              {canonicalTime && (
                <div className="flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-foreground">
                  <PeriodIcon className="size-3.5 text-primary" />
                  <span>{periodDesc}</span>
                </div>
              )}
            </div>

            {/* Primary Large Display */}
            <div className="mt-4 space-y-2">
              <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 text-center">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-primary/70 mb-0.5">12-Hour (AM/PM)</span>
                <span className="text-3xl font-extrabold tracking-tight tabular-nums text-foreground sm:text-4xl">
                  {formatted12}
                </span>
              </div>
              <div className="rounded-lg bg-muted/60 border p-3 text-center">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">24-Hour Clock</span>
                <span className="text-3xl font-extrabold tracking-tight tabular-nums text-foreground sm:text-4xl">
                  {formatted24}
                </span>
              </div>
              <p className="text-center text-xs text-muted-foreground italic">
                {canonicalTime ? `"${naturalSpoken}"` : "—"}
              </p>
            </div>

            {/* Formatted breakdown list */}
            <div className="mt-6 space-y-2">
              {[
                {
                  key: "12h",
                  label: "12-Hour (AM/PM)",
                  value: formatted12,
                },
                {
                  key: "24h",
                  label: "24-Hour Clock",
                  value: formatted24,
                },
                {
                  key: "military",
                  label: "Military Time",
                  value: militaryTime,
                  extra: militarySpoken,
                },
              ].map(({ key, label, value, extra }) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-lg border bg-background/60 p-2.5 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0 pr-2">
                    <span className="block text-xs font-medium text-muted-foreground">{label}</span>
                    <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                      {value}
                    </span>
                    {extra && canonicalTime && (
                      <span className="block text-[11px] text-muted-foreground truncate">
                        Phonetic: {extra}
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => canonicalTime && handleCopy(value, key, label)}
                    disabled={!canonicalTime}
                    className="h-8 gap-1 px-2 text-xs font-medium"
                    aria-label={`Copy ${label}`}
                  >
                    {copiedKey === key ? (
                      <>
                        <Check className="size-3.5 text-success" />
                        <span className="text-success text-[11px]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5 text-muted-foreground" />
                        <span className="text-[11px]">Copy</span>
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Day Progress Meter */}
          <div className={cn("mt-6 border-t pt-4", !canonicalTime && "opacity-50")}>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Day Progress</span>
              <span className="font-semibold tabular-nums text-foreground">{dayProgressPercent}%</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, parseFloat(dayProgressPercent)))}%` }}
              />
            </div>
            <p className="mt-1.5 text-right text-[11px] text-muted-foreground">
              {totalMinutesPassed.toLocaleString()} of 1,440 minutes completed
            </p>
          </div>
        </div>
      </div>

      {/* Useful Metrics StatGrid */}
      <div className={cn(!canonicalTime && "opacity-50")}>
        <StatGrid>
          <Stat
            label="24-Hour Time"
            value={formatted24}
            hint={time?.hours24 === 0 ? "Midnight start" : time?.hours24 === 12 ? "Midday noon" : undefined}
          />
          <Stat
            label="12-Hour Time"
            value={formatted12}
            hint={time?.period === "AM" ? "Ante Meridiem (Morning)" : "Post Meridiem (Afternoon/Eve)"}
          />
          <Stat
            label="Military Time"
            value={militaryTime.replace(" hrs", "")}
            hint="4-digit zero-padded"
          />
          <Stat
            label="Decimal Hours"
            value={`${decimalHours} hrs`}
            hint="Useful for payroll & timesheets"
          />
        </StatGrid>
      </div>

      {/* Common Confusions Notice */}
      <Notice tone="info">
        <strong>Remember the 12:00 rule:</strong> <strong>12:00 AM</strong> is midnight (start of the day, 00:00).{" "}
        <strong>12:00 PM</strong> is noon (middle of the day, 12:00). For times between 1:00 PM and 11:59 PM, simply add 12 to find the 24-hour hour (e.g. 7 PM + 12 = 19:00).
      </Notice>

      <ToolDivider />

      {/* Interactive 24-Hour Reference Table / Cheat Sheet */}
      <ToolSection
        title="24-Hour to 12-Hour Conversion Chart"
        description="Click any hour row below to load it directly into the converter."
      >
        <div className="overflow-hidden rounded-xl border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">24-Hour Clock</th>
                  <th scope="col" className="px-4 py-3">12-Hour Clock (AM/PM)</th>
                  <th scope="col" className="px-4 py-3">Military Time</th>
                  <th scope="col" className="px-4 py-3">Period of Day</th>
                  <th scope="col" className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono text-xs">
                {REFERENCE_HOURS.map((row) => {
                  const isCurrentHour = time?.hours24 === row.h24;
                  return (
                    <tr
                      key={row.h24}
                      onClick={() => setTimeFromValues(row.h24, time?.minutes || 0, time?.seconds || 0)}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-accent/60",
                        isCurrentHour ? "bg-brand-subtle font-semibold" : ""
                      )}
                    >
                      <td className="px-4 py-2.5 font-bold text-foreground">
                        {row.formatted24}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-foreground">
                        <span
                          className={cn(
                            "inline-block rounded px-1.5 py-0.5 text-xs font-semibold",
                            row.period === "AM"
                              ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                              : "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200"
                          )}
                        >
                          {row.formatted12}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {row.military}
                      </td>
                      <td className="px-4 py-2.5 font-sans text-muted-foreground">
                        {row.desc}
                      </td>
                      <td className="px-4 py-2.5 text-right font-sans">
                        <button
                          type="button"
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          {isCurrentHour ? "Active" : "Load"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </ToolSection>
    </div>
  );
}
