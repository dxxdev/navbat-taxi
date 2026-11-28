select p.phone, p.full_name, q.status
from public.queue_entries q
join public.profiles p on p.id = q.driver_id
where q.status = 'active';