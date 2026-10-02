"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clapperboard, Cloud, CloudUpload, Copy, Download, Eye, EyeOff, Gamepad2, Globe, Info, Share2, Tv, Video, XCircle, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { ToolSection } from "@/components/tool/kit";
import { Button } from "@/components/ui/button";
import {
  activities,
  bufferbloat,
  capacity,
  experiences,
  headline,
  insights,
  meetsFccBenchmark,
  TRANSFER_EXAMPLES,
  transferSeconds,
  type Grade,
  type InsightTone,
  type Verdict,
} from "@/lib/speedtest/aim";
import type { SpeedResult } from "@/lib/speedtest/engine";
import { formatDuration, formatMs, formatPercent, providerName, type SpeedUnit } from "@/lib/speedtest/format";
import { reportJson, summaryText, toMeasurements } from "@/lib/speedtest/result";
import { formatBytes } from "@/lib/http/mime";
import { cn } from "@/lib/utils";
import { LatencyBars } from "./charts";

export interface NetInfo {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  type?: string;
}

const ACTIVITY_ICON: Record<string, LucideIcon> = {
  browsing: Globe,
  hd: Tv,
  "4k": Clapperboard,
  calls: Video,
  gaming: Gamepad2,
  "cloud-gaming": Cloud,
  uploads: CloudUpload,
};

/** The whole result in one colour: set by the weakest of streaming, gaming and calls, as the headline is. */
const OVERALL = {
  good: { icon: CheckCircle2, card: "border-success/30 bg-success/5", badge: "bg-success/15 text-success" },
  warn: { icon: AlertTriangle, card: "border-warning/30 bg-warning/5", badge: "bg-warning/15 text-warning" },
  bad: { icon: XCircle, card: "border-destructive/30 bg-destructive/5", badge: "bg-destructive/15 text-destructive" },
} as const;

const MODE_NAME = { quick: "Quick", full: "Full", extended: "Extended" } as const;

const VERDICT: Record<Verdict, { label: string; cls: string }> = {
  great: { label: "Great", cls: "bg-success/10 text-success" },
  good: { label: "Good", cls: "bg-success/10 text-success" },
  ok: { label: "Borderline", cls: "bg-warning/10 text-warning" },
  poor: { label: "Not enough", cls: "bg-destructive/10 text-destructive" },
};

const GRADE_TONE: Record<Grade, string> = {
  "A+": "bg-success/10 text-success ring-success/25",
  A: "bg-success/10 text-success ring-success/25",
  B: "bg-success/10 text-success ring-success/25",
  C: "bg-warning/10 text-warning ring-warning/30",
  D: "bg-destructive/10 text-destructive ring-destructive/30",
  F: "bg-destructive/10 text-destructive ring-destructive/30",
};

const INSIGHT: Record<InsightTone, { icon: typeof Info; cls: string; iconCls: string }> = {
  good: { icon: CheckCircle2, cls: "border-success/30 bg-success/5", iconCls: "text-success" },
  info: { icon: Info, cls: "bg-background", iconCls: "text-muted-foreground" },
  warn: { icon: AlertTriangle, cls: "border-warning/30 bg-warning/5", iconCls: "text-warning" },
  bad: { icon: XCircle, cls: "border-destructive/30 bg-destructive/5", iconCls: "text-destructive" },
};

const steadiness = (c: number | null | undefined) => (c === null || c === undefined ? null : c >= 0.85 ? "steady" : c >= 0.65 ? "some variation" : "unsteady");

function saveFile(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Report({ result, unit, plan, net }: { result: SpeedResult; unit: SpeedUnit; plan: { down: number | null; up: number | null }; net: NetInfo | null }) {
  const [showIp, setShowIp] = useState(false);
  const m = useMemo(
    () => toMeasurements(result, { planDown: plan.down, planUp: plan.up, saveData: net?.saveData, cellular: net?.type === "cellular" }),
    [result, plan.down, plan.up, net?.saveData, net?.type]
  );
  const bloat = bufferbloat(m.loadedIncrease);
  const rows = useMemo(() => activities(m), [m]);
  const room = capacity(m);
  const notes = useMemo(() => insights(m), [m]);
  const fcc = meetsFccBenchmark(m);
  const { download: dl, upload: ul, latency: lat, tcp, meta } = result;
  const idle = lat?.median ?? null;
  const weakest = experiences(m).reduce((lowest, e) => Math.min(lowest, e.level), 4);
  const overall = OVERALL[weakest >= 3 ? "good" : weakest === 2 ? "warn" : "bad"];
  const isp = providerName(meta.isp);
  const ip = meta.ip;
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText(result, unit));
      toast.success("Result copied");
    } catch {
      toast.error("Could not copy. Select the text and copy it instead.");
    }
  };
  const share = () => {
    void navigator.share({ title: "My internet speed", text: summaryText(result, unit) }).catch(() => undefined);
  };

  const details: Array<[string, React.ReactNode]> = [
    [
      "Provider",
      isp ? (
        <span title={meta.isp}>
          {isp}
          {meta.asn ? <span className="text-muted-foreground"> · AS{meta.asn}</span> : null}
        </span>
      ) : (
        "Not reported"
      ),
    ],
    ["Test server", meta.colo ? `Cloudflare ${meta.coloCity ?? meta.colo}${meta.colo && meta.coloCity ? ` (${meta.colo})` : ""}` : "Nearest Cloudflare data centre"],
    ["Your location, from your IP", [meta.city, meta.region, meta.country].filter(Boolean).join(", ") || "Not reported"],
    [
      "Your public IP",
      ip ? (
        <span className="inline-flex items-center gap-2">
          <span className="font-mono">{showIp ? ip : ip.replace(/[0-9a-f]/gi, "•")}</span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{ip.includes(":") ? "IPv6" : "IPv4"}</span>
          <button type="button" onClick={() => setShowIp((v) => !v)} className="inline-flex items-center gap-1 rounded text-xs text-link outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50" aria-label={showIp ? "Hide IP address" : "Show IP address"}>
            {showIp ? <EyeOff className="size-3.5" aria-hidden="true" /> : <Eye className="size-3.5" aria-hidden="true" />} {showIp ? "Hide" : "Show"}
          </button>
        </span>
      ) : (
        "Not reported"
      ),
    ],
    ["Connection", `${result.protocol ?? "HTTPS"} · ${tcp?.connections ?? "?"} connection${tcp?.connections === 1 ? "" : "s"}, ${dl?.streams ?? "?"} parallel streams`],
    [
      "Packets resent (TCP)",
      tcp && tcp.sent >= 200 ? `${tcp.retrans.toLocaleString()} of ${tcp.sent.toLocaleString()} (${formatPercent(tcp.ratio, tcp.ratio < 0.001 ? 2 : 1)})` : "Not enough data to tell",
    ],
    ["Ping range", lat ? `${formatMs(lat.min)} to ${formatMs(lat.max)} · slowest 5% ${formatMs(lat.p95)}` : "Not measured"],
    ["Server-side round trip", tcp?.minRttMs !== undefined ? formatMs(tcp.minRttMs) : "Not reported"],
    ["Ping method", result.serverTimeRemoved ? "First byte, less server processing time" : "Full request time"],
    ["Data used", `${formatBytes(result.bytesDownloaded + result.bytesUploaded)} in ${formatDuration(result.durationMs / 1000)}`],
  ];

  return (
    <div className="space-y-8">
      {/* Verdict ------------------------------------------------------------- */}
      <div className={cn("rounded-xl border p-4 sm:p-5", overall.card)}>
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <div className="flex min-w-0 flex-1 basis-72 items-start gap-3.5">
            <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", overall.badge)}>
              <overall.icon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                {MODE_NAME[result.mode]} test · {new Date(result.finishedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                {isp ? ` · ${isp}` : ""}
              </p>
              <h3 className="mt-1 text-base font-semibold text-pretty text-foreground sm:text-lg">{headline(m)}</h3>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {bloat && <span className={cn("rounded-full px-2.5 py-1 font-medium ring-1 ring-inset", GRADE_TONE[bloat.grade])}>Responsiveness {bloat.grade}</span>}
                {fcc !== null && (
                  <span className={cn("rounded-full px-2.5 py-1 ring-1 ring-inset", fcc ? "bg-success/10 text-success ring-success/25" : "bg-muted text-muted-foreground ring-border")}>
                    {fcc ? "Meets" : "Below"} the 100/20 Mbps broadband benchmark (FCC)
                  </span>
                )}
                {steadiness(dl?.consistency) && <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground ring-1 ring-border ring-inset">Download speed {steadiness(dl?.consistency)}</span>}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={copy}>
              <Copy aria-hidden="true" /> Copy result
            </Button>
            {canShare && (
              <Button type="button" variant="outline" size="sm" onClick={share}>
                <Share2 aria-hidden="true" /> Share
              </Button>
            )}
            <Button type="button" variant="outline" size="sm" onClick={() => saveFile(`speed-test-${new Date(result.finishedAt).toISOString().slice(0, 16).replace(/[:T]/g, "-")}.json`, reportJson(result), "application/json")}>
              <Download aria-hidden="true" /> Report (JSON)
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-8 @3xl:grid-cols-2">
        {/* Responsiveness ---------------------------------------------------- */}
        <ToolSection title="Responsiveness under load" description="How much slower the connection answers while it is busy. This is what makes calls and games lag.">
          {bloat ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3.5">
                <div className={cn("grid size-14 shrink-0 place-items-center rounded-xl text-2xl font-bold ring-1 ring-inset", GRADE_TONE[bloat.grade])} aria-label={`Grade ${bloat.grade}`}>
                  {bloat.grade}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {bloat.headline}
                    <span className="ml-2 font-normal text-muted-foreground tabular-nums">+{Math.round(bloat.increase)} ms under load</span>
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{bloat.detail}</p>
                </div>
              </div>
              <LatencyBars
                rows={[
                  { label: "Idle", median: idle, p95: lat?.p95, tone: "idle" },
                  { label: "While downloading", median: dl?.loaded?.median ?? null, p95: dl?.loaded?.p95, tone: "load", extra: dl?.loaded && idle !== null ? dl.loaded.median - idle : null },
                  { label: "While uploading", median: ul?.loaded?.median ?? null, p95: ul?.loaded?.p95, tone: "load", extra: ul?.loaded && idle !== null ? ul.loaded.median - idle : null },
                ]}
              />
              <p className="text-xs text-muted-foreground">Grades follow the widely used scale: A+ under 5 ms added, A under 30, B under 60, C under 200, D under 400, F beyond. The tick marks the slowest 5% of pings.</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">The connection was too slow to take loaded readings. Try the Full test.</p>
          )}
        </ToolSection>

        {/* Activities -------------------------------------------------------- */}
        <ToolSection title="What you can do" description="Checked against what each activity needs, and against latency, jitter and packet loss where they matter.">
          <ul className="divide-y rounded-lg border bg-background">
            {rows.map((c) => {
              const Icon = ACTIVITY_ICON[c.id] ?? Globe;
              return (
                <li key={c.id} className="flex items-center gap-3 px-3.5 py-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{c.label}</p>
                    <p className="text-xs text-muted-foreground">
                      Needs {c.need}
                      {c.note && c.verdict !== "great" ? ` · held back because ${c.note}` : ""}
                    </p>
                  </div>
                  <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", VERDICT[c.verdict].cls)}>
                    <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
                    {VERDICT[c.verdict].label}
                  </span>
                </li>
              );
            })}
          </ul>
          {(room.streams4k > 0 || room.streamsHd > 0) && (
            <p className="text-sm text-muted-foreground">
              At once, leaving 20% spare: about <strong className="font-semibold text-foreground">{room.streamsHd}</strong> HD streams, <strong className="font-semibold text-foreground">{room.streams4k}</strong> 4K streams, or <strong className="font-semibold text-foreground">{room.calls}</strong> HD video calls.
            </p>
          )}
        </ToolSection>
      </div>

      {/* Insights ------------------------------------------------------------ */}
      <ToolSection title="What stands out" description="Worked out from your numbers, with what to try.">
        <ul className="grid gap-2.5 @3xl:grid-cols-2">
          {notes.map((n) => {
            const t = INSIGHT[n.tone];
            return (
              <li key={n.id} className={cn("flex gap-3 rounded-lg border p-3.5", t.cls)}>
                <t.icon className={cn("mt-0.5 size-4 shrink-0", t.iconCls)} aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </ToolSection>

      <div className="grid gap-8 @3xl:grid-cols-2">
        <ToolSection title="Connection details">
          <dl className="divide-y rounded-lg border bg-background text-sm">
            {details.map(([k, v]) => (
              <div key={k} className="flex flex-col gap-0.5 px-3.5 py-2 @md:flex-row @md:items-baseline @md:justify-between @md:gap-4">
                <dt className="shrink-0 text-muted-foreground">{k}</dt>
                <dd className="min-w-0 text-foreground @md:text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </ToolSection>

        <ToolSection title="How long things take" description="At the speeds measured here, in ideal conditions.">
          <div className="overflow-hidden rounded-lg border bg-background">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y tabular-nums">
                {TRANSFER_EXAMPLES.map((e) => (
                  <tr key={e.label}>
                    <th scope="row" className="px-3.5 py-2 font-normal text-foreground">
                      {e.label}
                    </th>
                    <td className="px-3.5 py-2 text-right font-medium text-foreground">{formatDuration(transferSeconds(e.bytes, e.direction === "down" ? m.download : m.upload))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ToolSection>
      </div>
    </div>
  );
}
