import type { Session } from "@supabase/supabase-js";

import type { Tables } from "@/types/database";

type GuardProfile = Pick<Tables<"profiles">, "role">;

export const ROUTES = {
  login: "/login",
  otp: "/otp",
  role: "/role",
  passenger: "/passenger",
  driver: "/driver",
} as const;

export type ResolveRedirectInput = {
  session: Session | null;
  /** null — profil hali yo'q/yuklanmagan (chaqiruvchi yuklanishni o'zi hal qiladi) */
  profile: GuardProfile | null;
  pathname: string;
};

function normalize(pathname: string): string {
  const p = pathname.split("?")[0].replace(/\/+$/, "");
  return p === "" ? "/" : p;
}

function isUnder(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(base + "/");
}

/**
 * Joriy holat uchun qayerga yo'naltirish kerakligini qaytaradi.
 * null — yo'naltirish kerak emas (foydalanuvchi to'g'ri joyda).
 * Toza funksiya: hech qanday hook yoki tarmoq chaqiruvi yo'q.
 */
export function resolveRedirect({ session, profile, pathname }: ResolveRedirectInput): string | null {
  const path = normalize(pathname);

  // 1) Sessiya yo'q: faqat kirish ekranlari ochiq
  if (!session) {
    const isPublic = isUnder(path, ROUTES.login) || isUnder(path, ROUTES.otp);
    return isPublic ? null : ROUTES.login;
  }

  // Profil hali yo'q: bu yerda qaror qilmaymiz
  if (!profile) return null;

  // 2) Rol tanlanmagan
  if (profile.role === null) {
    return isUnder(path, ROUTES.role) ? null : ROUTES.role;
  }

  // 3) Yo'lovchi
  if (profile.role === "passenger") {
    return isUnder(path, ROUTES.passenger) ? null : ROUTES.passenger;
  }

  // 4) Haydovchi (holati — haydovchi qismida kengaytiriladi)
  if (profile.role === "driver") {
    return isUnder(path, ROUTES.driver) ? null : ROUTES.driver;
  }

  // dispatcher/admin: prototipda ilova ekrani yo'q
  return null;
}