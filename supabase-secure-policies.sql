
alter table public.materials enable row level security;

-- Public users can read published materials only.
drop policy if exists "Published materials are public" on public.materials;
create policy "Published materials are public"
on public.materials
for select
using (published = true);

-- Only the new admin account can insert, update, or delete materials.
drop policy if exists "Authenticated admins manage materials" on public.materials;
drop policy if exists "Only the admin manages materials" on public.materials;
create policy "Only the new admin manages materials"
on public.materials
for all
to authenticated


-- Keep files readable by students because published materials are public.
-- Upload, update, and delete are restricted to the new admin account.
drop policy if exists "Public can read material files" on storage.objects;
create policy "Public can read material files"
on storage.objects
for select
using (bucket_id = 'materials');

drop policy if exists "Authenticated admins upload material files" on storage.objects;
create policy "Only the new admin uploads material files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'materials'

);

drop policy if exists "Authenticated admins update material files" on storage.objects;
create policy "Only the new admin updates material files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'materials'
 
)
with check (
  bucket_id = 'materials'

);

drop policy if exists "Authenticated admins delete material files" on storage.objects;
create policy "Only the new admin deletes material files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'materials'
  and (auth.jwt() ->> 'email') = 'ebramadel2026@gmail.com'
);
