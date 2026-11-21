-- شغّل هذا الملف فقط إذا كانت جداول المواد والزائرين موجودة بالفعل.
-- الملف قابل لإعادة التشغيل ولا يكرر الجداول أو الدوال بشكل مسبب للأخطاء.

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

