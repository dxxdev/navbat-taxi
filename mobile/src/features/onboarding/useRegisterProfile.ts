import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/core/supabase";
import { PROFILE_QUERY_KEY } from "@/data/profile"; // useProfile() ishlatadigan kalit: ['profile']

export type RegisterRole = "passenger" | "driver";

export function useRegisterProfile() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });

  return useMutation({
    mutationFn: async (v: { role: RegisterRole; fullName: string }) => {
      const { data, error } = await supabase.rpc("register_profile", {
        p_role: v.role,
        p_full_name: v.fullName,
      });
      if (error) throw error;
      return data;
    },
    // Muvaffaqiyatda profil yangilanadi, guard foydalanuvchini o'z bo'limiga o'tkazadi.
    onSuccess: refresh,
    // PROFILE_EXISTS bo'lsa ham profilni yangilaymiz: guard to'g'ri joyga olib boradi.
    onError: refresh,
  });
}