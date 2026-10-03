"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, Fuel, Car, Users, ArrowRightLeft, DollarSign } from "lucide-react";
import { toast } from "sonner";
import {
  ToolSection,
  Field,
  TextInput,
  UnitInput,
  Segmented,
  Chips,
  ToggleRow,
  StatGrid,
  Stat,
  ActionBar,
  ToolDivider,
} from "@/components/tool/kit";
import { Button } from "@/components/ui/button";

interface VehiclePreset {
  label: string;
  metricConsumption: number; // L/100km
  imperialMpg: number; // MPG
}

const VEHICLE_PRESETS: VehiclePreset[] = [
  { label: "Hybrid / Compact", metricConsumption: 4.5, imperialMpg: 52 },
  { label: "Midsize Sedan", metricConsumption: 7.5, imperialMpg: 31 },
  { label: "SUV / Crossover", metricConsumption: 9.8, imperialMpg: 24 },
  { label: "Truck / Van", metricConsumption: 13.5, imperialMpg: 17 },
  { label: "Motorcycle", metricConsumption: 3.8, imperialMpg: 62 },
];

export default function FuelCostCalculator() {
  const [unitSystem, setUnitSystem] = useState<"metric" | "imperial">("metric");
  const [currency, setCurrency] = useState("$");
  const [distance, setDistance] = useState("350");
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [efficiency, setEfficiency] = useState("7.5"); // L/100km or MPG
  const [fuelPrice, setFuelPrice] = useState("1.65"); // Price per L or Gal
  const [passengers, setPassengers] = useState("1");
  const [copied, setCopied] = useState(false);

  const isMetric = unitSystem === "metric";
  const numPassengers = Math.max(1, parseInt(passengers, 10) || 1);

  const results = useMemo(() => {
    const rawDist = Math.max(0, parseFloat(distance) || 0);
    const totalDist = isRoundTrip ? rawDist * 2 : rawDist;
    const eff = Math.max(0.1, parseFloat(efficiency) || 1);
    const price = Math.max(0, parseFloat(fuelPrice) || 0);

    let totalFuel = 0;
    if (isMetric) {
      // L/100km formula: (distance / 100) * efficiency
      totalFuel = (totalDist / 100) * eff;
    } else {
      // MPG formula: distance / mpg
      totalFuel = totalDist / eff;
    }

    const totalCost = totalFuel * price;
    const costPerPerson = totalCost / numPassengers;
    const costPerDistance = totalDist > 0 ? totalCost / totalDist : 0;

    return {
      totalDistance: totalDist,
      totalFuel: totalFuel.toFixed(2),
      totalCost: totalCost.toFixed(2),
      costPerPerson: costPerPerson.toFixed(2),
      costPerDistance: costPerDistance.toFixed(3),
    };
  }, [distance, isRoundTrip, efficiency, fuelPrice, numPassengers, isMetric]);

  const copySummary = () => {
    const distUnit = isMetric ? "km" : "miles";
    const fuelUnit = isMetric ? "L" : "gal";
    const summary = [
      `Road Trip Fuel Expense:`,
      `Distance: ${results.totalDistance} ${distUnit} (${isRoundTrip ? "Round Trip" : "One Way"})`,
      `Fuel Consumption: ${results.totalFuel} ${fuelUnit}`,
      `Total Cost: ${currency}${results.totalCost}`,
      numPassengers > 1 ? `Split between ${numPassengers} people: ${currency}${results.costPerPerson} each` : "",
      `Cost per ${distUnit}: ${currency}${results.costPerDistance}`,
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success("Fuel expense summary copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUnitSystemChange = (sys: "metric" | "imperial") => {
    setUnitSystem(sys);
    if (sys === "metric") {
      setDistance("350");
      setEfficiency("7.5");
      setFuelPrice("1.65");
    } else {
      setDistance("250");
      setEfficiency("30");
      setFuelPrice("3.85");
    }
  };

  return (
    <div className="space-y-6">
      <ToolSection
        title="Fuel Cost & Mileage Calculator"
        description="Estimate gas costs, fuel consumed, and passenger splits for road trips and daily commutes in Metric or Imperial."
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Segmented
            value={unitSystem}
            onChange={(v) => handleUnitSystemChange(v as "metric" | "imperial")}
            options={[
              { value: "metric", label: "Metric (km, L, L/100km)" },
              { value: "imperial", label: "Imperial (miles, gal, MPG)" },
            ]}
            ariaLabel="Unit System"
          />

          <Chips
            value={null}
            onChange={(val) => {
              const p = VEHICLE_PRESETS.find((x) => x.label === val);
              if (p) {
                setEfficiency(isMetric ? p.metricConsumption.toString() : p.imperialMpg.toString());
              }
            }}
            options={VEHICLE_PRESETS.map((v) => ({ value: v.label, label: v.label }))}
            ariaLabel="Vehicle Presets"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={`Trip Distance (${isMetric ? "Kilometers" : "Miles"})`}>
            <UnitInput
              unit={isMetric ? "km" : "mi"}
              type="number"
              min="0"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="100"
            />
          </Field>

          <Field label={`Fuel Efficiency (${isMetric ? "L/100km" : "MPG"})`}>
            <UnitInput
              unit={isMetric ? "L/100km" : "MPG"}
              type="number"
              step="any"
              min="0.1"
              value={efficiency}
              onChange={(e) => setEfficiency(e.target.value)}
              placeholder="7.5"
            />
          </Field>

          <Field label={`Fuel Price (${isMetric ? "Per Liter" : "Per Gallon"})`}>
            <UnitInput
              unit={isMetric ? `${currency}/L` : `${currency}/gal`}
              type="number"
              step="any"
              min="0"
              value={fuelPrice}
              onChange={(e) => setFuelPrice(e.target.value)}
              placeholder="1.50"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 pt-2">
          <ToggleRow
            id="round-trip"
            label="Round Trip (Double Distance)"
            description="Automatically doubles the calculated mileage"
            checked={isRoundTrip}
            onCheckedChange={setIsRoundTrip}
          />

          <Field label="Passengers Splitting Cost">
            <UnitInput
              unit="passengers"
              type="number"
              min="1"
              max="20"
              value={passengers}
              onChange={(e) => setPassengers(e.target.value)}
            />
          </Field>
        </div>
      </ToolSection>

      <ToolDivider />

      <ToolSection title="Cost & Fuel Calculation">
        <StatGrid>
          <Stat
            label="Total Fuel Cost"
            value={`${currency}${results.totalCost}`}
            tone="success"
            hint={`${results.totalDistance} ${isMetric ? "km" : "mi"} total`}
          />
          <Stat
            label={numPassengers > 1 ? "Cost Per Person" : "Fuel Required"}
            value={numPassengers > 1 ? `${currency}${results.costPerPerson}` : `${results.totalFuel} ${isMetric ? "L" : "gal"}`}
            hint={numPassengers > 1 ? `Split by ${numPassengers} people` : `Total fuel consumed`}
          />
          <Stat
            label="Cost Per Unit"
            value={`${currency}${results.costPerDistance}`}
            hint={`Per ${isMetric ? "km" : "mile"}`}
          />
          <Stat
            label="Total Fuel Needed"
            value={`${results.totalFuel} ${isMetric ? "Liters" : "Gallons"}`}
          />
        </StatGrid>

        <ActionBar>
          <Button variant="outline" size="sm" onClick={copySummary}>
            {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
            Copy Fuel Expense Report
          </Button>
        </ActionBar>
      </ToolSection>
    </div>
  );
}
