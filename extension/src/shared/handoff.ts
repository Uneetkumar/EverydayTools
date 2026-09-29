/**
 * Hand-off: how text, a link or an image travels from the page you are on to
 * a tool on tabbench.com.
 *
 * The content never goes into a URL. The background worker keeps it in
 * session storage (memory only, cleared when the browser closes) under a
 * random id, opens the tool with that id in the URL fragment, and the
 * content script on tabbench.com collects it — once — and passes it to the
 * page with postMessage. The site fills the tool's input with it.
 */

export type HandoffPayload =
  | { kind: "text"; text: string }
  | { kind: "url"; url: string }
  | { kind: "file"; name: string; type: string; data: string /* base64 */ }
  | { kind: "notice"; message: string };

export interface HandoffEnvelope {
  slug: string;
  payload: HandoffPayload;
  created: number;
}

/** Largest file handed over. chrome.storage.session holds 10 MB in total. */
export const MAX_FILE_BYTES = 7 * 1024 * 1024;
/** Longest text handed over (about 12,000 words). */
export const MAX_TEXT_CHARS = 80_000;

export const HANDOFF_PREFIX = "handoff:";
export const PENDING_PREFIX = "pending:";

export function newId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Messages between the extension's pages, worker and content script. */
export type ExtensionMessage =
  | { type: "handoff:take"; id: string }
  | { type: "open-tool"; slug: string; payload?: HandoffPayload; tabId?: number }
  | { type: "summarize-tab"; tabId: number }
  | { type: "pending:retry"; id: string }
  | { type: "pending:cancel"; id: string };
