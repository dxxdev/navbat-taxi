-- Test uchun band yozuvini QO'LDA yaratish (Studio → SQL Editor).
-- DIQQAT: bu book_seat RPC'ni chetlab o'tadi: bo'sh o'rin va navbat tekshiruvlari
-- ishlamaydi. Faqat tezkor sinov uchun ishlating.
--
-- Shartlar: yo'lovchi ro'yxatdan o'tgan bo'lishi, kamida bitta 'active'
-- navbat yozuvi (haydovchi navbatga yozilgan) mavjud bo'lishi kerak.
-- Yo'lovchida allaqachon faol band bo'lsa, unikal indeks xato beradi.
--
-- Quyidagilarni almashtiring: yo'lovchi raqami, o'rinlar soni, kutish vaqti.

insert into public.bookings (
  passenger_id, queue_entry_id, seats, fare_per_seat,
  status, wait_minutes, expires_at, idempotency_key
)
select
  p.id,
  q.id,
  1,                                  -- <-- o'rinlar soni (1..4)
  q.fare,
  'active',
  5,                                  -- <-- kutish vaqti (daqiqa)
  now() + interval '5 minutes',       -- <-- wait_minutes bilan mos bo'lsin
  gen_random_uuid()
from public.profiles p
cross join lateral (
  select id, fare
  from public.queue_entries
  where status = 'active'
  order by joined_at, id
  limit 1                             -- navbatdagi birinchi mashina
) q
where right(p.phone, 9) = '900000003'  -- <-- yo'lovchi raqami
returning id, passenger_id, queue_entry_id, status, expires_at;