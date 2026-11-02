-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor
alter table public.materials add column if not exists section text;
notify pgrst, 'reload schema';
