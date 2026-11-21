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
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now()
);
alter table public.visitors enable row level security;
drop policy if exists "Visitors can submit their profile" on public.visitors;
create policy "Visitors can submit their profile" on public.visitors for insert to anon, authenticated with check (length(name) between 2 and 120 and gender in ('ذكر','أنثى'));
drop policy if exists "Admins can read visitor profiles" on public.visitors;
create policy "Admins can read visitor profiles" on public.visitors for select to authenticated using (true);
drop policy if exists "Visitors can refresh their profile" on public.visitors;
create policy "Visitors can refresh their profile" on public.visitors for update to anon, authenticated using (true) with check (length(name) between 2 and 120 and gender in ('ذكر','أنثى'));


-- حالة الحظر وإدارة حسابات الزائرين من لوحة الأدمن
alter table public.visitors add column if not exists blocked boolean not null default false;

create or replace function public.get_visitor_status(p_email text)
returns table(blocked boolean)
language sql
security definer
set search_path = public
as $$
  select v.blocked from public.visitors v
  where lower(v.email) = lower(trim(p_email))
  limit 1;
$$;
grant execute on function public.get_visitor_status(text) to anon, authenticated;

create or replace function public.admin_set_visitor_blocked(p_visitor_id uuid, p_blocked boolean)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then raise exception 'admin authentication required'; end if;
  update public.visitors set blocked = p_blocked where id = p_visitor_id;
end;
$$;
grant execute on function public.admin_set_visitor_blocked(uuid, boolean) to authenticated;

create or replace function public.admin_delete_visitor_account(p_visitor_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare visitor_email text;
begin
  if auth.uid() is null then raise exception 'admin authentication required'; end if;
  select email into visitor_email from public.visitors where id = p_visitor_id;
  delete from public.visitors where id = p_visitor_id;
  if visitor_email is not null then
    delete from auth.users where lower(email) = lower(visitor_email);
  end if;
end;
$$;
grant execute on function public.admin_delete_visitor_account(uuid) to authenticated;

-- نظام الامتحانات الإلكترونية والنتائج والترتيب
create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null,
  year smallint not null check (year in (1, 2)),
  description text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exam_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_option char(1) not null check (correct_option in ('a','b','c','d')),
  points integer not null default 1 check (points between 1 and 100),
  order_no integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  visitor_email text not null,
  visitor_name text not null,
  score integer not null default 0,
  total_points integer not null default 0,
  answers jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now()
);

alter table public.exams enable row level security;
alter table public.exam_questions enable row level security;
alter table public.exam_attempts enable row level security;

drop policy if exists "Published exams are public" on public.exams;
create policy "Published exams are public" on public.exams for select to anon, authenticated using (published = true);
drop policy if exists "Authenticated admins manage exams" on public.exams;
create policy "Authenticated admins manage exams" on public.exams for all to authenticated using (true) with check (true);

drop policy if exists "Questions for published exams are public" on public.exam_questions;
create policy "Questions for published exams are public" on public.exam_questions for select to anon, authenticated
using (exists (select 1 from public.exams e where e.id = exam_id and e.published = true));
drop policy if exists "Authenticated admins manage exam questions" on public.exam_questions;
create policy "Authenticated admins manage exam questions" on public.exam_questions for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated admins read attempts" on public.exam_attempts;
create policy "Authenticated admins read attempts" on public.exam_attempts for select to authenticated using (true);

create or replace function public.submit_exam_attempt(
  p_exam_id uuid,
  p_visitor_email text,
  p_visitor_name text,
  p_answers jsonb
)
returns table(attempt_id uuid, score integer, total_points integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_score integer;
  v_total integer;
  v_attempt_id uuid;
begin
  if length(trim(coalesce(p_visitor_email, ''))) < 3 or length(trim(coalesce(p_visitor_name, ''))) < 2 then
    raise exception 'بيانات الزائر غير مكتملة';
  end if;
  if not exists (select 1 from public.exams where id = p_exam_id and published = true) then
    raise exception 'الامتحان غير متاح';
  end if;
  select coalesce(sum(points), 0) into v_total from public.exam_questions where exam_id = p_exam_id;
  select coalesce(sum(q.points), 0) into v_score
  from public.exam_questions q
  where q.exam_id = p_exam_id
    and coalesce(p_answers ->> q.id::text, '') = q.correct_option;
  insert into public.exam_attempts(exam_id, visitor_email, visitor_name, score, total_points, answers)
  values (p_exam_id, lower(trim(p_visitor_email)), trim(p_visitor_name), v_score, v_total, coalesce(p_answers, '{}'::jsonb))
  returning id into v_attempt_id;
  return query select v_attempt_id, v_score, v_total;
end;
$$;
grant execute on function public.submit_exam_attempt(uuid, text, text, jsonb) to anon, authenticated;

create or replace function public.get_exam_leaderboard(p_exam_id uuid)
returns table(rank bigint, visitor_name text, score integer, total_points integer, submitted_at timestamptz)
language sql
security definer
set search_path = public
as $$
  with best as (
    select distinct on (lower(visitor_email)) visitor_name, score, total_points, submitted_at
    from public.exam_attempts
    where exam_id = p_exam_id
    order by lower(visitor_email), score desc, submitted_at asc
  )
  select row_number() over (order by score desc, submitted_at asc) as rank,
         visitor_name, score, total_points, submitted_at
  from best
  order by score desc, submitted_at asc
  limit 100;
$$;
grant execute on function public.get_exam_leaderboard(uuid) to anon, authenticated;

create or replace function public.get_my_exam_results(p_visitor_email text)
returns table(exam_id uuid, exam_title text, subject text, score integer, total_points integer, submitted_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select a.exam_id, e.title, e.subject, a.score, a.total_points, a.submitted_at
  from public.exam_attempts a join public.exams e on e.id = a.exam_id
  where lower(a.visitor_email) = lower(trim(p_visitor_email))
  order by a.submitted_at desc;
$$;
grant execute on function public.get_my_exam_results(text) to anon, authenticated;
