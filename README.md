# دراسة الكتاب الصحيح

**نظام إدارة الحضور وقراءة الإنجيل والنوتة الروحية** — تطبيق احترافي كامل وجاهز للإنتاج.

---

## ✨ المميزات

| الميزة | الوصف |
|----------|---------|
| **تسجيل دخول Google OAuth** | حساب مسؤول واحد فقط، قائمة بيضاء للبريد الإلكتروني |
| **إدارة الأعضاء** | إضافة/تعديل/حذف مع منع التكرار (اسم + هاتف) |
| **بحث ذكي فوري** | بالاسم، جزء من الاسم، أو رقم الهاتف |
| **ثلاث خانات مستقلة** | حضور، قراءة الإنجيل، النوتة الروحية — كل واحدة تحفظ منفصلة |
| **إدارة اجتماعات** | اجتماعات متعددة، تاريخ محفوظ لا يُمسح |
| **تقارير مفصلة** | حضور، قراءة، نوتة — مع تصدير Excel |
| **RTL عربي كامل** | خطوط Cairo/Tajawal، اتجاه صحيح، ترجمة كاملة |
| **قاعدة بيانات SQLite/PostgreSQL** | علاقات صحيحة، قيود فريدة، فهارس |

---

## 🏗️ البنية التقنية

| الطبقة | التقنية | السبب |
|--------|----------|--------|
| Framework | **Next.js 14 (App Router)** | Server Components + API Routes في إطار واحد |
| لغة | **TypeScript** | أمان الأنواع عبر الـ API والـ UI |
| تنسيق | **Tailwind CSS** | Utility-first، RTL سهل، ألوان دقيقة |
| ORM | **Prisma** | استعلامات آمنة، migrations، unique constraints |
| قاعدة بيانات | **SQLite (افتراضي) / PostgreSQL (إنتاج)** | صفر بنية تحتية محلياً، إنتاج قابل للتوسع |
| مصادقة | **Next-Auth v5 + Google OAuth** | Battle-tested، جلسة آمنة |
| تحقق | **Zod** | تحقق من جانب الخادم في كل تعديل |
| تصدير | **SheetJS (xlsx)** | خفيف، يعمل في Node، لا خدمات خارجية |

---

## 🚀 التشغيل المحلي

### 1. المتطلبات
- Node.js 20+
- npm 10+
- حساب Google Cloud Console لـ OAuth

### 2. التثبيت
```bash
cd bible-study
npm install
```

### 3. إعداد متغيرات البيئة
```bash
cp .env.example .env
```

حرر `.env` بالقيم الحقيقية:

```env
# قاعدة البيانات (SQLite محلي - لا يحتاج إعداد)
DATABASE_URL="file:./prisma/dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="ضع_سلسلة_عشوائية_32_حرف_هنا"

# Google OAuth - من Google Cloud Console
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# ⚠️重要: القائمة البيضاء - البريد الإلكتروني الوحيد المسموح له بالدخول
ADMIN_EMAILS="admin@example.com"
```

**توليد NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4. إعداد Google OAuth
1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. أنشئ **OAuth 2.0 Client ID** (Web application)
3. **Authorized redirect URIs:** أضف `http://localhost:3000/api/auth/callback/google`
4. انسخ Client ID و Client Secret إلى `.env`

### 5. تهيئة قاعدة البيانات
```bash
npm run db:push   # ينشئ الجداول
npm run db:seed   # يضيف المسؤول من ADMIN_EMAILS
```

### 6. التشغيل
```bash
npm run dev
```
افتح `http://localhost:3000` — سيوجهك لصفحة الدخول بحساب Google.

---

## 📦 النشر للإنتاج

### خيار A: Vercel (الأبسط لـ Next.js)

1. ادفع الكود إلى GitHub
2. في Vercel: **Import Project** → اختر المستودع
3. أضف متغيرات البيئة من `.env` (عدا `DATABASE_URL` إذا كنت تستخدم Postgres)
4. **قاعدة البيانات:** استخدم **Vercel Postgres** أو **Neon** أو **Supabase**
   - غيّر `DATABASE_URL` في Vercel إلى رابط Postgres
   - في `prisma/schema.prisma` غيّر `provider = "postgresql"`
5. Deploy!

### خيار B: Docker + VPS

```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npx prisma generate
RUN npx prisma db push
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t bible-study .
docker run -d -p 3000:3000 --env-file .env bible-study
```

### متغيرات البيئة للإنتاج (الحد الأدنى)
```env
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-32-char-secret"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
ADMIN_EMAILS="admin@example.com"
NODE_ENV="production"
```

---

## 💾 النسخ الاحتياطي والاستعادة

```bash
# إنشاء نسخة احتياطية (ينشئ ملف .db و .db.gz في ./backups/)
npm run backup

# عرض النسخ المتاحة
node scripts/backup.js --list

# استعادة من نسخة
node scripts/backup.js --restore ./backups/backup-2024-01-15T10-30-00.db
```

**استراتيجية مقترحة:**
- `npm run backup` يومياً عبر cron
- احتفظ بـ 30 نسخة محلياً + نسخة أسبوعية في تخزين سحابي (S3، Google Drive، إلخ)
- اختبر الاستعادة شهرياً

---

## 🧪 سيناريوهات الاختبار (Checklist)

| # | السيناريو | النتيجة المتوقعة |
|---|------------|------------------|
| 1 | تسجيل عضو جديد ببيانات صحيحة | ✅ ينجح، يظهر في القائمة |
| 2 | تسجيل نفس الاسم + نفس الهاتف | ❌ يرفض بخطأ "مسجل بالفعل" |
| 3 | تسجيل نفس الاسم + هاتف مختلف | ✅ ينجح (عضو مختلف) |
| 4 | بحث بالاسم الكامل | ✅ يظهر العضو |
| 5 | بحث بجزء من الاسم | ✅ يظهر العضو |
| 6 | بحث برقم الهاتف | ✅ يظهر العضو |
| 7 | تحديد حضور ✓ | ✅ يحفظ، يظهر شارة خضراء |
| 8 | إلغاء تحديد حضور ✗ | ✅ يحفظ، يظهر شارة رمادية |
| 9 | تحديد قراءة ✓ مع حضور ✗ | ✅ مستقلان، كلاهما محفوظ |
| 10 | تحديد نوتة ✓ | ✅ مستقل، محفوظ |
| 11 | إنشاء اجتماع جديد | ✅ يبدأ بجميع الخانات ⬜ لكل الأعضاء |
| 12 | التبديل لاجتماع سابق | ✅ يظهر بيانات ذلك الاجتماع فقط |
| 13 | تحديث بيانات اجتماع سابق | ✅ يحدث بيانات ذلك الاجتماع فقط |
| 14 | تقرير الحضور - تصفية "حضر فقط" | ✅ يعرض الحضور فقط |
| 15 | تصدير Excel للحضور | ✅ ملف `.xlsx` ببيانات صحيحة |
| 16 | دخول بحساب Google غير مصرح | ❌ يرفض، رسالة "غير مخول" |
| 17 | تحديث الصفحة بعد حفظ | ✅ البيانات محفوظة (persisted) |
| 18 | تعديل عضو - تغيير الاسم لهاتف موجود | ❌ يرفض "مسجل لعضو آخر" |
| 19 | حذف عضو | ✅ يحذف العضو وجميع سجلاته |
| 20 | RTL - الاتجاه، المحاذاة، الخطوط | ✅ صحيح تماماً |

---

## 📁 هيكل المشروع

```
bible-study/
├── prisma/
│   ├── schema.prisma       # مخطط قاعدة البيانات (القلب)
│   └── seed.ts             # بيانات أولية
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/              # NextAuth routes
│   │   │   ├── members/           # CRUD للأعضاء
│   │   │   ├── meetings/          # CRUD للاجتماعات
│   │   │   └── activities/        # حفظ الخانات الثلاث (atomic)
│   │   ├── dashboard/             # الصفحة الرئيسية (Smart Search)
│   │   ├── members/               # صفحة "جميع الأعضاء"
│   │   ├── attendance/            # تقرير الحضور
│   │   ├── bible-reading/         # تقرير القراءة
│   │   ├── spiritual-notes/       # تقرير النوتة
│   │   ├── meetings/              # سجل الاجتماعات
│   │   ├── login/                 # صفحة الدخول
│   │   ├── layout.tsx             # الجذر + الخطوط
│   │   ├── page.tsx               # حارس المسار + Dashboard
│   │   ├── providers.tsx          # SessionProvider
│   │   └── globals.css            # Tailwind + RTL + Design System
│   ├── components/
│   │   ├── MemberSearch.tsx       # البحث الذكي + 3 checkboxes
│   │   └── StatsCards.tsx         # بطاقات الإحصائيات
│   ├── lib/
│   │   ├── auth.ts                # NextAuth config + whitelist enforcement
│   │   ├── authz.ts               # requireAdmin helper
│   │   ├── prisma.ts              # Prisma singleton
│   │   ├── validators.ts          # Zod schemas
│   │   └── age.ts                 # حساب العمر من الميلاد
│   └── types/index.ts             # TypeScript interfaces
├── scripts/backup.js              # نسخة احتياطية/استعادة
├── public/manifest.json           # PWA manifest
├── .env.example                   # قالب البيئة
├── tailwind.config.ts             # Design tokens (الألوان الدقيقة)
├── next.config.mjs
├── tsconfig.json
└── package.json
```

---

## 🔐 الأمان

| التدبير | التنفيذ |
|----------|----------|
| **مسؤول واحد فقط** | `ADMIN_EMAILS` في `auth.ts` callback — يرفض قبل إنشاء الجلسة |
| **لا تسجيل أعضاء** | لا توجد API لتسجيل أعضاء — فقط المسؤول يضيف |
| **تحقق خادم** | Zod في كل `POST`/`PATCH`/`DELETE` |
| **قيود قاعدة بيانات** | `unique(member_id, meeting_id)` يمنع التكرار |
| **حذف متسلسل** | `onDelete: Cascade` ينظف السجلات المرتبطة |
| **متغيرات بيئة** | الأسرار في `.env` فقط، لا في الكود |
| **جلسة JWT** | موقعة بـ `NEXTAUTH_SECRET`، عمر 8 ساعات |

---

## 🛠️ الصيانة

| المهمة | الأمر | التكرار |
|--------|--------|----------|
| تحديث التبعيات | `npm update` | شهرياً |
| تشغيل الاختبارات | (أضف Jest/Playwright) | قبل كل نشر |
| نسخة احتياطية | `npm run backup` | يومياً (cron) |
| مراقبة المساحة | `df -h` | أسبوعياً |
| مراجعة السجلات | `pm2 logs` أو Vercel logs | عند المشاكل |

---

## 📝 ملاحظات المطور

### إضافة حقل جديد لعضو
1. أضف الحقل في `prisma/schema.prisma` في نموذج `Member`
2. أضف التحقق في `src/lib/validators.ts`
3. شغّل `npm run db:push`
4. حدّث UI في `MemberModal` وجدول `members/page.tsx`

### تغيير الألوان
عدّل `tailwind.config.ts` → `theme.extend.colors` — التغيير سينعكس في كل مكان.

### إضافة تقرير جديد
1. أنشئ صفحة في `src/app/new-report/page.tsx` (انسخ من `attendance`)
2. أضف رابط في التنقل (`Dashboard.tsx`)
3. أضف تصدير Excel إذا لزم

---

## 📄 الترخيص

هذا المشروع ملكية خاصة — جميع الحقوق محفوظة.

---

## 🙏 شكر

مبني بـ ❤️ باستخدام:
- Next.js, React, TypeScript
- Prisma, NextAuth, Tailwind CSS
- SheetJS, Zod, Cairo/Tajawal Fonts