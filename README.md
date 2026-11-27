# NavbatTaksi

Yo'nalishli taksilar vokzaldagi jonli navbatini raqamlashtiruvchi ilova (xomaki prototip).
Haydovchi vokzalda yo'nalishi va bo'sh o'rindiqlarini e'lon qilib navbatga yoziladi;
yo'lovchi o'rindiq band qiladi; vaqtida kelmasa, band avtomatik bekor bo'ladi.

- `mobile/` — React Native (Expo, TypeScript), Android + Web
- `supabase/` — lokal backend (PostgreSQL, Auth, Realtime, Edge Functions)
- `docs/`, `scripts/`

## Talablar

Node.js (LTS), Docker, Supabase CLI, Expo Go (telefonda) yoki Android emulyator.

## Ishga tushirish

```bash
chmod +x scripts/*.sh
cd mobile && npm install && cd ..
cp mobile/.env.example mobile/.env.local

./scripts/dev-up.sh      # supabase start + db reset + kalitni .env.local ga yozadi
./scripts/run-web.sh     # web
./scripts/run-android.sh # Android emulyator
```

Kalitni qo'lda qo'yish: `supabase status` dan "Publishable key" ni
`mobile/.env.local` dagi `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ga yozing.

Tekshiruv: `cd mobile && npm run typecheck && npm run lint && npm test`

## Sinov raqamlari (OTP kodi: 123456)

998900000001 … 998900000006

## Android va lokal http

Emulyatorda host kompyuter `http://10.0.2.2:54321` orqali ko'rinadi. Expo Go va
debug rejimida http ishlaydi. Haqiqiy qurilmada `EXPO_PUBLIC_SUPABASE_URL` ga
kompyuter LAN IP'sini yozing. **Release build'da Android http (cleartext) ni
bloklaydi** — production uchun https manzil kerak.

## Eslatma

`EXPO_PUBLIC_*` qiymatlari bundle ichiga tushadi: faqat publishable kalit qo'yiladi,
secret kalit hech qachon mijoz kodiga yoki repozitoriyga tushmasin.