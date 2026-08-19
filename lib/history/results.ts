"use client";

/**
 * Local history of files a tool produced.
 *
 * IndexedDB rather than localStorage: localStorage holds strings with a ~5MB
 * ceiling, so base64-encoding even a couple of cropped photos would exhaust it
 * and start throwing. IndexedDB stores Blobs natively with a quota measured in
 * hundreds of megabytes.
 *
 * PRIVACY: this writes the user's own output files to their own device. Nothing
 * is uploaded — the site's core claim is unaffected — but it does mean a
 * cropped passport scan persists on disk for a week where previously it did
 * not. Every surface that shows this history therefore states plainly what is
 * stored and offers a one-click clear.
 */

const DB_NAME = "tabbench_history";
const DB_VERSION = 1;
const STORE = "results";

/** Entries older than this are pruned on the next read or write. */
export const RESULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** Kept per tool. */
export const RESULTS_PER_TOOL = 3;
/** Files larger than this are not recorded — a 40MB PDF is not worth the quota. */
const MAX_BLOB_BYTES = 25 * 1024 * 1024;

export interface StoredResult {
  id: string;
  toolSlug: string;
  filename: string;
  blob: Blob;
  size: number;
  type: string;
  createdAt: number;
}

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(null);
    let req: IDBOpenDBRequest;
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      return resolve(null);
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("toolSlug", "toolSlug", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    // Private mode and blocked storage must degrade silently, never throw.
    req.onerror = () => resolve(null);
  });
}

function tx(db: IDBDatabase, mode: IDBTransactionMode) {
  return db.transaction(STORE, mode).objectStore(STORE);
}

function reqToPromise<T>(request: IDBRequest<T>): Promise<T | null> {
  return new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

async function allEntries(db: IDBDatabase): Promise<StoredResult[]> {
  const result = await reqToPromise(tx(db, "readonly").getAll());
  return (result as StoredResult[] | null) ?? [];
}

/** Drops expired entries and anything beyond the per-tool cap. */
async function prune(db: IDBDatabase): Promise<void> {
  const entries = await allEntries(db);
  const cutoff = Date.now() - RESULT_TTL_MS;
  const byTool = new Map<string, StoredResult[]>();
  const doomed: string[] = [];

  for (const entry of entries) {
    if (entry.createdAt < cutoff) {
      doomed.push(entry.id);
      continue;
    }
    const list = byTool.get(entry.toolSlug) ?? [];
    list.push(entry);
    byTool.set(entry.toolSlug, list);
  }

  for (const list of byTool.values()) {
    list.sort((a, b) => b.createdAt - a.createdAt);
    for (const extra of list.slice(RESULTS_PER_TOOL)) doomed.push(extra.id);
  }

  if (doomed.length === 0) return;
  const store = tx(db, "readwrite");
  for (const id of doomed) store.delete(id);
}

/** Infers the tool from the URL so callers need not thread a slug through. */
export function currentToolSlug(): string | null {
  if (typeof window === "undefined") return null;
  const match = window.location.pathname.match(/^\/tools\/([a-z0-9-]+)/);
  return match ? match[1] : null;
}

export async function recordResult(
  blob: Blob,
  filename: string,
  toolSlug?: string
): Promise<void> {
  const slug = toolSlug ?? currentToolSlug();
  if (!slug || blob.size === 0 || blob.size > MAX_BLOB_BYTES) return;

  const db = await openDb();
  if (!db) return;
  try {
    const entry: StoredResult = {
      id: `${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      toolSlug: slug,
      filename,
      blob,
      size: blob.size,
      type: blob.type || "application/octet-stream",
      createdAt: Date.now(),
    };
    await reqToPromise(tx(db, "readwrite").put(entry));
    await prune(db);
  } catch {
    // A full or blocked quota should never interrupt the download itself.
  } finally {
    db.close();
  }
}

export async function listResults(toolSlug: string): Promise<StoredResult[]> {
  const db = await openDb();
  if (!db) return [];
  try {
    await prune(db);
    const entries = await allEntries(db);
    return entries
      .filter((e) => e.toolSlug === toolSlug)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, RESULTS_PER_TOOL);
  } catch {
    return [];
  } finally {
    db.close();
  }
}

export async function deleteResult(id: string): Promise<void> {
  const db = await openDb();
  if (!db) return;
  try {
    await reqToPromise(tx(db, "readwrite").delete(id));
  } finally {
    db.close();
  }
}

export async function clearResults(toolSlug?: string): Promise<void> {
  const db = await openDb();
  if (!db) return;
  try {
    if (!toolSlug) {
      await reqToPromise(tx(db, "readwrite").clear());
      return;
    }
    const entries = await allEntries(db);
    const store = tx(db, "readwrite");
    for (const entry of entries) {
      if (entry.toolSlug === toolSlug) store.delete(entry.id);
    }
  } finally {
    db.close();
  }
}
