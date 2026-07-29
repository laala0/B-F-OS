-- Boss & Friends OS — Migration 0003: tasks + checklists
--
-- Scope: what this pass was asked to deliver — admin assigns tasks with a
-- priority and due date, plus a checklist; employees see their assigned
-- tasks and can update status / check items off. Task comments and daily
-- notes (also Phase 4 in ARCHITECTURE.md) are separate later work.

create type public.task_priority as enum ('low', 'medium', 'high');
create type public.task_status as enum ('todo', 'in_progress', 'done');

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------

create table public.tasks (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  project_id    uuid not null references public.projects(id) on delete cascade,
  title         text not null,
  description   text,
  priority      public.task_priority not null default 'medium',
  status        public.task_status not null default 'todo',
  due_date      date,
  assigned_to   uuid references public.profiles(id) on delete set null,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create index idx_tasks_company_id on public.tasks(company_id);
create index idx_tasks_project_id on public.tasks(project_id);
create index idx_tasks_assigned_to on public.tasks(assigned_to);

create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- task_checklist_items
-- ---------------------------------------------------------------------------

create table public.task_checklist_items (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  task_id       uuid not null references public.tasks(id) on delete cascade,
  label         text not null,
  is_done       boolean not null default false,
  position      integer not null default 0,
  created_at    timestamptz not null default now()
);

create index idx_checklist_items_task_id on public.task_checklist_items(task_id);

-- ---------------------------------------------------------------------------
-- Privilege-escalation guards, same shape as prevent_role_escalation on
-- profiles: an employee is allowed to UPDATE a row they're assigned to
-- (RLS below), but RLS is row-level, not column-level — without these
-- triggers that same policy would let them edit the task's title, priority,
-- assignee, etc., not just flip status/is_done.
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
       or new.deleted_at is distinct from old.deleted_at then
      raise exception 'only an admin can change task details — employees can only update status';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_prevent_task_field_escalation
  before update on public.tasks
  for each row execute function public.prevent_task_field_escalation();

create or replace function public.prevent_checklist_field_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_admin() or auth.role() = 'service_role') then
    if new.label is distinct from old.label
       or new.position is distinct from old.position
       or new.task_id is distinct from old.task_id
       or new.company_id is distinct from old.company_id then
      raise exception 'only an admin can edit a checklist item — employees can only toggle is_done';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_prevent_checklist_field_escalation
  before update on public.task_checklist_items
  for each row execute function public.prevent_checklist_field_escalation();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.tasks enable row level security;
alter table public.task_checklist_items enable row level security;

revoke all on public.tasks from anon;
revoke all on public.task_checklist_items from anon;

grant select, insert, update on public.tasks to authenticated;
grant select, insert, update, delete on public.task_checklist_items to authenticated;

-- tasks: admins see/manage every task in their company. Employees only see
-- (and can only update the status of) tasks assigned to them — same
-- "visibility follows assignment" rule as project_assignments.
create policy tasks_select_admin on public.tasks
  for select using (company_id = public.company_id() and public.is_admin());

create policy tasks_select_assigned on public.tasks
  for select using (assigned_to = auth.uid());

create policy tasks_insert on public.tasks
  for insert with check (company_id = public.company_id() and public.is_admin());

create policy tasks_update_admin on public.tasks
  for update using (company_id = public.company_id() and public.is_admin())
  with check (company_id = public.company_id() and public.is_admin());

create policy tasks_update_assigned on public.tasks
  for update using (assigned_to = auth.uid())
  with check (assigned_to = auth.uid());

-- No delete policy: "delete" in the app is a soft delete (sets deleted_at)
-- via the admin update policy above, same convention as profiles/projects.

-- task_checklist_items: same admin-vs-assigned split, one level down.
create policy checklist_select_admin on public.task_checklist_items
  for select using (company_id = public.company_id() and public.is_admin());

create policy checklist_select_assigned on public.task_checklist_items
  for select using (
    exists (
      select 1 from public.tasks t
      where t.id = task_checklist_items.task_id and t.assigned_to = auth.uid()
    )
  );

create policy checklist_insert on public.task_checklist_items
  for insert with check (company_id = public.company_id() and public.is_admin());

create policy checklist_update_admin on public.task_checklist_items
  for update using (company_id = public.company_id() and public.is_admin())
  with check (company_id = public.company_id() and public.is_admin());

create policy checklist_update_assigned on public.task_checklist_items
  for update using (
    exists (
      select 1 from public.tasks t
      where t.id = task_checklist_items.task_id and t.assigned_to = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.tasks t
      where t.id = task_checklist_items.task_id and t.assigned_to = auth.uid()
    )
  );

create policy checklist_delete on public.task_checklist_items
  for delete using (company_id = public.company_id() and public.is_admin());
