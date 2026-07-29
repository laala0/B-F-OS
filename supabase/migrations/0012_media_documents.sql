-- Boss & Friends OS — Migration 0012: media & documents (Phase 5)
--
-- Uploads never pass through a server action (ARCHITECTURE.md's own
-- constraint — Vercel functions reject bodies over ~4.5MB and a site video
-- can be hundreds of MB): the browser uploads straight to Supabase Storage
-- with its own authenticated session, gated by the storage.objects RLS
-- policies below, then confirms with a server action that only ever writes
-- a small metadata row (actions/media.ts, actions/documents.ts).
--
-- Buckets stay private (public = false) — reads go through
-- createSignedUrl(), which itself requires the caller to already pass the
-- select policy below at the moment it's generated. That keeps the same
-- tenant boundary as everything else in this schema instead of trusting a
-- world-readable bucket.
--
-- Path convention every policy below depends on:
--   {company_id}/{project_id}/{uuid}-{original filename}
-- storage.foldername(name) splits that into an array, so
-- (storage.foldername(name))[1] is the company segment and [2] the project
-- segment — checked against company_id()/project_assignments exactly like
-- every other tenant/assignment check in this schema, just against a path
-- instead of a column.

insert into storage.buckets (id, name, public) values ('media', 'media', false);
insert into storage.buckets (id, name, public) values ('documents', 'documents', false);

create policy media_documents_select on storage.objects
  for select using (
    bucket_id in ('media', 'documents')
    and (storage.foldername(name))[1] = (select public.company_id())::text
    and (
      (select public.is_admin())
      or exists (
        select 1 from public.project_assignments pa
        where pa.profile_id = auth.uid()
          and pa.project_id::text = (storage.foldername(name))[2]
      )
    )
  );

create policy media_documents_insert on storage.objects
  for insert with check (
    bucket_id in ('media', 'documents')
    and (storage.foldername(name))[1] = (select public.company_id())::text
    and (
      (select public.is_admin())
      or exists (
        select 1 from public.project_assignments pa
        where pa.profile_id = auth.uid()
          and pa.project_id::text = (storage.foldername(name))[2]
      )
    )
  );

-- Uploader can remove their own file; admin can remove anything in the
-- company. `owner` is stamped automatically by Storage from the uploading
-- session — not something either policy needs to set itself.
create policy media_documents_delete on storage.objects
  for delete using (
    bucket_id in ('media', 'documents')
    and (storage.foldername(name))[1] = (select public.company_id())::text
    and ((select public.is_admin()) or owner = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- media — metadata for storage.objects in the "media" bucket. The bucket
-- holds the bytes; this table is what the gallery UI actually queries
-- (storage doesn't have a fast "list everything for project X" query the
-- way a plain indexed table does).
-- ---------------------------------------------------------------------------

create table public.media (
  id                 uuid primary key default gen_random_uuid(),
  company_id         uuid not null references public.companies(id) on delete cascade,
  project_id         uuid not null,
  uploaded_by        uuid not null references public.profiles(id) on delete cascade,
  storage_path       text not null unique,
  content_type       text,
  size_bytes         bigint,
  caption            text,
  created_at         timestamptz not null default now(),
  constraint media_project_id_company_id_fkey
    foreign key (project_id, company_id) references public.projects (id, company_id) on delete cascade
);

create index idx_media_company_id on public.media(company_id);
create index idx_media_project_id on public.media(project_id);

alter table public.media enable row level security;
revoke all on public.media from anon;
grant select, insert, delete on public.media to authenticated;

create policy media_select_admin on public.media
  for select using (company_id = (select public.company_id()) and (select public.is_admin()));

create policy media_select_assigned on public.media
  for select using (
    (select public.is_active())
    and exists (
      select 1 from public.project_assignments pa
      where pa.project_id = media.project_id and pa.profile_id = auth.uid()
    )
  );

create policy media_insert_admin on public.media
  for insert with check (company_id = (select public.company_id()) and (select public.is_admin()) and uploaded_by = auth.uid());

create policy media_insert_assigned on public.media
  for insert with check (
    company_id = (select public.company_id())
    and uploaded_by = auth.uid()
    and (select public.is_active())
    and exists (
      select 1 from public.project_assignments pa
      where pa.project_id = media.project_id and pa.profile_id = auth.uid()
    )
  );

create policy media_delete_admin on public.media
  for delete using (company_id = (select public.company_id()) and (select public.is_admin()));

create policy media_delete_own on public.media
  for delete using (uploaded_by = auth.uid());

-- ---------------------------------------------------------------------------
-- documents — same shape as media, separate table (not a `kind` column on
-- one shared table) because the two behave differently: documents carry a
-- category and version number, media doesn't and never will.
-- ---------------------------------------------------------------------------

create table public.documents (
  id                 uuid primary key default gen_random_uuid(),
  company_id         uuid not null references public.companies(id) on delete cascade,
  project_id         uuid not null,
  uploaded_by        uuid not null references public.profiles(id) on delete cascade,
  storage_path       text not null unique,
  original_filename  text not null,
  category           text not null default 'other' check (category in ('drawing', 'permit', 'contract', 'quote', 'other')),
  version            integer not null default 1,
  content_type       text,
  size_bytes         bigint,
  created_at         timestamptz not null default now(),
  constraint documents_project_id_company_id_fkey
    foreign key (project_id, company_id) references public.projects (id, company_id) on delete cascade
);

create index idx_documents_company_id on public.documents(company_id);
create index idx_documents_project_id on public.documents(project_id);

alter table public.documents enable row level security;
revoke all on public.documents from anon;
grant select, insert, delete on public.documents to authenticated;

create policy documents_select_admin on public.documents
  for select using (company_id = (select public.company_id()) and (select public.is_admin()));

create policy documents_select_assigned on public.documents
  for select using (
    (select public.is_active())
    and exists (
      select 1 from public.project_assignments pa
      where pa.project_id = documents.project_id and pa.profile_id = auth.uid()
    )
  );

create policy documents_insert_admin on public.documents
  for insert with check (company_id = (select public.company_id()) and (select public.is_admin()) and uploaded_by = auth.uid());

create policy documents_insert_assigned on public.documents
  for insert with check (
    company_id = (select public.company_id())
    and uploaded_by = auth.uid()
    and (select public.is_active())
    and exists (
      select 1 from public.project_assignments pa
      where pa.project_id = documents.project_id and pa.profile_id = auth.uid()
    )
  );

create policy documents_delete_admin on public.documents
  for delete using (company_id = (select public.company_id()) and (select public.is_admin()));

create policy documents_delete_own on public.documents
  for delete using (uploaded_by = auth.uid());
