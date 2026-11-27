-- Test ma'lumotlari (seed). `supabase db reset` avtomatik ishga tushiradi.
-- Takror ishga tushirilganda xato bermaydi va dublikat yaratmaydi.
-- Foydalanuvchilar bu yerda YARATILMAYDI: ular ilovada sinov raqamlari bilan
-- ro'yxatdan o'tadi (docs/test-accounts.md).

-- 1) Shahar
insert into public.cities (name_uz, is_active)
select 'Toshkent', true
where not exists (
  select 1 from public.cities where name_uz = 'Toshkent'
);

-- 2) Vokzal
-- DIQQAT: koordinata TAXMINIY (lat 41.30, lng 69.27). Keyin haqiqiy vokzal
-- koordinatasiga almashtiriladi (yangi migratsiya yoki qo'lda UPDATE orqali).
-- WKT tartibi: POINT(longitude latitude).
insert into public.stations (city_id, name, address, location, radius_m, is_active)
select
  c.id,
  'Toshkent avtovokzali',
  'Toshkent shahri, avtovokzal (taxminiy manzil)',
  'SRID=4326;POINT(69.27 41.30)'::geography,
  500,
  true
from public.cities c
where c.name_uz = 'Toshkent'
  and not exists (
    select 1
    from public.stations s
    where s.city_id = c.id
      and s.name = 'Toshkent avtovokzali'
  );

-- 3) Yo'nalishlar
-- DIQQAT: narx (so'mda) va davomiylik (daqiqada) TAXMINIY qiymatlar.
-- Dollar-tirnoq ($$...$$) apostrofli nomlar (Farg'ona) uchun ishlatilgan.
insert into public.routes (station_id, destination_name, fare_min, fare_max, duration_min, is_active)
select
  s.id,
  r.destination_name,
  r.fare_min,
  r.fare_max,
  r.duration_min,
  true
from public.stations s
cross join (
  values
    ($$Samarqand$$, 100000, 140000, 240),
    ($$Buxoro$$,    150000, 200000, 420),
    ($$Farg'ona$$,   90000, 130000, 300)
) as r (destination_name, fare_min, fare_max, duration_min)
where s.name = 'Toshkent avtovokzali'
  and not exists (
    select 1
    from public.routes x
    where x.station_id = s.id
      and x.destination_name = r.destination_name
  );