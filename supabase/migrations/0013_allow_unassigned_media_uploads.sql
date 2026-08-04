-- Boss & Friends OS — Migration 0013: allow unassigned photo/document uploads
--
-- Photo and document uploads no longer require project assignment.
-- Any active employee can upload media/documents to any project in their company.

-- Update storage RLS policies to not require assignment
drop policy if exists media_documents_insert on storage.objects;

create policy media_documents_insert on storage.objects
  for insert with check (
    bucket_id in ('media', 'documents')
    and (storage.foldername(name))[1] = (select public.company_id())::text
    and (
      (select public.is_admin())
      or (select public.is_active())
    )
  );

-- Update media RLS policies to not require assignment
drop policy if exists media_insert_assigned on public.media;

create policy media_insert_assigned on public.media
  for insert with check (
    company_id = (select public.company_id())
    and uploaded_by = auth.uid()
    and (select public.is_active())
  );

-- Update documents RLS policies to not require assignment
drop policy if exists documents_insert_assigned on public.documents;

create policy documents_insert_assigned on public.documents
  for insert with check (
    company_id = (select public.company_id())
    and uploaded_by = auth.uid()
    and (select public.is_active())
  );
