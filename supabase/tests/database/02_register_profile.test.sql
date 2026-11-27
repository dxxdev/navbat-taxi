begin;
select plan(11);

-- Test foydalanuvchilari (trigger profiles qatorini role = null bilan yaratadi)
insert into auth.users (id, phone) values
  ('11111111-1111-1111-1111-111111111111', '998900000001'),
  ('22222222-2222-2222-2222-222222222222', '998900000002');

-- === Foydalanuvchi A: muvaffaqiyat ===
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select is(
  (public.register_profile('passenger', '  Ali Valiyev  ')) ->> 'role',
  'passenger',
  'muvaffaqiyat: rol qaytariladi'
);

reset role;

select is(
  (select full_name from public.profiles
    where id = '11111111-1111-1111-1111-111111111111'),
  'Ali Valiyev',
  'ism trim qilinib saqlanadi'
);

select is(
  (select role from public.profiles
    where id = '11111111-1111-1111-1111-111111111111'),
  'passenger',
  'jadvalda rol yozilgan'
);

-- Takror chaqiruv
set local role authenticated;
select throws_ok(
  $$ select public.register_profile('driver', 'Boshqa Ism') $$,
  'PT409', 'PROFILE_EXISTS',
  'takror chaqiruv PROFILE_EXISTS beradi'
);

-- === Foydalanuvchi B: xato kirishlar ===
select set_config('request.jwt.claims',
  '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);

select throws_ok(
  $$ select public.register_profile('admin', 'Vali Aliyev') $$,
  'PT422', 'INVALID_ROLE',
  'noto''g''ri rol rad etiladi'
);

select throws_ok(
  $$ select public.register_profile('driver', 'A') $$,
  'PT422', 'INVALID_NAME',
  'juda qisqa ism rad etiladi'
);

select throws_ok(
  $$ select public.register_profile('driver', repeat('a', 61)) $$,
  'PT422', 'INVALID_NAME',
  'juda uzun ism rad etiladi'
);

select throws_ok(
  $$ select public.register_profile('driver', null) $$,
  'PT422', 'INVALID_NAME',
  'bo''sh (null) ism rad etiladi'
);

select is(
  (public.register_profile('driver', 'Vali Aliyev')) ->> 'role',
  'driver',
  'haydovchi roli ham muvaffaqiyatli tanlanadi'
);

-- === Autentifikatsiyasiz (JWT'da sub yo'q) ===
select set_config('request.jwt.claims', '', true);
select throws_ok(
  $$ select public.register_profile('passenger', 'Ali Valiyev') $$,
  'PT401', 'UNAUTHENTICATED',
  'sub yo''q bo''lsa UNAUTHENTICATED'
);

-- === anon chaqira olmaydi ===
reset role;
set local role anon;
select throws_ok(
  $$ select public.register_profile('passenger', 'Ali Valiyev') $$,
  '42501',
  null,
  'anon funksiyani chaqira olmaydi'
);

reset role;
select * from finish();
rollback;