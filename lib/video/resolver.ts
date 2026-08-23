/**
 * Universal Multi-Platform Video Stream Resolver.
 *
 * Resolves social platform URLs (Instagram, TikTok, Twitter/X, YouTube, Facebook)
 * and direct web media URLs into playable, downloadable direct video streams.
 */

/** Shape of the format entries an Invidious-compatible API returns. */
interface InvidiousFormat {
  url: string;
  qualityLabel?: string;
  resolution?: string;
  container?: string;
  type?: string;
}

export interface ResolvedMediaStream {
  /** Set when the URL cannot be resolved to a real media stream. */
  unsupported?: boolean;
  /** Plain-English reason shown to the user when `unsupported` is true. */
  reason?: string;
  /** Best action the user can take instead. */
  suggestion?: string;
  streamUrl: string;
  downloadUrl: string;
  title: string;
  thumbnailUrl?: string;
  duration?: number;
  qualityLabel?: string;
  width?: number;
  height?: number;
  availableStreams?: {
    label: string;
    url: string;
    resolution: string;
    format: string;
    isAudioOnly?: boolean;
  }[];
}

/**
 * Universal CORS Proxy helper to bypass cross-origin stream blocking in client browsers.
 */
/** File extensions the browser can actually play and fetch directly. */
const MEDIA_EXT = /\.(mp4|webm|ogg|ogv|mov|m4v|mp3|m4a|wav|aac|flac|opus)(\?|#|$)/i;

/**
 * Platforms that actively block third-party downloads.
 *
 * Verified August 2026: every public YouTube (Invidious) resolver returns
 * 403/401, Instagram's proxy is unreachable, and TikTok's CDN answers 503 even
 * when the URL resolves correctly. These are deliberate defences, not outages,
 * so the honest thing is to say so immediately rather than spin and fail.
 */
const BLOCKED_PLATFORMS: {
  test: RegExp;
  name: string;
  reason: string;
  suggestion: string;
}[] = [
  {
    test: /youtube\.com|youtu\.be/i,
    name: "YouTube",
    reason:
      "YouTube signs every video URL and blocks cross-origin requests, so no browser-only tool can fetch the stream. The public mirrors this tool used are all blocked.",
    suggestion:
      "Use YouTube Premium's official download, or a desktop application such as yt-dlp. Downloading other people's videos also breaches YouTube's Terms of Service.",
  },
  {
    test: /instagram\.com/i,
    name: "Instagram",
    reason:
      "Instagram requires an authenticated session to reach media, and the public proxy this tool relied on is offline.",
    suggestion:
      "Use Instagram's own save option, or the share sheet on mobile, for content you are allowed to keep.",
  },
  {
    test: /facebook\.com|fb\.watch/i,
    name: "Facebook",
    reason:
      "Facebook media requires an authenticated session and blocks cross-origin reads.",
    suggestion: "Use Facebook's own save feature where the uploader has allowed it.",
  },
  {
    test: /tiktok\.com/i,
    name: "TikTok",
    reason:
      "TikTok's CDN rejects requests that do not come from its own app or site — the link resolves, then the download returns a 503.",
    suggestion:
      "Use TikTok's built-in save button, which the uploader can permit.",
  },
];

export function getCorsProxyUrl(rawUrl: string): string {
  if (!rawUrl) return "";
  // If already a blob or data url, return as is
  if (rawUrl.startsWith("blob:") || rawUrl.startsWith("data:")) return rawUrl;
  return `https://corsproxy.io/?${encodeURIComponent(rawUrl)}`;
}

/**
 * Resolves Twitter / X status URLs using public JSON endpoints.
 */
async function resolveTwitterVideo(url: string): Promise<ResolvedMediaStream | null> {
  try {
    const match = url.match(/status\/(\d+)/i);
    if (!match) return null;
    const tweetId = match[1];

    // Query vxtwitter public metadata API
    const res = await fetch(`https://api.vxtwitter.com/Twitter/status/${tweetId}`);
    if (!res.ok) return null;
    const data = await res.json();

    const videoUrl = data.video_url || (data.mediaURLs && data.mediaURLs.find((u: string) => u.includes(".mp4")));
    if (!videoUrl) return null;

    return {
      streamUrl: videoUrl,
      downloadUrl: videoUrl,
      title: data.text ? data.text.slice(0, 50) : `Twitter-Video-${tweetId}`,
      thumbnailUrl: data.mediaURLs?.[0],
      qualityLabel: "HD 720p",
      width: 1280,
      height: 720,
    };
  } catch (err) {
    console.warn("Twitter resolution error:", err);
    return null;
  }
}

/**
 * Resolves TikTok video URLs using public oEmbed / resolver APIs.
 */
async function resolveTikTokVideo(url: string): Promise<ResolvedMediaStream | null> {
  try {
    const cleanUrl = url.split("?")[0];
    const res = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}`);
    if (!res.ok) return null;
    const data = await res.json();

    if (data.code === 0 && data.data) {
      const playUrl = data.data.play || data.data.wmplay || data.data.hdplay;
      const title = data.data.title || "TikTok Video";
      const cover = data.data.cover;
      const duration = data.data.duration;

      return {
        streamUrl: playUrl,
        downloadUrl: playUrl,
        title,
        thumbnailUrl: cover,
        duration,
        qualityLabel: "HD (No Watermark)",
        width: 1080,
        height: 1920,
        availableStreams: [
          {
            label: "HD (No Watermark)",
            url: playUrl,
            resolution: "1080p",
            format: "mp4",
          },
          ...(data.data.music
            ? [
                {
                  label: "Audio Track (MP3)",
                  url: data.data.music,
                  resolution: "Audio Only",
                  format: "mp3",
                  isAudioOnly: true,
                },
              ]
            : []),
        ],
      };
    }
  } catch (err) {
    console.warn("TikTok resolution error:", err);
  }
  return null;
}

/**
 * Resolves Instagram Reel/Post URLs by scraping public embed metadata.
 */
async function resolveInstagramVideo(url: string): Promise<ResolvedMediaStream | null> {
  try {
    // If it's already a direct CDN URL (e.g. scontent.cdninstagram.com / fbcdn.net)
    if (url.includes("cdninstagram.com") || url.includes("fbcdn.net")) {
      return {
        streamUrl: url,
        downloadUrl: url,
        title: "Instagram Reel",
        qualityLabel: "1080p HD",
        width: 1080,
        height: 1920,
      };
    }

    // Extract shortcode
    const match = url.match(/(?:reel|reels|p)\/([A-Za-z0-9_-]+)/i);
    const shortcode = match ? match[1] : null;

    // Fetch embed HTML through proxy
    const embedUrl = `https://www.instagram.com/p/${shortcode || ""}/embed/captioned/`;
    const proxyRes = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(embedUrl)}`);
    if (proxyRes.ok) {
      const data = await proxyRes.json();
      const html = data.contents || "";

      // Regex look for video src in embed HTML
      const videoMatch = html.match(/class="[^"]*vcRaw[^"]*"[^>]*src="([^"]+)"/i) ||
        html.match(/video_url["']?\s*:\s*["']([^"']+)["']/i) ||
        html.match(/<video[^>]*src="([^"]+)"/i);

      if (videoMatch && videoMatch[1]) {
        const directVideoUrl = videoMatch[1].replace(/&amp;/g, "&");
        return {
          streamUrl: directVideoUrl,
          downloadUrl: directVideoUrl,
          title: `Instagram-Reel-${shortcode || "video"}`,
          qualityLabel: "1080p HD",
          width: 1080,
          height: 1920,
        };
      }
    }
  } catch (err) {
    console.warn("Instagram resolution error:", err);
  }
  return null;
}

/**
 * Resolves YouTube video IDs via Invidious public streaming instances.
 */
async function resolveYouTubeVideo(url: string): Promise<ResolvedMediaStream | null> {
  try {
    let videoId = "";
    if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0];
    } else if (url.includes("watch?v=")) {
      videoId = new URL(url).searchParams.get("v") || "";
    } else if (url.includes("/shorts/")) {
      videoId = url.split("/shorts/")[1].split("?")[0];
    }

    if (!videoId) return null;

    const instances = [
      "https://inv.nadeko.net",
      "https://invidious.nerdvpn.de",
      "https://vid.priv.au",
    ];

    for (const inst of instances) {
      try {
        const res = await fetch(`${inst}/api/v1/videos/${videoId}`, { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          const data = await res.json();
          const formatStreams = data.formatStreams || [];
          const adaptiveFormats = data.adaptiveFormats || [];

          if (formatStreams.length > 0) {
            const best = formatStreams[formatStreams.length - 1];
            return {
              streamUrl: best.url,
              downloadUrl: best.url,
              title: data.title || `YouTube-${videoId}`,
              thumbnailUrl: data.videoThumbnails?.[0]?.url,
              duration: data.lengthSeconds,
              qualityLabel: best.qualityLabel || "720p HD",
              width: 1280,
              height: 720,
              availableStreams: formatStreams.map((f: InvidiousFormat) => ({
                label: `${f.qualityLabel || f.resolution} (${f.container || "mp4"})`,
                url: f.url,
                resolution: f.qualityLabel || f.resolution,
                format: f.container || "mp4",
              })),
            };
          }
        }
      } catch {
        continue;
      }
    }
  } catch (err) {
    console.warn("YouTube resolution error:", err);
  }
  return null;
}

/**
 * Master URL resolver: identifies platform or direct link and returns verified stream info.
 */
export async function resolveVideoUrl(url: string): Promise<ResolvedMediaStream> {
  const trimmed = url.trim();

  // Twitter/X and TikTok still have responding resolvers, so they are still
  // attempted — but a failure must NOT fall through to the direct-link branch.
  if (/twitter\.com|x\.com/i.test(trimmed)) {
    const resolved = await resolveTwitterVideo(trimmed);
    if (resolved?.streamUrl) return resolved;
  }
  if (/tiktok\.com/i.test(trimmed)) {
    const resolved = await resolveTikTokVideo(trimmed);
    if (resolved?.streamUrl) return resolved;
  }
  if (/instagram\.com/i.test(trimmed)) {
    const resolved = await resolveInstagramVideo(trimmed);
    if (resolved?.streamUrl) return resolved;
  }
  if (/youtube\.com|youtu\.be/i.test(trimmed)) {
    const resolved = await resolveYouTubeVideo(trimmed);
    if (resolved?.streamUrl) return resolved;
  }

  // A platform page that could not be resolved is reported as such.
  //
  // Previously this fell through to the direct-link branch below, which handed
  // back the *page* URL as though it were a video stream. The player then had
  // an HTML document as its src and showed nothing, and "download" saved the
  // HTML — which is exactly the failure users reported.
  const blocked = BLOCKED_PLATFORMS.find((p) => p.test.test(trimmed));
  if (blocked) {
    return {
      unsupported: true,
      reason: blocked.reason,
      suggestion: blocked.suggestion,
      streamUrl: "",
      downloadUrl: "",
      title: blocked.name,
    };
  }

  // Direct media link. Only accept URLs that actually point at a media file;
  // an arbitrary web page is not a video and must not be treated as one.
  if (!MEDIA_EXT.test(trimmed)) {
    return {
      unsupported: true,
      reason:
        "That link does not point directly at a media file. This tool works with direct links ending in .mp4, .webm, .mov, .mp3 and similar.",
      suggestion:
        "Right-click a video and choose 'Copy video address', or paste a direct CDN link to the file itself rather than the page it appears on.",
      streamUrl: "",
      downloadUrl: "",
      title: "Unsupported link",
    };
  }

  let cleanTitle = "video-stream";
  try {
    const p = new URL(trimmed);
    const seg = p.pathname.split("/").filter(Boolean).pop() || "video";
    cleanTitle = decodeURIComponent(seg.split("?")[0]) || "video-stream";
    if (cleanTitle.includes(".")) cleanTitle = cleanTitle.split(".")[0];
  } catch {
    cleanTitle = "video-stream";
  }

  return {
    streamUrl: trimmed,
    downloadUrl: trimmed,
    title: cleanTitle,
    qualityLabel: "Direct stream",
  };
}
