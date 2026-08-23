# yt-dlp needs Python; muxing needs ffmpeg. Both are baked in so the container
# is self-contained and can run on Cloud Run / Railway / Fly / any VPS.
FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 ca-certificates curl ffmpeg \
 && rm -rf /var/lib/apt/lists/*

# Pin nothing: yt-dlp must stay current, because platforms change their
# signature algorithms constantly and an old binary stops working within weeks.
RUN curl -fsSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
      -o /usr/local/bin/yt-dlp \
 && chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY index.js ./

ENV PORT=8080 NODE_ENV=production
EXPOSE 8080
CMD ["node", "index.js"]
