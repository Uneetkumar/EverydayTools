"use client";

import React, { useState, useMemo } from "react";
import ResultCard from "@/components/ResultCard";
import { formatNumber } from "@/lib/utils";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { addDays, parseISODate, toISODate, useTodayISO } from "@/lib/utils/date";
import { Calendar, Plus } from "lucide-react";

export default function WorkingDaysCalculator() {
  // Empty means "this month", resolved after mount (the page is prerendered).
  const [startSaved, setStartDate] = usePersistentState<string>("wd_start", "");
  const [endSaved, setEndDate] = usePersistentState<string>("wd_end", "");
  const todayDate = parseISODate(useTodayISO());
  const startDate =
    startSaved || (todayDate ? toISODate(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1)) : "");
  const endDate =
    endSaved || (todayDate ? toISODate(new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0)) : "");
  const [weekendType, setWeekendType] = usePersistentState<string>("wd_weekend", "sat_sun"); // "sat_sun" | "sun_only" | "fri_sat"
  const [hoursPerDay, setHoursPerDay] = usePersistentState<string>("wd_hours", "8");
  const [holidays, setHolidays] = useState<string[]>([]);
  const [newHoliday, setNewHoliday] = useState<string>("");

  const { totalCalendarDays, workingDays, weekendDays, holidayCount, workingHours } = useMemo(() => {
    if (!startDate || !endDate) {
      return { totalCalendarDays: 0, workingDays: 0, weekendDays: 0, holidayCount: 0, workingHours: 0 };
    }

    const start = parseISODate(startDate);
    const end = parseISODate(endDate);

    if (!start || !end || start > end) {
      return { totalCalendarDays: 0, workingDays: 0, weekendDays: 0, holidayCount: 0, workingHours: 0 };
    }

    const holidaySet = new Set(holidays);
    let current = start;
    let totalDays = 0;
    let workDays = 0;
    let weekends = 0;
    let countedHolidays = 0;

    while (current <= end) {
      totalDays++;
      const dayOfWeek = current.getDay(); // 0 = Sun, 6 = Sat, 5 = Fri
      const dateStr = toISODate(current);

      let isWeekend = false;
      if (weekendType === "sat_sun") {
        isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      } else if (weekendType === "sun_only") {
        isWeekend = dayOfWeek === 0;
      } else if (weekendType === "fri_sat") {
        isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
      }

      if (isWeekend) {
        weekends++;
      } else if (holidaySet.has(dateStr)) {
        countedHolidays++;
      } else {
        workDays++;
      }

      current = addDays(current, 1);
    }

    const hrs = parseFloat(hoursPerDay) || 8;

    return {
      totalCalendarDays: totalDays,
      workingDays: workDays,
      weekendDays: weekends,
      holidayCount: countedHolidays,
      workingHours: workDays * hrs,
    };
  }, [startDate, endDate, weekendType, holidays, hoursPerDay]);

  const ps = parseISODate(startDate);
  const pe = parseISODate(endDate);
  const rangeReversed = !!(ps && pe && ps > pe);

  const addHoliday = () => {
    if (newHoliday && !holidays.includes(newHoliday)) {
      setHolidays([...holidays, newHoliday].sort());
      setNewHoliday("");
    }
  };

  const removeHoliday = (date: string) => {
    setHolidays(holidays.filter((d) => d !== date));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Date Inputs & Options */}
        <div className="lg:col-span-6 space-y-4 p-5 sm:p-6 rounded-xl border bg-muted/30">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            Date Range & Working Schedule
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="wd-start-input" className="text-sm font-medium text-foreground">
                Start Date
              </label>
              <input
                id="wd-start-input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="wd-end-input" className="text-sm font-medium text-foreground">
                End Date (Inclusive)
              </label>
              <input
                id="wd-end-input"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="wd-weekend-select" className="text-sm font-medium text-foreground">
                Weekend Days
              </label>
              <select
                id="wd-weekend-select"
                value={weekendType}
                onChange={(e) => setWeekendType(e.target.value)}
                className="w-full px-3 py-2.5 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="sat_sun">Saturday & Sunday (Standard)</option>
                <option value="sun_only">Sunday Only (6-Day Week)</option>
                <option value="fri_sat">Friday & Saturday (Middle East)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="wd-hours-input" className="text-sm font-medium text-foreground">
                Work Hours / Day
              </label>
              <input
                id="wd-hours-input"
                type="number"
                min="1"
                max="24"
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(e.target.value)}
                className="w-full px-3 py-2.5 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                placeholder="8"
              />
            </div>
          </div>

          {/* Custom Holidays List */}
          <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
            <label className="text-sm font-medium text-foreground">
              Exclude Custom Public Holidays
            </label>
            <div className="flex gap-2">
              <input aria-label="Holiday date to exclude"
                type="date"
                value={newHoliday}
                onChange={(e) => setNewHoliday(e.target.value)}
                className="flex-1 px-3 py-2 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <button
                type="button"
                onClick={addHoliday}
                disabled={!newHoliday}
                className="flex items-center gap-1 px-3 py-2 rounded-lg disabled:opacity-50 text-xs transition-colors bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {holidays.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {holidays.map((h) => (
                  <span
                    key={h}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
                  >
                    {h}
                    <button
                      onClick={() => removeHoliday(h)}
                      className="text-slate-500 dark:text-slate-400 hover:text-rose-500 transition-colors ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-6 space-y-4">
          <ResultCard
            title="Total Business / Working Days"
            value={rangeReversed ? "—" : `${workingDays} ${workingDays === 1 ? "day" : "days"}`}
            subtitle={
              rangeReversed
                ? "The end date is before the start date. Swap them to count the working days."
                : `${totalCalendarDays} calendar days − ${weekendDays} weekend days − ${holidayCount} holidays (both dates included)`
            }
            highlightColor="emerald"
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl border bg-muted/30">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Working Hours</span>
              <p className="text-xl font-semibold mt-1 font-mono text-foreground">
                {formatNumber(workingHours)} hrs
              </p>
              <span className="text-xs text-slate-500 dark:text-slate-400">At {hoursPerDay}h per working day</span>
            </div>

            <div className="p-4 rounded-xl border bg-muted/30">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Calendar Duration</span>
              <p className="text-xl font-semibold text-slate-900 dark:text-white mt-1 font-mono">
                {totalCalendarDays} Days
              </p>
              <span className="text-xs text-slate-500 dark:text-slate-400">{(totalCalendarDays / 7).toFixed(1)} Weeks</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border space-y-2 text-xs bg-muted/30">
            <span className="text-slate-900 dark:text-white text-sm font-semibold">
              Days Distribution Summary
            </span>
            <div className="space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800 pt-1">
              <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                <span>Working Days</span>
                <span className="font-mono font-semibold text-foreground">{workingDays} days ({totalCalendarDays > 0 ? ((workingDays / totalCalendarDays) * 100).toFixed(0) : 0}%)</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                <span>Weekend Days Off</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">{weekendDays} days</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                <span>Public Holidays Excluded</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">{holidayCount} days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
