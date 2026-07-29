-- Boss & Friends OS — Migration 0004: invoice tracker
--
-- Scope: what this pass was asked to deliver — a lightweight tracker (one
-- amount, one status, sent/paid dates) so Reports and the dashboard have
-- something to total up. This is NOT Phase 7's full invoicing system —
-- no line items, no GST breakout, no holdback releases, no change orders.
-- Those stay separate tables layered on later without touching this one.

create type public.invoice_status as enum ('draft', 'sent', 'paid');

create table public.invoices (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  project_id      uuid not null references public.projects(id) on delete cascade,
  invoice_number  text not null,
  amount_cents    bigint not null check (amount_cents >= 0),
  status          public.invoice_status not null default 'draft',
  issued_date     date not null default current_date,
  due_date        date,
  paid_date       date,
  notes           text,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

-- One invoice number per company. Partial (deleted_at is null) so a
-- deleted invoice's number can be reused, same convention as projects.code.
create unique index idx_invoices_company_number
  on public.invoices(company_id, invoice_number)
  where deleted_at is null;

create index idx_invoices_company_id on public.invoices(company_id);
create index idx_invoices_project_id on public.invoices(project_id);

create trigger trg_invoices_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security — financial data, admin-only. Same posture as wage
-- rates in employment_records: employees get no visibility at all, not
-- even into invoices for jobs they're assigned to.
-- ---------------------------------------------------------------------------

alter table public.invoices enable row level security;
revoke all on public.invoices from anon;
grant select, insert, update on public.invoices to authenticated;

create policy invoices_select_admin on public.invoices
  for select using (company_id = public.company_id() and public.is_admin());

create policy invoices_insert on public.invoices
  for insert with check (company_id = public.company_id() and public.is_admin());

create policy invoices_update_admin on public.invoices
  for update using (company_id = public.company_id() and public.is_admin())
  with check (company_id = public.company_id() and public.is_admin());

-- No delete policy: "delete" in the app is a soft delete (deleted_at) via
-- the update policy above, same convention as profiles/projects/tasks.
