-- Boss & Friends OS — Migration 0014: content system (Form2Finish)
--
-- Additive only. Nothing existing changes, and crew screens never read these
-- tables. Rows live under the Form2Finish company row, so RLS keeps them out of
-- every Boss & Friends login: same tenant boundary as the rest of the schema.
--
-- The worker on the Mac writes with the service role (photos in, drafts in,
-- decisions out). The dashboard reads and decides through a normal admin
-- session, so RLS applies there.
--
-- job_sites / content_assets hold street addresses and client homes. Nothing in
-- here is public. Only leads accepts outside input, through a server action.

create table public.job_sites (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  slug          text not null,
  label         text not null,
  city          text,
  address       text,                    -- private, never public
  era           text not null check (era in ('ontario_drywall_reno', 'vancouver_concrete')),
  performed_by  text,                    -- who did the work: Key West, Seema, Boss & Friends, Form2Finish
  scope         text,
  first_date    date,
  last_date     date,
  confirmed     boolean not null default false,  -- has LAALA confirmed this site
  project_id    uuid references public.projects(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  unique (company_id, slug),
  unique (id, company_id)
);

create table public.content_assets (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies(id) on delete cascade,
  catalog_id     text not null,          -- ~/ContentVault catalog id; camera file names repeat, this doesn't
  job_site_id    uuid,
  taken_at       timestamptz,
  kind           text,
  city           text,
  stage          text check (stage in ('lead', 'excavation', 'base_prep', 'forming', 'rebar', 'pour',
                   'concrete_finish', 'framing', 'drywall', 'tape_paint', 'bath_kitchen', 'landscape',
                   'repair', 'other')),
  brand          text not null default 'unsorted'
                   check (brand in ('f2f', 'bfc', 'experience', 'unsorted')),
  quality        smallint check (quality between 1 and 5),
  privacy_flags  text[] not null default '{}',
  labels         text[] not null default '{}',
  has_person     boolean not null default false,
  thumb_path     text,
  review_status  text not null default 'pending' check (review_status in ('pending', 'kept', 'skipped')),
  public_ok      boolean not null default false,  -- cleared for posts and public pages
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  unique (company_id, catalog_id),
  unique (id, company_id),
  constraint content_assets_job_site_fkey
    foreign key (job_site_id, company_id) references public.job_sites (id, company_id)
);
create index idx_content_assets_review on public.content_assets(company_id, review_status, taken_at);
create index idx_content_assets_site on public.content_assets(job_site_id);

create table public.posts (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies(id) on delete cascade,
  account        text not null check (account in ('manpreet_linkedin', 'f2f')),
  post_type      text not null check (post_type in ('talk', 'success', 'openings', 'site_info', 'hiring', 'joke', 'idea')),
  scheduled_for  timestamptz,
  hook           text,
  caption        text,
  first_comment  text,
  alt_text       text,
  preview_paths  text[] not null default '{}',
  status         text not null default 'raw' check (status in ('raw', 'selected', 'edited', 'captioned',
                   'approved', 'scheduled', 'posted', 'rejected')),
  feedback       text,
  published_url  text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (id, company_id)
);
create index idx_posts_queue on public.posts(company_id, status, scheduled_for);

-- The no-repeat rule. unique (asset_id) means a photo can sit in one post, ever,
-- across both accounts. A rejected post gives its photos back by deleting rows.
create table public.post_assets (
  post_id     uuid not null,
  company_id  uuid not null,
  asset_id    uuid not null,
  position    smallint not null default 0,
  primary key (post_id, asset_id),
  unique (asset_id),
  constraint post_assets_post_fkey foreign key (post_id, company_id)
    references public.posts (id, company_id) on delete cascade,
  constraint post_assets_asset_fkey foreign key (asset_id, company_id)
    references public.content_assets (id, company_id)
);

create table public.case_files (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  job_site_id   uuid not null,
  problem       text,
  constraints   text,
  options       text,
  decision      text,
  result        text,
  dollars       text,
  transcript    text,
  status        text not null default 'draft' check (status in ('draft', 'verified')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint case_files_job_site_fkey
    foreign key (job_site_id, company_id) references public.job_sites (id, company_id)
);

-- The bridge between a paused LangGraph thread on the Mac and a tap on the
-- dashboard. The worker adds a pending row, the dashboard decides it, the worker
-- resumes the thread and marks it consumed.
create table public.agent_approvals (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  graph        text not null,
  thread_id    text not null,
  kind         text not null,
  payload      jsonb not null default '{}',
  status       text not null default 'pending' check (status in ('pending', 'decided', 'consumed')),
  decision     jsonb,
  created_at   timestamptz not null default now(),
  decided_at   timestamptz,
  consumed_at  timestamptz
);
create unique index idx_agent_approvals_open on public.agent_approvals(thread_id) where status <> 'consumed';
create index idx_agent_approvals_queue on public.agent_approvals(company_id, status, created_at);

create table public.leads (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  source        text not null default 'capability_form',
  name          text,
  role          text,
  organization  text,
  email         text,
  phone         text,
  city          text,
  problem       text,
  status        text not null default 'new'
                  check (status in ('new', 'contacted', 'qualified', 'won', 'lost', 'spam')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index idx_leads_queue on public.leads(company_id, status, created_at);

create trigger trg_job_sites_updated_at before update on public.job_sites
  for each row execute function public.set_updated_at();
create trigger trg_content_assets_updated_at before update on public.content_assets
  for each row execute function public.set_updated_at();
create trigger trg_posts_updated_at before update on public.posts
  for each row execute function public.set_updated_at();
create trigger trg_case_files_updated_at before update on public.case_files
  for each row execute function public.set_updated_at();
create trigger trg_leads_updated_at before update on public.leads
  for each row execute function public.set_updated_at();

-- Admin of the owning company only, no delete (soft delete, as everywhere else).
-- Employees and other companies get nothing.
do $$
declare t text;
begin
  foreach t in array array['job_sites', 'content_assets', 'posts', 'post_assets', 'case_files',
                           'agent_approvals', 'leads']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format($p$create policy %1$s_select_admin on public.%1$I for select
      using (company_id = (select public.company_id()) and (select public.is_admin()))$p$, t);
    execute format($p$create policy %1$s_insert_admin on public.%1$I for insert
      with check (company_id = (select public.company_id()) and (select public.is_admin()))$p$, t);
    execute format($p$create policy %1$s_update_admin on public.%1$I for update
      using (company_id = (select public.company_id()) and (select public.is_admin()))
      with check (company_id = (select public.company_id()) and (select public.is_admin()))$p$, t);
  end loop;
end $$;

-- Thumbnails only, private. Originals stay on the Mac. Path: {company_id}/{uuid}.jpg
insert into storage.buckets (id, name, public) values ('content', 'content', false);
-- Only photos cleared for the public site, served without signing.
insert into storage.buckets (id, name, public) values ('site-public', 'site-public', true);

create policy content_select_admin on storage.objects
  for select using (
    bucket_id = 'content'
    and (storage.foldername(name))[1] = (select public.company_id())::text
    and (select public.is_admin())
  );
