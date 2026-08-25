import { getAllTools } from "../lib/tools/registry";
import { searchTools } from "../lib/tools/search";

const tools = getAllTools();

const testQueries = [
  "json",
  "percent",
  "word count",
  "password",
  "base64",
  "jwt",
  "guid",
  "url encode",
  "qr code",
  "50kb",
  "jpg to pdf",
  "pdf to docx",
  "watermark",
  "png to jpg",
  "jpg to png",
  "webp",
  "unlock pdf",
  "crop 16:9",
  "merge pdf",
  "age calculator",
  "gst 18%",
  "loan emi",
  "discount coupon",
  "markup vs margin",
  "camelCase",
  "days between",
  "sha256",
  "diff checker",
  "explain regex",
  "split pdf",
  "pdf to images",
  "rotate pdf",
  "bates numbering",
  "resize photo",
  "favicon generator",
  "dollar to rupee",
  "sample files",
  "dummy image",
  "sample pdf",
  "sample video",
  "dummy csv",
  "notes",
  "read aloud",
  "voice dictation",
  "download video",
  "youtube mp4",
  "insta reel",
  "facebook video",
  "tiktok video",
  "tweet video",
  "local video player",
  "flac player",
  "edit pdf",
  "trim video",
  "mute video"
];

let failed = 0;
for (const q of testQueries) {
  const hits = searchTools(tools, q, 3);
  if (hits.length === 0) {
    console.error(`❌ NO RESULTS for "${q}"`);
    failed++;
  } else {
    console.log(`✅ "${q}" -> Top hit: [${hits[0].slug}] ${hits[0].name}`);
  }
}

console.log(`\nTest completed: ${testQueries.length - failed}/${testQueries.length} queries matched.`);
if (failed > 0) process.exit(1);
