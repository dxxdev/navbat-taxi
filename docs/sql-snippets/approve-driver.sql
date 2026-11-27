-- Haydovchini qo'lda tasdiqlash/bloklash (driver.auto_approve = false bo'lganda kerak).
-- Supabase Studio SQL Editor yoki psql orqali (postgres roli, RLS aylanib o'tiladi).
-- Telefon raqamini o'zgartiring (profiles.phone formatida).

-- 1) Tasdiq kutayotganlar ro'yxati
select d.user_id, p.phone, p.full_name, d.license_number, d.created_at
  from public.drivers d
  join public.profiles p on p.id = d.user_id
 where d.status = 'pending'
 order by d.created_at;

-- 2) Tasdiqlash
update public.drivers
   set status = 'approved'
 where user_id = (select id from public.profiles where phone = '+998901234567')
   and status = 'pending';

-- 3) Bloklash (kerak bo'lsa)
-- update public.drivers set status = 'blocked'
--  where user_id = (select id from public.profiles where phone = '+998901234567');