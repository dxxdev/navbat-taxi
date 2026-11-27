import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

import { config } from "./config";

// Kalit bo'lmasa createClient xato tashlaydi; ilova qulamasin, indikator "Ulanmadi" ko'rsatsin
export const supabase = createClient(
  config.supabaseUrl,
  config.supabasePublishableKey || "missing-key",
  {
    auth: {
      storage: AsyncStorage, // web'da localStorage'ga yoziladi, native'da AsyncStorage
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// Faqat native'da: ilova fonga o'tganda token yangilashni to'xtatamiz
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}