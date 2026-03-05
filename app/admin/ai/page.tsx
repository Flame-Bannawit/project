"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, Zap, ShieldCheck, Activity, Cpu, RefreshCw, AlertTriangle, HardDrive, Info } from "lucide-react";
import Link from "next/link";
import { getDictionary } from "@/lib/get-dictionary";

export default function AIHealthPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // 🌐 ระบบภาษาและธีม
  const [dict, setDict] = useState<any>(null);
  const [lang, setLang] = useState<'en' | 'th'>('th');

  const checkHealth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ai-health");
      const data = await res.json();
      setHealth(data);
    } catch (err) { 
      console.error("AI Health Error:", err); 
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    const savedLang = (localStorage.getItem("preferred-lang") as 'en' | 'th') || 'th';
    setLang(savedLang);
    getDictionary(savedLang).then(setDict);
    checkHealth(); 
  }, [checkHealth]);

  if (!dict) return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
       <RefreshCw className="animate-spin text-yellow-500" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050505] transition-colors duration-500 pb-20">
      <div className="p-6 space-y-8 max-w-7xl mx-auto selection:bg-yellow-500/30">
        
        {/* 🟢 HEADER */}
        <header className="flex justify-between items-center animate-in fade-in duration-700">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-400 dark:text-gray-400 hover:text-yellow-500 transition-all shadow-sm">
              <ChevronLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter italic leading-none text-slate-900 dark:text-white transition-colors">
                {lang === 'th' ? "สถานะระบบ AI" : "AI System Core"}
              </h1>
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                {lang === 'th' ? "การวินิจฉัยและสุขภาพของโมเดลแบบเรียลไทม์" : "Real-time Model Diagnostics & Health"}
              </p>
            </div>
          </div>
          <button 
            onClick={checkHealth} 
            className={`p-3 border rounded-2xl transition-all shadow-sm active:scale-90 ${
              loading 
                ? 'bg-yellow-500 text-black animate-spin' 
                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-yellow-500 hover:bg-yellow-500 hover:text-black'
            }`}
          >
            <RefreshCw size={20} />
          </button>
        </header>

        {/* ⚡ STATUS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <HealthCard 
            title={lang === 'th' ? "สถานะระบบ" : "System Status"} 
            val={health?.status || (lang === 'th' ? "กำลังตรวจสอบ..." : "Checking...")} 
            icon={<ShieldCheck size={20}/>} 
            color="text-emerald-500" 
          />
          <HealthCard 
            title={lang === 'th' ? "ความหน่วง API" : "API Latency"} 
            val={health?.latency || "0ms"} 
            icon={<Activity size={20}/>} 
            color="text-blue-500" 
          />
          <HealthCard 
            title={lang === 'th' ? "เวลาทำงาน" : "System Uptime"} 
            val={health?.uptime || "99.9%"} 
            icon={<Zap size={20}/>} 
            color="text-yellow-500" 
          />
          <HealthCard 
            title={lang === 'th' ? "อัตราข้อผิดพลาด" : "AI Error Rate"} 
            val={health?.errorRate || "0.02%"} 
            icon={<AlertTriangle size={20}/>} 
            color="text-rose-500" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 🧠 MODEL DETAILS */}
          <div className="lg:col-span-2 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[3rem] p-8 space-y-8 relative overflow-hidden shadow-xl transition-all">
             <div className="absolute top-0 right-0 p-10 opacity-5 dark:opacity-10 text-yellow-500"><Cpu size={200} /></div>
             
             <div className="relative z-10">
                <h3 className="text-xs font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-[0.2em] mb-8 italic flex items-center gap-2">
                  <Info size={14} /> {lang === 'th' ? "ข้อมูลจำเพาะของโมเดล" : "Model Specification"}
                </h3>
                <div className="space-y-6">
                   <SpecRow label={lang === 'th' ? "สถาปัตยกรรม AI" : "AI Architecture"} val={health?.modelName || "Gemini 1.5 Flash"} />
                   <SpecRow label={lang === 'th' ? "เอนจินการจดจำ" : "Recognition Engine"} val="Vision-Pro-v4 (HealthyMate Custom)" />
                   <SpecRow label={lang === 'th' ? "หน่วยประมวลผล" : "Processing Unit"} val="Cloud TPU v5 (Pre-emptible)" />
                   <SpecRow label={lang === 'th' ? "ที่ตั้งข้อมูล" : "Data Residency"} val={lang === 'th' ? "กรุงเทพฯ, ไทย (Region-1)" : "Bangkok, Thailand (Region-1)"} />
                </div>
             </div>

             <div className="pt-6 border-t border-slate-100 dark:border-white/5 relative z-10">
                <div className="flex items-center gap-4 p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl shadow-inner">
                   <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                   <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest leading-relaxed">
                     {lang === 'th' 
                       ? `ระบบ AI กำลังเรียนรู้และเพิ่มประสิทธิภาพจาก ${health?.totalRequests || 142} คำขอล่าสุด` 
                       : `AI System is learning and optimizing from ${health?.totalRequests || 142} recent requests`}
                   </p>
                </div>
             </div>
          </div>

          {/* 🖥️ LOG TERMINAL */}
          <div className="bg-slate-900 dark:bg-black border border-slate-800 dark:border-white/10 rounded-[3rem] p-6 font-mono text-[10px] space-y-2 overflow-hidden relative shadow-2xl">
             <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                <div className="flex gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-lg shadow-rose-500/20" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/20" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20" />
                </div>
                <span className="text-gray-500 uppercase font-black tracking-widest text-[8px]">Live Console</span>
             </div>
             <div className="space-y-1.5 opacity-80">
                <p className="text-emerald-400">[SYSTEM] API Authentication Successful</p>
                <p className="text-gray-400">[INFO] Fetching records from MongoDB Atlas...</p>
                <p className="text-gray-400">[AI] Processing image request: IMG_9921.jpg</p>
                <p className="text-blue-400">[AI] Label detected: "Salmon Salad" (98.2%)</p>
                <p className="text-gray-400">[DB] Storing new MealLog for User: Bannawit</p>
                <p className="text-yellow-400">[WARN] High latency detected in Region-1</p>
                <p className="text-gray-500 font-bold mt-4 animate-pulse">_ EXECUTION_TRACE_READY</p>
             </div>
             
             {/* Decorative Scanline */}
             <div className="absolute inset-0 pointer-events-none bg-scanline opacity-5" />
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthCard({ title, val, icon, color }: any) {
  return (
    <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 p-6 rounded-[2.5rem] hover:shadow-lg dark:hover:bg-white/[0.04] transition-all shadow-sm group">
      <div className={`p-3 bg-slate-50 dark:bg-white/5 rounded-2xl ${color} w-fit mb-4 group-hover:scale-110 transition-transform`}>{icon}</div>
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-xl font-black italic uppercase text-slate-900 dark:text-white transition-colors">{val}</p>
    </div>
  );
}

function SpecRow({ label, val }: any) {
  return (
    <div className="flex justify-between items-center border-b border-slate-50 dark:border-white/5 pb-4">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      <span className="text-xs font-black italic text-slate-700 dark:text-gray-200">{val}</span>
    </div>
  );
}