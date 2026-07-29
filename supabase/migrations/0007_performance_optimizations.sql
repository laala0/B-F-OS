-- Boss & Friends OS — Migration 0007: performance optimizations
--
-- Two fixes from a performance audit, both purely internal (no policy's
-- effective authorization logic changes — same rows visible/writable
-- before and after) so this is safe to run against a live database with
-- data in it.

-- ---------------------------------------------------------------------------
-- 1) RLS InitPlan optimization
--
-- Every policy below calls public.company_id() / public.is_admin() /
-- public.is_active() / auth.uid() directly in its USING/WITH CHECK
-- expression. Postgres's planner cannot prove a plain function call is the
-- same value for every row, so — even though these functions are STABLE —
-- it re-evaluates each one once per row scanned. On a table with a few
-- thousand rows, "list my company's tasks" was running company_id() and
-- is_admin() (each its own indexed lookup against profiles) thousands of
-- times instead of once.
--
-- Wrapping the same call in `(select ...)` gives the planner an explicit
-- sub-select it CAN hoist into an InitPlan: evaluated once per query,
-- cached, and reused for every row. Same result, same authorization
-- outcome — this changes nothing about who can see or write what, only how
-- many times the check runs. This is the fix Supabase's own Performance
-- Advisor prescribes for its "auth_rls_initplan" finding.
--
-- ALTER POLICY (not DROP + CREATE) so each policy keeps its name, its
-- table, and its command type — only the USING/WITH CHECK expressions
-- change.
-- ---------------------------------------------------------------------------

-- companies (0001)
alter policy companies_select on public.companies
  using (id = (select public.company_id()));

alter policy companies_update on public.companies
  using (id = (select public.company_id()) and (select public.is_admin()))
  with check (id = (select public.company_id()) and (select public.is_admin()));

-- profiles (0001)
alter policy profiles_select on public.profiles
  using (company_id = (select public.company_id()));

alter policy profiles_update_self on public.profiles
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

alter policy profiles_update_admin on public.profiles
  using (company_id = (select public.company_id()) and (select public.is_admin()))
  with check (company_id = (select public.company_id()) and (select public.is_admin()));

-- invites (0001)
alter policy invites_select on public.invites
  using (company_id = (select public.company_id()) and (select public.is_admin()));

alter policy invites_insert on public.invites
  with check (company_id = (select public.company_id()) and (select public.is_admin()));

alter policy invites_update on public.invites
  using (company_id = (select public.company_id()) and (select public.is_admin()))
  with check (company_id = (select public.company_id()) and (select public.is_admin()));

-- projects (0002, projects_select_assigned altered again in 0006)
alter policy projects_select_admin on public.projects
  using (company_id = (select public.company_id()) and (select public.is_admin()));

alter policy projects_select_assigned on public.projects
  using (
    (select public.is_active())
    and exists (
      select 1 from public.project_assignments pa
      where pa.project_id = projects.id and pa.profile_id = (select auth.uid())
    )
  );

alter policy projects_insert on public.projects
  with check (company_id = (select public.company_id()) and (select public.is_admin()));

alter policy projects_update on public.projects
  using (company_id = (select public.company_id()) and (select public.is_admin()))
  with check (company_id = (select public.company_id()) and (select public.is_admin()));

-- project_assignments (0002)
alter policy project_assignments_select on public.project_assignments
  using (company_id = (select public.company_id()));

alter policy project_assignments_insert on public.project_assignments
  with check (company_id = (select public.company_id()) and (select public.is_admin()));

alter policy project_assignments_delete on public.project_assignments
  using (company_id = (select public.company_id()) and (select public.is_admin()));

-- tasks (0003, tasks_select_assigned/tasks_update_assigned altered again in 0006)
alter policy tasks_select_admin on public.tasks
  using (company_id = (select public.company_id()) and (select public.is_admin()));

alter policy tasks_select_assigned on public.tasks
  using (assigned_to = (select auth.uid()) and (select public.is_active()));

alter policy tasks_insert on public.tasks
  with check (company_id = (select public.company_id()) and (select public.is_admin()));

alter policy tasks_update_admin on public.tasks
  using (company_id = (select public.company_id()) and (select public.is_admin()))
  with check (company_id = (select public.company_id()) and (select public.is_admin()));

alter policy tasks_update_assigned on public.tasks
  using (assigned_to = (select auth.uid()) and (select public.is_active()))
  with check (assigned_to = (select auth.uid()) and (select public.is_active()));

-- task_checklist_items (0003, *_assigned policies altered again in 0006)
alter policy checklist_select_admin on public.task_checklist_items
  using (company_id = (select public.company_id()) and (select public.is_admin()));

alter policy checklist_select_assigned on public.task_checklist_items
  using (
    (select public.is_active())
    and exists (
      select 1 from public.tasks t
      where t.id = task_checklist_items.task_id and t.assigned_to = (select auth.uid())
    )
  );

alter policy checklist_insert on public.task_checklist_items
  with check (company_id = (select public.company_id()) and (select public.is_admin()));

alter policy checklist_update_admin on public.task_checklist_items
  using (company_id = (select public.company_id()) and (select public.is_admin()))
  with check (company_id = (select public.company_id()) and (select public.is_admin()));

alter policy checklist_update_assigned on public.task_checklist_items
  using (
    (select public.is_active())
    and exists (
      select 1 from public.tasks t
      where t.id = task_checklist_items.task_id and t.assigned_to = (select auth.uid())
    )
  )
  with check (
    (select public.is_active())
    and exists (
      select 1 from public.tasks t
      where t.id = task_checklist_items.task_id and t.assigned_to = (select auth.uid())
    )
  );

alter policy checklist_delete on public.task_checklist_items
  using (company_id = (select public.company_id()) and (select public.is_admin()));

-- invoices (0004)
alter policy invoices_select_admin on public.invoices
  using (company_id = (select public.company_id()) and (select public.is_admin()));

alter policy invoices_insert on public.invoices
  with check (company_id = (select public.company_id()) and (select public.is_admin()));

alter policy invoices_update_admin on public.invoices
  using (company_id = (select public.company_id()) and (select public.is_admin()))
  with check (company_id = (select public.company_id()) and (select public.is_admin()));

-- ---------------------------------------------------------------------------
-- 2) Missing foreign key indexes
--
-- Postgres never creates an index on a foreign key column automatically
-- (unlike the primary key it references). Cross-referencing every
-- `references` clause in 0001-0006 against the indexes that already exist
-- turned up seven FK columns with no covering index at all — not even as
-- the leading column of a composite one. Each one leaves two costs on the
-- table: a full table scan every time the parent side is deleted/updated
-- (cascade/set-null has to find the matching child rows some way), and a
-- full table scan for any future query or join on that column.
--
-- Every other FK in the schema is already covered — either directly
-- (idx_tasks_project_id, idx_tasks_assigned_to, etc.) or as the leading
-- column of a composite index (company_id on projects/invoices via their
-- (company_id, ...) indexes) — so this is the complete list, not a partial
-- pass.
-- ---------------------------------------------------------------------------

create index idx_invites_invited_by on public.invites(invited_by);
create index idx_projects_created_by on public.projects(created_by);
create index idx_project_assignments_company_id on public.project_assignments(company_id);
create index idx_project_assignments_assigned_by on public.project_assignments(assigned_by);
create index idx_tasks_created_by on public.tasks(created_by);
create index idx_checklist_items_company_id on public.task_checklist_items(company_id);
create index idx_invoices_created_by on public.invoices(created_by);
