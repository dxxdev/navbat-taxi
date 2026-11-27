-- Haydovchini qo'lda tasdiqlash (Studio → SQL Editor).
-- Faqat 'driver.auto_approve' = false bo'lganda yoki 'blocked' holatni
-- qaytarish uchun kerak.
-- Raqamning oxirgi 9 raqamini quyida almashtiring (masalan, 998900000001 -> 900000001).

update public.drivers d
set status = 'approved'
from public.profiles p
where p.id = d.user_id
  and right(p.phone, 9) = '900000001'   -- <-- shu yerni almashtiring
returning d.user_id, d.status;