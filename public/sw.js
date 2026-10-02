// TabBench service worker: offline use.
//
// What it does with each request (same-origin GETs only):
//
//   pages            network first, so a deploy shows at once; the copy is kept,
//                    and served when the network fails. A page that was never
//                    saved falls back to /offline, which says so.
//   /_next/static    cache first. Names are content-hashed, so a cached file
//                    can never be stale; old ones are pruned by the page (see
//                    lib/offline/store.ts), which knows what saved pages need.
//   engines          (ffmpeg, OCR, pdf.js, camera models) cache first. Saved the
//                    first time a tool loads them, or all at once from /offline.
//   RSC payloads     never cached: they must match the deployed code. Offline,
//                    Next falls back to a full page load, which is served above.
//   anything else    stale-while-revalidate (icons, images), or network first
//                    for files that change on deploy (tool index, manifest).
//
// Downloading everything for offline use is done by the /offline page, not
// here: a page can show progress and keeps running as long as it is open.
//
// OFFLINE_VERSION is stamped by scripts/offline-manifest.mjs after each build.
const OFFLINE_VERSION = "__OFFLINE_VERSION__";
const PAGES = "tb-pages";
const STATIC = "tb-static";
const ENGINES = "tb-engines";
const META = "tb-meta";
const OURS = [PAGES, STATIC, ENGINES, META];

const OFFLINE_PAGE = "/offline";
const SHELL = ["/", OFFLINE_PAGE];

const isEngine = (path) =>
  path.startsWith("/ffmpeg/") ||
  path.startsWith("/tesseract/") ||
  path.startsWith("/pdfjs/") ||
  path === "/pdf.worker.min.mjs" ||
  path.startsWith("/vendor/") ||
  path.startsWith("/models/");

const FRESH_FIRST = new Set(["/tool-index.json", "/manifest.webmanifest", "/offline-manifest.json"]);

/**
 * A response that came through a redirect cannot answer a navigation later
 * ("a redirected response was used for a request whose redirect mode is not
 * follow"), so it is stored as a plain copy.
 */
const storable = async (res) => (res.redirected ? new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers: res.headers }) : res);

/** Static assets an HTML page refers to, so a saved page can also start offline. */
const assetsIn = (html) => [...new Set(html.match(/\/_next\/static\/[^"'\s\\)]+/g) || [])];

async function savePage(url) {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) return;
  const html = await res.clone().text();
  await (await caches.open(PAGES)).put(url, await storable(res));
  const statics = await caches.open(STATIC);
  await Promise.all(
    assetsIn(html).map(async (a) => {
      if (await statics.match(a)) return;
      const r = await fetch(a);
      if (r.ok) await statics.put(a, r);
    })
  );
}

self.addEventListener("install", (event) => {
  // The home page and the offline page, with their code, so there is always
  // something to show. Failure must not block the update.
  event.waitUntil(Promise.all(SHELL.map((u) => savePage(u).catch(() => undefined))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Caches from earlier workers ("tabbench-pwa-v5" and before) held pages
      // under one versioned name; they are replaced by the caches above.
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !OURS.includes(k)).map((k) => caches.delete(k)));
      await (await caches.open(META)).put("/__tb/version", new Response(OFFLINE_VERSION));
      await self.clients.claim();
    })()
  );
});

async function fromNetworkOrCache(request, cacheName, fallback) {
  try {
    const res = await fetch(request, request.mode === "navigate" ? { cache: "no-cache" } : undefined);
    if (res.ok && res.type === "basic") {
      const key = request.mode === "navigate" ? new URL(request.url).pathname : request;
      storable(res.clone()).then((copy) => caches.open(cacheName).then((c) => c.put(key, copy)));
    }
    return res;
  } catch (err) {
    const hit = await caches.match(request.mode === "navigate" ? new URL(request.url).pathname : request, { ignoreSearch: request.mode === "navigate" });
    if (hit) return hit;
    if (fallback) return fallback();
    throw err;
  }
}

async function cacheFirst(request, cacheName) {
  const hit = await caches.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok && res.type === "basic" && res.status === 200) {
    const copy = res.clone();
    caches.open(cacheName).then((c) => c.put(request, copy));
  }
  return res;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  // Cross-origin (ads, analytics, exchange rates, speed-test servers) goes
  // straight to the network: a cached copy there would be wrong, not helpful.
  if (url.origin !== self.location.origin) return;
  // Router payloads must match the deployed JavaScript.
  if (url.searchParams.has("_rsc") || url.pathname.includes("/__next.") || request.headers.get("RSC")) return;
  // Media seeks send Range requests, which a cached full response cannot answer.
  if (request.headers.has("range")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fromNetworkOrCache(request, PAGES, async () => {
        // Not saved on this device: say so on the offline page, which names
        // the page that was asked for.
        const saved = await caches.match(OFFLINE_PAGE);
        if (saved && url.pathname !== OFFLINE_PAGE) {
          return Response.redirect(`${OFFLINE_PAGE}?from=${encodeURIComponent(url.pathname + url.search)}`, 302);
        }
        return saved || new Response("You are offline, and this page is not saved on this device.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      })
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC));
    return;
  }

  if (isEngine(url.pathname)) {
    event.respondWith(cacheFirst(request, ENGINES));
    return;
  }

  if (FRESH_FIRST.has(url.pathname)) {
    event.respondWith(fromNetworkOrCache(request, META));
    return;
  }

  // Icons, images and other files: answer from the cache, refresh behind it.
  event.respondWith(
    caches.match(request).then((hit) => {
      const network = fetch(request)
        .then((res) => {
          if (res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(STATIC).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => hit || Response.error());
      return hit || network;
    })
  );
});

// The /offline page asks for a page to be saved with its code (used when a
// tool page is saved on its own, from its "Save for offline" button).
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "tb-save-page" && typeof data.url === "string") {
    event.waitUntil(
      savePage(data.url)
        .then(() => event.source && event.source.postMessage({ type: "tb-saved-page", url: data.url, ok: true }))
        .catch(() => event.source && event.source.postMessage({ type: "tb-saved-page", url: data.url, ok: false }))
    );
  }
});
