# NavbatTaksi

Vokzaldagi yo'nalishli taksilar navbatini raqamlashtiruvchi ilova. Haydovchi vokzalda yo'nalishi va bo'sh o'rindiqlarini e'lon qilib navbatga yoziladi. Yo'lovchi vokzalga kelmasdan navbatdagi mashinalarni ko'radi va o'rindiq band qiladi. Belgilangan vaqtda kelmasa, band avtomatik bekor bo'ladi va o'rindiq boshqalarga ochiladi.

> Holat: **xomaki prototip (proof of concept)**. Backend (ma'lumotlar bazasi va RPC) 9-qismgacha tayyor, mobil ilova interfeysi hali yozilmagan.

## Prototipning 4 ta asosiy funksiyasi

1. Rollarga bo'lingan ro'yxatdan o'tish (yo'lovchi / haydovchi)
2. Haydovchi bo'sh o'rinlari va yo'nalishini e'lon qilishi (navbatga yozilishi)
3. Yo'lovchi navbatdagi mashinadan o'rindiq band qilishi
4. Yo'lovchi vaqtida kelmasa, bandning avtomatik bekor qilinishi

## Foydalanuvchi rollari

Bir hisob — bitta rol (ro'yxatdan o'tishda tanlanadi).

### Yo'lovchi

- Navbatdagi mashinalarni ko'rish.
- O'rindiq band qilish va kutish vaqtini tanlash.
- Bandni bekor qilish.

### Haydovchi

- Haydovchi sifatida ro'yxatdan o'tish (prototipda avtomatik tasdiqlanadi: `driver.auto_approve = true`).
- Yo'nalish va narx tanlab navbatga yozilish.
- Bo'sh o'rindiqlar sonini +1 / -1 bilan boshqarish.
- Yo'lovchi kelganda "Keldi" belgilash.
- O'z navbat holatini ko'rish: o'rni, oldingi va keyingi mashina, faol bandlar.
- "Yo'lga chiqdim" yoki "Navbatdan chiqish".

## Texnologiyalar

### Mijoz

- React Native (Expo), TypeScript (strict)
- Expo Router
- TanStack Query (server holati)
- React Native Paper (Material 3)
- Platformalar: Android va Web

### Backend

- Supabase: PostgreSQL, PostGIS, Auth (telefon + SMS OTP), Realtime, Storage, Edge Functions
- Barcha amallar PostgreSQL RPC funksiyalari orqali (`security definer`, `set search_path = ''`)
- Testlar: pgTAP

### Asboblar

- Supabase CLI + Docker (lokal ishlab chiqish)
- Git, GitHub, Visual Studio Code

## Repozitoriy tuzilmasi

```text
navbat-taxi/
  mobile/      React Native (Expo) ilovasi
    app/       Expo Router marshrutlari
    src/       core, l10n, data, features, components, types
  supabase/
    migrations/        Baza migratsiyalari
    functions/         Edge Functions
    tests/database/    pgTAP testlari
    seed.sql           Boshlang'ich ma'lumotlar
  docs/        Hujjatlar (docs/sql-snippets/ - qo'lda ishlatiladigan SQL'lar)
  scripts/     Yordamchi skriptlar
```

## Bajarilgan backend funksiyalari (RPC)

| Funksiya | Vazifasi | Kim chaqiradi |
|---|---|---|
| `register_profile` | Ism va rolni tanlash | yangi foydalanuvchi |
| `driver_register` | Haydovchi va mashina ma'lumotlarini saqlash | haydovchi |
| `get_my_driver` | Haydovchi profilini o'qish | haydovchi |
| `driver_join_queue` | Yo'nalish tanlab navbatga yozilish | haydovchi |
| `driver_leave_queue` | Navbatdan chiqish (faol bandlar bekor bo'ladi) | haydovchi |
| `driver_depart` | "Yo'lga chiqdim" (faol bandlar bekor bo'ladi) | haydovchi |
| `driver_change_seats` | Band bo'lgan o'rindiqlarni +1 / -1 qilish | haydovchi |
| `driver_mark_arrived` | Yo'lovchi keldi: band `seated` bo'ladi | haydovchi |
| `get_driver_queue` | Haydovchi navbat ko'rinishi (o'rin, qo'shnilar, bandlar) | haydovchi |

Asosiy qoidalar:

- Navbat tartibi saqlanmaydi, `row_number()` bilan hisoblanadi (faqat `active` yozuvlar orasida).
- Bo'sh o'rindiq = `seats_total - seats_occupied - faol va muddati o'tmagan bandlar o'rindiqlari`.
- Qulflash tartibi doim: avval `queue_entries`, keyin `bookings`.
- Xatolar `PT<HTTP kodi>` errcode va `message` (masalan, `SEATS_UNAVAILABLE`) ko'rinishida qaytariladi.

## Loyiha holati

> Backend 9-qismgacha tayyor. Mobil interfeys va yo'lovchi tomoni hali yozilmagan.

- [x] Loyihani rejalashtirish
- [x] Expo loyihasini sozlash
- [x] Ma'lumotlar bazasi sxemasi va RLS
- [x] Rollarga bo'lingan ro'yxatdan o'tish (backend)
- [x] Haydovchi ro'yxatdan o'tishi (backend)
- [x] Navbatga yozilish, chiqish va yo'lga chiqish (backend)
- [x] O'rindiq boshqaruvi, "Keldi" va haydovchi navbat ko'rinishi (backend)
- [ ] Yo'lovchi: navbatni ko'rish (`get_route_queue`) va o'rindiq band qilish (`book_seat`)
- [ ] Bandning avtomatik bekor qilinishi (cron)
- [ ] Navigatsiya va umumiy UI komponentlari
- [ ] Autentifikatsiya ekranlari (telefon + OTP)
- [ ] Yo'lovchi ekranlari
- [ ] Haydovchi ekranlari
- [ ] Realtime yangilanishlar
- [ ] Yuklama testlari
- [ ] Android build
- [ ] Web deploy

## Ishga tushirish

### Talablar

- Node.js (LTS)
- npm
- Git
- Docker (lokal Supabase uchun)
- Supabase CLI

### O'rnatish

Repozitoriyni klonlang:

```bash
git clone https://github.com/dxxdev/navbat-taxi.git
cd navbat-taxi
```

Lokal Supabase'ni ishga tushiring va bazani qayta quring:

```bash
supabase start
supabase db reset
```

Pg testlarini ishga tushiring:

```bash
supabase test db
```

Turlarni yangilang (har bir migratsiyadan keyin):

```bash
supabase gen types typescript --local > mobile/src/types/database.ts
```

Mobil ilovani ishga tushiring:

```bash
cd mobile
npm install
npx expo start
```

Web'da ishga tushirish:

```bash
npx expo start --web
```

### Muhit o'zgaruvchilari

`mobile/.env.local` fayliga yoziladi:

```text
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

`EXPO_PUBLIC_` qiymatlari bundle ichiga tushadi, shuning uchun bu yerga hech qachon secret kalit qo'yilmaydi. Secret kalitlar, tokenlar va service role kalitlari repozitoriyga commit qilinmaydi.

## Rivojlanish yo'l xaritasi

1. Ishlab chiqish muhitini tayyorlash.
2. Loyiha arxitekturasini belgilash.
3. Ma'lumotlar bazasi sxemasi va RLS.
4. Rollarga bo'lingan ro'yxatdan o'tish.
5. Haydovchi ro'yxatdan o'tishi.
6. Haydovchi navbatga yozilishi, chiqishi va yo'lga chiqishi.
7. O'rindiq boshqaruvi, "Keldi" va haydovchi navbat ko'rinishi.
8. Yo'lovchi: navbatni ko'rish va o'rindiq band qilish.
9. Bandning avtomatik bekor qilinishi.
10. Mobil interfeys (yo'lovchi va haydovchi ekranlari).
11. Realtime yangilanishlar.
12. Test qilish va Android / Web build.

## Rivojlanish jurnali

### Dastlabki reja

- Ilovaning asosiy g'oyasi aniqlandi.
- Yo'lovchi va haydovchi rollari belgilandi.
- React Native + Expo va Supabase tanlandi.
- Android va Web qo'llab-quvvatlanishi rejalashtirildi.

### Backend (1–9-qismlar)

- Ma'lumotlar bazasi sxemasi, RLS va xatolar kodlari yaratildi.
- Rollarga bo'lingan ro'yxatdan o'tish va haydovchi ro'yxatdan o'tishi yozildi.
- Haydovchining navbatga yozilishi, chiqishi va yo'lga chiqishi yozildi.
- 9-qism: `driver_change_seats`, `driver_mark_arrived`, `get_driver_queue` RPC'lari va ularning pgTAP testlari (`05_driver_seats.test.sql`) yozildi. Testlar o'tdi, turlar qayta generatsiya qilindi.

## README bilan ishlash tartibimiz

Har bir bosqichdan keyin README'ning tegishli bo'limini ham yangilab boramiz:

- **RPC funksiyalari** — yangi funksiya qo'shilganda.
- **Texnologiyalar** — yangi texnologiya yoki kutubxona qo'shilganda.
- **Repozitoriy tuzilmasi** — fayl va papkalar o'zgarganda.
- **Ishga tushirish** — o'rnatish jarayoni o'zgarganda.
- **Loyiha holati** — vazifa bajarilganda.
- **Rivojlanish jurnali** — bosqich yakunlanganda.

> README har doim kodimizning haqiqiy holatiga mos bo'ladi. Hali yozilmagan funksiyalarni tayyor deb belgilamaymiz.