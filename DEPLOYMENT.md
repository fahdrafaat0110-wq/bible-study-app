# دليل النشر والنشر

## خيار 1: Vercel (الأسرع والأسهل)

1. **رفع المستودع**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **إعداد متغيرات البيئة في Vercel**
   - اذهب إلى Vercel Dashboard → Your Project → Settings → Environment Variables

3. **المتغيرات الجديدة:**
   ```
   NEXTAUTH_URL = https://your-project.vercel.app
   NODE_ENV = production
   GOOGLE_CLIENT_ID = من Google Cloud Console
   GOOGLE_CLIENT_SECRET = من Google Cloud Console
   ADMIN_EMAILS = admin@example.com
   NEXTAUTH_SECRET = openssl rand -base64 32
   ```

4. **قاعدة البيانات**
   - **اختيار A**: Vercel Postgres (موصى) → استخدم `DATABASE_URL` من Environment Variables
   - **اختيار B**: Neon.tech → أضف `DATABASE_URL` كـ `postgresql://...`
   - **اختيار C**: SQLite → `DATABASE_URL=file:./prisma/dev.db` (للتجربة فقط)

5. **تنفيذ Migration**
   اذهب إلى Vercel → Your Project → Terminal وشغّل:
   ```bash
   npx prisma db push
   npm run seed
   ```

6. **Google OAuth Redirect URI**
   في Google Cloud Console → Credentials → OAuth 2.0 Client IDs:
   ```
   https://your-project.vercel.app/api/auth/callback/google
   ```

---

## خيار 2: Docker + VPS

### ملف Dockerfile (محدث)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["npm", "start"]
```

### ملف docker-compose.yml

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=sqlite:/app/prisma/dev.db
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=your-secret-here
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - ADMIN_EMAILS=${ADMIN_EMAILS}
    volumes:
      - ./data:/app/prisma
      - ./uploads:/app/public/uploads
```

### خطوات النشر
```bash
# 1. إنشاء .env.production
cp .env.example .env.production
# عدّل القيم

# 2. بناء وتشغيل
docker-compose up -d

# 3. تنفيذ Migration (مرة واحدة)
docker-compose exec app npx prisma db push
docker-compose exec app npm run seed
```

---

## إعداد Google OAuth

1. **Google Cloud Console** → APIs & Services → Credentials
2. **Create Credentials** → OAuth 2.0 Client ID
3. **Application type**: Web application
4. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://your-domain.com
   ```
5. **Authorized redirect URIs**:
   ```
   http://localhost:3000/api/auth/callback/google
   https://your-domain.com/api/auth/callback/google
   ```
6. انسخ **Client ID** و **Client Secret** إلى متغيرات البيئة

---

## قاعدة البيانات الإنتاجية (PostgreSQL)

### Supabase (الأسهل للبدء)
1. اذهب إلى supabase.com
2. أنشئ مشروعاً جديداً
3. احصل على `DATABASE_URL` من Settings → Database → Connection string
4. استخدمه كـ `DATABASE_URL` في متغيرات البيئة

### تنفيذ Migration
```bash
npx prisma migrate deploy
```

---

## صحة التطبيق (Health Check)

إنشاء endpoint `/api/health`:
```bash
curl https://your-domain.com/api/health
# يجب أن يعيد {"status":"ok"}
```

---

## مراقبة الأخطاء

### Vercel Logs
```bash
vercel logs your-project.vercel.app
```

### Sentry (اختياري)
أضف `@sentry/nextjs` كـ dependency ثم:
```bash
npm install @sentry/nextjs @sentry/tracing
npx sentry-inline-elf --project your-project
```

---

## النسخ الاحتياطية اليومية (Cron)

```bash
# أضف إلى crontab -e
0 2 * * * cd /path/to/app && node scripts/backup.js >> /var/log/backup.log 2>&1
```

---

## استعادة من نسخة احتياطية

```bash
npm run backup -- --restore ./backups/backup-2024-01-15T10-30-00.db
```

---

## مراجعة أمان

- [ ] `NEXTAUTH_SECRET` عشوائي 32 حرف
- [ ] `ADMIN_EMAILS` بالبريد الإلكتروني الوحيد
- [ ] لا مفاتيح API في الكود
- [ ] HTTPS مفعل
- [ ] قاعدة البيانات محفوظة في Secrets
- [ ] CORS محدود (Vercel يدعمه تلقائياً)