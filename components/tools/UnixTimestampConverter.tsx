"use client";

import React, { useEffect, useId, useMemo, useState } from "react";
import { ChevronDown, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Notice, Segmented, SelectInput, Stat, StatGrid, TextArea, TextInput, ToolDivider, ToolSection } from "@/components/tool/kit";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { copyText } from "@/lib/utils/clipboard";
import {
  UNITS,
  Y2038_SECONDS,
  dayOfYear,
  epochs,
  isoInZone,
  isoWeek,
  offsetText,
  parseInstant,
  rfc2822,
  sqlUtc,
  timeZones,
  zoneOffset,
  type Unit,
} from "@/lib/time/timestamp";
import { cn } from "@/lib/utils";

function relative(ms: number, now: number): string {
  const diff = Math.round((ms - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const a = Math.abs(diff);
  if (a < 60) return rtf.format(diff, "second");
  if (a < 3600) return rtf.format(Math.trunc(diff / 60), "minute");
  if (a < 86400) return rtf.format(Math.trunc(diff / 3600), "hour");
  if (a < 86400 * 45) return rtf.format(Math.trunc(diff / 86400), "day");
  if (a < 86400 * 365) return rtf.format(Math.trunc(diff / (86400 * 30.44)), "month");
  return rtf.format(Math.trunc(diff / (86400 * 365.25)), "year");
}

/** "YYYY-MM-DDTHH:mm:ss" of an instant in a zone, as <input type="datetime-local"> wants. */
function pickerValue(ms: number, zone: string): string {
  return isoInZone(Math.floor(ms / 1000) * 1000, zone).slice(0, 19);
}

export default function UnixTimestampConverter() {
  const id = useId();
  // The page is prerendered, so the clock is only read in the browser.
  const [now, setNow] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [unit, setUnit] = usePersistentState<Unit | "auto">("timestamp-unit", "auto");
  const [zoneChoice, setZone] = usePersistentState<string>("timestamp-zone", "local");
  const [batch, setBatch] = useState("");
  const [showBatch, setShowBatch] = useState(false);

  const ready = now !== null;
  const localZone = useMemo(() => (ready ? Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" : "UTC"), [ready]);
  const zone = zoneChoice === "local" ? localZone : zoneChoice;
  const zones = useMemo(() => (ready ? timeZones() : []), [ready]);

  useEffect(() => {
    const seed = window.setTimeout(() => {
      const t = Date.now();
      setNow(t);
      setInput((v) => v || String(Math.floor(t / 1000)));
    }, 0);
    const timer = window.setInterval(() => document.visibilityState === "visible" && setNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(seed);
      window.clearInterval(timer);
    };
  }, []);

  const parsed = useMemo(() => (ready ? parseInstant(input, unit, zone) : null), [input, unit, zone, ready]);
  const inst = parsed && !("error" in parsed) ? parsed : null;
  const e = inst ? epochs(inst.ms, inst.ns) : null;

  const rows = useMemo(() => {
    if (!inst || now === null) return [];
    const ms = inst.ms;
    const d = new Date(Math.floor(ms));
    const full = (tz: string) =>
      new Intl.DateTimeFormat(undefined, { dateStyle: "full", timeStyle: "long", timeZone: tz }).format(d);
    const wk = isoWeek(ms);
    const list: { key: string; label: string; value: string }[] = [
      { key: "local", label: `Your time (${localZone})`, value: full(localZone) },
      { key: "utc", label: "UTC", value: full("UTC") },
    ];
    if (zone !== localZone && zone !== "UTC") list.push({ key: "zone", label: zone, value: `${full(zone)}` });
    list.push(
      { key: "iso", label: "ISO 8601 (UTC)", value: isoInZone(ms, "UTC") },
      { key: "iso-local", label: `ISO 8601 (${zone === "UTC" ? localZone : zone})`, value: isoInZone(ms, zone === "UTC" ? localZone : zone) },
      { key: "rfc", label: "RFC 2822 (email, HTTP)", value: rfc2822(ms) },
      { key: "sql", label: "SQL DATETIME (UTC)", value: sqlUtc(ms) },
      { key: "rel", label: "Relative", value: relative(ms, now) },
      { key: "cal", label: "Calendar", value: `Day ${dayOfYear(ms)} of ${d.getUTCFullYear()} · ISO week ${wk.week} of ${wk.year} (UTC)` }
    );
    return list;
  }, [inst, now, zone, localZone]);

  const batchRows = useMemo(() => {
    if (!batch.trim() || !ready) return [];
    return batch
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 500)
      .map((line) => {
        const r = parseInstant(line, unit, zone);
        return { line, r: r && !("error" in r) ? r : null };
      });
  }, [batch, unit, zone, ready]);

  const copy = async (value: string, what = "Copied") => {
    if (await copyText(value)) toast.success(what);
  };

  const secs = e ? Number(e.s) : 0;

  return (
    <div className="space-y-8">
      <StatGrid className="@xl:grid-cols-2">
        <Stat label="Unix time now (seconds)" value={now === null ? "…" : String(Math.floor(now / 1000))} hint="Seconds since 1 January 1970, 00:00 UTC" />
        <Stat label="In milliseconds" value={now === null ? "…" : String(now)} hint="What JavaScript's Date.now() returns" />
      </StatGrid>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" size="sm" disabled={now === null} onClick={() => now !== null && setInput(String(Math.floor(now / 1000)))}>
          Use now
        </Button>
        <Button variant="outline" size="sm" disabled={now === null} onClick={() => now !== null && copy(String(Math.floor(now / 1000)), "Current timestamp copied")}>
          <Copy aria-hidden="true" /> Copy now
        </Button>
      </div>

      <ToolSection title="Convert">
        <Field
          label="Timestamp or date"
          htmlFor={`${id}-in`}
          hint="1790000000, 1790000000123, 2026-09-29T14:30:00Z, 2026-09-29 20:00 or Tue, 29 Sep 2026 14:30:00 GMT."
          error={parsed && "error" in parsed ? parsed.error : undefined}
        >
          <TextInput id={`${id}-in`} value={input} onChange={(ev) => setInput(ev.target.value)} spellCheck={false} autoComplete="off" className="font-mono" />
        </Field>
        <div className="grid gap-4 @lg:grid-cols-2">
          <Field label="Unit of the number" hint={inst?.from === "epoch" && unit === "auto" ? `Read as ${UNITS.find((u) => u.value === inst.unit)!.label.toLowerCase()}, from its number of digits.` : undefined}>
            <Segmented
              size="sm"
              ariaLabel="Unit"
              value={unit}
              onChange={setUnit}
              options={[{ value: "auto", label: "Auto" }, { value: "s", label: "s" }, { value: "ms", label: "ms" }, { value: "us", label: "µs" }, { value: "ns", label: "ns" }]}
            />
          </Field>
          <Field label="Time zone" htmlFor={`${id}-zone`} hint="For dates typed without a zone, the picker and the extra row below.">
            <SelectInput id={`${id}-zone`} value={zoneChoice} onChange={(ev) => setZone(ev.target.value)}>
              <option value="local">Your time zone{now !== null ? ` (${localZone})` : ""}</option>
              <option value="UTC">UTC</option>
              {zones
                .filter((z) => z !== "UTC")
                .map((z) => (
                  <option key={z} value={z}>
                    {z.replace(/_/g, " ")}
                  </option>
                ))}
            </SelectInput>
          </Field>
        </div>
        <Field label={`Pick a date and time (${zone})`} htmlFor={`${id}-picker`}>
          <TextInput
            id={`${id}-picker`}
            type="datetime-local"
            step={1}
            value={inst ? pickerValue(inst.ms, zone) : ""}
            onChange={(ev) => ev.target.value && setInput(ev.target.value)}
            className="w-auto"
          />
        </Field>
      </ToolSection>

      <ToolDivider />

      {inst && e && (
        <>
          <ToolSection title="Timestamps">
            <div className="grid gap-2 @lg:grid-cols-2">
              {UNITS.map((u) => (
                <div key={u.value} className="flex items-center gap-2 rounded-lg border px-3.5 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">{u.label}</p>
                    <p className="font-mono text-sm break-all text-foreground">{e[u.value]}</p>
                  </div>
                  <Button variant="ghost" size="icon-sm" aria-label={`Copy ${u.label.toLowerCase()}`} onClick={() => copy(e[u.value], `${u.label} copied`)}>
                    <Copy aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>
          </ToolSection>

          <ToolSection title="Date and time">
            <ul className="divide-y rounded-lg border">
              {rows.map((r) => (
                <li key={r.key} className="flex items-center gap-3 px-3.5 py-2">
                  <div className="min-w-0 flex-1 @md:flex @md:items-baseline @md:gap-4">
                    <p className="shrink-0 text-xs text-muted-foreground @md:w-48">{r.label}</p>
                    <p className={cn("text-sm break-words text-foreground", /^(iso|rfc|sql)/.test(r.key) && "font-mono")}>{r.value}</p>
                  </div>
                  <Button variant="ghost" size="icon-sm" aria-label={`Copy ${r.label}`} onClick={() => copy(r.value)}>
                    <Copy aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
            {zone !== "UTC" && (
              <p className="text-xs text-muted-foreground">
                {zone} is UTC{offsetText(zoneOffset(inst.ms, zone))} at this moment. Offsets change with daylight saving time.
              </p>
            )}
          </ToolSection>

          {secs > Y2038_SECONDS && (
            <Notice tone="info">
              This is after 19 January 2038, 03:14:07 UTC — too large for a signed 32-bit number of seconds. Old systems that store time that way
              overflow (the “year 2038 problem”); use 64-bit timestamps.
            </Notice>
          )}
          {inst.from === "epoch" && unit === "auto" && inst.unit === "s" && Math.abs(secs) < 1e8 && Number(e.s) !== 0 && (
            <Notice tone="info">This date is in the early 1970s. If you expected something recent, the number may be in a different unit or cut short.</Notice>
          )}
        </>
      )}

      <div>
        <button
          type="button"
          aria-expanded={showBatch}
          onClick={() => setShowBatch((v) => !v)}
          className="inline-flex items-center gap-1 rounded-md text-sm font-semibold text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", showBatch && "rotate-180")} aria-hidden="true" />
          Convert many at once
        </button>
        {showBatch && (
          <div className="mt-3 space-y-3">
            <TextArea aria-label="Timestamps, one per line" rows={5} value={batch} onChange={(ev) => setBatch(ev.target.value)} placeholder={"1790000000\n1790086400123\n2026-09-29T14:30:00Z"} className="font-mono text-sm" />
            {batchRows.length > 0 && (
              <>
                <div className="max-h-96 overflow-auto rounded-lg border">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
                      <tr>
                        <th scope="col" className="px-3 py-2 font-medium">Input</th>
                        <th scope="col" className="px-3 py-2 font-medium">UTC</th>
                        <th scope="col" className="px-3 py-2 font-medium">{zone}</th>
                        <th scope="col" className="px-3 py-2 font-medium">Seconds</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-mono text-xs">
                      {batchRows.map((b, i) => (
                        <tr key={i}>
                          <td className="px-3 py-1.5 break-all text-foreground">{b.line}</td>
                          <td className="px-3 py-1.5 whitespace-nowrap text-foreground">{b.r ? isoInZone(b.r.ms, "UTC") : <span className="text-destructive">Not readable</span>}</td>
                          <td className="px-3 py-1.5 whitespace-nowrap text-foreground">{b.r ? isoInZone(b.r.ms, zone) : ""}</td>
                          <td className="px-3 py-1.5 text-foreground">{b.r ? epochs(b.r.ms, b.r.ns).s : ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() =>
                      copy(
                        ["input,utc,local,seconds", ...batchRows.map((b) => [b.line, b.r ? isoInZone(b.r.ms, "UTC") : "", b.r ? isoInZone(b.r.ms, zone) : "", b.r ? epochs(b.r.ms, b.r.ns).s : ""].map((v) => `"${v.replace(/"/g, '""')}"`).join(","))].join("\n"),
                        "Table copied as CSV"
                      )
                    }
                  >
                    <Copy aria-hidden="true" /> Copy as CSV
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
