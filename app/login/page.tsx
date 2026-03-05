"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Eye, EyeOff, Mail, Lock, LogIn, Loader2, Sparkles, 
  ChevronLeft, Sun, Moon, Languages 
} from "lucide-react";
import { useTheme } from "next-themes"; // Hook สำหรับเปลี่ยนธีม
import { getDictionary } from "@/lib/get-dictionary"; // ตัวดึงคำแปล

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 🌐 ระบบจัดการภาษาและธีม
  const { theme, setTheme } = useTheme();
  const [lang, setLang] = useState<'en' | 'th'>('th');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem("preferred-lang") as 'en' | 'th';
    if (savedLang) setLang(savedLang);
  }, []);

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'th' : 'en';
    localStorage.setItem("preferred-lang", newLang);
    window.location.reload();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg({ 
          text: data.error || (lang === 'th' ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง" : "Invalid email or password"), 
          type: "error" 
        });
      } else {
        setMsg({ 
          text: lang === 'th' ? "เข้าสู่ระบบสำเร็จ กำลังพาไปหน้าหลัก... 🚀" : "Login successful, redirecting... 🚀", 
          type: "success" 
        });
        
        setTimeout(() => {
          if (email === "useradmin@test.com") {
            router.push("/admin");
          } else {
            router.push("/");
          }
          router.refresh();
        }, 1200);
      }
    } catch (err: any) {
      setMsg({ 
        text: lang === 'th' ? "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้" : "Cannot connect to server", 
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 relative animate-in fade-in zoom-in-95 duration-700">
      
      {/* 🆕 แถบควบคุม: ปุ่ม Back + Theme + Language */}
      <div className="w-full max-w-sm flex items-center justify-between mb-6">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-emerald-500 transition-all group"
        >
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 group-hover:border-emerald-500/50 group-hover:bg-emerald-500/10 transition-all text-slate-600 dark:text-gray-400">
            <ChevronLeft size={16} />
          </div>
          {lang === 'th' ? "หน้าแรก" : "Back"}
        </Link>

        <div className="flex gap-2">
          {/* 🌓 ปุ่มสลับธีม */}
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-yellow-400 transition-all active:scale-90"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* 🌐 ปุ่มสลับภาษา */}
          <button 
            onClick={toggleLang}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-emerald-600 dark:text-emerald-500 text-[10px] font-black uppercase tracking-tighter transition-all"
          >
            <Languages size={14} />
            {lang === 'en' ? "TH" : "EN"}
          </button>
        </div>
      </div>

      {/* 🟢 Header Icon & Title */}
      <div className="text-center mb-8 space-y-3">
        <div className="inline-flex p-4 rounded-[2.5rem] bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-500 mb-2 shadow-2xl shadow-emerald-500/20">
          <LogIn size={32} />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">
          {lang === 'th' ? "ยินดีต้อนรับกลับมา" : "Welcome Back"}
        </h1>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest max-w-[200px] mx-auto opacity-60">
          {lang === 'th' ? "เข้าสู่ระบบเพื่อเข้าถึงแดชบอร์ด HealthyMate" : "Sign in to access your HealthyMate dashboard"}
        </p>
      </div>

      {/* 🟢 Login Form Card */}
      <div className="w-full max-w-sm space-y-6 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 p-8 rounded-[3rem] backdrop-blur-md shadow-xl dark:shadow-2xl transition-all">
        <form onSubmit={handleLogin} className="space-y-5">
          
          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-4">
              {lang === 'th' ? "อีเมลบัญชี" : "Account Email"}
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/40 group-focus-within:text-emerald-500 transition-colors">
                <Mail size={18} />
              </div>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm focus:border-emerald-500 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-4">
              {lang === 'th' ? "รหัสผ่านปลอดภัย" : "Secure Password"}
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/40 group-focus-within:text-emerald-500 transition-colors">
                <Lock size={18} />
              </div>
              <input
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-12 py-4 text-sm focus:border-emerald-500 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-700 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Feedback Message */}
          {msg && (
            <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-2 ${msg.type === "success" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20"}`}>
              <div className="flex items-center justify-center gap-2">
                <Sparkles size={14} className={msg.type === "success" ? "animate-pulse" : ""} />
                {msg.text}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 rounded-2xl bg-emerald-500 text-black font-black text-xs uppercase tracking-[0.25em] hover:bg-emerald-400 disabled:opacity-30 transition-all transform active:scale-[0.97] shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
            {loading ? (lang === 'th' ? "กำลังตรวจสอบ..." : "Verifying...") : (lang === 'th' ? "เข้าสู่ระบบ MATE" : "Sign In to Mate")}
          </button>
        </form>

        {/* Footer Link */}
        <div className="pt-2 text-center">
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">
            {lang === 'th' ? "ยังไม่มีบัญชี?" : "New here?"}{" "}
            <Link href="/register" className="text-emerald-600 dark:text-emerald-500 hover:text-emerald-400 transition-colors underline underline-offset-8">
              {lang === 'th' ? "สร้างบัญชีใหม่" : "Create New Account"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}