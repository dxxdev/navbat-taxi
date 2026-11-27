begin;
select plan(13);

-- Test foydalanuvchilari (profil triggeri avtomatik yaratadi, role = null).
insert into auth.users (id, phone) values
  ('00000000-0000-0000-0000-0000000000a1', '+998900000001'), -- yo'lovchi
  ('00000000-0000-0000-0000-0000000000a2', '+998900000002'), -- haydovchi A
  ('00000000-0000-0000-0000-0000000000a3', '+998900000003'), -- haydovchi B
  ('00000000-0000-0000-0000-0000000000a4', '+998900000004'); -- haydovchi C

update public.profiles set role = 'passenger' where id = '00000000-0000-0000-0000-0000000000a1';
update public.profiles set role = 'driver'
 where id in ('00000000-0000-0000-0000-0000000000a2',
              '00000000-0000-0000-0000-0000000000a3',
              '00000000-0000-0000-0000-0000000000a4');

-- Bucket sozlamalari
select is((select public from storage.buckets where id = 'driver-documents'), false,
          'driver-documents bucket yopiq');
select is((select file_size_limit from storage.buckets where id = 'driver-documents'), 5242880::bigint,
          'bucket limiti 5 MB');

-- auto_approve = true bilan boshlaymiz
update public.settings set value = 'true'::jsonb where key = 'driver.auto_approve';

-- Autentifikatsiyasiz
set local role authenticated;
select set_config('request.jwt.claims', '', true);
select throws_ok(
  $$ select public.driver_register('AB123', 'x/l.jpg', '{}'::jsonb) $$,
  'PT401', 'UNAUTHENTICATED', 'kirmagan foydalanuvchi rad etiladi');

-- Yo'lovchi roli
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select throws_ok(
  $$ select public.driver_register('AB123',
       '00000000-0000-0000-0000-0000000000a1/l.jpg',
       '{"model":"Cobalt","color":"Oq","plate_number":"01A123BC","seats_total":4,
         "photo_path":"00000000-0000-0000-0000-0000000000a1/v.jpg"}'::jsonb) $$,
  'PT403', 'FORBIDDEN', 'yo''lovchi roli rad etiladi');

-- Haydovchi A: noto'g'ri o'rindiqlar soni
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
select throws_ok(
  $$ select public.driver_register('AB123',
       '00000000-0000-0000-0000-0000000000a2/l.jpg',
       '{"model":"Cobalt","color":"Oq","plate_number":"01A123BC","seats_total":9,
         "photo_path":"00000000-0000-0000-0000-0000000000a2/v.jpg"}'::jsonb) $$,
  'PT422', 'SEATS_INVALID', 'o''rindiqlar 9 ta bo''lsa rad etiladi');

-- Begona papka yo'li
select throws_ok(
  $$ select public.driver_register('AB123',
       '00000000-0000-0000-0000-0000000000a3/l.jpg',
       '{"model":"Cobalt","color":"Oq","plate_number":"01A123BC","seats_total":4,
         "photo_path":"00000000-0000-0000-0000-0000000000a2/v.jpg"}'::jsonb) $$,
  'PT403', 'FORBIDDEN', 'begona papka yo''li rad etiladi');

-- Muvaffaqiyat (auto_approve = true) va raqam normallashuvi: " 01 a 123 bc "
select is(
  (select public.driver_register('AB123',
       '00000000-0000-0000-0000-0000000000a2/l.jpg',
       '{"model":"Cobalt","color":"Oq","plate_number":" 01 a 123 bc ","seats_total":4,
         "photo_path":"00000000-0000-0000-0000-0000000000a2/v.jpg"}'::jsonb)->>'driver_status'),
  'approved', 'auto_approve=true: darhol approved');

-- Takroriy ro'yxatdan o'tish
select throws_ok(
  $$ select public.driver_register('AB123',
       '00000000-0000-0000-0000-0000000000a2/l.jpg',
       '{"model":"Cobalt","color":"Oq","plate_number":"01Z999ZZ","seats_total":4,
         "photo_path":"00000000-0000-0000-0000-0000000000a2/v.jpg"}'::jsonb) $$,
  'PT409', 'PROFILE_EXISTS', 'ikkinchi marta ro''yxatdan o''tish rad etiladi');

-- Haydovchi B: takroriy raqam (boshqacha yozilgan)
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
select throws_ok(
  $$ select public.driver_register('CD456',
       '00000000-0000-0000-0000-0000000000a3/l.jpg',
       '{"model":"Nexia","color":"Qora","plate_number":"01a123bc","seats_total":4,
         "photo_path":"00000000-0000-0000-0000-0000000000a3/v.jpg"}'::jsonb) $$,
  'PT409', 'PLATE_TAKEN', 'takroriy davlat raqami rad etiladi');

-- A ning holati
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
select is((public.get_my_driver())->>'status', 'approved', 'get_my_driver holatni qaytaradi');

-- Yo'lovchida haydovchi yozuvi yo'q -> null
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select is(public.get_my_driver(), null::jsonb, 'yozuv bo''lmasa get_my_driver null');

-- Haydovchi C: auto_approve = false -> pending
reset role;
update public.settings set value = 'false'::jsonb where key = 'driver.auto_approve';
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
select is(
  (select public.driver_register('EF789',
       '00000000-0000-0000-0000-0000000000a4/l.jpg',
       '{"model":"Spark","color":"Kulrang","plate_number":"01B777CC","seats_total":3,
         "photo_path":"00000000-0000-0000-0000-0000000000a4/v.jpg"}'::jsonb)->>'driver_status'),
  'pending', 'auto_approve=false: pending');

-- Mashina yozuvi yaratilganini tekshirish (rolni tiklab)
reset role;
select is(
  (select plate_number from public.vehicles
    where driver_id = '00000000-0000-0000-0000-0000000000a2'),
  '01A123BC', 'mashina yaratildi, raqam normallashgan');

select * from finish();
rollback;