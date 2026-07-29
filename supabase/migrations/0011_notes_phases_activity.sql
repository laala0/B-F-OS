-- Boss & Friends OS — Migration 0011: daily notes, project phases, activity feed
--
-- Three independent Phase 2/4/6 features that happen to ship together: none
-- depends on the others, they're just the remaining non-media/non-time
-- pieces of "every screen actually works."

-- ---------------------------------------------------------------------------
-- daily_notes (rest of Phase 4) — "weather, crew count, and delays" per job.
-- Deliberately no unique-per-day constraint: real crews add a note whenever
-- something's worth logging, not exactly once at end of day. "One entry per
-- job per day" in the original placeholder copy describes the common case,
-- not a hard rule this enforces.
-- ---------------------------------------------------------------------------

create table public.daily_notes (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  project_id    uuid not null,
  author_id     uuid not null references public.profiles(id) on delete cascade,
  log_date      date not null default current_date,
  weather       text,
  crew_count    integer check (crew_count is null or crew_count >= 0),
  note          text not null,
  created_at    timestamptz not null default now(),
  constraint daily_notes_project_id_company_id_fkey
    foreign key (project_id, company_id) references public.projects (id, company_id) on delete cascade
);

create index idx_daily_notes_company_id on public.daily_notes(company_id);
create index idx_daily_notes_project_id on public.daily_notes(project_id);

alter table public.daily_notes enable row level security;
revoke all on public.daily_notes from anon;
grant select, insert, delete on public.daily_notes to authenticated;

create policy daily_notes_select_admin on public.daily_notes
  for select using (company_id = (select public.company_id()) and (select public.is_admin()));

create policy daily_notes_select_assigned on public.daily_notes
  for select using (
    (select public.is_active())
    and exists (
      select 1 from public.project_assignments pa
      where pa.project_id = daily_notes.project_id and pa.profile_id = auth.uid()
    )
  );

create policy daily_notes_insert_admin on public.daily_notes
  for insert with check (company_id = (select public.company_id()) and (select public.is_admin()) and author_id = auth.uid());

create policy daily_notes_insert_assigned on public.daily_notes
  for insert with check (
    company_id = (select public.company_id())
    and author_id = auth.uid()
    and (select public.is_active())
    and exists (
      select 1 from public.project_assignments pa
      where pa.project_id = daily_notes.project_id and pa.profile_id = auth.uid()
    )
  );

create policy daily_notes_delete_admin on public.daily_notes
  for delete using (company_id = (select public.company_id()) and (select public.is_admin()));

create policy daily_notes_delete_own on public.daily_notes
  for delete using (author_id = auth.uid());

-- ---------------------------------------------------------------------------
-- project_phases (rest of Phase 2) — footings, base prep, rebar, anchors,
-- pour, waterproofing, planned vs. actual. Admin-managed, same visibility
-- split as projects/tasks: admin sees/manages every phase in their company,
-- an assigned employee can see (not edit) phases on their own jobs.
-- ---------------------------------------------------------------------------

create table public.project_phases (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  project_id      uuid not null,
  name            text not null,
  status          text not null default 'not_started' check (status in ('not_started', 'in_progress', 'complete')),
  planned_start   date,
  planned_end     date,
  actual_start    date,
  actual_end      date,
  position        integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint project_phases_project_id_company_id_fkey
    foreign key (project_id, company_id) references public.projects (id, company_id) on delete cascade
);

create index idx_project_phases_company_id on public.project_phases(company_id);
create index idx_project_phases_project_id on public.project_phases(project_id);

create trigger trg_project_phases_updated_at
  before update on public.project_phases
  for each row execute function public.set_updated_at();

alter table public.project_phases enable row level security;
revoke all on public.project_phases from anon;
grant select, insert, update, delete on public.project_phases to authenticated;

create policy project_phases_select_admin on public.project_phases
  for select using (company_id = (select public.company_id()) and (select public.is_admin()));

create policy project_phases_select_assigned on public.project_phases
  for select using (
    (select public.is_active())
    and exists (
      select 1 from public.project_assignments pa
      where pa.project_id = project_phases.project_id and pa.profile_id = auth.uid()
    )
  );

create policy project_phases_insert_admin on public.project_phases
  for insert with check (company_id = (select public.company_id()) and (select public.is_admin()));

create policy project_phases_update_admin on public.project_phases
  for update using (company_id = (select public.company_id()) and (select public.is_admin()))
  with check (company_id = (select public.company_id()) and (select public.is_admin()));

create policy project_phases_delete_admin on public.project_phases
  for delete using (company_id = (select public.company_id()) and (select public.is_admin()));

-- ---------------------------------------------------------------------------
-- activity_events (Phase 6) — "a live log of everything that happened on
-- this job." Two write paths, both bypassing the table's own RLS/grants
-- entirely (no insert policy exists — see the revoke below):
--
--   1. record_activity() — a security-definer RPC actions/*.ts calls after
--      a mutation succeeds (clock in/out, note added, crew invited, media
--      uploaded — anything that isn't a plain status transition).
--   2. Per-table AFTER triggers on tasks/invoices/projects that log
--      creation and status changes automatically, so those don't need an
--      app-code call site at all.
--
-- Routing every write through security-definer code (instead of a normal
-- RLS insert policy) means activity_events never needs its own notion of
-- "who's allowed to log what" — it inherits whatever the actual mutation
-- already checked.
--
-- actor_id is a plain FK (not composite): it's never client-supplied —
-- always auth.uid() from inside record_activity()/the triggers — so unlike
-- assigned_to/project_id elsewhere, there's no cross-tenant value for a
-- composite FK to guard against, and a plain on-delete-set-null avoids the
-- footgun a composite one would have (setting a NOT NULL company_id to
-- null along with it when a profile is hard-deleted).
--
-- project_id IS effectively client-influenced (callers pick which project
-- to attach an event to), so it stays a composite FK — if someone passes a
-- project_id from a different company, the FK itself rejects the insert
-- outright, the same guard 0006 relies on elsewhere.
-- ---------------------------------------------------------------------------

create table public.activity_events (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  project_id    uuid,
  actor_id      uuid references public.profiles(id) on delete set null,
  event_type    text not null,
  description   text not null,
  created_at    timestamptz not null default now(),
  constraint activity_events_project_id_company_id_fkey
    foreign key (project_id, company_id) references public.projects (id, company_id) on delete cascade
);

create index idx_activity_events_company_id on public.activity_events(company_id);
create index idx_activity_events_project_id on public.activity_events(project_id);
create index idx_activity_events_created_at on public.activity_events(created_at desc);

alter table public.activity_events enable row level security;
revoke all on public.activity_events from anon;
grant select on public.activity_events to authenticated;

create policy activity_events_select_admin on public.activity_events
  for select using (company_id = (select public.company_id()) and (select public.is_admin()));

create policy activity_events_select_assigned on public.activity_events
  for select using (
    (select public.is_active())
    and project_id is not null
    and exists (
      select 1 from public.project_assignments pa
      where pa.project_id = activity_events.project_id and pa.profile_id = auth.uid()
    )
  );

create or replace function public.record_activity(
  p_project_id  uuid,
  p_event_type  text,
  p_description text
)
returns public.activity_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.activity_events;
begin
  insert into public.activity_events (company_id, project_id, actor_id, event_type, description)
  values ((select public.company_id()), p_project_id, auth.uid(), p_event_type, p_description)
  returning * into v_row;
  return v_row;
end;
$$;

revoke all on function public.record_activity from public;
grant execute on function public.record_activity to authenticated;

create or replace function public.log_task_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.activity_events (company_id, project_id, actor_id, event_type, description)
    values (new.company_id, new.project_id, auth.uid(), 'task_created', new.title);
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.activity_events (company_id, project_id, actor_id, event_type, description)
    values (new.company_id, new.project_id, auth.uid(), 'task_status_changed', new.title || ' → ' || new.status);
  end if;
  return new;
end;
$$;

create trigger trg_log_task_activity
  after insert or update on public.tasks
  for each row execute function public.log_task_activity();

create or replace function public.log_invoice_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.activity_events (company_id, project_id, actor_id, event_type, description)
    values (new.company_id, new.project_id, auth.uid(), 'invoice_created', 'Invoice ' || new.invoice_number);
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.activity_events (company_id, project_id, actor_id, event_type, description)
    values (new.company_id, new.project_id, auth.uid(), 'invoice_status_changed', 'Invoice ' || new.invoice_number || ' → ' || new.status);
  end if;
  return new;
end;
$$;

create trigger trg_log_invoice_activity
  after insert or update on public.invoices
  for each row execute function public.log_invoice_activity();

create or replace function public.log_project_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.activity_events (company_id, project_id, actor_id, event_type, description)
    values (new.company_id, new.id, auth.uid(), 'project_created', new.name);
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.activity_events (company_id, project_id, actor_id, event_type, description)
    values (new.company_id, new.id, auth.uid(), 'project_status_changed', new.name || ' → ' || new.status);
  end if;
  return new;
end;
$$;

create trigger trg_log_project_activity
  after insert or update on public.projects
  for each row execute function public.log_project_activity();
