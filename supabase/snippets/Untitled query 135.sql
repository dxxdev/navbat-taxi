select c.name_uz as shahar, s.name as vokzal, s.radius_m,
       st_y(s.location::geometry) as lat, st_x(s.location::geometry) as lng,
       r.destination_name, r.fare_min, r.fare_max, r.duration_min
from public.routes r
join public.stations s on s.id = r.station_id
join public.cities c on c.id = s.city_id
order by r.destination_name;