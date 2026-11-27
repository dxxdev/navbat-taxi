import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

import type { Database } from "@/types/database";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error(
    "EXPO_PUBLIC_SUPABASE_URL va EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY .env.local da bo'lishi kerak",
  );
}

// Web'da server tomonida render (SSR) paytida window yo'q — saqlash o'chiriladi
const isServer = Platform.OS === "web" && typeof window === "undefined";

export const supabase = createClient<Database>(url, publishableKey, {
  auth: {
    storage: isServer ? undefined : AsyncStorage,
    autoRefreshToken: !isServer,
    persistSession: !isServer,
    detectSessionInUrl: false,
  },
});

// Native'da ilova fonga ketganda tokenni yangilashni to'xtatamiz
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}