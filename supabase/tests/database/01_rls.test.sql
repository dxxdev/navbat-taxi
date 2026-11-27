begin;
select plan(28);

-- ===== Tayyorgarlik (postgres sifatida) =====
insert into auth.users (id, aud, role, phone) values
  ('a0000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', '998900000001'),
  ('b0000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', '998900000002'),
  ('d0000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', '998900000003');

-- Trigger profil yaratgan (role = null); rollarni tayinlaymiz
update public.profiles set role = 'passenger', full_name = 'A yoʻlovchi'
  where id = 'a0000000-0000-4000-8000-000000000001';
update public.profiles set role = 'passenger', full_name = 'B yoʻlovchi'
  where id = 'b0000000-0000-4000-8000-000000000002';
update public.profiles set role = 'driver', full_name = 'D haydovchi'
  where id = 'd0000000-0000-4000-8000-000000000003';

insert into public.cities (name_uz, is_active) values
  ('RLS test shahar', true),
  ('RLS test yopiq shahar', false);

insert into public.stations (city_id, name, address, location)
  select id, 'RLS test vokzal', 'RLS manzil', 'SRID=4326;POINT(69.24 41.31)'::geography
  from public.cities where name_uz = 'RLS test shahar';

insert into public.routes (station_id, destination_name, fare_min, fare_max, duration_min)
  select id, 'RLS test yoʻnalish', 40000, 60000, 120
  from public.stations where name = 'RLS test vokzal';

insert into public.drivers (user_id, license_number, license_photo_path, status)
  values ('d0000000-0000-4000-8000-000000000003', 'RLS-LIC-1', 'rls/lic.jpg', 'approved');

insert into public.vehicles (driver_id, model, color, plate_number, seats_total)
  values ('d0000000-0000-4000-8000-000000000003', 'Cobalt', 'oq', 'RLS001AA', 4);

insert into public.queue_entries (route_id, vehicle_id, driver_id, seats_total, fare)
  select r.id, v.id, 'd0000000-0000-4000-8000-000000000003', 4, 50000
  from public.routes r, public.vehicles v
  where r.destination_name = 'RLS test yoʻnalish' and v.plate_number = 'RLS001AA';

insert into public.bookings (passenger_id, queue_entry_id, seats, fare_per_seat, status,
                             wait_minutes, expires_at, idempotency_key)
  select 'a0000000-0000-4000-8000-000000000001', q.id, 1, 50000, 'active', 5,
         now() + interval '5 minutes', 'aaaaaaaa-0000-4000-8000-000000000001'
  from public.queue_entries q where q.driver_id = 'd0000000-0000-4000-8000-000000000003';

insert into public.bookings (passenger_id, queue_entry_id, seats, fare_per_seat, status,
                             wait_minutes, expires_at, idempotency_key)
  select 'b0000000-0000-4000-8000-000000000002', q.id, 1, 50000, 'active', 5,
         now() + interval '5 minutes', 'bbbbbbbb-0000-4000-8000-000000000002'
  from public.queue_entries q where q.driver_id = 'd0000000-0000-4000-8000-000000000003';

insert into public.notifications (user_id, type, payload) values
  ('a0000000-0000-4000-8000-000000000001', 'rls_test', '{}'::jsonb),
  ('b0000000-0000-4000-8000-000000000002', 'rls_test', '{}'::jsonb);

insert into public.settings (key, value) values ('rls.test', '1'::jsonb);

-- ===== anon =====
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is((select count(*) from public.cities where name_uz = 'RLS test shahar'), 1::bigint,
  'anon faol shaharni koʻradi');
select is((select count(*) from public.cities where name_uz = 'RLS test yopiq shahar'), 0::bigint,
  'anon nofaol shaharni koʻrmaydi');
select is((select count(*) from public.stations where name = 'RLS test vokzal'), 1::bigint,
  'anon faol vokzalni koʻradi');
select is((select count(*) from public.routes where destination_name = 'RLS test yoʻnalish'), 1::bigint,
  'anon faol yoʻnalishni koʻradi');
select throws_ok($$select * from public.bookings$$, '42501', null,
  'anon bookings jadvalini oʻqiy olmaydi');
select throws_ok($$select * from public.queue_entries$$, '42501', null,
  'anon queue_entries jadvalini oʻqiy olmaydi');
select throws_ok($$select * from public.settings$$, '42501', null,
  'anon settings jadvalini oʻqiy olmaydi');
select throws_ok($$select * from public.profiles$$, '42501', null,
  'anon profiles jadvalini oʻqiy olmaydi');

-- ===== A yoʻlovchi =====
reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

select is((select count(*) from public.bookings), 1::bigint,
  'A faqat oʻzining bandini koʻradi');
select is((select count(*) from public.bookings
           where passenger_id = 'b0000000-0000-4000-8000-000000000002'), 0::bigint,
  'A yoʻlovchi B yoʻlovchining bandini koʻrmaydi');
select is((select count(*) from public.profiles), 1::bigint,
  'A faqat oʻz profilini koʻradi');
select throws_ok(
  $$update public.profiles set role = 'admin' where id = 'a0000000-0000-4000-8000-000000000001'$$,
  '42501', null, 'foydalanuvchi profiles.role ni oʻzgartira olmaydi');
select lives_ok(
  $$update public.profiles set full_name = 'A yangi ism' where id = 'a0000000-0000-4000-8000-000000000001'$$,
  'foydalanuvchi oʻz ismini yangilay oladi');
select is((select full_name from public.profiles), 'A yangi ism',
  'ism haqiqatan yangilangan');
select lives_ok(
  $$update public.profiles set full_name = 'Hack' where id = 'b0000000-0000-4000-8000-000000000002'$$,
  'boshqa profilni yangilash xatosiz, lekin 0 qatorga taʼsir qiladi');
select throws_ok($$select * from public.queue_entries$$, '42501', null,
  'authenticated queue_entries dan toʻgʻridan-toʻgʻri oʻqiy olmaydi');
select is((select count(*) from public.settings where key = 'rls.test'), 1::bigint,
  'authenticated settings ni oʻqiy oladi');
select throws_ok($$update public.settings set value = '2'::jsonb where key = 'rls.test'$$,
  '42501', null, 'settings ni yangilab boʻlmaydi');
select throws_ok($$insert into public.settings (key, value) values ('rls.x', '1'::jsonb)$$,
  '42501', null, 'settings ga yozib boʻlmaydi');
select throws_ok(
  $$insert into public.bookings (passenger_id, queue_entry_id, seats, fare_per_seat, status, expires_at)
    values ('a0000000-0000-4000-8000-000000000001', gen_random_uuid(), 1, 1, 'active', now())$$,
  '42501', null, 'bookings ga toʻgʻridan-toʻgʻri yozib boʻlmaydi');
select is((select count(*) from public.vehicles), 0::bigint,
  'yoʻlovchi vehicles ni koʻrmaydi');
select is((select count(*) from public.drivers), 0::bigint,
  'yoʻlovchi drivers ni koʻrmaydi');
select is((select count(*) from public.notifications), 1::bigint,
  'A faqat oʻz bildirishnomasini koʻradi');
select throws_ok(
  $$insert into public.notifications (user_id, type, payload)
    values ('a0000000-0000-4000-8000-000000000001', 'x', '{}'::jsonb)$$,
  '42501', null, 'notifications ga yozib boʻlmaydi');

-- ===== D haydovchi =====
reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"d0000000-0000-4000-8000-000000000003","role":"authenticated"}', true);

select is((select count(*) from public.vehicles), 1::bigint,
  'haydovchi oʻz mashinasini koʻradi');
select is((select count(*) from public.drivers), 1::bigint,
  'haydovchi oʻz haydovchi yozuvini koʻradi');
select is((select count(*) from public.bookings), 0::bigint,
  'haydovchi yoʻlovchilar bandini bookings dan koʻrmaydi');

-- ===== postgres: B ning ismi oʻzgarmaganini tekshirish =====
reset role;
select is((select full_name from public.profiles
           where id = 'b0000000-0000-4000-8000-000000000002'), 'B yoʻlovchi',
  'A, B ning profilini oʻzgartira olmagan');

select * from finish();
rollback;