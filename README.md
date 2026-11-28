# NavbatTaksi

Vokzaldagi yo'nalishli taksi navbatini raqamlashtiruvchi ilova. Haydovchi vokzalda yo'nalishi va bo'sh o'rindiqlarini e'lon qilib navbatga yoziladi; yo'lovchi vokzalga kelmasdan navbatdagi mashinalarni ko'rib, o'rindiq band qiladi; belgilangan vaqtda kelmasa, band avtomatik bekor bo'ladi va o'rindiq boshqalarga ochiladi.

## Loyiha haqida

Hozirgi maqsad — xomaki prototip (proof of concept). U 4 ta asosiy funksiyani qamrab oladi:

1. Rollarga bo'lingan ro'yxatdan o'tish (yo'lovchi / haydovchi).
2. Haydovchining yo'nalish va bo'sh o'rinlarni e'lon qilishi (navbatga yozilishi).
3. Yo'lovchining navbatdagi mashinadan o'rindiq band qilishi.
4. Yo'lovchi vaqtida kelmasa, bandning avtomatik bekor qilinishi.

### Foydalanuvchi rollari

**Yo'lovchi**

- Navbatdagi mashinalarni ko'radi.
- O'rindiq band qiladi.
- Band holatini kuzatadi va bekor qiladi.

**Haydovchi**

- Yo'nalish, mashina, o'rindiq soni va narxni e'lon qilib navbatga yoziladi.
- O'z navbat o'rnini, oldingi va keyingi mashinani ko'radi.
- O'rindiqlarni boshqaradi (+1 / −1).
- Band qilgan yo'lovchilarni ko'radi: "Keldi" deb belgilaydi yoki qo'ng'iroq qiladi.
- "Yo'lga chiqdim" yoki "Navbatdan chiqish" orqali reysni yopadi.

Bir hisob — bitta rol (ro'yxatdan o'tishda tanlanadi).

## Texnologiyalar

### Mijoz (`mobile/`)

- React Native + Expo (TypeScript, strict)
- Expo Router (navigatsiya)
- TanStack Query (server holati)
- React Native Paper (Material 3)
- Supabase JS

### Backend (`supabase/`)

- PostgreSQL + PostGIS
- Supabase Auth (telefon + SMS OTP)
- Supabase Realtime
- Supabase Storage
- Supabase Edge Functions (Deno)

Barcha amallar PostgreSQL funksiyalari (RPC) orqali bajariladi; jadvallarga to'g'ridan-to'g'ri yozilmaydi (RLS yoqilgan).

### Ishlab chiqish vositalari

- Git, GitHub, Visual Studio Code
- Supabase CLI + Docker (lokal)

## Platformalar

- Android
- Web (react-native-web)

## Loyiha holati

> Prototip ustida ish davom etmoqda.

- [x] Loyihani rejalashtirish
- [x] Expo loyihasini sozlash
- [x] Navigatsiya
- [x] UI komponentlari (Paper, Material 3)
- [x] Supabase integratsiyasi
- [x] Autentifikatsiya va rollar
- [x] Haydovchi funksiyalari (navbatga yozilish, navbat ekrani)
- [ ] Yo'lovchi funksiyalari
- [ ] Bandlarni avtomatik bekor qilish (cron)
- [ ] Realtime yangilanishlar
- [ ] Testlash
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

Repozitoriyni yuklab oling:

```bash
git clone https://github.com/dxxdev/navbat-taxi.git
cd navbat-taxi
```

Lokal Supabase'ni ishga tushiring va migratsiyalarni qo'llang:

```bash
npx supabase start
npx supabase migration up
```

Mijoz paketlarini o'rnating:

```bash
cd mobile
npm install
```

Muhit o'zgaruvchilarini sozlang (quyida), so'ng:

```bash
npx expo start            # dev server
npx expo start --web      # web
npx expo start --android  # Android
```

### Muhit o'zgaruvchilari

`mobile/.env.local` fayliga yoziladi (repozitoriyga qo'shilmaydi):

```env
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

`EXPO_PUBLIC_` qiymatlari ilova ichiga tushadi, shuning uchun bu yerga hech qachon secret kalit qo'yilmaydi. Secret kalitlar mijoz kodiga va repozitoriyga kiritilmaydi.

Android emulyatorida lokal Supabase manzili `10.0.2.2` orqali, jismoniy qurilmada kompyuterning lokal IP manzili orqali beriladi.

### Foydali buyruqlar

```bash
# DB turlarini yangilash (har bir migratsiyadan keyin)
npx supabase gen types typescript --local > mobile/src/types/database.ts

# Yangi migratsiya
npx supabase migration new <nom>

# Tekshiruvlar (mobile/ ichida)
npx tsc --noEmit
npx expo lint
```

Baza o'zgarishi faqat yangi migratsiya fayli orqali kiritiladi; mavjud migratsiya tahrirlanmaydi.

## Loyiha tuzilmasi

```text
navbat-taksi/
  mobile/     React Native (Expo)
    app/        Expo Router marshrutlari
    src/
      core/       supabase klienti, auth, xatolar, useCountdown
      l10n/       barcha matnlar (strings.ts)
      data/       TanStack Query hook'lari va RPC chaqiruvlari
      features/   ekranlar (driver/ ...)
      components/ umumiy komponentlar (ConfirmDialog ...)
      types/      database.ts (generatsiya qilinadi)
  supabase/   config.toml, migrations/, functions/, tests/, seed.sql
  docs/       sql-snippets/ (qo'lda ishlatiladigan SQL'lar)
  scripts/
```

## Sinov uchun SQL

Yo'lovchi ilovasi tayyor bo'lgunga qadar haydovchi ekranini sinash uchun band qo'lda yaratiladi:
`docs/sql-snippets/insert_booking.sql`.

1. Faylda `v_driver_phone` ni haydovchining telefoni bilan almashtiring (`profiles.phone` formatida).
2. Har safar `v_idx` ni (1..9) o'zgartiring: bitta yo'lovchida bitta faol band bo'ladi.
3. Supabase Studio → SQL Editor'da ishga tushiring (lokal baza uchun).
4. Haydovchi ekranida "Yangilash" bosing.

Muddati tugashini tekshirish uchun `v_expires_in_sec := 30` qiling. Skript RLS va `book_seat` ni chetlab o'tadi, shuning uchun faqat lokal bazada ishlating.

## Prototipda yo'q

Admin/dispetcher paneli, to'lov, reyting, chat, xarita, FCM push, pauza, GPS heartbeat, jarimalar, hodisalar, audit jurnali, tushish bekatlari, iOS, ruscha til.

Haydovchini admin tasdiqlashi o'rniga `settings` dagi `driver.auto_approve = true` bo'lsa, haydovchi darhol `approved` bo'ladi.

## Rivojlanish yo'l xaritasi

1. Ishlab chiqish muhitini tayyorlash.
2. Loyiha arxitekturasini shakllantirish.
3. Navigatsiyani amalga oshirish.
4. UI komponentlari.
5. Supabase'ni sozlash.
6. Autentifikatsiya.
7. Haydovchi funksiyalari.
8. Yo'lovchi funksiyalari.
9. Navbat va band mantig'i.
10. Realtime yangilanishlar.
11. Testlash.
12. Android va Web build'larni tayyorlash.

## Rivojlanish jurnali

### Dastlabki rejalashtirish

- Ilova g'oyasi, yo'lovchi va haydovchi rollari aniqlandi.
- React Native + Expo va Supabase tanlandi.
- Android va Web platformalari rejalashtirildi.

### 1–10-qismlar

- Ma'lumotlar modeli, RPC funksiyalari va RLS siyosatlari.
- Telefon orqali ro'yxatdan o'tish va rol tanlash.
- Haydovchining navbatga yozilish ekrani (yo'nalish, mashina, o'rindiq, narx).

### 11-qism: haydovchi navbat ekrani

- `DriverQueueScreen`: yo'nalish va navbat o'rni, oldingi/keyingi mashina.
- O'rindiqlar kartasi (Jami / O'tirgan / Band / Bo'sh), "+1 o'tirdi" va "−1" tugmalari.
- Band qilganlar ro'yxati: ism, telefon, o'rindiq soni, teskari taymer (`useCountdown`), "Keldi" va "Qo'ng'iroq".
- "Yo'lga chiqdim" (kelmagan yo'lovchi bo'lsa tasdiqlash dialogi, `force` bilan), "Navbatdan chiqish" va "Yangilash".
- `ConfirmDialog` (Paper Dialog): web'da ishlamaydigan `Alert.alert` o'rniga.
- `get_driver_queue` kengaytirildi (migratsiya: `get_driver_queue_details`): shahar, yo'nalish nomi, oldingi/keyingi mashina, yo'lovchi ismi va telefoni.
- `docs/sql-snippets/insert_booking.sql` yangi ekranga moslandi.
- Realtime keyingi qismlarda qo'shiladi.

## README bilan ishlash tartibimiz

Har bir bosqichdan keyin README'ning tegishli bo'limini ham yangilab boramiz:

- **Loyiha haqida** — yangi funksiya qo'shilganda.
- **Texnologiyalar** — yangi texnologiya yoki kutubxona qo'shilganda.
- **Loyiha tuzilmasi** — fayl va papkalar o'zgarganda.
- **Ishga tushirish** — o'rnatish jarayoni o'zgarganda.
- **Loyiha holati** — vazifa bajarilganda.
- **Rivojlanish jurnali** — bosqich yakunlanganda.

> README har doim kodimizning haqiqiy holatiga mos bo'ladi. Hali yozilmagan funksiyalarni tayyor deb belgilamaymiz.