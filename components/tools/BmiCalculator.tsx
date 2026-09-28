"use client";

import React, { useState } from "react";
import ResultCard from "@/components/ResultCard";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { Scale, Heart, Sparkles, Activity, CheckCircle2 } from "lucide-react";

export default function BmiCalculator() {
  const [unitSystem, setUnitSystem] = usePersistentState<"metric" | "imperial">("bmi_unit", "metric");
  const [age, setAge] = usePersistentState<string>("bmi_age", "25");
  const [gender, setGender] = usePersistentState<"male" | "female">("bmi_gender", "male");

  // Metric: cm & kg
  const [heightCm, setHeightCm] = usePersistentState<string>("bmi_height_cm", "175");
  const [weightKg, setWeightKg] = usePersistentState<string>("bmi_weight_kg", "70");

  // Imperial: ft + in & lbs
  const [heightFt, setHeightFt] = usePersistentState<string>("bmi_height_ft", "5");
  const [heightIn, setHeightIn] = usePersistentState<string>("bmi_height_in", "9");
  const [weightLbs, setWeightLbs] = usePersistentState<string>("bmi_weight_lbs", "154");

  let hMeters = 0;
  let wKg = 0;

  if (unitSystem === "metric") {
    hMeters = (parseFloat(heightCm) || 0) / 100;
    wKg = parseFloat(weightKg) || 0;
  } else {
    const totalInches = (parseFloat(heightFt) || 0) * 12 + (parseFloat(heightIn) || 0);
    hMeters = totalInches * 0.0254;
    wKg = (parseFloat(weightLbs) || 0) * 0.45359237;
  }

  const bmi = hMeters > 0 && wKg > 0 ? wKg / (hMeters * hMeters) : 0;

  // WHO adult classification.
  const hasResult = bmi > 0 && Number.isFinite(bmi);
  let category = "";
  let categoryColor = "text-muted-foreground";
  let categoryBg = "bg-muted border-border";
  let advice = "Enter your height and weight to see your BMI.";

  if (!hasResult) {
    // empty state: keep the defaults above
  } else if (bmi < 18.5) {
    category = "Underweight";
    categoryColor = "text-amber-700 dark:text-amber-400";
    categoryBg = "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800";
    advice = "Your BMI is below the healthy range. A doctor or dietitian can check whether that matters for you.";
  } else if (bmi < 25) {
    category = "Healthy weight";
    categoryColor = "text-emerald-700 dark:text-emerald-400";
    categoryBg = "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800";
    advice = "Your BMI is in the healthy range for your height.";
  } else if (bmi < 30) {
    category = "Overweight";
    categoryColor = "text-orange-700 dark:text-orange-400";
    categoryBg = "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800";
    advice = "Your BMI is above the healthy range. BMI does not distinguish muscle from fat, so very muscular people can score high.";
  } else if (bmi < 35) {
    category = "Obesity (class I)";
    categoryColor = "text-rose-700 dark:text-rose-400";
    categoryBg = "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800";
    advice = "Your BMI is in the obesity range. A healthcare professional can help you interpret it alongside other measures.";
  } else if (bmi < 40) {
    category = "Obesity (class II)";
    categoryColor = "text-red-700 dark:text-red-400";
    categoryBg = "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800";
    advice = "Your BMI is in the obesity range. A healthcare professional can help you interpret it alongside other measures.";
  } else {
    category = "Obesity (class III)";
    categoryColor = "text-red-700 dark:text-red-400";
    categoryBg = "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800";
    advice = "Your BMI is in the highest obesity range. Speak to a healthcare professional about what it means for you.";
  }

  // Adult cut-offs do not apply to children and teenagers, who are assessed
  // against age- and sex-specific percentiles — which is why age and sex are
  // asked for.
  const ageNum = parseFloat(age);
  const isChild = Number.isFinite(ageNum) && ageNum > 0 && ageNum < 20;

  // Marker position on a 15–40 scale.
  const markerPct = hasResult ? Math.min(100, Math.max(0, ((bmi - 15) / 25) * 100)) : null;

  // Ideal weight range for height (BMI 18.5 - 24.9)
  const minIdealKg = hMeters > 0 ? 18.5 * (hMeters * hMeters) : 0;
  const maxIdealKg = hMeters > 0 ? 24.9 * (hMeters * hMeters) : 0;

  const idealWeightText = !(hMeters > 0)
    ? "—"
    : unitSystem === "metric"
      ? `${minIdealKg.toFixed(1)} kg - ${maxIdealKg.toFixed(1)} kg`
      : `${(minIdealKg * 2.20462).toFixed(1)} lbs - ${(maxIdealKg * 2.20462).toFixed(1)} lbs`;

  // BMI Prime (ratio of actual BMI to upper limit of normal BMI 25)
  const bmiPrime = hasResult ? (bmi / 25).toFixed(2) : "—";

  return (
    <div className="space-y-6">
      {/* Unit Selector */}
      <div className="flex gap-2 p-1.5 border max-w-sm rounded-lg bg-muted/60">
        <button
          onClick={() => setUnitSystem("metric")}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
            unitSystem === "metric"
              ? "bg-background text-foreground shadow-xs dark:bg-input/50"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Metric (cm / kg)
        </button>
        <button
          onClick={() => setUnitSystem("imperial")}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
            unitSystem === "imperial"
              ? "bg-background text-foreground shadow-xs dark:bg-input/50"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Imperial (ft-in / lbs)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Inputs */}
        <div className="lg:col-span-6 space-y-4 p-5 sm:p-6 rounded-xl border bg-muted/30">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-muted-foreground" />
            Body Measurements
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {/* Gender */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Gender
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setGender("male")}
                  className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
                    gender === "male"
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-semibold"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => setGender("female")}
                  className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
                    gender === "female"
                      ? "bg-white dark:bg-slate-700 text-pink-600 dark:text-pink-400 shadow-xs font-semibold"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Female
                </button>
              </div>
            </div>

            {/* Age */}
            <div className="space-y-1.5">
              <label htmlFor="bmi-age-input" className="text-sm font-medium text-foreground">
                Age
              </label>
              <input
                id="bmi-age-input"
                type="number"
                min="2"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-3 py-2 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                placeholder="25"
              />
            </div>
          </div>

          {/* Height Input */}
          {unitSystem === "metric" ? (
            <div className="space-y-1.5">
              <label htmlFor="bmi-height-cm" className="text-sm font-medium text-foreground">
                Height
              </label>
              <div className="relative">
                <input
                  id="bmi-height-cm"
                  type="number"
                  min="50"
                  max="260"
                  step="0.5"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full pl-4 pr-12 py-2.5 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  placeholder="175"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  cm
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Height (Feet & Inches)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input aria-label="Height in feet"
                    type="number"
                    min="1"
                    max="8"
                    value={heightFt}
                    onChange={(e) => setHeightFt(e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    placeholder="5"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    ft
                  </span>
                </div>
                <div className="relative">
                  <input aria-label="Height in inches"
                    type="number"
                    min="0"
                    max="11"
                    value={heightIn}
                    onChange={(e) => setHeightIn(e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    placeholder="9"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    in
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Weight Input */}
          <div className="space-y-1.5">
            <label htmlFor="bmi-weight-input" className="text-sm font-medium text-foreground">
              Weight
            </label>
            <div className="relative">
              <input
                id="bmi-weight-input"
                type="number"
                min="10"
                max="400"
                step="0.5"
                value={unitSystem === "metric" ? weightKg : weightLbs}
                onChange={(e) =>
                  unitSystem === "metric"
                    ? setWeightKg(e.target.value)
                    : setWeightLbs(e.target.value)
                }
                className="w-full pl-4 pr-12 py-2.5 text-base md:text-sm rounded-lg border border-input bg-background dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                placeholder={unitSystem === "metric" ? "70" : "154"}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {unitSystem === "metric" ? "kg" : "lbs"}
              </span>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-6 rounded-xl border space-y-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Body Mass Index (BMI)
              </span>
              {category && (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${categoryBg} ${categoryColor}`}>
                  {category}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2" aria-live="polite">
              <span className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900 dark:text-white font-mono">
                {hasResult ? bmi.toFixed(1) : "—"}
              </span>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">kg/m²</span>
            </div>

            {/* BMI scale, 15–40, with a marker at the result. */}
            <div className="space-y-1.5" aria-hidden="true">
              <div className="relative">
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div className="w-[14%] bg-amber-400" />
                  <div className="w-[26%] bg-emerald-500" />
                  <div className="w-[20%] bg-orange-400" />
                  <div className="w-[40%] bg-rose-500" />
                </div>
                {markerPct !== null && (
                  <span
                    className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-foreground shadow"
                    style={{ left: `${markerPct}%` }}
                  />
                )}
              </div>
              <div className="relative h-3 font-mono text-xs text-muted-foreground">
                {[
                  [15, 0],
                  [18.5, 14],
                  [25, 40],
                  [30, 60],
                  [40, 100],
                ].map(([v, pos]) => (
                  <span key={v} className="absolute -translate-x-1/2" style={{ left: `${pos}%` }}>
                    {v}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {advice}
            </p>
            {isChild && (
              <p className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-foreground">
                Under 20, BMI is judged against growth charts for age and sex, not these adult categories. Use a
                BMI-for-age percentile calculator or ask a doctor for a child or teenager.
              </p>
            )}
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl border bg-muted/30">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ideal Healthy Weight</span>
              <p className="text-base font-semibold text-slate-900 dark:text-white mt-1">
                {idealWeightText}
              </p>
              <span className="text-xs text-slate-500 dark:text-slate-400">Based on normal BMI 18.5 - 24.9</span>
            </div>

            <div className="p-4 rounded-xl border bg-muted/30">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">BMI Prime Index</span>
              <p className="text-base font-semibold text-blue-600 dark:text-blue-400 mt-1 font-mono">
                {bmiPrime}
              </p>
              <span className="text-xs text-slate-500 dark:text-slate-400">Ratio to upper normal limit (25.0)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
