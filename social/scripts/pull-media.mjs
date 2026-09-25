// Pulls job photos out of Boss & Friends OS (Supabase) for the content audit.
//
//   - Signs in as the dedicated "Content" account (never the owner's login).
//   - Reads only the `projects` and `media` tables and the private `media` bucket.
//   - Converts HEIC to JPG, auto-orients, and re-encodes with ALL metadata stripped,
//     because iPhone photos carry the GPS coordinates of the client's property.
//   - Writes clients/<c>/raw/<site>/<date>_<id>.jpg, one folder per project (site),
//     plus raw/asset-register.csv with blank audit columns to fill in.
//   - raw/ is gitignored: client photos and site details never go into git.
//
// Env (set in the Claude environment settings, never pasted in chat):
//   BFOS_SUPABASE_URL, BFOS_SUPABASE_ANON_KEY, BFOS_CONTENT_EMAIL, BFOS_CONTENT_PASSWORD
//
// Usage: node scripts/pull-media.mjs [client=bfc] [--since=YYYY-MM-DD]

import { createClient } from "@supabase/supabase-js";
import heicConvert from "heic-convert";
import sharp from "sharp";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const client = args.find((a) => !a.startsWith("--")) ?? "bfc";
const since = args.find((a) => a.startsWith("--since="))?.split("=")[1];
const RAW = join(ROOT, "clients", client, "raw");

const need = ["BFOS_SUPABASE_URL", "BFOS_SUPABASE_ANON_KEY", "BFOS_CONTENT_EMAIL", "BFOS_CONTENT_PASSWORD"];
const missing = need.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing env: ${missing.join(", ")}. Add them in the Claude environment settings, then start a new session.`);
  process.exit(1);
}

const supabase = createClient(process.env.BFOS_SUPABASE_URL, process.env.BFOS_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
const { error: authError } = await supabase.auth.signInWithPassword({
  email: process.env.BFOS_CONTENT_EMAIL,
  password: process.env.BFOS_CONTENT_PASSWORD,
});
if (authError) {
  console.error("Sign-in failed:", authError.message);
  process.exit(1);
}

const { data: projects, error: pErr } = await supabase
  .from("projects")
  .select("id, code, name, status, gc_company")
  .is("deleted_at", null);
if (pErr) throw pErr;
const byId = new Map(projects.map((p) => [p.id, p]));

let q = supabase
  .from("media")
  .select("id, project_id, storage_path, content_type, size_bytes, caption, created_at")
  .order("created_at", { ascending: true });
if (since) q = q.gte("created_at", `${since}T00:00:00`);
const { data: media, error: mErr } = await q;
if (mErr) throw mErr;
console.log(`${media.length} media rows across ${new Set(media.map((m) => m.project_id)).size} sites`);

const slug = (s) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
const isHeic = (m) => /heic|heif/i.test(m.content_type ?? "") || /\.(heic|heif)$/i.test(m.storage_path);
const isVideo = (m) => /^video\//i.test(m.content_type ?? "") || /\.(mov|mp4|m4v)$/i.test(m.storage_path);

const rows = [];
for (const m of media) {
  const p = byId.get(m.project_id);
  const site = p ? `${p.code}-${slug(p.name)}` : "unknown-site";
  const day = m.created_at.slice(0, 10).replaceAll("-", "");
  const base = `${day}_${m.id.slice(0, 8)}`;
  const dir = join(RAW, site);
  mkdirSync(dir, { recursive: true });

  const row = {
    file: "", site, project_code: p?.code ?? "", project_status: p?.status ?? "",
    gc_on_record: p?.gc_company ? "yes" : "no", uploaded: m.created_at.slice(0, 10),
    kind: isVideo(m) ? "video" : "photo", width: "", height: "", orientation: "",
    metadata_stripped: "", caption: m.caption ?? "",
    // Audit columns, filled by hand or by Claude in the audit session:
    stage: "", trades_visible: "", quality_1to5: "", story_role: "", privacy_flags: "",
    platform_fit: "", slot: "", public_ok: "",
  };

  if (isVideo(m)) {
    // Video metadata (incl. GPS) can't be stripped without a full ffmpeg build.
    // Keep the original out of the pipeline until it's re-exported (see README).
    const out = join(dir, `${base}.video-NOT-STRIPPED${m.storage_path.match(/\.[a-z0-9]+$/i)?.[0] ?? ""}`);
    if (!existsSync(out)) {
      const { data, error } = await supabase.storage.from("media").download(m.storage_path);
      if (error) { console.warn("skip", m.storage_path, error.message); continue; }
      writeFileSync(out, Buffer.from(await data.arrayBuffer()));
    }
    rows.push({ ...row, file: `${site}/${base}.video-NOT-STRIPPED`, metadata_stripped: "NO" });
    continue;
  }

  const out = join(dir, `${base}.jpg`);
  if (!existsSync(out)) {
    const { data, error } = await supabase.storage.from("media").download(m.storage_path);
    if (error) { console.warn("skip", m.storage_path, error.message); continue; }
    let buf = Buffer.from(await data.arrayBuffer());
    if (isHeic(m)) buf = Buffer.from(await heicConvert({ buffer: buf, format: "JPEG", quality: 0.92 }));
    // rotate() bakes in EXIF orientation; sharp drops all metadata unless
    // withMetadata() is called, which is exactly what we want here.
    await sharp(buf).rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 88, mozjpeg: true }).toFile(out);
  }
  const meta = await sharp(out).metadata();
  const clean = !meta.exif && !meta.xmp && !meta.iptc;
  if (!clean) throw new Error(`Metadata survived in ${out}; refusing to continue.`);
  rows.push({
    ...row, file: `${site}/${base}.jpg`, width: meta.width, height: meta.height,
    orientation: meta.width > meta.height ? "landscape" : meta.width < meta.height ? "portrait" : "square",
    metadata_stripped: "yes",
  });
}

const cols = Object.keys(rows[0] ?? { file: "" });
const esc = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
writeFileSync(join(RAW, "asset-register.csv"), [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n") + "\n");

const sites = [...new Set(rows.map((r) => r.site))];
console.log(`\n${rows.length} files -> ${RAW}`);
for (const s of sites) console.log(`  ${s}: ${rows.filter((r) => r.site === s).length}`);
console.log(`\nNext: node scripts/contact-sheet.mjs clients/${client}/raw/<site> clients/${client}/raw/<site>.sheet.png`);
await supabase.auth.signOut();
