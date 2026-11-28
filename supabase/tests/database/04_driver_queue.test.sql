begin;
create extension if not exists pgtap with schema extensions;

select plan(17);

-- ---------------------------------------------------------------
-- Test ma'lumotlari (postgres huquqida, RLS'siz)
-- ---------------------------------------------------------------
insert into auth.users (id, phone, aud, role) values
  ('00000000-0000-0000-0000-0000000000d1', '+998900000001', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000d2', '+998900000002', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000d3', '+998900000003', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a1', '+998900000011', 'authenticated', 'authenticated');

insert into public.profiles (id, phone, full_name, role) values
  ('00000000-0000-0000-0000-0000000000d1', '+998900000001', 'Haydovchi Bir', 'driver'),
  ('00000000-0000-0000-0000-0000000000d2', '+998900000002', 'Haydovchi Ikki', 'driver'),
  ('00000000-0000-0000-0000-0000000000d3', '+998900000003', 'Haydovchi Uch', 'driver'),
  ('00000000-0000-0000-0000-0000000000a1', '+998900000011', 'Yolovchi Bir', 'passenger')
on conflict (id) do update
  set role = excluded.role, full_name = excluded.full_name;

insert into public.drivers (user_id, license_number, status) values
  ('00000000-0000-0000-0000-0000000000d1', 'AA0000001', 'approved'),
  ('00000000-0000-0000-0000-0000000000d2', 'AA0000002', 'pending'),
  ('00000000-0000-0000-0000-0000000000d3', 'AA0000003', 'approved');

insert into public.vehicles (id, driver_id, model, color, plate_number, seats_total, is_active) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000d1', 'Cobalt', 'Oq', 'T01AAA01', 4, true),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000d2', 'Nexia', 'Qora', 'T02BBB02', 4, true),
  ('00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-0000000000d3', 'Gentra', 'Kulrang', 'T03CCC03', 4, true);

insert into public.cities (id, name_uz, is_active) values
  ('00000000-0000-0000-0000-0000000000c1', 'Test shahar', true);

insert into public.stations (id, city_id, name, address, location, radius_m, is_active) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000c1',
   'Test vokzal', 'Test manzil',
   extensions.st_setsrid(extensions.st_makepoint(69.2401, 41.2995), 4326)::extensions.geography,
   300, true);

insert into public.routes (id, station_id, destination_name, fare_min, fare_max, duration_min, is_active) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000f1',
   'Test manzil', 50000, 100000, 180, true);

-- Geofence boshida o'chiq
insert into public.settings (key, value) values ('queue.geofence_enabled', 'false'::jsonb)
on conflict (key) do update set value = 'false'::jsonb;

-- Foydalanuvchi sifatida kirish uchun yordamchi (faqat shu tranzaksiya)
create function pg_temp.act_as(p_uid uuid) returns void
language plpgsql as $f$
begin
  perform set_config('request.jwt.claim.sub', p_uid::text, true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end;
$f$;

-- ---------------------------------------------------------------
-- 1) Tasdiqlanmagan haydovchi
-- ---------------------------------------------------------------
reset role;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d2');
select throws_ok(
  $$ select public.driver_join_queue('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000e2', 4, 70000) $$,
  'PT403', 'DRIVER_NOT_APPROVED', 'tasdiqlanmagan haydovchi qo''shila olmaydi'
);

-- ---------------------------------------------------------------
-- 2-3) Narx va o'rindiq chegaralari
-- ---------------------------------------------------------------
reset role;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');
select throws_ok(
  $$ select public.driver_join_queue('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000e1', 4, 100001) $$,
  'PT422', 'FARE_OUT_OF_RANGE', 'narx chegaradan tashqarida'
);
select throws_ok(
  $$ select public.driver_join_queue('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000e1', 5, 70000) $$,
  'PT422', 'SEATS_INVALID', 'o''rindiqlar soni mashinadan ko''p'
);

-- ---------------------------------------------------------------
-- 4-5) Muvaffaqiyatli qo'shilish
-- ---------------------------------------------------------------
select is(
  (select (public.driver_join_queue('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000e1', 4, 70000)->>'queue_position')::int),
  1,
  'haydovchi navbatga 1-o''rinda qo''shildi'
);

reset role;
select is(
  (select status || ':' || seats_occupied::text from public.queue_entries
    where driver_id = '00000000-0000-0000-0000-0000000000d1'),
  'active:0',
  'yozuv active va seats_occupied = 0'
);

-- ---------------------------------------------------------------
-- 6) Ikkinchi marta qo'shilish
-- ---------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');
select throws_ok(
  $$ select public.driver_join_queue('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000e1', 4, 70000) $$,
  'PT409', 'ALREADY_IN_QUEUE', 'ikkinchi marta qo''shilish mumkin emas'
);

-- ---------------------------------------------------------------
-- Faol band yaratish (postgres huquqida)
-- ---------------------------------------------------------------
reset role;
insert into public.bookings (
  id, passenger_id, queue_entry_id, seats, fare_per_seat,
  status, wait_minutes, expires_at, idempotency_key
)
select '00000000-0000-0000-0000-0000000000aa',
       '00000000-0000-0000-0000-0000000000a1',
       qe.id, 1, 70000, 'active', 30, now() + interval '30 minutes',
       '00000000-0000-0000-0000-0000000000ab'
  from public.queue_entries qe
 where qe.driver_id = '00000000-0000-0000-0000-0000000000d1'
   and qe.status = 'active';

-- ---------------------------------------------------------------
-- 7-8) driver_depart p_force = false
-- ---------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');
select throws_ok(
  $$ select public.driver_depart(false) $$,
  'PT409', 'ACTIVE_BOOKINGS_PENDING', 'faol band bilan p_force=false rad etiladi'
);

reset role;
select is(
  (select status from public.bookings where id = '00000000-0000-0000-0000-0000000000aa'),
  'active',
  'rad etilgandan keyin band o''zgarmagan'
);

-- ---------------------------------------------------------------
-- 9-12) driver_depart p_force = true
-- ---------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');
select lives_ok(
  $$ select public.driver_depart(true) $$,
  'p_force=true bilan yo''lga chiqish ishladi'
);

reset role;
select is(
  (select status || ':' || (departed_at is not null)::text from public.queue_entries
    where driver_id = '00000000-0000-0000-0000-0000000000d1'),
  'departed:true',
  'yozuv departed va departed_at to''ldirilgan'
);
select is(
  (select status || ':' || cancel_reason from public.bookings
    where id = '00000000-0000-0000-0000-0000000000aa'),
  'cancelled:driver_departed',
  'band driver_departed bilan bekor qilindi'
);
select is(
  (select count(*)::int from public.notifications
    where user_id = '00000000-0000-0000-0000-0000000000a1'
      and type = 'booking.cancelled'
      and payload->>'booking_id' = '00000000-0000-0000-0000-0000000000aa'
      and payload->>'reason' = 'driver_departed'),
  1,
  'yo''lovchiga bitta xabar yozildi'
);

-- ---------------------------------------------------------------
-- 13) Chiqqandan keyin qayta qo'shilish
-- ---------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');
select is(
  (select (public.driver_join_queue('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000e1', 4, 70000)->>'queue_position')::int),
  1,
  'yo''lga chiqqandan keyin qayta qo''shilish mumkin'
);

-- ---------------------------------------------------------------
-- 14-16) Geofence yoqilgan
-- ---------------------------------------------------------------
reset role;
update public.settings set value = 'true'::jsonb where key = 'queue.geofence_enabled';

select pg_temp.act_as('00000000-0000-0000-0000-0000000000d3');
select throws_ok(
  $$ select public.driver_join_queue('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000e3', 4, 70000) $$,
  'PT403', 'OUTSIDE_STATION_AREA', 'koordinata berilmasa rad etiladi'
);
select throws_ok(
  $$ select public.driver_join_queue('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000e3', 4, 70000, 41.3100, 69.3000) $$,
  'PT403', 'OUTSIDE_STATION_AREA', 'vokzaldan uzoqda rad etiladi'
);
select isnt(
  (select public.driver_join_queue('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000e3', 4, 70000, 41.2995, 69.2401)->>'entry_id'),
  null,
  'vokzal hududida muvaffaqiyatli qo''shildi'
);

-- ---------------------------------------------------------------
-- 17) driver_leave_queue
-- ---------------------------------------------------------------
select public.driver_leave_queue();
reset role;
select is(
  (select status from public.queue_entries
    where driver_id = '00000000-0000-0000-0000-0000000000d3'),
  'left',
  'navbatdan chiqqach yozuv left bo''ldi'
);

select * from finish();
rollback;