import { Platform } from "react-native";

// URL berilmasa: Android emulyatorda host kompyuter 10.0.2.2 orqali ko'rinadi
const defaultUrl =
  Platform.OS === "android" ? "http://10.0.2.2:54321" : "http://127.0.0.1:54321";

// Eslatma: EXPO_PUBLIC_* qiymatlari faqat to'g'ridan-to'g'ri
// process.env.NOM ko'rinishida yozilsa bundle'ga joylanadi.
export const config = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || defaultUrl,
  supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
};

export const isSupabaseKeyMissing = config.supabasePublishableKey === "";