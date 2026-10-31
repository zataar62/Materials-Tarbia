create extension if not exists pgcrypto;

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  year smallint not null check (year in (1, 2)),
  subject text not null,
  part text,
  title text not null,
  type text not null default 'محاضرات',
  format text not null default 'PDF',
  file_url text not null,
  file_path text not null unique,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.materials enable row level security;

drop policy if exists "Published materials are public" on public.materials;
create policy "Published materials are public"
  on public.materials for select
  using (published = true);

drop policy if exists "Authenticated admins manage materials" on public.materials;
create policy "Authenticated admins manage materials"
  on public.materials for all to authenticated
  using (true) with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('materials', 'materials', true, 52428800, array['application/pdf','image/png','image/jpeg','image/webp','video/mp4'])
on conflict (id) do update set public = true, file_size_limit = 52428800;

drop policy if exists "Public can read material files" on storage.objects;
create policy "Public can read material files"
  on storage.objects for select
  using (bucket_id = 'materials');

drop policy if exists "Authenticated admins upload material files" on storage.objects;
create policy "Authenticated admins upload material files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'materials');

drop policy if exists "Authenticated admins update material files" on storage.objects;
create policy "Authenticated admins update material files"
  on storage.objects for update to authenticated
  using (bucket_id = 'materials') with check (bucket_id = 'materials');

drop policy if exists "Authenticated admins delete material files" on storage.objects;
create policy "Authenticated admins delete material files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'materials');

create or replace function public.set_material_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists materials_updated_at on public.materials;
create trigger materials_updated_at
before update on public.materials
for each row execute function public.set_material_updated_at();

alter table public.materials replica identity full;
alter publication supabase_realtime add table public.materials;
