/**
 * Universal, high-reliability download utility.
 * Guarantees instant 1-click downloads across Chrome, Safari (Desktop & iOS), Firefox, Edge, and Android.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, filename, true);
}

export function downloadDataUrl(url: string, filename: string, isBlobUrl = false): void {
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
