"use client";

import React, { useEffect, useId, useMemo, useState } from "react";
import { Moon, Plus, Sun, Sunrise, Sunset, X } from "lucide-react";
import { toast } from "sonner";
import { Field, Notice, Segmented, SelectInput, TextInput, ToggleRow, ToolDivider, ToolSection } from "@/components/tool/kit";
import { Button } from "@/components/ui/button";
import { useNow } from "@/lib/hooks/useNow";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { copyText } from "@/lib/utils/clipboard";
import { wallToInstant } from "@/lib/time/timestamp";
import { CITIES, getCity, isValidZone, localZone, offsetLabel, plan, relativeDay, searchCities, zoneClock, dayPart, formatTime, type ZoneClock } from "@/lib/time/zones";
import { wallClock } from "@/lib/time/timers";
import { cn } from "@/lib/utils";

/** What a saved clock refers to: a known city, or any IANA zone name. */
interface Place {
  id: string;
  name: string;
  zone: string;
}

const DEFAULT_IDS = ["london", "new-york", "delhi", "tokyo", "sydney"];

function placeFromCity(id: string): Place | null {
  const c = getCity(id);
  return c ? { id: c.id, name: c.name, zone: c.zone } : null;
}

const PART_ICON = { night: Moon, morning: Sunrise, day: Sun, evening: Sunset } as const;

function ClockCard({ place, clock, home, hour12, seconds, onRemove }: { place: Place; clock: ZoneClock; home: ZoneClock; hour12: boolean; seconds: boolean; onRemove?: () => void }) {
  const Icon = PART_ICON[dayPart(clock.hour)];
  const diffHours = (clock.offsetMin - home.offsetMin) / 60;
  return (
    <div className="relative rounded-xl border bg-background p-4">
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Remove ${place.name}`} className="absolute top-2 right-2 rounded-md p-1 text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50">
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
      <div className="flex items-center gap-2 pr-6">
        <Icon aria-hidden="true" className={cn("size-4 shrink-0", clock.hour >= 6 && clock.hour < 18 ? "text-warning" : "text-muted-foreground")} />
        <h3 className="truncate text-sm font-semibold text-foreground">{place.name}</h3>
      </div>
      <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums text-foreground">
        {formatTime(clock, { hour12, seconds })}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {clock.weekday}, {new Date(`${clock.date}T12:00:00Z`).toLocaleDateString([], { day: "numeric", month: "short", timeZone: "UTC" })}
        {place.id !== "local" && ` · ${relativeDay(clock.date, home.date)}`}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        {offsetLabel(clock.offsetMin)} · {clock.abbr}
        {clock.dst ? " · daylight saving" : ""}
        {diffHours !== 0 && ` · ${diffHours > 0 ? "+" : "−"}${Math.abs(diffHours)} h from you`}
      </p>
    </div>
  );
}

export default function WorldClock() {
  const id = useId();
  const [tab, setTab] = useState<"clocks" | "planner">("clocks");
  const [ids, setIds] = usePersistentState<string[]>("world-clock-places", DEFAULT_IDS);
  const [custom, setCustom] = usePersistentState<Place[]>("world-clock-custom", []);
  const [hour12, setHour12] = usePersistentState<boolean>("world-clock-12h", true);
  const [seconds, setSeconds] = usePersistentState<boolean>("world-clock-seconds", false);
  const [query, setQuery] = useState("");
  const [home, setHome] = useState("UTC");
  const now = useNow(true, 1000);

  useEffect(() => {
    const t = setTimeout(() => setHome(localZone()), 0);
    return () => clearTimeout(t);
  }, []);

  const places: Place[] = useMemo(() => [...ids.map(placeFromCity).filter((p): p is Place => !!p), ...custom], [ids, custom]);
  // Until the page is live in the browser there is no "now", and the prerendered HTML must not contain one.
  const ready = now > 0;
  const at = ready ? now : 0;
  const homeClock = zoneClock(at, home);
  const matches = useMemo(() => (query.trim() ? searchCities(query).filter((c) => !ids.includes(c.id)).slice(0, 8) : []), [query, ids]);

  const addCity = (cityId: string) => {
    setIds([...ids, cityId]);
    setQuery("");
  };
  const addZone = () => {
    const z = query.trim();
    if (!isValidZone(z)) {
      toast.error("That is not a time-zone name", { description: "Use an IANA name such as Asia/Kolkata or America/Denver." });
      return;
    }
    if (custom.some((c) => c.zone === z)) return;
    setCustom([...custom, { id: `zone:${z}`, name: z.replace(/_/g, " ").split("/").pop() ?? z, zone: z }]);
    setQuery("");
  };

  // ----- planner
  const [date, setDate] = useState("");
  const [workStart, setWorkStart] = useState(9);
  const [workEnd, setWorkEnd] = useState(18);
  const [pick, setPick] = useState<number | null>(null);
  const [baseZone, setBaseZone] = useState("");
  const base = baseZone || home;

  // Start on today's date in the base zone once it is known.
  useEffect(() => {
    if (date) return;
    const t = setTimeout(() => setDate(zoneClock(wallClock(), home).date), 0);
    return () => clearTimeout(t);
  }, [date, home]);

  const plannerZones = useMemo(() => [{ id: "base", name: base === home ? "You" : (places.find((p) => p.zone === base)?.name ?? base), zone: base }, ...places.filter((p) => p.zone !== base)], [base, home, places]);
  const grid = useMemo(() => (date ? plan(date, base, plannerZones.map((p) => p.zone), workStart, workEnd) : []), [date, base, plannerZones, workStart, workEnd]);
  const best = useMemo(() => {
    const top = Math.max(0, ...grid.map((r) => r.score));
    if (top === 0) return null;
    const hours = grid.filter((r) => r.score === top).map((r) => r.hourInHome);
    return { score: top, hours };
  }, [grid]);

  const fmtRange = (hours: number[]) => {
    const runs: [number, number][] = [];
    for (const h of hours) {
      const last = runs[runs.length - 1];
      if (last && last[1] === h - 1) last[1] = h;
      else runs.push([h, h]);
    }
    return runs.map(([a, b]) => `${formatTime({ hour: a, minute: 0, second: 0 }, { hour12 })}–${formatTime({ hour: (b + 1) % 24, minute: 0, second: 0 }, { hour12 })}`).join(", ");
  };

  const picked = pick !== null ? grid[pick] : null;
  const summary = picked
    ? plannerZones
        .map((p, i) => {
          const c = picked.cells[i];
          return `${p.name}: ${formatTime({ hour: c.hour, minute: c.minute, second: 0 }, { hour12 })}${c.dayShift ? ` (${c.dayShift > 0 ? "+" : ""}${c.dayShift} day)` : ""}`;
        })
        .join("\n")
    : "";

  const hourCells = Array.from({ length: 24 }, (_, h) => h);

  return (
    <div className="space-y-8">
      <Segmented ariaLabel="View" value={tab} onChange={setTab} options={[{ value: "clocks", label: "World clocks" }, { value: "planner", label: "Meeting planner" }]} />

      {tab === "clocks" && (
        <>
          <ToolSection title="Times now">
            <div className="grid gap-3 @md:grid-cols-2 @3xl:grid-cols-3">
              {!ready && Array.from({ length: places.length + 1 }, (_, i) => <div key={i} className="h-36 animate-pulse rounded-xl border bg-muted/30" aria-hidden="true" />)}
              {ready && <ClockCard place={{ id: "local", name: "Your time zone", zone: home }} clock={homeClock} home={homeClock} hour12={hour12} seconds={seconds} />}
              {ready && places.map((p) => (
                <ClockCard
                  key={p.id}
                  place={p}
                  clock={zoneClock(at, p.zone)}
                  home={homeClock}
                  hour12={hour12}
                  seconds={seconds}
                  onRemove={() => (p.id.startsWith("zone:") ? setCustom(custom.filter((c) => c.id !== p.id)) : setIds(ids.filter((x) => x !== p.id)))}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Times and daylight-saving changes come from your browser&apos;s time-zone database. Your own zone is {home}.</p>
          </ToolSection>

          <ToolSection title="Add a city or time zone">
            <div className="flex flex-wrap items-end gap-2">
              <Field label="City, country or zone name" htmlFor={`${id}-add`} className="min-w-56 flex-1">
                <TextInput id={`${id}-add`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type Tokyo, Brazil or Asia/Kolkata" list={`${id}-zones`} spellCheck={false} autoComplete="off" />
              </Field>
              {query.includes("/") && (
                <Button type="button" variant="outline" onClick={addZone}>
                  <Plus aria-hidden="true" /> Add zone
                </Button>
              )}
            </div>
            {matches.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {matches.map((c) => (
                  <li key={c.id}>
                    <button type="button" onClick={() => addCity(c.id)} className="inline-flex items-center gap-1 rounded-full border bg-background px-3 py-1 text-sm text-foreground transition-colors hover:bg-muted">
                      <Plus className="size-3.5" aria-hidden="true" /> {c.name} <span className="text-xs text-muted-foreground">{c.country}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {!query && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Popular</span>
                {CITIES.filter((c) => !ids.includes(c.id) && ["dubai", "singapore", "los-angeles", "paris", "berlin", "toronto", "auckland", "utc"].includes(c.id)).map((c) => (
                  <button key={c.id} type="button" onClick={() => addCity(c.id)} className="rounded-full border bg-background px-2.5 py-0.5 text-xs text-foreground transition-colors hover:bg-muted">
                    {c.name}
                  </button>
                ))}
              </div>
            )}
            <datalist id={`${id}-zones`}>
              {(typeof Intl !== "undefined" && "supportedValuesOf" in Intl ? (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf("timeZone") : []).map((z) => (
                <option key={z} value={z} />
              ))}
            </datalist>
          </ToolSection>

          <ToolSection title="Display">
            <div className="grid gap-3 @md:grid-cols-2">
              <ToggleRow id={`${id}-12h`} label="12-hour clock" description="AM and PM instead of 24-hour time." checked={hour12} onCheckedChange={setHour12} />
              <ToggleRow id={`${id}-sec`} label="Show seconds" checked={seconds} onCheckedChange={setSeconds} />
            </div>
          </ToolSection>
        </>
      )}

      {tab === "planner" && (
        <>
          <ToolSection title="Find a time that works" description="Each row is a place, each column an hour of the day you choose. Green is inside working hours. Select a column to see the time everywhere.">
            <div className="grid gap-4 @md:grid-cols-4">
              <Field label="Date" htmlFor={`${id}-date`}>
                <input id={`${id}-date`} type="date" value={date} onChange={(e) => { setDate(e.target.value); setPick(null); }} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30" />
              </Field>
              <Field label="Columns are hours in" htmlFor={`${id}-base`}>
                <SelectInput id={`${id}-base`} value={base} onChange={(e) => { setBaseZone(e.target.value); setPick(null); }}>
                  <option value={home}>Your time zone</option>
                  {places.map((p) => (
                    <option key={p.id} value={p.zone}>
                      {p.name}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Working day starts" htmlFor={`${id}-ws`}>
                <SelectInput id={`${id}-ws`} value={workStart} onChange={(e) => setWorkStart(Number(e.target.value))}>
                  {hourCells.slice(5, 13).map((h) => (
                    <option key={h} value={h}>
                      {formatTime({ hour: h, minute: 0, second: 0 }, { hour12 })}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Working day ends" htmlFor={`${id}-we`}>
                <SelectInput id={`${id}-we`} value={workEnd} onChange={(e) => setWorkEnd(Number(e.target.value))}>
                  {hourCells.slice(14, 24).map((h) => (
                    <option key={h} value={h}>
                      {formatTime({ hour: h, minute: 0, second: 0 }, { hour12 })}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            </div>

            {plannerZones.length < 2 ? (
              <Notice tone="info">Add a city on the World clocks tab to compare times.</Notice>
            ) : (
              <>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full min-w-[56rem] border-collapse text-center text-[11px] tabular-nums">
                    <thead>
                      <tr className="bg-muted text-muted-foreground">
                        <th scope="col" className="sticky left-0 z-10 min-w-28 bg-muted px-2 py-1.5 text-left text-xs font-medium">Place</th>
                        {grid.map((r) => (
                          <th key={r.hourInHome} scope="col" className="p-0 font-medium">
                            <button type="button" onClick={() => setPick(pick === r.hourInHome ? null : r.hourInHome)} aria-pressed={pick === r.hourInHome} aria-label={`Hour ${r.hourInHome} in the base time zone`} className={cn("w-full px-0.5 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring/50", pick === r.hourInHome && "bg-primary/15 text-foreground")}>
                              {r.hourInHome}
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {plannerZones.map((p, row) => (
                        <tr key={p.id} className="border-t">
                          <th scope="row" className="sticky left-0 z-10 max-w-36 truncate bg-card px-2 py-1.5 text-left text-xs font-medium text-foreground">
                            {p.name}
                          </th>
                          {grid.map((r) => {
                            const c = r.cells[row];
                            const all = r.score === plannerZones.length;
                            return (
                              <td key={r.hourInHome} className={cn("border-l px-0.5 py-1.5", c.working ? (all ? "bg-success/25 font-semibold text-foreground" : "bg-success/10 text-foreground") : dayPart(c.hour) === "night" ? "bg-muted/70 text-muted-foreground" : "text-muted-foreground", pick === r.hourInHome && "ring-1 ring-primary/50 ring-inset")}>
                                {c.hour}
                                {c.dayShift !== 0 && <sup className="ml-px text-[9px]">{c.dayShift > 0 ? "+" : "−"}</sup>}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground">Numbers are the local hour (24-hour). A small + or − marks the next or previous day. Dark cells are night (9 pm to 6 am).</p>
                {best && (
                  <p className="text-sm text-foreground">
                    {best.score === plannerZones.length ? "Everyone is in working hours at" : `Best overlap (${best.score} of ${plannerZones.length} in working hours) at`} <strong className="font-semibold">{fmtRange(best.hours)}</strong> in {base === home ? "your time zone" : plannerZones[0].name}.
                  </p>
                )}
                {!best && <Notice tone="warning">These places do not share working hours on that day. Try widening the working day.</Notice>}
              </>
            )}
          </ToolSection>

          {picked && (
            <>
              <ToolDivider />
              <ToolSection title={`At ${formatTime({ hour: picked.hourInHome, minute: 0, second: 0 }, { hour12 })} ${base === home ? "your time" : plannerZones[0].name}`}>
                <ul className="divide-y rounded-lg border">
                  {plannerZones.map((p, i) => {
                    const c = picked.cells[i];
                    return (
                      <li key={p.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm">
                        <span className="text-foreground">{p.name}</span>
                        <span className="tabular-nums text-foreground">
                          {formatTime({ hour: c.hour, minute: c.minute, second: 0 }, { hour12 })}
                          {c.dayShift !== 0 && <span className="ml-1.5 text-xs text-muted-foreground">{c.dayShift > 0 ? "next day" : "previous day"}</span>}
                          <span className={cn("ml-2 rounded-full px-2 py-0.5 text-xs", c.working ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>{c.working ? "working hours" : dayPart(c.hour) === "night" ? "night" : "outside hours"}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const d = new Date(wallToInstant(Number(date.slice(0, 4)), Number(date.slice(5, 7)), Number(date.slice(8, 10)), picked.hourInHome, 0, 0, 0, base));
                    if (await copyText(`${d.toUTCString()}\n${summary}`)) toast.success("Copied");
                  }}
                >
                  Copy this schedule
                </Button>
              </ToolSection>
            </>
          )}
        </>
      )}
    </div>
  );
}
