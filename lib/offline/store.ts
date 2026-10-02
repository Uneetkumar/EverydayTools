/**
 * Saving TabBench on this device, from the page. The service worker (public/sw.js)
 * serves what is saved here; it reads the same caches.
 *
 * Every call tolerates browsers without the Cache API (old Safari, some
 * private windows) by reporting that offline use is unavailable.
 */
import {
  CACHE,
  planDownload,
  staleEngines,
  staticToKeep,
  type Inventory,
  type Job,
  type OfflineManifest,
  type OfflineState,
} from "./plan";

const STATE_KEY = "/__tb/state";
const HASH_HEADER = "x-tb-hash";

export const offlineSupported = () => typeof window !== "undefined" && "caches" in window && "serviceWorker" in navigator;

const pathOf = (req: Request) => new URL(req.url).pathname;

export async function fetchManifest(): Promise<OfflineManifest | null> {
  try {
    const res = await fetch("/offline-manifest.json", { cache: "no-cache" });
    if (res.ok) return (await res.json()) as OfflineManifest;
  } catch {
    /* offline: the service worker answers from its copy, or nothing */
  }
  try {
    const hit = await caches.match("/offline-manifest.json");
    return hit ? ((await hit.json()) as OfflineManifest) : null;
  } catch {
    return null;
  }
}

export async function readState(): Promise<OfflineState | null> {
  try {
    const hit = await (await caches.open(CACHE.meta)).match(STATE_KEY);
    return hit ? ((await hit.json()) as OfflineState) : null;
  } catch {
    return null;
  }
}

async function writeState(state: OfflineState | null) {
  const meta = await caches.open(CACHE.meta);
  if (state) await meta.put(STATE_KEY, new Response(JSON.stringify(state), { headers: { "Content-Type": "application/json" } }));
  else await meta.delete(STATE_KEY);
}

export async function inventory(): Promise<Inventory> {
  const [pages, statics, engines] = await Promise.all([caches.open(CACHE.pages), caches.open(CACHE.static), caches.open(CACHE.engines)]);
  const engineKeys = await engines.keys();
  const engineHashes = await Promise.all(engineKeys.map(async (k) => [pathOf(k), (await engines.match(k))?.headers.get(HASH_HEADER) ?? undefined] as const));
  return {
    pages: new Set((await pages.keys()).map(pathOf)),
    static: new Set((await statics.keys()).map(pathOf)),
    engines: new Map(engineHashes),
  };
}

export interface Progress {
  done: number;
  total: number;
  bytesDone: number;
  bytesTotal: number;
}

async function runJob(job: Job, stores: Record<Job["store"], Cache>, signal?: AbortSignal) {
  const res = await fetch(job.url, { cache: job.store === "pages" ? "no-cache" : "default", signal });
  if (!res.ok) throw new Error(`${job.url} answered ${res.status}`);
  if (job.store === "engines") {
    const headers = new Headers(res.headers);
    if (job.hash) headers.set(HASH_HEADER, job.hash);
    await stores.engines.put(job.url, new Response(res.body, { status: res.status, headers }));
  } else if (res.redirected) {
    await stores[job.store].put(job.url, new Response(await res.blob(), { status: res.status, headers: res.headers }));
  } else {
    await stores[job.store].put(job.url, res);
  }
}

export class StorageFullError extends Error {}

/**
 * Saves every page, the code they run and the chosen engines. Files already
 * saved are skipped, so a second run only fetches what changed, and an
 * interrupted run resumes where it stopped.
 */
export async function saveEverything(m: OfflineManifest, packs: string[], opts: { onProgress?: (p: Progress) => void; signal?: AbortSignal } = {}) {
  // Ask the browser not to clear the saved copy when space runs low. Granted
  // automatically to installed apps and to sites used often; harmless otherwise.
  void navigator.storage?.persist?.().catch(() => undefined);

  const state = await readState();
  const jobs = planDownload(m, packs, await inventory(), state?.version ?? null);
  const stores = {
    pages: await caches.open(CACHE.pages),
    static: await caches.open(CACHE.static),
    engines: await caches.open(CACHE.engines),
  };
  const progress: Progress = { done: 0, total: jobs.length, bytesDone: 0, bytesTotal: jobs.reduce((s, j) => s + j.bytes, 0) };
  opts.onProgress?.({ ...progress });

  // Small files first, so the pages and code are usable before the big engines finish.
  const queue = [...jobs].sort((a, b) => a.bytes - b.bytes);
  const failed: string[] = [];
  const worker = async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      if (opts.signal?.aborted) return;
      try {
        await runJob(job, stores, opts.signal);
      } catch (e) {
        if (e instanceof DOMException && e.name === "QuotaExceededError") throw new StorageFullError("This device has no room left for the offline copy.");
        if (opts.signal?.aborted) return;
        failed.push(job.url);
      }
      progress.done++;
      progress.bytesDone += job.bytes;
      opts.onProgress?.({ ...progress });
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));
  if (opts.signal?.aborted) return { failed, aborted: true };

  // Only a complete page set counts as saved for this build.
  const pagesFailed = failed.some((u) => m.pages.some((p) => p.url === u));
  if (!pagesFailed) await writeState({ version: m.version, savedAt: Date.now(), packs });
  await prune(m);
  return { failed, aborted: false };
}

/** Frees code no saved page uses, and engines that changed or were removed. */
export async function prune(m: OfflineManifest) {
  const pages = await caches.open(CACHE.pages);
  const html = await Promise.all((await pages.keys()).map(async (k) => (await pages.match(k))?.text() ?? ""));
  const keep = staticToKeep(m, html);
  const statics = await caches.open(CACHE.static);
  for (const k of await statics.keys()) {
    const p = pathOf(k);
    if (p.startsWith("/_next/static/") && !keep.has(p)) await statics.delete(k);
  }
  const engines = await caches.open(CACHE.engines);
  for (const url of staleEngines(m, (await inventory()).engines)) await engines.delete(url);
}

/** Removes the offline copy. Pages opened afterwards are saved again as usual. */
export async function removeEverything() {
  await Promise.all([caches.delete(CACHE.pages), caches.delete(CACHE.static), caches.delete(CACHE.engines)]);
  await writeState(null);
}

/** Saves what one tool needs (see planTool), without saving the rest of the site. */
export async function saveJobs(jobs: Job[]) {
  const stores = { pages: await caches.open(CACHE.pages), static: await caches.open(CACHE.static), engines: await caches.open(CACHE.engines) };
  void navigator.storage?.persist?.().catch(() => undefined);
  const queue = [...jobs];
  const worker = async () => {
    for (let job = queue.shift(); job; job = queue.shift()) await runJob(job, stores);
  };
  await Promise.all(Array.from({ length: 4 }, worker));
}

export async function isSaved(path: string): Promise<boolean> {
  try {
    return !!(await (await caches.open(CACHE.pages)).match(path));
  } catch {
    return false;
  }
}

export async function bytesUsed(): Promise<number | null> {
  try {
    return (await navigator.storage?.estimate?.())?.usage ?? null;
  } catch {
    return null;
  }
}
