-- 8-qism: haydovchi navbatga qo'shilishi, chiqishi va yo'lga chiqishi.

create schema if not exists private;

-- ---------------------------------------------------------------
-- Yordamchi: yozuvning faol bandlarini bekor qiladi va yo'lovchilarga
-- xabar yozadi. Qaytaradi: bekor qilingan bandlar soni.
-- Chaqiruvchi funksiya avval queue_entries'ni FOR UPDATE bilan bloklagan
-- bo'lishi shart (qulflash tartibi: queue_entries -> bookings).
-- ---------------------------------------------------------------
create or replace function private.cancel_entry_bookings(
  p_entry_id uuid,
  p_reason text
) returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  with cancelled as (
    update public.bookings
       set status = 'cancelled',
           cancel_reason = p_reason,
           closed_at = now()
     where queue_entry_id = p_entry_id
       and status = 'active'
    returning id, passenger_id
  )
  insert into public.notifications (user_id, type, payload)
  select c.passenger_id,
         'booking.cancelled',
         jsonb_build_object('booking_id', c.id, 'reason', p_reason)
    from cancelled c;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function private.cancel_entry_bookings(uuid, text)
  from public, anon, authenticated;

-- ---------------------------------------------------------------
-- 1) Haydovchi navbatga qo'shiladi
-- ---------------------------------------------------------------
create or replace function public.driver_join_queue(
  p_route_id uuid,
  p_vehicle_id uuid,
  p_seats_total int,
  p_fare int,
  p_lat double precision default null,
  p_lng double precision default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_driver_status text;
  v_vehicle public.vehicles%rowtype;
  v_route public.routes%rowtype;
  v_station public.stations%rowtype;
  v_geofence boolean;
  v_entry_id uuid;
  v_position int;
begin
  if v_uid is null then
    raise exception using errcode = 'PT401', message = 'UNAUTHENTICATED';
  end if;

  -- Rol va haydovchi holati
  select d.status into v_driver_status
    from public.drivers d
    join public.profiles p on p.id = d.user_id
   where d.user_id = v_uid
     and p.role = 'driver';
  if not found then
    raise exception using errcode = 'PT403', message = 'FORBIDDEN';
  end if;
  if v_driver_status <> 'approved' then
    raise exception using errcode = 'PT403', message = 'DRIVER_NOT_APPROVED';
  end if;

  -- Mashina shu haydovchiniki va faol
  select * into v_vehicle
    from public.vehicles
   where id = p_vehicle_id
     and driver_id = v_uid
     and is_active;
  if not found then
    raise exception using errcode = 'PT404', message = 'NOT_FOUND';
  end if;

  -- Yo'nalish va vokzal faol
  select * into v_route
    from public.routes
   where id = p_route_id
     and is_active;
  if not found then
    raise exception using errcode = 'PT404', message = 'NOT_FOUND';
  end if;

  select * into v_station
    from public.stations
   where id = v_route.station_id
     and is_active;
  if not found then
    raise exception using errcode = 'PT404', message = 'NOT_FOUND';
  end if;

  -- O'rindiqlar va narx
  if p_seats_total is null or p_seats_total < 1 or p_seats_total > v_vehicle.seats_total then
    raise exception using errcode = 'PT422', message = 'SEATS_INVALID';
  end if;
  if p_fare is null or p_fare < v_route.fare_min or p_fare > v_route.fare_max then
    raise exception using errcode = 'PT422', message = 'FARE_OUT_OF_RANGE';
  end if;

  -- Hudud (geofence) tekshiruvi
  select (value #>> '{}')::boolean into v_geofence
    from public.settings
   where key = 'queue.geofence_enabled';
  v_geofence := coalesce(v_geofence, false);

  if v_geofence then
    if p_lat is null or p_lng is null
       or not extensions.st_dwithin(
            v_station.location,
            extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography,
            v_station.radius_m
          )
    then
      raise exception using errcode = 'PT403', message = 'OUTSIDE_STATION_AREA';
    end if;
  end if;

  -- Allaqachon faol navbatdami? (oldindan tekshiruv)
  if exists (
    select 1 from public.queue_entries
     where driver_id = v_uid and status = 'active'
  ) then
    raise exception using errcode = 'PT409', message = 'ALREADY_IN_QUEUE';
  end if;

  -- Yozish; parallel so'rovda unikal indeks buzilsa ham shu kod
  begin
    insert into public.queue_entries (
      route_id, vehicle_id, driver_id, status,
      joined_at, seats_total, seats_occupied, fare
    ) values (
      p_route_id, p_vehicle_id, v_uid, 'active',
      now(), p_seats_total, 0, p_fare
    )
    returning id into v_entry_id;
  exception
    when unique_violation then
      raise exception using errcode = 'PT409', message = 'ALREADY_IN_QUEUE';
  end;

  -- Navbat o'rni hisoblanadi (saqlanmaydi)
  select q.pos into v_position
    from (
      select id,
             row_number() over (order by joined_at, id) as pos
        from public.queue_entries
       where route_id = p_route_id
         and status = 'active'
    ) q
   where q.id = v_entry_id;

  return jsonb_build_object('entry_id', v_entry_id, 'queue_position', v_position);
end;
$$;

-- ---------------------------------------------------------------
-- 2) Haydovchi navbatdan chiqadi
-- ---------------------------------------------------------------
create or replace function public.driver_leave_queue()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_entry public.queue_entries%rowtype;
  v_cancelled int;
begin
  if v_uid is null then
    raise exception using errcode = 'PT401', message = 'UNAUTHENTICATED';
  end if;

  if not exists (
    select 1 from public.profiles where id = v_uid and role = 'driver'
  ) then
    raise exception using errcode = 'PT403', message = 'FORBIDDEN';
  end if;

  -- 1-qulf: navbat yozuvi
  select * into v_entry
    from public.queue_entries
   where driver_id = v_uid and status = 'active'
   for update;
  if not found then
    raise exception using errcode = 'PT404', message = 'NOT_FOUND';
  end if;

  update public.queue_entries
     set status = 'left'
   where id = v_entry.id;

  -- 2-qulf: bandlar (yordamchi ichida)
  v_cancelled := private.cancel_entry_bookings(v_entry.id, 'driver_left');

  return jsonb_build_object('entry_id', v_entry.id, 'cancelled_bookings', v_cancelled);
end;
$$;

-- ---------------------------------------------------------------
-- 3) Haydovchi yo'lga chiqdi
-- ---------------------------------------------------------------
create or replace function public.driver_depart(p_force boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_entry public.queue_entries%rowtype;
  v_pending int;
  v_cancelled int;
begin
  if v_uid is null then
    raise exception using errcode = 'PT401', message = 'UNAUTHENTICATED';
  end if;

  if not exists (
    select 1 from public.profiles where id = v_uid and role = 'driver'
  ) then
    raise exception using errcode = 'PT403', message = 'FORBIDDEN';
  end if;

  -- 1-qulf: navbat yozuvi
  select * into v_entry
    from public.queue_entries
   where driver_id = v_uid and status = 'active'
   for update;
  if not found then
    raise exception using errcode = 'PT404', message = 'NOT_FOUND';
  end if;

  -- Faol va muddati o'tmagan bandlar soni
  select count(*) into v_pending
    from public.bookings
   where queue_entry_id = v_entry.id
     and status = 'active'
     and expires_at > now();

  if v_pending > 0 and not p_force then
    raise exception using
      errcode = 'PT409',
      message = 'ACTIVE_BOOKINGS_PENDING',
      detail = jsonb_build_object('pending', v_pending)::text;
  end if;

  update public.queue_entries
     set status = 'departed',
         departed_at = now()
   where id = v_entry.id;

  -- Qolgan faol bandlar bekor qilinadi, yo'lovchilarga xabar yoziladi
  v_cancelled := private.cancel_entry_bookings(v_entry.id, 'driver_departed');

  -- Eslatma: navbat siljishi uchun alohida kod kerak emas. Tartib
  -- saqlanmaydi, har safar row_number() bilan faqat status = 'active'
  -- yozuvlar orasida hisoblanadi; yozuv 'departed' bo'lishi bilan
  -- keyingi mashinalarning o'rni o'zi bittaga oldinga suriladi.

  return jsonb_build_object('entry_id', v_entry.id, 'cancelled_bookings', v_cancelled);
end;
$$;

-- ---------------------------------------------------------------
-- Ruxsatlar: faqat authenticated
-- ---------------------------------------------------------------
revoke execute on function public.driver_join_queue(uuid, uuid, int, int, double precision, double precision)
  from public, anon;
grant execute on function public.driver_join_queue(uuid, uuid, int, int, double precision, double precision)
  to authenticated;

revoke execute on function public.driver_leave_queue() from public, anon;
grant execute on function public.driver_leave_queue() to authenticated;

revoke execute on function public.driver_depart(boolean) from public, anon;
grant execute on function public.driver_depart(boolean) to authenticated;