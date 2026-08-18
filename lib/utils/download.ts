import { recordResult } from "@/lib/history/results";

/**
 * Universal, high-reliability download utility.
 * Guarantees instant 1-click downloads across Chrome, Safari (Desktop & iOS), Firefox, Edge, and Android.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  // Recording here rather than in each tool means every download is captured
  // from one place, and a tool added later gets history for free.
  void recordResult(blob, filename);
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, filename, true);
}

export function downloadDataUrl(url: string, filename: string, isBlobUrl = false): void {
  // A data: URL means the caller built the bytes directly (canvas exports, for
  // instance) and never produced a Blob, so convert one for the history. Blob
  // URLs are skipped because downloadBlob already recorded them.
  if (!isBlobUrl && url.startsWith("data:")) {
    void fetch(url)
      .then((r) => r.blob())
      .then((blob) => recordResult(blob, filename))
      .catch(() => {
        /* history is best-effort */
      });
  }

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener noreferrer";
  link.style.display = "none";
  link.setAttribute("download", filename);

  // Appending to document body is required for Safari and Firefox
  document.body.appendChild(link);
  link.click();

  // Clean up DOM and memory
  setTimeout(() => {
    try {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      if (isBlobUrl && url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.warn("Cleanup error:", e);
    }
  }, 250);
}

export function downloadText(text: string, filename: string, mimeType = "text/plain;charset=utf-8"): void {
  const blob = new Blob([text], { type: mimeType });
  downloadBlob(blob, filename);
}
