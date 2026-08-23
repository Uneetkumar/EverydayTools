import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { spawn } from "node:child_process";

/**
 * TabBench video resolver / download service.
 *
 * Deployed SEPARATELY from the static site. The site is `output: "export"` and
 * has no server, so this exists to do the work a browser cannot: fetch a
 * platform page with a real IP, run yt-dlp's signature extraction, and mux
 * separate video/audio streams with ffmpeg.
 *
 * Set ALLOWED_ORIGINS to your own domains. Left unset it allows all origins,
 * which is convenient locally and a bad idea in production — anyone could point
 * their own site at your bandwidth.
 */

const app = express();
const PORT = process.env.PORT || 8080;
const YTDLP = process.env.YTDLP_PATH || "yt-dlp";

// Requests can be long-running; cap them so a stuck resolve cannot pin a worker.
const RESOLVE_TIMEOUT_MS = 25_000;
const MAX_DOWNLOAD_BYTES = Number(process.env.MAX_DOWNLOAD_BYTES || 512 * 1024 * 1024);

const allowed = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowed.length ? allowed : true,
    methods: ["GET", "OPTIONS"],
  })
);
app.set("trust proxy", 1);

// Video is expensive to serve. Without a limit one script can drain a month of
// bandwidth in an afternoon.
app.use(
  "/api/",
  rateLimit({
    windowMs: 60_000,
    limit: Number(process.env.RATE_LIMIT_PER_MIN || 12),
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many requests. Please wait a moment and try again." },
  })
);

/** Only http(s), and never a private/loopback host (basic SSRF guard). */
function isSafeUrl(raw) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  const h = u.hostname.toLowerCase();
  if (
    h === "localhost" ||
    h === "0.0.0.0" ||
    h.endsWith(".local") ||
    h.endsWith(".internal") ||
    /^127\./.test(h) ||
    /^10\./.test(h) ||
    /^192\.168\./.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
    /^169\.254\./.test(h) ||
    /^\[?::1\]?$/.test(h)
  ) {
    return false;
  }
  return true;
}

function runJson(args, timeoutMs = RESOLVE_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const child = spawn(YTDLP, args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("Timed out resolving that URL."));
    }, timeoutMs);

    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", () => {
      clearTimeout(timer);
      reject(new Error("yt-dlp is not available on this server."));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        // yt-dlp's own message is far more useful than a generic failure.
        const first = err.split("\n").find((l) => l.includes("ERROR")) || "";
        return reject(new Error(first.replace(/^ERROR:\s*/, "") || "Could not resolve that URL."));
      }
      try {
        resolve(JSON.parse(out));
      } catch {
        reject(new Error("Unexpected response while resolving that URL."));
      }
    });
  });
}

app.get("/health", (_req, res) => res.json({ ok: true }));

/** Metadata + the formats worth offering. */
app.get("/api/info", async (req, res) => {
  const url = String(req.query.url || "");
  if (!isSafeUrl(url)) {
    return res.status(400).json({ error: "Please provide a valid public http(s) URL." });
  }

  try {
    const info = await runJson([
      "--dump-single-json",
      "--no-playlist",
      "--no-warnings",
      "--socket-timeout", "15",
      url,
    ]);

    const formats = (info.formats || [])
      .filter((f) => f.url && (f.vcodec !== "none" || f.acodec !== "none"))
      .map((f) => ({
        id: f.format_id,
        ext: f.ext,
        height: f.height || 0,
        fps: f.fps || null,
        filesize: f.filesize || f.filesize_approx || null,
        vcodec: f.vcodec,
        acodec: f.acodec,
        audioOnly: f.vcodec === "none",
        label:
          f.vcodec === "none"
            ? `Audio only (${f.ext})`
            : `${f.height ? f.height + "p" : f.format_note || "video"}${f.fps ? " " + f.fps + "fps" : ""} (${f.ext})`,
      }))
      .sort((a, b) => Number(b.height) - Number(a.height));

    res.json({
      title: info.title,
      uploader: info.uploader || info.channel || null,
      duration: info.duration || null,
      thumbnail: info.thumbnail || null,
      extractor: info.extractor_key || null,
      webpage: info.webpage_url || url,
      formats: formats.slice(0, 30),
    });
  } catch (e) {
    res.status(422).json({ error: e.message || "Could not resolve that URL." });
  }
});

/**
 * Streams the media straight through to the client.
 *
 * Piped rather than written to disk: containers have small ephemeral disks and
 * buffering a large video would exhaust memory or storage under concurrency.
 */
app.get("/api/download", async (req, res) => {
  const url = String(req.query.url || "");
  const format = String(req.query.format || "");
  const audioOnly = String(req.query.audio || "") === "1";

  if (!isSafeUrl(url)) {
    return res.status(400).json({ error: "Please provide a valid public http(s) URL." });
  }

  // Default merges the best video with the best audio, which is required above
  // 360p on YouTube because the two are served as separate streams.
  const selector = audioOnly
    ? "bestaudio/best"
    : format
    ? `${format}+bestaudio/${format}/best`
    : "bestvideo*+bestaudio/best";

  const args = [
    "-f", selector,
    "--no-playlist",
    "--no-warnings",
    "--socket-timeout", "15",
    "-o", "-",
  ];
  if (!audioOnly) args.push("--merge-output-format", "mp4");
  args.push(url);

  const child = spawn(YTDLP, args, { stdio: ["ignore", "pipe", "pipe"] });
  let sent = 0;
  let failed = false;

  res.setHeader("Content-Type", audioOnly ? "audio/mpeg" : "video/mp4");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="download.${audioOnly ? "m4a" : "mp4"}"`
  );

  child.stdout.on("data", (chunk) => {
    sent += chunk.length;
    if (sent > MAX_DOWNLOAD_BYTES) {
      failed = true;
      child.kill("SIGKILL");
      return res.destroy();
    }
    if (!res.write(chunk)) child.stdout.pause();
  });
  res.on("drain", () => child.stdout.resume());

  child.on("close", () => {
    if (!failed) res.end();
  });
  child.on("error", () => {
    if (!res.headersSent) res.status(500).json({ error: "Download failed." });
    else res.destroy();
  });
  // A client that navigates away must not leave the process running.
  req.on("close", () => child.kill("SIGKILL"));
});

app.listen(PORT, () => {
  console.log(`video api listening on ${PORT}`);
});
