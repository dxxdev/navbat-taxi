-- Rolni bir marta tanlash va ismni saqlash.
create or replace function public.register_profile(p_role text, p_full_name text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_name text := btrim(coalesce(p_full_name, ''));
  v_current_role text;
  v_profile public.profiles;
begin
  if v_uid is null then
    raise exception using errcode = 'PT401', message = 'UNAUTHENTICATED';
  end if;

  -- Ro'yxatdan o'tishda faqat yo'lovchi yoki haydovchi tanlanadi
  if p_role is null or p_role not in ('passenger', 'driver') then
    raise exception using errcode = 'PT422', message = 'INVALID_ROLE';
  end if;

  if char_length(v_name) < 2 or char_length(v_name) > 60 then
    raise exception using errcode = 'PT422', message = 'INVALID_NAME';
  end if;

  -- Profil qatorini bloklaymiz: ikki parallel chaqiruv rolni ikki marta yozmasin
  select p.role into v_current_role
  from public.profiles p
  where p.id = v_uid
  for update;

  if not found then
    raise exception using errcode = 'PT404', message = 'NOT_FOUND';
  end if;

  if v_current_role is not null then
    raise exception using errcode = 'PT409', message = 'PROFILE_EXISTS';
  end if;

  update public.profiles p
     set role = p_role,
         full_name = v_name
   where p.id = v_uid
  returning p.* into v_profile;

  return to_jsonb(v_profile);
end;
$$;

revoke execute on function public.register_profile(text, text) from public, anon;
grant execute on function public.register_profile(text, text) to authenticated;