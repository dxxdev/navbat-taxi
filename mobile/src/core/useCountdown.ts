import { useEffect, useRef, useState } from "react";

// Millisekundni "mm:ss" ko'rinishiga o'giradi (soniya yuqoriga yaxlitlanadi)
export function formatMmSs(ms: number): string {
  const totalSec = Math.ceil(Math.max(0, ms) / 1000);
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function leftMs(expiresAt: string | null | undefined): number {
  if (!expiresAt) return 0;
  const target = Date.parse(expiresAt);
  if (Number.isNaN(target)) return 0;
  return Math.max(0, target - Date.now());
}

/**
 * expires_at (UTC ISO) asosida har soniyada yangilanadigan teskari taymer.
 * Vaqt tugaganda onExpire bir marta chaqiriladi (masalan, ro'yxatni yangilash uchun).
 */
export function useCountdown(
  expiresAt: string | null | undefined,
  onExpire?: () => void,
) {
  const [remainingMs, setRemainingMs] = useState<number>(() => leftMs(expiresAt));
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    let fired = false;
    const tick = () => {
      const left = leftMs(expiresAt);
      setRemainingMs(left);
      if (left === 0 && !fired) {
        fired = true;
        onExpireRef.current?.();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return {
    remainingMs,
    label: formatMmSs(remainingMs),
    expired: remainingMs === 0,
  };
}