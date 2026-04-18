"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { User, Mail, Calendar, Weight, Ruler, Activity, Save, RefreshCw, Heart, Info, LogOut, Target, Sparkles } from "lucide-react";
import { getDictionary } from "@/lib/get-dictionary";

type Profile = {
  id: string;
  email: string;
  name: string;
  gender: 'male' | 'female';
  birthDate: string;
  heightCm: number;
  weightKg: number;
  activityLevel: number;
  goal: 'weight_loss' | 'health_maintenance' | 'muscle_gain' | 'none';
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
  
  const [dict, setDict] = useState<any>(null);
  const [lang, setLang] = useState<'en' | 'th'>('th');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const savedLang = (localStorage.getItem("preferred-lang") as 'en' | 'th') || 'th';
      setLang(savedLang);
      const dictionary = await getDictionary(savedLang);
      setDict(dictionary);

      const authRes = await fetch("/api/auth/me", { cache: 'no-store' });
      const authData = await authRes.json();
      if (!authRes.ok || !authData.isLoggedIn) {
        window.location.href = "/login";
        return;
      }

      const res = await fetch("/api/profile");
      const data = await res.json();
      if (res.ok) {
        const p = data.profile || data;
        if (p.birthDate) p.birthDate = p.birthDate.slice(0, 10);
        setProfile(p);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleChange = (field: keyof Profile, value: any) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return "-";
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  // ✅ Client-side Preview Calculation (เพื่อให้ UI ตอบสนองทันทีที่เปลี่ยน Goal/น้ำหนัก)
  const previewStats = useMemo(() => {
    if (!profile) return null;
    const age = Number(calculateAge(profile.birthDate)) || 25;
    let bmr = (10 * profile.weightKg) + (6.25 * profile.heightCm) - (5 * age);
    bmr = profile.gender === "male" ? bmr + 5 : bmr - 161;
    
    let tdee = Math.round(bmr * profile.activityLevel);
    
    // Adjust by Goal
    if (profile.goal === 'weight_loss') tdee -= 500;
    else if (profile.goal === 'muscle_gain') tdee += 300;

    // Macros
    let p, f, c;
    if (profile.goal === 'muscle_gain') {
      p = Math.round((tdee * 0.35) / 4);
      f = Math.round((tdee * 0.25) / 9);
      c = Math.round((tdee * 0.40) / 4);
    } else if (profile.goal === 'weight_loss') {
      p = Math.round((tdee * 0.40) / 4);
      f = Math.round((tdee * 0.25) / 9);
      c = Math.round((tdee * 0.35) / 4);
    } else {
      p = Math.round((tdee * 0.30) / 4);
      f = Math.round((tdee * 0.30) / 9);
      c = Math.round((tdee * 0.40) / 4);
    }

    return { tdee, p, f, c };
  }, [profile]);

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
          goal: profile.goal
        }),
      });

      if (res.ok) {
        setMsg({ 
          text: lang === 'th' ? "อัปเดตข้อมูลและเป้าหมายสำเร็จ! ✅" : "Profile & Goal Updated! ✅", 
          type: "success" 
        });
        setTimeout(loadData, 800); 
      } else {
        throw new Error("Failed to save");
      }
    } catch (err) {
      setMsg({ 
        text: lang === 'th' ? "เกิดข้อผิดพลาดในการบันทึก" : "Error occurred while saving", 
        type: "error" 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    const confirmMsg = lang === 'th' ? "คุณต้องการออกจากระบบใช่หรือไม่?" : "Are you sure you want to logout?";
    if (!confirm(confirmMsg)) return;
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) window.location.href = "/login";
    } catch (err) {
      window.location.href = "/login";
    }
  };

  if (loading || !dict) return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <RefreshCw className="animate-spin text-emerald-500" size={32} />
    </div>
  );
  
  if (!profile) return <div className="p-8 text-red-400 min-h-screen text-center">No Profile Data</div>;

  const bmi = profile.weightKg && profile.heightCm 
    ? Number((profile.weightKg / ((profile.heightCm / 100) ** 2)).toFixed(1)) 
    : 0;

  const getBmiStatus = (val: number) => {
    if (val === 0) return { label: "-", color: "text-gray-500" };
    if (val < 18.5) return { label: lang === 'th' ? "น้ำหนักน้อย" : "Underweight", color: "text-blue-400" };
    if (val < 25) return { label: lang === 'th' ? "ปกติ" : "Normal", color: "text-emerald-500" };
    if (val < 30) return { label: lang === 'th' ? "น้ำหนักเกิน" : "Overweight", color: "text-yellow-500" };
    return { label: lang === 'th' ? "อ้วน" : "Obese", color: "text-red-500" };
  };
  const bmiStatus = getBmiStatus(bmi);

  return (
    <div className="min-h-screen bg-transparent pb-32">
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 dark:border-white/5 pb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="h-20 w-20 rounded-[2.2rem] bg-emerald-500 flex items-center justify-center text-black text-3xl font-black shadow-lg shadow-emerald-500/20 shrink-0">
              {profile.name?.[0].toUpperCase()}
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none text-slate-900 dark:text-white">
                {profile.name}
              </h1>
              <p className="text-gray-500 text-xs font-black uppercase tracking-[0.2em] leading-none opacity-60">
                {profile.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500/50 text-xs font-black uppercase tracking-widest bg-emerald-500/5 px-4 py-2 rounded-full border border-emerald-500/10 h-fit">
            <Activity size={12} className="animate-pulse" /> Health Profile Active
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-[3rem] p-8 space-y-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5"><Info size={80} className="text-slate-900 dark:text-white"/></div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-500 border border-emerald-500/20"><User size={20}/></div>
                  <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-800 dark:text-white">{dict.profile.title}</h2>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 dark:bg-white/[0.03] px-4 py-2 rounded-2xl border border-slate-200 dark:border-white/10 w-fit h-fit">
                   <QuickStat icon={<Weight size={12}/>} label={lang === 'th' ? "น้ำหนัก" : "Weight"} value={profile.weightKg} unit="kg" />
                   <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10" />
                   <QuickStat icon={<Ruler size={12}/>} label={lang === 'th' ? "ส่วนสูง" : "Height"} value={profile.heightCm} unit="cm" />
                   <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10" />
                   <QuickStat icon={<Calendar size={12}/>} label={lang === 'th' ? "อายุ" : "Age"} value={calculateAge(profile.birthDate)} unit={lang === 'th' ? "ปี" : "Yrs"} />
                </div>
              </div>

              {/* ✅ แถบเลือกเป้าหมาย (Goal) ใหม่ */}
              <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 space-y-4 relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Target size={16} className="text-emerald-500" />
                  <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">{lang === 'th' ? "เป้าหมายสุขภาพ (Goal)" : "Your Health Goal"}</label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <GoalButton active={profile.goal === 'weight_loss'} onClick={() => handleChange('goal', 'weight_loss')} label={lang === 'th' ? "ลดน้ำหนัก" : "Loss"} />
                  <GoalButton active={profile.goal === 'muscle_gain'} onClick={() => handleChange('goal', 'muscle_gain')} label={lang === 'th' ? "สร้างกล้าม" : "Gain"} />
                  <GoalButton active={profile.goal === 'health_maintenance'} onClick={() => handleChange('goal', 'health_maintenance')} label={lang === 'th' ? "คงที่" : "Maintain"} />
                  <GoalButton active={profile.goal === 'none'} onClick={() => handleChange('goal', 'none')} label={lang === 'th' ? "ทั่วไป" : "Normal"} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 relative z-10">
                <InputGroup label={dict.profile.name} value={profile.name} onChange={(v:any) => handleChange("name", v)} icon={<User size={14}/>} />
                <InputGroup label={dict.profile.gender} type="select" value={profile.gender} onChange={(v:any) => handleChange("gender", v)} icon={<Activity size={14}/>} 
                  options={[{ label: lang === 'th' ? "ชาย" : "Male", value: "male" }, { label: lang === 'th' ? "หญิง" : "Female", value: "female" }]} 
                />
                <InputGroup label={dict.profile.birthDate} type="date" value={profile.birthDate} onChange={(v:any) => handleChange("birthDate", v)} icon={<Calendar size={14}/>} />
                <InputGroup label={dict.profile.activity} type="select" value={profile.activityLevel} onChange={(v:any) => handleChange("activityLevel", v)} icon={<Activity size={14}/>} 
                  options={[
                    { label: lang === 'th' ? "นั่งทำงานเป็นหลัก (1.2)" : "Sedentary (1.2)", value: 1.2 },
                    { label: lang === 'th' ? "เบาๆ (1.375)" : "Light (1.375)", value: 1.375 },
                    { label: lang === 'th' ? "ปานกลาง (1.55)" : "Moderate (1.55)", value: 1.55 },
                    { label: lang === 'th' ? "หนัก (1.725)" : "Active (1.725)", value: 1.725 },
                  ]}
                />
                <InputGroup label={dict.profile.weight} type="number" value={profile.weightKg} onChange={(v:any) => handleChange("weightKg", Number(v))} icon={<Weight size={14}/>} />
                <InputGroup label={dict.profile.height} type="number" value={profile.heightCm} onChange={(v:any) => handleChange("heightCm", Number(v))} icon={<Ruler size={14}/>} />
              </div>

              {msg && (
                <div className={`p-4 rounded-2xl text-xs font-black uppercase tracking-widest animate-in zoom-in-95 ${msg.type === "success" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}>
                  {msg.text}
                </div>
              )}

              <button onClick={handleSave} disabled={saving} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 uppercase tracking-widest text-xs">
                {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                {saving ? (lang === 'th' ? "กำลังบันทึก..." : "Saving...") : dict.profile.saveBtn}
              </button>
            </div>

            <button onClick={handleLogout} className="w-full py-4 bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 rounded-[2.5rem] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3">
              <LogOut size={20} /> {lang === 'th' ? "ออกจากระบบ" : "SIGN OUT"}
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-[3rem] p-8 text-center space-y-4 shadow-xl">
              <p className="text-gray-500 text-[12px] font-black uppercase tracking-[0.3em]">{dict.profile.bmiTitle}</p>
              <div className="text-7xl font-black italic tracking-tighter text-slate-800 dark:text-white">{bmi}</div>
              <div className={`text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full inline-block bg-slate-100 dark:bg-white/5 ${bmiStatus.color}`}>
                {bmiStatus.label}
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/5 h-1.5 rounded-full mt-6 overflow-hidden">
                  <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${Math.min((bmi / 40) * 100, 100)}%` }}></div>
              </div>
            </div>

            <div className="bg-emerald-500 rounded-[3.5rem] p-8 text-black shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-8 -top-8 text-black/5 group-hover:scale-110 transition-transform duration-700"><Heart size={180} fill="currentColor" /></div>
              <h3 className="text-black/40 text-[12px] font-black uppercase tracking-widest relative z-10">{dict.profile.targetTitle}</h3>
              <div className="text-5xl font-black mt-2 relative z-10 italic tracking-tighter">
                {previewStats?.tdee || profile.dailyCalorieGoal} <span className="text-sm font-bold opacity-40">Kcal</span>
              </div>
              <div className="mt-8 space-y-3 relative z-10">
                <MacroRow label="Protein" value={previewStats?.p || profile.proteinGoal} unit="g" />
                <MacroRow label="Carbs" value={previewStats?.c || profile.carbsGoal} unit="g" />
                <MacroRow label="Fat" value={previewStats?.f || profile.fatGoal} unit="g" />
              </div>
              <div className="mt-6 p-4 bg-black/5 rounded-2xl border border-black/5 relative z-10">
                <p className="text-xs font-bold italic leading-relaxed opacity-60 flex items-center gap-2">
                  <Sparkles size={12} /> {lang === 'th' ? "เป้าหมายปรับตาม Goal และ BMI ของคุณ" : "Target optimized for your Goal & BMI."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoalButton({ active, onClick, label }: any) {
  return (
    <button onClick={onClick} className={`py-3 rounded-2xl text-xs font-black uppercase tracking-tighter transition-all border ${active ? 'bg-emerald-500 text-black border-emerald-500 shadow-lg shadow-emerald-500/20 scale-105' : 'bg-white dark:bg-white/5 text-gray-400 border-slate-200 dark:border-white/10 hover:border-emerald-500/50'}`}>
      {label}
    </button>
  );
}

function MacroRow({ label, value, unit }: any) {
  return (
    <div className="flex justify-between items-center bg-black/5 px-4 py-3 rounded-2xl border border-black/5">
      <span className="text-[12px] font-black uppercase tracking-widest text-black/60">{label}</span>
      <span className="font-black text-xl text-black italic leading-none">{value}<span className="text-xs ml-1 opacity-40">{unit}</span></span>
    </div>
  );
}

function QuickStat({ icon, label, value, unit }: any) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-emerald-600 opacity-70">{icon}</div>
      <div className="flex flex-col">
        <span className="text-xs text-gray-400 font-black uppercase tracking-widest leading-none">{label}</span>
        <span className="text-xs font-black text-slate-700 dark:text-white italic leading-none mt-1">{value || "-"} <span className="text-xs opacity-40">{unit}</span></span>
      </div>
    </div>
  );
}

function InputGroup({ label, value, onChange, type = "text", icon, options }: any) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">{icon}</div>
        {type === "select" ? (
          <select className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-10 pr-4 py-4 text-sm font-black italic text-slate-800 dark:text-white focus:border-emerald-500 outline-none appearance-none cursor-pointer" value={value} onChange={(e) => onChange(e.target.value)}>
            {options.map((opt: any) => <option key={opt.value} value={opt.value} className="bg-white dark:bg-[#0d0d0d]">{opt.label}</option>)}
          </select>
        ) : (
          <input type={type} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-10 pr-4 py-4 text-sm font-black italic text-slate-800 dark:text-white focus:border-emerald-500 outline-none transition-all" value={value} onChange={(e) => onChange(e.target.value)} />
        )}
      </div>
    </div>
  );
}