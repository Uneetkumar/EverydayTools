/**
 * Security & SSRF Prevention Rules for Video Downloader.
 *
 * Enforces strict HTTPS and blocks private/local IP targets and cloud metadata endpoints.
 */

export interface SecurityValidationResult {
  isValid: boolean;
  sanitizedUrl?: string;
  error?: string;
  isRestrictedPlatform?: boolean;
  platformName?: string;
}

// Configurable environment limits with safe production defaults
export const SECURITY_CONFIG = {
  maxSourceSizeBytes: Number(process.env.NEXT_PUBLIC_VIDEO_MAX_SOURCE_SIZE) || 500 * 1024 * 1024, // 500 MB
  inspectionTimeoutMs: Number(process.env.NEXT_PUBLIC_VIDEO_INSPECT_TIMEOUT) || 15000, // 15 seconds
  downloadTimeoutMs: Number(process.env.NEXT_PUBLIC_VIDEO_DOWNLOAD_TIMEOUT) || 180000, // 3 minutes
  maxConcurrentJobs: Number(process.env.NEXT_PUBLIC_VIDEO_MAX_CONCURRENT_JOBS) || 3,
};

/**
 * Tests if an IPv4 or hostname belongs to private RFC1918 ranges,
 * loopback, link-local, or cloud metadata services.
 */
export function isPrivateOrReservedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().trim();

  // Explicit string matches
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".localhost") ||
    host === "metadata.google.internal" ||
    host === "instance-data"
  ) {
    return true;
  }

  // IPv4 pattern matching
  const ipParts = host.split(".").map(Number);
  if (ipParts.length === 4 && ipParts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
    const [a, b] = ipParts;
    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true;
    // 10.0.0.0/8 (RFC 1918)
    if (a === 10) return true;
    // 172.16.0.0/12 (RFC 1918)
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16 (RFC 1918)
    if (a === 192 && b === 168) return true;
    // 169.254.0.0/16 (Link-local / AWS / GCP metadata)
    if (a === 169 && b === 254) return true;
    // 0.0.0.0/8
    if (a === 0) return true;
    // 100.64.0.0/10 (Carrier-grade NAT)
    if (a === 100 && b >= 64 && b <= 127) return true;
  }

  return false;
}

/**
 * Validates a user-supplied media URL against SSRF, protocol restrictions,
 * and format parameters.
 */
export function validateMediaUrlSecurity(rawUrl: string): SecurityValidationResult {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { isValid: false, error: "Please enter a valid URL." };
  }

  const trimmed = rawUrl.trim();
  let parsed: URL;

  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      isValid: false,
      error: "Please enter a valid HTTPS media URL (e.g. https://example.com/video.mp4 or direct CDN link).",
    };
  }

  // Enforce HTTPS
  if (parsed.protocol !== "https:") {
    return {
      isValid: false,
      error: "Only secure HTTPS URLs are permitted. Plain HTTP or other protocols are not supported.",
    };
  }

  const hostname = parsed.hostname;

  // SSRF & Private network protection
  if (isPrivateOrReservedHost(hostname)) {
    return {
      isValid: false,
      error: "Access to local, loopback, or private internal network endpoints is strictly blocked.",
    };
  }

  return {
    isValid: true,
    sanitizedUrl: parsed.toString(),
  };
}
