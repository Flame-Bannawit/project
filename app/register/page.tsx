"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, Mail, Lock, User, Calendar, Weight, Ruler, Activity, ChevronRight, Loader2, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    gender: "male",
    birthDate: "",
    heightCm: "",
    weightKg: "",
    activityLevel: "1.2",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
        setMsg({ text: data.error || "สมัครสมาชิกไม่สำเร็จ", type: "error" });
      } else {
        setMsg({ text: "สร้างบัญชีสำเร็จ! กำลังพาคุณไปสัมผัส AI ✨", type: "success" });
        setTimeout(() => router.push("/analyze"), 1500);
      }
    } catch (err) {
      setMsg({ text: "เกิดข้อผิดพลาดในการเชื่อมต่อ", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    // ✅ บังคับความกว้างและจัดกลางให้รับกับ Layout
    <div className="w-full max-w-md mx-auto animate-in fade-in zoom-in-95 duration-700">
      
      {/* 🟢 Header Section */}
      <div className="text-center mb-8 space-y-2 pt-4">
        <div className="inline-flex p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 mb-2">
          <UserPlus size={32} />
        </div>
        <h1 className="text-3xl font-black tracking-tighter uppercase">Join Us</h1>
        <p className="text-gray-500 text-xs font-medium max-w-[250px] mx-auto">
          สร้างบัญชีเพื่อเริ่มต้นการดูแลสุขภาพด้วยพลังของ AI
        </p>
      </div>

      <div className="space-y-8 px-2">
        {/* 🟢 Account Credentials */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Account Details</p>
          <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-6 space-y-4 shadow-xl">
            <RegisterInput icon={<Mail size={18}/>} name="email" type="email" placeholder="Email Address" value={form.email} onChange={handleChange} />
            
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50 group-focus-within:text-emerald-500 transition-colors">
                <Lock size={18}/>
              </div>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-3.5 text-sm focus:border-emerald-500 outline-none transition-all placeholder:text-gray-600 text-white"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <RegisterInput icon={<User size={18}/>} name="name" type="text" placeholder="Display Name" value={form.name} onChange={handleChange} />
          </div>
        </div>

        {/* 🟢 Body Information */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Body Metrics</p>
          <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-6 space-y-4 shadow-xl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase ml-4">Gender</label>
                <select 
                  name="gender" 
                  value={form.gender} 
                  onChange={handleChange} 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer text-white"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="male" className="bg-[#121212] text-white">ชาย</option>
                  <option value="female" className="bg-[#121212] text-white">หญิง</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase ml-4">Birth Date</label>
                <input 
                  type="date" 
                  name="birthDate" 
                  value={form.birthDate} 
                  onChange={handleChange} 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-emerald-500 outline-none transition-all text-white" 
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <RegisterInput icon={<Weight size={16}/>} name="weightKg" type="number" placeholder="Weight (kg)" value={form.weightKg} onChange={handleChange} />
               <RegisterInput icon={<Ruler size={16}/>} name="heightCm" type="number" placeholder="Height (cm)" value={form.heightCm} onChange={handleChange} />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase ml-4">Activity Level</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50 group-focus-within:text-emerald-500 transition-colors pointer-events-none">
                  <Activity size={18}/>
                </div>
                <select 
                  name="activityLevel" 
                  value={form.activityLevel} 
                  onChange={handleChange} 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer text-white"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="1.2" className="bg-[#121212] text-white">Sedentary (x1.2)</option>
                  <option value="1.375" className="bg-[#121212] text-white">Lightly Active (x1.375)</option>
                  <option value="1.55" className="bg-[#121212] text-white">Moderately Active (x1.55)</option>
                  <option value="1.725" className="bg-[#121212] text-white">Very Active (x1.725)</option>
                  <option value="1.9" className="bg-[#121212] text-white">Extra Active (x1.9)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 🟢 Feedback Message */}
        {msg && (
          <div className={`p-4 rounded-2xl text-center text-[11px] font-bold animate-in fade-in slide-in-from-top-2 ${msg.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
            {msg.text}
          </div>
        )}

        {/* 🟢 Submit Button */}
        <div className="space-y-4 pb-12">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-emerald-500 text-black font-black py-4 rounded-3xl shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
            {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
            {!loading && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />}
          </button>

          <p className="text-[10px] text-gray-500 text-center font-bold uppercase tracking-widest">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-500 hover:underline">
              Sign In
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
        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:border-emerald-500 outline-none transition-all placeholder:text-gray-600 text-white"
      />
    </div>
  );
}