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

  // WHO BMI Classification
  let category = "Normal weight";
  let categoryColor = "text-emerald-600 dark:text-emerald-400";
  let categoryBg = "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800";
  let advice = "You are in a healthy weight range.";

  if (bmi < 18.5) {
    category = "Underweight";
    categoryColor = "text-amber-600 dark:text-amber-400";
    categoryBg = "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800";
    advice = "Your BMI suggests you may be underweight. Consult a healthcare provider regarding nutrition.";
  } else if (bmi < 25) {
    category = "Normal Weight";
    categoryColor = "text-emerald-600 dark:text-emerald-400";
    categoryBg = "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800";
    advice = "You have a healthy body weight for your height. Maintain a balanced diet and regular exercise.";
  } else if (bmi < 30) {
    category = "Overweight";
    categoryColor = "text-orange-600 dark:text-orange-400";
    categoryBg = "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800";
    advice = "Your BMI indicates you are slightly overweight. Moderate lifestyle and dietary changes can help.";
  } else if (bmi < 35) {
    category = "Obesity (Class I)";
    categoryColor = "text-rose-600 dark:text-rose-400";
    categoryBg = "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800";
    advice = "Your BMI falls in the Class I obesity category. Consider consulting a medical professional.";
  } else {
    category = "Severe Obesity (Class II+)";
    categoryColor = "text-red-700 dark:text-red-400";
    categoryBg = "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800";
    advice = "Your BMI indicates severe obesity. Medical guidance is recommended for a safe health plan.";
  }

  // Ideal weight range for height (BMI 18.5 - 24.9)
  const minIdealKg = hMeters > 0 ? 18.5 * (hMeters * hMeters) : 0;
  const maxIdealKg = hMeters > 0 ? 24.9 * (hMeters * hMeters) : 0;

  const idealWeightText =
    unitSystem === "metric"
      ? `${minIdealKg.toFixed(1)} kg - ${maxIdealKg.toFixed(1)} kg`
      : `${(minIdealKg * 2.20462).toFixed(1)} lbs - ${(maxIdealKg * 2.20462).toFixed(1)} lbs`;

  // BMI Prime (ratio of actual BMI to upper limit of normal BMI 25)
  const bmiPrime = bmi > 0 ? (bmi / 25).toFixed(2) : "0.00";

  return (
    <div className="space-y-6">
      {/* Unit Selector */}
      <div className="flex gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 max-w-sm">
        <button
          onClick={() => setUnitSystem("metric")}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
            unitSystem === "metric"
              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Metric (cm / kg)
        </button>
        <button
          onClick={() => setUnitSystem("imperial")}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
            unitSystem === "imperial"
              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Imperial (ft-in / lbs)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Inputs */}
        <div className="lg:col-span-6 space-y-4 p-5 sm:p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Body Measurements
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {/* Gender */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
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
              <label htmlFor="bmi-age-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Age
              </label>
              <input
                id="bmi-age-input"
                type="number"
                min="2"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="25"
              />
            </div>
          </div>

          {/* Height Input */}
          {unitSystem === "metric" ? (
            <div className="space-y-1.5">
              <label htmlFor="bmi-height-cm" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
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
                  className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="175"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  cm
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Height (Feet & Inches)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={heightFt}
                    onChange={(e) => setHeightFt(e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="5"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    ft
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="11"
                    value={heightIn}
                    onChange={(e) => setHeightIn(e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="9"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    in
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Weight Input */}
          <div className="space-y-1.5">
            <label htmlFor="bmi-weight-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
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
                className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder={unitSystem === "metric" ? "70" : "154"}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                {unitSystem === "metric" ? "kg" : "lbs"}
              </span>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Body Mass Index (BMI)
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${categoryBg} ${categoryColor}`}>
                {category}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
                {bmi > 0 ? bmi.toFixed(1) : "--"}
              </span>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">kg/m²</span>
            </div>

            {/* Visual BMI Scale Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                <div className="w-[18.5%] bg-amber-400" title="Underweight (< 18.5)" />
                <div className="w-[24.9%] bg-emerald-500" title="Normal (18.5 - 24.9)" />
                <div className="w-[20%] bg-orange-400" title="Overweight (25 - 29.9)" />
                <div className="w-[36.6%] bg-rose-500" title="Obese (30+)" />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>16</span>
                <span>18.5</span>
                <span>25</span>
                <span>30</span>
                <span>40</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {advice}
            </p>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ideal Healthy Weight</span>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {idealWeightText}
              </p>
              <span className="text-[11px] text-slate-400">Based on normal BMI 18.5 - 24.9</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">BMI Prime Index</span>
              <p className="text-base font-bold text-blue-600 dark:text-blue-400 mt-1 font-mono">
                {bmiPrime}
              </p>
              <span className="text-[11px] text-slate-400">Ratio to upper normal limit (25.0)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
