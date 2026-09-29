/**
 * Runs a regular expression away from the page, in a Web Worker, so a
 * pattern with catastrophic backtracking — (a+)+$ on a long line — can be
 * stopped after a moment instead of freezing the tab for good.
 */

export interface GroupHit {
  value: string | undefined;
  start: number;
  end: number;
}

export interface MatchHit {
  text: string;
  start: number;
  end: number;
  groups: GroupHit[];
}

export interface RunRequest {
  pattern: string;
  flags: string;
  text: string;
  replacement: string;
}

export type RunResult =
  | {
      ok: true;
      matches: MatchHit[];
      /** Stopped listing after this many. */
      capped: boolean;
      replaced: string;
      split: string[];
      ms: number;
    }
  | { ok: false; error: string; timeout?: boolean };

export const MAX_MATCHES = 5000;

/** The worker's code. Kept as plain JavaScript so it can be started from a Blob. */
export const WORKER_SOURCE = `
const MAX = ${MAX_MATCHES};
self.onmessage = (e) => {
  const { id, pattern, flags, text, replacement } = e.data;
  const t0 = performance.now();
  try {
    let re;
    let withIndices = true;
    try { re = new RegExp(pattern, flags.includes("d") ? flags : flags + "d"); }
    catch (err) { withIndices = false; re = new RegExp(pattern, flags); }
    const unicode = flags.includes("u") || flags.includes("v");
    const all = flags.includes("g") || flags.includes("y");
    const matches = [];
    let capped = false;
    const take = (m) => {
      const groups = [];
      for (let g = 1; g < m.length; g++) {
        const ix = withIndices && m.indices && m.indices[g];
        groups.push({ value: m[g], start: ix ? ix[0] : -1, end: ix ? ix[1] : -1 });
      }
      matches.push({ text: m[0], start: m.index, end: m.index + m[0].length, groups });
    };
    if (all) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text)) !== null) {
        take(m);
        if (matches.length >= MAX) { capped = true; break; }
        if (m[0] === "") {
          if (!flags.includes("g")) break;
          const cp = unicode ? text.codePointAt(re.lastIndex) : 0;
          re.lastIndex += cp !== undefined && cp > 0xffff ? 2 : 1;
        }
      }
    } else {
      const m = re.exec(text);
      if (m) take(m);
    }
    const replaced = text.replace(new RegExp(pattern, flags), replacement);
    const split = text.split(new RegExp(pattern, flags.replace(/[gy]/g, "")));
    self.postMessage({ id, ok: true, matches, capped, replaced, split, ms: performance.now() - t0 });
  } catch (err) {
    self.postMessage({ id, ok: false, error: String(err && err.message || err) });
  }
};
`;

/**
 * A reusable runner. `run` resolves with the result, or with a timeout error
 * after `timeoutMs`, in which case the stuck worker is thrown away.
 */
export function createRunner(timeoutMs = 1500) {
  let worker: Worker | null = null;
  let url: string | null = null;
  let seq = 0;
  let pending: { id: number; resolve: (r: RunResult) => void; timer: number } | null = null;

  const start = () => {
    url ??= URL.createObjectURL(new Blob([WORKER_SOURCE], { type: "text/javascript" }));
    worker = new Worker(url);
    worker.onmessage = (e: MessageEvent<{ id: number } & RunResult>) => {
      if (!pending || e.data.id !== pending.id) return;
      window.clearTimeout(pending.timer);
      const { resolve } = pending;
      pending = null;
      const { id: _id, ...result } = e.data;
      void _id;
      resolve(result as RunResult);
    };
  };

  const kill = () => {
    worker?.terminate();
    worker = null;
  };

  return {
    run(req: RunRequest): Promise<RunResult> {
      // A newer request replaces an older one still running.
      if (pending) {
        window.clearTimeout(pending.timer);
        pending.resolve({ ok: false, error: "superseded" });
        pending = null;
        kill();
      }
      if (!worker) start();
      const id = ++seq;
      return new Promise((resolve) => {
        const timer = window.setTimeout(() => {
          if (pending?.id !== id) return;
          pending = null;
          kill();
          resolve({ ok: false, timeout: true, error: `Stopped after ${timeoutMs / 1000} seconds.` });
        }, timeoutMs);
        pending = { id, resolve, timer };
        worker!.postMessage({ id, ...req });
      });
    },
    dispose() {
      if (pending) window.clearTimeout(pending.timer);
      pending = null;
      kill();
      if (url) URL.revokeObjectURL(url);
      url = null;
    },
  };
}

export interface CommonPattern {
  id: string;
  label: string;
  pattern: string;
  flags: string;
  sample: string;
}

/** Starting points, including the Indian formats people most often validate. Sample data is made up. */
export const COMMON_PATTERNS: CommonPattern[] = [
  {
    id: "email",
    label: "Email",
    pattern: "[\\w.+-]+@[\\w-]+(?:\\.[\\w-]+)+",
    flags: "gi",
    sample: "Write to alice@example.com or support+billing@mail.example.co.in, not to @example or bob@localhost.",
  },
  {
    id: "url",
    label: "URL",
    pattern: "https?:\\/\\/[\\w.-]+(?:\\.[a-z]{2,})(?::\\d+)?(?:\\/[^\\s]*)?",
    flags: "gi",
    sample: "Docs at https://example.com/docs?page=2 and http://localhost:3000 (no TLD) or www.example.org.",
  },
  {
    id: "mobile-in",
    label: "Indian mobile",
    pattern: "(?:\\+91[\\s-]?|0)?[6-9]\\d{4}[\\s-]?\\d{5}\\b",
    flags: "g",
    sample: "Call +91 98765 43210, 09876543210 or 7012345678. Not valid: 5123456789, 12345.",
  },
  { id: "pin", label: "PIN code", pattern: "\\b[1-9]\\d{2}\\s?\\d{3}\\b", flags: "g", sample: "Delhi 110001, Mumbai 400 001. Not valid: 012345, 1100011." },
  { id: "pan", label: "PAN", pattern: "\\b[A-Z]{3}[ABCFGHLJPT][A-Z]\\d{4}[A-Z]\\b", flags: "g", sample: "PAN ABCPE1234F is well-formed; ABCDE1234 and abcpe1234f are not." },
  {
    id: "gstin",
    label: "GSTIN",
    pattern: "\\b\\d{2}[A-Z]{5}\\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]\\b",
    flags: "g",
    sample: "GSTIN 27ABCPE1234F1Z5 looks right; 27ABCPE1234F1X5 does not.",
  },
  { id: "ifsc", label: "IFSC", pattern: "\\b[A-Z]{4}0[A-Z0-9]{6}\\b", flags: "g", sample: "Branch codes SBIN0001234 and HDFC0ABC123. Not valid: SBIN1001234." },
  {
    id: "date",
    label: "Date (YYYY-MM-DD)",
    pattern: "\\b(?<year>\\d{4})-(?<month>0[1-9]|1[0-2])-(?<day>0[1-9]|[12]\\d|3[01])\\b",
    flags: "g",
    sample: "Due 2026-09-29, paid 2026-10-01. Not valid: 2026-13-01, 2026-02-32.",
  },
  {
    id: "ipv4",
    label: "IPv4 address",
    pattern: "\\b(?:(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\b",
    flags: "g",
    sample: "Servers 192.168.1.10 and 10.0.0.255; 256.1.1.1 is out of range.",
  },
  { id: "hex", label: "Hex colour", pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b", flags: "g", sample: "Brand #2563EB, text #111 and #abcdef. Not a colour: #12345, #xyz." },
];
