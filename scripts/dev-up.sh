#!/usr/bin/env bash
# Lokal Supabase'ni ishga tushirish va bazani noldan qurish
set -euo pipefail
cd "$(dirname "$0")/.."

# CLI global o'rnatilmagan bo'lsa npx ishlatiladi
export SUPABASE_CMD="${SUPABASE_CMD:-npx supabase}"
SUPA="$SUPABASE_CMD"

# config.toml dagi env(...) uchun soxta token (lokalda SMS yuborilmaydi)
export SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN="${SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN:-local-dummy-token}"

$SUPA start
$SUPA db reset
./scripts/sync-env.sh