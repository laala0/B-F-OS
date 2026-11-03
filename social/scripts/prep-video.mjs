// Builds a LinkedIn-ready feed video for one post from raw iPhone clips:
//   trim → crop to 4:5 (1080x1350) → HDR tone-map → join → title card on
//   the first seconds + logo end card → strip ALL metadata (iPhone MOVs carry GPS)
//   → out/video/<postId>.mp4 + <postId>-thumb.png
//
// The title card reuses the post's first slide (logoCover fields) and the end
// card uses brand.logoFull + post.videoEndCta, so the video matches the photo posts.
//
// Usage: node scripts/prep-video.mjs [client=baf] <postId> <clip>[@start-end] ...
//   e.g. node scripts/prep-video.mjs baf li04-cranbrook-wall-pour IMG_1.MOV@2-14 IMG_2.MOV
// Needs ffmpeg/ffprobe on PATH (FFMPEG / FFPROBE env vars override).

import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const client = args[0] && !args[0].includes("-") && !args[0].includes(".") ? args.shift() : "baf";
const postId = args.shift();
if (!postId || !args.length) {
  console.error("usage: prep-video.mjs [client] <postId> <clip>[@start-end] ...");
  process.exit(1);
}

const FFMPEG = process.env.FFMPEG ?? "ffmpeg";
const FFPROBE = process.env.FFPROBE ?? "ffprobe";
const CLIENT = join(ROOT, "clients", client);
const OUT = join(CLIENT, "out", "video");
const WORK = join(OUT, `.work-${postId}`);
rmSync(WORK, { recursive: true, force: true });
mkdirSync(WORK, { recursive: true });

const brand = JSON.parse(readFileSync(join(CLIENT, "brand.json"), "utf8"));
const { posts } = await import(pathToFileURL(join(CLIENT, "posts.mjs")).href);
const post = posts.find((p) => p.id === postId);
if (!post) throw new Error(`No post ${postId} in posts.mjs`);
const W = 1080, H = 1350, FPS = 30, TITLE_SECS = 3.5, END_SECS = 2.5;

const ff = (...a) => execFileSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", ...a], { stdio: ["ignore", "inherit", "inherit"] });
const probe = (file) => JSON.parse(execFileSync(FFPROBE, ["-v", "error", "-print_format", "json", "-show_streams", "-show_format", file]).toString());

// ---------- overlay PNGs (title card + end card) via the shared templates ----------
const css = pathToFileURL(join(ROOT, "templates", "brand.css")).href;
const logo = brand.logo ? pathToFileURL(join(CLIENT, brand.logo)).href : null;
const logoFull = brand.logoFull ? pathToFileURL(join(CLIENT, brand.logoFull)).href : null;
const cover = post.slides?.[0] ?? {};
const check = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;
const page = (body, bg) => `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${css}">
<style>html,body{background:${bg};margin:0} .stage{position:relative;width:${W}px;height:${H}px;overflow:hidden}</style></head><body>${body}</body></html>`;

const titleHtml = page(`<div class="stage"><div class="lcard top">
  ${logo ? `<img class="lcard-logo" src="${logo}" alt="">` : `<div class="lcard-wm"><b>${brand.wordmark}</b><span>${brand.subline}</span></div>`}
  <div class="lcard-text"><div class="lcard-title">${cover.title ?? post.title}${cover.badge ? ` <span class="lcard-badge">${check}${cover.badge}</span>` : ""}</div>
  ${cover.sub ? `<div class="lcard-sub">${cover.sub}</div>` : ""}</div></div></div>`, "transparent");

const endHtml = page(`<div class="stage" style="background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:56px;padding:0 90px">
  ${logoFull ? `<img src="${logoFull}" style="width:100%;height:auto" alt="">` : `<b style="font:400 120px/1 var(--display)">${brand.wordmark}</b>`}
  <div style="font:800 40px/1.25 var(--body);letter-spacing:.1em;text-transform:uppercase;color:#fff;background:#10161c;padding:26px 40px;border-radius:999px;text-align:center">${post.videoEndCta ?? "DM for forming &amp; rebar pricing"}</div>
  <div style="font:600 30px/1.3 var(--body);color:#5b6b79;text-align:center">Forming · Rebar · Concrete finishing · Damp proofing</div></div>`, "#ffffff");

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? findChromium() });
const pg = await browser.newPage({ viewport: { width: W, height: H } });
for (const [name, html, transparent] of [["title.png", titleHtml, true], ["end.png", endHtml, false]]) {
  const f = join(WORK, name.replace(".png", ".html"));
  writeFileSync(f, html);
  await pg.goto(pathToFileURL(f).href, { waitUntil: "load" });
  await pg.evaluate(() => document.fonts.ready);
  await pg.screenshot({ path: join(WORK, name), omitBackground: transparent, clip: { x: 0, y: 0, width: W, height: H } });
}
await browser.close();

// ---------- normalise each clip to the same 4:5 / 30fps / AAC format ----------
const segs = [];
for (const [i, arg] of args.entries()) {
  const [file, range] = arg.split("@");
  const info = probe(file);
  const v = info.streams.find((s) => s.codec_type === "video");
  const hasAudio = info.streams.some((s) => s.codec_type === "audio");
  const hdr = /arib-std-b67|smpte2084/.test(v?.color_transfer ?? "");
  const [start, end] = range ? range.split("-").map(Number) : [];
  // iPhone HDR (HLG / Dolby Vision) looks washed out unless tone-mapped to SDR.
  const tonemap = hdr ? "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv," : "";
  const vf = `${tonemap}scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},fps=${FPS},format=yuv420p,setsar=1`;
  const seg = join(WORK, `seg${i}.mp4`);
  ff(
    ...(start != null ? ["-ss", String(start)] : []), ...(end != null ? ["-to", String(end)] : []), "-i", file,
    ...(hasAudio ? [] : ["-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo"]),
    "-map", "0:v:0", "-map", hasAudio ? "0:a:0" : "1:a:0", "-shortest",
    "-vf", vf, "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-c:a", "aac", "-ar", "44100", "-ac", "2", "-b:a", "128k",
    "-map_metadata", "-1", seg,
  );
  segs.push(seg);
  console.log(`clip ${i + 1}: ${file.split("/").pop()}${range ? ` @${range}s` : ""}${hdr ? " (HDR → SDR)" : ""}${hasAudio ? "" : " (silent)"}`);
}

// End card as its own segment so it concatenates cleanly.
const endSeg = join(WORK, "end.mp4");
ff("-loop", "1", "-t", String(END_SECS), "-i", join(WORK, "end.png"), "-f", "lavfi", "-t", String(END_SECS), "-i", "anullsrc=r=44100:cl=stereo",
  "-vf", `fps=${FPS},format=yuv420p,setsar=1`, "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-c:a", "aac", "-ar", "44100", "-ac", "2", "-shortest", endSeg);
segs.push(endSeg);

const list = join(WORK, "list.txt");
writeFileSync(list, segs.map((s) => `file '${s}'`).join("\n"));
const joined = join(WORK, "joined.mp4");
ff("-f", "concat", "-safe", "0", "-i", list, "-c", "copy", joined);

// ---------- title card overlay + final metadata-free export ----------
mkdirSync(OUT, { recursive: true });
const out = join(OUT, `${postId}.mp4`);
ff("-i", joined, "-i", join(WORK, "title.png"),
  "-filter_complex", `[0:v][1:v]overlay=0:0:enable='between(t,0,${TITLE_SECS})'[v]`, "-map", "[v]", "-map", "0:a",
  "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "copy",
  "-map_metadata", "-1", "-map_chapters", "-1", "-metadata", "creation_time=", "-movflags", "+faststart", out);
const thumb = join(OUT, `${postId}-thumb.png`);
ff("-ss", "1", "-i", out, "-frames:v", "1", thumb);

const fmt = probe(out).format;
const leftover = Object.keys(fmt.tags ?? {}).filter((k) => !/^(major_brand|minor_version|compatible_brands|encoder)$/.test(k));
if (leftover.length) throw new Error(`Metadata survived in ${out}: ${leftover.join(", ")}`);
rmSync(WORK, { recursive: true, force: true });
console.log(`${out}  (${Number(fmt.duration).toFixed(1)}s, ${(fmt.size / 1048576).toFixed(1)} MB)\n${thumb}`);

function findChromium() {
  const base = "/opt/pw-browsers";
  const builds = existsSync(base) ? readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort((a, b) => b.split("-")[1] - a.split("-")[1]) : [];
  for (const b of builds) for (const sub of ["chrome-linux64", "chrome-linux"]) {
    const p = join(base, b, sub, "chrome");
    if (existsSync(p)) return p;
  }
  throw new Error("No Chromium found; set CHROME_PATH.");
}
