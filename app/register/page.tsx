// app/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    gender: "male",
    birthDate: "",
    heightCm: "",
    weightKg: "",
    activityLevel: "3",
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          heightCm: Number(form.heightCm),
          weightKg: Number(form.weightKg),
          activityLevel: Number(form.activityLevel),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "สมัครสมาชิกไม่สำเร็จ");
      } else {
        setMsg("สมัครสมาชิกสำเร็จ ✅ กำลังพาไปหน้า Analyze");
        router.push("/analyze");
      }
    } catch (err) {
      console.error(err);
      setMsg("เกิดข้อผิดพลาดในการสมัครสมาชิก");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-semibold">สมัครสมาชิก HealthyMate</h1>
        <p className="text-[11px] text-gray-400">
          กรอกข้อมูลสำหรับสร้างบัญชี และข้อมูลร่างกายพื้นฐาน
          เพื่อให้ระบบคำนวณ BMI / TDEE ให้คุณ
        </p>
      </div>

      <div className="space-y-3 text-xs sm:text-sm">
        <div className="space-y-1">
          <label className="text-[11px] text-gray-400">อีเมล</label>
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            type="email"
            className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2"
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] text-gray-400">รหัสผ่าน</label>
          <input
            name="password"
            value={form.password}
            onChange={handleChange}
            type="password"
            className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2"
            placeholder="••••••••"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] text-gray-400">ชื่อที่ใช้แสดง</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2"
            placeholder="เช่น Flame"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] text-gray-400">เพศ</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2"
            >
              <option value="male">ชาย</option>
              <option value="female">หญิง</option>
              <option value="other">อื่น ๆ</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-gray-400">วันเกิด</label>
            <input
              type="date"
              name="birthDate"
              value={form.birthDate}
              onChange={handleChange}
              className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] text-gray-400">
              น้ำหนัก (kg)
            </label>
            <input
              type="number"
              name="weightKg"
              value={form.weightKg}
              onChange={handleChange}
              className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-gray-400">
              ส่วนสูง (cm)
            </label>
            <input
              type="number"
              name="heightCm"
              value={form.heightCm}
              onChange={handleChange}
              className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] text-gray-400">
            ระดับกิจกรรม (1–5)
          </label>
          <select
            name="activityLevel"
            value={form.activityLevel}
            onChange={handleChange}
            className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2"
          >
            <option value="1">1 — นั่งทำงานทั้งวัน</option>
            <option value="2">
              2 — เดิน/ขยับตัวเล็กน้อยในชีวิตประจำวัน
            </option>
            <option value="3">
              3 — ออกกำลังกาย 1–3 วัน/สัปดาห์
            </option>
            <option value="4">
              4 — ออกกำลังกาย 3–5 วัน/สัปดาห์
            </option>
            <option value="5">
              5 — ใช้แรงงาน/ออกกำลังกายหนักประจำ
            </option>
          </select>
        </div>

        {msg && <p className="text-[11px] text-emerald-300">{msg}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-1 px-4 py-2.5 rounded-xl bg-emerald-500 text-black text-sm font-medium hover:bg-emerald-400 disabled:bg-gray-600"
        >
          {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
        </button>

        <p className="text-[11px] text-gray-400 text-center mt-2">
          มีบัญชีอยู่แล้ว?{" "}
          <Link href="/login" className="text-emerald-300 underline">
            เข้าสู่ระบบ
          </Link>
        </p>

      </div>
    </div>
  );
}
