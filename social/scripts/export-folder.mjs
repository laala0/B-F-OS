// Builds the client's ready-to-post folder and zips it, so posting is
// "open folder → upload in order → paste caption". Posts are sorted by
// their `status` in posts.mjs: to-schedule | scheduled | posted.
// Posts without a status (old drafts) are left out.
//
// Usage: node scripts/export-folder.mjs [client=baf]   (run render.mjs first)
// Output: clients/<c>/out/<SHORT>/ and clients/<c>/out/<SHORT>.zip

import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const client = process.argv[2] ?? "baf";
const CLIENT = join(ROOT, "clients", client);
const OUT = join(CLIENT, "out");
const brand = JSON.parse(readFileSync(join(CLIENT, "brand.json"), "utf8"));
const { posts } = await import(pathToFileURL(join(CLIENT, "posts.mjs")).href);

const NAME = brand.short ?? client.toUpperCase();
const BASE = join(OUT, NAME);
const SECTIONS = { "to-schedule": "1 - To schedule", scheduled: "2 - Scheduled", posted: "3 - Posted" };

rmSync(BASE, { recursive: true, force: true });
for (const s of Object.values(SECTIONS)) mkdirSync(join(BASE, s), { recursive: true });
writeFileSync(join(BASE, SECTIONS.scheduled, "README.txt"), "Drag a post's folder here once it's scheduled.\n");
writeFileSync(join(BASE, SECTIONS.posted, "README.txt"), "Drag a post's folder here once it's live.\n");

const write = (dir, file, text) => text && writeFileSync(join(dir, file), text.trim() + "\n");
const ampm = (t) => { const [h, m] = t.split(":").map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; };
const day = (d) => new Date(d + "T12:00:00").toLocaleDateString("en-CA", { weekday: "long", month: "short", day: "numeric" });

const howTo = {
  LinkedIn: (p, n) => `Post on Manpreet's LinkedIn: ${day(p.date)}, ${ampm(p.time)} (${brand.timezone})

1. LinkedIn → Start a post → photo icon → add the ${n} images in order (01 first).
2. Paste caption.txt.
3. Re-type any @tag (e.g. "@Unitech") and pick the company from the dropdown, or it won't link.
4. Optional: click each image → Alt text → paste the matching line from alt-text.txt.
5. Clock icon → ${day(p.date)} → ${ampm(p.time)} → Next → Schedule.
6. Move this folder to "2 - Scheduled".
7. When it goes live: post first-comment.txt as a comment, reply to every comment for the first hour, then move this folder to "3 - Posted".`,
  TikTok: (p) => `Post on the ${NAME} TikTok: ${day(p.date)}, ${ampm(p.time)} (${brand.timezone})

1. iPhone Photos → pick the clip → Share → Options → turn Location OFF → Save Video.
2. TikTok → + → upload the clip → Text: add the lines from on-screen-text.txt.
3. Paste caption.txt. Post now, or schedule it in TikTok Studio on the web.
4. Move this folder to "2 - Scheduled", then to "3 - Posted" once it's live.`,
};

let count = 0;
for (const p of posts.filter((x) => x.status)) {
  const section = SECTIONS[p.status];
  if (!section) throw new Error(`${p.id}: unknown status "${p.status}"`);
  const platform = p.platforms.join(" + ");
  const dir = join(BASE, section, `${p.date} ${p.time.replace(":", "")} ${platform} - ${p.title ?? p.id}`);
  mkdirSync(dir, { recursive: true });

  const slideDir = join(OUT, "posts", p.id);
  const pngs = existsSync(slideDir) ? readdirSync(slideDir).filter((f) => f.endsWith(".png")).sort() : [];
  pngs.forEach((f, i) => {
    const label = p.slides[i]?.name ?? "image";
    copyFileSync(join(slideDir, f), join(dir, `${String(i + 1).padStart(2, "0")}-${label}.png`));
  });

  const captions = Object.entries(p.captions);
  for (const [net, text] of captions) write(dir, captions.length > 1 ? `caption-${net.toLowerCase()}.txt` : "caption.txt", text);
  write(dir, "first-comment.txt", p.firstComment);
  if (pngs.length) write(dir, "alt-text.txt", p.alt);
  if (p.onScreen) write(dir, "on-screen-text.txt", [...p.onScreen, "", "Backup CTAs:", ...(p.backupCtas ?? [])].join("\n"));
  const guide = howTo[p.platforms[0]];
  if (guide) write(dir, p.platforms[0] === "TikTok" ? "HOW-TO-POST.txt" : "HOW-TO-SCHEDULE.txt", guide(p, pngs.length));
  count++;
}

// Brand kit: logo files and profile pictures (never the uncropped logo card with contact details).
mkdirSync(join(BASE, "Brand"), { recursive: true });
for (const f of [brand.logo, brand.logoFull].filter(Boolean)) copyFileSync(join(CLIENT, f), join(BASE, "Brand", f.split("/").pop()));
const deliv = join(CLIENT, "deliverables");
if (existsSync(deliv)) for (const f of readdirSync(deliv).filter((f) => f.endsWith(".png"))) copyFileSync(join(deliv, f), join(BASE, "Brand", f));

const zipPath = join(OUT, `${NAME}.zip`);
rmSync(zipPath, { force: true });
execFileSync("zip", ["-rq", "-X", zipPath, NAME, "-x", "*.DS_Store"], { cwd: OUT });
console.log(`${count} posts -> ${BASE}\nzip: ${zipPath}`);
