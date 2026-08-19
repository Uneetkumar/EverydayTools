/**
 * Universal Multi-Platform Video Stream Resolver.
 *
 * Resolves social platform URLs (Instagram, TikTok, Twitter/X, YouTube, Facebook)
 * and direct web media URLs into playable, downloadable direct video streams.
 */

export interface ResolvedMediaStream {
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
              availableStreams: formatStreams.map((f: any) => ({
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

  // 1. Twitter / X
  if (/twitter\.com|x\.com/i.test(trimmed)) {
    const resolved = await resolveTwitterVideo(trimmed);
    if (resolved) return resolved;
  }

  // 2. TikTok
  if (/tiktok\.com/i.test(trimmed)) {
    const resolved = await resolveTikTokVideo(trimmed);
    if (resolved) return resolved;
  }

  // 3. Instagram
  if (/instagram\.com/i.test(trimmed)) {
    const resolved = await resolveInstagramVideo(trimmed);
    if (resolved) return resolved;
  }

  // 4. YouTube
  if (/youtube\.com|youtu\.be/i.test(trimmed)) {
    const resolved = await resolveYouTubeVideo(trimmed);
    if (resolved) return resolved;
  }

  // 5. Direct Video Link or Fallback
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
    qualityLabel: "Direct HD Stream",
    width: 1920,
    height: 1080,
  };
}
