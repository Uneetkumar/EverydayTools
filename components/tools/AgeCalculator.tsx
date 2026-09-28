"use client";

import React, { useState } from "react";
import ResultCard from "@/components/ResultCard";
import { formatNumber } from "@/lib/utils";
import { daysBetween, parseISODate, useTodayISO } from "@/lib/utils/date";
import { Cake, Calendar, Heart, Clock, Sparkles } from "lucide-react";

export default function AgeCalculator() {
  const [birthDate, setBirthDate] = useState<string>("2000-01-15");
  // null = "today", resolved after mount so the prerendered page does not
  // carry the build date.
  const [targetOverride, setTargetDate] = useState<string | null>(null);
  const today = useTodayISO();
  const targetDate = targetOverride ?? today;

  const b = parseISODate(birthDate);
  const t = parseISODate(targetDate);
  const beforeBirth = !!(b && t && t < b);

  let years = 0;
  let months = 0;
  let days = 0;
  let totalDays = 0;
  let daysToNextBday = 0;
  let nextBdayDayOfWeek = "";

  if (b && t && t >= b) {
    totalDays = daysBetween(b, t);

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

    // Next birthday. A 29 February birthday falls on 1 March in other years.
    const nextBday = new Date(t.getFullYear(), b.getMonth(), b.getDate());
    if (nextBday < t) {
      nextBday.setFullYear(t.getFullYear() + 1);
    }
    daysToNextBday = daysBetween(t, nextBday);
    nextBdayDayOfWeek = nextBday.toLocaleDateString("en-US", { weekday: "long" });
  }

  const hoursLived = totalDays * 24;
  const minutesLived = hoursLived * 60;
  const approxHeartbeats = totalDays * 24 * 60 * 75; // 75 bpm average

  return (
    <div className="space-y-6">
      {/* Date Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-xl border bg-muted/30">
        <div>
          <label htmlFor="age-dob" className="block text-sm mb-1.5 font-medium text-foreground">
            Date of Birth
          </label>
          <input
            id="age-dob"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full px-3.5 py-2.5 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        <div>
          <label htmlFor="age-on-date" className="block text-sm mb-1.5 font-medium text-foreground">
            Age on Date
          </label>
          <input
            id="age-on-date"
            type="date"
            value={targetDate}
            max="9999-12-31"
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full px-3.5 py-2.5 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </div>

      {/* Main Age Result */}
      <ResultCard
        title="Exact Age"
        value={!b || !t ? "—" : beforeBirth ? "Not born yet" : `${years} ${years === 1 ? "year" : "years"}`}
        subtitle={
          !b
            ? "Enter a date of birth."
            : !t
              ? "Enter the date to calculate the age on."
              : beforeBirth
                ? "The date you chose is before the date of birth."
                : `${months} ${months === 1 ? "month" : "months"}, ${days} ${days === 1 ? "day" : "days"}`
        }
        details={
          b && t && !beforeBirth
            ? [
                { label: "Total days lived", value: formatNumber(totalDays, 0) },
                { label: "Total hours", value: `${formatNumber(hoursLived, 0)} hrs` },
                {
                  label: "Next birthday",
                  value: daysToNextBday === 0 ? "Today!" : `In ${daysToNextBday} days (${nextBdayDayOfWeek})`,
                },
                { label: "Approx. heartbeats", value: `~${(approxHeartbeats / 1e6).toFixed(1)} million` },
                { label: "Born on a", value: b.toLocaleDateString("en-US", { weekday: "long" }) },
              ]
            : []
        }
        highlightColor="indigo"
      />
    </div>
  );
}
