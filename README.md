# Boss & Friends OS

Job tracking, crew time, and invoicing for Boss & Friends Construction. See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full design.

Built so far: the app shell, login, invite-based account creation, and Projects (create/edit/delete/assign crew/status). Everything else (timesheets, photos, invoices, tasks) is scaffolded as a page that says "coming soon" — the folders and routes exist so nothing gets rebuilt later, but the actual features land in the phases described in ARCHITECTURE.md.

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
2. Open [`supabase/migrations/0001_init_auth.sql`](./supabase/migrations/0001_init_auth.sql), copy the whole file, paste it into the SQL Editor, and click **Run**.
3. Then do the same with [`supabase/migrations/0002_projects.sql`](./supabase/migrations/0002_projects.sql).

(If you'd rather use the Supabase CLI: `npx supabase link --project-ref your-project-ref` then `npx supabase db push` — it runs every file in `supabase/migrations/` in order for you.)

## 4. Create your account (the first admin)

There's no public sign-up page — everyone after you gets invited from inside the app once Crew management ships in Phase 1. For the very first account, run this from the project folder:

```bash
node --env-file=.env.local scripts/create-first-admin.mjs "Boss & Friends Construction" you@example.com "a-strong-password" YourFirstName YourLastName
```

Replace the email, password, and name. This creates both the company and your admin login in one step.

## 5. Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with the email/password from step 4. As an admin you'll land on `/dashboard`.

## What's real vs. what's a placeholder right now

**Real and working:** login, logout, invite links (`/accept-invite/[token]`), forgot-password / reset-password, role-based routing (admin → desktop admin console, employee → mobile field view), the security rules in the database (Row Level Security) that keep one company's data separate from another's, and **Projects** — admins can create, edit, soft-delete, assign employees to, and change the status of a project at `/projects`.

**Placeholder pages** (the route exists, the layout and navigation work, but the feature itself isn't built yet): Timesheets, Crew list, Invoices, Reports, Tasks, Media, Daily Notes, Clock in/out, and a project's Timeline/Phases/Media/Documents/Activity tabs. Each placeholder says which phase it ships in.

## A couple of things worth knowing

- **`npm audit` will show ~12 "high severity" warnings.** They're all inside build-time tooling (ESLint's dependency tree, and `postcss`/`sharp` bundled inside Next.js itself) — not in this app's code, and not reachable at runtime. `npm audit fix --force` would downgrade Next.js to version 9, which would break everything — don't run it. This is normal for a fresh Next.js 15 project right now.
- **Next.js was pinned to 15.5.22.** `create-next-app` currently defaults to Next.js 16, but the approved architecture specifies 15, so it was downgraded deliberately (see ARCHITECTURE.md's Implementation Notes for the couple of other small deviations made along the way).
- **`types/database.ts` is hand-written** to match the migration exactly. Once you've linked this project to Supabase, regenerate it from the real schema instead of hand-editing it:
  ```bash
  npx supabase gen types typescript --linked > types/database.ts
  ```

## Deploying

This project lives in a subfolder (`boss-and-friends-os/`) alongside your other Boss & Friends files (lead tracker, quote workbooks). When you set this up on Vercel, set the project's **Root Directory** to `boss-and-friends-os` and add the same four environment variables from step 2 in Vercel's project settings.
