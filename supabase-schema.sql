create extension if not exists pgcrypto;

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  year smallint not null check (year in (1, 2)),
  subject text not null,
  part text,
  section text,
  title text not null,
  type text not null default 'محاضرات',
  format text not null default 'PDF',
  file_url text not null,
  file_path text not null unique,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.materials add column if not exists section text;

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
create table if not exists public.visitors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  gender text not null check (gender in ('ذكر','أنثى')),
  banned boolean not null default false,
  banned_at timestamptz,
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now()
);
alter table public.visitors add column if not exists banned boolean not null default false;
alter table public.visitors add column if not exists banned_at timestamptz;
alter table public.visitors enable row level security;
drop policy if exists "Visitors can submit their profile" on public.visitors;
create policy "Visitors can submit their profile" on public.visitors for insert to anon, authenticated with check (length(name) between 2 and 120 and gender in ('ذكر','أنثى'));
drop policy if exists "Admins can read visitor profiles" on public.visitors;
create policy "Admins can read visitor profiles" on public.visitors for select to authenticated using (true);
drop policy if exists "Admins can delete visitor profiles" on public.visitors;
create policy "Admins can delete visitor profiles" on public.visitors for delete to authenticated using (true);
drop policy if exists "Admins can update visitor moderation" on public.visitors;
create policy "Admins can update visitor moderation" on public.visitors for update to authenticated
  using (true) with check (length(name) between 2 and 120 and gender in ('ذكر','أنثى'));
drop policy if exists "Visitors can refresh their profile" on public.visitors;
create policy "Visitors can refresh their profile" on public.visitors for update to anon, authenticated using (true) with check (length(name) between 2 and 120 and gender in ('ذكر','أنثى'));

create or replace function public.prevent_visitor_moderation_tamper()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() <> 'authenticated' and (new.banned is distinct from old.banned or new.banned_at is distinct from old.banned_at) then
    raise exception 'moderation fields are not editable by visitors';
  end if;
  return new;
end;
$$;
drop trigger if exists visitors_moderation_guard on public.visitors;
create trigger visitors_moderation_guard
before update on public.visitors
for each row execute function public.prevent_visitor_moderation_tamper();

create or replace function public.is_visitor_banned(p_email text)
returns boolean language sql security definer set search_path = public as $$
  select coalesce((select banned from public.visitors where lower(email) = lower(trim(p_email)) limit 1), false);
$$;
revoke all on function public.is_visitor_banned(text) from public;
grant execute on function public.is_visitor_banned(text) to anon, authenticated;
do $$
begin
  alter publication supabase_realtime add table public.visitors;
exception when duplicate_object then null;
end $$;

create or replace function public.visitor_account_status(p_email text)
returns text language sql security definer set search_path = public as $$
  select case
    when not exists (select 1 from public.visitors where lower(email) = lower(trim(p_email))) then 'missing'
    when exists (select 1 from public.visitors where lower(email) = lower(trim(p_email)) and banned) then 'banned'
    else 'active'
  end;
$$;
revoke all on function public.visitor_account_status(text) from public;
grant execute on function public.visitor_account_status(text) to anon, authenticated;
