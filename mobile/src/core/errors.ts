import { strings } from "@/l10n/strings";

export type AppErrorCode = keyof typeof strings.errors;

function isAppCode(value: unknown): value is AppErrorCode {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(strings.errors, value);
}

// Supabase Auth (GoTrue) xato kodlari -> bizning kod
const AUTH_CODE_MAP: Record<string, AppErrorCode> = {
  over_sms_send_rate_limit: "RATE_LIMITED",
  over_request_rate_limit: "RATE_LIMITED",
  over_email_send_rate_limit: "RATE_LIMITED",
  otp_expired: "OTP_INVALID",
  sms_send_failed: "SMS_FAILED",
  phone_provider_disabled: "SMS_FAILED",
  validation_failed: "INVALID_PHONE",
  session_expired: "UNAUTHENTICATED",
  session_not_found: "UNAUTHENTICATED",
  refresh_token_not_found: "UNAUTHENTICATED",
  // PostgREST
  PGRST301: "UNAUTHENTICATED",
  PGRST303: "UNAUTHENTICATED",
  "42501": "FORBIDDEN",
};

const NETWORK_RE = /network request failed|failed to fetch|fetch failed|networkerror|load failed/i;

/** Supabase/PostgREST/Auth xatosidan bizning xato kodini ajratadi */
export function getErrorCode(error: unknown): AppErrorCode {
  if (!error) return "UNKNOWN";

  const e = error as { message?: unknown; code?: unknown; name?: unknown; status?: unknown };
  const message = typeof e.message === "string" ? e.message.trim() : "";

  // 1) PostgREST: raise exception ... message = 'SEATS_UNAVAILABLE'
  if (isAppCode(message)) return message;

  // 2) code maydoni ham bizning kod bo'lishi mumkin
  if (isAppCode(e.code)) return e.code;

  // 3) Tarmoq xatosi
  if (e.name === "AuthRetryableFetchError" || e.status === 0 || NETWORK_RE.test(message)) {
    return "NETWORK";
  }

  // 4) Auth / PostgREST tizim kodlari
  if (typeof e.code === "string" && AUTH_CODE_MAP[e.code]) {
    return AUTH_CODE_MAP[e.code];
  }

  if (__DEV__) console.warn("Noma'lum xato:", error);
  return "UNKNOWN";
}

export function getErrorMessage(error: unknown): string {
  return strings.errors[getErrorCode(error)];
}