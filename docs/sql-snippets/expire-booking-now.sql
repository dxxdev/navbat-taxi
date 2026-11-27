-- Yo'lovchining faol bandi muddatini o'tmishga suradi (avtomatik bekor
-- qilishni sinash uchun). Studio → SQL Editor.
-- Raqamning oxirgi 9 raqamini quyida almashtiring.
--
-- Muddati o'tgan band (expires_at <= now()) bo'sh o'rin hisobiga darhol
-- kirmaydi; status esa cron (keyingi qism) ishlagach 'expired' bo'ladi.

update public.bookings b
set expires_at = now() - interval '1 minute'
from public.profiles p
where p.id = b.passenger_id
  and b.status = 'active'
  and right(p.phone, 9) = '900000003'   -- <-- shu yerni almashtiring
returning b.id, b.status, b.expires_at;