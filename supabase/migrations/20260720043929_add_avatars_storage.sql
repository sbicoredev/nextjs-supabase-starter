-- Adds the `avatars` storage bucket + RLS policies that
-- supabase/schemas/001_profiles.sql declares under "Set up Storage!".
-- This was never diffed into a migration when the schema file was first
-- written, so `supabase db reset` never actually created the bucket. See
-- docs/library-docs.md → Supabase section for this class of gotcha.
insert into storage.buckets (id, name)
  values ('avatars', 'avatars')
  on conflict (id) do nothing;

create policy "Avatar images are publicly accessible." on storage.objects
  for select using (bucket_id = 'avatars' and storage.allow_any_operation(
	  array['object.get_authenticated_info', 'object.get_authenticated']
	));

create policy "Authenticated user can upload an avatar." on storage.objects
  for insert to authenticated
	with check (bucket_id = 'avatars');

create policy "Authenticated user can update their own avatar." on storage.objects
  for update to authenticated
	using ((select auth.uid()) = owner) with check (bucket_id = 'avatars');
