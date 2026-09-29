/**
 * Service worker: right-click menu, the address-bar keyword, and the hand-off
 * of text, links and images to tools on tabbench.com.
 */
import { siteUrl, toolUrl } from "./shared/config";
import {
  HANDOFF_PREFIX,
  MAX_FILE_BYTES,
  MAX_TEXT_CHARS,
  PENDING_PREFIX,
  newId,
  type ExtensionMessage,
  type HandoffEnvelope,
  type HandoffPayload,
} from "./shared/handoff";
import { addRecent, getSettings } from "./shared/storage";
import { getTool, search } from "./shared/tools";

/* ------------------------------------------------------------------ */
/* Right-click menu                                                    */
/* ------------------------------------------------------------------ */

type Ctx = "selection" | "image" | "link" | "page";

const MENU: { ctx: Ctx; slug: string; title: string }[] = [
  { ctx: "selection", slug: "word-counter", title: "Count words" },
  { ctx: "selection", slug: "case-converter", title: "Change case" },
  { ctx: "selection", slug: "ai-text-summarizer", title: "Summarise" },
  { ctx: "selection", slug: "ai-text-rewriter", title: "Rewrite in another tone" },
  { ctx: "selection", slug: "ai-text-simplifier", title: "Simplify to plain English" },
  { ctx: "selection", slug: "text-to-speech", title: "Read aloud" },
  { ctx: "selection", slug: "json-formatter", title: "Format as JSON" },

  { ctx: "image", slug: "image-compressor", title: "Compress image" },
  { ctx: "image", slug: "png-to-jpg", title: "Convert to JPG" },
  { ctx: "image", slug: "image-to-webp", title: "Convert to WebP" },
  { ctx: "image", slug: "image-resizer", title: "Resize image" },
  { ctx: "image", slug: "crop-image", title: "Crop image" },
  { ctx: "image", slug: "image-to-text", title: "Extract text (OCR)" },
  { ctx: "image", slug: "exif-viewer", title: "View or remove metadata" },
  { ctx: "image", slug: "image-to-pdf", title: "Make a PDF" },

  { ctx: "link", slug: "qr-code-generator", title: "QR code for this link" },

  { ctx: "page", slug: "qr-code-generator", title: "QR code for this page" },
  { ctx: "page", slug: "ai-text-summarizer", title: "Summarise this page" },
];

/** Image types each tool opens; others are converted to PNG first. */
const IMAGE_ACCEPT: Record<string, string[]> = {
  "image-compressor": ["image/jpeg", "image/png", "image/webp"],
  "image-to-pdf": ["image/jpeg", "image/png"],
};

async function buildMenu(): Promise<void> {
  await chrome.contextMenus.removeAll();
  const { contextMenu } = await getSettings();
  if (!contextMenu) return;
  chrome.contextMenus.create({ id: "tb", title: "TabBench", contexts: ["selection", "image", "link", "page"] });
  for (const item of MENU) {
    chrome.contextMenus.create({ id: `tb:${item.ctx}:${item.slug}`, parentId: "tb", title: item.title, contexts: [item.ctx] });
  }
}

chrome.runtime.onInstalled.addListener(() => void buildMenu());
chrome.runtime.onStartup.addListener(() => void buildMenu());
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.settings) void buildMenu();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const [, ctx, slug] = String(info.menuItemId).split(":") as [string, Ctx, string];
  if (!slug) return;
  void (async () => {
    switch (ctx) {
      case "selection":
        return openTool(slug, { kind: "text", text: await selectedText(info, tab) }, tab);
      case "link":
        return info.linkUrl ? openTool(slug, { kind: "url", url: info.linkUrl }, tab) : undefined;
      case "page":
        if (slug === "ai-text-summarizer" && tab?.id !== undefined) return summarizeTab(tab);
        return tab?.url ? openTool(slug, { kind: "url", url: tab.url }, tab) : undefined;
      case "image":
        return info.srcUrl ? handleImage(slug, info.srcUrl, tab) : undefined;
    }
  })();
});

/* ------------------------------------------------------------------ */
/* Opening tools and handing content over                              */
/* ------------------------------------------------------------------ */

async function openTool(slug: string, payload: HandoffPayload | undefined, from?: chrome.tabs.Tab, sameTab = false) {
  if (!getTool(slug)) return;
  await addRecent(slug);
  let id: string | undefined;
  if (payload) {
    id = newId();
    const envelope: HandoffEnvelope = { slug, payload, created: Date.now() };
    await chrome.storage.session.set({ [HANDOFF_PREFIX + id]: envelope });
    void pruneSession();
  }
  const url = toolUrl(slug, id);
  if (sameTab && from?.id !== undefined) {
    await chrome.tabs.update(from.id, { url });
  } else {
    await chrome.tabs.create({
      url,
      ...(from?.index !== undefined ? { index: from.index + 1 } : {}),
      ...(from?.id !== undefined ? { openerTabId: from.id } : {}),
    });
  }
}

/** Drop hand-offs nobody collected (a closed tab, a failed load). */
async function pruneSession(): Promise<void> {
  const all = await chrome.storage.session.get(null);
  const stale = Object.entries(all)
    .filter(([k, v]) => (k.startsWith(HANDOFF_PREFIX) || k.startsWith(PENDING_PREFIX)) && Date.now() - ((v as { created?: number }).created ?? 0) > 10 * 60_000)
    .map(([k]) => k);
  if (stale.length) await chrome.storage.session.remove(stale);
}

/** The selection with its line breaks; the menu's selectionText flattens them. */
async function selectedText(info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab): Promise<string> {
  const fallback = info.selectionText ?? "";
  if (tab?.id === undefined) return fallback.slice(0, MAX_TEXT_CHARS);
  try {
    const [res] = await chrome.scripting.executeScript({
      target: { tabId: tab.id, frameIds: [info.frameId ?? 0] },
      func: () => String(getSelection()?.toString() ?? ""),
    });
    const text = typeof res?.result === "string" && res.result.trim() ? res.result : fallback;
    return text.slice(0, MAX_TEXT_CHARS);
  } catch {
    // A cross-origin frame the click did not grant access to.
    return fallback.slice(0, MAX_TEXT_CHARS);
  }
}

/** Readable text of the page: headings, paragraphs and list items, not menus and footers. */
function extractReadableText(): { title: string; text: string } {
  const root = document.querySelector("article") ?? document.querySelector("main") ?? document.body;
  const skip = "nav, header, footer, aside, form, [role=navigation], [role=banner], [role=contentinfo], [aria-hidden=true]";
  const parts: string[] = [];
  root.querySelectorAll<HTMLElement>("h1, h2, h3, h4, p, li, blockquote, pre, figcaption, td").forEach((el) => {
    if (el.closest(skip)) return;
    // A <p> inside an <li> is collected once, through the <li>.
    if (el.parentElement?.closest("li, blockquote, td") && el.tagName === "P") return;
    const t = el.innerText.replace(/\s+/g, " ").trim();
    if (t.length > 1) parts.push(t);
  });
  let text = parts.join("\n\n");
  if (text.length < 200) text = (root as HTMLElement).innerText.replace(/\n{3,}/g, "\n\n").trim();
  return { title: document.title, text };
}

async function summarizeTab(tab: chrome.tabs.Tab): Promise<void> {
  let text = "";
  try {
    const [res] = await chrome.scripting.executeScript({ target: { tabId: tab.id! }, func: extractReadableText });
    const r = res?.result as { title: string; text: string } | undefined;
    if (r?.text) text = (r.title ? `${r.title}\n\n` : "") + r.text;
  } catch {
    /* pages such as the Chrome Web Store and chrome:// cannot be read */
  }
  const payload: HandoffPayload = text.trim()
    ? { kind: "text", text: text.slice(0, MAX_TEXT_CHARS) }
    : { kind: "notice", message: "This page's text could not be read. Copy the text you want summarised and paste it here." };
  await openTool("ai-text-summarizer", payload, tab);
}

/* ------------------------------------------------------------------ */
/* Images                                                              */
/* ------------------------------------------------------------------ */

class NeedsPermission extends Error {}

function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

function fileName(srcUrl: string, type: string): string {
  const ext = (type.split("/")[1] ?? "png").replace("jpeg", "jpg").replace(/\+.*$/, "");
  try {
    const last = decodeURIComponent(new URL(srcUrl).pathname.split("/").pop() ?? "");
    if (/^[\w\-. ]{1,80}\.(jpe?g|png|webp|gif|avif|bmp|tiff?)$/i.test(last)) return last;
  } catch {
    /* data: URLs have no name */
  }
  return `image.${ext}`;
}

async function fetchImage(srcUrl: string): Promise<Blob> {
  if (srcUrl.startsWith("blob:")) throw new Error("blob");
  let res: Response;
  try {
    res = await fetch(srcUrl, { credentials: "include" });
  } catch {
    const origin = new URL(srcUrl).origin;
    const granted = await chrome.permissions.contains({ origins: [`${origin}/*`] });
    if (!granted) throw new NeedsPermission(origin);
    throw new Error("network");
  }
  if (!res.ok) throw new Error(`http ${res.status}`);
  return res.blob();
}

async function toAcceptedType(blob: Blob, slug: string): Promise<Blob> {
  const accepted = IMAGE_ACCEPT[slug];
  if (!accepted || accepted.includes(blob.type)) return blob;
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
  return canvas.convertToBlob({ type: "image/png" });
}

async function handleImage(slug: string, srcUrl: string, tab?: chrome.tabs.Tab): Promise<void> {
  try {
    let blob = await fetchImage(srcUrl);
    if (!blob.type.startsWith("image/") && !srcUrl.startsWith("data:image/")) throw new Error("not-image");
    blob = await toAcceptedType(blob, slug);
    if (blob.size > MAX_FILE_BYTES) {
      return openTool(slug, { kind: "notice", message: "That image is too large to send from the page. Save it, then drop it here." }, tab);
    }
    const data = toBase64(new Uint8Array(await blob.arrayBuffer()));
    const type = blob.type || "image/png";
    await openTool(slug, { kind: "file", name: fileName(srcUrl, type), type, data }, tab);
  } catch (e) {
    if (e instanceof NeedsPermission) {
      const id = newId();
      await chrome.storage.session.set({ [PENDING_PREFIX + id]: { slug, srcUrl, tabId: tab?.id, index: tab?.index, created: Date.now() } });
      const page = chrome.runtime.getURL(`permission.html?id=${id}&origin=${encodeURIComponent(e.message)}`);
      await chrome.windows.create({ url: page, type: "popup", width: 440, height: 460, focused: true });
      return;
    }
    await openTool(
      slug,
      { kind: "notice", message: "The image could not be read from that page. Save it, then drop it here." },
      tab
    );
  }
}

/* ------------------------------------------------------------------ */
/* Messages from the popup, the permission page and the content script */
/* ------------------------------------------------------------------ */

chrome.runtime.onMessage.addListener((msg: ExtensionMessage, sender, sendResponse) => {
  switch (msg.type) {
    case "handoff:take": {
      // Only the content script on the site may collect a hand-off.
      if (!sender.tab || !/^[a-f0-9]{8,64}$/.test(msg.id)) {
        sendResponse(null);
        return;
      }
      const key = HANDOFF_PREFIX + msg.id;
      chrome.storage.session.get(key).then(async (stored) => {
        const envelope = stored[key] as HandoffEnvelope | undefined;
        await chrome.storage.session.remove(key);
        sendResponse(envelope ?? null);
      });
      return true;
    }
    case "open-tool": {
      if (sender.tab) return; // popup and extension pages only
      (async () => {
        const tab = msg.tabId !== undefined ? await chrome.tabs.get(msg.tabId).catch(() => undefined) : undefined;
        const { openIn } = await getSettings();
        const reuse = !msg.payload && openIn === "current-tab";
        await openTool(msg.slug, msg.payload, tab, reuse);
        sendResponse(true);
      })();
      return true;
    }
    case "summarize-tab": {
      if (sender.tab) return;
      chrome.tabs.get(msg.tabId).then((tab) => summarizeTab(tab).then(() => sendResponse(true)));
      return true;
    }
    case "pending:retry":
    case "pending:cancel": {
      if (sender.tab) return;
      const key = PENDING_PREFIX + msg.id;
      chrome.storage.session.get(key).then(async (stored) => {
        const p = stored[key] as { slug: string; srcUrl: string; tabId?: number; index?: number } | undefined;
        await chrome.storage.session.remove(key);
        if (p && msg.type === "pending:retry") {
          const tab = p.tabId !== undefined ? await chrome.tabs.get(p.tabId).catch(() => undefined) : undefined;
          await handleImage(p.slug, p.srcUrl, tab);
        }
        sendResponse(true);
      });
      return true;
    }
  }
});

/* ------------------------------------------------------------------ */
/* Address bar: type "tb" then a space                                  */
/* ------------------------------------------------------------------ */

const escapeXml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

chrome.omnibox.setDefaultSuggestion({ description: "Search TabBench tools" });

chrome.omnibox.onInputChanged.addListener((text, suggest) => {
  const results = search(text, 6);
  suggest(
    results.map((t) => ({
      content: `tool:${t.slug}`,
      description: `<match>${escapeXml(t.name)}</match> <dim>${escapeXml(t.tagline)}</dim>`,
    }))
  );
});

chrome.omnibox.onInputEntered.addListener((text, disposition) => {
  const slug = text.startsWith("tool:") ? text.slice(5) : search(text, 1)[0]?.slug;
  const url = slug ? toolUrl(slug) : siteUrl("/tools");
  if (slug) void addRecent(slug);
  if (disposition === "currentTab") void chrome.tabs.update({ url });
  else void chrome.tabs.create({ url, active: disposition === "newForegroundTab" });
});
