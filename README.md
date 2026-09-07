# sharqatna

إعادة بناء تطبيق شرقاطنا على Supabase.

## الملفات
- `index.html` التطبيق العام.
- `admin.html` لوحة الإدارة.
- `supabase.js` إعداد اتصال Supabase.
- `app.js` منطق التطبيق العام.
- `admin.js` تسجيل دخول الإدارة وإدارة الطلبات.
- `styles.css` التصميم المتجاوب.

## قاعدة البيانات
تم إنشاء جداول `areas`, `car_types`, `drivers`, `driver_requests`, `ratings`, `admins`, و`activity_logs` مع RLS وسياسات عامة وإدارية.

## إعداد أول مدير
1. أنشئ حساباً في Supabase Authentication باستخدام البريد وكلمة المرور.
2. أضف `user_id` الخاص بالحساب إلى جدول `public.admins`.
3. افتح `admin.html` وسجّل الدخول.

لا يتم وضع مفتاح service role داخل الواجهة. الواجهة تستخدم publishable key فقط، والحماية الفعلية تعتمد على RLS.
