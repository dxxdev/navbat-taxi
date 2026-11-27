# NavbatTaksi

Yo'nalishli taksilar uchun vokzaldagi jonli navbatni raqamlashtiruvchi ilova. Haydovchi vokzalda yo'nalishi va bo'sh o'rindiqlarini e'lon qilib navbatga yoziladi. Yo'lovchi vokzalga kelmasdan navbatdagi mashinalarni ko'radi va o'rindiq band qiladi. Belgilangan vaqtda kelmasa, band avtomatik bekor bo'ladi va o'rindiq boshqalarga ochiladi.

> **Holat:** xomaki prototip (proof of concept), ishlab chiqish jarayonida.

## Prototipning 4 ta asosiy funksiyasi

| # | Funksiya | Holat |
|---|---|---|
| 1 | Rollarga bo'lingan ro'yxatdan o'tish (yo'lovchi / haydovchi) | Yo'lovchi qismi tayyor, haydovchi qismi keyingi bosqichda |
| 2 | Haydovchi bo'sh o'rinlari va yo'nalishini e'lon qilishi (navbatga yozilish) | Hali yozilmagan |
| 3 | Yo'lovchi navbatdagi mashinadan o'rindiq band qilishi | Hali yozilmagan |
| 4 | Vaqtida kelmagan yo'lovchining bandini avtomatik bekor qilish | Hali yozilmagan |

## Hozir ishlaydigan imkoniyatlar

- Telefon raqami + SMS OTP orqali kirish (Supabase Auth).
- Rol tanlash (yo'lovchi / haydovchi): ism kiritiladi, rol **bir marta** tanlanadi va keyin o'zgartirilmaydi. Tanlov tasdiqlash dialogi orqali tasdiqlanadi.
- Sessiya va profil holatiga qarab avtomatik yo'naltirish (guard):
  - sessiya yo'q: kirish ekrani
  - rol tanlanmagan: rol tanlash ekrani
  - yo'lovchi: `/passenger`
  - haydovchi: `/driver/register` (hozircha placeholder)
- Yo'lovchi bosh ekrani: "Xush kelibsiz, {ism}" va chiqish tugmasi.
- Web'da ham, Android'da ham ishlaydi (kontent kengligi 600 px bilan cheklangan).

## Tech Stack

### Mijoz (`mobile/`)

- React Native + Expo (SDK 58), TypeScript (strict)
- Expo Router: fayl asosidagi navigatsiya
- React Native Paper: Material 3 komponentlari (Dialog, Snackbar, Button va boshqalar)
- TanStack Query: server holati
- `@expo/vector-icons`: ikonkalar
- `@react-native-async-storage/async-storage`: sessiyani saqlash
- Platformalar: Android va Web

### Backend (`supabase/`)

- Supabase: PostgreSQL, Auth (telefon + SMS OTP)
- pgTAP: ma'lumotlar bazasi testlari
- Rejalashtirilgan, hali ishlatilmagan: PostGIS, Realtime (Broadcast), Storage, Edge Functions

### Ishlab chiqish vositalari

- Git, GitHub, Visual Studio Code
- Supabase CLI + Docker (lokal baza)

## Arxitektura qoidalari

1. Barcha amallar PostgreSQL funksiyalari (RPC) orqali bajariladi: `plpgsql`, `security definer`, `set search_path = ''`. Funksiya ichida `auth.uid()` va rol tekshiriladi.
2. Har bir funksiyada `revoke execute ... from public, anon`, so'ng faqat kerakli rolga `grant`.
3. `public` sxemadagi har bir jadvalda RLS yoqilgan. Mijoz jadvallarga to'g'ridan-to'g'ri yozmaydi (profil ismi va tili bundan mustasno).
4. Baza o'zgarishi faqat yangi migratsiya fayli orqali (`supabase migration new <nom>`). Mavjud migratsiya tahrirlanmaydi.
5. Xatolar `raise exception using errcode = 'PT409', message = 'KOD'` ko'rinishida. Mijozda ular o'zbekcha matnga o'giriladi (`mobile/src/core/errors.ts`).
6. Matnlar faqat o'zbekcha (lotin) va hammasi bitta faylda: `mobile/src/l10n/strings.ts`.
7. Vaqt UTC'da saqlanadi (ilova Asia/Tashkent bo'yicha ko'rsatadi). Pul butun son, so'mda.

## Ma'lumotlar bazasi RPC funksiyalari

| Funksiya | Kim chaqiradi | Vazifasi |
|---|---|---|
| `register_profile(p_role, p_full_name)` | `authenticated` | Rolni (`passenger` / `driver`) bir marta tanlaydi va ismni saqlaydi. Xatolar: `UNAUTHENTICATED`, `INVALID_ROLE`, `INVALID_NAME`, `PROFILE_EXISTS`, `NOT_FOUND` |

Boshqa funksiyalar (navbat, band qilish va hokazo) keyingi bosqichlarda qo'shiladi.

## Loyiha tuzilmasi

```
navbat-taksi/
  mobile/                    React Native (Expo) ilova
    app/                     Expo Router marshrutlari
      _layout.tsx            ildiz layout: provayderlar va guard (Gate)
      (auth)/                kirish ekranlari
      (onboarding)/role.tsx  rol tanlash ekrani
      passenger/index.tsx    yo'lovchi bosh ekrani
      driver/register.tsx    haydovchi ro'yxatdan o'tishi (placeholder)
    src/
      core/                  supabase mijozi, guards.ts, errors.ts
      data/                  server so'rovlari (useProfile va boshqalar)
      features/onboarding/   useRegisterProfile
      l10n/strings.ts        barcha o'zbekcha matnlar
      types/database.ts      Supabase'dan generatsiya qilingan turlar
  supabase/
    config.toml
    migrations/              faqat yangi fayl qo'shiladi
    tests/database/          pgTAP testlari
    seed.sql
  docs/                      hujjatlar (docs/sql-snippets/ — qo'lda ishlatiladigan SQL'lar)
  scripts/
```

## Ishga tushirish

### Talablar

- Node.js (LTS, Expo SDK 58 talabiga mos versiya)
- npm
- Git
- Docker (lokal Supabase uchun)
- Supabase CLI

### O'rnatish

```bash
git clone https://github.com/dxxdev/navbat-taxi.git
cd navbat-taxi
```

Lokal bazani ishga tushirish:

```bash
supabase start
supabase db reset
```

Ilova bog'liqliklarini o'rnatish:

```bash
cd mobile
npm install
```

Yangi paket qo'shishda doim `npx expo install <paket>` ishlating (Expo SDK'ga mos versiya tanlanadi).

### Muhit o'zgaruvchilari

`mobile/.env.local` faylini yarating (git'ga tushmaydi):

```
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<supabase status chiqargan publishable kalit>
```

`EXPO_PUBLIC_` bilan boshlanadigan qiymatlar ilova bundle'iga tushadi, shuning uchun bu yerga hech qachon secret kalit qo'yilmaydi. Secret kalitlar va service role kalitlari repozitoriyga tushmaydi.

Android emulyatorida URL `http://10.0.2.2:54321` bo'lishi mumkin. Haqiqiy qurilmada kompyuterning lokal IP manzilidan foydalaning.

### Ishga tushirish

```bash
cd mobile
npx expo start --web       # Web
npx expo start --android   # Android
```

### Tekshiruvlar

```bash
# Baza testlari (pgTAP)
supabase test db

# Mijoz: lint va tur tekshiruvi
cd mobile
npx expo lint
npx tsc --noEmit
```

### Turlarni yangilash

Har bir migratsiyadan keyin:

```bash
supabase gen types typescript --local > mobile/src/types/database.ts
```

## Project Status

- [x] Loyihani rejalashtirish
- [x] Expo loyihasini sozlash
- [x] Frontend arxitekturasi (papkalar tuzilmasi, provayderlar)
- [x] Navigatsiya (Expo Router + guard)
- [ ] UI komponentlari (Paper ishlatilmoqda, umumiy komponentlar kutubxonasi yo'q)
- [x] Supabase integratsiyasi
- [x] Autentifikatsiya (telefon + SMS OTP)
- [x] Rol tanlash va yo'lovchi onboarding
- [ ] Haydovchi ro'yxatdan o'tishi
- [ ] Haydovchi: yo'nalish e'lon qilish va navbatga yozilish
- [ ] Yo'lovchi: yo'nalishlar va navbatni ko'rish
- [ ] Yo'lovchi: o'rindiq band qilish
- [ ] Band muddati o'tganda avtomatik bekor qilish
- [ ] Realtime yangilanishlar
- [ ] Xavfsizlik tekshiruvi (RLS auditi)
- [ ] Testlash (pgTAP testlari qisman mavjud)
- [ ] Android build
- [ ] Web deploy

## Prototipda yo'q narsalar

Admin/dispetcher paneli, to'lov, reyting, chat, xarita, FCM push, pauza, GPS heartbeat, jarimalar, hodisalar, audit jurnali, tushish bekatlari, iOS, ruscha til.

Haydovchini admin tasdiqlashi o'rniga `settings` jadvalidagi `driver.auto_approve = true` kaliti ishlatiladi: yoqilgan bo'lsa, haydovchi darhol `approved` bo'ladi. Bir hisob = bitta rol.

## Development Roadmap

1. Ishlab chiqish muhitini tayyorlash
2. Loyiha arxitekturasini yaratish
3. Navigatsiyani amalga oshirish
4. Supabase'ni sozlash
5. Autentifikatsiyani amalga oshirish
6. Rol tanlash va yo'lovchi onboarding
7. Haydovchi ro'yxatdan o'tishi
8. Haydovchi funksiyalari (e'lon, navbatga yozilish)
9. Yo'lovchi funksiyalari (navbatni ko'rish, band qilish)
10. Band muddati tugashi (avtomatik bekor qilish)
11. Realtime yangilanishlar
12. Testlash
13. Android va Web build'larini tayyorlash

## Development Log

**Dastlabki rejalashtirish**

- Loyiha g'oyasi, yo'lovchi va haydovchi rollari aniqlandi.
- React Native + Expo va Supabase tanlandi.
- Android va Web platformalari rejalashtirildi.

**1–5-qismlar: asos**

- Expo loyihasi, papkalar tuzilmasi va navigatsiya.
- Supabase lokal muhiti, ma'lumotlar modeli va pgTAP testlari.
- Telefon + SMS OTP orqali kirish, sessiya va profil yuklash.

**6-qism: rol tanlash va yo'lovchi onboarding**

- `register_profile` RPC va uning pgTAP testi (`02_register_profile.test.sql`).
- `useRegisterProfile` hook: RPC chaqiradi va profil keshini yangilaydi.
- Rol tanlash ekrani: ism maydoni, ikkita karta, "Rolni keyin o'zgartirib bo'lmaydi" eslatmasi, tasdiqlash dialogi, xato Snackbar'i.
- `guards.ts` kengaytirildi: rolsiz foydalanuvchi rol ekraniga, yo'lovchi `/passenger`ga, haydovchi `/driver/register`ga yo'naltiriladi.
- Yo'lovchi bosh ekrani (salomlashish va chiqish) va haydovchi ro'yxatdan o'tishi uchun placeholder qo'shildi.

## README bilan ishlash tartibimiz

Har bir bosqichdan keyin README'ning tegishli bo'limini ham yangilab boramiz:

- **Features**: yangi funksiya qo'shilganda.
- **Tech Stack**: yangi texnologiya yoki kutubxona qo'shilganda.
- **Project Structure**: fayl va papkalar o'zgarganda.
- **Installation**: o'rnatish jarayoni o'zgarganda.
- **Project Status**: vazifa bajarilganda.
- **Development Log**: bosqich yakunlanganda.

> README har doim kodimizning haqiqiy holatiga mos bo'ladi. Hali yozilmagan funksiyalarni tayyor deb belgilamaymiz.