import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSession } from "@/core/auth";
import { supabase } from "@/core/supabase";
import { unwrap } from "@/data/unwrap";
import type { Tables } from "@/types/database";

export type Vehicle = Tables<"vehicles">;

// Query kalitlari (queryKeys.ts tiklangach, xohlasangiz o'sha yerga ko'chiring)
export const driverQueueKey = ["driver", "queue"] as const;
export const myVehiclesKey = ["driver", "vehicles"] as const;

// get_driver_queue natijasi (migratsiya: get_driver_queue_details)
export type QueueNeighbor = {
  position: number;
  model: string;
  plate_number: string | null;
};

export type DriverBooking = {
  id: string;
  seats: number;
  fare_per_seat: number;
  status: string;
  expires_at: string; // UTC ISO
  passenger_name: string | null;
  passenger_phone: string | null;
};

export type DriverQueue = {
  entry: Tables<"queue_entries">;
  position: number;
  total_active: number;
  free_seats: number;
  city_name: string;
  destination_name: string;
  prev: QueueNeighbor | null;
  next: QueueNeighbor | null;
  bookings: DriverBooking[];
};

export type JoinQueueInput = {
  routeId: string;
  vehicleId: string;
  seats: number;
  fare: number;
};

// ---- RPC funksiyalar ----

export async function getDriverQueue(): Promise<DriverQueue | null> {
  const data = await unwrap(supabase.rpc("get_driver_queue"));
  return data as unknown as DriverQueue | null;
}

export async function joinQueue(input: JoinQueueInput): Promise<void> {
  // Joylashuv yuborilmaydi (geofence o'chiq): p_lat / p_lng ixtiyoriy
  await unwrap(
    supabase.rpc("driver_join_queue", {
      p_route_id: input.routeId,
      p_vehicle_id: input.vehicleId,
      p_seats_total: input.seats,
      p_fare: input.fare,
    }),
  );
}

export async function leaveQueue(): Promise<void> {
  await unwrap(supabase.rpc("driver_leave_queue"));
}

export async function depart({ force = false }: { force?: boolean } = {}): Promise<void> {
  // unwrap ishlatilmaydi: xato kodi (ACTIVE_BOOKINGS_PENDING) asl holida saqlanishi kerak
  const { error } = await supabase.rpc("driver_depart", { p_force: force });
  if (error) throw error;
}

export async function changeSeats(delta: 1 | -1): Promise<void> {
  await unwrap(supabase.rpc("driver_change_seats", { p_delta: delta }));
}

export async function markArrived(bookingId: string): Promise<void> {
  await unwrap(
    supabase.rpc("driver_mark_arrived", { p_booking_id: bookingId }),
  );
}

// ---- Query hook'lar ----

// Hozircha qo'lda yangilanadi (realtime 16-qismda)
export function useDriverQueue() {
  return useQuery({ queryKey: driverQueueKey, queryFn: getDriverQueue });
}

// Haydovchining faol mashinalari
export function useMyVehicles() {
  const { session } = useSession();
  const userId = session?.user.id;
  return useQuery({
    queryKey: [...myVehiclesKey, userId],
    enabled: !!userId,
    queryFn: () =>
      unwrap(
        supabase
          .from("vehicles")
          .select("*")
          .eq("driver_id", userId as string)
          .eq("is_active", true),
      ),
  });
}

// ---- Mutatsiya hook'lar ----

function useQueueMutation<V, R>(fn: (vars: V) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: driverQueueKey }),
  });
}

export const useJoinQueue = () => useQueueMutation(joinQueue);
export const useLeaveQueue = () => useQueueMutation<void, void>(leaveQueue);
export const useDepart = () => useQueueMutation(depart);
export const useChangeSeats = () => useQueueMutation(changeSeats);
export const useMarkArrived = () => useQueueMutation(markArrived);
