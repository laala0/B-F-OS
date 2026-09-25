// Tiles every image in a folder into one PNG, for eyeballing a carousel or a
// site's photos in one glance (used by the photo audit too).
// Usage: node scripts/contact-sheet.mjs <folder> <out.png> [columns=5] [tileWidth=300]

import sharp from "sharp";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const [dir, out, cols = "5", tw = "300"] = process.argv.slice(2);
if (!dir || !out) {
  console.error("usage: contact-sheet.mjs <folder> <out.png> [columns] [tileWidth]");
  process.exit(1);
}
const C = Number(cols), W = Number(tw), H = Math.round(W * 1.25), GAP = 10, LABEL = 22;
const files = readdirSync(dir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort();

const tiles = await Promise.all(
  files.map(async (f, i) => {
    const img = await sharp(join(dir, f)).rotate().resize(W, H, { fit: "cover" }).toBuffer();
    const label = Buffer.from(
      `<svg width="${W}" height="${LABEL}"><rect width="100%" height="100%" fill="#fff"/><text x="4" y="16" font-family="sans-serif" font-size="13" fill="#10161c">${f.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text></svg>`
    );
    const x = (i % C) * (W + GAP), y = Math.floor(i / C) * (H + LABEL + GAP);
    return [{ input: img, left: x, top: y }, { input: label, left: x, top: y + H }];
  })
);
const rows = Math.ceil(files.length / C) || 1;
await sharp({ create: { width: C * (W + GAP), height: rows * (H + LABEL + GAP), channels: 3, background: "#ffffff" } })
  .composite(tiles.flat())
  .png()
  .toFile(out);
console.log(`${files.length} images -> ${out}`);
