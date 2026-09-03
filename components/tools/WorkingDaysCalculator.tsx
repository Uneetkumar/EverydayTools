"use client";

import React, { useState, useMemo } from "react";
import ResultCard from "@/components/ResultCard";
import { formatNumber } from "@/lib/utils";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { Calendar, Plus } from "lucide-react";

export default function WorkingDaysCalculator() {
  const [startDate, setStartDate] = usePersistentState<string>("wd_start", "2026-09-01");
  const [endDate, setEndDate] = usePersistentState<string>("wd_end", "2026-09-30");
  const [weekendType, setWeekendType] = usePersistentState<string>("wd_weekend", "sat_sun"); // "sat_sun" | "sun_only" | "fri_sat"
  const [hoursPerDay, setHoursPerDay] = usePersistentState<string>("wd_hours", "8");
  const [holidays, setHolidays] = useState<string[]>([]);
  const [newHoliday, setNewHoliday] = useState<string>("");

  const { totalCalendarDays, workingDays, weekendDays, holidayCount, workingHours } = useMemo(() => {
    if (!startDate || !endDate) {
      return { totalCalendarDays: 0, workingDays: 0, weekendDays: 0, holidayCount: 0, workingHours: 0 };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return { totalCalendarDays: 0, workingDays: 0, weekendDays: 0, holidayCount: 0, workingHours: 0 };
    }

    const holidaySet = new Set(holidays);
    const current = new Date(start);
    let totalDays = 0;
    let workDays = 0;
    let weekends = 0;
    let countedHolidays = 0;

    while (current <= end) {
      totalDays++;
      const dayOfWeek = current.getDay(); // 0 = Sun, 6 = Sat, 5 = Fri
      const dateStr = current.toISOString().split("T")[0];

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

      current.setDate(current.getDate() + 1);
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
        <div className="lg:col-span-6 space-y-4 p-5 sm:p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Date Range & Working Schedule
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="wd-start-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Start Date
              </label>
              <input
                id="wd-start-input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="wd-end-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                End Date (Inclusive)
              </label>
              <input
                id="wd-end-input"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="wd-weekend-select" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Weekend Days
              </label>
              <select
                id="wd-weekend-select"
                value={weekendType}
                onChange={(e) => setWeekendType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value="sat_sun">Saturday & Sunday (Standard)</option>
                <option value="sun_only">Sunday Only (6-Day Week)</option>
                <option value="fri_sat">Friday & Saturday (Middle East)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="wd-hours-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Work Hours / Day
              </label>
              <input
                id="wd-hours-input"
                type="number"
                min="1"
                max="24"
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="8"
              />
            </div>
          </div>

          {/* Custom Holidays List */}
          <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Exclude Custom Public Holidays
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={newHoliday}
                onChange={(e) => setNewHoliday(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={addHoliday}
                disabled={!newHoliday}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors"
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
                      className="text-slate-400 hover:text-rose-500 transition-colors ml-1"
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
            value={`${workingDays} Days`}
            subtitle={`${totalCalendarDays} Total Days - ${weekendDays} Weekend Days - ${holidayCount} Public Holidays`}
            highlightColor="emerald"
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Working Hours</span>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1 font-mono">
                {formatNumber(workingHours)} hrs
              </p>
              <span className="text-[11px] text-slate-400">At {hoursPerDay}h per working day</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Calendar Duration</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
                {totalCalendarDays} Days
              </p>
              <span className="text-[11px] text-slate-400">{(totalCalendarDays / 7).toFixed(1)} Weeks</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <span className="font-bold text-slate-900 dark:text-white uppercase text-[11px] tracking-wider">
              Days Distribution Summary
            </span>
            <div className="space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800 pt-1">
              <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                <span>Working Days</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{workingDays} days ({totalCalendarDays > 0 ? ((workingDays / totalCalendarDays) * 100).toFixed(0) : 0}%)</span>
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
