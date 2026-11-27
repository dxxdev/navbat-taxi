# Test hisoblari

Sinov raqamlari `supabase/config.toml` dagi `[auth.sms.test_otp]` bo'limida
belgilangan. Haqiqiy SMS yuborilmaydi, tasdiqlash kodi hammasi uchun: **123456**.

| № | Raqam          | Vazifasi             | Ro'yxatdan o'tishda rol |
|---|----------------|----------------------|-------------------------|
| 1 | 998900000001   | Haydovchi            | Haydovchi               |
| 2 | 998900000002   | Haydovchi            | Haydovchi               |
| 3 | 998900000003   | Yo'lovchi            | Yo'lovchi               |
| 4 | 998900000004   | Yo'lovchi            | Yo'lovchi               |
| 5 | 998900000005   | Qo'shimcha yo'lovchi | Yo'lovchi               |
| 6 | 998900000006   | Qo'shimcha yo'lovchi | Yo'lovchi               |

> Bir hisob = bitta rol. Rol ro'yxatdan o'tishda tanlanadi va keyin
> o'zgartirilmaydi. Rolni noto'g'ri tanlasangiz, `supabase db reset` qiling
> (barcha foydalanuvchilar o'chadi, seed qayta yuklanadi).

## Qanday kirish

1. `supabase start`, so'ng `cd mobile && npx expo start` (Android yoki `w` — web).
2. Telefon raqam maydoniga yuqoridagi raqamni kiriting
   (ilova formati +998 bilan bo'lsa: `+998900000001`).
3. SMS kodi so'ralganda `123456` kiriting.
4. Birinchi kirishda ism va rolni tanlang. Haydovchi uchun `driver.auto_approve = true`
   bo'lgani uchun holat darhol `approved` bo'ladi.

Bir vaqtda ikkita rolni sinash uchun: biri Android'da, biri web'da, yoki web'da
ikkinchi brauzer profili / inkognito oynadan foydalaning (sessiya bitta bo'lgani uchun).

## Ro'yxatdan o'tgach Studio'da tekshirish

Studio: http://127.0.0.1:54323

1. **Authentication → Users**: raqam ro'yxatda paydo bo'lganini ko'ring.
2. **Table Editor → profiles**: `phone`, `full_name`, `role` ('passenger' / 'driver') to'g'ri ekanini tekshiring.
3. **Table Editor → drivers** (faqat haydovchi): `status = 'approved'` bo'lishi kerak.
4. Yoki **SQL Editor**'da:

```sql
select p.phone, p.full_name, p.role, d.status as driver_status
from public.profiles p
left join public.drivers d on d.user_id = p.id
order by p.created_at;
```

Agar `driver.auto_approve = false` bo'lsa, haydovchini
`docs/sql-snippets/approve_driver.sql` bilan qo'lda tasdiqlang.

## Foydali SQL'lar

- `docs/sql-snippets/approve_driver.sql` — haydovchini tasdiqlash
- `docs/sql-snippets/insert_booking.sql` — qo'lda band yaratish
- `docs/sql-snippets/expire_booking_now.sql` — band muddatini o'tmishga surish

## Haydovchi tasdiqlash rejimi (driver.auto_approve)

Prototipda admin paneli yo'q, tasdiqlash `settings` kaliti orqali boshqariladi.

**Avtomatik tasdiqni o'chirish** (yangi haydovchilar `pending` bo'ladi):

```sql
update public.settings set value = 'false'::jsonb, updated_at = now()
 where key = 'driver.auto_approve';
```

**Yoqish** (yangi haydovchilar darhol `approved`):

```sql
update public.settings set value = 'true'::jsonb, updated_at = now()
 where key = 'driver.auto_approve';
```

Eslatma: kalit faqat YANGI ro'yxatdan o'tishlarga ta'sir qiladi. Allaqachon `pending`
bo'lganlarni `docs/sql-snippets/approve_driver.sql` orqali tasdiqlang; ilovada status
ekranidagi "Yangilash" tugmasi holatni qayta o'qiydi.

Tekshirish ketma-ketligi: auto_approve=false -> haydovchi sifatida ro'yxatdan o'ting ->
"Tasdiq kutilmoqda" ekrani -> approve_driver.sql -> "Yangilash" -> /driver ochiladi.