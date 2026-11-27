-- =====================================================================
-- NavbatTaksi: ma'lumotlar bazasi sxemasi (2-qism)
-- RLS bu migratsiyada YOQILMAGAN (4-qismda yoqiladi).
-- =====================================================================

-- ---------- 1. Kengaytmalar va sxemalar ----------
create extension if not exists postgis with schema extensions;

-- Yordamchi funksiyalar uchun sxema. API'ga chiqarilmaydi (config.toml'ga qo'shilmaydi).
create schema if not exists private;
revoke all on schema private from public;

-- ---------- 2. Jadvallar ----------

-- Shaharlar
create table public.cities (
  id         uuid primary key default gen_random_uuid(),
  name_uz    text not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- Profillar: Auth foydalanuvchisi o'chsa, profil ham o'chadi.
-- role = null: foydalanuvchi rolni ro'yxatdan o'tishda keyin tanlaydi.
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  phone      text,
  full_name  text,
  role       text,
  language   text not null default 'uz',
  created_at timestamptz not null default now(),
  constraint ck_profiles_role check (role in ('passenger', 'driver', 'dispatcher', 'admin')),
  constraint ck_profiles_language check (language in ('uz'))
);

-- Haydovchilar: profil o'chsa, haydovchi yozuvi ham o'chadi.
create table public.drivers (
  user_id            uuid primary key references public.profiles (id) on delete cascade,
  license_number     text not null,
  license_photo_path text,
  status             text not null default 'pending',
  created_at         timestamptz not null default now(),
  constraint ck_drivers_status check (status in ('pending', 'approved', 'blocked'))
);

-- Mashinalar: haydovchi o'chsa, mashinasi ham o'chadi.
create table public.vehicles (
  id           uuid primary key default gen_random_uuid(),
  driver_id    uuid not null references public.drivers (user_id) on delete cascade,
  model        text not null,
  color        text not null,
  plate_number text not null unique,
  seats_total  int not null,
  photo_path   text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  constraint ck_vehicles_seats check (seats_total between 1 and 8)
);

-- Vokzallar (bekatlar): shaharni o'chirish tarixiy ma'lumotni buzmasligi uchun restrict.
create table public.stations (
  id         uuid primary key default gen_random_uuid(),
  city_id    uuid not null references public.cities (id) on delete restrict,
  name       text not null,
  address    text,
  location   extensions.geography(Point, 4326) not null,
  radius_m   int not null default 300,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  constraint ck_stations_radius check (radius_m > 0)
);

-- Yo'nalishlar
create table public.routes (
  id               uuid primary key default gen_random_uuid(),
  station_id       uuid not null references public.stations (id) on delete restrict,
  destination_name text not null,
  fare_min         int not null,
  fare_max         int not null,
  duration_min     int not null,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  constraint ck_routes_fare check (fare_min >= 0 and fare_min <= fare_max),
  constraint ck_routes_duration check (duration_min > 0)
);

-- Navbat yozuvlari: tarix (bandlar) shularga bog'langan, shuning uchun restrict.
create table public.queue_entries (
  id             uuid primary key default gen_random_uuid(),
  route_id       uuid not null references public.routes (id) on delete restrict,
  vehicle_id     uuid not null references public.vehicles (id) on delete restrict,
  driver_id      uuid not null references public.drivers (user_id) on delete restrict,
  status         text not null default 'active',
  joined_at      timestamptz not null default now(),
  seats_total    int not null,
  seats_occupied int not null default 0,
  fare           int not null,
  departed_at    timestamptz,
  created_at     timestamptz not null default now(),
  constraint ck_queue_status check (status in ('active', 'paused', 'away', 'departed', 'left', 'removed')),
  constraint ck_queue_seats check (seats_occupied >= 0 and seats_occupied <= seats_total),
  constraint ck_queue_fare check (fare >= 0)
);

-- Bandlar: yo'lovchi profili o'chsa bandlari ham o'chadi (cascade),
-- navbat yozuvi esa tarix sifatida himoyalanadi (restrict).
create table public.bookings (
  id              uuid primary key default gen_random_uuid(),
  passenger_id    uuid not null references public.profiles (id) on delete cascade,
  queue_entry_id  uuid not null references public.queue_entries (id) on delete restrict,
  seats           int not null,
  fare_per_seat   int not null,
  status          text not null default 'active',
  wait_minutes    int not null,
  expires_at      timestamptz not null,
  seated_at       timestamptz,
  closed_at       timestamptz,
  cancel_reason   text,
  idempotency_key uuid not null,
  created_at      timestamptz not null default now(),
  constraint ck_bookings_seats check (seats between 1 and 4),
  constraint ck_bookings_fare check (fare_per_seat >= 0),
  constraint ck_bookings_wait check (wait_minutes > 0),
  constraint ck_bookings_status check (status in ('active', 'seated', 'expired', 'cancelled')),
  constraint ck_bookings_cancel_reason check (
    cancel_reason in ('passenger', 'driver_departed', 'driver_left', 'admin')
  )
);

-- Bildirishnomalar
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       text not null,
  payload    jsonb not null default '{}'::jsonb,
  status     text not null default 'pending',
  attempts   int not null default 0,
  created_at timestamptz not null default now(),
  sent_at    timestamptz,
  constraint ck_notifications_status check (status in ('pending', 'sent', 'failed')),
  constraint ck_notifications_attempts check (attempts >= 0)
);

-- Sozlamalar
create table public.settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------- 3. Indekslar va unikal cheklovlar ----------

-- Bir yo'lovchida bir vaqtda 1 ta faol band
create unique index uq_booking_one_active_per_passenger
  on public.bookings (passenger_id)
  where status = 'active';

-- Idempotentlik: takror so'rov yangi band yaratmasligi uchun
create unique index uq_booking_idempotency
  on public.bookings (passenger_id, idempotency_key);

-- Haydovchi bir vaqtda faqat 1 ta navbatda
create unique index uq_queue_one_per_driver
  on public.queue_entries (driver_id)
  where status in ('active', 'paused', 'away');

-- Mashina bir vaqtda faqat 1 ta navbatda
create unique index uq_queue_one_per_vehicle
  on public.queue_entries (vehicle_id)
  where status in ('active', 'paused', 'away');

-- Navbat tartibini hisoblash uchun
create index ix_queue_route_joined
  on public.queue_entries (route_id, joined_at)
  where status in ('active', 'paused', 'away');

-- Faol bandlar yig'indisini tez hisoblash uchun
create index ix_booking_entry_active
  on public.bookings (queue_entry_id)
  where status = 'active';

-- ---------- 4. Funksiyalar (private sxema) ----------

-- Sozlama qiymatini o'qiydi; topilmasa p_default qaytaradi.
create or replace function private.get_setting(p_key text, p_default jsonb default null)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select s.value from public.settings s where s.key = p_key),
    p_default
  );
$$;

-- Navbat yozuvidagi bo'sh o'rindiqlar soni.
-- Muddati o'tgan (expires_at <= now()) bandlar cron kechiksa ham hisobga olinmaydi.
-- Yozuv topilmasa null qaytaradi.
create or replace function private.seats_free(p_entry_id uuid)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select q.seats_total
         - q.seats_occupied
         - coalesce((
             select sum(b.seats)
             from public.bookings b
             where b.queue_entry_id = q.id
               and b.status = 'active'
               and b.expires_at > now()
           ), 0)::int
  from public.queue_entries q
  where q.id = p_entry_id;
$$;

-- Yordamchi funksiyalarni mijozdan yopamiz (kerak bo'lsa keyingi qismlarda ochiladi).
revoke execute on function private.get_setting(text, jsonb) from public, anon, authenticated;
revoke execute on function private.seats_free(uuid) from public, anon, authenticated;

-- ---------- 5. Triggerlar ----------

-- Yangi Auth foydalanuvchisi uchun profil yaratadi (role = null).
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, phone)
  values (new.id, new.phone)
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- settings.updated_at ni avtomatik yangilaydi.
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function private.set_updated_at() from public, anon, authenticated;

create trigger trg_settings_updated_at
  before update on public.settings
  for each row execute function private.set_updated_at();

-- ---------- 6. Boshlang'ich sozlamalar ----------
insert into public.settings (key, value) values
  ('booking.max_active_per_passenger', '1'::jsonb),
  ('booking.max_seats',                '4'::jsonb),
  ('booking.wait_options_min',         '[1, 5, 15, 30, 60]'::jsonb),
  ('driver.auto_approve',              'true'::jsonb),
  ('queue.geofence_enabled',           'false'::jsonb)
on conflict (key) do nothing;