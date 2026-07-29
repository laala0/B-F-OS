-- Boss & Friends OS — Migration 0005: reports support
--
-- Scope: the Daily/Weekly reports need "what got completed on day X," and
-- tasks.updated_at can't answer that reliably — any edit bumps it, not
-- just a status change to done, so a task title fix a week later would
-- misreport as completed then. This adds a dedicated completed_at that's
-- only ever touched by a status transition, never settable directly.

alter table public.tasks add column completed_at timestamptz;

create or replace function public.set_task_completed_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'done' and old.status is distinct from 'done' then
    new.completed_at := now();
  elsif new.status is distinct from 'done' and old.status = 'done' then
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create trigger trg_set_task_completed_at
  before update on public.tasks
  for each row execute function public.set_task_completed_at();
