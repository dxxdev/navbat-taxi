import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/core/supabase";
import { queryKeys } from "@/data/queryKeys";
import type { Tables } from "@/types/db";
import { unwrap } from "./unwrap";

export type City = Tables<"cities">;
export type Station = Tables<"stations">;
export type Route = Tables<"routes">;

const STALE = 5 * 60 * 1000; // katalog kam o'zgaradi

export const getCities = () =>
  unwrap(
    supabase.from("cities").select("*").eq("is_active", true).order("name_uz"),
  );

export const getStations = (cityId: City["id"]) =>
  unwrap(
    supabase
      .from("stations")
      .select("*")
      .eq("city_id", cityId)
      .eq("is_active", true)
      .order("name"),
  );

export const getRoutes = (stationId: Station["id"]) =>
  unwrap(
    supabase
      .from("routes")
      .select("*")
      .eq("station_id", stationId)
      .eq("is_active", true)
      .order("destination_name"),
  );

export function useCities() {
  return useQuery({
    queryKey: queryKeys.catalog.cities,
    queryFn: getCities,
    staleTime: STALE,
  });
}

export function useStations(cityId: City["id"] | undefined) {
  return useQuery({
    queryKey: queryKeys.catalog.stations(cityId),
    queryFn: () => getStations(cityId as City["id"]),
    enabled: cityId != null,
    staleTime: STALE,
  });
}

export function useRoutes(stationId: Station["id"] | undefined) {
  return useQuery({
    queryKey: queryKeys.catalog.routes(stationId),
    queryFn: () => getRoutes(stationId as Station["id"]),
    enabled: stationId != null,
    staleTime: STALE,
  });
}