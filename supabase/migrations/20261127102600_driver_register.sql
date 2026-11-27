-- Haydovchini ro'yxatdan o'tkazish: drivers + vehicles yozuvlari bitta tranzaksiyada.
create or replace function public.driver_register(
  p_license_number text,
  p_license_photo_path text,
  p_vehicle jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_license text := btrim(coalesce(p_license_number, ''));
  v_model text;
  v_color text;
  v_plate text;
  v_vehicle_photo text;
  v_seats int;
  v_auto boolean;
  v_status text;
  v_vehicle_id public.vehicles.id%type;
begin
  if v_uid is null then
    raise exception using errcode = 'PT401', message = 'UNAUTHENTICATED';
  end if;

  select p.role into v_role from public.profiles p where p.id = v_uid;
  if v_role is distinct from 'driver' then
    raise exception using errcode = 'PT403', message = 'FORBIDDEN';
  end if;

  if exists (select 1 from public.drivers d where d.user_id = v_uid) then
    raise exception using errcode = 'PT409', message = 'PROFILE_EXISTS';
  end if;

  if p_vehicle is null or jsonb_typeof(p_vehicle) <> 'object' then
    raise exception using errcode = 'PT422', message = 'INVALID_NAME';
  end if;

  v_model := btrim(coalesce(p_vehicle->>'model', ''));
  v_color := btrim(coalesce(p_vehicle->>'color', ''));
  v_vehicle_photo := btrim(coalesce(p_vehicle->>'photo_path', ''));
  -- Davlat raqami: bo'shliqsiz, katta harf.
  v_plate := upper(regexp_replace(coalesce(p_vehicle->>'plate_number', ''), '\s', '', 'g'));

  if v_license = '' or v_model = '' or v_color = '' or v_plate = ''
     or btrim(coalesce(p_license_photo_path, '')) = '' or v_vehicle_photo = '' then
    raise exception using errcode = 'PT422', message = 'INVALID_NAME';
  end if;

  -- O'rindiqlar soni: 1..8 butun son.
  if jsonb_typeof(p_vehicle->'seats_total') is distinct from 'number'
     or (p_vehicle->>'seats_total') !~ '^[0-9]+$' then
    raise exception using errcode = 'PT422', message = 'SEATS_INVALID';
  end if;
  v_seats := (p_vehicle->>'seats_total')::int;
  if v_seats < 1 or v_seats > 8 then
    raise exception using errcode = 'PT422', message = 'SEATS_INVALID';
  end if;

  -- Fayl yo'llari faqat o'z papkasida bo'lishi shart.
  if not starts_with(p_license_photo_path, v_uid::text || '/')
     or not starts_with(v_vehicle_photo, v_uid::text || '/') then
    raise exception using errcode = 'PT403', message = 'FORBIDDEN';
  end if;

  if exists (select 1 from public.vehicles v where v.plate_number = v_plate) then
    raise exception using errcode = 'PT409', message = 'PLATE_TAKEN';
  end if;

  select coalesce((s.value) = 'true'::jsonb, false)
    into v_auto
    from public.settings s
   where s.key = 'driver.auto_approve';
  v_status := case when coalesce(v_auto, false) then 'approved' else 'pending' end;

  begin
    insert into public.drivers (user_id, license_number, license_photo_path, status)
    values (v_uid, v_license, p_license_photo_path, v_status);

    insert into public.vehicles (driver_id, model, color, plate_number, seats_total, photo_path)
    values (v_uid, v_model, v_color, v_plate, v_seats, v_vehicle_photo)
    returning id into v_vehicle_id;
  exception when unique_violation then
    -- Poyga holatida: kim oldin yozgan bo'lsa shu xatoni qaytaramiz.
    if exists (select 1 from public.vehicles v where v.plate_number = v_plate) then
      raise exception using errcode = 'PT409', message = 'PLATE_TAKEN';
    end if;
    raise exception using errcode = 'PT409', message = 'PROFILE_EXISTS';
  end;

  return jsonb_build_object('driver_status', v_status, 'vehicle_id', v_vehicle_id);
end;
$$;

revoke execute on function public.driver_register(text, text, jsonb) from public, anon;
grant execute on function public.driver_register(text, text, jsonb) to authenticated;


-- Haydovchining o'z holati va mashinalari (yozuv bo'lmasa null).
create or replace function public.get_my_driver()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_result jsonb;
begin
  if v_uid is null then
    raise exception using errcode = 'PT401', message = 'UNAUTHENTICATED';
  end if;

  select jsonb_build_object(
           'status', d.status,
           'license_number', d.license_number,
           'vehicles', coalesce((
             select jsonb_agg(
                      jsonb_build_object(
                        'id', v.id,
                        'model', v.model,
                        'color', v.color,
                        'plate_number', v.plate_number,
                        'seats_total', v.seats_total,
                        'is_active', v.is_active
                      )
                      order by v.id
                    )
               from public.vehicles v
              where v.driver_id = d.user_id
           ), '[]'::jsonb)
         )
    into v_result
    from public.drivers d
   where d.user_id = v_uid;

  return v_result; -- yozuv bo'lmasa null
end;
$$;

revoke execute on function public.get_my_driver() from public, anon;
grant execute on function public.get_my_driver() to authenticated;