# 🥗 HealthyMate

> เว็บแอปพลิเคชันด้านสุขภาพและโภชนาการ ช่วยให้ผู้ใช้ติดตามสุขภาพ บันทึกอาหาร และรับคำแนะนำจาก AI

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-8-green?logo=mongodb)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)

---

## 📋 สารบัญ

- [ฟีเจอร์หลัก](#-ฟีเจอร์หลัก)
- [Tech Stack](#-tech-stack)
- [โครงสร้างโปรเจกต์](#-โครงสร้างโปรเจกต์)
- [การติดตั้งและรันบนเครื่อง](#-การติดตั้งและรันบนเครื่อง)
- [Environment Variables](#-environment-variables)
- [Scripts](#-scripts)

---

## ✨ ฟีเจอร์หลัก

- **ระบบ Authentication** — สมัคร/เข้าสู่ระบบด้วย NextAuth.js พร้อม JWT
- **AI ผู้ช่วยด้านสุขภาพ** — ใช้ Google Gemini, Groq, และ OpenAI ให้คำแนะนำส่วนตัว
- **อัพโหลดรูปภาพ** — จัดการรูปภาพผ่าน Cloudinary
- **Data Visualization** — แสดงข้อมูลสุขภาพด้วย Recharts
- **Internationalization** — รองรับหลายภาษาผ่าน dictionaries
- **Dark Mode** — รองรับ Light/Dark theme ด้วย next-themes

---

## 🛠 Tech Stack

| หมวด | เทคโนโลยี |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Database | MongoDB + Mongoose 8 |
| Auth | NextAuth.js 4 |
| Styling | Tailwind CSS 4 |
| AI | Google Gemini, Groq SDK, OpenAI |
| Storage | Cloudinary |
| Charts | Recharts |

---

## 📁 โครงสร้างโปรเจกต์

```
project/
├── app/                  # Next.js App Router (pages, layouts, API routes)
├── dictionaries/         # ไฟล์ i18n สำหรับหลายภาษา
├── lib/                  # Utility functions (db connection, helpers)
├── models/               # Mongoose models (schema ของ MongoDB)
├── public/               # Static assets (รูปภาพ, icons)
├── middleware.ts          # Middleware (cache control สำหรับ /profile, /admin)
├── next.config.ts         # Next.js configuration
└── package.json
```

---

## 🚀 การติดตั้งและรันบนเครื่อง

### ความต้องการเบื้องต้น

- Node.js 18+
- npm หรือ yarn
- MongoDB Atlas account (หรือ MongoDB local)

### ขั้นตอน

**1. Clone โปรเจกต์**

```bash
git clone https://github.com/Flame-Bannawit/project.git
cd project
```

**2. ติดตั้ง dependencies**

```bash
npm install
```

**3. ตั้งค่า Environment Variables**

สร้างไฟล์ `.env.local` ที่ root ของโปรเจกต์ แล้วใส่ค่าตาม [ส่วน ENV ด้านล่าง](#-environment-variables)

**4. รัน Development Server**

```bash
npm run dev
```

เปิดเบราว์เซอร์ที่ [http://localhost:3000](http://localhost:3000)

---

## 🔑 Environment Variables

สร้างไฟล์ `.env.local` และกรอกค่าดังนี้:

```env
# MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/healthymate

# NextAuth
NEXTAUTH_SECRET=your-secret-key-32-chars-minimum
NEXTAUTH_URL=http://localhost:3000

# JWT (ถ้าใช้แยกจาก NextAuth)
JWT_SECRET=your-jwt-secret

# AI Services (ใส่เฉพาะที่ใช้)
GOOGLE_AI_API_KEY=your-google-ai-key
GROQ_API_KEY=your-groq-key
OPENAI_API_KEY=your-openai-key

# Cloudinary (ถ้าใช้อัพโหลดรูป)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

> ⚠️ **อย่า commit ไฟล์ `.env.local` ขึ้น Git** — ไฟล์นี้ถูก `.gitignore` ไว้แล้ว

---

## 📜 Scripts

```bash
npm run dev      # รัน development server (localhost:3000)
npm run build    # Build สำหรับ production
npm run start    # รัน production server
npm run lint     # ตรวจสอบ code ด้วย ESLint
```

---

## 📄 License

This project is for educational purposes.
