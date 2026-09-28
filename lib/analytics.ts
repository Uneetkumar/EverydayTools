"use client";

/**
 * Product analytics (Firebase / GA4), privacy-first.
 *
 * Rules, enforced by the parameter type:
 * - Parameters are tool slugs, categories, counts and enums — never anything a
 *   user typed or uploaded. Search is logged as query *length* and result
 *   count, not the query text. File events carry a size bucket and extension,
 *   never names or contents.
 * - The Firebase SDK is imported lazily on the first event, so it is not part
 *   of any page's initial JavaScript.
 * - Failures are swallowed: analytics must never break a tool.
 */
export type AnalyticsEvent =
  | "tool_view"
  | "tool_started"
  | "tool_completed"
  | "tool_error"
  | "search_used"
  | "search_result_clicked"
  | "favorite_added"
  | "favorite_removed"
  | "related_tool_clicked"
  | "download_started"
  | "download_completed";

type Primitive = string | number | boolean;
export type AnalyticsParams = Record<string, Primitive | undefined>;

type Logger = (event: string, params: Record<string, Primitive>) => void;

let loggerPromise: Promise<Logger | null> | null = null;

function getLogger(): Promise<Logger | null> {
  if (!loggerPromise) {
    loggerPromise = (async () => {
      try {
        const [{ initAnalytics }, { logEvent }] = await Promise.all([
          import("@/lib/firebase"),
          import("firebase/analytics"),
        ]);
        const analytics = await initAnalytics();
        if (!analytics) return null;
        return (event, params) => logEvent(analytics, event, params);
      } catch {
        return null;
      }
    })();
  }
  return loggerPromise;
}

export function track(event: AnalyticsEvent | "page_view", params: AnalyticsParams = {}): void {
  if (typeof window === "undefined") return;
  const clean: Record<string, Primitive> = {};
  for (const [k, v] of Object.entries(params)) if (v !== undefined) clean[k] = v;
  void getLogger().then((log) => {
    try {
      log?.(event, clean);
    } catch {
      /* never let analytics surface an error */
    }
  });
}

/** Coarse size bucket so file events never reveal an exact file. */
export function sizeBucket(bytes: number): string {
  if (bytes < 100 * 1024) return "<100KB";
  if (bytes < 1024 * 1024) return "100KB-1MB";
  if (bytes < 10 * 1024 * 1024) return "1-10MB";
  if (bytes < 100 * 1024 * 1024) return "10-100MB";
  return ">100MB";
}

/** The tool slug for the current page, if it is a tool page. */
export function currentToolSlug(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const m = window.location.pathname.match(/^\/tools\/([^/]+)/);
  return m?.[1];
}

/*
 * Funnel events for a single tool visit. Each fires at most once per visit
 * (a visit starts at tool_view), so the counts read as "visits that started"
 * and "visits that produced something", not as keystrokes or clicks.
 */
let visitId = 0;
const firedThisVisit = new Set<string>();

/** Called on tool_view: later started/completed events count toward this visit. */
export function beginToolVisit(): void {
  visitId += 1;
}

function trackOncePerVisit(event: "tool_started" | "tool_completed", params: AnalyticsParams = {}) {
  const tool = (params.tool as string | undefined) ?? currentToolSlug();
  if (!tool) return;
  const key = `${visitId}:${event}:${tool}`;
  if (firedThisVisit.has(key)) return;
  firedThisVisit.add(key);
  track(event, { ...params, tool });
}

/** First real interaction with a tool's controls. */
export function markToolStarted(): void {
  trackOncePerVisit("tool_started");
}

/**
 * The tool produced something the visitor took away: a copy, a download, a
 * generated result. Called from the moments that used to fire confetti.
 */
export function markToolCompleted(): void {
  trackOncePerVisit("tool_completed");
}

/** A tool failed in a way the visitor saw. `reason` is a fixed code, never a message. */
export function markToolError(reason: string): void {
  track("tool_error", { tool: currentToolSlug(), reason });
}
