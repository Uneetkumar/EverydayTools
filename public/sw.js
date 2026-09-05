// TabBench Progressive Web App Service Worker
// Bump on every deploy that changes cached behaviour. The activate handler
// deletes caches whose key !== CACHE_NAME, so a constant name meant nothing was
// ever purged: stale HTML from an old deploy survived indefinitely and could be
// served on any navigation whose network fetch failed.
const CACHE_NAME = "tabbench-pwa-v3";
const STATIC_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/icon.svg",
  "/public/icon.svg",
  "/about",
  "/tools",
];

// Install Event - Pre-cache core shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("PWA pre-cache warning:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up outdated caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Stale-while-revalidate for static assets, network first for pages
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Ignore non-GET requests and external ad requests
  if (
    request.method !== "GET" ||
    request.url.includes("googlesyndication.com") ||
    request.url.includes("google-analytics.com") ||
    request.url.includes("pagead2.googlesyndication")
  ) {
    return;
  }

  // Never intercept the Next.js build output.
  //
  // These filenames are content-hashed and firebase.json already serves them
  // `immutable, max-age=31536000`, so the HTTP cache handles them correctly and
  // for free. Layering stale-while-revalidate on top only creates a second,
  // longer-lived copy that the browser cache cannot invalidate — which is how a
  // user kept running deleted code (an error string that no longer exists in
  // the source) for hours after a deploy.
  //
  // Same for the OCR model data: multi-megabyte files already served immutable,
  // which would otherwise be duplicated into the SW cache.
  if (
    request.url.includes("/_next/static/") ||
    request.url.includes("/tesseract/") ||
    request.url.includes("/ffmpeg/") ||
    request.url.includes("/pdfjs/")
  ) {
    return;
  }

  // Handle page navigations (Network first with cache fallback)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match("/");
          });
        })
    );
    return;
  }

  // Handle static assets (Stale-while-revalidate)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
