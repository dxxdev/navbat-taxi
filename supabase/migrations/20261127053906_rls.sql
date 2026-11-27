-- 4-qism: RLS va ruxsatlar

-- 1) Supabase standart grant'larini olib tashlash
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- Kelajakdagi jadval/sequence'larga avtomatik grant berilmasin
-- (migratsiyani bajaruvchi rol, ya'ni postgres yaratadigan obyektlar uchun)
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;

-- 2) Yordamchi funksiyalar (private sxema)
create schema if not exists private;

-- Rolni JWT'dan emas, profiles jadvalidan o'qiydi
create or replace function private.my_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role::text
  from public.profiles p
  where p.id = (select auth.uid());
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.my_role() = 'admin', false);
$$;

revoke execute on function private.my_role()  from public, anon;
revoke execute on function private.is_admin() from public, anon;
grant  execute on function private.my_role()  to authenticated;
grant  execute on function private.is_admin() to authenticated;
-- Siyosatlar ichida chaqirilishi uchun sxemaga kirish kerak
grant usage on schema private to authenticated;

-- 3) RLS: public sxemadagi hamma jadvalda yoqiladi
alter table public.profiles      enable row level security;
alter table public.drivers       enable row level security;
alter table public.vehicles      enable row level security;
alter table public.cities        enable row level security;
alter table public.stations      enable row level security;
alter table public.routes        enable row level security;
alter table public.queue_entries enable row level security;
alter table public.bookings      enable row level security;
alter table public.notifications enable row level security;
alter table public.settings      enable row level security;

-- 4) Grant'lar (faqat kerakligi)
grant select on public.cities, public.stations, public.routes to anon, authenticated;

grant select on public.settings      to authenticated;
grant select on public.profiles      to authenticated;
grant select on public.drivers       to authenticated;
grant select on public.vehicles      to authenticated;
grant select on public.bookings      to authenticated;
grant select on public.notifications to authenticated;

-- Profilda faqat ism va til o'zgartiriladi (ustun darajasidagi grant)
grant update (full_name, language) on public.profiles to authenticated;

-- queue_entries: hech kimga grant yo'q (RPC orqali olinadi)

-- 5) Siyosatlar

-- Ochiq ma'lumotnomalar (faqat faol yozuvlar)
create policy cities_select_active on public.cities
  for select to anon, authenticated
  using (is_active);

create policy stations_select_active on public.stations
  for select to anon, authenticated
  using (is_active);

create policy routes_select_active on public.routes
  for select to anon, authenticated
  using (is_active);

-- Sozlamalar
create policy settings_select on public.settings
  for select to authenticated
  using (true);

-- Profil: faqat o'zinikini ko'radi va yangilaydi
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Haydovchi va mashina: faqat egasi
create policy drivers_select_own on public.drivers
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy vehicles_select_own on public.vehicles
  for select to authenticated
  using (driver_id = (select auth.uid()));

-- Bandlar: yo'lovchi faqat o'zinikini
create policy bookings_select_own on public.bookings
  for select to authenticated
  using (passenger_id = (select auth.uid()));

-- Bildirishnomalar: faqat o'zinikini
create policy notifications_select_own on public.notifications
  for select to authenticated
  using (user_id = (select auth.uid()));

-- queue_entries: siyosat yo'q va grant yo'q, mijoz to'g'ridan-to'g'ri o'qiy olmaydi