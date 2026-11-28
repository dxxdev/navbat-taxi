# NavbatTaksi

Yo'nalishli taksilar uchun vokzaldagi jonli navbatni raqamlashtiruvchi ilova. Haydovchi navbatga yoziladi, yo'lovchi vokzalga kelmasdan o'rindiq band qiladi, belgilangan vaqtda kelmasa band avtomatik bekor bo'ladi.

## Loyiha haqida

> Holat: xomaki prototip (proof of concept), ishlab chiqish jarayonida.

Prototip 4 ta asosiy funksiyadan iborat:

1. Rollarga bo'lingan ro'yxatdan o'tish (yo'lovchi / haydovchi).
2. Haydovchi yo'nalishi va bo'sh o'rinlarini e'lon qilishi (navbatga yozilishi).
3. Yo'lovchi navbatdagi mashinadan o'rindiq band qilishi.
4. Yo'lovchi vaqtida kelmasa, bandning avtomatik bekor qilinishi.

## Foydalanuvchi rollari

Bir hisob = bitta rol (ro'yxatdan o'tishda tanlanadi).

### Yo'lovchi

- Navbatdagi mashinalarni ko'rish.
- O'rindiq band qilish va kutish vaqtini tanlash.
- Bandni "Keldi" deb tasdiqlash yoki bekor qilish.

### Haydovchi

- Mashina va haydovchilik ma'lumotlarini ro'yxatdan o'tkazish.
- Yo'nalish, o'rindiqlar soni va narxni belgilab navbatga yozilish.
- Navbatdan chiqish yoki "Yo'lga chiqdim" tugmasini bosish.

## Texnologiyalar

### Mijoz

- React Native (Expo), TypeScript (strict)
- Expo Router
- TanStack Query (server holati)
- React Native Paper (Material 3)
- Platformalar: Android va Web

### Backend

- Supabase: PostgreSQL + PostGIS
- Supabase Auth (telefon + SMS OTP)
- Supabase Realtime (Broadcast), Storage, Edge Functions (Deno)
- Barcha amallar PostgreSQL funksiyalari (RPC) orqali: `security definer`, `search_path = ''`

### Ishlab chiqish vositalari

- Git, GitHub, Visual Studio Code
- Supabase CLI + Docker (lokal baza)
- pgTAP (baza testlari)

## Loyiha holati

- [x] Loyihani rejalashtirish
- [x] Expo loyihasini sozlash
- [x] Baza sxemasi va RLS
- [x] Profil va rolni tanlash (RPC: `register_profile`)
- [x] Haydovchini ro'yxatdan o'tkazish (RPC: `driver_register`, `get_my_driver`)
- [x] Haydovchi navbati (RPC: `driver_join_queue`, `driver_leave_queue`, `driver_depart`)
- [x] Haydovchi navbati uchun pgTAP testlari
- [ ] Yo'lovchi uchun navbatni ko'rish (RPC: `get_route_queue`)
- [ ] O'rindiq band qilish (`book_seat`) va "Keldi" tasdig'i
- [ ] Bandlarning avtomatik bekor bo'lishi (cron)
- [ ] Mijoz arxitekturasi va navigatsiya
- [ ] Ro'yxatdan o'tish va kirish ekranlari
- [ ] Yo'lovchi ekranlari
- [ ] Haydovchi ekranlari
- [ ] Realtime yangilanishlar
- [ ] Xavfsizlik tekshiruvi
- [ ] Yuklama testi
- [ ] Android build
- [ ] Web deploy

## Ishga tushirish

### Talablar

- Node.js (LTS)
- npm
- Git
- Docker
- Supabase CLI

### O'rnatish

Repozitoriyni yuklab oling:

```bash
git clone https://github.com/dxxdev/navbat-taxi.git
cd navbat-taxi
```

Mijoz bog'liqliklarini o'rnating:

```bash
cd mobile
npm install
```

Lokal bazani ishga tushiring (Docker yoqilgan bo'lishi kerak):

```bash
supabase start
supabase db reset
```

Baza testlarini yurgizing:

```bash
supabase test db
```

Turlarni yangilang (har bir migratsiyadan keyin):

```bash
supabase gen types typescript --local > mobile/src/types/database.ts
```

Ilovani ishga tushiring:

```bash
cd mobile
npx expo start
npx expo start --web
```

### Muhit o'zgaruvchilari

Mijozda `mobile/.env.local` fayli ishlatiladi:

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

`EXPO_PUBLIC_` qiymatlari bundle ichiga tushadi. Shuning uchun faqat publishable kalit qo'yiladi. Secret kalitlar, tokenlar va service role kalitlari kodga va repozitoriyga hech qachon kiritilmaydi.

## Loyiha tuzilmasi

```
navbat-taxi/
  mobile/     React Native (Expo): app/ (marshrutlar), src/{core,l10n,data,features,components,types}
  supabase/   config.toml, migrations/, functions/, tests/database/, tests/load/, seed.sql
  docs/       qo'lda ishlatiladigan SQL'lar (docs/sql-snippets/)
  scripts/    yordamchi skriptlar
```

## Baza qoidalari (qisqacha)

- Navbat tartibi saqlanmaydi, `row_number() over (partition by route_id order by joined_at, id)` bilan hisoblanadi (faqat `active` yozuvlar orasida). Shuning uchun haydovchi chiqqanda navbat o'zi siljiydi.
- Qulflash tartibi doim: avval `queue_entries`, keyin `bookings`.
- Bir yo'lovchida bir vaqtda 1 ta faol band, haydovchi bir vaqtda 1 ta faol navbatda.
- Haydovchi "Yo'lga chiqdim" yoki "Navbatdan chiqish" bossa, uning faol bandlari bekor qilinadi va yo'lovchilarga xabar yoziladi.
- Xato kodlari `PT<HTTP kodi>` ko'rinishida (masalan `PT409` / `SEATS_UNAVAILABLE`), mijozda o'zbekcha matnga o'giriladi.
- Baza o'zgarishi faqat yangi migratsiya orqali (`supabase migration new <nom>`), mavjud migratsiya tahrirlanmaydi.

## Prototipda yo'q

Admin/dispetcher paneli, to'lov, reyting, chat, xarita, FCM push, pauza, GPS heartbeat, jarimalar, hodisalar, audit jurnali, tushish bekatlari, iOS, ruscha til.

## Ishlab chiqish yo'l xaritasi

1. Ishlab chiqish muhitini tayyorlash.
2. Baza sxemasi va xavfsizlik (RLS).
3. Ro'yxatdan o'tish va rol RPC'lari.
4. Haydovchi navbati RPC'lari.
5. Yo'lovchi band qilish RPC'lari.
6. Avtomatik bekor qilish (cron).
7. Mijoz arxitekturasi va navigatsiya.
8. Ro'yxatdan o'tish va kirish ekranlari.
9. Yo'lovchi va haydovchi ekranlari.
10. Realtime yangilanishlar.
11. Testlash va xavfsizlik tekshiruvi.
12. Android va Web build.

## Ishlab chiqish jurnali

### Dastlabki rejalashtirish

- Ilova g'oyasi va asosiy funksiyalar aniqlandi.
- Yo'lovchi va haydovchi rollari belgilandi.
- React Native (Expo) va Supabase tanlandi.
- Android va Web platformalari rejalashtirildi.

### Baza qatlami (1-8 qismlar)

- Baza sxemasi, RLS va rol bo'yicha ro'yxatdan o'tish RPC'lari yozildi.
- Haydovchini ro'yxatdan o'tkazish RPC'lari qo'shildi.
- 8-qism: haydovchi navbatga qo'shilishi (`driver_join_queue`, geofence ixtiyoriy), chiqishi (`driver_leave_queue`) va yo'lga chiqishi (`driver_depart`) yozildi. Bekor qilingan bandlar uchun yo'lovchilarga `booking.cancelled` xabari yoziladi.
- `supabase/tests/database/04_driver_queue.test.sql` pgTAP testlari qo'shildi, turlar yangilandi.

## README bilan ishlash tartibimiz

Har bir bosqichdan keyin README'ning tegishli bo'limini yangilab boramiz:

- **Loyiha holati**: vazifa bajarilganda.
- **Texnologiyalar**: yangi texnologiya yoki kutubxona qo'shilganda.
- **Loyiha tuzilmasi**: fayl va papkalar o'zgarganda.
- **Ishga tushirish**: o'rnatish jarayoni o'zgarganda.
- **Ishlab chiqish jurnali**: bosqich yakunlanganda.

> README har doim kodimizning haqiqiy holatiga mos bo'ladi. Hali yozilmagan funksiyalarni tayyor deb belgilamaymiz.