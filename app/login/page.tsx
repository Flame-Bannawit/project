"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, LogIn, Loader2, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
        setMsg({ text: data.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง", type: "error" });
      } else {
        setMsg({ text: "เข้าสู่ระบบสำเร็จ กำลังพาไปหน้าหลัก... 🚀", type: "success" });
        
        // ✅ แยกเส้นทาง: ถ้าเป็น admin ไป /admin ถ้าเป็น user ไป / (Home)
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
      setMsg({ text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4">
      
      {/* 🟢 Header Icon & Title */}
      <div className="text-center mb-8 space-y-3">
        <div className="inline-flex p-4 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 mb-2 shadow-2xl shadow-emerald-500/20">
          <LogIn size={32} />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tighter italic">Welcome Back</h1>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest max-w-[200px] mx-auto opacity-60">
          Sign in to access your HealthyMate dashboard
        </p>
      </div>

      {/* 🟢 Login Form Card */}
      <div className="w-full max-w-sm space-y-6 bg-white/[0.03] border border-white/10 p-8 rounded-[3rem] backdrop-blur-md shadow-2xl">
        <form onSubmit={handleLogin} className="space-y-5">
          
          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Account Email</label>
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
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm focus:border-emerald-500 outline-none transition-all placeholder:text-gray-700"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Secure Password</label>
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
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-sm focus:border-emerald-500 outline-none transition-all placeholder:text-gray-700"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Feedback Message */}
          {msg && (
            <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-2 ${msg.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
              <div className="flex items-center gap-2">
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
            {loading ? "Verifying..." : "Sign In to Mate"}
          </button>
        </form>

        {/* Footer Link */}
        <div className="pt-2 text-center">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            New here?{" "}
            <Link href="/register" className="text-emerald-500 hover:text-emerald-400 transition-colors underline underline-offset-8">
              Create New Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}