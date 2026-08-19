/**
 * URL, MIME Type and Format Validators for Video Downloader.
 */

export interface MediaFormatInfo {
  extension: string;
  mimeType: string;
  isDirectVideo: boolean;
  label: string;
}

const SUPPORTED_EXTENSIONS: Record<string, { mime: string; label: string }> = {
  mp4: { mime: "video/mp4", label: "MPEG-4 (MP4)" },
  m4v: { mime: "video/mp4", label: "M4V Video" },
  webm: { mime: "video/webm", label: "WebM Video" },
  mov: { mime: "video/quicktime", label: "QuickTime (MOV)" },
  ogv: { mime: "video/ogg", label: "Ogg Video" },
  mkv: { mime: "video/x-matroska", label: "Matroska (MKV)" },
  mp3: { mime: "audio/mpeg", label: "MP3 Audio" },
  m4a: { mime: "audio/mp4", label: "M4A Audio" },
  aac: { mime: "audio/aac", label: "AAC Audio" },
  wav: { mime: "audio/wav", label: "WAV Audio" },
};

/**
 * Extracts clean filename and format information from a URL or content-disposition header.
 */
export function extractMediaFormatInfo(url: string, contentType?: string | null): MediaFormatInfo {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    const lastSegment = pathname.split("/").pop() || "";
    const cleanSegment = lastSegment.split("?")[0].split("#")[0];
    const extMatch = cleanSegment.match(/\.([a-z0-9]+)$/i);
    const ext = extMatch ? extMatch[1].toLowerCase() : "";

    if (ext && SUPPORTED_EXTENSIONS[ext]) {
      return {
        extension: ext,
        mimeType: SUPPORTED_EXTENSIONS[ext].mime,
        isDirectVideo: !ext.match(/^(mp3|m4a|aac|wav)$/),
        label: SUPPORTED_EXTENSIONS[ext].label,
      };
    }

    if (contentType) {
      const cleanMime = contentType.split(";")[0].trim().toLowerCase();
      for (const [key, val] of Object.entries(SUPPORTED_EXTENSIONS)) {
        if (val.mime === cleanMime) {
          return {
            extension: key,
            mimeType: cleanMime,
            isDirectVideo: !key.match(/^(mp3|m4a|aac|wav)$/),
            label: val.label,
          };
        }
      }
    }

    // Default fallback
    return {
      extension: "mp4",
      mimeType: "video/mp4",
      isDirectVideo: true,
      label: "Direct Video Stream",
    };
  } catch {
    return {
      extension: "mp4",
      mimeType: "video/mp4",
      isDirectVideo: true,
      label: "Media Stream",
    };
  }
}

/**
 * Extracts a friendly filename for downloads.
 */
export function extractMediaFileName(url: string, fallbackName = "video"): string {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    const lastSegment = pathname.split("/").pop() || "";
    const cleanSegment = decodeURIComponent(lastSegment.split("?")[0].split("#")[0]);

    if (cleanSegment && cleanSegment.length > 2 && cleanSegment.includes(".")) {
      return cleanSegment;
    }

    const hostClean = parsed.hostname.replace(/[^a-zA-Z0-9]/g, "-");
    return `${fallbackName}-${hostClean}-${Date.now()}`;
  } catch {
    return `${fallbackName}-${Date.now()}`;
  }
}
