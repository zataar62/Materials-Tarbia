# إضافة لوحة الإدارة بدون تغيير واجهة الموقع

هذه الإضافة تحافظ على `index.html` و`style.css` كما هما، وتضيف:

- `admin.html` لوحة دخول وإدارة ملفات.
- `admin.css` تنسيق لوحة الإدارة بنفس ألوان الموقع.
- `admin.js` تسجيل الدخول والرفع والتعديل والحذف.
- `supabase-schema.sql` الجداول وسياسات الحماية وBucket الملفات.
- `supabase-config.example.js` إعدادات الاتصال.
- `data-bridge.js` جسر قراءة الملفات المنشورة من Supabase مع fallback للبيانات الحالية وتحديث Realtime.

## التشغيل

1. أنشئ مشروعًا في Supabase.
2. نفّذ محتوى `supabase-schema.sql` في SQL Editor.
3. أنشئ حساب الإدمن من Authentication > Users باستخدام الإيميل والباسورد.
4. انسخ `supabase-config.example.js` إلى `supabase-config.js` وضع Project URL وanon key.
5. أضف `supabase-config.js` و`data-bridge.js` قبل `script.js` في `index.html`.
6. افتح `admin.html` وسجّل الدخول بالحساب الذي أنشأته.

الموقع العام يقرأ الملفات التي حالتها `published = true` فقط. في حال غياب الإعدادات، يظل السلوك الحالي للموقع كما هو ولا تتأثر الواجهة.
