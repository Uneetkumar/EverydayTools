"use client";

import React, { useEffect, useId, useMemo, useState } from "react";
import { ChevronDown, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Chips,
  Field,
  Notice,
  Segmented,
  SelectInput,
  TextInput,
  ToolDivider,
  ToolSection,
} from "@/components/tool/kit";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { useIsClient } from "@/lib/hooks/useIsClient";
import { copyText } from "@/lib/utils/clipboard";
import {
  DAY_NAMES,
  FLAVOURS,
  buildCron,
  describe,
  describeField,
  fieldRange,
  guessFlavour,
  nextRuns,
  parseCron,
  runsPerDay,
  type BuildFrequency,
  type BuildOptions,
  type Flavour,
} from "@/lib/cron/cron";
import { cn } from "@/lib/utils";

const PRESETS = [
  { label: "Every 5 minutes", cron: "*/5 * * * *" },
  { label: "Every 15 minutes", cron: "*/15 * * * *" },
  { label: "Every hour", cron: "0 * * * *" },
  { label: "Every day at midnight", cron: "0 0 * * *" },
  { label: "Every day at 09:00", cron: "0 9 * * *" },
  { label: "Weekdays at 09:00", cron: "0 9 * * 1-5" },
  { label: "Every 30 min in work hours", cron: "*/30 9-17 * * 1-5" },
  { label: "Every Sunday at 02:00", cron: "0 2 * * 0" },
  { label: "1st of the month", cron: "0 0 1 * *" },
  { label: "Every 6 hours", cron: "0 */6 * * *" },
];

const FREQUENCIES: { value: BuildFrequency; label: string }[] = [
  { value: "minutes", label: "Minutes" },
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const DEFAULT_BUILD: BuildOptions = {
  frequency: "daily",
  every: 15,
  minute: 0,
  time: "09:00",
  days: "weekdays",
  weekdays: [1],
  monthDay: 1,
};

/** Monday-first, as people read a week. */
const WEEK = [1, 2, 3, 4, 5, 6, 0];

const SYNTAX: [string, string, string][] = [
  ["*", "Every value", "* in the hour field is every hour"],
  [",", "A list", "1,15 is the 1st and the 15th"],
  ["-", "A range", "1-5 is Monday to Friday"],
  ["/", "A step", "*/10 is every 10th value from the start"],
  ["JAN–DEC, SUN–SAT", "Names", "Month and day names, in any case"],
  ["@daily, @hourly …", "Shortcuts", "@yearly, @monthly, @weekly, @daily, @hourly, @reboot"],
  ["?", "No specific value", "Quartz and AWS: fills the day field you don't use"],
  ["L", "Last", "L is the last day of the month; 5L the last Friday"],
  ["W", "Nearest weekday", "15W is the weekday closest to the 15th"],
  ["#", "Nth weekday", "MON#1 is the first Monday of the month"],
];

function until(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `in ${Math.max(1, s)} s`;
  const m = Math.round(ms / 60_000);
  if (m < 60) return `in ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return m % 60 ? `in ${h} h ${m % 60} min` : `in ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 45) return h % 24 && d < 3 ? `in ${d} day${d === 1 ? "" : "s"} ${h % 24} h` : `in ${d} days`;
  const months = Math.round(d / 30.44);
  if (months < 24) return `in ${months} months`;
  return `in ${Math.round(d / 365.25)} years`;
}

function localZoneName(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "this device";
  } catch {
    return "this device";
  }
}

export default function CronExplainer() {
  const id = useId();
  const isClient = useIsClient();
  const [expr, setExpr] = usePersistentState<string>("cron-expression", "0 9 * * 1-5");
  const [flavour, setFlavour] = usePersistentState<Flavour>("cron-flavour", "standard");
  const [zone, setZone] = usePersistentState<"local" | "utc">("cron-zone", "local");
  const [mode, setMode] = useState<"explain" | "build">("explain");
  const [build, setBuild] = useState<BuildOptions>(DEFAULT_BUILD);
  const [showSyntax, setShowSyntax] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Keep "in 5 min" current; nothing to do while the tab is hidden.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") setNow(Date.now());
    };
    const timer = window.setInterval(tick, 20_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);

  const cron = useMemo(() => parseCron(expr, flavour), [expr, flavour]);
  const sentence = useMemo(() => describe(cron), [cron]);
  const runs = useMemo(() => (isClient ? nextRuns(cron, new Date(now), 8, zone) : []), [cron, now, zone, isClient]);
  const perDay = runsPerDay(cron);
  const flavourInfo = FLAVOURS.find((f) => f.value === flavour)!;
  const hasSeconds = !!cron.byKey.second;

  const onExprChange = (value: string) => {
    const before = expr.trim().split(/\s+/).length;
    const after = value.trim().split(/\s+/).length;
    // Re-guess the dialect only when the number of fields changes, so a
    // choice made in "Read as" isn't undone while typing.
    if (before !== after || value.trim().startsWith("@")) setFlavour(guessFlavour(value, flavour));
    setExpr(value);
  };

  const applyBuild = (next: BuildOptions, fl: Flavour = flavour) => {
    setBuild(next);
    setExpr(buildCron(next, fl));
  };

  const changeMode = (m: "explain" | "build") => {
    setMode(m);
    if (m === "build") applyBuild(build);
  };

  const changeFlavour = (fl: Flavour) => {
    setFlavour(fl);
    if (mode === "build") applyBuild(build, fl);
  };

  const copy = async () => {
    if (await copyText(cron.source)) toast.success("Cron expression copied");
  };

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: zone === "utc" ? "UTC" : undefined,
      }),
    [zone]
  );
  const timeFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: hasSeconds ? "2-digit" : undefined,
        hourCycle: "h23",
        timeZone: zone === "utc" ? "UTC" : undefined,
      }),
    [zone, hasSeconds]
  );

  const fieldCols =
    cron.fields.length === 7 ? "@3xl:grid-cols-7" : cron.fields.length === 6 ? "@2xl:grid-cols-6" : "@xl:grid-cols-5";

  return (
    <div className="space-y-8">
      <Segmented
        ariaLabel="What do you want to do?"
        value={mode}
        onChange={changeMode}
        options={[
          { value: "explain", label: "Explain an expression" },
          { value: "build", label: "Build a schedule" },
        ]}
      />

      <ToolSection
        title="Cron expression"
        actions={
          <Button variant="outline" size="sm" onClick={copy} disabled={!!cron.errors.length}>
            <Copy aria-hidden="true" /> Copy
          </Button>
        }
      >
        <div className="grid gap-4 @lg:grid-cols-[1fr_16rem]">
          <Field
            label="Expression"
            htmlFor={`${id}-expr`}
            hint={cron.macro ? `${cron.macro.name} is short for ${cron.macro.expands}.` : flavourInfo.note}
          >
            <TextInput
              id={`${id}-expr`}
              value={expr}
              onChange={(e) => onExprChange(e.target.value)}
              placeholder="*/15 9-17 * * 1-5"
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              aria-invalid={cron.errors.length && expr.trim() ? true : undefined}
              className="h-12 font-mono text-lg tracking-wide md:text-lg"
            />
          </Field>
          <Field label="Read as" htmlFor={`${id}-flavour`} hint={flavourInfo.fields}>
            <SelectInput id={`${id}-flavour`} value={flavour} onChange={(e) => changeFlavour(e.target.value as Flavour)}>
              {FLAVOURS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
      </ToolSection>

      {mode === "explain" ? (
        <ToolSection title="Start from a common schedule">
          <Chips
            ariaLabel="Common schedules"
            value={PRESETS.find((p) => p.cron === cron.source)?.cron ?? null}
            onChange={(v) => {
              setFlavour("standard");
              setExpr(v);
            }}
            options={PRESETS.map((p) => ({ value: p.cron, label: p.label }))}
          />
        </ToolSection>
      ) : (
        <ToolSection title="Schedule" description="Choose how often it runs; the expression above updates as you go.">
          <Segmented
            ariaLabel="How often"
            value={build.frequency}
            onChange={(v) => applyBuild({ ...build, frequency: v })}
            options={FREQUENCIES}
            className="flex-wrap"
          />
          <div className="grid gap-4 @md:grid-cols-2">
            {build.frequency === "minutes" && (
              <Field label="Every" htmlFor={`${id}-every`}>
                <SelectInput
                  id={`${id}-every`}
                  value={build.every}
                  onChange={(e) => applyBuild({ ...build, every: Number(e.target.value) })}
                >
                  {[1, 2, 3, 5, 10, 15, 20, 30].map((n) => (
                    <option key={n} value={n}>
                      {n === 1 ? "minute" : `${n} minutes`}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            )}
            {build.frequency === "hourly" && (
              <>
                <Field label="Every" htmlFor={`${id}-every-h`}>
                  <SelectInput
                    id={`${id}-every-h`}
                    value={build.every > 12 ? 1 : build.every}
                    onChange={(e) => applyBuild({ ...build, every: Number(e.target.value) })}
                  >
                    {[1, 2, 3, 4, 6, 8, 12].map((n) => (
                      <option key={n} value={n}>
                        {n === 1 ? "hour" : `${n} hours`}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="At minute" htmlFor={`${id}-minute`} hint="Minutes past the hour, 0–59.">
                  <TextInput
                    id={`${id}-minute`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={59}
                    value={build.minute}
                    onChange={(e) => applyBuild({ ...build, minute: Math.min(59, Math.max(0, Math.floor(Number(e.target.value) || 0))) })}
                  />
                </Field>
              </>
            )}
            {(build.frequency === "daily" || build.frequency === "weekly" || build.frequency === "monthly") && (
              <Field label="At" htmlFor={`${id}-time`} hint="In the time zone the scheduler uses.">
                <TextInput
                  id={`${id}-time`}
                  type="time"
                  value={build.time}
                  onChange={(e) => e.target.value && applyBuild({ ...build, time: e.target.value })}
                />
              </Field>
            )}
            {build.frequency === "monthly" && (
              <Field label="On day" htmlFor={`${id}-mday`} hint={typeof build.monthDay === "number" && build.monthDay > 28 ? "Months without this day are skipped." : undefined}>
                <SelectInput
                  id={`${id}-mday`}
                  value={build.monthDay}
                  onChange={(e) => applyBuild({ ...build, monthDay: e.target.value === "L" ? "L" : Number(e.target.value) })}
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                  {(flavour === "quartz" || flavour === "aws") && <option value="L">Last day of the month</option>}
                </SelectInput>
              </Field>
            )}
          </div>
          {build.frequency === "daily" && (
            <Segmented
              ariaLabel="Which days"
              value={build.days}
              onChange={(v) => applyBuild({ ...build, days: v })}
              options={[
                { value: "all", label: "Every day" },
                { value: "weekdays", label: "Weekdays" },
                { value: "weekends", label: "Weekends" },
              ]}
            />
          )}
          {build.frequency === "weekly" && (
            <div role="group" aria-label="Days of the week" className="flex flex-wrap gap-1.5">
              {WEEK.map((d) => {
                const on = build.weekdays.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      const next = on ? build.weekdays.filter((x) => x !== d) : [...build.weekdays, d];
                      if (next.length) applyBuild({ ...build, weekdays: next });
                    }}
                    className={cn(
                      "h-9 min-w-12 rounded-lg border px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                      on
                        ? "border-primary/50 bg-brand-subtle text-brand-subtle-foreground"
                        : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {DAY_NAMES[d].slice(0, 3)}
                  </button>
                );
              })}
            </div>
          )}
        </ToolSection>
      )}

      <ToolDivider />

      <section aria-live="polite" className="space-y-4">
        {cron.errors.length ? (
          expr.trim() ? (
            <Notice tone="error">
              {cron.errors.length === 1 ? (
                cron.errors[0]
              ) : (
                <ul className="list-disc space-y-0.5 pl-4">
                  {cron.errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              )}
            </Notice>
          ) : (
            <Notice tone="info">{cron.errors[0]}</Notice>
          )
        ) : (
          <div>
            <p className="text-xs font-medium text-muted-foreground">In plain English</p>
            <p className="mt-1 text-lg font-semibold text-pretty text-foreground">{sentence}</p>
          </div>
        )}

        {cron.fields.length > 0 && (
          <dl className={cn("grid grid-cols-2 gap-2 @md:grid-cols-3", fieldCols)}>
            {cron.fields.map((f) => (
              <div
                key={f.key}
                className={cn("min-w-0 rounded-lg border bg-background px-3 py-2.5", f.error && "border-destructive/50 bg-destructive/5")}
              >
                <dt className="text-xs text-muted-foreground">
                  {f.key === "dom" ? "Day of month" : f.key === "dow" ? "Day of week" : f.key[0].toUpperCase() + f.key.slice(1)}
                </dt>
                <dd className="mt-0.5 truncate font-mono text-base font-semibold text-foreground" title={f.text}>
                  {f.text}
                </dd>
                <dd className={cn("mt-0.5 text-xs", f.error ? "text-destructive" : "text-foreground/80")}>{describeField(f)}</dd>
                <dd className="mt-1 text-[11px] text-muted-foreground">{fieldRange(f.key, cron.flavour)}</dd>
              </div>
            ))}
          </dl>
        )}

        {cron.dayRule === "either" && !cron.errors.length && (
          <Notice tone="info">
            Both day fields are set, so cron runs on days that match <strong>either</strong> one, not only days that match both. This is
            how Linux cron, GitHub Actions and Kubernetes behave.
          </Notice>
        )}
        {cron.warnings.map((w) => (
          <Notice key={w} tone="warning">
            {w}
          </Notice>
        ))}
      </section>

      {!cron.errors.length && (
        <ToolSection
          title="Next runs"
          description={!cron.reboot && perDay > 1 ? `Runs ${perDay.toLocaleString()} times on each day it runs.` : undefined}
          actions={
            !cron.reboot && (
              <Segmented
                size="sm"
                ariaLabel="Time zone"
                value={zone}
                onChange={setZone}
                options={[
                  { value: "local", label: "Your time" },
                  { value: "utc", label: "UTC" },
                ]}
              />
            )
          }
        >
          {cron.reboot ? (
            <Notice tone="info">@reboot runs when the machine starts, so there are no times to list.</Notice>
          ) : !isClient ? null : runs.length ? (
            <>
              <ol className="divide-y rounded-lg border">
                {runs.map((r, i) => (
                  <li key={r.getTime()} className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5 px-3.5 py-2.5 text-sm">
                    <span className={cn("w-36 shrink-0", i === 0 ? "font-semibold text-foreground" : "text-foreground")}>
                      {dateFmt.format(r)}
                    </span>
                    <span className="font-mono tabular-nums text-foreground">{timeFmt.format(r)}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{until(r.getTime() - now)}</span>
                  </li>
                ))}
              </ol>
              <p className="text-xs text-muted-foreground">
                {zone === "utc"
                  ? "Shown in UTC, the time zone GitHub Actions, AWS and most cloud schedulers use."
                  : `Shown in your time zone (${localZoneName()}). A server may use a different one — GitHub Actions and AWS use UTC.`}
              </p>
            </>
          ) : (
            <Notice tone="warning">This schedule doesn&apos;t run in the next 30 years, so it probably never runs.</Notice>
          )}
        </ToolSection>
      )}

      <div>
        <button
          type="button"
          aria-expanded={showSyntax}
          onClick={() => setShowSyntax((v) => !v)}
          className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronDown className={cn("size-4 transition-transform", showSyntax && "rotate-180")} aria-hidden="true" />
          Cron syntax cheat sheet
        </button>
        {showSyntax && (
          <div className="mt-3 overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3.5 py-2 font-medium">Symbol</th>
                  <th scope="col" className="px-3.5 py-2 font-medium">Means</th>
                  <th scope="col" className="px-3.5 py-2 font-medium">Example</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {SYNTAX.map(([sym, means, ex]) => (
                  <tr key={sym}>
                    <td className="px-3.5 py-2 font-mono whitespace-nowrap text-foreground">{sym}</td>
                    <td className="px-3.5 py-2 whitespace-nowrap text-foreground">{means}</td>
                    <td className="min-w-48 px-3.5 py-2 text-muted-foreground">{ex}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t px-3.5 py-2 text-xs text-muted-foreground">
              ?, L, W and # work in Quartz and AWS EventBridge but not in Linux crontab or GitHub Actions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
