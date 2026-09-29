"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { takeHandoff } from "@/lib/tools/handoff";

/**
 * Receives content sent from the TabBench browser extension ("Summarise",
 * "Compress image" and so on from the right-click menu) and puts it into the
 * tool on this page.
 *
 * The extension's content script collects the hand-off and posts it to this
 * window; nothing travels in the URL. Tools are not modified individually:
 * text goes into the workspace's first text box, a link into its URL field,
 * and a file into the first file picker that accepts it — exactly as if the
 * visitor had pasted or dropped it.
 *
 * It also receives results passed from another tool on the site (see
 * lib/tools/handoff.ts), the same way.
 */

type Payload =
  | { kind: "text"; text: string }
  | { kind: "url"; url: string }
  | { kind: "file"; name: string; type: string; data: string }
  | { kind: "notice"; message: string };

const WAIT_MS = 15_000;

function isPayload(p: unknown): p is Payload {
  if (!p || typeof p !== "object") return false;
  const o = p as Record<string, unknown>;
  switch (o.kind) {
    case "text":
      return typeof o.text === "string" && o.text.length <= 100_000;
    case "url":
      return typeof o.url === "string" && /^https?:\/\//.test(o.url) && o.url.length <= 4000;
    case "file":
      return typeof o.name === "string" && typeof o.type === "string" && typeof o.data === "string" && o.data.length <= 12_000_000;
    case "notice":
      return typeof o.message === "string" && o.message.length <= 300;
    default:
      return false;
  }
}

/** Resolves with the first element matching `find` once the tool has rendered. */
function waitFor<T extends Element>(find: (root: Element) => T | null): Promise<T | null> {
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      const root = document.querySelector("[data-tool-workspace]");
      const el = root ? find(root) : null;
      if (el) return resolve(el);
      if (Date.now() - start > WAIT_MS) return resolve(null);
      setTimeout(tick, 150);
    };
    tick();
  });
}

/** Set a value the way typing would, so React's onChange sees it. */
function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

const editable = (el: Element) =>
  !(el as HTMLInputElement).readOnly && !(el as HTMLInputElement).disabled && (el as HTMLElement).offsetParent !== null;

function accepts(input: HTMLInputElement, file: File): boolean {
  const accept = input.accept.trim();
  if (!accept) return true;
  return accept.split(",").some((raw) => {
    const a = raw.trim().toLowerCase();
    if (a.startsWith(".")) return file.name.toLowerCase().endsWith(a);
    if (a.endsWith("/*")) return file.type.startsWith(a.slice(0, -1));
    return file.type === a;
  });
}

async function deliver(payload: Payload): Promise<boolean> {
  if (payload.kind === "notice") {
    toast.info(payload.message);
    return true;
  }

  if (payload.kind === "text" || payload.kind === "url") {
    const value = payload.kind === "text" ? payload.text : payload.url;
    // querySelectorAll returns document order whatever the selector order,
    // so each kind of field is tried in turn: the main text box first.
    const order =
      payload.kind === "url"
        ? ['input[type="url"]', "textarea", 'input[type="text"], input:not([type])']
        : ["textarea", 'input[type="text"], input:not([type])'];
    const target = await waitFor((root) => {
      for (const selector of order) {
        const hit = [...root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(selector)].find(editable);
        if (hit) return hit;
      }
      return null;
    });
    if (!target) return false;
    setNativeValue(target, value);
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "center", behavior: "smooth" });
    return true;
  }

  const bytes = Uint8Array.from(atob(payload.data), (c) => c.charCodeAt(0));
  const file = new File([bytes], payload.name, { type: payload.type });
  const input = await waitFor((root) => [...root.querySelectorAll<HTMLInputElement>('input[type="file"]')].find((i) => !i.disabled && accepts(i, file)) ?? null);
  if (!input) {
    toast.error("This tool can't open that type of file.", { description: "Save the image and try another tool." });
    return true;
  }
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

export function ExtensionHandoff() {
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== window || e.origin !== window.location.origin) return;
      const data = e.data as { source?: string; type?: string; payload?: unknown } | null;
      if (data?.source !== "tabbench-extension" || data.type !== "handoff" || !isPayload(data.payload)) return;
      window.postMessage({ source: "tabbench-site", type: "handoff-received" }, window.location.origin);
      void deliver(data.payload).then((ok) => {
        if (!ok) toast.error("Couldn't add that to this tool.", { description: "Paste or drop it in instead." });
        else if (data.payload && (data.payload as Payload).kind !== "notice") toast.success("Added from the TabBench extension");
      });
    };
    window.addEventListener("message", onMessage);

    // A result passed from another tool in this tab ("Make a QR code").
    const slug = window.location.pathname.match(/^\/tools\/([^/]+)/)?.[1];
    const fromTool = slug ? takeHandoff(slug) : null;
    if (fromTool) {
      void deliver(fromTool.payload).then((ok) => {
        if (ok) toast.success(`Added from ${fromTool.from}`);
      });
    }

    document.documentElement.dataset.tbHandoff = "ready";
    window.postMessage({ source: "tabbench-site", type: "handoff-ready" }, window.location.origin);
    return () => {
      window.removeEventListener("message", onMessage);
      delete document.documentElement.dataset.tbHandoff;
    };
  }, []);

  return null;
}
