-- =====================================================================
-- private.seats_free() va private.get_setting() ni qo'lda tekshirish.
-- Hammasi tranzaksiya ichida; oxirida ROLLBACK, shuning uchun baza toza qoladi.
-- Ishga tushirish:
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
--        -v ON_ERROR_STOP=1 -f docs/sql-snippets/seats_free_check.sql
-- =====================================================================
begin;

-- Tekshiruv yordamchisi (faqat shu sessiyada mavjud)
create function pg_temp.assert_eq(p_label text, p_actual anyelement, p_expected anyelement)
returns void language plpgsql as $$
begin
  if p_actual is distinct from p_expected then
    raise exception 'XATO [%]: kutilgan=%, olingan=%', p_label, p_expected, p_actual;
  end if;
  raise notice 'OK   [%] = %', p_label, p_actual;
end;
$$;

-- ---------- Test ma'lumotlari ----------
-- Auth foydalanuvchilari (trigger profil yaratadi)
insert into auth.users (id, phone) values
  ('d0000000-0000-0000-0000-000000000001', '998900000001'),  -- haydovchi
  ('a0000000-0000-0000-0000-000000000001', '998900000011'),  -- yo'lovchi A
  ('a0000000-0000-0000-0000-000000000002', '998900000012'),  -- yo'lovchi B
  ('a0000000-0000-0000-0000-000000000003', '998900000013'),  -- yo'lovchi C
  ('a0000000-0000-0000-0000-000000000004', '998900000014'),  -- yo'lovchi D
  ('a0000000-0000-0000-0000-000000000005', '998900000015');  -- yo'lovchi E

-- Trigger profil yaratganini tekshiramiz (role = null)
select pg_temp.assert_eq(
  'trigger: profil yaratildi, role null',
  (select count(*)::int from public.profiles
    where id = 'd0000000-0000-0000-0000-000000000001' and role is null),
  1
);

update public.profiles set role = 'driver'
  where id = 'd0000000-0000-0000-0000-000000000001';
update public.profiles set role = 'passenger'
  where id::text like 'a0000000-%';

insert into public.drivers (user_id, license_number, status)
values ('d0000000-0000-0000-0000-000000000001', 'TEST-123', 'approved');

insert into public.vehicles (id, driver_id, model, color, plate_number, seats_total)
values ('c0000000-0000-0000-0000-000000000001',
        'd0000000-0000-0000-0000-000000000001',
        'Chevrolet Cobalt', 'oq', 'TEST 001 AA', 4);

insert into public.cities (id, name_uz)
values ('b0000000-0000-0000-0000-000000000001', 'Test shahar');

insert into public.stations (id, city_id, name, location)
values ('b0000000-0000-0000-0000-000000000002',
        'b0000000-0000-0000-0000-000000000001',
        'Test vokzal',
        extensions.st_setsrid(extensions.st_makepoint(59.6, 42.46), 4326)::extensions.geography);

insert into public.routes (id, station_id, destination_name, fare_min, fare_max, duration_min)
values ('b0000000-0000-0000-0000-000000000003',
        'b0000000-0000-0000-0000-000000000002',
        'Test manzil', 40000, 60000, 120);

-- 4 o'rindiqli mashina, 1 tasi allaqachon band (seats_occupied = 1)
insert into public.queue_entries
  (id, route_id, vehicle_id, driver_id, seats_total, seats_occupied, fare)
values ('e0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000003',
        'c0000000-0000-0000-0000-000000000001',
        'd0000000-0000-0000-0000-000000000001',
        4, 1, 50000);

-- ---------- Tekshiruvlar: seats_free ----------

-- 1) Bandlar yo'q: 4 - 1 = 3
select pg_temp.assert_eq('bandsiz',
  private.seats_free('e0000000-0000-0000-0000-000000000001'), 3);

-- 2) A: faol, muddati o'tmagan, 1 o'rindiq: 3 - 1 = 2
insert into public.bookings
  (passenger_id, queue_entry_id, seats, fare_per_seat, wait_minutes, expires_at, idempotency_key)
values ('a0000000-0000-0000-0000-000000000001',
        'e0000000-0000-0000-0000-000000000001',
        1, 50000, 15, now() + interval '15 minutes', gen_random_uuid());

select pg_temp.assert_eq('faol band hisobga olinadi',
  private.seats_free('e0000000-0000-0000-0000-000000000001'), 2);

-- 3) B: faol, lekin muddati o'tgan (cron kechikkan): hisobga olinmaydi
insert into public.bookings
  (passenger_id, queue_entry_id, seats, fare_per_seat, wait_minutes, expires_at, idempotency_key)
values ('a0000000-0000-0000-0000-000000000002',
        'e0000000-0000-0000-0000-000000000001',
        1, 50000, 5, now() - interval '1 minute', gen_random_uuid());

select pg_temp.assert_eq('muddati o''tgan band hisobga olinmaydi',
  private.seats_free('e0000000-0000-0000-0000-000000000001'), 2);

-- 4) C: bekor qilingan band hisobga olinmaydi
insert into public.bookings
  (passenger_id, queue_entry_id, seats, fare_per_seat, wait_minutes, expires_at,
   idempotency_key, status, cancel_reason, closed_at)
values ('a0000000-0000-0000-0000-000000000003',
        'e0000000-0000-0000-0000-000000000001',
        1, 50000, 15, now() + interval '15 minutes',
        gen_random_uuid(), 'cancelled', 'passenger', now());

select pg_temp.assert_eq('bekor qilingan band hisobga olinmaydi',
  private.seats_free('e0000000-0000-0000-0000-000000000001'), 2);

-- 5) D: "Keldi" bosildi: band 'seated', seats_occupied 1 -> 2.
--    Faol band (A) = 1, shuning uchun bo'sh = 4 - 2 - 1 = 1
insert into public.bookings
  (passenger_id, queue_entry_id, seats, fare_per_seat, wait_minutes, expires_at,
   idempotency_key, status, seated_at, closed_at)
values ('a0000000-0000-0000-0000-000000000004',
        'e0000000-0000-0000-0000-000000000001',
        1, 50000, 15, now() + interval '15 minutes',
        gen_random_uuid(), 'seated', now(), now());
update public.queue_entries set seats_occupied = 2
  where id = 'e0000000-0000-0000-0000-000000000001';

select pg_temp.assert_eq('o''tirgan yo''lovchi',
  private.seats_free('e0000000-0000-0000-0000-000000000001'), 1);

-- 6) E: yana 1 ta faol band: bo'sh joy 0 ga tushadi
insert into public.bookings
  (passenger_id, queue_entry_id, seats, fare_per_seat, wait_minutes, expires_at, idempotency_key)
values ('a0000000-0000-0000-0000-000000000005',
        'e0000000-0000-0000-0000-000000000001',
        1, 50000, 30, now() + interval '30 minutes', gen_random_uuid());

select pg_temp.assert_eq('to''liq',
  private.seats_free('e0000000-0000-0000-0000-000000000001'), 0);

-- 7) Mavjud bo'lmagan yozuv: null
select pg_temp.assert_eq('mavjud emas -> null',
  private.seats_free('00000000-0000-0000-0000-000000000000'), null::int);

-- ---------- Tekshiruvlar: cheklovlar ----------

-- 8) Bir yo'lovchida 2 ta faol band bo'lmasligi kerak
do $$
begin
  begin
    insert into public.bookings
      (passenger_id, queue_entry_id, seats, fare_per_seat, wait_minutes, expires_at, idempotency_key)
    values ('a0000000-0000-0000-0000-000000000001',
            'e0000000-0000-0000-0000-000000000001',
            1, 50000, 15, now() + interval '15 minutes', gen_random_uuid());
    raise exception 'XATO: ikkinchi faol band qabul qilindi';
  exception when unique_violation then
    raise notice 'OK   [uq_booking_one_active_per_passenger ishlayapti]';
  end;
end $$;

-- 9) seats_occupied > seats_total bo'lmasligi kerak
do $$
begin
  begin
    update public.queue_entries set seats_occupied = 5
      where id = 'e0000000-0000-0000-0000-000000000001';
    raise exception 'XATO: seats_occupied > seats_total qabul qilindi';
  exception when check_violation then
    raise notice 'OK   [ck_queue_seats ishlayapti]';
  end;
end $$;

-- ---------- Tekshiruvlar: get_setting ----------
select pg_temp.assert_eq('get_setting max_seats',
  private.get_setting('booking.max_seats'), '4'::jsonb);
select pg_temp.assert_eq('get_setting auto_approve',
  private.get_setting('driver.auto_approve'), 'true'::jsonb);
select pg_temp.assert_eq('get_setting wait_options',
  private.get_setting('booking.wait_options_min'), '[1, 5, 15, 30, 60]'::jsonb);
select pg_temp.assert_eq('get_setting default',
  private.get_setting('yoq.kalit', '"x"'::jsonb), '"x"'::jsonb);

-- ---------- updated_at triggeri ----------
do $$
declare
  v_before timestamptz;
  v_after  timestamptz;
begin
  update public.settings set updated_at = now() - interval '1 day'
    where key = 'booking.max_seats';
  select updated_at into v_before from public.settings where key = 'booking.max_seats';
  -- trigger yuqoridagi update'da ham ishlagan; qiymatni o'zgartirib yana tekshiramiz
  update public.settings set value = '3'::jsonb where key = 'booking.max_seats';
  select updated_at into v_after from public.settings where key = 'booking.max_seats';
  if v_after < now() - interval '1 minute' then
    raise exception 'XATO: settings.updated_at yangilanmadi';
  end if;
  raise notice 'OK   [settings.updated_at trigger ishlayapti]';
end $$;

-- Hamma narsa bekor qilinadi
rollback;