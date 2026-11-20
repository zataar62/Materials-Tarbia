-- تشغيل هذا الملف مرة واحدة في Supabase SQL Editor
-- لا يخزن هذا التعديل كلمات المرور ولا يتيح قراءتها.
alter table public.visitors
  add column if not exists banned boolean not null default false,
  add column if not exists banned_at timestamptz,
  add column if not exists is_online boolean not null default false;

create index if not exists visitors_banned_idx on public.visitors (banned);

-- السماح للأدمن المصادق عليه بإدارة سجلات الزائرين.
-- لا تُمنح أي صلاحية anon للقراءة أو الحذف.
drop policy if exists "Admins can delete visitor profiles" on public.visitors;
create policy "Admins can delete visitor profiles"
  on public.visitors for delete to authenticated using (true);

drop policy if exists "Admins can update visitor moderation" on public.visitors;
create policy "Admins can update visitor moderation"
  on public.visitors for update to authenticated
  using (true)
  with check (length(name) between 2 and 120 and gender in ('ذكر','أنثى'));

notify pgrst, 'reload schema';

-- حماية إضافية: لا يستطيع anon تغيير أعمدة الإشراف حتى عبر تحديث ملفه.
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

notify pgrst, 'reload schema';

-- فحص حالة الحظر للزائر بدون كشف بيانات باقي الزائرين.
create or replace function public.is_visitor_banned(p_email text)
returns boolean language sql security definer set search_path = public as $$
  select coalesce((select banned from public.visitors where lower(email) = lower(trim(p_email)) limit 1), false);
$$;
revoke all on function public.is_visitor_banned(text) from public;
grant execute on function public.is_visitor_banned(text) to anon, authenticated;

-- بث فوري للوحة الأدمن، بدون الحاجة إلى Refresh.
do $$
begin
  alter publication supabase_realtime add table public.visitors;
exception when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';

-- حالة الحساب للعميل الحالي: active أو banned أو missing.
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
