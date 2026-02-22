"use client";

import { useEffect, useState } from "react";
import { Camera, History, User, Flame, Target, ChevronRight, Activity, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const [data, setData] = useState<{
    profile: any;
    eatenToday: number;
    macrosToday: { p: number; c: number; f: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // ฟังก์ชันดึงข้อมูลแบบรวมศูนย์
  const loadHomeData = async () => {
    try {
      // 1. ดึงข้อมูล Profile
      const profileRes = await fetch("/api/profile");
      const profile = await profileRes.json();
      const userProfile = profile.profile || profile;

      // 2. ดึงข้อมูล Meal Logs
      const logsRes = await fetch("/api/meal-logs");
      const logsData = await logsRes.json();
      const logs = Array.isArray(logsData) ? logsData : logsData.logs || [];

      // 3. Logic ตัดรอบวัน (ตี 3 เหมือนหน้า History)
      const now = new Date();
      if (now.getHours() < 3) now.setDate(now.getDate() - 1);
      const todayStr = now.toISOString().slice(0, 10);

      // 4. คำนวณผลรวมของวันนี้
      const todaysLogs = logs.filter((log: any) => 
        (log.loggedAt || log.createdAt).startsWith(todayStr)
      );

      const totals = todaysLogs.reduce((acc: any, log: any) => ({
        cal: acc.cal + (log.totalCalories || log.calories || 0),
        p: acc.p + (log.protein || 0),
        c: acc.c + (log.carbs || 0),
        f: acc.f + (log.fat || 0),
      }), { cal: 0, p: 0, c: 0, f: 0 });

      setData({
        profile: userProfile,
        eatenToday: totals.cal,
        macrosToday: { p: totals.p, c: totals.c, f: totals.f }
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  // ตัวแปรสำหรับแสดงผล
  const goal = data?.profile?.dailyCalorieGoal || data?.profile?.goals?.calories || 2000;
  const eaten = data?.eatenToday || 0;
  const remaining = Math.max(goal - eaten, 0);
  const progress = Math.min((eaten / goal) * 100, 100);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] gap-4">
      <Loader2 className="text-emerald-500 animate-spin" size={40} />
      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Syncing Dashboard...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32 selection:bg-emerald-500/30">
      
      <nav className="sticky top-0 z-40 bg-[#050505]/60 backdrop-blur-xl border-b border-white/5 p-5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="font-black text-black text-lg">
              {data?.profile?.name?.charAt(0).toUpperCase() || "H"}
            </span>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Status: Active</p>
            <h2 className="text-sm font-bold leading-none">{data?.profile?.name || "Member"}</h2>
          </div>
        </div>
        <div className="w-12 h-12"></div>
      </nav>

      <main className="p-5 max-w-xl mx-auto space-y-6">
        <section className="px-1">
            <div className="inline-flex items-center gap-2 text-[10px] px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 font-bold uppercase tracking-wider mb-4">
              <Sparkles size={12} className="animate-pulse" />
              AI Food Logging Prototype
            </div>
            <h1 className="text-3xl font-black leading-[1.1] uppercase tracking-tighter italic">
              Healthy<span className="text-emerald-500">Mate</span>
            </h1>
        </section>

        {/* 🟢 Progress Card: อัปเดตตามข้อมูลจริงแล้ว */}
        <section className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-[2.5rem] p-8 shadow-2xl shadow-emerald-500/30 relative overflow-hidden group">
          <div className="absolute top-[-20%] right-[-10%] text-black/5 group-hover:scale-110 transition-transform duration-1000">
             <Flame size={240} fill="currentColor" />
          </div>

          <div className="relative z-10 space-y-8">
            <div className="flex justify-between items-start">
              <div className="space-y-1 text-black">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Remaining</p>
                <h3 className="text-6xl font-black tracking-tighter tabular-nums">{Math.round(remaining)}</h3>
                <p className="text-[10px] font-bold opacity-60">KCAL TO GO</p>
              </div>
              <div className="bg-black/10 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10 text-black text-center min-w-[60px]">
                <Target size={14} className="mb-1 mx-auto opacity-60" />
                <span className="text-xs font-black block">{goal}</span>
                <span className="text-[8px] font-bold uppercase opacity-60 leading-none">Goal</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="w-full bg-black/10 h-3.5 rounded-full overflow-hidden border border-white/5 p-0.5">
                <div 
                  className="bg-black h-full rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
              <div className="flex justify-between text-black text-[9px] font-black uppercase tracking-widest opacity-60 px-1">
                <span>Eaten: {Math.round(eaten)} kcal</span>
                <span>{Math.round(progress)}% of daily goal</span>
              </div>
            </div>
          </div>
        </section>

        {/* 🟢 Macro Cards: แสดงยอดที่กินไปเทียบกับเป้าหมาย */}
        <div className="grid grid-cols-3 gap-3">
          <MacroCard 
            label="Protein" 
            val={data?.macrosToday.p} 
            goal={data?.profile?.goals?.protein || 169}
            color="from-blue-500/20 to-blue-600/5" 
            text="text-blue-400" 
          />
          <MacroCard 
            label="Carbs" 
            val={data?.macrosToday.c} 
            goal={data?.profile?.goals?.carbs || 339}
            color="from-amber-500/20 to-amber-600/5" 
            text="text-amber-400" 
          />
          <MacroCard 
            label="Fat" 
            val={data?.macrosToday.f} 
            goal={data?.profile?.goals?.fat || 75}
            color="from-rose-500/20 to-rose-600/5" 
            text="text-rose-400" 
          />
        </div>

        <section className="space-y-3">
          <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500 px-2">Quick Actions</h4>
          <div className="grid gap-3">
            <FeatureLink href="/analyze" title="Analyze Meal" desc="ถ่ายรูปอาหารให้ AI วิเคราะห์แคลอรี่" icon={<Camera size={22} />} color="emerald" />
            <FeatureLink href="/history" title="Meal History" desc="ดูประวัติการทานอาหารย้อนหลัง" icon={<History size={22} />} color="sky" />
            <FeatureLink href="/profile" title="Body Settings" desc="ปรับค่า BMI, BMR และ TDEE" icon={<User size={22} />} color="violet" />
          </div>
        </section>
      </main>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50 md:hidden block">
        <nav className="bg-black/70 backdrop-blur-2xl border border-white/10 px-8 py-4 rounded-[2.5rem] flex items-center justify-between shadow-2xl">
          <NavItem icon={<Activity size={22} />} active />
          <Link href="/analyze">
            <div className="bg-emerald-500 p-3.5 rounded-2xl text-black shadow-lg shadow-emerald-500/40 -translate-y-3 border-4 border-[#050505] active:scale-95 transition-all">
                <Camera size={26} strokeWidth={2.5} />
            </div>
          </Link>
          <Link href="/profile">
            <NavItem icon={<User size={22} />} />
          </Link>
        </nav>
      </div>
    </div>
  );
}

function MacroCard({ label, val, goal, color, text }: any) {
    return (
      <div className={`bg-gradient-to-b ${color} border border-white/5 p-4 rounded-[2rem] text-center`}>
        <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 mb-1">{label}</p>
        <p className={`text-sm font-black ${text}`}>{Math.round(val || 0)}<span className="text-[9px] opacity-40 ml-0.5">g</span></p>
        <div className="w-8 h-[1px] bg-white/10 mx-auto my-1"></div>
        <p className="text-[8px] font-bold text-gray-600 uppercase">{goal}g Goal</p>
      </div>
    );
}

function FeatureLink({ href, title, desc, icon, color }: any) {
  const colors: any = {
    emerald: "text-emerald-400 bg-emerald-500/10",
    sky: "text-sky-400 bg-sky-500/10",
    violet: "text-violet-400 bg-violet-500/10"
  };
  return (
    <Link href={href} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-3xl hover:bg-white/[0.05] transition-all group active:scale-[0.98]">
      <div className="flex items-center gap-4">
        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${colors[color]} transition-transform group-hover:scale-110`}>
          {icon}
        </div>
        <div>
          <h5 className="text-sm font-bold text-white leading-none mb-1">{title}</h5>
          <p className="text-[10px] text-gray-500 font-medium">{desc}</p>
        </div>
      </div>
      <ChevronRight size={16} className="text-gray-700 group-hover:text-white transition-colors" />
    </Link>
  );
}

function NavItem({ icon, active = false }: any) {
  return (
    <button className={`transition-all duration-300 ${active ? "text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "text-gray-500 hover:text-white"}`}>
      {icon}
    </button>
  );
}