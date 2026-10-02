/**
 * What an offline copy of TabBench needs, worked out without touching any
 * browser API so it can be tested. lib/offline/store.ts does the downloading.
 *
 * The build writes /offline-manifest.json (scripts/offline-manifest.mjs):
 * the app's code ("core"), every page, and the heavy engines a few tools load
 * on demand ("packs"). A device saves pages as they are opened; saving
 * everything happens only when someone asks for it on /offline.
 */

export interface ManifestFile {
  url: string;
  bytes: number;
  /** Engines only: a hash of the file, so a changed engine is replaced. */
  hash?: string;
}

export interface OfflinePack {
  id: string;
  label: string;
  note: string;
  /** Slugs of the tools that need this engine. */
  tools: string[];
  /** Offered ticked: small and used by several tools. */
  suggested: boolean;
  bytes: number;
  files: ManifestFile[];
}

export interface OfflineManifest {
  version: string;
  builtAt: string;
  core: ManifestFile[];
  pages: ManifestFile[];
  packs: OfflinePack[];
  bytes: { core: number; pages: number };
}

/** What this device has asked to keep. Stored next to the caches it describes. */
export interface OfflineState {
  /** Build whose pages were saved. */
  version: string;
  savedAt: number;
  packs: string[];
}

export const CACHE = { pages: "tb-pages", static: "tb-static", engines: "tb-engines", meta: "tb-meta" } as const;
export type StoreName = "pages" | "static" | "engines";

export interface Job {
  url: string;
  bytes: number;
  store: StoreName;
  hash?: string;
}

/** What is already saved on this device. Engines carry the hash they were saved with, when known. */
export interface Inventory {
  pages: Set<string>;
  static: Set<string>;
  engines: Map<string, string | undefined>;
}

/**
 * The downloads that make the chosen packs and every page work offline.
 * Code is content-addressed, so a file already saved is skipped. Pages are
 * fetched again when the site has been rebuilt since they were saved, because
 * a new build's pages refer to new code.
 */
export function planDownload(m: OfflineManifest, packs: string[], have: Inventory, savedVersion: string | null): Job[] {
  const jobs: Job[] = [];
  for (const f of m.core) if (!have.static.has(f.url)) jobs.push({ url: f.url, bytes: f.bytes, store: "static" });
  const rebuilt = savedVersion !== m.version;
  for (const p of m.pages) if (rebuilt || !have.pages.has(p.url)) jobs.push({ url: p.url, bytes: p.bytes, store: "pages" });
  for (const pack of m.packs) {
    if (!packs.includes(pack.id)) continue;
    for (const f of pack.files) {
      const saved = have.engines.has(f.url);
      const changed = saved && have.engines.get(f.url) !== undefined && have.engines.get(f.url) !== f.hash;
      if (!saved || changed) jobs.push({ url: f.url, bytes: f.bytes, store: "engines", hash: f.hash });
    }
  }
  return jobs;
}

/**
 * What one tool needs to work offline: its page, the app's code and its
 * engine, minus what is already saved. The code is shared by every tool, so
 * only the first tool saved pays for it. Empty means the tool is ready.
 */
export function planTool(m: OfflineManifest, path: string, have: Inventory): Job[] {
  const jobs: Job[] = [];
  const page = m.pages.find((p) => p.url === path);
  if (page && !have.pages.has(page.url)) jobs.push({ url: page.url, bytes: page.bytes, store: "pages" });
  for (const f of m.core) if (!have.static.has(f.url)) jobs.push({ url: f.url, bytes: f.bytes, store: "static" });
  const pack = m.packs.find((p) => p.tools.includes(path.replace(/^\/tools\//, "")));
  for (const f of pack?.files ?? []) if (!have.engines.has(f.url)) jobs.push({ url: f.url, bytes: f.bytes, store: "engines", hash: f.hash });
  return jobs;
}

const STATIC_REF = /\/_next\/static\/[^"'\s\\)]+/g;

/** Code and styles an HTML page refers to. */
export function assetsIn(html: string): string[] {
  return [...new Set(html.match(STATIC_REF) ?? [])];
}

/**
 * Saved code to keep: the current build's, and whatever a saved page still
 * refers to. A page saved from an older build keeps working offline until it
 * is refreshed, and code nothing refers to any more is freed.
 */
export function staticToKeep(m: OfflineManifest, savedPages: string[]): Set<string> {
  const keep = new Set(m.core.map((f) => f.url));
  for (const html of savedPages) for (const a of assetsIn(html)) keep.add(a);
  return keep;
}

/** Saved engine files the site no longer ships, or that have changed since. */
export function staleEngines(m: OfflineManifest, have: Inventory["engines"]): string[] {
  const current = new Map(m.packs.flatMap((p) => p.files.map((f) => [f.url, f.hash] as const)));
  return [...have.entries()].filter(([url, hash]) => !current.has(url) || (hash !== undefined && hash !== current.get(url))).map(([url]) => url);
}

/** Bytes a choice of packs adds to the pages and code. */
export function totalBytes(m: OfflineManifest, packs: string[]): number {
  return m.bytes.core + m.bytes.pages + m.packs.filter((p) => packs.includes(p.id)).reduce((s, p) => s + p.bytes, 0);
}

/** Pack that a tool needs, if any. */
export function packForTool(m: OfflineManifest, slug: string): OfflinePack | undefined {
  return m.packs.find((p) => p.tools.includes(slug));
}

export function formatMB(bytes: number): string {
  const mb = bytes / 1e6;
  return mb >= 10 ? `${Math.round(mb)} MB` : mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1e3))} KB`;
}
