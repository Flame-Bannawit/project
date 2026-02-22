"use client";

import { useEffect, useState } from "react";
import { User, Mail, Calendar, Weight, Ruler, Activity, Save, RefreshCw, Heart } from "lucide-react";

type Profile = {
  id: string;
  email: string;
  name: string;
  gender: 'male' | 'female';
  birthDate: string;
  heightCm: number;
  weightKg: number;
  activityLevel: number;
  dailyCalorieGoal: number;
  proteinGoal: number;
  fatGoal: number;
  carbsGoal: number;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (res.ok) {
        // ตรวจสอบว่าข้อมูลอยู่ใน data.profile หรือ data โดยตรง
        const p = data.profile || data;
        if (p.birthDate) p.birthDate = p.birthDate.slice(0, 10);
        setProfile(p);
      } else {
        setMsg({ text: data.error || "โหลดข้อมูลไม่สำเร็จ", type: "error" });
      }
    } catch (err) {
      setMsg({ text: "เกิดข้อผิดพลาดในการเชื่อมต่อ", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  const handleChange = (field: keyof Profile, value: any) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
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

      if (res.ok) {
        setMsg({ text: "บันทึกและคำนวณเป้าหมายใหม่สำเร็จ! ✅", type: "success" });
        // รอให้ Database บันทึกเสร็จแล้วโหลดใหม่เพื่อดึงค่าที่คำนวณจาก pre-save hook
        setTimeout(loadProfile, 800); 
      } else {
        const data = await res.json();
        setMsg({ text: data.error || "บันทึกไม่สำเร็จ", type: "error" });
      }
    } catch (err) {
      setMsg({ text: "เกิดข้อผิดพลาดในการบันทึก", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <RefreshCw className="animate-spin text-emerald-500" size={32} />
    </div>
  );
  
  if (!profile) return <div className="p-8 text-red-400">ไม่พบข้อมูลโปรไฟล์</div>;

  // คำนวณ BMI พื้นฐาน
  const bmi = profile.weightKg && profile.heightCm 
    ? Number((profile.weightKg / ((profile.heightCm / 100) ** 2)).toFixed(1)) 
    : 0;

  const getBmiStatus = (val: number) => {
    if (val === 0) return { label: "ไม่มีข้อมูล", color: "text-gray-500" };
    if (val < 18.5) return { label: "น้ำหนักน้อย", color: "text-blue-400" };
    if (val < 25) return { label: "ปกติ", color: "text-emerald-400" };
    if (val < 30) return { label: "น้ำหนักเกิน", color: "text-yellow-400" };
    return { label: "อ้วน", color: "text-red-400" };
  };
  const bmiStatus = getBmiStatus(bmi);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">My Body Profile</h1>
          <p className="text-gray-500 text-sm">จัดการข้อมูลร่างกายเพื่อการคำนวณสารอาหารที่แม่นยำ</p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
          <Mail size={16} className="text-emerald-500" />
          <span className="text-gray-300 text-sm truncate max-w-[200px]">{profile.email}</span>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* คอลัมน์ซ้าย: ฟอร์มแก้ไข */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 space-y-8 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-500"><User size={20}/></div>
              <h2 className="text-xl font-bold text-white">ข้อมูลพื้นฐาน</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <InputGroup label="ชื่อผู้ใช้งาน" value={profile.name} onChange={(v:any) => handleChange("name", v)} icon={<User size={14}/>} />
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">เพศ</label>
                <select 
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                  value={profile.gender} onChange={(e) => handleChange("gender", e.target.value)}
                >
                  <option value="male">ชาย (Male)</option>
                  <option value="female">หญิง (Female)</option>
                </select>
              </div>
              <InputGroup label="วันเกิด" type="date" value={profile.birthDate} onChange={(v:any) => handleChange("birthDate", v)} icon={<Calendar size={14}/>} />
              <InputGroup label="ระดับกิจกรรม" type="select" value={profile.activityLevel} onChange={(v:any) => handleChange("activityLevel", v)} icon={<Activity size={14}/>} 
                options={[
                  { label: "นั่งทำงานเป็นหลัก (x1.2)", value: 1.2 },
                  { label: "ออกกำลังกายเบาๆ (x1.375)", value: 1.375 },
                  { label: "ออกกำลังกายปานกลาง (x1.55)", value: 1.55 },
                  { label: "ออกกำลังกายหนัก (x1.725)", value: 1.725 },
                  { label: "นักกีฬา/งานใช้แรงมาก (x1.9)", value: 1.9 },
                ]}
              />
              <InputGroup label="น้ำหนัก (kg)" type="number" value={profile.weightKg} onChange={(v:any) => handleChange("weightKg", v)} icon={<Weight size={14}/>} />
              <InputGroup label="ส่วนสูง (cm)" type="number" value={profile.heightCm} onChange={(v:any) => handleChange("heightCm", v)} icon={<Ruler size={14}/>} />
            </div>

            {msg && (
              <div className={`p-4 rounded-2xl text-sm font-medium animate-pulse ${msg.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                {msg.text}
              </div>
            )}

            <button 
              onClick={handleSave} disabled={saving}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20"
            >
              {saving ? <RefreshCw className="animate-spin" /> : <Save size={20} />}
              {saving ? "กำลังคำนวณ..." : "บันทึกและคำนวณเป้าหมายใหม่"}
            </button>
          </div>
        </div>

        {/* คอลัมน์ขวา: ผลลัพธ์สุขภาพ */}
        <div className="space-y-6">
          <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 text-center space-y-4 shadow-xl">
            <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">Body Mass Index</h3>
            <div className="text-6xl font-black text-white">{bmi}</div>
            <div className={`text-lg font-bold ${bmiStatus.color}`}>{bmiStatus.label}</div>
            <div className="w-full bg-white/5 h-2 rounded-full mt-6 overflow-hidden border border-white/5">
                <div 
                    className="bg-emerald-500 h-full transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
                    style={{ width: `${Math.min((bmi / 40) * 100, 100)}%` }}
                ></div>
            </div>
          </div>

          <div className="bg-emerald-500 rounded-[2.5rem] p-8 text-black shadow-2xl shadow-emerald-500/20 relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 text-black/5 group-hover:scale-110 transition-transform duration-700">
                <Heart size={160} fill="currentColor" />
            </div>
            
            <h3 className="text-black/60 text-[10px] font-black uppercase tracking-widest relative z-10 font-bold">Daily TDEE Target</h3>
            <div className="text-5xl font-black mt-2 relative z-10">
              {profile.dailyCalorieGoal || 0} <span className="text-lg font-medium opacity-60">kcal</span>
            </div>
            
            <div className="mt-8 space-y-4 relative z-10">
              <MacroRow label="Protein (30%)" value={profile.proteinGoal || 0} unit="g" />
              <MacroRow label="Carbs (40%)" value={profile.carbsGoal || 0} unit="g" />
              <MacroRow label="Fat (30%)" value={profile.fatGoal || 0} unit="g" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputGroup({ label, value, onChange, type = "text", icon, options }: any) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-500 transition-colors">
          {icon}
        </div>
        {type === "select" ? (
          <select 
            className="w-full bg-black/40 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-white focus:border-emerald-500 outline-none transition-all cursor-pointer appearance-none"
            value={value} onChange={(e) => onChange(e.target.value)}
          >
            {options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        ) : (
          <input 
            type={type}
            className="w-full bg-black/40 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-white focus:border-emerald-500 outline-none transition-all tabular-nums"
            value={value} onChange={(e) => onChange(e.target.value)}
          />
        )}
      </div>
    </div>
  );
}

function MacroRow({ label, value, unit }: any) {
  return (
    <div className="flex justify-between items-center bg-black/10 px-4 py-3 rounded-2xl backdrop-blur-sm border border-black/5">
      <span className="text-xs font-bold uppercase tracking-tighter text-black/70">{label}</span>
      <span className="font-black text-lg text-black">
        {value}
        <span className="text-xs font-normal ml-0.5 opacity-60">{unit}</span>
      </span>
    </div>
  );
}