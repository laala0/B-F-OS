// Turns hand-picked photos (chat attachments, AirDrop, exports) into photo-slot
// files the slides use: auto-orient, crop to 4:5, strip ALL metadata (GPS).
// Colour is left alone, because the client applies their own filter before handing photos over.
//
// Usage: node scripts/prep-photos.mjs [client=bfc] <slot>=<file>[@position] ...
//   position: centre (default) | top | bottom | left | right | attention
//   e.g. node scripts/prep-photos.mjs bfc cranbrook-01=/path/IMG_1.jpg@bottom
// Writes clients/<c>/raw/selected/<slot>.jpg (raw/ is gitignored).

import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const client = args[0] && !args[0].includes("=") ? args.shift() : "bfc";
const OUT = join(ROOT, "clients", client, "raw", "selected");
mkdirSync(OUT, { recursive: true });
if (!args.length) {
  console.error("usage: prep-photos.mjs [client] <slot>=<file>[@position] ...");
  process.exit(1);
}

for (const arg of args) {
  const [slot, rest] = arg.split(/=(.*)/s);
  const [file, pos = "centre"] = rest.split("@");
  const position = pos === "attention" ? sharp.strategy.attention : pos;
  const out = join(OUT, `${slot}.jpg`);
  const src = sharp(file).rotate();
  const { width, height } = await src.metadata();
  await src
    .resize({ width: 1440, height: 1800, fit: "cover", position, withoutEnlargement: false })
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(out);
  const meta = await sharp(out).metadata();
  if (meta.exif || meta.xmp || meta.iptc) throw new Error(`Metadata survived in ${out}`);
  const small = Math.min(width, height) < 1080 ? `  (source only ${width}x${height}, may look soft)` : "";
  console.log(`${slot}: ${file} -> ${out} [${pos}]${small}`);
}
