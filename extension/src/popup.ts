/**
 * The toolbar popup: search every tool, act on the current page (QR code,
 * clean link, summary), and jump back to recent and popular tools.
 */
import QRCode from "qrcode";
import { siteUrl } from "./shared/config";
import { cleanUrl } from "./shared/clean-url";
import type { ExtensionMessage, HandoffPayload } from "./shared/handoff";
import { applyTheme, clearRecent, getRecent, getSettings, saveSettings, type Settings } from "./shared/storage";
import { POPULAR, TOOLS, getTool, search, type ExtTool } from "./shared/tools";
import { LOGO_SVG, button, icon, segmented, toggle, toolTile } from "./ui/components";
import { cn, h } from "./ui/dom";
import { VERSION } from "./shared/config";

interface State {
  query: string;
  active: number;
  view: "home" | "settings";
  panel: "none" | "qr" | "clean";
  tab?: chrome.tabs.Tab;
  recent: string[];
  settings: Settings;
}

const state: State = { query: "", active: 0, view: "home", panel: "none", recent: [], settings: await getSettings() };

applyTheme(state.settings.theme);
try {
  localStorage.setItem("tb-theme", state.settings.theme);
} catch {
  /* the synchronous theme preload is a convenience only */
}

const app = document.getElementById("app")!;

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

const send = (msg: ExtensionMessage) => chrome.runtime.sendMessage(msg);

async function openTool(slug: string, payload?: HandoffPayload) {
  await send({ type: "open-tool", slug, payload, tabId: state.tab?.id });
  window.close();
}

function openSite(path: string) {
  void chrome.tabs.create({ url: siteUrl(path) });
  window.close();
}

const pageUrl = () => state.tab?.url ?? "";
const isWebPage = () => /^https?:\/\//.test(pageUrl());

function flash(el: HTMLElement, text: string) {
  const original = el.innerHTML;
  el.replaceChildren(icon("Check", "size-4"), text);
  setTimeout(() => (el.innerHTML = original), 1600);
}

async function copyText(text: string, trigger: HTMLElement) {
  try {
    await navigator.clipboard.writeText(text);
    flash(trigger, "Copied");
  } catch {
    flash(trigger, "Copy failed");
  }
}

/* ------------------------------------------------------------------ */
/* Rendering                                                           */
/* ------------------------------------------------------------------ */

function header(): HTMLElement {
  const input = h("input", {
    id: "search",
    type: "search",
    value: state.query,
    placeholder: `Search ${TOOLS.length} tools…`,
    "aria-label": "Search tools",
    autocomplete: "off",
    spellcheck: "false",
    class:
      "h-10 w-full rounded-lg border border-input bg-background pr-3 pl-9 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
    on: {
      input: (e) => {
        state.query = (e.target as HTMLInputElement).value;
        state.active = 0;
        renderBody();
      },
      keydown: onSearchKey,
    },
  });

  return h(
    "header",
    { class: "space-y-3 border-b px-4 pt-3.5 pb-3" },
    h(
      "div",
      { class: "flex items-center justify-between" },
      h(
        "a",
        {
          href: siteUrl("/"),
          class: "flex items-center gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          on: { click: (e) => (e.preventDefault(), openSite("/")) },
        },
        h("span", { class: "size-6 [&>svg]:size-full", html: LOGO_SVG }),
        h("span", { class: "text-[15px] font-semibold tracking-tight" }, "TabBench")
      ),
      h(
        "div",
        { class: "flex items-center gap-0.5" },
        button([icon("Settings")], {
          variant: "ghost",
          size: "icon",
          ariaLabel: "Settings",
          title: "Settings",
          class: "text-muted-foreground hover:text-foreground",
          onClick: () => {
            state.view = "settings";
            render();
          },
        }),
        button([icon("ExternalLink")], {
          variant: "ghost",
          size: "icon",
          ariaLabel: "Open TabBench",
          title: "Open tabbench.com",
          class: "text-muted-foreground hover:text-foreground",
          onClick: () => openSite("/"),
        })
      )
    ),
    h(
      "div",
      { class: "relative" },
      icon("Search", "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"),
      input
    )
  );
}

function sectionTitle(text: string, action?: HTMLElement): HTMLElement {
  return h(
    "div",
    { class: "flex items-center justify-between px-2 pt-3 pb-1.5" },
    h("h2", { class: "text-xs font-medium text-muted-foreground" }, text),
    action ?? null
  );
}

function toolRow(tool: ExtTool, index: number, selectable: boolean): HTMLElement {
  const selected = selectable && index === state.active;
  return h(
    "button",
    {
      type: "button",
      "data-index": selectable ? index : undefined,
      role: selectable ? "option" : undefined,
      "aria-selected": selectable ? String(selected) : undefined,
      class: cn(
        "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        selected ? "bg-muted" : "hover:bg-muted"
      ),
      on: {
        click: () => void openTool(tool.slug),
        mouseenter: () => {
          if (selectable && state.active !== index) {
            state.active = index;
            highlight();
          }
        },
      },
    },
    toolTile(tool, "sm"),
    h(
      "span",
      { class: "min-w-0 flex-1" },
      h("span", { class: "block truncate text-sm font-medium text-foreground" }, tool.name),
      h("span", { class: "block truncate text-xs text-muted-foreground" }, tool.tagline)
    ),
    selected ? icon("CornerDownLeft", "size-3.5 text-muted-foreground") : null
  );
}

function highlight() {
  document.querySelectorAll<HTMLElement>("[data-index]").forEach((el) => {
    const on = Number(el.dataset.index) === state.active;
    el.classList.toggle("bg-muted", on);
    el.setAttribute("aria-selected", String(on));
    if (on) el.scrollIntoView({ block: "nearest" });
  });
}

function results(): HTMLElement {
  const list = search(state.query, 8);
  if (!list.length) {
    return h(
      "div",
      { class: "px-4 py-10 text-center" },
      h("p", { class: "text-sm font-medium text-foreground" }, "No tools match that"),
      h("p", { class: "mt-1 text-xs text-muted-foreground" }, "Try a shorter word, such as “pdf”, “image” or “json”."),
      button("Browse all tools", { variant: "outline", size: "xs", class: "mt-4", onClick: () => openSite("/tools") })
    );
  }
  return h("div", { role: "listbox", "aria-label": "Tools", class: "space-y-0.5 p-2" }, ...list.map((t, i) => toolRow(t, i, true)));
}

function pageActions(): HTMLElement {
  const web = isWebPage();
  let host = "";
  try {
    host = web ? new URL(pageUrl()).hostname.replace(/^www\./, "") : "";
  } catch {
    /* not a URL */
  }

  const action = (id: "qr" | "clean" | "sum", label: string, iconName: string, onClick: () => void) =>
    h(
      "button",
      {
        type: "button",
        disabled: !web,
        "aria-pressed": id !== "sum" ? String(state.panel === id) : undefined,
        class: cn(
          "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
          state.panel === id ? "border-primary/50 bg-brand-subtle text-brand-subtle-foreground" : "bg-background text-foreground hover:bg-muted dark:bg-input/20"
        ),
        on: { click: onClick },
      },
      icon(iconName, "size-[18px]"),
      label
    );

  const togglePanel = (p: State["panel"]) => {
    state.panel = state.panel === p ? "none" : p;
    renderBody();
  };

  const wrap = h(
    "section",
    { "aria-label": "This page", class: "px-2" },
    sectionTitle("This page"),
    h(
      "div",
      { class: "rounded-xl border bg-card p-3" },
      h(
        "div",
        { class: "mb-3 flex min-w-0 items-center gap-2.5" },
        h("span", { class: "flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground" }, icon("Globe", "size-4")),
        h(
          "span",
          { class: "min-w-0" },
          h("span", { class: "block truncate text-sm font-medium text-foreground" }, web ? state.tab?.title || host : "No web page open"),
          h("span", { class: "block truncate text-xs text-muted-foreground" }, web ? host : "Open a website to use these actions.")
        )
      ),
      h(
        "div",
        { class: "grid grid-cols-3 gap-2" },
        action("qr", "QR code", "QrCode", () => togglePanel("qr")),
        action("clean", "Clean link", "Link2", () => togglePanel("clean")),
        action("sum", "Summarise", "Sparkles", () => {
          if (state.tab?.id === undefined) return;
          void send({ type: "summarize-tab", tabId: state.tab.id }).then(() => window.close());
        })
      ),
      state.panel === "qr" && web ? qrPanel() : null,
      state.panel === "clean" && web ? cleanPanel() : null
    )
  );
  return wrap;
}

function qrPanel(): HTMLElement {
  // Encode the link without tracking tags: that is what people mean to share.
  const { url, removed } = cleanUrl(pageUrl());
  const box = h("div", { class: "mx-auto size-40 rounded-lg bg-white p-2 [&>svg]:size-full", role: "img", "aria-label": "QR code for this page" });
  const status = h(
    "p",
    { class: "text-center text-xs text-muted-foreground", "aria-live": "polite" },
    removed.length ? "Tracking tags removed from the link." : ""
  );
  let host = "page";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    /* keep the default name */
  }

  QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#111827", light: "#ffffff" } })
    .then((svg) => (box.innerHTML = svg))
    .catch(() => (status.textContent = "This address is too long for a QR code."));

  const png = () => QRCode.toDataURL(url, { width: 1024, margin: 2, errorCorrectionLevel: "M" });

  const download = button([icon("Download"), "PNG"], {
    variant: "default",
    size: "xs",
    onClick: async () => {
      const a = h("a", { href: await png(), download: `qr-${host}.png` });
      a.click();
    },
  });
  const copy = button([icon("Copy"), "Copy"], {
    variant: "outline",
    size: "xs",
    onClick: async (e) => {
      const btn = e.currentTarget as HTMLElement;
      try {
        const blob = await (await fetch(await png())).blob();
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        flash(btn, "Copied");
      } catch {
        flash(btn, "Copy failed");
      }
    },
  });
  const customise = button(["Customise", icon("ArrowUpRight", "size-3.5")], {
    variant: "ghost",
    size: "xs",
    title: "Colours, logo and frame on TabBench",
    onClick: () => void openTool("qr-code-generator", { kind: "url", url }),
  });

  return h(
    "div",
    { class: "mt-3 space-y-3 border-t pt-3" },
    box,
    status,
    h("div", { class: "flex items-center justify-center gap-1.5" }, download, copy, customise)
  );
}

function cleanPanel(): HTMLElement {
  const { url, removed } = cleanUrl(pageUrl());
  const copy = button([icon("Copy"), removed.length ? "Copy clean link" : "Copy link"], {
    variant: "default",
    size: "xs",
    onClick: (e) => void copyText(url, e.currentTarget as HTMLElement),
  });
  return h(
    "div",
    { class: "mt-3 space-y-2.5 border-t pt-3" },
    h(
      "p",
      { class: "text-xs text-muted-foreground" },
      removed.length
        ? `Removed ${removed.length} tracking parameter${removed.length === 1 ? "" : "s"}: ${removed.join(", ")}.`
        : "This link has no tracking parameters."
    ),
    h("p", { class: "max-h-20 overflow-y-auto rounded-md bg-muted px-2.5 py-2 font-mono text-[11px] leading-relaxed break-all text-foreground" }, url),
    h("div", { class: "flex justify-end" }, copy)
  );
}

function recentSection(): HTMLElement | null {
  const tools = state.recent.map(getTool).filter((t): t is ExtTool => !!t).slice(0, 4);
  if (!tools.length) return null;
  const clear = button("Clear", {
    variant: "ghost",
    size: "xs",
    class: "h-6 px-1.5 text-muted-foreground",
    onClick: async () => {
      await clearRecent();
      state.recent = [];
      renderBody();
    },
  });
  return h("section", { "aria-label": "Recent tools", class: "px-2" }, sectionTitle("Recent", clear), ...tools.map((t, i) => toolRow(t, i, false)));
}

/** "PDF to Word Converter" → "PDF to Word": the icon already says what kind of tool it is. */
const gridLabel = (name: string) => (name.length > 16 ? name.replace(/ (Calculator|Converter|Generator|Checker)$/, "") : name);

function popularSection(): HTMLElement {
  const tools = POPULAR.map(getTool).filter((t): t is ExtTool => !!t && !state.recent.slice(0, 4).includes(t.slug)).slice(0, 8);
  return h(
    "section",
    { "aria-label": "Popular tools", class: "px-2" },
    sectionTitle("Popular"),
    h(
      "div",
      { class: "grid grid-cols-2 gap-1" },
      ...tools.map((t) =>
        h(
          "button",
          {
            type: "button",
            title: t.tagline,
            class: "flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
            on: { click: () => void openTool(t.slug) },
          },
          toolTile(t, "xs"),
          h("span", { class: "truncate text-[13px] text-foreground" }, gridLabel(t.shortName))
        )
      )
    ),
    h(
      "div",
      { class: "px-2 pt-2 pb-1" },
      h(
        "a",
        {
          href: siteUrl("/tools"),
          class: "inline-flex items-center gap-1 text-xs font-medium text-link hover:underline",
          on: { click: (e) => (e.preventDefault(), openSite("/tools")) },
        },
        `Browse all ${TOOLS.length} tools`,
        icon("ArrowRight", "size-3.5")
      )
    )
  );
}

function home(): HTMLElement {
  if (state.query.trim()) return results();
  return h("div", { class: "space-y-1 pb-2" }, pageActions(), recentSection(), popularSection());
}

function settingsView(): HTMLElement {
  const row = (label: string, description: string | null, control: HTMLElement, forId?: string) =>
    h(
      "div",
      { class: "flex items-center justify-between gap-4 py-3" },
      h(
        "div",
        { class: "min-w-0" },
        forId
          ? h("label", { for: forId, class: "text-sm font-medium text-foreground" }, label)
          : h("p", { class: "text-sm font-medium text-foreground" }, label),
        description ? h("p", { class: "mt-0.5 text-xs text-muted-foreground" }, description) : null
      ),
      control
    );

  const update = async (patch: Partial<Settings>) => {
    state.settings = await saveSettings(patch);
    applyTheme(state.settings.theme);
    try {
      localStorage.setItem("tb-theme", state.settings.theme);
    } catch {
      /* ignore */
    }
    render();
  };

  const shortcut = h("span", { class: "text-xs text-muted-foreground" }, "…");
  chrome.commands?.getAll().then((cmds) => {
    const c = cmds.find((x) => x.name === "_execute_action");
    shortcut.textContent = c?.shortcut || "Not set";
  });

  const access = h("div", { class: "flex items-center gap-2" });
  chrome.permissions.getAll().then((p) => {
    const origins = (p.origins ?? []).filter((o) => !o.includes("tabbench.com") && !o.startsWith("http://localhost"));
    access.replaceChildren(
      h("span", { class: "text-xs whitespace-nowrap text-muted-foreground" }, origins.length ? `${origins.length} site${origins.length === 1 ? "" : "s"}` : "None"),
      origins.length
        ? button("Remove", {
            variant: "outline",
            size: "xs",
            onClick: async () => {
              await chrome.permissions.remove({ origins });
              render();
            },
          })
        : ""
    );
  });

  return h(
    "div",
    { class: "px-4 pb-3" },
    h(
      "div",
      { class: "flex items-center gap-2 border-b py-3" },
      button([icon("ArrowLeft")], {
        variant: "ghost",
        size: "icon",
        ariaLabel: "Back",
        class: "-ml-2",
        onClick: () => {
          state.view = "home";
          render();
        },
      }),
      h("h2", { class: "text-sm font-semibold" }, "Settings")
    ),
    h(
      "div",
      { class: "divide-y" },
      row(
        "Theme",
        null,
        segmented(
          state.settings.theme,
          [
            { value: "system", label: "Auto" },
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ],
          (theme) => void update({ theme }),
          "Theme"
        )
      ),
      row(
        "Open tools in",
        "From search, recent and popular.",
        segmented(
          state.settings.openIn,
          [
            { value: "new-tab", label: "New tab" },
            { value: "current-tab", label: "This tab" },
          ],
          (openIn) => void update({ openIn }),
          "Open tools in"
        )
      ),
      row(
        "Right-click menu",
        "Send text, images and links to a tool.",
        toggle(state.settings.contextMenu, (contextMenu) => void update({ contextMenu }), "set-menu"),
        "set-menu"
      ),
      row("Image access", "Sites you allowed for right-click image tools.", access),
      row(
        "Keyboard shortcut",
        null,
        h(
          "div",
          { class: "flex items-center gap-2" },
          shortcut,
          button("Change", {
            variant: "outline",
            size: "xs",
            onClick: () => void chrome.tabs.create({ url: "chrome://extensions/shortcuts" }),
          })
        )
      ),
      row(
        "Recent tools",
        null,
        button("Clear", {
          variant: "outline",
          size: "xs",
          onClick: async (e) => {
            await clearRecent();
            state.recent = [];
            flash(e.currentTarget as HTMLElement, "Cleared");
          },
        })
      )
    ),
    h(
      "div",
      { class: "mt-2 rounded-lg bg-muted/60 px-3 py-2.5 text-xs text-muted-foreground" },
      h(
        "p",
        { class: "flex items-start gap-2" },
        icon("ShieldCheck", "mt-px size-3.5 shrink-0 text-success"),
        "The extension only reads a page when you use it: the address for QR codes and clean links, and the text or image you choose to send. It collects no data."
      )
    ),
    h(
      "div",
      { class: "mt-3 flex items-center justify-between text-xs text-muted-foreground" },
      h("span", null, `Version ${VERSION}`),
      h(
        "span",
        { class: "flex gap-3" },
        h("a", { href: siteUrl("/privacy"), class: "hover:text-foreground hover:underline", on: { click: (e) => (e.preventDefault(), openSite("/privacy")) } }, "Privacy"),
        h("a", { href: siteUrl("/contact"), class: "hover:text-foreground hover:underline", on: { click: (e) => (e.preventDefault(), openSite("/contact")) } }, "Feedback")
      )
    )
  );
}

function footer(): HTMLElement {
  return h(
    "footer",
    { class: "flex items-center gap-2 border-t px-4 py-2.5 text-xs text-muted-foreground" },
    icon("MousePointerClick", "size-3.5 shrink-0"),
    h("span", null, "Right-click text, images or links to send them to a tool.")
  );
}

let body: HTMLElement;

function renderBody() {
  const next = h("main", { id: "body", class: "max-h-[440px] overflow-y-auto" }, home());
  body.replaceWith(next);
  body = next;
}

function render() {
  if (state.view === "settings") {
    app.replaceChildren(settingsView());
    return;
  }
  body = h("main", { id: "body", class: "max-h-[440px] overflow-y-auto" }, home());
  app.replaceChildren(header(), body, footer());
  const input = document.getElementById("search") as HTMLInputElement;
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
}

/* ------------------------------------------------------------------ */
/* Keyboard                                                            */
/* ------------------------------------------------------------------ */

function onSearchKey(e: KeyboardEvent) {
  const count = state.query.trim() ? search(state.query, 8).length : 0;
  if (e.key === "ArrowDown" && count) {
    e.preventDefault();
    state.active = (state.active + 1) % count;
    highlight();
  } else if (e.key === "ArrowUp" && count) {
    e.preventDefault();
    state.active = (state.active - 1 + count) % count;
    highlight();
  } else if (e.key === "Enter" && count) {
    e.preventDefault();
    const tool = search(state.query, 8)[state.active];
    if (tool) void openTool(tool.slug);
  } else if (e.key === "Escape" && state.query) {
    e.preventDefault();
    state.query = "";
    (e.target as HTMLInputElement).value = "";
    renderBody();
  }
}

/* ------------------------------------------------------------------ */

render();
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
state.tab = tab;
state.recent = await getRecent();
renderBody();
