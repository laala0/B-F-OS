// Assembles the client-facing launch console (an Artifact page) from the same
// sources as everything else: posts.mjs, brand.json, dm-scripts.md and the
// rendered out/ folder. Output: clients/<c>/out/console/ + files.json (the
// list of supporting files to publish next to index.html).
//
// Usage: node scripts/build-console.mjs [client=bfc]   (run render.mjs first)

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";
import { mark } from "../templates/slides.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const client = process.argv[2] ?? "bfc";
const CLIENT = join(ROOT, "clients", client);
const OUT = join(CLIENT, "out");
const DEST = join(OUT, "console");
const brand = JSON.parse(readFileSync(join(CLIENT, "brand.json"), "utf8"));
const { posts } = await import(pathToFileURL(join(CLIENT, "posts.mjs")).href);

rmSync(DEST, { recursive: true, force: true });
mkdirSync(DEST, { recursive: true });
const files = [];
const add = (from, to) => { mkdirSync(dirname(join(DEST, to)), { recursive: true }); cpSync(from, join(DEST, to)); files.push(to); return to; };

const data = {
  client: brand.client,
  timezone: brand.timezone,
  markSvg: mark().replace('<span class="mark">', "").replace(/<\/span>$/, ""),
  freebies: Object.entries(brand.freebies).map(([key, f]) => {
    const base = f.file.split("/").pop().replace(/\.html$/, "");
    return {
      key, title: f.title, audience: f.audience,
      live: new Date(f.goesLive + "T12:00:00").toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" }),
      pdf: add(join(OUT, "freebies", `${base}.pdf`), `freebies/${base}.pdf`),
      preview: add(join(OUT, "freebies", `${base}-p1.png`), `freebies/${base}-p1.png`),
    };
  }),
  posts: posts.map((p) => {
    const dir = join(OUT, "posts", p.id);
    if (!existsSync(dir)) throw new Error(`No slides for ${p.id}; run render.mjs first.`);
    return {
      id: p.id, week: p.week, date: p.date, time: p.time, pillar: p.pillar, keyword: p.keyword,
      platforms: p.platforms, hook: p.hook, captions: Object.fromEntries(Object.entries(p.captions).map(([k, v]) => [k, v.trim()])),
      firstComment: p.firstComment?.trim() ?? null, alt: p.alt, story: p.story,
      photoSlots: p.slides.filter((s) => s.slot && !existsSync(join(CLIENT, "raw", "selected", `${s.slot}.jpg`))).map((s) => s.slot),
      slides: readdirSync(dir).filter((f) => f.endsWith(".png")).sort().map((f) => add(join(dir, f), `slides/${p.id}/${f}`)),
    };
  }),
};

// Small JPEG thumbnails for the slide strips; the full PNGs load only in the viewer/save.
for (const p of data.posts) {
  p.thumbs = [];
  for (const s of p.slides) {
    const t = s.replace(/^slides\//, "thumbs/").replace(/\.png$/, ".jpg");
    mkdirSync(dirname(join(DEST, t)), { recursive: true });
    await sharp(join(DEST, s)).resize({ width: 320 }).jpeg({ quality: 78, mozjpeg: true }).toFile(join(DEST, t));
    files.push(t);
    p.thumbs.push(t);
  }
}

// dm-scripts.md → structured replies, so the console and the markdown never disagree.
const md = readFileSync(join(CLIENT, "dm-scripts.md"), "utf8");
data.replyRules = (md.match(/\*\*Rules\*\*\n([\s\S]*?)\n\n/)?.[1] ?? "")
  .split("\n").filter((l) => l.startsWith("- ")).map((l) => l.slice(2).replace(/\*\*/g, ""));
data.replies = [...md.matchAll(/^## (\w+): .*\n([\s\S]*?)(?=^## |^---)/gm)].map(([, key, body]) => ({
  key,
  public: [...body.matchAll(/^- (.+)$/gm)].map((m) => m[1]),
  dm: body.match(/```\n([\s\S]*?)```/)?.[1].trim() ?? "",
}));

const tpl = readFileSync(join(ROOT, "templates", "console.html"), "utf8");
// Escape "</" so caption text can never close the JSON <script> early.
writeFileSync(join(DEST, "index.html"), tpl.replace("/*DATA*/", JSON.stringify(data).replace(/<\//g, "<\\/")));
writeFileSync(join(OUT, "console.files.json"), JSON.stringify(files, null, 0));
console.log(`console: ${files.length} files + index.html -> ${DEST}`);
