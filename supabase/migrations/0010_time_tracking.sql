-- Boss & Friends OS — Migration 0010: time tracking (Phase 3, MVP slice)
--
-- ARCHITECTURE.md's original Phase 3 design is a three-table event log
-- (time_events append-only + time_entries derived shifts + time_adjustments)
-- with offline queue and geofence support — "the hard one." This ships the
-- real, usable core of it — clock in, clock out, admin approval, one open
-- shift at a time — as a single table. No offline queue and no geofence:
-- those are genuine infra work (a service worker + background sync queue,
-- and location capture + verification), not schema, and are cut from this
-- pass deliberately rather than half-built. Revisit as its own pass if
-- crews are actually losing connectivity on site.
--
-- One row per shift. status: 'open' (clocked in, not out yet) -> 'pending'
-- (clocked out, awaiting admin review) -> 'approved' | 'rejected'.

create table public.time_entries (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  profile_id    uuid not null,
  project_id    uuid,
  clock_in      timestamptz not null default now(),
  clock_out     timestamptz,
  status        text not null default 'open' check (status in ('open', 'pending', 'approved', 'rejected')),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint time_entries_profile_id_company_id_fkey
    foreign key (profile_id, company_id) references public.profiles (id, company_id) on delete cascade,
  constraint time_entries_project_id_company_id_fkey
    foreign key (project_id, company_id) references public.projects (id, company_id) on delete set null,
  constraint time_entries_clock_out_after_clock_in check (clock_out is null or clock_out > clock_in)
);

-- Deliberately no plain single-column FK on profile_id/project_id — only
-- the composite ones above. A table can only have one FK relationship
-- between the same two tables that PostgREST can auto-resolve; declaring
-- both a plain and a composite FK to the same target (the mistake 0006 had
-- to clean up on tasks/invoices/project_assignments) makes every
-- `profile:profiles(...)` / `project:projects(...)` embed in a select()
-- ambiguous and error at query time.

-- One open shift per person at a time — a second clock-in attempt while
-- one is already running is a bug or a double-tap, not two real shifts.
create unique index idx_time_entries_one_open_per_profile
  on public.time_entries(profile_id) where (status = 'open');

create index idx_time_entries_company_id on public.time_entries(company_id);
create index idx_time_entries_profile_id on public.time_entries(profile_id);
create index idx_time_entries_project_id on public.time_entries(project_id);

create trigger trg_time_entries_updated_at
  before update on public.time_entries
  for each row execute function public.set_updated_at();

-- Same shape as prevent_task_field_escalation (0003) / prevent_role_escalation
-- (0001): the update policy below is row-level, so without this an employee
-- could use their own "clock out" update to also rewrite clock_in, jump to
-- another project, or self-approve. An employee may only ever set
-- clock_out/notes on their own still-open row; status is always derived
-- here, never accepted from the client. Admins/service_role bypass entirely
-- — corrections and approve/reject go through actions/time.ts as an admin.
create or replace function public.prevent_time_entry_field_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select public.is_admin()) or auth.role() = 'service_role' then
    return new;
  end if;

  if new.company_id is distinct from old.company_id
     or new.profile_id is distinct from old.profile_id
     or new.project_id is distinct from old.project_id
     or new.clock_in is distinct from old.clock_in then
    raise exception 'only an admin can change those fields';
  end if;

  if old.status <> 'open' then
    raise exception 'this time entry is no longer open';
  end if;

  new.status := case when new.clock_out is not null then 'pending' else 'open' end;

  return new;
end;
$$;

create trigger trg_prevent_time_entry_field_escalation
  before update on public.time_entries
  for each row execute function public.prevent_time_entry_field_escalation();

alter table public.time_entries enable row level security;
revoke all on public.time_entries from anon;
grant select, insert, update on public.time_entries to authenticated;

create policy time_entries_select_admin on public.time_entries
  for select using (company_id = (select public.company_id()) and (select public.is_admin()));

create policy time_entries_select_own on public.time_entries
  for select using (profile_id = auth.uid() and (select public.is_active()));

create policy time_entries_insert_self on public.time_entries
  for insert with check (company_id = (select public.company_id()) and profile_id = auth.uid());

create policy time_entries_insert_admin on public.time_entries
  for insert with check (company_id = (select public.company_id()) and (select public.is_admin()));

create policy time_entries_update_self on public.time_entries
  for update using (profile_id = auth.uid() and status = 'open')
  with check (profile_id = auth.uid());

create policy time_entries_update_admin on public.time_entries
  for update using (company_id = (select public.company_id()) and (select public.is_admin()))
  with check (company_id = (select public.company_id()) and (select public.is_admin()));
