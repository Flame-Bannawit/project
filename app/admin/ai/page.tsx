"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, Zap, ShieldCheck, Activity, Cpu, RefreshCw, AlertTriangle, HardDrive, Info, BrainCircuit, Target, Flame, BarChart3, Sparkles } from "lucide-react";
import Link from "next/link";
import { getDictionary } from "@/lib/get-dictionary";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";

export default function AIHealthPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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

  const COLORS = ['#eab308', '#3b82f6', '#10b981', '#f43f5e', '#8b5cf6'];

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
              <h1 className="text-2xl font-black uppercase tracking-tighter italic leading-none text-slate-900 dark:text-white">
                {lang === 'th' ? "วิเคราะห์ระบบ AI" : "AI Analytics Core"}
              </h1>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">
                {lang === 'th' ? "ประสิทธิภาพโมเดลและโควตา" : "Model Performance & Quota Usage"}
              </p>
            </div>
          </div>
          <button 
            onClick={checkHealth} 
            className={`p-3 border rounded-2xl transition-all shadow-sm active:scale-90 ${
              loading 
                ? 'bg-yellow-500 text-black' 
                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-yellow-500 hover:bg-yellow-500 hover:text-black'
            }`}
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </header>

        {/* ⚡ STATUS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <HealthCard 
            title={lang === 'th' ? "สถานะการทำงาน" : "Operation Status"} 
            val={health?.status || "Normal"} 
            icon={<ShieldCheck size={20}/>} 
            color="text-emerald-500" 
          />
          <HealthCard 
            title={lang === 'th' ? "ความแม่นยำเฉลี่ย" : "Avg Accuracy"} 
            val={`${Math.round(health?.summary?.avgAccuracy || 92)}%`} 
            icon={<Target size={20}/>} 
            color="text-blue-500" 
          />
          <HealthCard 
            title={lang === 'th' ? "ยอดสแกนวันนี้" : "Today's Usage"} 
            val={`${health?.quota?.used || 0} / 20`} 
            icon={<Activity size={20}/>} 
            color="text-yellow-500" 
          />
          <HealthCard 
            title={lang === 'th' ? "อัตราข้อผิดพลาด" : "AI Error Rate"} 
            val={health?.errorRate || "0%"} 
            icon={<AlertTriangle size={20}/>} 
            color="text-rose-500" 
          />
        </div>

        {/* 📊 QUOTA & CHART SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 🧠 QUOTA USAGE */}
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[3rem] p-8 shadow-xl relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest italic flex items-center gap-2">
                  <HardDrive size={16} className="text-yellow-500" /> {lang === 'th' ? "การใช้โควตา API" : "API Quota Usage"}
                </h3>
                <p className="text-xs text-gray-500 font-bold uppercase mt-1">{lang === 'th' ? "ปริมาณคำขอรายวัน" : "Daily Token Consumption"}</p>
              </div>
              <span className={`text-xs font-black px-3 py-1 rounded-full ${Number(health?.quota?.percent) > 80 ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                {health?.quota?.percent || 0}%
              </span>
            </div>

            <div className="space-y-6">
              <div className="h-4 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-1 border border-slate-200/50 dark:border-white/5">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${Number(health?.quota?.percent) > 80 ? 'bg-red-500' : 'bg-gradient-to-r from-yellow-500 to-amber-600'}`}
                  style={{ width: `${health?.quota?.percent || 0}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50/50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                  <p className="text-xs font-black text-gray-400 uppercase">{lang === 'th' ? "ใช้ไปแล้ว" : "Used"}</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white italic">{health?.quota?.used || 0}</p>
                </div>
                <div className="p-4 bg-slate-50/50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                  <p className="text-xs font-black text-gray-400 uppercase">{lang === 'th' ? "คงเหลือ" : "Remaining"}</p>
                  <p className={`text-xl font-black italic ${Number(health?.quota?.remaining) <= 2 ? 'text-red-500' : 'text-emerald-500'}`}>{health?.quota?.remaining || 0}</p>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-[12px] text-gray-400 font-medium leading-relaxed italic">
                  * {lang === 'th' ? "โควตาจำกัดที่ 20 ครั้งต่อวันและจะรีเซ็ตตอนเที่ยงคืน" : "Quota is limited to 20 per day and resets at midnight."}
                </p>
              </div>
            </div>
          </div>

          {/* 📊 CHART (Top Dishes) */}
          <div className="lg:col-span-2 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[3rem] p-8 shadow-xl relative overflow-hidden">
             <div className="relative z-10">
                <h3 className="text-xs font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-[0.2em] mb-8 italic flex items-center gap-2">
                  <BarChart3 size={18} /> {lang === 'th' ? "เมนูที่ตรวจพบมากที่สุด" : "Top Detected Menu"}
                </h3>
                
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={health?.topDishes}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#88888820" vertical={false} />
                      <XAxis dataKey="_id" stroke="#888" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis stroke="#888" fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip 
                        cursor={{fill: 'transparent'}} 
                        contentStyle={{backgroundColor: '#000', border: 'none', borderRadius: '16px', fontSize: '10px', color: '#fff'}}
                      />
                      <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={45}>
                        {health?.topDishes?.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 🧠 MODEL DETAILS */}
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[3rem] p-8 space-y-8 relative overflow-hidden shadow-xl">
             <div className="relative z-10">
                <h3 className="text-xs font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-[0.2em] mb-8 italic flex items-center gap-2">
                  <Info size={14} /> {lang === 'th' ? "ข้อมูลจำเพาะ" : "System Spec"}
                </h3>
                <div className="space-y-6">
                   <SpecRow label={lang === 'th' ? "สถาปัตยกรรม" : "Model"} val={health?.modelName || "Gemini 2.5 Flash"} />
                   <SpecRow label={lang === 'th' ? "ความหน่วงเฉลี่ย" : "Avg Latency"} val={health?.latency || "0ms"} />
                   <SpecRow label={lang === 'th' ? "สถานะ API" : "API Connectivity"} val="Healthy" />
                   <SpecRow label={lang === 'th' ? "วิเคราะห์วันนี้" : "Today Scans"} val={`${health?.quota?.used || 0} / 20`} />
                </div>
             </div>
          </div>

          {/* 🖥️ LOG TERMINAL */}
          <div className="bg-slate-900 dark:bg-black border border-slate-800 dark:border-white/10 rounded-[3rem] p-8 font-mono text-xs space-y-4 shadow-2xl relative overflow-hidden">
             <div className="flex items-center justify-between mb-2 border-b border-white/5 pb-4">
                <div className="flex gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </div>
                <span className="text-gray-500 uppercase font-black tracking-widest text-xs">Live Console</span>
             </div>
             <div className="space-y-1.5 opacity-80">
                <p className="text-emerald-400">[{new Date().toLocaleTimeString()}] Quota Synced: {health?.quota?.percent}%</p>
                <p className="text-gray-400">[{new Date().toLocaleTimeString()}] Latency: {health?.latency}</p>
                <p className="text-blue-400">[{new Date().toLocaleTimeString()}] Model: Gemini 2.5 Flash</p>
                <p className="text-gray-400">[{new Date().toLocaleTimeString()}] Region: Bangkok, Thailand</p>
                <p className={`mt-4 animate-pulse ${Number(health?.quota?.remaining) === 0 ? 'text-rose-500' : 'text-yellow-400'}`}>
                  {Number(health?.quota?.remaining) === 0 ? '_ QUOTA_EXHAUSTED_HALT' : '_ LISTENING_FOR_REQUESTS...'}
                </p>
             </div>
          </div>
        </div>

        {/* INFO BOX */}
        <div className="p-8 bg-blue-500/5 border border-blue-500/10 rounded-[2.5rem] flex items-start gap-4">
          <Sparkles className="text-blue-600 dark:text-blue-500 shrink-0" size={24} />
          <div>
            <h4 className="text-sm font-black text-blue-600 dark:text-blue-500 uppercase italic leading-none mb-2">Resource Monitoring</h4>
            <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed font-medium">
              {lang === 'th' 
                ? "ระบบตรวจสอบการใช้ทรัพยากรแบบเรียลไทม์จำกัดที่ 20 ครั้งต่อวันตามแผนการใช้งานปัจจุบัน เพื่อรักษาเสถียรภาพของโมเดล Gemini 2.5 Flash"
                : "Real-time resource monitoring limited to 20 daily requests per current plan to ensure stability of the Gemini 2.5 Flash model."}
            </p>
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
      <p className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-xl font-black italic uppercase text-slate-900 dark:text-white transition-colors">{val}</p>
    </div>
  );
}

function SpecRow({ label, val }: any) {
  return (
    <div className="flex justify-between items-center border-b border-slate-50 dark:border-white/5 pb-4">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      <span className="text-xs font-black italic text-slate-700 dark:text-gray-200">{val}</span>
    </div>
  );
}