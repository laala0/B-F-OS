-- Boss & Friends OS — Migration 0001: companies, profiles, invites
--
-- Scope: everything Phase 0/1 (auth + crew) needs. Projects, tasks, time
-- tracking, media, invoicing etc. are later migrations (see ARCHITECTURE.md).
--
-- Tenancy model: every business table carries company_id. Row Level Security
-- (RLS) is the actual enforcement boundary — app code is a second layer, not
-- the first.
--
-- JWT claims: we deliberately do NOT use a Custom Access Token Hook to stamp
-- company_id/role into the JWT. That needs a manual Supabase Dashboard step
-- (Authentication > Hooks) that's easy to forget and hard to verify from the
-- CLI. Instead, company_id()/is_admin() below look the values up from
-- `profiles` on each check. It's one extra indexed lookup per query instead
-- of a free JWT read — a fine trade for an MVP, and revisit only if RLS
-- checks show up in slow-query logs.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('admin', 'employee');
create type public.profile_status as enum ('invited', 'active', 'suspended');

-- ---------------------------------------------------------------------------
-- updated_at helper (reused by every future table with an updated_at column)
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- companies
-- ---------------------------------------------------------------------------

create table public.companies (
  id                      uuid primary key default gen_random_uuid(),
  name                    text not null,
  legal_name              text,
  gst_number              text,
  address                 text,
  logo_url                text,
  timezone                text not null default 'America/Vancouver',
  default_holdback_pct    numeric(5,2) not null default 10.00,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger trg_companies_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- profiles — one row per login, id matches auth.users.id
-- ---------------------------------------------------------------------------

create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  company_id    uuid not null references public.companies(id) on delete cascade,
  role          public.user_role not null default 'employee',
  first_name    text not null default '',
  last_name     text not null default '',
  phone         text,
  email         text not null,
  avatar_url    text,
  status        public.profile_status not null default 'invited',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create index idx_profiles_company_id on public.profiles(company_id);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Wage rates deliberately do NOT live on this table — see
-- employment_records in a later migration. "Employees can read profiles in
-- their company" must never accidentally mean "employees can read each
-- other's pay."

-- ---------------------------------------------------------------------------
-- invites
-- ---------------------------------------------------------------------------

create table public.invites (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  email         text not null,
  phone         text,
  role          public.user_role not null default 'employee',
  token         uuid not null default gen_random_uuid(),
  invited_by    uuid references public.profiles(id) on delete set null,
  expires_at    timestamptz not null default (now() + interval '7 days'),
  accepted_at   timestamptz,
  revoked_at    timestamptz,
  created_at    timestamptz not null default now()
);

create unique index idx_invites_token on public.invites(token);
create index idx_invites_company_id on public.invites(company_id);

-- ---------------------------------------------------------------------------
-- Helper functions used by RLS policies (and app code, via RPC)
--
-- IMPORTANT: these must stay owned by the migration-running role (postgres),
-- NOT be marked SECURITY INVOKER, and profiles/companies must never get
-- `FORCE ROW LEVEL SECURITY`. That combination is what lets these functions
-- read `profiles` without re-triggering the very policies that call them —
-- change any one of those three things and policies on `profiles` will
-- recurse into itself and every query will error.
-- ---------------------------------------------------------------------------

create or replace function public.company_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select company_id from public.profiles where id = auth.uid();
$$;

create or replace function public.user_role()
returns public.user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
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
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.company_id from public;
revoke all on function public.user_role from public;
revoke all on function public.is_admin from public;
grant execute on function public.company_id to authenticated;
grant execute on function public.user_role to authenticated;
grant execute on function public.is_admin to authenticated;

-- ---------------------------------------------------------------------------
-- Privilege-escalation guard: a self-update policy lets an employee edit
-- their own name/phone, but RLS is row-level, not column-level — without
-- this trigger the same policy would let them UPDATE ... SET role='admin'
-- on their own row. Blocked unless the acting session is already an admin,
-- or the acting client is the service_role key (server-side admin flows).
-- ---------------------------------------------------------------------------

create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.role is distinct from old.role or new.company_id is distinct from old.company_id)
     and not (public.is_admin() or auth.role() = 'service_role') then
    raise exception 'only an admin can change role or company_id';
  end if;
  return new;
end;
$$;

create trigger trg_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- ---------------------------------------------------------------------------
-- Company bootstrap + invite acceptance
--
-- Both run as service_role only, called from server actions — never from
-- the browser. They exist as single atomic functions instead of multiple
-- JS-side inserts so a network blip can't leave a company with no owner, or
-- a profile with no matching accepted invite.
-- ---------------------------------------------------------------------------

create or replace function public.bootstrap_company(
  p_owner_id      uuid,
  p_company_name  text,
  p_first_name    text,
  p_last_name     text,
  p_email         text
)
returns public.companies
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company public.companies;
begin
  insert into public.companies (name)
  values (p_company_name)
  returning * into v_company;

  insert into public.profiles (id, company_id, role, first_name, last_name, email, status)
  values (p_owner_id, v_company.id, 'admin', p_first_name, p_last_name, p_email, 'active');

  return v_company;
end;
$$;

revoke all on function public.bootstrap_company from public, anon, authenticated;
grant execute on function public.bootstrap_company to service_role;

create or replace function public.accept_invite(
  p_token       uuid,
  p_user_id     uuid,
  p_first_name  text,
  p_last_name   text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite  public.invites;
  v_profile public.profiles;
begin
  select * into v_invite
  from public.invites
  where token = p_token
    and accepted_at is null
    and revoked_at is null
    and expires_at > now()
  for update;

  if not found then
    raise exception 'invite_invalid_or_expired';
  end if;

  insert into public.profiles (id, company_id, role, first_name, last_name, email, status)
  values (p_user_id, v_invite.company_id, v_invite.role, p_first_name, p_last_name, v_invite.email, 'active')
  returning * into v_profile;

  update public.invites set accepted_at = now() where id = v_invite.id;

  return v_profile;
end;
$$;

revoke all on function public.accept_invite from public, anon, authenticated;
grant execute on function public.accept_invite to service_role;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.companies enable row level security;
alter table public.profiles  enable row level security;
alter table public.invites   enable row level security;

-- Defense in depth: Supabase grants anon/authenticated broad table
-- privileges by default and relies on RLS as the real gate. We revoke anon
-- outright — nothing here is ever readable before login — and grant
-- authenticated only what RLS is designed to filter.
revoke all on public.companies from anon;
revoke all on public.profiles  from anon;
revoke all on public.invites   from anon;

grant select, update on public.companies to authenticated;
grant select, update on public.profiles  to authenticated;
grant select, insert, update on public.invites to authenticated;

-- companies: read/update your own company only. Creation happens only via
-- bootstrap_company (service_role); there is no client-facing insert path.
create policy companies_select on public.companies
  for select using (id = public.company_id());

create policy companies_update on public.companies
  for update using (id = public.company_id() and public.is_admin())
  with check (id = public.company_id() and public.is_admin());

-- profiles: everyone in a company can see their teammates. Anyone can edit
-- their own row (guarded by the trigger above); admins can edit anyone in
-- their company. No insert policy — new profiles are created only by
-- bootstrap_company / accept_invite (service_role).
create policy profiles_select on public.profiles
  for select using (company_id = public.company_id());

create policy profiles_update_self on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

create policy profiles_update_admin on public.profiles
  for update using (company_id = public.company_id() and public.is_admin())
  with check (company_id = public.company_id() and public.is_admin());

-- invites: admin-only, company-scoped. Token lookup during invite
-- acceptance happens server-side via the service_role client (the invitee
-- has no session yet), so there is deliberately no policy exposing invites
-- by token to anon/authenticated.
create policy invites_select on public.invites
  for select using (company_id = public.company_id() and public.is_admin());

create policy invites_insert on public.invites
  for insert with check (company_id = public.company_id() and public.is_admin());

create policy invites_update on public.invites
  for update using (company_id = public.company_id() and public.is_admin())
  with check (company_id = public.company_id() and public.is_admin());
