"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Search, ChevronLeft, Calendar, Filter, Eye, 
  Utensils, Loader2, ArrowRight, X, Info, RefreshCw 
} from "lucide-react";
import Link from "next/link";
import { getDictionary } from "@/lib/get-dictionary";

export default function AdminFoodsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [selectedFood, setSelectedFood] = useState<any>(null);

  // 🌐 ระบบภาษาและธีม
  const [dict, setDict] = useState<any>(null);
  const [lang, setLang] = useState<'en' | 'th'>('th');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const query = dateRange.start && dateRange.end 
      ? `?start=${dateRange.start}&end=${dateRange.end}` 
      : "";
    try {
      const res = await fetch(`/api/admin/all-foods${query}`);
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [dateRange]);

  useEffect(() => { 
    const savedLang = (localStorage.getItem("preferred-lang") as 'en' | 'th') || 'th';
    setLang(savedLang);
    getDictionary(savedLang).then(setDict);
    fetchLogs(); 
  }, [fetchLogs]);

  if (!dict) return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
       <RefreshCw className="animate-spin text-orange-500" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050505] transition-colors duration-500 pb-20">
      <div className="p-6 space-y-8 max-w-7xl mx-auto selection:bg-orange-500/30">
        
        {/* 🟢 HEADER & FILTER */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 animate-in fade-in duration-700">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-400 dark:text-gray-400 hover:text-orange-500 transition-all shadow-sm">
              <ChevronLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter italic leading-none text-slate-900 dark:text-white">
                {lang === 'th' ? "ตรวจสอบข้อมูลอาหาร" : "Food Analysis Audit"}
              </h1>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">
                {lang === 'th' ? "ติดตามบันทึกโภชนาการ AI ทั่วโลก" : "Monitor Global AI Nutrition Records"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 p-2 rounded-[1.5rem] shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-2 px-3">
              <Calendar size={14} className="text-orange-500" />
              <input 
                type="date" 
                className="bg-transparent text-xs font-black uppercase outline-none text-slate-700 dark:text-white cursor-pointer"
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              />
              <ArrowRight size={12} className="text-gray-300 dark:text-gray-700" />
              <input 
                type="date" 
                className="bg-transparent text-xs font-black uppercase outline-none text-slate-700 dark:text-white cursor-pointer"
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              />
            </div>
            <button 
              onClick={fetchLogs}
              className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-orange-400 transition-all active:scale-95 shadow-lg shadow-orange-500/20"
            >
              <Filter size={14} /> {lang === 'th' ? "กรองข้อมูล" : "Filter Record"}
            </button>
          </div>
        </header>

        {/* 📊 DATA TABLE */}
        <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-xl dark:shadow-2xl transition-all overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="text-[12px] text-gray-500 font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20">
                <th className="px-8 py-5">{lang === 'th' ? "เป้าหมายการวิเคราะห์" : "Analysis Target"}</th>
                <th className="px-8 py-5">{lang === 'th' ? "สารอาหาร (P/C/F)" : "Nutrients (P/C/F)"}</th>
                <th className="px-8 py-5">{lang === 'th' ? "พลังงาน" : "Energy"}</th>
                <th className="px-8 py-5">{lang === 'th' ? "วันเวลา" : "Timestamp"}</th>
                <th className="px-8 py-5 text-right">{lang === 'th' ? "ตรวจสอบ" : "Inspect"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading ? (
                <tr><td colSpan={5} className="py-32 text-center"><Loader2 className="animate-spin mx-auto text-orange-500" size={40} /></td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="py-32 text-center text-gray-400 font-black uppercase text-xs tracking-[0.3em] italic">{lang === 'th' ? "ไม่พบข้อมูลในช่วงที่ระบุ" : "No records found in this range"}</td></tr>
              ) : logs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors group text-slate-700 dark:text-gray-300">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <img src={log.imageUrl} className="h-14 w-14 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-white/5 bg-slate-200 dark:bg-black" alt="" />
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white dark:border-[#050505]" />
                      </div>
                      <div>
                        <div className="text-sm font-black italic uppercase tracking-tight text-slate-900 dark:text-white">{log.foodName || "Unknown"}</div>
                        <div className="text-[12px] text-gray-400 font-bold uppercase mt-0.5 opacity-70">ID: {log._id.slice(-8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex gap-2">
                      <MacroBadge label="P" val={log.protein} color="text-blue-500" />
                      <MacroBadge label="C" val={log.carbs} color="text-amber-500" />
                      <MacroBadge label="F" val={log.fat} color="text-rose-500" />
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 italic leading-none">{Math.round(log.totalCalories || 0)}</div>
                    <div className="text-xs text-gray-400 font-black uppercase mt-1">KCAL</div>
                  </td>
                  <td className="px-8 py-5 uppercase">
                     <div className="text-xs font-black text-slate-700 dark:text-gray-300">{new Date(log.createdAt).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB')}</div>
                     <div className="text-[12px] font-bold text-gray-400">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="px-8 py-5 text-right">
                     <button 
                      onClick={() => setSelectedFood(log)}
                      className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-slate-500 hover:text-white hover:bg-orange-500 transition-all active:scale-90 shadow-sm"
                     >
                        <Eye size={18} />
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 🔴 INSPECT MODAL */}
        {selectedFood && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/90 backdrop-blur-xl animate-in fade-in" onClick={() => setSelectedFood(null)} />
            
            <div className="relative w-full max-w-2xl bg-white dark:bg-[#0d0d0d] border border-slate-200 dark:border-white/10 rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="flex flex-col">
                <div className="relative h-72 w-full bg-slate-100 dark:bg-black">
                  <img src={selectedFood.imageUrl} className="w-full h-full object-cover opacity-90 dark:opacity-80" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0d0d0d] via-transparent to-transparent" />
                  <button 
                    onClick={() => setSelectedFood(null)}
                    className="absolute top-6 right-6 p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all active:scale-90"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-3xl font-black italic uppercase text-orange-500 leading-none">{selectedFood.foodName || "Unknown"}</h2>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.2em] mt-3 flex items-center gap-2">
                         <Calendar size={12} /> {new Date(selectedFood.createdAt).toLocaleString(lang === 'th' ? 'th-TH' : 'en-GB')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400 leading-none italic">{Math.round(selectedFood.totalCalories || 0)}</div>
                      <div className="text-xs text-gray-400 font-black uppercase mt-1">{lang === 'th' ? "พลังงานทั้งหมด" : "Total Energy"}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <NutritionBox label={lang === 'th' ? "โปรตีน" : "PROTEIN"} val={selectedFood.protein} unit="g" color="text-blue-500" />
                    <NutritionBox label={lang === 'th' ? "คาร์บ" : "CARBS"} val={selectedFood.carbs} unit="g" color="text-amber-500" />
                    <NutritionBox label={lang === 'th' ? "ไขมัน" : "FAT"} val={selectedFood.fat} unit="g" color="text-rose-500" />
                  </div>

                  <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 p-6 rounded-[2.5rem] space-y-3 shadow-inner">
                    <h4 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                       <Info size={14} className="text-orange-500" /> AI System Audit Note
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed italic">
                      {lang === 'th' 
                        ? `ระบบทำการบันทึกข้อมูลสำหรับ ${selectedFood.foodName || 'เมนูนี้'} โดยอิงจากฐานข้อมูลโภชนาการล่าสุด ข้อมูลนี้ถูกเก็บรักษาไว้เพื่อการทำ Audit และตรวจสอบความถูกต้องของ Model AI.`
                        : `System recorded analysis for ${selectedFood.foodName || 'this menu'} based on latest nutrition database. This record is maintained for auditing and AI model verification.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MacroBadge({ label, val, color }: any) {
  return (
    <div className="bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-lg border border-slate-200 dark:border-white/5 flex items-center gap-1.5 shadow-sm">
      <span className="text-xs font-black text-slate-400 dark:text-gray-600">{label}</span>
      <span className={`text-xs font-black ${color}`}>{Math.round(val || 0)}g</span>
    </div>
  );
}

function NutritionBox({ label, val, unit, color }: any) {
  return (
    <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 p-4 rounded-3xl text-center shadow-sm">
      <p className="text-xs font-black text-gray-400 dark:text-gray-600 uppercase mb-1 tracking-widest">{label}</p>
      <p className={`text-xl font-black ${color}`}>{Math.round(val || 0)}<span className="text-xs ml-0.5 opacity-50">{unit}</span></p>
    </div>
  );
}