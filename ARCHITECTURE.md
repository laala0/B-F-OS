# Boss & Friends OS — Architecture

Stack: Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Supabase (Postgres + Auth + Storage) · Vercel.

## 1. Folder Structure

```
boss-and-friends-os/
├── app/
│   ├── (auth)/                      # unauthenticated
│   │   ├── login/
│   │   ├── accept-invite/[token]/
│   │   └── reset-password/
│   │       └── update/
│   │
│   ├── (admin)/                     # role gate: admin — desktop-dense
│   │   ├── layout.tsx               # sidebar shell + role guard
│   │   ├── dashboard/
│   │   ├── projects/
│   │   │   ├── new/
│   │   │   └── [projectId]/
│   │   │       ├── page.tsx         # overview + timeline
│   │   │       ├── crew/
│   │   │       ├── tasks/
│   │   │       ├── media/
│   │   │       ├── documents/
│   │   │       ├── activity/
│   │   │       └── invoices/
│   │   ├── timesheets/              # approval queue — the money screen
│   │   ├── crew/[profileId]/
│   │   ├── invoices/[invoiceId]/
│   │   ├── reports/
│   │   └── settings/
│   │
│   ├── (field)/                     # role gate: employee (+ admin) — thumb-first
│   │   ├── layout.tsx               # bottom tab bar
│   │   ├── today/                   # DEFAULT LANDING: clock + today's tasks
│   │   ├── tasks/[taskId]/
│   │   ├── job/[projectId]/         # read-only slice of a project
│   │   ├── capture/                 # camera → upload
│   │   └── notes/
│   │
│   └── auth/callback/               # Supabase auth code exchange (password reset)
│
├── actions/                         # Server Actions — one file per domain
│   └── auth.ts (Phase 0/1 done; projects.ts/tasks.ts/time.ts/media.ts/
│                 invoices.ts/notes.ts/crew.ts land with their phases)
│
├── components/
│   ├── ui/                          # shadcn primitives — never hand-edit
│   ├── field/                       # FieldTabBar, (ClockButton/PhotoCapture etc. later)
│   ├── projects/                    # ProjectNav
│   ├── shared/                      # AdminSidebar, UserMenu, RoleBadge, ComingSoon
│   └── projects/ timesheets/ invoices/ media/  (created as their phases land)
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # browser
│   │   ├── server.ts                # RSC + actions (cookie-based, RLS applies)
│   │   ├── middleware.ts            # session refresh
│   │   └── admin.ts                 # service role — `import 'server-only'`
│   ├── auth/
│   │   ├── session.ts               # getCurrentUser()
│   │   └── guards.ts                # requireUser(), requireRole()
│   ├── validation/                  # zod schemas, shared client + server
│   ├── domain/  storage/  offline/  # populated as their phases land
│
├── types/
│   ├── database.ts                  # hand-authored now; regenerate via
│   │                                #   `supabase gen types typescript --linked`
│   │                                #   once this project is linked to Supabase
│   └── domain.ts                    # ActionResult<T>
│
├── supabase/
│   └── migrations/                  # every schema change, in order, committed
│
├── scripts/
│   └── create-first-admin.mjs       # one-time: create company + first admin
│
└── middleware.ts
```

Two route groups, two products sharing one database. `(admin)` is a dense desktop console. `(field)` is one-handed, gloves-on, sunlight-readable, and assumes bad LTE. Each gets its own layout, its own role guard, its own performance budget.

## 2. Database Schema

Rules applied throughout: every business table carries `company_id` (the tenancy boundary); all money is `bigint` cents (added once invoicing tables land); records with legal weight are soft-deleted (`deleted_at`).

**Shipped in `supabase/migrations/0001_init_auth.sql`:**

- `companies` — id, name, legal_name, gst_number, address, logo_url, timezone, default_holdback_pct, timestamps.
- `profiles` — one row per login, id = `auth.users.id`. company_id, role, name, phone, email, status, timestamps, deleted_at. Wage rates deliberately do **not** live here — see `employment_records` below.
- `invites` — company_id, email, role, token (uuid, unique), invited_by, expires_at, accepted_at, revoked_at.
- Helper functions `company_id()`, `user_role()`, `is_admin()` — used by RLS policies (see Implementation Notes for why these replaced the JWT-hook approach).
- `bootstrap_company()` / `accept_invite()` — atomic, service-role-only RPCs for the two ways a profile gets created.
- Full RLS on all three tables; a trigger blocking self-escalation of `role`/`company_id`.

**Shipped in `supabase/migrations/0002_projects.sql`:**

- `projects` — company_id, code (unique per company while not deleted), name, client_name, gc_company, site_address, status, contract_value_cents, start_date, target_end_date, actual_end_date, created_by, timestamps, deleted_at.
- `project_assignments` — company_id, project_id, profile_id, assigned_by; unique per (project, profile). Just create/delete, no phases/timeline yet — see below.
- RLS: admins see/manage every project in their company; employees only see projects they're assigned to. No delete policy — "delete" in the app is `deleted_at`, same convention as `profiles`.

**Shipped in `supabase/migrations/0003_tasks.sql`:**

- `tasks` — company_id, project_id, title, description, priority (`low`/`medium`/`high`), status (`todo`/`in_progress`/`done`), due_date, assigned_to, created_by, timestamps, deleted_at.
- `task_checklist_items` — company_id, task_id, label, is_done, position.
- RLS: same admin-vs-assigned split as projects — admins see/manage every task in their company; employees only see (and can only touch) tasks assigned to them. Two triggers (`prevent_task_field_escalation`, `prevent_checklist_field_escalation`), same shape as the profiles self-escalation guard, stop an employee from using their own UPDATE policy to edit title/priority/assignee/etc. — RLS is row-level, not column-level, so the policy alone would have let that through.
- Admin task CRUD (`/projects/[projectId]/tasks`) uses a Sheet (slide-over), not separate `/new` and `/[taskId]` routes — the architecture tree didn't call for the latter and a sub-resource this size didn't need full-page navigation.
- `task_comments`, `daily_notes` (rest of Phase 4) — not part of this pass.

**Shipped in `supabase/migrations/0004_invoices.sql`:**

- `invoices` — company_id, project_id, invoice_number (unique per company while not deleted), amount_cents, status (`draft`/`sent`/`paid`), issued_date, due_date, paid_date, notes, created_by, timestamps, deleted_at.
- This is a lightweight tracker, not Phase 7's full invoicing system — no line items, no GST breakout, no holdback releases, no change orders. Those are separate tables layered on later without touching this one.
- RLS: admin-only, no employee visibility at all — same posture as wage rates in `employment_records`. No delete policy, same soft-delete convention as everything else.
- `overdue` is derived (`status = 'sent'` and `due_date` in the past), never stored, same reasoning as tasks below.

**Shipped in `supabase/migrations/0005_reports.sql`:**

- Added `tasks.completed_at`, set/cleared only by a trigger on the `status` transition to/from `done` — `updated_at` can't stand in for it, since any edit bumps that, not just a completion.
- Reports (`/reports`) and dashboard widgets (`/dashboard`) are read-only aggregations over existing `tasks`/`invoices`/`projects` data — no new tables beyond `completed_at`.
- "Today"/"this week" for the report date-nav is computed from the company's `timezone` column (`lib/domain/reports.ts`), not the server's or UTC's — Vancouver is far enough behind UTC that a naive UTC "today" flips over while it's still mid-afternoon locally.
- "Currently overdue" is always a live snapshot (as of now), even when browsing a past day/week in the report — task status isn't historized, so a retroactive "overdue as of that date" would just be a guess dressed up as data.
- Labour cost, hours by employee, budget vs. actual, and quote-to-win rate (the rest of Phase 8) need time tracking (Phase 3) and full project financials (Phase 7) that don't exist yet — not part of this pass.

**Shipped in `supabase/migrations/0006_security_hardening.sql`:**

Cross-cutting fixes from a full-project audit, not tied to a feature phase — see that migration's inline comments for the full reasoning on each:

- `company_id()`/`user_role()`/`is_admin()` now return NULL/false for a profile that isn't `status = 'active'` — since nearly every RLS policy is built on them, a suspended or soft-deleted profile loses access everywhere in one change. New `is_active()` covers the five policies that check `assigned_to = auth.uid()` directly and never called those helpers.
- `prevent_role_escalation` (0001) now also blocks self-writes to `status`, `deleted_at`, and `email`, not just `role`/`company_id` — `profiles_update_self` is row-level, not column-level, so without this a profile could reactivate or undelete itself.
- Composite foreign keys — `(project_id, company_id)` on `tasks`/`invoices`, `(assigned_to, company_id)` on `tasks`, `(project_id, company_id)`/`(profile_id, company_id)` on `project_assignments`, backed by new `unique (id, company_id)` on `projects`/`profiles` — so a task/invoice/assignment can no longer reference another company's project or employee, even if application validation has a bug. `created_by`/`assigned_by` stay plain FKs; they're always server-set from the session, never client input.
- `prevent_task_field_escalation` (0003) now also blocks self-writes to `completed_at` — it's meant to be a pure side effect of a status transition (`trg_set_task_completed_at`, 0005), not a client-settable value.
- App-layer follow-ups made necessary by the above (not the primary enforcement — see this migration's own header comment): `getCurrentUser()` (`lib/auth/session.ts`) explicitly checks `status === "active"` as defense in depth; `login()` (`actions/auth.ts`) switches its post-auth status lookup to the admin client, since the regular client can no longer see a suspended profile's own row and would otherwise show the wrong error message.

**Later migrations (by phase):**

- `employment_records` (Phase 1) — hourly_rate_cents, overtime_rate_cents, employment_type, hired_on, certifications. Separate table so "employees can read profiles in their company" never means "employees can read each other's pay."
- `project_phases` (rest of Phase 2) — timeline/phases (footings, base prep, rebar, anchors, pour, waterproofing) weren't part of the create/edit/delete/assign/status pass and remain a `ComingSoon` placeholder on the project overview page.
- `time_events` (append-only) + `time_entries` (derived shifts) + `time_adjustments` (Phase 3) — event log records every clock tap as it happened and never changes; the shift row is a rebuildable summary. `client_event_id` gives offline clock-ins an idempotency key.
- `media`, `documents` (Phase 5).
- `invoice_line_items`, `payments`, `holdback_releases`, `change_orders` (rest of Phase 7) — the lightweight `invoices` table already shipped (0004) covers amount/status/dates; this is the rest — holdback modeled as a first-class thing, not folded into "unpaid," per the BC Builders Lien Act's ~10% holdback and lien-period release timing (confirm exact percentage/timing with your accountant).
- `activity_events`, `notifications`, `audit_log` (Phase 6/cross-cutting).

## 3. User Roles

Two roles: `admin` and `employee`.

| | admin | employee |
|---|---|---|
| Company settings, billing | ✅ | — |
| Manage roles / invite crew | ✅ | — |
| View wage rates | ✅ | — |
| Create/assign projects & tasks | ✅ | assigned only |
| Clock self in/out | ✅ | ✅ |
| Approve timesheets | ✅ | — |
| Upload photos/videos/notes | ✅ | assigned only |
| **See any dollar figure** | ✅ | — |

Admins can also reach `(field)` routes (e.g. to check in on a site themselves); employees can't reach `(admin)` routes. Only `admin` ever sees money — that one line governs which tables split and how the field UI is built.

## 4. API Structure

Server Actions are the primary API (`actions/*.ts`); Route Handlers exist only where an actual HTTP endpoint is required (uploads, cron, webhooks, the auth callback). Every action follows: authenticate → authorize (role + project access) → validate (zod) → mutate → write activity/audit → revalidate → return `ActionResult<T>`.

Media uploads never pass through a server action/route body — Vercel serverless functions reject bodies over ~4.5MB and a single site video can be hundreds of MB. The client requests a signed URL, uploads straight to Supabase Storage, then confirms. (Ships with Phase 5.)

## 5. Implementation Order

0. **Foundation** — repo, Supabase project, auth, RLS helpers, folder structure. **Done.**
1. **Company & Crew** — invites, employment records, crew list. *(Invite backend done; crew list UI still pending.)*
2. **Projects** — create/edit/delete/assign/status **done**; phases/timeline still pending. **← this pass**
3. **Time Tracking** — event log, offline queue, geofence, approval queue, BC overtime rules. The hard one.
4. **Tasks & Daily Notes**
5. **Media** — signed uploads, HEIC conversion, galleries.
6. **Activity Feed & Notifications**
7. **Invoicing** — progress claims, GST, holdback, payments.
8. **Reports**
9. **Hardening** — PWA, offline polish, backups, multi-tenant SaaS onboarding if that path is chosen.

Ship boundary: Phases 0–3 are the real MVP.

---

## Implementation Notes (deviations from the original approved design)

Changes made while building, disclosed here rather than silently:

1. **JWT claims → SQL helper functions.** The original plan stamped `company_id`/`role` into the JWT via a Supabase Custom Access Token Hook. That requires a manual step in the Supabase Dashboard (Authentication > Hooks) with no way to verify it from the CLI — easy for a non-developer to miss, and it would fail silently (RLS just returns no rows) rather than loudly. Implemented instead: `company_id()`/`user_role()`/`is_admin()` as `SECURITY DEFINER` SQL functions that look the values up from `profiles` directly, no dashboard step required. Trade-off: one extra indexed lookup per RLS check instead of a free JWT read. Revisit only if this shows up in slow-query logs — unlikely before dozens of concurrent users.
2. **Helper functions live in `public`, not `auth`.** Supabase restricts writing into the `auth` schema on hosted projects. `public.company_id()` etc. instead of `auth.company_id()`.
3. **Field's project view moved from `/projects/[projectId]` to `/job/[projectId]`.** The original folder plan had both `(admin)/projects/[projectId]` and `(field)/projects/[projectId]` — since route groups are stripped from the URL, both resolved to the identical path, which Next.js rejects outright. Renamed the field-facing one to `/job/[projectId]`.
4. **Roles collapsed from five (owner/admin/foreman/employee/client) to two (admin/employee).** Requested explicitly after the foundation pass. `owner` and `admin` merged into a single `admin` role — there's no longer a company-settings tier above it. The `foreman` "clock the whole crew in at the gate" behavior was removed along with the role, including its `/crew-clock` page and tab; if that workflow turns out to still be needed, it'll need a role (or a per-project permission) to hang off of. `client` was already unbuilt (no screens existed) and is dropped rather than left as a dead enum value. This touched the `user_role` enum, every RLS policy/helper function referencing `'owner'`, all route guards, and `scripts/create-first-admin.mjs` (renamed from `create-first-owner.mjs`).
5. **shadcn is configured for Base UI, not Radix — their component APIs differ in ways that surface as real TypeScript errors, not just style.** Discovered while building the Projects UI: `components/ui/button.tsx` wraps `@base-ui/react/button` (`components.json`'s `"style": "base-nova"`), and Base UI has no `asChild` prop anywhere. Where a shadcn/Radix tutorial says `<Button asChild><Link>...</Link></Button>`, this codebase needs either `buttonVariants({...})` applied as a className directly on the `<Link>` (used in `app/(admin)/projects/page.tsx`), or a `render={<Button>...</Button>}` prop on primitives that accept one, like `AlertDialogTrigger` (used in `components/projects/delete-project-dialog.tsx`). Also note: Base UI's `Select`'s `onValueChange` is `(value: string | null, eventDetails) => void` — one extra, nullable-first-argument compared to Radix's plain `(value: string) => void` — see `components/projects/project-status-select.tsx` for the pattern (`onChange(next: string | null)` with a null-guard, not a bare setter passed straight through).
