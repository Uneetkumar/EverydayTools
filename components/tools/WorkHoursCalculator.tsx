"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, Download, Clock, DollarSign, CalendarDays, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { downloadBlob } from "@/lib/utils/download";
import {
  ToolSection,
  Field,
  TextInput,
  UnitInput,
  Segmented,
  StatGrid,
  Stat,
  ActionBar,
  ToolDivider,
} from "@/components/tool/kit";
import { Button } from "@/components/ui/button";

interface DayRow {
  day: string;
  enabled: boolean;
  start: string;
  end: string;
  breakMins: number;
}

const DEFAULT_WEEK: DayRow[] = [
  { day: "Monday", enabled: true, start: "09:00", end: "17:30", breakMins: 30 },
  { day: "Tuesday", enabled: true, start: "09:00", end: "17:30", breakMins: 30 },
  { day: "Wednesday", enabled: true, start: "09:00", end: "17:30", breakMins: 30 },
  { day: "Thursday", enabled: true, start: "09:00", end: "17:30", breakMins: 30 },
  { day: "Friday", enabled: true, start: "09:00", end: "17:00", breakMins: 30 },
  { day: "Saturday", enabled: false, start: "10:00", end: "14:00", breakMins: 0 },
  { day: "Sunday", enabled: false, start: "10:00", end: "14:00", breakMins: 0 },
];

function calculateShiftMinutes(start: string, end: string, breakMins: number): number {
  if (!start || !end) return 0;
  const [sH, sM] = start.split(":").map(Number);
  const [eH, eM] = end.split(":").map(Number);
  if (isNaN(sH) || isNaN(sM) || isNaN(eH) || isNaN(eM)) return 0;

  let startTotal = sH * 60 + sM;
  let endTotal = eH * 60 + eM;

  // Overnight shift: end time is on the next calendar day
  if (endTotal < startTotal) {
    endTotal += 24 * 60;
  }

  const rawMinutes = endTotal - startTotal;
  return Math.max(0, rawMinutes - breakMins);
}

export default function WorkHoursCalculator() {
  const [calcMode, setCalcMode] = useState<"single" | "weekly">("weekly");
  const [hourlyRate, setHourlyRate] = useState("25.00");
  const [overtimeRate, setOvertimeRate] = useState("37.50");
  const [weeklyOtThreshold, setWeeklyOtThreshold] = useState("40");

  // Single shift state
  const [singleStart, setSingleStart] = useState("08:30");
  const [singleEnd, setSingleEnd] = useState("17:00");
  const [singleBreak, setSingleBreak] = useState("45");

  // Weekly timesheet state
  const [week, setWeek] = useState<DayRow[]>(DEFAULT_WEEK);
  const [copied, setCopied] = useState(false);

  // Single Shift Calculation
  const singleShiftResult = useMemo(() => {
    const netMins = calculateShiftMinutes(singleStart, singleEnd, parseInt(singleBreak, 10) || 0);
    const decimalHours = netMins / 60;
    const hours = Math.floor(netMins / 60);
    const mins = netMins % 60;

    const rate = parseFloat(hourlyRate) || 0;
    const pay = decimalHours * rate;

    return {
      formatted: `${hours}h ${mins}m`,
      decimal: decimalHours.toFixed(2),
      pay: pay.toFixed(2),
    };
  }, [singleStart, singleEnd, singleBreak, hourlyRate]);

  // Weekly Timesheet Calculation
  const weeklyResult = useMemo(() => {
    let totalMinutes = 0;
    const daysData = week.map((d) => {
      if (!d.enabled) return { ...d, minutes: 0, decimal: "0.00" };
      const mins = calculateShiftMinutes(d.start, d.end, d.breakMins);
      totalMinutes += mins;
      return {
        ...d,
        minutes: mins,
        decimal: (mins / 60).toFixed(2),
      };
    });

    const totalDecimal = totalMinutes / 60;
    const totalHours = Math.floor(totalMinutes / 60);
    const totalMins = totalMinutes % 60;

    const otThreshold = parseFloat(weeklyOtThreshold) || 40;
    const regularDecimal = Math.min(totalDecimal, otThreshold);
    const overtimeDecimal = Math.max(0, totalDecimal - otThreshold);

    const regRate = parseFloat(hourlyRate) || 0;
    const otRate = parseFloat(overtimeRate) || regRate * 1.5;

    const regularPay = regularDecimal * regRate;
    const overtimePay = overtimeDecimal * otRate;
    const totalGrossPay = regularPay + overtimePay;

    return {
      daysData,
      totalFormatted: `${totalHours}h ${totalMins}m`,
      totalDecimal: totalDecimal.toFixed(2),
      regularDecimal: regularDecimal.toFixed(2),
      overtimeDecimal: overtimeDecimal.toFixed(2),
      totalGrossPay: totalGrossPay.toFixed(2),
      regularPay: regularPay.toFixed(2),
      overtimePay: overtimePay.toFixed(2),
    };
  }, [week, hourlyRate, overtimeRate, weeklyOtThreshold]);

  const updateWeekRow = (index: number, patch: Partial<DayRow>) => {
    setWeek((prev) => prev.map((row, idx) => (idx === index ? { ...row, ...patch } : row)));
  };

  const fillStandardWeekday = () => {
    setWeek((prev) =>
      prev.map((row, idx) =>
        idx < 5
          ? { ...row, enabled: true, start: "09:00", end: "17:00", breakMins: 30 }
          : { ...row, enabled: false }
      )
    );
    toast.success("Filled standard 9-5 weekday schedule");
  };

  const copyTimesheet = () => {
    const summary = [
      "Weekly Timesheet Summary:",
      ...weeklyResult.daysData.map(
        (d) =>
          `${d.day}: ${d.enabled ? `${d.start} - ${d.end} (Break: ${d.breakMins}m) -> ${d.decimal} hrs` : "Off"}`
      ),
      "----------------------------------------",
      `Total Hours: ${weeklyResult.totalDecimal} hrs (${weeklyResult.totalFormatted})`,
      `Regular Hours: ${weeklyResult.regularDecimal} hrs ($${weeklyResult.regularPay})`,
      `Overtime Hours: ${weeklyResult.overtimeDecimal} hrs ($${weeklyResult.overtimePay})`,
      `Estimated Gross Pay: $${weeklyResult.totalGrossPay}`,
    ].join("\n");

    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success("Timesheet summary copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const exportCsv = () => {
    const headers = "Day,Status,Start,End,BreakMinutes,DecimalHours\n";
    const rows = weeklyResult.daysData
      .map(
        (d) =>
          `${d.day},${d.enabled ? "Worked" : "Off"},${d.start},${d.end},${d.breakMins},${d.decimal}`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, "timesheet.csv");
  };

  return (
    <div className="space-y-6">
      <ToolSection
        title="Work Hours & Weekly Timesheet Calculator"
        description="Calculate shift hours, decimal hours for payroll, unpaid break deductions, and overtime pay with overnight shift support."
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Segmented
            value={calcMode}
            onChange={(v) => setCalcMode(v as "single" | "weekly")}
            options={[
              { value: "weekly", label: "7-Day Weekly Timesheet" },
              { value: "single", label: "Single Shift Calculator" },
            ]}
            ariaLabel="Calculator Mode"
          />

          <div className="flex items-center gap-2">
            <div className="w-32">
              <UnitInput
                unit="$/hr"
                type="number"
                step="any"
                min="0"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="25.00"
                aria-label="Hourly Pay Rate"
                className="h-9 text-xs"
              />
            </div>
            {calcMode === "weekly" && (
              <Button variant="outline" size="sm" onClick={fillStandardWeekday} className="h-9 text-xs">
                Fill 9-to-5
              </Button>
            )}
          </div>
        </div>
      </ToolSection>

      <ToolDivider />

      {calcMode === "single" && (
        <div className="space-y-6">
          <ToolSection title="Single Shift Details">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Start Time (24h or AM/PM)">
                <TextInput
                  type="time"
                  value={singleStart}
                  onChange={(e) => setSingleStart(e.target.value)}
                />
              </Field>

              <Field label="End Time (Overnight supported)">
                <TextInput
                  type="time"
                  value={singleEnd}
                  onChange={(e) => setSingleEnd(e.target.value)}
                />
              </Field>

              <Field label="Unpaid Break (Minutes)">
                <UnitInput
                  unit="mins"
                  type="number"
                  min="0"
                  value={singleBreak}
                  onChange={(e) => setSingleBreak(e.target.value)}
                  placeholder="30"
                />
              </Field>
            </div>
          </ToolSection>

          <ToolSection title="Shift Pay & Hours">
            <StatGrid>
              <Stat
                label="Total Work Duration"
                value={singleShiftResult.formatted}
                tone="success"
                hint="Net of unpaid break"
              />
              <Stat
                label="Decimal Hours (Payroll)"
                value={`${singleShiftResult.decimal} hrs`}
                hint="Use for payroll software"
              />
              <Stat
                label="Estimated Gross Pay"
                value={`$${singleShiftResult.pay}`}
                hint={`At $${hourlyRate}/hr`}
              />
              <Stat label="Hourly Rate" value={`$${hourlyRate}/hr`} />
            </StatGrid>

            <ActionBar>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  const summary = [
                    "Single Shift Summary:",
                    `Work Time: ${singleStart} - ${singleEnd} (Unpaid Break: ${singleBreak} mins)`,
                    `Total Work Duration: ${singleShiftResult.formatted} (${singleShiftResult.decimal} decimal hrs)`,
                    `Estimated Gross Pay: $${singleShiftResult.pay} (at $${hourlyRate}/hr)`,
                  ].join("\n");
                  navigator.clipboard.writeText(summary);
                  setCopied(true);
                  toast.success("Single shift summary copied!");
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? <Check className="size-3.5 text-success mr-1" /> : <Copy className="size-3.5 mr-1" />}
                Copy Shift Summary
              </Button>
            </ActionBar>
          </ToolSection>
        </div>
      )}

      {calcMode === "weekly" && (
        <div className="space-y-6">
          <ToolSection
            title="Weekly Shifts (Monday – Sunday)"
            description="Toggle days on or off and set start, end, and break times."
          >
            <div className="overflow-x-auto rounded-lg border bg-card">
              <table className="w-full text-left text-xs">
                <thead className="border-b bg-muted/60 text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-3 py-2.5">Day</th>
                    <th className="px-3 py-2.5">Work Day</th>
                    <th className="px-3 py-2.5">Start Time</th>
                    <th className="px-3 py-2.5">End Time</th>
                    <th className="px-3 py-2.5">Unpaid Break</th>
                    <th className="px-3 py-2.5 text-right">Daily Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono">
                  {week.map((row, idx) => (
                    <tr
                      key={row.day}
                      className={row.enabled ? "hover:bg-muted/30" : "opacity-50 bg-muted/10"}
                    >
                      <td className="px-3 py-2 font-medium font-sans text-foreground">{row.day}</td>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={row.enabled}
                          onChange={(e) => updateWeekRow(idx, { enabled: e.target.checked })}
                          className="size-4 rounded accent-primary cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <TextInput
                          type="time"
                          value={row.start}
                          disabled={!row.enabled}
                          onChange={(e) => updateWeekRow(idx, { start: e.target.value })}
                          className="h-8 text-xs w-32"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <TextInput
                          type="time"
                          value={row.end}
                          disabled={!row.enabled}
                          onChange={(e) => updateWeekRow(idx, { end: e.target.value })}
                          className="h-8 text-xs w-32"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <UnitInput
                          unit="m"
                          type="number"
                          min="0"
                          value={row.breakMins}
                          disabled={!row.enabled}
                          onChange={(e) =>
                            updateWeekRow(idx, { breakMins: parseInt(e.target.value, 10) || 0 })
                          }
                          className="h-8 text-xs w-24"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-foreground">
                        {weeklyResult.daysData[idx]?.decimal} hrs
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <Field label="Weekly Overtime Threshold">
                <UnitInput
                  unit="hrs/week"
                  type="number"
                  min="0"
                  value={weeklyOtThreshold}
                  onChange={(e) => setWeeklyOtThreshold(e.target.value)}
                />
              </Field>

              <Field label="Overtime Hourly Rate">
                <UnitInput
                  unit="$/hr"
                  type="number"
                  step="any"
                  min="0"
                  value={overtimeRate}
                  onChange={(e) => setOvertimeRate(e.target.value)}
                />
              </Field>
            </div>
          </ToolSection>

          <ToolSection title="Weekly Payroll Summary">
            <StatGrid>
              <Stat
                label="Total Gross Pay"
                value={`$${weeklyResult.totalGrossPay}`}
                tone="success"
                hint="Regular + Overtime Pay"
              />
              <Stat
                label="Total Decimal Hours"
                value={`${weeklyResult.totalDecimal} hrs`}
                hint={weeklyResult.totalFormatted}
              />
              <Stat
                label="Regular Hours"
                value={`${weeklyResult.regularDecimal} hrs`}
                hint={`$${weeklyResult.regularPay} ($${hourlyRate}/hr)`}
              />
              <Stat
                label="Overtime Hours"
                value={`${weeklyResult.overtimeDecimal} hrs`}
                hint={`$${weeklyResult.overtimePay} ($${overtimeRate}/hr)`}
              />
            </StatGrid>

            <ActionBar>
              <Button variant="outline" size="sm" onClick={exportCsv}>
                <Download className="size-3.5 mr-1" /> Export CSV
              </Button>
              <Button variant="default" size="sm" onClick={copyTimesheet}>
                {copied ? <Check className="size-3.5 text-success mr-1" /> : <Copy className="size-3.5 mr-1" />}
                Copy Timesheet Summary
              </Button>
            </ActionBar>
          </ToolSection>
        </div>
      )}
    </div>
  );
}
