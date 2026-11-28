begin;
select plan(32);

-- Yordamchi: berilgan foydalanuvchi sifatida ishlash (authenticated + JWT claims)
create function pg_temp.as_user(p_id uuid) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end;
$$;

-- ============================================================
-- Ma'lumotlarni tayyorlash (postgres sifatida)
-- ============================================================
-- Foydalanuvchilar: D1..D4 haydovchi, P1..P4 yo'lovchi
insert into auth.users (id, aud, role, phone)
values
  ('00000000-0000-0000-0000-0000000000d1', 'authenticated', 'authenticated', '+998900000011'),
  ('00000000-0000-0000-0000-0000000000d2', 'authenticated', 'authenticated', '+998900000012'),
  ('00000000-0000-0000-0000-0000000000d3', 'authenticated', 'authenticated', '+998900000013'),
  ('00000000-0000-0000-0000-0000000000d4', 'authenticated', 'authenticated', '+998900000014'),
  ('00000000-0000-0000-0000-0000000000a1', 'authenticated', 'authenticated', '+998900000001'),
  ('00000000-0000-0000-0000-0000000000a2', 'authenticated', 'authenticated', '+998900000002'),
  ('00000000-0000-0000-0000-0000000000a3', 'authenticated', 'authenticated', '+998900000003'),
  ('00000000-0000-0000-0000-0000000000a4', 'authenticated', 'authenticated', '+998900000004')
on conflict (id) do nothing;

insert into public.profiles (id, phone, full_name, role)
values
  ('00000000-0000-0000-0000-0000000000d1', '+998900000011', 'Haydovchi Bir',  'driver'),
  ('00000000-0000-0000-0000-0000000000d2', '+998900000012', 'Haydovchi Ikki', 'driver'),
  ('00000000-0000-0000-0000-0000000000d3', '+998900000013', 'Haydovchi Uch',  'driver'),
  ('00000000-0000-0000-0000-0000000000d4', '+998900000014', 'Haydovchi Turt', 'driver'),
  ('00000000-0000-0000-0000-0000000000a1', '+998900000001', 'Yolovchi Bir',   'passenger'),
  ('00000000-0000-0000-0000-0000000000a2', '+998900000002', 'Yolovchi Ikki',  'passenger'),
  ('00000000-0000-0000-0000-0000000000a3', '+998900000003', 'Yolovchi Uch',   'passenger'),
  ('00000000-0000-0000-0000-0000000000a4', '+998900000004', 'Yolovchi Turt',  'passenger')
on conflict (id) do update
  set phone = excluded.phone, full_name = excluded.full_name, role = excluded.role;

insert into public.drivers (user_id, license_number, status)
values
  ('00000000-0000-0000-0000-0000000000d1', 'LIC1', 'approved'),
  ('00000000-0000-0000-0000-0000000000d2', 'LIC2', 'approved'),
  ('00000000-0000-0000-0000-0000000000d3', 'LIC3', 'approved'),
  ('00000000-0000-0000-0000-0000000000d4', 'LIC4', 'approved');

insert into public.vehicles (id, driver_id, model, color, plate_number, seats_total, is_active)
values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000d1', 'Cobalt', 'Oq',   '01A111AA', 4, true),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000d2', 'Nexia',  'Qora', '01B222BB', 4, true),
  ('00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-0000000000d3', 'Gentra', 'Kul',  '01C333CC', 4, true);

insert into public.cities (id, name_uz, is_active)
values ('00000000-0000-0000-0000-0000000000c1', 'Nukus', true);

insert into public.stations (id, city_id, name, address, location)
values ('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-0000000000c1',
        'Vokzal', 'Vokzal kochasi', 'SRID=4326;POINT(59.6 42.46)'::geography);

insert into public.routes (id, station_id, destination_name, fare_min, fare_max, duration_min)
values ('00000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000051',
        'Xiva', 50000, 150000, 240);

-- Navbat: D1 (1-o'rin), D2 (2-o'rin), D3 (3-o'rin). D2: 1 o'rindiq band (seated)
insert into public.queue_entries
  (id, route_id, vehicle_id, driver_id, status, joined_at, seats_total, seats_occupied, fare)
values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-000000000071',
   '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000d1',
   'active', now() - interval '30 minutes', 4, 0, 100000),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-000000000071',
   '00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000d2',
   'active', now() - interval '20 minutes', 4, 1, 100000),
  ('00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-000000000071',
   '00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-0000000000d3',
   'active', now() - interval '10 minutes', 4, 0, 100000);

-- Bandlar (book_seat hali yo'q: to'g'ridan-to'g'ri insert)
--   B1: P1 -> E2, 2 o'rin, faol         (Keldi bosiladi)
--   B2: P2 -> E2, 1 o'rin, faol
--   B3: P3 -> E2, 1 o'rin, MUDDATI O'TGAN
--   B4: P4 -> E1, 1 o'rin, faol (boshqa haydovchiniki)
insert into public.bookings
  (id, passenger_id, queue_entry_id, seats, fare_per_seat, status, wait_minutes, expires_at, idempotency_key)
values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1',
   '00000000-0000-0000-0000-0000000000f2', 2, 100000, 'active', 15, now() + interval '10 minutes', gen_random_uuid()),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000a2',
   '00000000-0000-0000-0000-0000000000f2', 1, 100000, 'active', 5,  now() + interval '5 minutes',  gen_random_uuid()),
  ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-0000000000a3',
   '00000000-0000-0000-0000-0000000000f2', 1, 100000, 'active', 1,  now() - interval '1 minute',   gen_random_uuid()),
  ('00000000-0000-0000-0000-0000000000b4', '00000000-0000-0000-0000-0000000000a4',
   '00000000-0000-0000-0000-0000000000f1', 1, 100000, 'active', 15, now() + interval '10 minutes', gen_random_uuid());

-- E2: total 4, seated 1, booked 3 (B1 + B2; B3 muddati o'tgan), free 0

-- ============================================================
-- driver_change_seats
-- ============================================================
select pg_temp.as_user(null);
select throws_ok(
  $$ select public.driver_change_seats(1) $$,
  'PT401', 'UNAUTHENTICATED', 'change_seats: auth yo''q -> UNAUTHENTICATED');

reset role;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
select throws_ok(
  $$ select public.driver_change_seats(1) $$,
  'PT403', 'FORBIDDEN', 'change_seats: yo''lovchi -> FORBIDDEN');

reset role;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000d2');
select throws_ok(
  $$ select public.driver_change_seats(2) $$,
  'PT422', 'SEATS_INVALID', 'change_seats: delta = 2 -> SEATS_INVALID');
select throws_ok(
  $$ select public.driver_change_seats(0) $$,
  'PT422', 'SEATS_INVALID', 'change_seats: delta = 0 -> SEATS_INVALID');

-- +1 band qilingan joy hisobiga rad etiladi (free = 0)
select throws_ok(
  $$ select public.driver_change_seats(1) $$,
  'PT409', 'NO_FREE_SEAT_FOR_INCREMENT', '+1: band joy hisobiga rad etiladi');

-- -1: seated 1 -> 0
select is(
  public.driver_change_seats(-1)->'seats',
  '{"total":4,"seated":0,"booked":3,"free":1}'::jsonb,
  '-1: seated kamayadi, free oshadi');

-- +1: free = 1 > 0, seated 0 -> 1
select is(
  public.driver_change_seats(1)->'seats',
  '{"total":4,"seated":1,"booked":3,"free":0}'::jsonb,
  '+1: free > 0 bo''lganda ruxsat');

-- D1: seats_occupied = 0 -> -1 rad etiladi
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000d1');
select throws_ok(
  $$ select public.driver_change_seats(-1) $$,
  'PT422', 'SEATS_INVALID', '-1: seated = 0 bo''lsa SEATS_INVALID');

-- D1: +1 (total 4, seated 0, booked 1 -> free 3)
select is(
  public.driver_change_seats(1)->'seats',
  '{"total":4,"seated":1,"booked":1,"free":2}'::jsonb,
  '+1: bo''sh joy bor bo''lsa ruxsat (D1)');

-- ============================================================
-- driver_mark_arrived
-- ============================================================
reset role;
select is(private.seats_free('00000000-0000-0000-0000-0000000000f2'), 0,
  'Keldi oldidan: free = 0');

select pg_temp.as_user('00000000-0000-0000-0000-0000000000d2');
select lives_ok(
  $$ select public.driver_mark_arrived('00000000-0000-0000-0000-0000000000b1') $$,
  'Keldi: o''z faol bandi uchun ishlaydi');

reset role;
select is(private.seats_free('00000000-0000-0000-0000-0000000000f2'), 0,
  'Keldi bo''sh joy sonini o''zgartirmaydi');

select is(
  (select status from public.bookings
    where id = '00000000-0000-0000-0000-0000000000b1'
      and seated_at is not null and closed_at is not null),
  'seated', 'Keldi: band seated, seated_at va closed_at to''ldirilgan');

select is(
  (select seats_occupied from public.queue_entries
    where id = '00000000-0000-0000-0000-0000000000f2'),
  3, 'Keldi: seats_occupied band o''rindig''iga oshgan (1 + 2)');

select ok(
  exists (select 1 from public.notifications
           where user_id = '00000000-0000-0000-0000-0000000000a1'
             and type = 'booking.seated'),
  'Keldi: yo''lovchiga booking.seated bildirishnomasi');

select pg_temp.as_user('00000000-0000-0000-0000-0000000000d2');
select throws_ok(
  $$ select public.driver_mark_arrived('00000000-0000-0000-0000-0000000000b1') $$,
  'PT404', 'NOT_FOUND', 'Keldi: takror (seated band) -> NOT_FOUND');

select throws_ok(
  $$ select public.driver_mark_arrived('00000000-0000-0000-0000-0000000000b3') $$,
  'PT409', 'BOOKING_EXPIRED', 'Keldi: muddati o''tgan band rad etiladi');

select throws_ok(
  $$ select public.driver_mark_arrived('00000000-0000-0000-0000-0000000000b4') $$,
  'PT403', 'FORBIDDEN', 'Keldi: boshqa haydovchining bandi rad etiladi');

select throws_ok(
  $$ select public.driver_mark_arrived('00000000-0000-0000-0000-00000000ffff') $$,
  'PT404', 'NOT_FOUND', 'Keldi: mavjud bo''lmagan band -> NOT_FOUND');

reset role;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a2');
select throws_ok(
  $$ select public.driver_mark_arrived('00000000-0000-0000-0000-0000000000b2') $$,
  'PT403', 'FORBIDDEN', 'Keldi: yo''lovchi chaqira olmaydi');

-- ============================================================
-- get_driver_queue
-- ============================================================
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000d4');
select ok(public.get_driver_queue() is null, 'get_driver_queue: navbatda bo''lmasa null');

reset role;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
select throws_ok(
  $$ select public.get_driver_queue() $$,
  'PT403', 'FORBIDDEN', 'get_driver_queue: yo''lovchi -> FORBIDDEN');

-- D2 (o'rtadagi mashina)
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000d2');

select is(public.get_driver_queue()->'entry'->>'queue_position', '2',
  'queue_position = 2');
select is(public.get_driver_queue()->>'total_in_queue', '3',
  'total_in_queue = 3');
select is(public.get_driver_queue()->'before'->>'plate_number', '01A111AA',
  'before: bevosita oldingi mashina (D1)');
select is(public.get_driver_queue()->'after'->>'position', '3',
  'after: bevosita keyingi mashina (3-o''rin)');
select is(public.get_driver_queue()->'seats',
  '{"total":4,"seated":3,"booked":1,"free":0}'::jsonb,
  'seats: Keldi dan keyingi holat');
select is(jsonb_array_length(public.get_driver_queue()->'bookings'), 1,
  'bookings: faqat faol va muddati o''tmagan band (B2)');
select is(
  (public.get_driver_queue()->'bookings'->0) - 'booking_id' - 'expires_at' - 'seconds_left',
  '{"seats":1,"passenger_name":"Yolovchi Ikki","passenger_phone":"+998900000002"}'::jsonb,
  'bookings: yo''lovchi ismi, telefoni va o''rindiqlari');
select ok(
  (public.get_driver_queue()->'bookings'->0->>'seconds_left')::int between 1 and 300,
  'bookings: seconds_left to''g''ri oraliqda');

-- D1 (birinchi mashina)
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000d1');
select is(jsonb_typeof(public.get_driver_queue()->'before'), 'null',
  'birinchi mashinada before = null');
select is(public.get_driver_queue()->'after'->>'position', '2',
  'birinchi mashinada after = 2-o''rin');

reset role;
select * from finish();
rollback;