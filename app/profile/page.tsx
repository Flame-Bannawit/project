// app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";

type HealthInfo = {
  age: number;
  bmi: number;
  bmr: number;
  tdee: number;
};

type Profile = {
  id: string;
  email: string;
  name: string;
  gender: string;
  birthDate: string;
  heightCm: number;
  weightKg: number;
  activityLevel: number | string;
  health: HealthInfo;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const loadProfile = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "โหลดข้อมูลโปรไฟล์ไม่สำเร็จ");
        setProfile(null);
      } else {
        const p = data.profile;
        p.birthDate = p.birthDate?.slice(0, 10);
        setProfile(p);
      }
    } catch (err) {
      console.error(err);
      setMsg("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange =
    (field: keyof Profile) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      if (!profile) return;
      setProfile({ ...profile, [field]: e.target.value } as Profile);
    };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          gender: profile.gender,
          birthDate: profile.birthDate,
          heightCm: Number(profile.heightCm),
          weightKg: Number(profile.weightKg),
          activityLevel: Number(profile.activityLevel),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "บันทึกไม่สำเร็จ");
      } else {
        const p = data.profile;
        p.birthDate = p.birthDate?.slice(0, 10);
        setProfile(p);
        setMsg("บันทึกข้อมูลสำเร็จ ✅");
      }
    } catch (err) {
      console.error(err);
      setMsg("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-xs text-gray-400">กำลังโหลด...</div>;
  if (!profile)
    return (
      <div className="text-xs text-red-400">
        {msg || "ไม่พบข้อมูลโปรไฟล์ กรุณาลองเข้าสู่ระบบใหม่"}
      </div>
    );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">โปรไฟล์สุขภาพ</h1>
        <p className="text-[11px] text-gray-400">
          ใช้ข้อมูลเหล่านี้ในการคำนวณ BMI, BMR และ TDEE
        </p>
      </div>

      <div className="grid md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-4">
        {/* ฟอร์ม */}
        <div className="space-y-3 text-xs sm:text-sm">
          <div className="space-y-1">
            <label className="text-[11px] text-gray-400">อีเมล</label>
            <input
              value={profile.email}
              disabled
              className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-xs text-gray-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-gray-400">ชื่อ</label>
            <input
              value={profile.name}
              onChange={handleChange("name")}
              className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-gray-400">เพศ</label>
              <select
                value={profile.gender}
                onChange={handleChange("gender")}
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
                value={profile.birthDate}
                onChange={handleChange("birthDate")}
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
                value={profile.weightKg}
                onChange={handleChange("weightKg")}
                className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-gray-400">
                ส่วนสูง (cm)
              </label>
              <input
                type="number"
                value={profile.heightCm}
                onChange={handleChange("heightCm")}
                className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-gray-400">
              ระดับกิจกรรม (1–5)
            </label>
            <select
              value={profile.activityLevel}
              onChange={handleChange("activityLevel")}
              className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2"
            >
              <option value={1}>1 — นั่งทำงานทั้งวัน</option>
              <option value={2}>2 — ขยับตัวบ้างเล็กน้อย</option>
              <option value={3}>3 — ออกกำลัง 1–3 วัน/สัปดาห์</option>
              <option value={4}>4 — ออกกำลัง 3–5 วัน/สัปดาห์</option>
              <option value={5}>5 — ออกหนัก/ใช้แรงงาน</option>
            </select>
          </div>

          {msg && <p className="text-[11px] text-emerald-300">{msg}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-1 px-4 py-2.5 rounded-xl bg-emerald-500 text-black text-sm font-medium hover:bg-emerald-400 disabled:bg-gray-600"
          >
            {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </button>
        </div>

        {/* Summary card */}
        <div className="rounded-2xl border border-white/10 bg-black/50 p-4 space-y-2 text-xs">
          <div className="font-semibold text-sm mb-1">สรุปสุขภาพ</div>
          <p className="text-[11px] text-gray-400">
            คำนวณจากข้อมูลล่าสุดของคุณ
          </p>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <div className="text-[11px] text-gray-400">อายุ</div>
              <div className="font-semibold">
                {profile.health.age} ปี
              </div>
            </div>
            <div>
              <div className="text-[11px] text-gray-400">BMI</div>
              <div className="font-semibold">
                {profile.health.bmi.toFixed(1)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-gray-400">BMR</div>
              <div className="font-semibold">
                {Math.round(profile.health.bmr)} kcal/day
              </div>
            </div>
            <div>
              <div className="text-[11px] text-gray-400">
                TDEE โดยประมาณ
              </div>
              <div className="font-semibold">
                {Math.round(profile.health.tdee)} kcal/day
              </div>
            </div>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            ในอนาคต Dashboard จะนำค่ากลุ่มนี้ไปเปรียบเทียบกับพลังงานจากมื้ออาหารที่คุณบันทึก
            เพื่อวางแผนลด/เพิ่มน้ำหนักอัตโนมัติ
          </p>
        </div>
      </div>
    </div>
  );
}
