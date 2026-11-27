begin;
select plan(1);

-- Kelajakda RLS yoqilmagan yangi jadval qoʻshilsa, shu test yiqiladi
select is_empty(
  $$
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and not c.relispartition
      and not c.relrowsecurity
  $$,
  'public sxemasida RLS yoqilmagan jadval yoʻq'
);

select * from finish();
rollback;