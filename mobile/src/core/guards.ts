// Marshrut himoyasi: sessiya va profil holatiga qarab qayerga yo'naltirishni hisoblaydi.
// Toza funksiya: router'dan mustaqil, oson test qilinadi.

import { MyDriver } from "@/data/driver";

export const LOGIN_ROUTE = "/(auth)/login"; // 5-qismdagi kirish ekrani yo'liga moslang
export const ROLE_ROUTE = "/(onboarding)/role";
export const PASSENGER_HOME = "/passenger";
export const DRIVER_ENTRY = "/driver/register"; // haydovchi ro'yxatdan o'tishi keyingi qismda

export type GuardProfile = { role: string | null } | null | undefined;

export type GuardInput = {
  segments: string[]; // useSegments() natijasi
  hasSession: boolean;
  sessionLoading: boolean;
  profile: GuardProfile; // undefined = hali yuklanmagan
};

// null = joyida qol, aks holda shu yo'lga o'tkaz
export function getGuardRedirect({
  segments,
  hasSession,
  sessionLoading,
  profile,
}: GuardInput): string | null {
  if (sessionLoading) return null;

  const group = segments[0];
  const inAuth = group === "(auth)";
  const inOnboarding = group === "(onboarding)";
  const inPassenger = group === "passenger";
  const inDriver = group === "driver";

  if (!hasSession) {
    return inAuth ? null : LOGIN_ROUTE;
  }

  // Profil hali yuklanmagan: kutamiz
  if (profile === undefined) return null;

  // Profil qatori yo'q (g'ayritabiiy holat): kirish ekranida qoldiramiz
  if (profile === null) return inAuth ? null : LOGIN_ROUTE;

  switch (profile.role) {
    case null:
      return inOnboarding ? null : ROLE_ROUTE;
    case "passenger":
      return inPassenger ? null : PASSENGER_HOME;
    case "driver":
      return inDriver ? null : DRIVER_ENTRY;
    default:
      // dispatcher/admin prototipda yo'q
      return null;
  }
}

export function getDriverRedirect(pathname: string, driver: MyDriver | undefined): string | null {
  if (driver === undefined) return null; // hali yuklanmoqda

  let target: string;
  if (driver === null) target = "/driver/register";
  else if (driver.status === "approved") target = "/driver";
  else target = "/driver/status"; // pending | blocked

  // approved bo'lsa /driver ichidagi barcha ichki sahifalar ruxsat etiladi
  if (target === "/driver") {
    return pathname === "/driver" || pathname.startsWith("/driver/") && pathname !== "/driver/register" && pathname !== "/driver/status"
      ? null
      : target;
  }
  return pathname === target ? null : target;
}