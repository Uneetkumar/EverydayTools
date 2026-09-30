"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { runSpeedTest, SpeedTestError, type Mode, type Phase, type Progress, type SpeedResult } from "@/lib/speedtest/engine";
import type { Slice } from "@/lib/speedtest/stats";

export interface LiveState {
  phase: Phase;
  /** Live speed, Mbps, during a transfer. */
  mbps: number | null;
  /** 0–1 through the current phase. */
  fraction: number;
  latency: number | null;
  jitter: number | null;
  /** Ping under load right now. */
  loaded: number | null;
  /** The transfers so far, for the live chart. */
  down: Slice[];
  up: Slice[];
  /** Final speeds as each phase finishes, for the step readouts. */
  downDone: number | null;
  upDone: number | null;
}

const EMPTY: LiveState = { phase: "idle", mbps: null, fraction: 0, latency: null, jitter: null, loaded: null, down: [], up: [], downDone: null, upDone: null };

/**
 * Runs a test and exposes what the screen needs: live numbers while it runs,
 * the finished result, and any error. Stopping is an abort, not an error.
 */
export function useSpeedTest(onComplete: (r: SpeedResult) => void) {
  const [live, setLive] = useState<LiveState>(EMPTY);
  const [result, setResult] = useState<SpeedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const completeRef = useRef(onComplete);
  useEffect(() => {
    completeRef.current = onComplete;
  });
  useEffect(() => () => controller.current?.abort(), []);

  const running = live.phase !== "idle" && live.phase !== "done";

  const start = useCallback(async (mode: Mode) => {
    const ac = new AbortController();
    controller.current = ac;
    setError(null);
    setResult(null);
    setLive({ ...EMPTY, phase: "latency" });

    const onProgress = (p: Progress) =>
      setLive((prev) => {
        const next: LiveState = { ...prev, phase: p.phase };
        if (p.fraction !== undefined) next.fraction = p.fraction;
        if (p.phase === "latency") {
          if (p.latency !== undefined) next.latency = p.latency;
          if (p.jitter !== undefined) next.jitter = p.jitter;
          next.mbps = null;
        } else if (p.mbps !== undefined) {
          next.mbps = p.mbps;
        }
        if (p.loaded !== undefined) next.loaded = p.loaded;
        if (p.phase === "download") {
          if (p.timeline) next.down = p.timeline;
          if (p.fraction === 1 && p.mbps !== undefined) next.downDone = p.mbps;
        } else if (p.phase === "upload") {
          if (p.timeline) next.up = p.timeline;
          if (p.fraction === 1 && p.mbps !== undefined) next.upDone = p.mbps;
          if (prev.phase !== "upload") next.loaded = null;
        }
        return next;
      });

    try {
      const r = await runSpeedTest({ mode, signal: ac.signal, onProgress });
      setResult(r);
      setLive((prev) => ({
        ...prev,
        phase: "done",
        fraction: 1,
        mbps: r.download?.mbps ?? null,
        down: r.download?.timeline ?? prev.down,
        up: r.upload?.timeline ?? prev.up,
        downDone: r.download?.mbps ?? null,
        upDone: r.upload?.mbps ?? null,
      }));
      completeRef.current(r);
    } catch (e) {
      setLive(EMPTY);
      if (e instanceof SpeedTestError && e.kind === "aborted") setError(null);
      else setError(e instanceof SpeedTestError ? e.message : "The test could not finish.");
    }
  }, []);

  const stop = useCallback(() => controller.current?.abort(), []);

  return { live, result, error, running, start, stop };
}
