// Slide builders shared by every client. Each returns one <section class="slide">
// that render.mjs screenshots at 1080x1350 (or 1080x1920 for stories).
// Copy is passed in as trusted HTML from the client's posts.mjs.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const hardHat = readFileSync(
  fileURLToPath(new URL("../node_modules/lucide-static/icons/hard-hat.svg", import.meta.url)),
  "utf8"
)
  .replace(/<!--.*?-->/s, "")
  .replace('stroke-width="2"', 'stroke-width="2.25"');

export const mark = () => `<span class="mark">${hardHat}</span>`;

const foot = (brand, i, n) => `
  <div class="foot">
    <div class="brand">${mark()}<div class="wordmark"><b>${brand.wordmark}</b><span>${brand.subline}</span></div></div>
    ${n > 1 ? (i < n ? `<div class="swipe">Swipe &rarr;</div>` : `<div class="pager"><b>${i}</b> / ${n}</div>`) : ""}
  </div>`;

const layouts = {
  cover: (s) => `
    <div class="kicker">${s.kicker}</div>
    <h1 class="title ${s.size ?? ""}">${s.title}</h1>
    ${s.sub ? `<p class="sub">${s.sub}</p>` : ""}
    ${s.chips ? `<div class="chips">${s.chips.map((c, i) => `<span class="chip ${i === 0 ? "gold" : ""}">${c}</span>`).join("")}</div>` : ""}`,

  point: (s) => `
    <div class="num">${s.num}</div>
    <h2 class="point-title">${s.title}</h2>
    <p class="point-body">${s.body}</p>
    ${s.chips ? `<div class="chips">${s.chips.map((c) => `<span class="chip">${c}</span>`).join("")}</div>` : ""}`,

  mythfact: (s) => `
    <div class="kicker">${s.kicker ?? "Myth vs fact"}</div>
    <div style="margin-top:56px">
      <div class="panel myth"><div class="label myth">Myth</div><p>${s.myth}</p></div>
      <div class="panel fact"><div class="label fact">Fact</div><p>${s.fact}</p></div>
    </div>`,

  cta: (s) => `
    <div class="kicker">${s.kicker ?? "Free for anyone on the tools"}</div>
    <h2 class="title md">${s.title}</h2>
    <div class="keyword-box"><span class="hint">Comment</span><span class="keyword">${s.keyword}</span></div>
    ${s.bullets ? `<div class="cta-list">${s.bullets.map((b) => `<div>${b}</div>`).join("")}</div>` : ""}
    ${s.sub ? `<p class="sub">${s.sub}</p>` : ""}`,

  question: (s) => `
    <div class="kicker">${s.kicker ?? "Your turn"}</div>
    <h2 class="title">${s.title}</h2>
    ${s.sub ? `<p class="sub">${s.sub}</p>` : ""}`,

  photo: (s) => `
    ${photoImg(s)}
    <div class="shade"></div>
    <div class="copy">
      ${s.kicker ? `<div class="kicker">${s.kicker}</div>` : ""}
      ${s.title ? `<h2 class="title">${s.title}</h2>` : ""}
      ${s.sub ? `<p class="sub" style="color:#dfe6ec">${s.sub}</p>` : ""}
    </div>`,

  // Photo only: real site photos for platforms (LinkedIn) where a designed
  // overlay reads as an ad. No text, no footer.
  clean: (s) => photoImg(s),

  // Photo + a light lower-third card carrying the client's real logo file.
  // Falls back to the text wordmark until brand.logo exists.
  logoCover: (s, brand) => `
    ${photoImg(s)}
    <div class="lcard${s.cardTop ? " top" : ""}">
      ${brand.logoUrl ? `<img class="lcard-logo" src="${brand.logoUrl}" alt="">` : `<div class="lcard-wm"><b>${brand.wordmark}</b><span>${brand.subline}</span></div>`}
      <div class="lcard-text">
        <div class="lcard-title">${s.title}${s.badge ? ` <span class="lcard-badge">${checkIcon}${s.badge}</span>` : ""}</div>
        ${s.sub ? `<div class="lcard-sub">${s.sub}</div>` : ""}
      </div>
    </div>`,
};

const checkIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;

function photoImg(s) {
  return s.src
    ? `<div class="img" style="background-image:url('${s.src}');${s.focus ? `background-position:${s.focus}` : ""}"></div>`
    : `<div class="placeholder">PHOTO SLOT<br>${s.slot ?? ""}</div>`;
}

export const PHOTO_LAYOUTS = new Set(["photo", "clean", "logoCover"]);
const NO_FOOT = new Set(["clean", "logoCover"]);

export function slideHtml(brand, s, i, n, format = "feed") {
  const isPhoto = PHOTO_LAYOUTS.has(s.layout);
  const cls = ["slide", isPhoto ? "photo" : "", format === "story" ? "story" : "", format === "square" ? "square" : ""].join(" ");
  const body = layouts[s.layout](s, brand);
  const wrapped = isPhoto ? body : `<div class="body ${s.anchor === "bottom" ? "bottom" : ""}">${body}</div>`;
  return `<section class="${cls}">${wrapped}${s.noFoot || NO_FOOT.has(s.layout) ? "" : foot(brand, i, n)}</section>`;
}

export function page(brand, sections, cssHref) {
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="${cssHref}">
<style>:root{--gold:${brand.colors.gold};--ink:${brand.colors.ink}} body{display:flex;flex-direction:column;gap:40px;padding:0;width:max-content}</style>
</head><body>${sections.join("\n")}</body></html>`;
}
