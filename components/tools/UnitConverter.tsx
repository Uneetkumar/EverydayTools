"use client";

import React, { useState, useMemo } from "react";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import {
  Ruler,
  Scale,
  Thermometer,
  Grid,
  Box,
  Gauge,
  HardDrive,
  Clock,
  ArrowRightLeft,
  Copy,
  Check,
  Sparkles,
  Info,
  Sliders,
} from "lucide-react";
import confetti from "canvas-confetti";

type UnitCategory =
  | "length"
  | "weight"
  | "temperature"
  | "area"
  | "volume"
  | "speed"
  | "data"
  | "time";

interface UnitDef {
  id: string;
  name: string;
  symbol: string;
  ratioToBase: number; // For non-temperature: value * ratioToBase = baseUnit
}

interface CategoryDef {
  id: UnitCategory;
  name: string;
  icon: React.ElementType;
  baseUnit: string;
  units: UnitDef[];
  presets: { label: string; val: number; from: string; to: string }[];
}

const CATEGORIES: CategoryDef[] = [
  {
    id: "length",
    name: "Length & Distance",
    icon: Ruler,
    baseUnit: "m",
    units: [
      { id: "m", name: "Meter", symbol: "m", ratioToBase: 1 },
      { id: "km", name: "Kilometer", symbol: "km", ratioToBase: 1000 },
      { id: "cm", name: "Centimeter", symbol: "cm", ratioToBase: 0.01 },
      { id: "mm", name: "Millimeter", symbol: "mm", ratioToBase: 0.001 },
      { id: "mi", name: "Mile", symbol: "mi", ratioToBase: 1609.344 },
      { id: "yd", name: "Yard", symbol: "yd", ratioToBase: 0.9144 },
      { id: "ft", name: "Foot", symbol: "ft", ratioToBase: 0.3048 },
      { id: "in", name: "Inch", symbol: "in", ratioToBase: 0.0254 },
      { id: "nmi", name: "Nautical Mile", symbol: "nmi", ratioToBase: 1852 },
    ],
    presets: [
      { label: "5 km to miles", val: 5, from: "km", to: "mi" },
      { label: "100 meters to feet", val: 100, from: "m", to: "ft" },
      { label: "6 feet to cm", val: 6, from: "ft", to: "cm" },
      { label: "10 inches to cm", val: 10, from: "in", to: "cm" },
    ],
  },
  {
    id: "weight",
    name: "Weight & Mass",
    icon: Scale,
    baseUnit: "kg",
    units: [
      { id: "kg", name: "Kilogram", symbol: "kg", ratioToBase: 1 },
      { id: "g", name: "Gram", symbol: "g", ratioToBase: 0.001 },
      { id: "mg", name: "Milligram", symbol: "mg", ratioToBase: 0.000001 },
      { id: "lb", name: "Pound", symbol: "lb", ratioToBase: 0.45359237 },
      { id: "oz", name: "Ounce", symbol: "oz", ratioToBase: 0.028349523125 },
      { id: "t", name: "Metric Ton", symbol: "t", ratioToBase: 1000 },
      { id: "st", name: "Stone", symbol: "st", ratioToBase: 6.35029 },
      { id: "ct", name: "Carat", symbol: "ct", ratioToBase: 0.0002 },
    ],
    presets: [
      { label: "150 lbs to kg", val: 150, from: "lb", to: "kg" },
      { label: "1 kg to pounds", val: 1, from: "kg", to: "lb" },
      { label: "500 grams to oz", val: 500, from: "g", to: "oz" },
      { label: "1 stone to kg", val: 1, from: "st", to: "kg" },
    ],
  },
  {
    id: "temperature",
    name: "Temperature",
    icon: Thermometer,
    baseUnit: "C",
    units: [
      { id: "C", name: "Celsius", symbol: "°C", ratioToBase: 1 },
      { id: "F", name: "Fahrenheit", symbol: "°F", ratioToBase: 1 },
      { id: "K", name: "Kelvin", symbol: "K", ratioToBase: 1 },
    ],
    presets: [
      { label: "0°C to Fahrenheit", val: 0, from: "C", to: "F" },
      { label: "100°C to Fahrenheit", val: 100, from: "C", to: "F" },
      { label: "98.6°F Body Temp to °C", val: 98.6, from: "F", to: "C" },
      { label: "Room Temp 72°F to °C", val: 72, from: "F", to: "C" },
    ],
  },
  {
    id: "area",
    name: "Area & Land",
    icon: Grid,
    baseUnit: "sq_m",
    units: [
      { id: "sq_m", name: "Square Meter", symbol: "m²", ratioToBase: 1 },
      { id: "sq_km", name: "Square Kilometer", symbol: "km²", ratioToBase: 1000000 },
      { id: "sq_ft", name: "Square Foot", symbol: "ft²", ratioToBase: 0.092903 },
      { id: "sq_yd", name: "Square Yard", symbol: "yd²", ratioToBase: 0.836127 },
      { id: "sq_mi", name: "Square Mile", symbol: "mi²", ratioToBase: 2589988.11 },
      { id: "ac", name: "Acre", symbol: "ac", ratioToBase: 4046.85642 },
      { id: "ha", name: "Hectare", symbol: "ha", ratioToBase: 10000 },
      { id: "sq_in", name: "Square Inch", symbol: "in²", ratioToBase: 0.00064516 },
    ],
    presets: [
      { label: "1 Acre to Square Feet", val: 1, from: "ac", to: "sq_ft" },
      { label: "1000 sq ft to sq meters", val: 1000, from: "sq_ft", to: "sq_m" },
      { label: "1 Hectare to Acres", val: 1, from: "ha", to: "ac" },
      { label: "1 sq km to sq miles", val: 1, from: "sq_km", to: "sq_mi" },
    ],
  },
  {
    id: "volume",
    name: "Volume & Liquid",
    icon: Box,
    baseUnit: "l",
    units: [
      { id: "l", name: "Liter", symbol: "L", ratioToBase: 1 },
      { id: "ml", name: "Milliliter", symbol: "mL", ratioToBase: 0.001 },
      { id: "cu_m", name: "Cubic Meter", symbol: "m³", ratioToBase: 1000 },
      { id: "gal", name: "Gallon (US)", symbol: "gal", ratioToBase: 3.78541 },
      { id: "qt", name: "Quart (US)", symbol: "qt", ratioToBase: 0.946353 },
      { id: "pt", name: "Pint (US)", symbol: "pt", ratioToBase: 0.473176 },
      { id: "cup", name: "Cup (US)", symbol: "cup", ratioToBase: 0.236588 },
      { id: "fl_oz", name: "Fluid Ounce (US)", symbol: "fl oz", ratioToBase: 0.0295735 },
      { id: "tbsp", name: "Tablespoon (US)", symbol: "tbsp", ratioToBase: 0.0147868 },
    ],
    presets: [
      { label: "1 Gallon to Liters", val: 1, from: "gal", to: "l" },
      { label: "2 Liters to Fluid Ounces", val: 2, from: "l", to: "fl_oz" },
      { label: "1 Cup to Milliliters", val: 1, from: "cup", to: "ml" },
      { label: "500 mL to Pints", val: 500, from: "ml", to: "pt" },
    ],
  },
  {
    id: "speed",
    name: "Speed & Velocity",
    icon: Gauge,
    baseUnit: "m_s",
    units: [
      { id: "km_h", name: "Kilometers per hour", symbol: "km/h", ratioToBase: 1 / 3.6 },
      { id: "mph", name: "Miles per hour", symbol: "mph", ratioToBase: 0.44704 },
      { id: "m_s", name: "Meters per second", symbol: "m/s", ratioToBase: 1 },
      { id: "kn", name: "Knots", symbol: "kn", ratioToBase: 0.514444 },
      { id: "ft_s", name: "Feet per second", symbol: "ft/s", ratioToBase: 0.3048 },
    ],
    presets: [
      { label: "60 mph to km/h", val: 60, from: "mph", to: "km_h" },
      { label: "100 km/h to mph", val: 100, from: "km_h", to: "mph" },
      { label: "25 knots to mph", val: 25, from: "kn", to: "mph" },
      { label: "10 m/s to km/h", val: 10, from: "m_s", to: "km_h" },
    ],
  },
  {
    id: "data",
    name: "Digital Storage",
    icon: HardDrive,
    baseUnit: "byte",
    units: [
      { id: "b", name: "Byte", symbol: "B", ratioToBase: 1 },
      { id: "kb", name: "Kilobyte (decimal)", symbol: "KB", ratioToBase: 1000 },
      { id: "mb", name: "Megabyte (decimal)", symbol: "MB", ratioToBase: 1000000 },
      { id: "gb", name: "Gigabyte (decimal)", symbol: "GB", ratioToBase: 1000000000 },
      { id: "tb", name: "Terabyte (decimal)", symbol: "TB", ratioToBase: 1000000000000 },
      { id: "kib", name: "Kibibyte (binary)", symbol: "KiB", ratioToBase: 1024 },
      { id: "mib", name: "Mebibyte (binary)", symbol: "MiB", ratioToBase: 1048576 },
      { id: "gib", name: "Gibibyte (binary)", symbol: "GiB", ratioToBase: 1073741824 },
      { id: "bit", name: "Bit", symbol: "bit", ratioToBase: 0.125 },
    ],
    presets: [
      { label: "1 GB to MB", val: 1, from: "gb", to: "mb" },
      { label: "500 GB to Terabytes", val: 500, from: "gb", to: "tb" },
      { label: "100 MB to Kilobytes", val: 100, from: "mb", to: "kb" },
      { label: "1 GiB (Binary) to MB", val: 1, from: "gib", to: "mb" },
    ],
  },
  {
    id: "time",
    name: "Time Duration",
    icon: Clock,
    baseUnit: "s",
    units: [
      { id: "ms", name: "Millisecond", symbol: "ms", ratioToBase: 0.001 },
      { id: "s", name: "Second", symbol: "s", ratioToBase: 1 },
      { id: "min", name: "Minute", symbol: "min", ratioToBase: 60 },
      { id: "h", name: "Hour", symbol: "h", ratioToBase: 3600 },
      { id: "d", name: "Day", symbol: "d", ratioToBase: 86400 },
      { id: "wk", name: "Week", symbol: "wk", ratioToBase: 604800 },
      { id: "mo", name: "Month (avg)", symbol: "mo", ratioToBase: 2629800 },
      { id: "yr", name: "Year (365d)", symbol: "yr", ratioToBase: 31536000 },
    ],
    presets: [
      { label: "24 Hours to Seconds", val: 24, from: "h", to: "s" },
      { label: "10,000 Minutes to Days", val: 10000, from: "min", to: "d" },
      { label: "1 Year to Hours", val: 1, from: "yr", to: "h" },
      { label: "5 Days to Minutes", val: 5, from: "d", to: "min" },
    ],
  },
];

export default function UnitConverter() {
  const [activeCategory, setActiveCategory] = usePersistentState<UnitCategory>("unit_cat", "length");
  const [inputValue, setInputValue] = usePersistentState<string>("unit_val", "10");
  const [fromUnitId, setFromUnitId] = usePersistentState<string>("unit_from", "km");
  const [toUnitId, setToUnitId] = usePersistentState<string>("unit_to", "mi");
  const [copied, setCopied] = useState<boolean>(false);

  const category = useMemo(
    () => CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0],
    [activeCategory]
  );

  // Conversion logic
  const convertUnits = (val: number, fromId: string, toId: string, catId: UnitCategory): number => {
    if (isNaN(val)) return 0;
    if (fromId === toId) return val;

    if (catId === "temperature") {
      let celsius = val;
      if (fromId === "F") celsius = ((val - 32) * 5) / 9;
      else if (fromId === "K") celsius = val - 273.15;

      if (toId === "C") return celsius;
      if (toId === "F") return (celsius * 9) / 5 + 32;
      if (toId === "K") return celsius + 273.15;
      return celsius;
    }

    const fromDef = category.units.find((u) => u.id === fromId);
    const toDef = category.units.find((u) => u.id === toId);

    if (!fromDef || !toDef) return 0;

    const baseVal = val * fromDef.ratioToBase;
    return baseVal / toDef.ratioToBase;
  };

  const numVal = parseFloat(inputValue) || 0;
  const convertedResult = useMemo(
    () => convertUnits(numVal, fromUnitId, toUnitId, activeCategory),
    [numVal, fromUnitId, toUnitId, activeCategory, category]
  );

  // Clean formatting
  const formatResultNumber = (n: number): string => {
    if (n === 0) return "0";
    if (Math.abs(n) >= 1e9 || (Math.abs(n) < 1e-4 && Math.abs(n) > 0)) {
      return n.toExponential(4);
    }
    const rounded = Math.round((n + Number.EPSILON) * 1e6) / 1e6;
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(rounded);
  };

  // Swap From & To
  const handleSwap = () => {
    const temp = fromUnitId;
    setFromUnitId(toUnitId);
    setToUnitId(temp);
  };

  // Select new category
  const handleSelectCategory = (catId: UnitCategory) => {
    setActiveCategory(catId);
    const cat = CATEGORIES.find((c) => c.id === catId) || CATEGORIES[0];
    setFromUnitId(cat.units[0].id);
    setToUnitId(cat.units[1]?.id || cat.units[0].id);
  };

  // Copy result
  const handleCopy = () => {
    navigator.clipboard.writeText(String(convertedResult));
    setCopied(true);
    confetti({ particleCount: 25, spread: 50, origin: { y: 0.85 } });
    setTimeout(() => setCopied(false), 2000);
  };

  const fromUnit = category.units.find((u) => u.id === fromUnitId) || category.units[0];
  const toUnit = category.units.find((u) => u.id === toUnitId) || category.units[1] || category.units[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Category Pills Header */}
      <div className="p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap gap-1">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleSelectCategory(cat.id)}
              className={`flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition ${
                isActive
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Converter Box */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
          {/* FROM Input & Unit */}
          <div className="md:col-span-5 space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              From ({fromUnit.name})
            </label>
            <div className="flex rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter value..."
                className="w-full px-4 py-3 bg-transparent text-lg font-bold text-slate-900 dark:text-white focus:outline-none"
              />
              <select
                value={fromUnitId}
                onChange={(e) => setFromUnitId(e.target.value)}
                className="px-3 bg-slate-200/60 dark:bg-slate-800/80 text-xs font-bold text-slate-800 dark:text-slate-200 border-l border-slate-200 dark:border-slate-700 focus:outline-none"
              >
                {category.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SWAP Button */}
          <div className="md:col-span-1 flex justify-center pt-5 md:pt-0">
            <button
              type="button"
              onClick={handleSwap}
              className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 shadow-xs hover:scale-105 active:scale-95 transition"
              title="Swap From and To units"
            >
              <ArrowRightLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </button>
          </div>

          {/* TO Converted Output & Unit */}
          <div className="md:col-span-5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                To ({toUnit.name})
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied!" : "Copy Result"}</span>
              </button>
            </div>
            <div className="flex rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 overflow-hidden">
              <div className="w-full px-4 py-3 text-lg font-bold text-blue-700 dark:text-blue-300 truncate">
                {formatResultNumber(convertedResult)}
              </div>
              <select
                value={toUnitId}
                onChange={(e) => setToUnitId(e.target.value)}
                className="px-3 bg-blue-100/60 dark:bg-blue-900/40 text-xs font-bold text-blue-900 dark:text-blue-200 border-l border-blue-200 dark:border-blue-800 focus:outline-none"
              >
                {category.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Quick Calculation Summary Banner */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Formula Ratio:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              1 {fromUnit.symbol} = {formatResultNumber(convertUnits(1, fromUnitId, toUnitId, activeCategory))} {toUnit.symbol}
            </span>
          </div>
          <div className="text-slate-400">
            Instant 100% private browser calculation
          </div>
        </div>

        {/* Presets Row */}
        {category.presets.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Popular Presets
            </span>
            <div className="flex flex-wrap gap-2">
              {category.presets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setInputValue(String(preset.val));
                    setFromUnitId(preset.from);
                    setToUnitId(preset.to);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-white dark:hover:bg-slate-850 text-xs font-medium text-slate-700 dark:text-slate-300 transition"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Multi-Unit Live Comparison Grid */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Complete {category.name} Comparison
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            {inputValue || 0} {fromUnit.symbol} equals:
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {category.units.map((unit) => {
            const isSelf = unit.id === fromUnitId;
            const res = convertUnits(numVal, fromUnitId, unit.id, activeCategory);
            return (
              <div
                key={unit.id}
                onClick={() => setToUnitId(unit.id)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                  unit.id === toUnitId
                    ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-xs"
                    : isSelf
                    ? "bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700"
                    : "bg-slate-50/50 dark:bg-slate-950/50 border-slate-200/80 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span className="font-semibold">{unit.name}</span>
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    {unit.symbol}
                  </span>
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-white font-mono truncate">
                  {formatResultNumber(res)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
