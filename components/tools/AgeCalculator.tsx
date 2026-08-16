"use client";

import React, { useState } from "react";
import ResultCard from "@/components/ResultCard";
import { formatNumber } from "@/lib/utils";
import { Cake, Calendar, Heart, Clock, Sparkles } from "lucide-react";

export default function AgeCalculator() {
  const [birthDate, setBirthDate] = useState<string>("2000-01-15");
  const [targetDate, setTargetDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const b = new Date(birthDate);
  const t = new Date(targetDate);

  let years = 0;
  let months = 0;
  let days = 0;
  let totalDays = 0;
  let daysToNextBday = 0;
  let nextBdayDayOfWeek = "";

  if (!isNaN(b.getTime()) && !isNaN(t.getTime()) && t >= b) {
    totalDays = Math.floor((t.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));

    years = t.getFullYear() - b.getFullYear();
    months = t.getMonth() - b.getMonth();
    days = t.getDate() - b.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonthLastDay = new Date(t.getFullYear(), t.getMonth(), 0).getDate();
      days += prevMonthLastDay;
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    // Next Birthday calculation
    const nextBday = new Date(t.getFullYear(), b.getMonth(), b.getDate());
    if (nextBday < t) {
      nextBday.setFullYear(t.getFullYear() + 1);
    }
    daysToNextBday = Math.ceil((nextBday.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
    nextBdayDayOfWeek = nextBday.toLocaleDateString("en-US", { weekday: "long" });
  }

  const hoursLived = totalDays * 24;
  const minutesLived = hoursLived * 60;
  const approxHeartbeats = totalDays * 24 * 60 * 75; // 75 bpm average

  return (
    <div className="space-y-6">
      {/* Date Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Date of Birth
          </label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Age on Date
          </label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Main Age Result */}
      <ResultCard
        title="Exact Age"
        value={`${years} Years`}
        subtitle={`${months} Months, ${days} Days old`}
        details={[
          { label: "Total Days Lived", value: formatNumber(totalDays, 0) },
          { label: "Total Hours", value: `${formatNumber(hoursLived, 0)} hrs` },
          { label: "Next Birthday In", value: `${daysToNextBday} days (${nextBdayDayOfWeek})` },
          { label: "Approx. Heartbeats", value: `~${(approxHeartbeats / 1e6).toFixed(1)} Million` },
          { label: "Born On", value: !isNaN(b.getTime()) ? b.toLocaleDateString("en-US", { weekday: "long" }) : "" },
        ]}
        highlightColor="indigo"
        showConfetti={daysToNextBday === 0}
      />
    </div>
  );
}
