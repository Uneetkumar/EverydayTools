/**
 * Runs on tabbench.com only. When a tool is opened by the extension with
 * #tb-handoff=<id>, collect that hand-off from the background worker (once)
 * and pass it to the page, which fills the tool's input with it.
 */
import type { HandoffEnvelope } from "./shared/handoff";

const match = location.hash.match(/tb-handoff=([a-f0-9]{8,64})/);

if (match) {
  const id = match[1];
  // The id is single-use: drop it from the address bar straight away, so a
  // reload or a copied link does not try to collect it again.
  history.replaceState(history.state, "", location.pathname + location.search);

  chrome.runtime.sendMessage({ type: "handoff:take", id }).then((envelope: HandoffEnvelope | null) => {
    if (!envelope || !location.pathname.startsWith(`/tools/${envelope.slug}`)) return;

    let delivered = false;
    const deliver = () => {
      if (delivered) return;
      delivered = true;
      window.postMessage({ source: "tabbench-extension", type: "handoff", payload: envelope.payload }, location.origin);
    };

    // The site announces when its receiver is listening; it may already have.
    if (document.documentElement.dataset.tbHandoff === "ready") deliver();
    const onMessage = (e: MessageEvent) => {
      if (e.source !== window || e.origin !== location.origin) return;
      if (e.data?.source === "tabbench-site" && e.data.type === "handoff-ready") deliver();
      if (e.data?.source === "tabbench-site" && e.data.type === "handoff-received") window.removeEventListener("message", onMessage);
    };
    window.addEventListener("message", onMessage);
    // Give up quietly if the page never becomes ready (an old cached version).
    setTimeout(() => window.removeEventListener("message", onMessage), 30_000);
  });
}
