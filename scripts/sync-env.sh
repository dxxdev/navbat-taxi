#!/usr/bin/env bash
# `supabase status` dan publishable kalitni olib, mobile/.env.local ga yozadi
set -euo pipefail
cd "$(dirname "$0")/.."

SUPA="${SUPABASE_CMD:-supabase}"
STATUS="$($SUPA status -o env)"

KEY="$(echo "$STATUS" | grep -E '^PUBLISHABLE_KEY=' | head -1 | cut -d= -f2- | tr -d '"' || true)"
if [ -z "$KEY" ]; then
  # Eski CLI versiyalarida anon key ishlatiladi
  KEY="$(echo "$STATUS" | grep -E '^ANON_KEY=' | head -1 | cut -d= -f2- | tr -d '"' || true)"
fi
if [ -z "$KEY" ]; then
  echo "Xato: kalit topilmadi. Supabase ishga tushganini tekshiring (supabase status)." >&2
  exit 1
fi

cat > mobile/.env.local <<EOF
# scripts/sync-env.sh tomonidan yaratilgan
# URL bo'sh: web -> 127.0.0.1:54321, Android emulyator -> 10.0.2.2:54321.
# Haqiqiy qurilma uchun: EXPO_PUBLIC_SUPABASE_URL=http://<LAN-IP>:54321
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$KEY
EOF

echo "mobile/.env.local yangilandi. Expo'ni qayta ishga tushiring (kesh uchun: npx expo start -c)."