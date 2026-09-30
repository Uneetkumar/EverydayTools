"use client";

import React, { useState } from "react";
import { Download } from "lucide-react";
import { Stat, StatGrid, ToolSection } from "@/components/tool/kit";
import { Button } from "@/components/ui/button";
import { formatMs, speedText, type SpeedUnit } from "@/lib/speedtest/format";
import { historyCsv, historyStats, type HistoryRecord } from "@/lib/speedtest/result";
import { cn } from "@/lib/utils";
import { TrendChart } from "./charts";

const GRADE_CLS: Record<string, string> = {
  "A+": "text-success",
  A: "text-success",
  B: "text-success",
  C: "text-warning",
  D: "text-destructive",
  F: "text-destructive",
};

const PREVIEW = 6;

/** Tests run on this device, with the trend and medians that make one reading meaningful. */
export function HistorySection({ records, unit, onClear }: { records: HistoryRecord[]; unit: SpeedUnit; onClear: () => void }) {
  const [all, setAll] = useState(false);
  const stats = historyStats(records);
  const shown = all ? records : records.slice(0, PREVIEW);

  const exportCsv = () => {
    const url = URL.createObjectURL(new Blob([historyCsv(records)], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "speed-test-history.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <ToolSection
      title="Your tests on this device"
      description="Kept only in this browser, never sent anywhere. One reading is a snapshot; the median of several is closer to the truth."
      actions={
        <>
          <Button type="button" variant="ghost" size="sm" onClick={exportCsv}>
            <Download aria-hidden="true" /> CSV
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            Clear
          </Button>
        </>
      }
    >
      {records.length >= 2 && (
        <StatGrid>
          <Stat label="Tests" value={stats.count} hint={`Last ${new Date(records[0].at).toLocaleDateString([], { month: "short", day: "numeric" })}`} />
          <Stat label="Median download" value={speedText(stats.medianDown, unit)} hint={`Best ${speedText(stats.bestDown, unit)} · worst ${speedText(stats.worstDown, unit)}`} />
          <Stat label="Median upload" value={speedText(stats.medianUp, unit)} />
          <Stat label="Median ping" value={formatMs(stats.medianPing)} />
        </StatGrid>
      )}
      {records.length >= 2 && (
        <div className="rounded-lg border bg-background p-3">
          <div className="mb-1 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded bg-chart-1" aria-hidden="true" /> Download
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded bg-chart-2" aria-hidden="true" /> Upload
            </span>
            <span className="ml-auto">Oldest → newest</span>
          </div>
          <TrendChart records={records} unit={unit} />
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border bg-background">
        <table className="w-full min-w-[30rem] text-left text-sm">
          <thead className="bg-muted text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">When</th>
              <th scope="col" className="px-3 py-2 font-medium">Download</th>
              <th scope="col" className="px-3 py-2 font-medium">Upload</th>
              <th scope="col" className="px-3 py-2 font-medium">Ping</th>
              <th scope="col" className="px-3 py-2 font-medium">Under load</th>
              <th scope="col" className="hidden px-3 py-2 font-medium @md:table-cell">Provider</th>
            </tr>
          </thead>
          <tbody className="divide-y tabular-nums">
            {shown.map((h) => (
              <tr key={h.at}>
                <td className="px-3 py-2 text-muted-foreground">{new Date(h.at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                <td className="px-3 py-2 text-foreground">{speedText(h.down, unit)}</td>
                <td className="px-3 py-2 text-foreground">{speedText(h.up, unit)}</td>
                <td className="px-3 py-2 text-foreground">{formatMs(h.ping)}</td>
                <td className={cn("px-3 py-2 font-medium", h.grade ? GRADE_CLS[h.grade] : "text-muted-foreground")}>{h.grade ?? "—"}</td>
                <td className="hidden max-w-[12rem] truncate px-3 py-2 text-muted-foreground @md:table-cell">{h.isp ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {records.length > PREVIEW && (
        <Button type="button" variant="ghost" size="sm" onClick={() => setAll((v) => !v)}>
          {all ? "Show fewer" : `Show all ${records.length}`}
        </Button>
      )}
    </ToolSection>
  );
}
