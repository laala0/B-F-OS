# Social content kit

Boss and Friends Construction (BAF) is client #1 of the social-media service. Everything here is built so client #2 is a new folder under `clients/`, not a rebuild.

It's separate from the B-F-OS app on purpose. It has its own `package.json`, so the app's dependencies and lockfile never change, and nothing in here ships with the app.

```
social/
  templates/        brand.css, freebie.css, slides.mjs: shared layouts (per-client colours come from brand.json)
  scripts/
    render.mjs      slides → PNG, freebies → PDF, brand images, calendar.csv/md, posting packs
    pull-media.mjs  B-F-OS photos → EXIF-stripped JPGs per site + asset register
    contact-sheet.mjs  one image of a whole folder, for the audit
    build-console.mjs  packs slides + captions + freebies into the client's launch console page
  clients/baf/
    brand.json      colours, keywords, freebie links, posting rules
    posts.mjs       THE calendar: slides + captions + times. Edit here, re-render
    freebies/*.html lead magnets (POUR, HIRE, SAFE)
    dm-scripts.md   comment-to-DM replies (manual now, automation later)
    calendar.csv/md generated from posts.mjs, don't edit by hand
    deliverables/   final PDFs + profile/banner images (committed, so they can be grabbed from GitHub)
    raw/            (gitignored) pulled photos + asset-register.csv
    out/            (gitignored) rendered PNG/PDF + posting packs, published to Drive
```

## Run it

```bash
cd social
npm install
npm run render                          # everything for baf
node scripts/render.mjs baf --only=posts   # just the slides (also: freebies | brand | calendar)
npm run console                         # rebuild the launch console bundle (out/console/)
```

The launch console (BAF's is https://claude.ai/artifact/GYvj8gM29yJRS5DxLgoWbo) is published from `out/console/index.html` with every file in `out/console.files.json` as supporting files. Approvals live in its shared `approvals` collection, one doc per post id: `{approved, scheduled, note}`.

Chromium comes from `/opt/pw-browsers` in Claude's cloud container. On a Mac, set `CHROME_PATH` to your Chrome binary.

## The weekly loop (human in the loop, free tools)

1. **Photos in.** The crew or owner uploads job photos into B-F-OS under **Projects → [site] → Media**. Each project is a site.
2. **Pull + audit.** `node scripts/pull-media.mjs` downloads the photos with GPS stripped, one folder per site, and writes `raw/asset-register.csv`. Then Claude looks at every photo and fills in:
   - stage (dig / footings / forms / rebar / pour / strip / backfill / finish)
   - trades visible
   - quality (1–5)
   - story role (before / during / after / detail / crew)
   - privacy flags (house number, licence plate, GC signage, faces)
   - platform fit
   - `slot`
   - `public_ok`
3. **Fill slots.** Copy the chosen photo for each slot to `raw/selected/<slot>.jpg`, for example `site-A-04-rebar.jpg`, then `npm run render`. The photo slides fill in automatically.
4. **Approve.** The client reviews the approval page. Nothing with `public_ok` ≠ yes gets posted.
5. **Schedule.** Upload `out/packs/week-N/*` to Drive, then batch-schedule:
   - Facebook + Instagram: **Meta Business Suite → Planner**
   - TikTok: **TikTok Studio** (web) → Upload → Schedule
   - LinkedIn: company Page → Start a post → 🕒 Schedule

   For each post: upload the PNGs in order, paste `caption-<platform>.txt`, set the time from `post-at.txt`. Straight after it goes live, post `first-comment.txt` yourself.
6. **Engage.** Twice a day, 15 minutes, using `clients/<c>/dm-scripts.md`.
7. **Review weekly.** Which posts got comments? Which keywords got used? Adjust next week's `posts.mjs`.

## Posting rules (every client)
- No phone, email or street address on posts. Engagement goes through comments, and freebies go out by DM.
- City-level location only. No house numbers, street signs or licence plates.
- GC or builder signage visible, or the builder named: hold the post until the builder says yes.
- Crew faces: get a verbal OK first. Homeowners: only with written OK.
- Videos keep their GPS metadata. Re-export them first (on iPhone: Share → Options → turn off Location) before they go anywhere public.

## New client checklist
1. `cp -r clients/baf clients/<slug>`, then edit `brand.json` (name, colours, region, keywords).
2. Rewrite `freebies/*.html` for their trade and audience, and `posts.mjs` for their calendar.
3. Photos: their app, or a Drive folder. `pull-media.mjs` is B-F-OS-specific; a Drive intake is the same steps (download → HEIC→JPG → strip → per-site folders).
4. Onboarding to-dos in their calendar: account access, business accounts, photo upload, first batch-schedule, daily engagement windows, weekly review.
