# سينما العرب (Cinema Alrab) 🎬

منصة عربية حديثة لمشاهدة الأفلام والمسلسلات والأنمي بدون إعلانات، مبنية باستخدام Next.js 15 و React 19 و Supabase و TailwindCSS.

---

## 🚀 التشغيل والتطوير (Quick Start)

1. **تثبيت الحزم (Dependencies):**
```bash
npm install
```

2. **تشغيل خادم التطوير (Development Server):**
```bash
npm run dev
```

3. **بناء المشروع (Production Build):**
```bash
npm run build
```

---

## 🗄️ إعداد قاعدة البيانات (Supabase Setup)

يحتوي المشروع على ملف `schema.sql` في المسار الرئيسي لتهيئة الجداول المطلوبة:
1. توجه إلى [Supabase SQL Editor](https://supabase.com/dashboard/project/yvewuhqsmbomfxujzanv/sql/new).
2. انسخ محتويات ملف `schema.sql` والصقها في محرر SQL.
3. اضغط **Run** لإنشاء الجداول وسياسات الأمان (RLS).

---

## ⚙️ متغيرات البيئة (Environment Variables)

تأكد من وجود المتغيرات في ملف `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://yvewuhqsmbomfxujzanv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_qUo5pvmZF5m60pXwaRbdhg_4QLQAoGK
SUPABASE_SERVICE_ROLE_KEY=sb_secret_iaLwcR1q25bTR3hoAJrFAA_2ouCq6SH

# TMDB API
NEXT_PUBLIC_TMDB_API_KEY=d13b01ccdb189f56d99fd01c886c5644
NEXT_PUBLIC_TMDB_BASE_URL=https://api.themoviedb.org/3
NEXT_PUBLIC_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p/

# Site Settings
CANONICAL_URL=https://cinema4arab.online
NEXT_PUBLIC_SITE_NAME=سينما العرب
```

