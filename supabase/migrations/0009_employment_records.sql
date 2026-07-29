-- Boss & Friends OS — Migration 0009: employment_records
--
-- Wage rates deliberately do not live on `profiles` (see 0001's comment) —
-- "employees can read profiles in their company" must never accidentally
-- mean "employees can read each other's pay." This is that separate table,
-- landing alongside the rest of Phase 1 (Crew) UI.
--
-- One row per profile. Admin-only end to end: no employee-visible select
-- policy at all, same posture as invoices (0004).

create table public.employment_records (
  id                    uuid primary key default gen_random_uuid(),
  company_id            uuid not null references public.companies(id) on delete cascade,
  profile_id            uuid not null unique references public.profiles(id) on delete cascade,
  hourly_rate_cents     integer,
  overtime_rate_cents   integer,
  employment_type       text not null default 'hourly' check (employment_type in ('hourly', 'salary', 'contract')),
  hired_on              date,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint employment_records_profile_id_company_id_fkey
    foreign key (profile_id, company_id) references public.profiles (id, company_id) on delete cascade,
  constraint employment_records_hourly_rate_cents_check check (hourly_rate_cents is null or hourly_rate_cents >= 0),
  constraint employment_records_overtime_rate_cents_check check (overtime_rate_cents is null or overtime_rate_cents >= 0)
);

create index idx_employment_records_company_id on public.employment_records(company_id);

create trigger trg_employment_records_updated_at
  before update on public.employment_records
  for each row execute function public.set_updated_at();

alter table public.employment_records enable row level security;
revoke all on public.employment_records from anon;
grant select, insert, update on public.employment_records to authenticated;

create policy employment_records_select on public.employment_records
  for select using (company_id = (select public.company_id()) and (select public.is_admin()));

create policy employment_records_insert on public.employment_records
  for insert with check (company_id = (select public.company_id()) and (select public.is_admin()));

create policy employment_records_update on public.employment_records
  for update using (company_id = (select public.company_id()) and (select public.is_admin()))
  with check (company_id = (select public.company_id()) and (select public.is_admin()));
