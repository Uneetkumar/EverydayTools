/**
 * Reading what the test server says about itself.
 *
 * Cloudflare's speed-test endpoints answer with a `Server-Timing` header
 * (readable from a page because they send `Timing-Allow-Origin: *` and expose
 * the header). Two parts of it matter:
 *
 *   cfSpeedEdge;dur=2, cfSpeedWorker;dur=21
 *       How long the server spent producing the response. A ping that does not
 *       subtract this is wrong by that much: on a short route the raw round
 *       trip can be twice the real one.
 *
 *   cfL4;desc="?proto=TCP&rtt=26821&min_rtt=24034&sent=5&lost=0&retrans=0..."
 *       The server's own TCP statistics for the connection, in microseconds
 *       and packets. Retransmissions are the honest packet-loss signal a web
 *       page can get: browsers cannot send raw UDP probes.
 *
 * Subtracting server time follows Cloudflare's open-source (MIT) speedtest
 * library, which computes ping as time-to-first-byte minus server time.
 */

/** Smallest duration worth believing, in ms. */
const MIN_SERVER_TIME = 0.01;

/** Server processing time in ms, or undefined when the header has none. */
export function parseServerTime(header: string | null | undefined): number | undefined {
  if (!header) return undefined;
  const direct = header.match(/(?:^|,\s*)cfReq(?:uest)?Dur(?:ation)?;\s*dur=([0-9.]+)/i);
  if (direct && +direct[1] > MIN_SERVER_TIME) return +direct[1];
  let sum = 0;
  for (const m of header.matchAll(/(?:^|,\s*)cfSpeed[a-zA-Z]*;\s*dur=([0-9.]+)/gi)) sum += +m[1];
  return sum > MIN_SERVER_TIME ? sum : undefined;
}

export interface TcpSnapshot {
  /** Connection id: counters are cumulative per connection. */
  cid: string;
  proto?: string;
  /** Server-measured smoothed round trip, in ms. */
  rttMs?: number;
  /** Lowest round trip the server has seen on this connection, in ms. */
  minRttMs?: number;
  sent: number;
  recv: number;
  lost: number;
  retrans: number;
  /** When the page read it (performance.now()), so a window can start after the ramp-up. */
  at?: number;
}

/** The server's TCP statistics from a `cfL4` entry, or null when absent or malformed. */
export function parseTcpSnapshot(header: string | null | undefined): TcpSnapshot | null {
  if (!header) return null;
  const m = header.match(/cfL4;\s*desc="?\??([^"]*)"?/i);
  if (!m) return null;
  const p = new URLSearchParams(m[1]);
  const num = (k: string) => {
    const v = p.get(k);
    return v === null || v === "" ? undefined : Number(v);
  };
  const sent = num("sent");
  const retrans = num("retrans");
  const cid = p.get("cid");
  if (!cid || sent === undefined || !Number.isFinite(sent) || retrans === undefined || !Number.isFinite(retrans)) return null;
  const rtt = num("rtt");
  const minRtt = num("min_rtt");
  return {
    cid,
    proto: p.get("proto") ?? undefined,
    rttMs: rtt !== undefined && Number.isFinite(rtt) ? rtt / 1000 : undefined,
    minRttMs: minRtt !== undefined && Number.isFinite(minRtt) ? minRtt / 1000 : undefined,
    sent,
    recv: num("recv") ?? 0,
    lost: num("lost") ?? 0,
    retrans,
  };
}

export interface RetransmissionSummary {
  /** Distinct connections the test used. */
  connections: number;
  protocol?: string;
  /** Packets the server sent over the window, and how many were retransmitted. */
  sent: number;
  retrans: number;
  /** 0–1. */
  ratio: number;
  /** Lowest server-side round trip seen, in ms. */
  minRttMs?: number;
  rttMs?: number;
}

/**
 * Retransmissions over a window. Counters are cumulative per connection, so a
 * window's figures are the last snapshot minus the first, taken per connection.
 *
 * `fromMs` starts the window after the ramp-up. A new connection overshoots
 * and loses packets while TCP's slow start finds the line's speed; that is how
 * TCP works, not a fault, and counting it made healthy lines read several
 * percent (on HTTP/1.1, where counters arrive only at the start of each
 * chunk, the window was almost all slow start). Snapshots without a time are
 * always counted. Returns null when no connection has two snapshots to compare.
 */
export function summarizeTcp(snapshots: TcpSnapshot[], fromMs?: number): RetransmissionSummary | null {
  if (snapshots.length === 0) return null;
  const byCid = new Map<string, TcpSnapshot[]>();
  for (const s of snapshots) byCid.set(s.cid, [...(byCid.get(s.cid) ?? []), s]);
  let sent = 0;
  let retrans = 0;
  let minRtt: number | undefined;
  let rtt: number | undefined;
  let protocol: string | undefined;
  for (const list of byCid.values()) {
    // Counters only grow, so order by them: responses can arrive out of order.
    list.sort((a, b) => a.sent - b.sent);
    const last = list[list.length - 1];
    protocol ??= last.proto;
    if (last.minRttMs !== undefined) minRtt = minRtt === undefined ? last.minRttMs : Math.min(minRtt, last.minRttMs);
    if (last.rttMs !== undefined) rtt = rtt === undefined ? last.rttMs : Math.min(rtt, last.rttMs);
    const window = fromMs === undefined ? list : list.filter((s) => s.at === undefined || s.at >= fromMs);
    if (window.length < 2) continue;
    const first = window[0];
    const end = window[window.length - 1];
    sent += Math.max(0, end.sent - first.sent);
    retrans += Math.max(0, Math.max(end.retrans - first.retrans, end.lost - first.lost));
  }
  return {
    connections: byCid.size,
    protocol,
    sent,
    retrans,
    ratio: sent > 0 ? Math.min(1, retrans / sent) : 0,
    minRttMs: minRtt,
    rttMs: rtt,
  };
}
