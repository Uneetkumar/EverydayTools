/*
 * A minimal stand-in for the chrome.* APIs the popup uses, so its UI can be
 * opened as an ordinary web page (npm run ext:preview) and tested without
 * installing the extension. Never shipped: the build copies it only into
 * extension/dist-preview.
 *
 * Calls that would do something in a real browser (open a tab, send a
 * message) are recorded on window.__chromeLog instead.
 */
(() => {
  const log = (window.__chromeLog = []);
  const area = (name) => ({
    async get(keys) {
      const all = JSON.parse(localStorage.getItem(`mock-${name}`) || "{}");
      if (keys === null || keys === undefined) return all;
      const list = typeof keys === "string" ? [keys] : Array.isArray(keys) ? keys : Object.keys(keys);
      return Object.fromEntries(list.filter((k) => k in all).map((k) => [k, all[k]]));
    },
    async set(items) {
      const all = JSON.parse(localStorage.getItem(`mock-${name}`) || "{}");
      localStorage.setItem(`mock-${name}`, JSON.stringify({ ...all, ...items }));
    },
    async remove(keys) {
      const all = JSON.parse(localStorage.getItem(`mock-${name}`) || "{}");
      for (const k of [].concat(keys)) delete all[k];
      localStorage.setItem(`mock-${name}`, JSON.stringify(all));
    },
  });
  const params = new URLSearchParams(location.search);
  const tab = {
    id: 7,
    index: 0,
    url: params.get("url") ?? "https://www.example.com/blog/best-budget-phones?utm_source=newsletter&utm_medium=email&fbclid=IwAR123&page=2",
    title: params.get("title") ?? "Best budget phones of 2026 — Example Blog",
  };
  window.chrome = {
    storage: { sync: area("sync"), local: area("local"), session: area("session"), onChanged: { addListener() {} } },
    tabs: {
      async query() {
        return [tab];
      },
      async create(opts) {
        log.push({ call: "tabs.create", ...opts });
      },
      async update(id, opts) {
        log.push({ call: "tabs.update", id, ...opts });
      },
    },
    runtime: {
      async sendMessage(msg) {
        log.push({ call: "runtime.sendMessage", msg });
        return true;
      },
      getURL: (p) => `/${p}`,
    },
    permissions: {
      async getAll() {
        return { origins: JSON.parse(localStorage.getItem("mock-origins") || "[]") };
      },
      async remove({ origins }) {
        log.push({ call: "permissions.remove", origins });
        localStorage.setItem("mock-origins", "[]");
        return true;
      },
      async request(p) {
        log.push({ call: "permissions.request", ...p });
        return true;
      },
    },
    commands: {
      async getAll() {
        return [{ name: "_execute_action", shortcut: "⌘⇧K" }];
      },
    },
  };
  // window.close() would end the preview; record it instead.
  window.close = () => log.push({ call: "window.close" });
})();
