"use client";

import { useEffect, useState, useCallback } from "react";
import { User, Mail, Calendar, Weight, Ruler, Activity, Save, RefreshCw, Heart, Info, LogOut } from "lucide-react";
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

      // 🛡️ เช็ค Auth ก่อนดึงข้อมูล
      const authRes = await fetch("/api/auth/me", { cache: 'no-store' });
      const authData = await authRes.json();
      if (!authData.isLoggedIn) {
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
        setMsg({ 
          text: lang === 'th' ? "บันทึกข้อมูลสำเร็จ! ✅" : "Update & Sync Success! ✅", 
          type: "success" 
        });
        setTimeout(loadData, 800); 
      }
    } catch (err) {
      setMsg({ 
        text: lang === 'th' ? "เกิดข้อผิดพลาด" : "Error occurred", 
        type: "error" 
      });
    } finally {
      setSaving(false);
    }
  };

  // ✅ แก้ไข: ใช้ระบบ Logout ของตัวเอง (ลบ auth_token)
  const handleLogout = async () => {
    const confirmMsg = lang === 'th' ? "คุณต้องการออกจากระบบใช่หรือไม่?" : "Are you sure you want to logout?";
    if (!confirm(confirmMsg)) return;
    
    try {
      // สั่งลบคุกกี้ฝั่ง Server
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        // ล้างสถานะฝั่ง Client และดีดไปหน้า Login
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Logout Error:", err);
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
    if (lang === 'th') {
        if (val < 18.5) return { label: "น้ำหนักน้อย", color: "text-blue-400" };
        if (val < 25) return { label: "ปกติ", color: "text-emerald-500" };
        if (val < 30) return { label: "น้ำหนักเกิน", color: "text-yellow-500" };
        return { label: "อ้วน", color: "text-red-500" };
    } else {
        if (val < 18.5) return { label: "Underweight", color: "text-blue-400" };
        if (val < 25) return { label: "Normal", color: "text-emerald-500" };
        if (val < 30) return { label: "Overweight", color: "text-yellow-500" };
        return { label: "Obese", color: "text-red-500" };
    }
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
              <div className="flex flex-col md:flex-row md:items-end gap-3 md:gap-6">
                <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none text-slate-900 dark:text-white">
                  {profile.name}
                </h1>
              </div>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] leading-none opacity-60">
                {profile.email}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500/50 text-[10px] font-black uppercase tracking-widest bg-emerald-500/5 px-4 py-2 rounded-full border border-emerald-500/10 h-fit">
            <Activity size={12} className="animate-pulse" /> System Status: Online
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-[3rem] p-8 space-y-8 shadow-xl dark:shadow-2xl relative overflow-hidden">
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

              <div className="grid md:grid-cols-2 gap-6 relative z-10">
                <InputGroup label={dict.profile.name} value={profile.name} onChange={(v:any) => handleChange("name", v)} icon={<User size={14}/>} />
                <InputGroup label={dict.profile.gender} type="select" value={profile.gender} onChange={(v:any) => handleChange("gender", v)} icon={<Activity size={14}/>} 
                  options={[{ label: lang === 'th' ? "ชาย (Male)" : "Male", value: "male" }, { label: lang === 'th' ? "หญิง (Female)" : "Female", value: "female" }]} 
                />
                <InputGroup label={dict.profile.birthDate} type="date" value={profile.birthDate} onChange={(v:any) => handleChange("birthDate", v)} icon={<Calendar size={14}/>} />
                <InputGroup label={dict.profile.activity} type="select" value={profile.activityLevel} onChange={(v:any) => handleChange("activityLevel", v)} icon={<Activity size={14}/>} 
                  options={[
                    { label: lang === 'th' ? "นั่งทำงานเป็นหลัก (x1.2)" : "Sedentary (x1.2)", value: 1.2 },
                    { label: lang === 'th' ? "ออกกำลังกายเบาๆ (x1.375)" : "Lightly Active (x1.375)", value: 1.375 },
                    { label: lang === 'th' ? "ออกกำลังกายปานกลาง (x1.55)" : "Moderately Active (x1.55)", value: 1.55 },
                    { label: lang === 'th' ? "ออกกำลังกายหนัก (x1.725)" : "Very Active (x1.725)", value: 1.725 },
                    { label: lang === 'th' ? "นักกีฬา/งานใช้แรงมาก (x1.9)" : "Extra Active (x1.9)", value: 1.9 },
                  ]}
                />
                <InputGroup label={dict.profile.weight} type="number" value={profile.weightKg} onChange={(v:any) => handleChange("weightKg", v)} icon={<Weight size={14}/>} />
                <InputGroup label={dict.profile.height} type="number" value={profile.heightCm} onChange={(v:any) => handleChange("heightCm", v)} icon={<Ruler size={14}/>} />
              </div>

              {msg && (
                <div className={`p-4 rounded-2xl text-xs font-black uppercase tracking-widest animate-in zoom-in-95 ${msg.type === "success" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20"}`}>
                  {msg.text}
                </div>
              )}

              <button 
                onClick={handleSave} disabled={saving}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 uppercase tracking-widest text-xs"
              >
                {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                {saving ? dict.profile.calculating : dict.profile.saveBtn}
              </button>
            </div>

            <div className="pt-6">
              <button 
                onClick={handleLogout}
                className="w-full py-4 bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 rounded-[2.5rem] font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98] flex items-center justify-center gap-3 group shadow-lg hover:shadow-red-500/20"
              >
                <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                {lang === 'th' ? "ออกจากระบบ HEALTHYMATE" : "SIGN OUT FROM HEALTHYMATE"}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-[3rem] p-8 text-center space-y-4 shadow-lg dark:shadow-xl relative overflow-hidden">
              <p className="text-gray-500 text-[9px] font-black uppercase tracking-[0.3em]">{dict.profile.bmiTitle}</p>
              <div className="text-7xl font-black italic tracking-tighter text-slate-800 dark:text-white">{bmi}</div>
              <div className={`text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full inline-block bg-slate-100 dark:bg-white/5 ${bmiStatus.color}`}>
                {bmiStatus.label}
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/5 h-1.5 rounded-full mt-6 overflow-hidden border border-slate-200 dark:border-white/5">
                  <div 
                      className="bg-emerald-500 h-full transition-all duration-1000" 
                      style={{ width: `${Math.min((bmi / 40) * 100, 100)}%` }}
                  ></div>
              </div>
            </div>

            <div className="bg-emerald-500 rounded-[3.5rem] p-8 text-black shadow-2xl shadow-emerald-500/20 relative overflow-hidden group">
              <div className="absolute -right-8 -top-8 text-black/5 group-hover:scale-110 transition-transform duration-700">
                  <Heart size={180} fill="currentColor" />
              </div>
              <h3 className="text-black/40 text-[9px] font-black uppercase tracking-widest relative z-10">{dict.profile.targetTitle}</h3>
              <div className="text-6xl font-black mt-2 relative z-10 italic tracking-tighter">
                {profile.dailyCalorieGoal || 0} <span className="text-lg font-bold opacity-40 italic">Kcal</span>
              </div>
              <div className="mt-8 space-y-3 relative z-10">
                <MacroRow label={lang === 'th' ? "โปรตีน (30%)" : "Protein (30%)"} value={profile.proteinGoal || 0} unit="g" />
                <MacroRow label={lang === 'th' ? "คาร์บ (40%)" : "Carbs (40%)"} value={profile.carbsGoal || 0} unit="g" />
                <MacroRow label={lang === 'th' ? "ไขมัน (30%)" : "Fat (30%)"} value={profile.fatGoal || 0} unit="g" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickStat({ icon, label, value, unit }: any) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-emerald-600 dark:text-emerald-500 opacity-70">{icon}</div>
      <div className="flex flex-col">
        <span className="text-[8px] text-gray-400 font-black uppercase tracking-widest leading-none">{label}</span>
        <span className="text-xs font-black text-slate-700 dark:text-white italic leading-none mt-1">
          {value || "-"} <span className="text-[10px] opacity-40 font-bold">{unit}</span>
        </span>
      </div>
    </div>
  );
}

function InputGroup({ label, value, onChange, type = "text", icon, options }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
          {icon}
        </div>
        {type === "select" ? (
          <select 
            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-10 pr-4 py-4 text-sm font-black italic text-slate-800 dark:text-white focus:border-emerald-500 outline-none transition-all cursor-pointer appearance-none"
            value={value} onChange={(e) => onChange(e.target.value)}
          >
            {options.map((opt: any) => <option key={opt.value} value={opt.value} className="bg-white dark:bg-[#0d0d0d]">{opt.label}</option>)}
          </select>
        ) : (
          <input 
            type={type}
            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-10 pr-4 py-4 text-sm font-black italic text-slate-800 dark:text-white focus:border-emerald-500 outline-none transition-all tabular-nums"
            value={value} onChange={(e) => onChange(e.target.value)}
            style={{ colorScheme: 'auto' }}
          />
        )}
      </div>
    </div>
  );
}

function MacroRow({ label, value, unit }: any) {
  return (
    <div className="flex justify-between items-center bg-black/5 px-4 py-3 rounded-2xl backdrop-blur-sm border border-black/5">
      <span className="text-[9px] font-black uppercase tracking-widest text-black/60">{label}</span>
      <span className="font-black text-xl text-black italic leading-none">
        {value}
        <span className="text-[10px] font-bold ml-1 opacity-40">{unit}</span>
      </span>
    </div>
  );
}