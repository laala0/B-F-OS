-- Boss & Friends OS — Migration 0008: data integrity
--
-- Five fixes from a database integrity audit. Every fix here is additive or
-- self-healing (backfills bad data before adding a constraint that would
-- reject it) so this is safe to run against a live database with data in
-- it, and nothing here changes any server action's signature or return
-- shape — the Next.js app keeps working unmodified against this schema.

-- ---------------------------------------------------------------------------
-- 1) Composite foreign key: task_checklist_items.task_id
--
-- Migration 0006 closed this exact gap for tasks.project_id,
-- tasks.assigned_to, invoices.project_id, and both project_assignments
-- columns — client-supplied ids that were only checked against the
-- CALLER's own company_id on the row being written, with nothing stopping
-- that id from pointing at a row belonging to a different company.
-- task_checklist_items.task_id has the identical shape and was missed:
-- checklist_insert's WITH CHECK only verifies
-- `company_id = company_id()`, so a direct PostgREST call (not just the
-- Next.js app, which happens to always pass its own newly-created/
-- RLS-verified task_id) could insert a checklist item with task_id
-- pointing at a different company's task while company_id says the
-- caller's own — same class of cross-tenant write 0006 was written to
-- close, just for one child table it didn't cover.
--
-- Same mechanism as 0006: a composite FK target needs a unique constraint
-- on exactly those columns, so this adds (id, company_id) on tasks first.
-- ---------------------------------------------------------------------------

alter table public.tasks add constraint tasks_id_company_id_key unique (id, company_id);

alter table public.task_checklist_items drop constraint task_checklist_items_task_id_fkey;
alter table public.task_checklist_items add constraint task_checklist_items_task_id_company_id_fkey
  foreign key (task_id, company_id) references public.tasks (id, company_id) on delete cascade;

-- ---------------------------------------------------------------------------
-- 2) Atomic checklist reconciliation
--
-- actions/tasks.ts's updateTask() reconciles a task's checklist as three
-- separate PostgREST calls — delete removed rows, insert new rows, update
-- changed rows — each its own HTTP request/transaction. If the insert
-- fails after the delete already committed, the checklist is left
-- half-gone with no way to roll back; there is no app-level compensation.
--
-- This wraps the same three operations in one PL/pgSQL function, which
-- Postgres/PostgREST already executes as a single transaction per call —
-- any failure partway through (a constraint violation, an RLS rejection)
-- rolls back everything the function did, leaving the checklist exactly as
-- it was before the call. Deliberately NOT `security definer`: it runs
-- with the CALLING user's own privileges, so every delete/insert inside it
-- is still gated by the exact same checklist_* RLS policies that apply
-- today — this changes atomicity, not who's allowed to do what. (Contrast
-- with bootstrap_company/accept_invite in 0001, which genuinely need to
-- bypass RLS for a pre-auth flow and are deliberately security definer,
-- service_role-only.)
--
-- The composite FK added above is what makes the insert branch safe even
-- if p_task_id belongs to another company: company_id is taken from
-- company_id() (never a parameter, so it can't be spoofed independently of
-- the caller's own session), and if that doesn't match p_task_id's actual
-- company, the FK constraint rejects the row outright.
--
-- p_items shape: a JSON array of {id: uuid|null, label: text, is_done:
-- boolean}, in the order they should be stored — same shape
-- actions/tasks.ts already builds from its checklist form state. id null
-- means "new row"; a non-null id not present in p_items means "deleted".
-- Position is derived from array order, same as the app code it replaces.
-- ---------------------------------------------------------------------------

create or replace function public.reconcile_task_checklist(
  p_task_id uuid,
  p_items jsonb
)
returns setof public.task_checklist_items
language plpgsql
as $$
declare
  v_kept_ids uuid[];
begin
  select coalesce(array_agg((elem->>'id')::uuid), array[]::uuid[])
    into v_kept_ids
    from jsonb_array_elements(p_items) elem
    where elem->>'id' is not null;

  delete from public.task_checklist_items
  where task_id = p_task_id
    and id <> all (v_kept_ids);

  return query
  insert into public.task_checklist_items (id, company_id, task_id, label, is_done, position)
  select
    coalesce((elem->>'id')::uuid, gen_random_uuid()),
    (select public.company_id()),
    p_task_id,
    elem->>'label',
    coalesce((elem->>'is_done')::boolean, false),
    ord - 1
  from jsonb_array_elements(p_items) with ordinality as t(elem, ord)
  on conflict (id) do update set
    label = excluded.label,
    is_done = excluded.is_done,
    position = excluded.position
  returning *;
end;
$$;

revoke all on function public.reconcile_task_checklist from public;
grant execute on function public.reconcile_task_checklist to authenticated;

-- ---------------------------------------------------------------------------
-- 3) paid_date race condition
--
-- Three different call sites computed invoices.paid_date three different
-- ways: createInvoice stamps it from issued_date, updateInvoice does a
-- SELECT-then-UPDATE that re-derives it from a value read moments earlier
-- (classic TOCTOU — a concurrent status change between the read and the
-- write gets silently overwritten with the stale value), and
-- updateInvoiceStatus stamps today's date directly. Nothing enforced that
-- paid_date and status could never disagree.
--
-- Same fix as tasks.completed_at (0005's set_task_completed_at): derive it
-- with a trigger, in the same transaction as the status write, so there's
-- no read-modify-write window for anything to race. Only fires on an
-- actual transition into/out of 'paid' — editing an already-paid invoice's
-- other fields (amount, notes, ...) leaves its paid_date untouched, same
-- as today.
--
-- The two backfill UPDATEs first repair any row a past race already left
-- inconsistent, so the CHECK constraint below (added as the real,
-- always-on guarantee — not just "the trigger happens to keep this true")
-- doesn't fail on existing data.
-- ---------------------------------------------------------------------------

update public.invoices
set paid_date = null
where status <> 'paid' and paid_date is not null;

update public.invoices
set paid_date = current_date
where status = 'paid' and paid_date is null;

create or replace function public.set_invoice_paid_date()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'paid' and old.status is distinct from 'paid' then
    new.paid_date := current_date;
  elsif new.status is distinct from 'paid' and old.status = 'paid' then
    new.paid_date := null;
  end if;
  return new;
end;
$$;

create trigger trg_set_invoice_paid_date
  before update on public.invoices
  for each row execute function public.set_invoice_paid_date();

alter table public.invoices add constraint invoices_paid_date_matches_status
  check ((status = 'paid') = (paid_date is not null));

-- ---------------------------------------------------------------------------
-- 4) Hide soft-deleted profiles
--
-- profiles_select (0001) has always been `company_id = company_id()` —
-- no deleted_at check, so RLS itself never hid a soft-deleted teammate
-- from the rest of the company; every query that wanted that had to
-- remember its own `.is("deleted_at", null)`. Today's app code always
-- does (checked every call site), but that makes it correct by
-- convention, not by construction — one missed filter in a future query
-- silently resurfaces an offboarded employee in an assignment dropdown or
-- crew roster.
--
-- Singled out from projects/tasks/invoices, whose soft-delete stays
-- RLS-invisible-only-by-convention on purpose (0002's own comment: "RLS
-- scopes by company/role, not lifecycle state") — those are a trash bin an
-- admin can restore from, and briefly still showing one is low-stakes.
-- deleted_at on a profile means "this login has zero standing," a
-- stronger, security-relevant state closer to a disabled account, and
-- company_id()/is_admin()/is_active() already treat it that way for the
-- deleted user's OWN access (0006). This makes it consistent for how
-- everyone ELSE sees that profile too.
-- ---------------------------------------------------------------------------

alter policy profiles_select on public.profiles
  using (company_id = (select public.company_id()) and deleted_at is null);

-- ---------------------------------------------------------------------------
-- 5) Improve constraints — monetary/percentage columns with no bounds
--
-- invoices.amount_cents already has `check (amount_cents >= 0)` (0004).
-- Two sibling columns of the exact same shape never got the equivalent:
-- projects.contract_value_cents is already required to be >= 0 by
-- projectSchema's zod validation (lib/validation/projects.ts) — the DB
-- just never backed that up. companies.default_holdback_pct is a
-- numeric(5,2) percentage with no bounds at all; nothing stopped it being
-- set to -50 or 500.
--
-- No current app code path can have produced an out-of-range value in
-- either column, but these backfills normalize any that got in some other
-- way (a direct SQL edit, a pre-validation row) so the constraint below
-- doesn't fail against data this migration can't see from here.
-- ---------------------------------------------------------------------------

update public.projects
set contract_value_cents = null
where contract_value_cents < 0;

update public.companies
set default_holdback_pct = greatest(0, least(100, default_holdback_pct));

alter table public.projects add constraint projects_contract_value_cents_check
  check (contract_value_cents is null or contract_value_cents >= 0);

alter table public.companies add constraint companies_default_holdback_pct_check
  check (default_holdback_pct >= 0 and default_holdback_pct <= 100);
