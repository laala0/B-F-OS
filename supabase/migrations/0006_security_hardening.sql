-- Boss & Friends OS — Migration 0006: security hardening
--
-- Closes four gaps found in a full-project audit. All four are enforced at
-- the database layer (RLS helper functions, triggers, foreign keys) so they
-- hold even if application code has a bug — consistent with this project's
-- stated principle that RLS is the real boundary and app code is a second
-- layer, not the first (see the header comment in 0001_init_auth.sql).

-- ---------------------------------------------------------------------------
-- 1) Suspended/deleted profiles lose ALL database access, not just what the
--    Next.js app layer happens to check.
--
--    company_id()/user_role()/is_admin() already gate almost every policy
--    in the schema (see their comment in 0001). Making them return
--    NULL/false for a non-active profile locks that profile out of every
--    policy built on them — most of the schema — with zero changes needed
--    at each individual policy.
--
--    The exception: five policies check `assigned_to = auth.uid()` /
--    `profile_id = auth.uid()` directly and never call these helpers —
--    auth.uid() is the raw JWT subject and knows nothing about profile
--    status. Those five (projects_select_assigned, tasks_select_assigned,
--    tasks_update_assigned, checklist_select_assigned,
--    checklist_update_assigned) get an explicit is_active() check added
--    below via ALTER POLICY, so the fix is complete, not partial.
-- ---------------------------------------------------------------------------

create or replace function public.company_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select company_id from public.profiles
  where id = auth.uid() and status = 'active' and deleted_at is null;
$$;

create or replace function public.user_role()
returns public.user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles
  where id = auth.uid() and status = 'active' and deleted_at is null;
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active' and deleted_at is null
  );
$$;

create or replace function public.is_active()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'active' and deleted_at is null
  );
$$;

revoke all on function public.is_active from public;
grant execute on function public.is_active to authenticated;

alter policy projects_select_assigned on public.projects
  using (
    public.is_active()
    and exists (
      select 1 from public.project_assignments pa
      where pa.project_id = projects.id and pa.profile_id = auth.uid()
    )
  );

alter policy tasks_select_assigned on public.tasks
  using (assigned_to = auth.uid() and public.is_active());

alter policy tasks_update_assigned on public.tasks
  using (assigned_to = auth.uid() and public.is_active())
  with check (assigned_to = auth.uid() and public.is_active());

alter policy checklist_select_assigned on public.task_checklist_items
  using (
    public.is_active()
    and exists (
      select 1 from public.tasks t
      where t.id = task_checklist_items.task_id and t.assigned_to = auth.uid()
    )
  );

alter policy checklist_update_assigned on public.task_checklist_items
  using (
    public.is_active()
    and exists (
      select 1 from public.tasks t
      where t.id = task_checklist_items.task_id and t.assigned_to = auth.uid()
    )
  )
  with check (
    public.is_active()
    and exists (
      select 1 from public.tasks t
      where t.id = task_checklist_items.task_id and t.assigned_to = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 2) profiles_update_self (0001) lets a profile UPDATE its own row — that
--    policy is row-level, not column-level, so on its own it would let
--    anyone reactivate/undelete themselves or change their own email.
--    prevent_role_escalation already blocks role/company_id; broaden it to
--    also cover status/deleted_at/email. Additive, not a rewrite of the
--    mechanism — same trigger, same trg_prevent_role_escalation binding.
--
--    profiles.email intentionally can't be self-edited even by an active
--    user: it's meant to mirror auth.users.email, and a real email change
--    should go through Supabase Auth's own updateUser({ email }) flow (not
--    built yet), not a direct row edit that could drift the two apart.
-- ---------------------------------------------------------------------------

create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_admin() or auth.role() = 'service_role') then
    if new.role is distinct from old.role
       or new.company_id is distinct from old.company_id
       or new.status is distinct from old.status
       or new.deleted_at is distinct from old.deleted_at
       or new.email is distinct from old.email then
      raise exception 'only an admin can change role, company_id, status, deleted_at, or email';
    end if;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3) Tenant isolation: project_id/assigned_to/profile_id are client-
--    supplied (a form field, or a hand-crafted call to the server action)
--    and were only ever checked against the CALLER's company via the
--    company_id stamped on the row being written — nothing stopped that
--    row from pointing at a project or profile belonging to a different
--    company. Composite FKs make that impossible at the database level,
--    independent of what the app validates.
--
--    created_by / assigned_by are deliberately left as plain FKs: every
--    call site sets them from the authenticated session's own id, never
--    from client input, so there's no cross-tenant path through them.
-- ---------------------------------------------------------------------------

-- A composite FK target needs a unique constraint on exactly those
-- columns. `id` is already the primary key (globally unique alone); this
-- adds a second, denormalized unique constraint so (id, company_id) can be
-- referenced together — the standard pattern for multi-tenant FKs.
alter table public.projects add constraint projects_id_company_id_key unique (id, company_id);
alter table public.profiles add constraint profiles_id_company_id_key unique (id, company_id);

alter table public.tasks drop constraint tasks_project_id_fkey;
alter table public.tasks add constraint tasks_project_id_company_id_fkey
  foreign key (project_id, company_id) references public.projects (id, company_id) on delete cascade;

alter table public.tasks drop constraint tasks_assigned_to_fkey;
alter table public.tasks add constraint tasks_assigned_to_company_id_fkey
  foreign key (assigned_to, company_id) references public.profiles (id, company_id) on delete set null;

alter table public.invoices drop constraint invoices_project_id_fkey;
alter table public.invoices add constraint invoices_project_id_company_id_fkey
  foreign key (project_id, company_id) references public.projects (id, company_id) on delete cascade;

alter table public.project_assignments drop constraint project_assignments_project_id_fkey;
alter table public.project_assignments add constraint project_assignments_project_id_company_id_fkey
  foreign key (project_id, company_id) references public.projects (id, company_id) on delete cascade;

alter table public.project_assignments drop constraint project_assignments_profile_id_fkey;
alter table public.project_assignments add constraint project_assignments_profile_id_company_id_fkey
  foreign key (profile_id, company_id) references public.profiles (id, company_id) on delete cascade;

-- ---------------------------------------------------------------------------
-- 4) tasks.completed_at (0005) is meant to be a pure side effect of a
--    status transition (trg_set_task_completed_at), never a value a client
--    sets directly. prevent_task_field_escalation (0003) didn't cover it,
--    so an employee's own UPDATE policy could smuggle an arbitrary
--    completed_at through a direct PostgREST call — bypassing the Next.js
--    app entirely — and skew every completion report.
--
--    Trigger firing order is alphabetical by trigger name:
--    trg_prevent_task_field_escalation < trg_set_task_completed_at, so
--    this check always evaluates what the CLIENT sent, before the
--    completion trigger computes its own value — the two don't conflict.
-- ---------------------------------------------------------------------------

create or replace function public.prevent_task_field_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_admin() or auth.role() = 'service_role') then
    if new.title is distinct from old.title
       or new.description is distinct from old.description
       or new.priority is distinct from old.priority
       or new.due_date is distinct from old.due_date
       or new.assigned_to is distinct from old.assigned_to
       or new.project_id is distinct from old.project_id
       or new.company_id is distinct from old.company_id
       or new.deleted_at is distinct from old.deleted_at
       or new.completed_at is distinct from old.completed_at then
      raise exception 'only an admin can change task details — employees can only update status';
    end if;
  end if;
  return new;
end;
$$;
