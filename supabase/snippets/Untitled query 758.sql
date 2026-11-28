-- Sinov uchun yo'lovchi va band yaratadi (haydovchi ekrani: 11-qism).
-- FAQAT lokal ishlab chiqish bazasi uchun! book_seat va RLS'ni chetlab o'tadi.
--
-- Ishlatish:
--   1) Pastdagi v_driver_phone ni haydovchi profilidagi telefon bilan almashtiring
--      (profiles.phone qanday saqlangan bo'lsa, xuddi shunday: "+998..." yoki "998...").
--   2) Haydovchi ilovada navbatda (faol yozuv) bo'lishi kerak.
--   3) Har safar v_idx ni o'zgartiring (1..9): bitta yo'lovchida faqat 1 ta faol band
--      bo'lishi mumkin, shuning uchun har bir yangi band uchun yangi sinov yo'lovchisi kerak.
--   4) Studio (http://127.0.0.1:54323 -> SQL Editor) ga qo'yib Run bosing, yoki:
--      psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f docs/sql-snippets/insert_booking.sql
--   5) Haydovchi ekranida "Yangilash" bosing, band va taymer ko'rinadi.
--
-- Tez sinash uchun v_expires_in_sec ni 30 qiling, "Vaqt tugadi" holati va
-- avtomatik bekor qilish (4-funksiya) tekshiriladi.

do $$
declare
  v_driver_phone   text := '998901234567';
v_idx            int  := 1;
v_seats          int  := 1;
v_wait_min       int  := 5;
v_expires_in_sec int  := 300;   -- 5 daqiqa

  v_auth_phone text := '99890000000' || v_idx::text;      -- auth.users: "+"siz
  v_prof_phone text := '+99890000000' || v_idx::text;     -- tel: uchun "+"li
  v_entry      record;
  v_user_id    uuid;
  v_free       int;
  v_booking_id uuid;
begin
  -- 1) Haydovchining faol navbat yozuvi (bloklab olinadi: avval queue_entries)
  select q.* into v_entry
  from public.queue_entries q
  join public.profiles p on p.id = q.driver_id
  where p.phone = v_driver_phone
    and q.status = 'active'
  for update of q;

  if v_entry.id is null then
    raise exception 'Faol navbat yozuvi topilmadi (haydovchi telefoni: %)', v_driver_phone;
  end if;

  -- 2) Bo'sh o'rindiqni tekshirish (muddati o'tgan bandlar hisobga olinmaydi)
  select v_entry.seats_total - v_entry.seats_occupied - coalesce(sum(b.seats), 0)
  into v_free
  from public.bookings b
  where b.queue_entry_id = v_entry.id
    and b.status = 'active'
    and b.expires_at > now();

  if v_free < v_seats then
    raise exception 'Bo''sh joy yetarli emas: bo''sh %, kerak %', v_free, v_seats;
  end if;

  -- 3) Sinov yo'lovchisi (auth.users) — bor bo'lsa qayta ishlatiladi
  select id into v_user_id from auth.users where phone = v_auth_phone;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, phone, phone_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      v_auth_phone, now(),
      '{"provider":"phone","providers":["phone"]}'::jsonb, '{}'::jsonb, now(), now()
    );
  end if;

  -- 4) Profil (trigger yaratgan bo'lsa yangilanadi, bo'lmasa yaratiladi)
  insert into public.profiles (id, phone, full_name, role)
  values (v_user_id, v_prof_phone, 'Sinov yo''lovchi ' || v_idx, 'passenger')
  on conflict (id) do update
    set phone = excluded.phone,
        full_name = excluded.full_name,
        role = 'passenger';

  -- 5) Bu yo'lovchida faol band bo'lmasligi kerak (unikal indeks)
  if exists (
    select 1 from public.bookings
    where passenger_id = v_user_id and status = 'active'
  ) then
    raise exception 'Bu sinov yo''lovchisida (v_idx = %) faol band bor. v_idx ni o''zgartiring.', v_idx;
  end if;

  -- 6) Band
  insert into public.bookings (
    passenger_id, queue_entry_id, seats, fare_per_seat, status,
    wait_minutes, expires_at, idempotency_key
  ) values (
    v_user_id, v_entry.id, v_seats, v_entry.fare, 'active',
    v_wait_min, now() + (v_expires_in_sec * interval '1 second'), gen_random_uuid()
  )
  returning id into v_booking_id;

  raise notice 'Band yaratildi: % (yo''lovchi %, o''rindiq %, % soniyadan keyin tugaydi)',
    v_booking_id, v_prof_phone, v_seats, v_expires_in_sec;
end
$$;

-- Tozalash (kerak bo'lganda alohida ishga tushiring):
-- delete from public.bookings
--   where passenger_id in (select id from auth.users where phone like '9989000000%');
-- delete from public.profiles
--   where id in (select id from auth.users where phone like '9989000000%');
-- delete from auth.users where phone like '9989000000%';