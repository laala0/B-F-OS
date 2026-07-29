# Boss & Friends OS

Job tracking, crew time, and invoicing for Boss & Friends Construction. See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full design.

Every screen in the app is now real and working end to end: self-service signup, crew invites, projects, tasks, time tracking/timesheets, daily notes, project phases, an activity feed, media/document uploads, invoices, and reports. The one deliberate scope cut is noted in ARCHITECTURE.md — time tracking ships without the offline queue and GPS geofencing from the original Phase 3 design; clock in/out and admin approval work, but a crew member needs connectivity to use it.

## 1. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project (any region close to Vancouver, e.g. `us-west-1`, is fine).
2. Once it's ready, go to **Settings > API**. You'll need three values from that page in the next step: **Project URL**, **anon public** key, and **service_role** key (click "Reveal" to see it).

## 2. Set your environment variables

Open `.env.local` in this folder (already created, currently full of placeholder text) and replace the four values with the real ones from Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=          # "Project URL" from Settings > API
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # "anon public" key
SUPABASE_SERVICE_ROLE_KEY=         # "service_role" key — keep this secret, never share it
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Never commit `.env.local` or paste the service_role key anywhere public** — it can read and write everything in the database, bypassing every security rule.

## 3. Run the database migrations

These create the tables and all the security rules. Easiest way, no command line needed — run them **in order**, each in its own query:

1. In the Supabase Dashboard, open **SQL Editor**.
2. Open each file in `supabase/migrations/` **in order** (`0001_init_auth.sql`, `0002_projects.sql`, ... through `0012_media_documents.sql`), copy the whole file, paste it into the SQL Editor, and click **Run** — one file, one query, wait for it to succeed, then the next.

(If you'd rather use the Supabase CLI: `npx supabase link --project-ref your-project-ref` then `npx supabase db push` — it runs every file in `supabase/migrations/` in order for you.)

**If you already ran 0001–0008 on a live project**, you only need to run `0009_employment_records.sql` through `0012_media_documents.sql` — those are the ones this pass added. Everything before that is unchanged.

## 4. Create your account

Go to `/signup` — enter a company name, your name, email, and password, and it creates your company and logs you in as the admin ("Boss"), all in one step. No terminal needed.

From there, invite your crew from **Crew → Invite** — it generates a one-time link (7-day expiry) you copy/text/email yourself; there's no automatic invite email (see the SMTP note below). Whoever clicks it sets their own password and lands in the app as either an admin ("Boss") or employee ("Friend"), whichever role you picked when creating the invite.

`scripts/create-first-admin.mjs` still works as a terminal alternative if you'd rather script it, but it's no longer the only way in.

## 5. Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with the email/password from step 4. As an admin you'll land on `/dashboard`.

## What's real right now

Everything. Signup, login, logout, forgot-password/reset-password, invite links, role-based routing, Projects, Tasks, Timesheets/clock in-out, Crew (list, profile, wage, invite, suspend), Invoices, Reports, Daily Notes, project Timeline/Phases, the Activity feed, Media, Documents, Capture, and the field Job view are all wired to real Supabase tables with Row Level Security enforcing tenancy — no `ComingSoon` placeholders remain.

The one deliberate scope cut: time tracking has no offline queue or GPS geofencing (the "hard" half of the original Phase 3 design) — a crew member needs a live connection to clock in/out. Revisit as its own pass if that turns out to matter in practice.

## Setting up outbound email (before this is used for real)

Password-reset emails already work, but they ride Supabase's default mailer, which is rate-limited (a handful per hour) and not meant for production traffic — fine for testing, not fine once real crew are using this. Before relying on "forgot password" for real: in the Supabase Dashboard, go to **Settings → Auth → SMTP Settings** and connect a real provider (Resend, Postmark, SES, etc. all work). No code changes needed here — the app already calls Supabase's standard reset-email API, so it starts using whatever SMTP is configured automatically.

Invite links intentionally do **not** try to send email automatically — the Crew → Invite dialog gives you a copyable link and a "mailto:" shortcut instead. That's a deliberate choice, not a gap: it works today with zero email infrastructure, and wiring it to auto-send once SMTP is configured is a small, optional follow-up if you want it.

## A couple of things worth knowing

- **`npm audit` will show ~12 "high severity" warnings.** They're all inside build-time tooling (ESLint's dependency tree, and `postcss`/`sharp` bundled inside Next.js itself) — not in this app's code, and not reachable at runtime. `npm audit fix --force` would downgrade Next.js to version 9, which would break everything — don't run it. This is normal for a fresh Next.js 15 project right now.
- **Next.js was pinned to 15.5.22.** `create-next-app` currently defaults to Next.js 16, but the approved architecture specifies 15, so it was downgraded deliberately (see ARCHITECTURE.md's Implementation Notes for the couple of other small deviations made along the way).
- **`types/database.ts` is hand-written** to match the migration exactly. Once you've linked this project to Supabase, regenerate it from the real schema instead of hand-editing it:
  ```bash
  npx supabase gen types typescript --linked > types/database.ts
  ```

## Deploying

This project lives in a subfolder (`boss-and-friends-os/`) alongside your other Boss & Friends files (lead tracker, quote workbooks). When you set this up on Vercel, set the project's **Root Directory** to `boss-and-friends-os` and add the same four environment variables from step 2 in Vercel's project settings.
