import { useQuery } from "@tanstack/react-query";

import { useSession } from "@/core/auth";
import { supabase } from "@/core/supabase";
import type { Tables } from "@/types/database";

export type Profile = Tables<"profiles">;
export const PROFILE_QUERY_KEY = ["profile"] as const;

/** O'z profilingiz. role null bo'lishi mumkin (rol hali tanlanmagan). */
export function useProfile() {
  const { session } = useSession();
  const userId = session?.user.id;

  return useQuery({
    // Kalit userId ga bog'liq: sessiya o'zgarsa, qayta yuklanadi
    queryKey: ["profile", userId],
    enabled: !!userId,
    // Trigger profilni kechikib yaratishi mumkin: qator topilmasa 3 marta qayta urinamiz
    retry: 3,
    retryDelay: 800,
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("PROFILE_NOT_FOUND"); // retry'ni ishga tushiradi
      return data;
    },
  });
}