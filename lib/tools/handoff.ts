/**
 * Passing a result from one tool to the next ("Make a QR code" from the UTM
 * Builder). The value waits in this tab's session storage — never in the
 * address — and the next tool page takes it once, within two minutes.
 * `components/tool/extension-handoff.tsx` puts it into the tool.
 */

export type SiteHandoffPayload = { kind: "text"; text: string } | { kind: "url"; url: string };

const KEY = "tabbench:handoff";
const MAX_AGE_MS = 2 * 60 * 1000;

interface Stored {
  slug: string;
  payload: SiteHandoffPayload;
  /** Name of the sending tool, for the confirmation message. */
  from: string;
  at: number;
}

export function sendToTool(slug: string, payload: SiteHandoffPayload, from: string): void {
  try {
    const value: Stored = { slug, payload, from, at: Date.now() };
    sessionStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* private mode or storage blocked: the tool simply opens empty */
  }
}

/** Takes (and clears) a hand-off meant for `slug`, if there is a fresh one. */
export function takeHandoff(slug: string): { payload: SiteHandoffPayload; from: string } | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<Stored>;
    if (v.slug !== slug) return null;
    sessionStorage.removeItem(KEY);
    if (typeof v.at !== "number" || Date.now() - v.at > MAX_AGE_MS) return null;
    const p = v.payload;
    const ok =
      (p?.kind === "url" && typeof p.url === "string" && /^https?:\/\//.test(p.url) && p.url.length <= 4000) ||
      (p?.kind === "text" && typeof p.text === "string" && p.text.length <= 100_000);
    return ok ? { payload: p!, from: typeof v.from === "string" ? v.from.slice(0, 40) : "another tool" } : null;
  } catch {
    return null;
  }
}
