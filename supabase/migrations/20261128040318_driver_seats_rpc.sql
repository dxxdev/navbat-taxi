-- 9-qism: haydovchi o'rindiqlari, "Keldi" va navbat ko'rinishi

-- ============================================================
-- Yordamchi: joriy foydalanuvchi tasdiqlangan haydovchimi?
-- ============================================================
create or replace function private.current_approved_driver()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := auth.uid();
  v_role   text;
  v_status text;
begin
  if v_uid is null then
    raise exception using errcode = 'PT401', message = 'UNAUTHENTICATED';
  end if;

  select p.role into v_role from public.profiles p where p.id = v_uid;
  if v_role is distinct from 'driver' then
    raise exception using errcode = 'PT403', message = 'FORBIDDEN';
  end if;

  select d.status into v_status from public.drivers d where d.user_id = v_uid;
  if v_status is distinct from 'approved' then
    raise exception using errcode = 'PT403', message = 'DRIVER_NOT_APPROVED';
  end if;

  return v_uid;
end;
$$;

-- ============================================================
-- Yordamchi: {total, seated, booked, free}
-- ============================================================
create or replace function private.driver_seats_json(p_entry_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
           'total',  e.seats_total,
           'seated', e.seats_occupied,
           -- muddati o'tgan bandlar hisobga olinmaydi
           'booked', coalesce((
                       select sum(b.seats)
                       from public.bookings b
                       where b.queue_entry_id = e.id
                         and b.status = 'active'
                         and b.expires_at > now()
                     ), 0)::int,
           'free',   private.seats_free(e.id)
         )
    into v_result
  from public.queue_entries e
  where e.id = p_entry_id;

  return v_result;
end;
$$;

-- ============================================================
-- 1. driver_change_seats(+1 / -1)
-- ============================================================
create or replace function public.driver_change_seats(p_delta int)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid;
  v_entry public.queue_entries%rowtype;
begin
  v_uid := private.current_approved_driver();

  if p_delta is null or p_delta not in (1, -1) then
    raise exception using errcode = 'PT422', message = 'SEATS_INVALID';
  end if;

  -- O'z faol yozuvini bloklaymiz
  select * into v_entry
  from public.queue_entries qe
  where qe.driver_id = v_uid and qe.status = 'active'
  for update;

  if not found then
    raise exception using errcode = 'PT404', message = 'NOT_FOUND';
  end if;

  if p_delta = 1 then
    if private.seats_free(v_entry.id) <= 0 then
      raise exception using errcode = 'PT409', message = 'NO_FREE_SEAT_FOR_INCREMENT';
    end if;
  else
    if v_entry.seats_occupied <= 0 then
      raise exception using errcode = 'PT422', message = 'SEATS_INVALID';
    end if;
  end if;

  update public.queue_entries
     set seats_occupied = seats_occupied + p_delta
   where id = v_entry.id;

  return jsonb_build_object('seats', private.driver_seats_json(v_entry.id));
end;
$$;

-- ============================================================
-- 2. driver_mark_arrived(booking_id)
-- ============================================================
create or replace function public.driver_mark_arrived(p_booking_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid       uuid;
  v_entry_id  uuid;
  v_owner_id  uuid;
  v_entry     public.queue_entries%rowtype;
  v_booking   public.bookings%rowtype;
begin
  v_uid := private.current_approved_driver();

  -- Band orqali navbat yozuvini topamiz (hali qulfsiz)
  select b.queue_entry_id, qe.driver_id
    into v_entry_id, v_owner_id
  from public.bookings b
  join public.queue_entries qe on qe.id = b.queue_entry_id
  where b.id = p_booking_id;

  if not found then
    raise exception using errcode = 'PT404', message = 'NOT_FOUND';
  end if;

  -- Boshqa haydovchining bandi: qulflamasdan rad etamiz
  if v_owner_id <> v_uid then
    raise exception using errcode = 'PT403', message = 'FORBIDDEN';
  end if;

  -- Qulflash tartibi: avval yozuv, keyin band
  select * into v_entry
  from public.queue_entries qe
  where qe.id = v_entry_id
  for update;

  select * into v_booking
  from public.bookings b
  where b.id = p_booking_id
  for update;

  if not found or v_booking.status <> 'active' then
    raise exception using errcode = 'PT404', message = 'NOT_FOUND';
  end if;

  if v_booking.expires_at <= now() then
    raise exception using errcode = 'PT409', message = 'BOOKING_EXPIRED';
  end if;

  update public.bookings
     set status    = 'seated',
         seated_at = now(),
         closed_at = now()
   where id = v_booking.id;

  update public.queue_entries
     set seats_occupied = seats_occupied + v_booking.seats
   where id = v_entry.id;

  insert into public.notifications (user_id, type, payload, status)
  values (
    v_booking.passenger_id,
    'booking.seated',
    jsonb_build_object(
      'booking_id',     v_booking.id,
      'queue_entry_id', v_entry.id,
      'seats',          v_booking.seats
    ),
    'pending'
  );

  return jsonb_build_object(
    'booking_id', v_booking.id,
    'seats',      private.driver_seats_json(v_entry.id)
  );
end;
$$;

-- ============================================================
-- 3. get_driver_queue()
-- ============================================================
create or replace function public.get_driver_queue()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid       uuid;
  v_entry     public.queue_entries%rowtype;
  v_route     text;
  v_vehicle   jsonb;
  v_pos       int;
  v_total     int;
  v_before    jsonb;
  v_after     jsonb;
  v_bookings  jsonb;
begin
  v_uid := private.current_approved_driver();

  select * into v_entry
  from public.queue_entries qe
  where qe.driver_id = v_uid and qe.status = 'active';

  if not found then
    return null;
  end if;

  select r.destination_name into v_route
  from public.routes r where r.id = v_entry.route_id;

  select jsonb_build_object(
           'model', v.model, 'color', v.color, 'plate_number', v.plate_number)
    into v_vehicle
  from public.vehicles v where v.id = v_entry.vehicle_id;

  -- Navbat o'rni hisoblanadi (faqat 'active' yozuvlar orasida)
  with q as (
    select qe.id,
           qe.vehicle_id,
           row_number() over (partition by qe.route_id order by qe.joined_at, qe.id)::int as pos
    from public.queue_entries qe
    where qe.route_id = v_entry.route_id
      and qe.status = 'active'
  ),
  me as (
    select q.pos from q where q.id = v_entry.id
  )
  select
    (select me.pos from me),
    (select count(*) from q)::int,
    (select jsonb_build_object(
              'position', q.pos, 'model', v.model, 'color', v.color,
              'plate_number', v.plate_number, 'free', private.seats_free(q.id))
       from q join public.vehicles v on v.id = q.vehicle_id
      where q.pos = (select me.pos from me) - 1),
    (select jsonb_build_object(
              'position', q.pos, 'model', v.model, 'color', v.color,
              'plate_number', v.plate_number, 'free', private.seats_free(q.id))
       from q join public.vehicles v on v.id = q.vehicle_id
      where q.pos = (select me.pos from me) + 1)
  into v_pos, v_total, v_before, v_after;

  -- Faqat faol va muddati o'tmagan bandlar
  select coalesce(jsonb_agg(
           jsonb_build_object(
             'booking_id',      b.id,
             'passenger_name',  p.full_name,
             'passenger_phone', p.phone,
             'seats',           b.seats,
             'expires_at',      b.expires_at,
             'seconds_left',    greatest(0, floor(extract(epoch from (b.expires_at - now()))))::int
           ) order by b.expires_at, b.id
         ), '[]'::jsonb)
    into v_bookings
  from public.bookings b
  join public.profiles p on p.id = b.passenger_id
  where b.queue_entry_id = v_entry.id
    and b.status = 'active'
    and b.expires_at > now();

  return jsonb_build_object(
    'entry', jsonb_build_object(
      'id',             v_entry.id,
      'route_id',       v_entry.route_id,
      'route_name',     v_route,
      'status',         v_entry.status,
      'queue_position', v_pos,
      'fare',           v_entry.fare,
      'joined_at',      v_entry.joined_at
    ),
    'vehicle',        v_vehicle,
    'seats',          private.driver_seats_json(v_entry.id),
    'before',         v_before,
    'after',          v_after,
    'total_in_queue', v_total,
    'bookings',       v_bookings
  );
end;
$$;

-- ============================================================
-- Grant / revoke
-- ============================================================
revoke execute on function private.current_approved_driver()      from public, anon, authenticated;
revoke execute on function private.driver_seats_json(uuid)        from public, anon, authenticated;

revoke execute on function public.driver_change_seats(int)        from public, anon;
revoke execute on function public.driver_mark_arrived(uuid)       from public, anon;
revoke execute on function public.get_driver_queue()              from public, anon;

grant execute on function public.driver_change_seats(int)         to authenticated;
grant execute on function public.driver_mark_arrived(uuid)        to authenticated;
grant execute on function public.get_driver_queue()               to authenticated;