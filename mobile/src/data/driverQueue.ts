import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSession } from "@/core/auth";
import { supabase } from "@/core/supabase";
import { unwrap } from "@/data/unwrap";
import type { Tables } from "@/types/database";

export type Vehicle = Tables<"vehicles">;

// Query kalitlari (queryKeys.ts tiklangach, xohlasangiz o'sha yerga ko'chiring)
export const driverQueueKey = ["driver", "queue"] as const;
export const myVehiclesKey = ["driver", "vehicles"] as const;

// get_driver_queue natijasi (taxmin; 11-qismda aniqlashtiriladi)
export type DriverQueue = {
  entry: Tables<"queue_entries">;
  position: number;
  free_seats: number;
  bookings: Tables<"bookings">[];
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
  await unwrap(supabase.rpc("driver_depart", { p_force: force }));
}

export async function changeSeats(delta: 1 | -1): Promise<void> {
  await unwrap(supabase.rpc("driver_change_seats", { p_delta: delta }));
}

export async function markArrived(bookingId: string): Promise<void> {
  await unwrap(supabase.rpc("driver_mark_arrived", { p_booking_id: bookingId }));
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