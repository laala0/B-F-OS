// Renders a client's content kit with headless Chromium:
//   freebies/*.html        -> out/freebies/*.pdf
//   posts.mjs (slides)     -> out/posts/<id>/<id>-NN.png   (1080x1350)
//   profile/banners        -> out/brand/*.png
//   posts.mjs (captions)   -> calendar.csv, calendar.md, out/packs/<week>/<day>/*.txt
//
// Usage: node scripts/render.mjs [client=baf] [--only=freebies|posts|brand|calendar]

import { chromium } from "playwright-core";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { mark, page, slideHtml, PHOTO_LAYOUTS } from "../templates/slides.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const client = args.find((a) => !a.startsWith("--")) ?? "baf";
const only = args.find((a) => a.startsWith("--only="))?.split("=")[1];
const CLIENT = join(ROOT, "clients", client);
const OUT = join(CLIENT, "out");
const TPL = join(ROOT, "templates");
const brand = JSON.parse(readFileSync(join(CLIENT, "brand.json"), "utf8"));
if (brand.logo && existsSync(join(CLIENT, brand.logo))) brand.logoUrl = pathToFileURL(join(CLIENT, brand.logo)).href;
const CHROME = process.env.CHROME_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const want = (k) => !only || only === k;
const tmp = join(OUT, ".html");
mkdirSync(tmp, { recursive: true });

// Pages are written next to templates' relative asset paths, so fonts and the
// stylesheet resolve over file:// without a server.
function writeTmp(name, html) {
  const p = join(tmp, name);
  writeFileSync(p, html);
  return pathToFileURL(p).href;
}
const cssHref = pathToFileURL(join(TPL, "brand.css")).href;

// Small, final files the client needs by hand (PDF freebies, profile/banner images)
// are also copied to deliverables/, which IS committed, so they can be grabbed from GitHub.
const DELIV = join(CLIENT, "deliverables");
function publishDeliverable(file, name) {
  mkdirSync(DELIV, { recursive: true });
  copyFileSync(file, join(DELIV, name ?? file.split("/").pop()));
}

const browser = await chromium.launch({ executablePath: CHROME });
const ctx = await browser.newContext({ deviceScaleFactor: 1 });
const pg = await ctx.newPage();

async function shoot(url, outDir, prefix) {
  mkdirSync(outDir, { recursive: true });
  await pg.goto(url, { waitUntil: "load" });
  await pg.evaluate(() => document.fonts.ready);
  const sections = await pg.$$("section.slide");
  const files = [];
  for (let i = 0; i < sections.length; i++) {
    const f = join(outDir, `${prefix}-${String(i + 1).padStart(2, "0")}.png`);
    await sections[i].screenshot({ path: f });
    files.push(f);
  }
  return files;
}

// ---------- freebies -> PDF ----------
if (want("freebies")) {
  const dir = join(CLIENT, "freebies");
  mkdirSync(join(OUT, "freebies"), { recursive: true });
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".html"))) {
    const html = readFileSync(join(dir, f), "utf8")
      .replaceAll("{{CSS}}", pathToFileURL(TPL).href)
      .replaceAll("{{MARK}}", mark());
    await pg.goto(writeTmp(f, html), { waitUntil: "load" });
    await pg.evaluate(() => document.fonts.ready);
    const pdf = join(OUT, "freebies", f.replace(/\.html$/, ".pdf"));
    await pg.pdf({ path: pdf, format: "Letter", printBackground: true, preferCSSPageSize: true });
    // Preview PNG of page 1 for the approval page / social teaser.
    await pg.setViewportSize({ width: 816, height: 1056 });
    await pg.screenshot({ path: pdf.replace(/\.pdf$/, "-p1.png"), clip: { x: 0, y: 0, width: 816, height: 1056 } });
    console.log("pdf ", pdf);
    publishDeliverable(pdf);
  }
  await pg.setViewportSize({ width: 1280, height: 720 });
}

// ---------- brand: profile picture + banners ----------
// Clients with their own logo files (brand.logo) keep their own profile images
// (see deliverables/); the hard-hat mark is only a stand-in until a logo exists.
if (want("brand") && brand.logoUrl) console.log("brand: client logo in use, skipping generated profile/banner images");
if (want("brand") && !brand.logoUrl) {
  const svg = mark().replace('<span class="mark">', "").replace("</span>", "");
  const brandHtml = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${cssHref}">
<style>
  body{display:flex;flex-direction:column;gap:40px;width:max-content;background:#000}
  .pfp{width:1080px;height:1080px;display:grid;place-items:center;background:radial-gradient(90% 90% at 30% 20%,#1c2f45 0%,#0e1419 70%);position:relative;overflow:hidden}
  .pfp::before{content:"";position:absolute;inset:0;opacity:.07;background-image:linear-gradient(#e8edf2 1px,transparent 1px),linear-gradient(90deg,#e8edf2 1px,transparent 1px);background-size:44px 44px}
  .pfp .inner{position:relative;display:flex;flex-direction:column;align-items:center;gap:26px;color:var(--gold)}
  .pfp svg{width:420px;height:420px}
  .pfp b{font:400 104px/1 var(--display);color:var(--text);letter-spacing:.04em}
  .banner{position:relative;overflow:hidden;display:flex;flex-direction:row;align-items:center;gap:48px;padding:0 90px;background:radial-gradient(120% 160% at 85% -20%,#1c2f45 0%,#0e1419 62%)}
  .banner::before{content:"";position:absolute;inset:0;opacity:.07;background-image:linear-gradient(#e8edf2 1px,transparent 1px),linear-gradient(90deg,#e8edf2 1px,transparent 1px);background-size:44px 44px}
  .banner>*{position:relative}
  .banner .mark{width:150px;height:150px;border-radius:36px}.banner .mark svg{width:92px;height:92px}
  .banner h1{font:400 118px/1 var(--display);letter-spacing:.03em}
  .banner p{white-space:nowrap;font:700 30px/1 var(--body);letter-spacing:.28em;text-transform:uppercase;color:var(--gold);margin-top:18px}
</style></head><body>
<section class="slide pfp" style="padding:0"><div class="inner">${svg}<b>B&amp;F</b></div></section>
<section class="slide banner" style="width:1640px;height:624px;padding:0 120px 0 520px"><div class="mark">${svg}</div><div><h1>${brand.wordmark}</h1><p>${brand.subline} · ${brand.region}</p></div></section>
<section class="slide banner" style="width:1128px;height:191px;padding:0 60px 0 330px;gap:26px"><div class="mark" style="width:96px;height:96px;border-radius:24px"><span style="display:grid;place-items:center">${svg.replace('width="24"', 'width="58"').replace('height="24"', 'height="58"')}</span></div><div><h1 style="font-size:64px">${brand.wordmark}</h1><p style="font-size:16px;margin-top:10px">${brand.subline} · ${brand.region}</p></div></section>
</body></html>`;
  const [pfp, fb, li] = await shoot(writeTmp("brand.html", brandHtml), join(OUT, "brand"), "brand");
  console.log("brand", pfp, fb, li);
  for (const [f, name] of [[pfp, "profile-picture-1080.png"], [fb, "facebook-cover-1640x624.png"], [li, "linkedin-banner-1128x191.png"]]) publishDeliverable(f, name);
}

// ---------- posts: slides + captions ----------
if (want("posts") || want("calendar")) {
  const { posts } = await import(pathToFileURL(join(CLIENT, "posts.mjs")).href);
  const photoDir = join(CLIENT, "raw", "selected");

  if (want("posts")) {
    for (const p of posts) {
      const slides = p.slides.map((s) => {
        // Photo slots resolve to social/clients/<c>/raw/selected/<slot>.jpg once the audit picks them.
        if (PHOTO_LAYOUTS.has(s.layout) && s.slot && existsSync(join(photoDir, `${s.slot}.jpg`))) {
          return { ...s, src: pathToFileURL(join(photoDir, `${s.slot}.jpg`)).href };
        }
        return s;
      });
      const html = page(brand, slides.map((s, i) => slideHtml(brand, s, i + 1, slides.length, p.format)), cssHref);
      const files = await shoot(writeTmp(`${p.id}.html`, html), join(OUT, "posts", p.id), p.id);
      console.log("post", p.id, files.length, "slides");
    }
  }

  // Calendar + posting packs are generated from the same source as the slides,
  // so the captions a human pastes always match the graphics they upload.
  const esc = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const cols = ["date", "time_pt", "id", "week", "pillar", "format", "platforms", "keyword", "hook", "photo_slots", "status"];
  const rows = posts.map((p) => [
    p.date, p.time, p.id, p.week, p.pillar, p.type, p.platforms.join(" + "), p.keyword ?? "", p.hook,
    p.slides.filter((s) => s.slot).map((s) => s.slot).join(" | "),
    p.slides.some((s) => s.slot && !existsSync(join(photoDir, `${s.slot}.jpg`))) ? "needs photos" : "ready",
  ]);
  writeFileSync(join(CLIENT, "calendar.csv"), [cols.join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n") + "\n");

  const md = [`# ${brand.client}: content calendar\n`, `All times ${brand.timezone}. Generated by \`scripts/render.mjs\` from \`posts.mjs\`, so edit that file, not this one.\n`];
  for (const p of posts) {
    md.push(`## ${p.date} ${p.time} · ${p.id} · ${p.pillar}${p.keyword ? ` · **${p.keyword}**` : ""}\n`);
    md.push(`**Hook:** ${p.hook}  \n**Format:** ${p.type} (${p.slides.length} slides) · **Platforms:** ${p.platforms.join(", ")}\n`);
    for (const [net, text] of Object.entries(p.captions)) md.push(`**${net}**\n\n\`\`\`\n${text.trim()}\n\`\`\`\n`);
    if (p.firstComment) md.push(`**First comment (post it yourself right after publishing):**\n\n\`\`\`\n${p.firstComment.trim()}\n\`\`\`\n`);
    md.push(`**Alt text:** ${p.alt}\n`);
    if (p.story) md.push(`**Story same day:** ${p.story}\n`);
    md.push("---\n");
  }
  writeFileSync(join(CLIENT, "calendar.md"), md.join("\n"));

  for (const p of posts) {
    const dir = join(OUT, "packs", `week-${p.week}`, `${p.date}_${p.id}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "post-at.txt"), `${p.date} ${p.time} ${brand.timezone}\nPlatforms: ${p.platforms.join(", ")}\nFormat: ${p.type}\n`);
    for (const [net, text] of Object.entries(p.captions)) writeFileSync(join(dir, `caption-${net.toLowerCase()}.txt`), text.trim() + "\n");
    if (p.firstComment) writeFileSync(join(dir, "first-comment.txt"), p.firstComment.trim() + "\n");
    writeFileSync(join(dir, "alt-text.txt"), p.alt + "\n");
    // Slides go in the pack too, so one Drive folder holds everything needed to schedule the post.
    const slidesDir = join(OUT, "posts", p.id);
    if (existsSync(slidesDir)) for (const f of readdirSync(slidesDir)) copyFileSync(join(slidesDir, f), join(dir, f));
  }
  console.log("calendar", join(CLIENT, "calendar.csv"));
}

await browser.close();
