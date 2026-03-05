"use client";

import { useEffect, useState, useCallback } from "react";
import { Camera, History, User, Flame, Target, ChevronRight, Activity, Sparkles, Loader2, TrendingUp, BarChart3, LineChart as LineChartIcon, Zap } from "lucide-react";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ReferenceLine } from 'recharts';
import { getDictionary } from "@/lib/get-dictionary";

export default function HomePage() {
  const [data, setData] = useState<{
    profile: any;
    eatenToday: number;
    macrosToday: { p: number; c: number; f: number };
  } | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState(7);
  const [chartType, setChartType] = useState<"calories" | "macros">("calories");
  const [loading, setLoading] = useState(true);

  const [dict, setDict] = useState<any>(null);
  const [lang, setLang] = useState<'en' | 'th'>('th');

  const loadHomeData = async () => {
    try {
      const profileRes = await fetch("/api/profile");
      const profile = await profileRes.json();
      const userProfile = profile.profile || profile;

      const logsRes = await fetch("/api/meal-logs");
      const logsData = await logsRes.json();
      const logs = Array.isArray(logsData) ? logsData : logsData.logs || [];

      const now = new Date();
      if (now.getHours() < 3) now.setDate(now.getDate() - 1);
      const todayStr = now.toISOString().slice(0, 10);

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

      const statsRes = await fetch("/api/stats/trends");
      if (statsRes.ok) {
        const sData = await statsRes.json();
        setTrendData(sData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initLang = async () => {
      const savedLang = (localStorage.getItem("preferred-lang") as 'en' | 'th') || 'th';
      setLang(savedLang);
      const dictionary = await getDictionary(savedLang);
      setDict(dictionary);
    };
    initLang();
    loadHomeData();
  }, []);

  // 🎯 ปรับปรุง Logic เพื่อซิงค์ข้อมูลกราฟให้ตรงกับความจริง
  const getFullTrendData = () => {
    if (!trendData) return [];
    const fullData = [];
    const now = new Date();
    
    // กำหนดค่า "วันนี้" เพื่อใช้เช็คการ Overwrite ข้อมูล
    const todayComparison = new Date();
    if (todayComparison.getHours() < 3) todayComparison.setDate(todayComparison.getDate() - 1);
    const todayStr = todayComparison.toISOString().slice(0, 10);

    for (let i = timeRange - 1; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(now.getDate() - i);
      const dateStr = targetDate.toISOString().slice(0, 10);
      
      const existingDay = trendData.find((d: any) => (d.date === dateStr || d._id === dateStr));
      
      let dayValue = {
        calories: Number(existingDay?.calories || 0),
        protein: Number(existingDay?.protein || 0),
        carbs: Number(existingDay?.carbs || 0),
        fat: Number(existingDay?.fat || 0)
      };

      // 🎯 OVERWRITE: ถ้าเป็นวันที่ปัจจุบัน ให้ใช้ค่าจาก 'data' ที่คำนวณสดๆ มาแทนที่
      if (dateStr === todayStr && data) {
        dayValue.calories = data.eatenToday;
        dayValue.protein = data.macrosToday.p;
        dayValue.carbs = data.macrosToday.c;
        dayValue.fat = data.macrosToday.f;
      }

      fullData.push({
        ...dayValue,
        date: dateStr,
        displayDate: targetDate.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short' })
      });
    }
    return fullData;
  };

  const filteredTrendData = getFullTrendData();
  const goal = data?.profile?.dailyCalorieGoal || data?.profile?.goals?.calories || 2000;
  const eaten = data?.eatenToday || 0;
  const remaining = Math.max(goal - eaten, 0);
  const progress = Math.min((eaten / goal) * 100, 100);

  if (loading || !dict) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-transparent gap-4">
      <Loader2 className="text-emerald-500 animate-spin" size={40} />
      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">
        {lang === 'th' ? "กำลังประมวลผล..." : "Processing..."}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent pb-32">
      <main className="p-5 max-w-xl mx-auto space-y-6">
        
        <section className="px-1 pt-4">
            <div className="inline-flex items-center gap-2 text-[10px] px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-500 font-black uppercase tracking-widest mb-4">
              <Sparkles size={12} className="animate-pulse" />
              {lang === 'th' ? "วิเคราะห์โภชนาการ AI" : "AI Nutrition Insights"}
            </div>
            <h1 className="text-4xl font-black leading-none uppercase tracking-tighter italic text-slate-900 dark:text-white">
              Healthy<span className="text-emerald-500 underline decoration-emerald-500/30 underline-offset-4">Mate</span>
            </h1>
        </section>

        {/* 🟢 TOP SECTION: Trends Chart with Real-time Sync */}
        <section className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 space-y-6 shadow-xl shadow-slate-200/50 dark:shadow-none animate-in fade-in duration-1000">
          <div className="flex justify-between items-start px-1">
            <div>
              <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mb-1 flex items-center gap-2">
                <Activity size={10} className="text-emerald-500" /> {lang === 'th' ? "สถิติสุขภาพ" : "Health Stats"}
              </h4>
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-800 dark:text-white">
                {chartType === "calories" ? (lang === 'th' ? "แนวโน้มแคลอรี่" : "Calorie Trends") : (lang === 'th' ? "แนวโน้มสารอาหาร" : "Macro Trends")}
              </h3>
            </div>
            <div className="flex bg-slate-100 dark:bg-black/40 p-1 rounded-2xl border border-slate-200 dark:border-white/5">
              <button onClick={() => setChartType("calories")} className={`p-2 rounded-xl transition-all ${chartType === "calories" ? "bg-white dark:bg-white/10 text-emerald-500 shadow-sm" : "text-gray-400"}`}><LineChartIcon size={16} /></button>
              <button onClick={() => setChartType("macros")} className={`p-2 rounded-xl transition-all ${chartType === "macros" ? "bg-white dark:bg-white/10 text-emerald-500 shadow-sm" : "text-gray-400"}`}><BarChart3 size={16} /></button>
            </div>
          </div>

          <div className="h-64 w-full pr-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "calories" ? (
                <AreaChart data={filteredTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-white/5" />
                  <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 900}} dy={10} />
                  <YAxis domain={[0, (dataMax: any) => Math.max(dataMax, goal + 500)]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '10px', fontWeight: 800 }} />
                  {/* 🎯 เส้นสีแดงคั่นเป้าหมายแคลอรี่ */}
                  <ReferenceLine y={goal} stroke="#ef4444" strokeDasharray="5 5" label={{ position: 'right', value: 'GOAL', fill: '#ef4444', fontSize: 9, fontWeight: 900 }} />
                  <Area type="monotone" dataKey="calories" stroke="#10b981" strokeWidth={4} fill="url(#colorCal)" animationDuration={2000} />
                </AreaChart>
              ) : (
                <BarChart data={filteredTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-white/5" />
                  <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 900}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '10px', fontWeight: 800 }} />
                  <Bar dataKey="protein" stackId="a" fill="#3b82f6" barSize={timeRange > 7 ? 6 : 14} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="carbs" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="fat" stackId="a" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-4">
            {[7, 30, 90].map((range) => (
              <button key={range} onClick={() => setTimeRange(range)} 
                className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${timeRange === range ? "bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg" : "text-gray-400 bg-slate-100 dark:bg-white/5"}`}
              >
                {range === 7 ? "7 Days" : range === 30 ? "1 Month" : "3 Months"}
              </button>
            ))}
          </div>
        </section>

        {/* 🟢 PROGRESS CARD */}
        <section className="bg-emerald-500 rounded-[3rem] p-8 shadow-2xl shadow-emerald-500/30 relative overflow-hidden group">
          <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000"><Zap size={280} fill="black" /></div>
          <div className="relative z-10 flex justify-between items-end">
             <div className="space-y-1">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-black/40">{lang === 'th' ? "วันนี้ทานได้อีก" : "KCAL Remaining"}</p>
                <h3 className="text-7xl font-black tracking-tighter text-black italic leading-none">{Math.round(remaining)}</h3>
             </div>
             <div className="text-right">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-black/40 mb-1">{lang === 'th' ? "จากเป้าหมาย" : "Daily Goal"}</p>
                <div className="px-4 py-2 bg-black/10 rounded-2xl border border-black/10 inline-block">
                   <span className="text-lg font-black text-black leading-none">{goal}</span>
                </div>
             </div>
          </div>
          <div className="mt-8 space-y-4 relative z-10">
             <div className="w-full bg-black/10 h-4 rounded-full p-1 border border-black/5">
                <div className="bg-black h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
             </div>
             <div className="flex justify-between items-center text-black">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-black" />
                   <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{lang === 'th' ? "ทานแล้ว" : "Eaten"} {Math.round(eaten)} kcal</span>
                </div>
                <span className="text-[11px] font-black italic">{Math.round(progress)}% COMPLETED</span>
             </div>
          </div>
        </section>

        {/* 🟢 MACRO GRID */}
        <div className="grid grid-cols-3 gap-4">
          <MacroCard label={lang === 'th' ? "โปรตีน" : "Protein"} val={data?.macrosToday.p} goal={data?.profile?.goals?.protein || 150} color="bg-blue-500/10 dark:bg-blue-500/20" border="border-blue-500/20" text="text-blue-600 dark:text-blue-400" icon={<Beef size={14}/>} />
          <MacroCard label={lang === 'th' ? "คาร์บ" : "Carbs"} val={data?.macrosToday.c} goal={data?.profile?.goals?.carbs || 250} color="bg-amber-500/10 dark:bg-amber-500/20" border="border-amber-500/20" text="text-amber-600 dark:text-amber-400" icon={<Wheat size={14}/>} />
          <MacroCard label={lang === 'th' ? "ไขมัน" : "Fat"} val={data?.macrosToday.f} goal={data?.profile?.goals?.fat || 70} color="bg-rose-500/10 dark:bg-rose-500/20" border="border-rose-500/20" text="text-rose-600 dark:text-rose-400" icon={<Droplets size={14}/>} />
        </div>

        {/* 🟢 QUICK ACTIONS */}
        <section className="space-y-4 pt-2">
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 px-2">{lang === 'th' ? "เมนูทางลัด" : "Quick Actions"}</h4>
          <div className="grid gap-3">
            <FeatureLink href="/analyze" title={lang === 'th' ? "วิเคราะห์มื้ออาหาร" : "Analyze Meal"} desc={lang === 'th' ? "ใช้ AI สแกนแคลอรี่จากรูปภาพ" : "AI photo calorie scanning"} icon={<Camera size={22} />} color="emerald" />
            <FeatureLink href="/history" title={lang === 'th' ? "ประวัติการทาน" : "Meal History"} desc={lang === 'th' ? "ตรวจสอบรายการที่บันทึกไว้" : "Review your past records"} icon={<History size={22} />} color="sky" />
            <FeatureLink href="/profile" title={lang === 'th' ? "ร่างกายและเป้าหมาย" : "Body & Goals"} desc={lang === 'th' ? "ปรับแต่งค่า BMI และแคลอรี่" : "Adjust your personal setup"} icon={<User size={22} />} color="violet" />
          </div>
        </section>
      </main>
    </div>
  );
}

function MacroCard({ label, val, goal, color, border, text, icon }: any) {
    return (
      <div className={`${color} border ${border} p-5 rounded-[2.5rem] flex flex-col items-center shadow-sm hover:scale-105 transition-transform`}>
        <div className={`mb-3 ${text} opacity-60`}>{icon}</div>
        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">{label}</p>
        <p className={`text-xl font-black tracking-tighter italic ${text}`}>{Math.round(val || 0)}<span className="text-[10px] opacity-40 ml-0.5">g</span></p>
        <div className="w-6 h-[1px] bg-slate-200 dark:bg-white/10 my-2"></div>
        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Goal: {goal}g</p>
      </div>
    );
}

function FeatureLink({ href, title, desc, icon, color }: any) {
  const colors: any = { 
    emerald: "text-emerald-500 bg-emerald-500/10", 
    sky: "text-sky-500 bg-sky-500/10", 
    violet: "text-violet-500 bg-violet-500/10" 
  };
  return (
    <Link href={href} className="flex items-center justify-between p-5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-[2rem] hover:bg-slate-50 dark:hover:bg-white/5 transition-all group active:scale-[0.98] shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${colors[color]} transition-transform group-hover:rotate-6`}>{icon}</div>
        <div>
          <h5 className="text-sm font-black text-slate-800 dark:text-white leading-none mb-1.5 uppercase italic">{title}</h5>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{desc}</p>
        </div>
      </div>
      <ChevronRight size={18} className="text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
    </Link>
  );
}

function Beef(props: any) { return <Activity {...props} />; }
function Droplets(props: any) { return <div className={props.className}><Zap size={props.size} /></div>; }
function Wheat(props: any) { return <TrendingUp {...props} />; }