-- Boss & Friends OS — Migration 0002: projects + crew assignments
--
-- Scope: what Phase 2 was asked to deliver — admin create/edit/delete
-- (soft), status, and assigning employees to a project. Phases/timeline,
-- and the employee-facing read-only job view, are separate later work.

create type public.project_status as enum (
  'lead', 'quoted', 'won', 'active', 'on_hold', 'complete', 'archived'
);

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------

create table public.projects (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references public.companies(id) on delete cascade,
  code                text not null,
  name                text not null,
  client_name         text,
  gc_company          text,
  site_address        text,
  status              public.project_status not null default 'lead',
  contract_value_cents bigint,
  start_date          date,
  target_end_date     date,
  actual_end_date     date,
  created_by          uuid references public.profiles(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

-- One job code per company. Partial (deleted_at is null) so a deleted
-- project's old code can be reused without a rename.
create unique index idx_projects_company_code
  on public.projects(company_id, code)
  where deleted_at is null;

create index idx_projects_company_status on public.projects(company_id, status);

create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- project_assignments — which employees are on which job
-- ---------------------------------------------------------------------------

create table public.project_assignments (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  project_id    uuid not null references public.projects(id) on delete cascade,
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  assigned_by   uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  unique (project_id, profile_id)
);

create index idx_project_assignments_project_id on public.project_assignments(project_id);
create index idx_project_assignments_profile_id on public.project_assignments(profile_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.projects enable row level security;
alter table public.project_assignments enable row level security;

revoke all on public.projects from anon;
revoke all on public.project_assignments from anon;

grant select, insert, update on public.projects to authenticated;
grant select, insert, delete on public.project_assignments to authenticated;

-- projects: admins see/manage every project in their company. Employees
-- only ever see projects they're assigned to — visibility follows
-- assignment, not just company membership. (Application code additionally
-- filters deleted_at; RLS scopes by company/role, not lifecycle state.)
create policy projects_select_admin on public.projects
  for select using (company_id = public.company_id() and public.is_admin());

create policy projects_select_assigned on public.projects
  for select using (
    exists (
      select 1 from public.project_assignments pa
      where pa.project_id = projects.id and pa.profile_id = auth.uid()
    )
  );

create policy projects_insert on public.projects
  for insert with check (company_id = public.company_id() and public.is_admin());

create policy projects_update on public.projects
  for update using (company_id = public.company_id() and public.is_admin())
  with check (company_id = public.company_id() and public.is_admin());

-- No delete policy: "delete" in the app is a soft delete (sets deleted_at)
-- via the update policy above, same convention as profiles — a job's
-- history shouldn't disappear because of a click.

-- project_assignments: anyone in the company can see who's assigned to
-- what (useful once employees can see their own crew on a job); only
-- admins can add or remove an assignment.
create policy project_assignments_select on public.project_assignments
  for select using (company_id = public.company_id());

create policy project_assignments_insert on public.project_assignments
  for insert with check (company_id = public.company_id() and public.is_admin());

create policy project_assignments_delete on public.project_assignments
  for delete using (company_id = public.company_id() and public.is_admin());
