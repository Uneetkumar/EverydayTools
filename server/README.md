# TabBench Video API

Backend for the video downloader. **Deployed separately** from the static site —
`output: "export"` means the site itself has no server.

## Why this exists

A browser cannot download from YouTube and similar platforms: CORS blocks
reading the response, the stream URLs are signature-signed, and above 360p the
video and audio are separate streams that need muxing. This service does that
work with `yt-dlp` + `ffmpeg`.

## Deploy

**Cloud Run**
```bash
gcloud run deploy tabbench-video-api \
  --source server --region asia-south1 \
  --allow-unauthenticated --memory 1Gi --timeout 300 \
  --set-env-vars ALWD=1
```

**Railway / Fly / any Docker host** — point it at `server/Dockerfile`.

**Locally**
```bash
cd server && npm install && npm start
```
Requires `yt-dlp` and `ffmpeg` on PATH (the Dockerfile installs both).

## Configure

| Variable | Purpose |
|---|---|
| `ALLOWED_ORIGINS` | Comma-separated origins, e.g. `https://tabbench.com`. **Set this** — otherwise anyone can point their site at your bandwidth. |
| `RATE_LIMIT_PER_MIN` | Requests per IP per minute (default 12) |
| `MAX_DOWNLOAD_BYTES` | Per-download cap (default 512MB) |

Then set on the site build:
```
NEXT_PUBLIC_VIDEO_API=https://your-service-url
```
Without it the site falls back to direct-media-URL handling only.

## Running costs

Bandwidth dominates. Every download egresses the full file twice — in to the
service, out to the user. A tool that gets traffic will move terabytes; check
your host's egress pricing before promoting it.

## Keep yt-dlp current

Platforms change their signature algorithms frequently and an outdated binary
stops working within weeks. Rebuild the image regularly — the Dockerfile always
pulls the latest release.

---

## Keeping it inside Firebase (recommended)

You do not need a separate host. Cloud Run lives in the **same Firebase/GCP
project**, and Firebase Hosting can route to it — one project, one bill, one
console.

### 1. Deploy the service to Cloud Run

```bash
gcloud config set project everydaytools-s
gcloud run deploy tabbench-video-api \
  --source server \
  --region asia-south1 \
  --allow-unauthenticated \
  --memory 1Gi --cpu 1 --timeout 3600 \
  --set-env-vars ALLOWED_ORIGINS=https://tabbench.com
```

### 2. Route metadata calls through Hosting

Add to `firebase.json` **after the service exists** — deploying a rewrite to a
service that is not there yet fails:

```json
"rewrites": [
  {
    "source": "/api/info",
    "run": { "serviceId": "tabbench-video-api", "region": "asia-south1" }
  }
]
```

Now `https://tabbench.com/api/info` hits Cloud Run. Same origin, so **CORS stops
being a problem entirely**.

### 3. Point downloads straight at Cloud Run — not through Hosting

> **Firebase Hosting caps responses at 60 seconds.** Metadata is fine, but a
> large video download will be cut off mid-stream. Send `/api/download` directly
> to the Cloud Run URL, which has no such limit (`--timeout 3600` above).

```
NEXT_PUBLIC_VIDEO_API=https://tabbench-video-api-xxxx.a.run.app
```

`lib/video/backend.ts` builds download links from that value, so downloads
bypass Hosting automatically while `/api/info` can use the rewrite.

## Things that will cost or bite you

- **Blaze plan required.** The free Spark plan blocks outbound requests to
  non-Google hosts, so yt-dlp cannot reach YouTube at all. Cloud Run's free tier
  is generous, but billing must be enabled.
- **Egress is the real bill.** Every download leaves the datacentre in full.
  Cloud Run egress is roughly $0.12/GB — a hundred 50MB downloads a day is
  ~$18/month, and it scales linearly with popularity.
- **Datacentre IPs get blocked.** This is the big one. YouTube throttles and
  blocks known cloud ranges, often within hours of real traffic — expect
  "Sign in to confirm you're not a bot". Mitigations: residential proxies
  (~$3–15/GB), or self-hosting on a residential connection. There is no free fix.
