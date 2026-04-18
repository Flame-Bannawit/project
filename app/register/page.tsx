"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  UserPlus, Mail, Lock, User, Calendar, Weight, 
  Ruler, Activity, ChevronRight, Loader2, Eye, 
  EyeOff, ChevronLeft, Sparkles, Sun, Moon, Languages, CheckCircle2 
} from "lucide-react";
import { useTheme } from "next-themes";
import { getDictionary } from "@/lib/get-dictionary";

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "", 
    name: "",
    gender: "male",
    birthDate: "",
    heightCm: "",
    weightKg: "",
    activityLevel: "1.2",
  });
  
  const { theme, setTheme } = useTheme();
  const [dict, setDict] = useState<any>(null);
  const [lang, setLang] = useState<'en' | 'th'>('th');
  const [mounted, setMounted] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); 
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const initLang = useCallback(async () => {
    const savedLang = (localStorage.getItem("preferred-lang") as 'en' | 'th') || 'th';
    setLang(savedLang);
    const dictionary = await getDictionary(savedLang);
    setDict(dictionary);
    setMounted(true);
  }, []);

  useEffect(() => { initLang(); }, [initLang]);

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'th' : 'en';
    localStorage.setItem("preferred-lang", newLang);
    window.location.reload();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (form.password !== form.confirmPassword) {
      setMsg({ 
        text: lang === 'th' ? "รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง" : "Passwords do not match. Please check again.", 
        type: "error" 
      });
      return;
    }

    if (form.password.length < 6) {
      setMsg({ 
        text: lang === 'th' ? "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร" : "Password must be at least 6 characters.", 
        type: "error" 
      });
      return;
    }

    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: form.name,
          gender: form.gender,
          birthDate: form.birthDate,
          heightCm: Number(form.heightCm),
          weightKg: Number(form.weightKg),
          activityLevel: Number(form.activityLevel),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ text: data.error || (lang === 'th' ? "สมัครสมาชิกไม่สำเร็จ" : "Registration failed"), type: "error" });
      } else {
        setMsg({ text: lang === 'th' ? "สร้างบัญชีสำเร็จ! ✨" : "Account created successfully! ✨", type: "success" });
        
        // ✅ ฝังคำสั่งว่าเพิ่งสมัครเสร็จให้โชว์ Popup โภชนาการที่หน้าแรก
        sessionStorage.setItem("show_welcome_popup", "true");
        
        // ✅ เปลี่ยนจาก /analyze เป็น / (หน้าหลัก) เพื่อให้โชว์ Popup ได้
        setTimeout(() => router.push("/"), 1500);
      }
    } catch (err) {
      setMsg({ text: lang === 'th' ? "เกิดข้อผิดพลาดในการเชื่อมต่อ" : "Connection error", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !dict) return null;

  const isPasswordMatch = form.password && form.confirmPassword && form.password === form.confirmPassword;

  return (
    <div className="w-full max-w-md mx-auto animate-in fade-in zoom-in-95 duration-700 pb-20">
      
      {/* 🆕 Navigation Row */}
      <div className="flex items-center justify-between mb-8 mt-5 px-2">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-gray-500 hover:text-emerald-500 transition-all group"
        >
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 group-hover:border-emerald-500/50 group-hover:bg-emerald-500/10 transition-all">
            <ChevronLeft size={16} />
          </div>
          {lang === 'th' ? "หน้าแรก" : "Back to Home"}
        </Link>

        <div className="flex gap-2">
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-yellow-400 transition-all active:scale-90"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button 
            onClick={toggleLang}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-emerald-600 dark:text-emerald-500 text-xs font-black uppercase tracking-tighter transition-all"
          >
            <Languages size={14} />
            {lang === 'en' ? "TH" : "EN"}
          </button>
        </div>
      </div>

      <div className="text-center mb-8 space-y-2">
        <div className="inline-flex p-4 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 mb-2 shadow-2xl shadow-emerald-500/20">
          <UserPlus size={32} />
        </div>
        <h1 className="text-3xl font-black tracking-tighter uppercase italic text-slate-900 dark:text-white">
          Join <span className="text-emerald-500">Us</span>
        </h1>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest max-w-[250px] mx-auto opacity-60">
          {lang === 'th' ? "สร้างบัญชีเพื่อเริ่มต้นการดูแลสุขภาพ" : "Create an account for your health journey"}
        </p>
      </div>

      <div className="space-y-6 px-2">
        <div className="space-y-3">
          <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-4">Account Details</p>
          <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-6 space-y-4 shadow-xl backdrop-blur-md">
            <RegisterInput icon={<Mail size={18}/>} name="email" type="email" placeholder="Email Address" value={form.email} onChange={handleChange} />
            
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50 group-focus-within:text-emerald-500 transition-colors pointer-events-none">
                <Lock size={18}/>
              </div>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder={lang === 'th' ? "รหัสผ่าน (6 ตัวขึ้นไป)" : "Password (6+ chars)"}
                value={form.password}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-12 py-3.5 text-sm focus:border-emerald-500 outline-none transition-all text-slate-900 dark:text-white"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-500 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50 group-focus-within:text-emerald-500 transition-colors pointer-events-none">
                <Lock size={18}/>
              </div>
              <input
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder={lang === 'th' ? "ยืนยันรหัสผ่าน" : "Confirm Password"}
                value={form.confirmPassword}
                onChange={handleChange}
                className={`w-full bg-slate-50 dark:bg-white/5 border ${isPasswordMatch ? 'border-emerald-500/50' : 'border-slate-200 dark:border-white/10'} rounded-2xl pl-12 pr-12 py-3.5 text-sm focus:border-emerald-500 outline-none transition-all text-slate-900 dark:text-white`}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {isPasswordMatch && <CheckCircle2 size={16} className="text-emerald-500 animate-in zoom-in" />}
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-gray-400 hover:text-emerald-500 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <RegisterInput icon={<User size={18}/>} name="name" type="text" placeholder="Display Name" value={form.name} onChange={handleChange} />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-4">Body Metrics</p>
          <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-6 space-y-4 shadow-xl backdrop-blur-md">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase ml-4">Gender</label>
                <select 
                  name="gender" 
                  value={form.gender} 
                  onChange={handleChange} 
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer text-slate-900 dark:text-white"
                >
                  <option value="male" className="bg-white dark:bg-[#121212]">{lang === 'th' ? 'ชาย' : 'Male'}</option>
                  <option value="female" className="bg-white dark:bg-[#121212]">{lang === 'th' ? 'หญิง' : 'Female'}</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase ml-4">Birth Date</label>
                <input 
                  type="date" 
                  name="birthDate" 
                  value={form.birthDate} 
                  onChange={handleChange} 
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-emerald-500 outline-none transition-all text-slate-900 dark:text-white" 
                  style={{ colorScheme: theme === 'dark' ? 'dark' : 'light' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <RegisterInput icon={<Weight size={16}/>} name="weightKg" type="number" placeholder={lang === 'th' ? "น้ำหนัก (กก.)" : "Weight (kg)"} value={form.weightKg} onChange={handleChange} />
               <RegisterInput icon={<Ruler size={16}/>} name="heightCm" type="number" placeholder={lang === 'th' ? "ส่วนสูง (ซม.)" : "Height (cm)"} value={form.heightCm} onChange={handleChange} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase ml-4">Activity Level</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50 group-focus-within:text-emerald-500 transition-colors pointer-events-none">
                  <Activity size={18}/>
                </div>
                <select 
                  name="activityLevel" 
                  value={form.activityLevel} 
                  onChange={handleChange} 
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer text-slate-900 dark:text-white"
                >
                  <option value="1.2" className="bg-white dark:bg-[#121212]">Sedentary (x1.2)</option>
                  <option value="1.375" className="bg-white dark:bg-[#121212]">Lightly Active (x1.375)</option>
                  <option value="1.55" className="bg-white dark:bg-[#121212]">Moderately Active (x1.55)</option>
                  <option value="1.725" className="bg-white dark:bg-[#121212]">Very Active (x1.725)</option>
                  <option value="1.9" className="bg-white dark:bg-[#121212]">Extra Active (x1.9)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {msg && (
          <div className={`p-4 rounded-2xl text-xs font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-2 ${msg.type === "success" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20"}`}>
            <div className="flex items-center justify-center gap-2">
              <Sparkles size={14} className={msg.type === "success" ? "animate-pulse" : ""} />
              {msg.text}
            </div>
          </div>
        )}

        <div className="space-y-4 pb-12">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-5 rounded-[2rem] bg-emerald-500 text-black font-black text-xs uppercase tracking-[0.25em] hover:bg-emerald-400 disabled:opacity-30 transition-all transform active:scale-[0.97] shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 group"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
            {loading ? (lang === 'th' ? "กำลังสร้าง..." : "Creating...") : (lang === 'th' ? "สมัครสมาชิก" : "Create Account")}
            {!loading && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />}
          </button>

          <p className="text-xs text-gray-400 dark:text-gray-500 text-center font-bold uppercase tracking-widest">
            {lang === 'th' ? "มีบัญชีอยู่แล้ว?" : "Already have an account?"}{" "}
            <Link href="/login" className="text-emerald-600 dark:text-emerald-500 hover:text-emerald-400 transition-colors underline underline-offset-8">
              {lang === 'th' ? "เข้าสู่ระบบ" : "Sign In"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function RegisterInput({ icon, ...props }: any) {
  return (
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50 group-focus-within:text-emerald-500 transition-colors pointer-events-none">
        {icon}
      </div>
      <input
        {...props}
        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:border-emerald-500 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-700 text-slate-900 dark:text-white"
      />
    </div>
  );
}