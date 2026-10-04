/**
 * Writes the static brand files from the mark in lib/brand/mark.ts:
 *   app/favicon.ico   16/32/48/96 px PNG frames (Google wants a multiple of 48)
 *   app/icon.svg      the SVG favicon Next links from <head>
 *   public/icon.svg   same file, served at /icon.svg for the web manifest
 *
 * Run `npm run brand:icons` after changing the mark. The PNG icons (apple-icon,
 * /icons/*.png) are rendered at build time from the same module, so they need
 * no step. favicon.ico stays a checked-in file because Next cannot generate one.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { createJiti } from "jiti";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { markSvg } = await createJiti(import.meta.url).import(path.join(root, "lib/brand/mark.ts"));

const svg = markSvg({ pixels: 512 });
for (const file of ["app/icon.svg", "public/icon.svg"]) fs.writeFileSync(path.join(root, file), svg + "\n");

// Rasterise large and scale down, which keeps the 16px frame crisp.
const SIZES = [16, 32, 48, 96];
const frames = await Promise.all(
  SIZES.map((size) => sharp(Buffer.from(svg), { density: 1152 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer()),
);

// ICO container: 6-byte header, one 16-byte entry per frame, then the PNG frames.
const header = Buffer.alloc(6 + 16 * frames.length);
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(frames.length, 4);
let offset = header.length;
frames.forEach((png, i) => {
  const at = 6 + 16 * i;
  header.writeUInt8(SIZES[i], at); // width
  header.writeUInt8(SIZES[i], at + 1); // height
  header.writeUInt16LE(1, at + 4); // colour planes
  header.writeUInt16LE(32, at + 6); // bits per pixel
  header.writeUInt32LE(png.length, at + 8);
  header.writeUInt32LE(offset, at + 12);
  offset += png.length;
});
fs.writeFileSync(path.join(root, "app/favicon.ico"), Buffer.concat([header, ...frames]));

console.log(`brand icons written: favicon.ico (${SIZES.join("/")}px), icon.svg x2`);
