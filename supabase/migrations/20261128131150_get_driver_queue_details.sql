-- Haydovchi navbat ekrani (11-qism) uchun get_driver_queue kengaytiriladi.
-- Eski kalitlar (entry, position, free_seats, bookings) saqlanadi;
-- qo'shiladi: city_name, destination_name, total_active, prev, next,
-- bookings[].passenger_name / passenger_phone.

drop function if exists public.get_driver_queue();

create function public.get_driver_queue()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := auth.uid();
  v_entry  public.queue_entries%rowtype;
  v_result jsonb;
begin
  if v_uid is null then
    raise exception using errcode = 'PT401', message = 'UNAUTHENTICATED';
  end if;

  if not exists (select 1 from public.drivers d where d.user_id = v_uid) then
    raise exception using errcode = 'PT403', message = 'FORBIDDEN';
  end if;

  -- Haydovchining faol navbat yozuvi; yo'q bo'lsa null
  select q.* into v_entry
  from public.queue_entries q
  where q.driver_id = v_uid
    and q.status = 'active';

  if not found then
    return null;
  end if;

  with ranked as (
    -- Navbat tartibi hisoblanadi (saqlanmaydi)
    select q.id,
           q.vehicle_id,
           (row_number() over (order by q.joined_at, q.id))::int as rn,
           (count(*) over ())::int as total
    from public.queue_entries q
    where q.route_id = v_entry.route_id
      and q.status = 'active'
  ),
  me as (
    select rk.rn, rk.total from ranked rk where rk.id = v_entry.id
  ),
  nb as (
    select rk.rn, v.model, v.plate_number
    from ranked rk
    join public.vehicles v on v.id = rk.vehicle_id
  ),
  bk as (
    -- Faqat faol va muddati o'tmagan bandlar
    select b.id, b.seats, b.fare_per_seat, b.status, b.expires_at,
           p.full_name, p.phone
    from public.bookings b
    join public.profiles p on p.id = b.passenger_id
    where b.queue_entry_id = v_entry.id
      and b.status = 'active'
      and b.expires_at > now()
  )
  select jsonb_build_object(
    'entry', to_jsonb(v_entry),
    'position', me.rn,
    'total_active', me.total,
    'free_seats',
      v_entry.seats_total - v_entry.seats_occupied
      - coalesce((select sum(bk.seats) from bk), 0),
    'city_name', c.name_uz,
    'destination_name', rt.destination_name,
    'prev', (
      select jsonb_build_object(
        'position', nb.rn, 'model', nb.model, 'plate_number', nb.plate_number)
      from nb where nb.rn = me.rn - 1
    ),
    'next', (
      select jsonb_build_object(
        'position', nb.rn, 'model', nb.model, 'plate_number', nb.plate_number)
      from nb where nb.rn = me.rn + 1
    ),
    'bookings', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', bk.id,
          'seats', bk.seats,
          'fare_per_seat', bk.fare_per_seat,
          'status', bk.status,
          'expires_at', bk.expires_at,
          'passenger_name', bk.full_name,
          'passenger_phone', bk.phone
        )
        order by bk.expires_at
      )
      from bk
    ), '[]'::jsonb)
  )
  into v_result
  from me
  join public.routes rt on rt.id = v_entry.route_id
  join public.stations s on s.id = rt.station_id
  join public.cities c on c.id = s.city_id;

  return v_result;
end;
$$;

revoke execute on function public.get_driver_queue() from public, anon;
grant execute on function public.get_driver_queue() to authenticated;