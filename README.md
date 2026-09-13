# CampusHub — College LMS System

Ek complete Learning Management System jisme teen parts hain:

1. **`backend/`** — Node.js + Express + Prisma API (Admin, Teacher, Student sabka data yahan se serve hota hai)
2. **`web/`** — React web app (Admin Panel + Teacher Panel)
3. **`mobile/`** — React Native (Expo) app for Students (Android + iOS)

---

## Features

| Role | Kya kar sakta hai |
|---|---|
| **Admin** | Teachers add/edit/delete, Students add/edit/delete, Courses banana, teacher assign karna, students enroll karna |
| **Teacher** | Attendance mark karna, Assignments create karna, submissions grade karna, Online MCQ Exams banana, results dekhna |
| **Student** (mobile app) | Login, apni attendance % dekhna, assignments submit karna, online exams dena, overall progress/grades dekhna |

---

## 1. Backend Setup (do this first — web & mobile dono isi par depend karte hain)

```bash
cd backend
npm install
cp .env.example .env
# .env mein JWT_SECRET ko kisi random lambi string se replace kar dein

npx prisma migrate dev --name init   # database tables banayega
npm run seed                          # pehla admin account banayega
npm run dev                           # server http://localhost:4000 par chalega
```

**Default admin login:**
- Email: `admin@college.edu`
- Password: `Admin@123`
- ⚠️ Pehle login ke baad ye password zaroor change karein (Admin panel se apna khud ka naya admin bana kar purana disable kar sakte hain, ya user update API se password change karein)

---

## 2. Web App Setup (Admin + Teacher)

```bash
cd web
npm install
npm run dev    # http://localhost:5173 par khulega
```

Agar backend kisi doosri jagah (production server) par hai, to `web/.env` file banayein:
```
VITE_API_URL=https://your-backend-url.com/api
```

---

## 3. Mobile App Setup (Students — React Native + Expo)

```bash
cd mobile
npm install
npx expo start
```

- Expo Go app apne phone mein install karein (Play Store/App Store se)
- QR code scan karein — app phone par khul jayegi

**Zaroori:** `mobile/api/client.js` mein `BASE_URL` ko apne backend ke real address se replace karein:
```js
const BASE_URL = "https://your-backend-url.com/api";
```
(Local testing ke liye phone aur computer same WiFi par hone chahiye, aur `http://<computer-ka-LAN-IP>:4000/api` use karein — `localhost` phone se kaam nahi karega)

Real app store pe publish karne ke liye:
```bash
npx eas build --platform android
npx eas build --platform ios
```
(Iske liye free Expo account chahiye — [expo.dev](https://expo.dev))

---

## 4. Production Deployment (Real hosting ke liye)

### Backend + Database
1. Database: Free/cheap options — [Neon](https://neon.tech) ya [Railway](https://railway.app) (PostgreSQL)
2. `backend/prisma/schema.prisma` mein `provider = "sqlite"` ko `provider = "postgresql"` kar dein
3. `.env` mein `DATABASE_URL` ko Postgres connection string se replace karein
4. Backend host karein: [Railway](https://railway.app), [Render](https://render.com), ya apne college ke VPS par
5. Deploy se pehle: `npx prisma migrate deploy` aur `npm run seed`

### Web App
- [Vercel](https://vercel.com) ya [Netlify](https://netlify.com) par free deploy ho sakta hai — bas GitHub repo connect karein
- Environment variable set karein: `VITE_API_URL=https://your-backend-url.com/api`

### Mobile App
- Expo EAS Build se `.apk`/`.aab` (Android) aur `.ipa` (iOS) banayein
- Google Play Console / Apple App Store par submit karein

---

## Security Checklist (Real use se pehle zaroor karein)

- [ ] `JWT_SECRET` ko strong random string se replace karein
- [ ] Default admin password turant change karein
- [ ] HTTPS use karein (Railway/Render/Vercel automatically HTTPS dete hain)
- [ ] Database ka regular backup lein
- [ ] File uploads (agar future mein add karein) ke liye size limits aur type validation zaroor lagayein

---

## Tech Stack

- **Backend:** Node.js, Express, Prisma ORM, JWT auth, bcrypt
- **Database:** SQLite (dev) → PostgreSQL (production)
- **Web:** React 18, Vite, Tailwind CSS, React Router
- **Mobile:** React Native, Expo, React Navigation

## Project Structure

```
lms/
├── backend/          # Express API + Prisma schema
├── web/              # Admin + Teacher web dashboard
└── mobile/           # Student mobile app (Expo)
```
