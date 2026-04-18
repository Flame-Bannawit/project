"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, Flame, TrendingUp, Loader2, Award, Utensils, RefreshCw } from "lucide-react";
import Link from "next/link";
import { getDictionary } from "@/lib/get-dictionary";

export default function TrendingPage() {
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 🌐 ระบบภาษาและธีม
  const [dict, setDict] = useState<any>(null);
  const [lang, setLang] = useState<'en' | 'th'>('th');

  const fetchTrending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/food-hot");
      const data = await res.json();
      setTrending(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedLang = (localStorage.getItem("preferred-lang") as 'en' | 'th') || 'th';
    setLang(savedLang);
    getDictionary(savedLang).then(setDict);
    fetchTrending();
  }, [fetchTrending]);

  if (!dict) return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
       <RefreshCw className="animate-spin text-rose-500" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050505] transition-colors duration-500 pb-20">
      <div className="p-6 space-y-8 max-w-7xl mx-auto selection:bg-rose-500/30">
        
        {/* 🟢 HEADER */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in duration-700">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Link href="/admin" className="p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-400 dark:text-gray-400 hover:text-rose-500 transition-all shadow-sm">
              <ChevronLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter italic leading-none text-rose-500">
                {lang === 'th' ? "10 อันดับเมนูยอดฮิต" : "Food Hot Trends"}
              </h1>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">
                {lang === 'th' ? "เมนูที่มีการสแกนสูงสุดในระบบ" : "Top 10 most scanned menus in system"}
              </p>
            </div>
          </div>
          <button onClick={fetchTrending} className="p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-400 dark:text-gray-400 hover:text-rose-500 transition-all">
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </header>

        {loading ? (
          <div className="py-32 text-center">
            <Loader2 className="animate-spin mx-auto text-rose-500" size={40} />
            <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-gray-500">
              {lang === 'th' ? "กำลังประมวลผลข้อมูลสถิติ..." : "Processing analytics data..."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trending.map((item, index) => (
              <div 
                key={index} 
                className="group relative bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 p-6 rounded-[2.5rem] flex items-center gap-6 hover:border-rose-500/30 transition-all duration-500 overflow-hidden shadow-sm hover:shadow-xl dark:shadow-none"
              >
                {/* แสง Glow ด้านหลังเมื่อ Hover */}
                <div className="absolute -inset-1 bg-gradient-to-r from-rose-500/0 via-rose-500/5 to-rose-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* ลำดับที่ */}
                <div className="relative">
                  <div className={`h-16 w-16 rounded-[1.5rem] flex items-center justify-center font-black text-2xl italic shadow-2xl transition-transform group-hover:scale-110 ${
                    index === 0 ? 'bg-rose-500 text-black shadow-rose-500/20' : 
                    index === 1 ? 'bg-orange-500 text-black shadow-orange-500/20' :
                    index === 2 ? 'bg-yellow-500 text-black shadow-yellow-500/20' :
                    'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-gray-500 border border-slate-200 dark:border-white/10'
                  }`}>
                    {index + 1}
                  </div>
                  {index < 3 && (
                    <div className="absolute -top-2 -right-2 p-1.5 bg-white dark:bg-black rounded-full border border-slate-200 dark:border-white/10 shadow-md">
                      <Award size={12} className="text-rose-500 dark:text-white" />
                    </div>
                  )}
                </div>

                {/* ข้อมูลเมนู */}
                <div className="flex-1 min-w-0 z-10">
                  <h3 className="text-xl font-black italic uppercase tracking-tight truncate text-slate-900 dark:text-white group-hover:text-rose-500 transition-colors">
                    {item._id || (lang === 'th' ? "ไม่ระบุชื่อเมนู" : "Unknown Dish")}
                  </h3>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp size={12} className="text-emerald-500" />
                      <p className="text-xs font-black text-slate-500 dark:text-gray-300 uppercase">
                        {lang === 'th' ? "สแกน" : "Scanned"} <span className="text-slate-900 dark:text-white text-xs">{item.count}</span> {lang === 'th' ? "ครั้ง" : "Times"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-white/10 pl-4">
                      <Utensils size={12} className="text-blue-500" />
                      <p className="text-xs font-black text-slate-500 dark:text-gray-300 uppercase">
                        {lang === 'th' ? "เฉลี่ย" : "Avg"} <span className="text-slate-900 dark:text-white text-xs">{Math.round(item.avgCalories)}</span> KCAL
                      </p>
                    </div>
                  </div>
                  
                  {/* กราฟแท่งจำลองความนิยม */}
                  <div className="w-full h-1 bg-slate-100 dark:bg-white/5 rounded-full mt-4 overflow-hidden">
                     <div 
                      className="h-full bg-rose-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${(item.count / (trending[0]?.count || 1)) * 100}%` }}
                     />
                  </div>
                </div>

                {/* รูปตัวอย่าง */}
                <div className="h-20 w-20 rounded-[2rem] overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-200 dark:bg-black shrink-0 relative group-hover:border-rose-500/50 transition-all">
                  {item.sampleImage ? (
                    <img 
                      src={item.sampleImage} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" 
                      alt="" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-gray-600">
                      <Utensils size={24} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 dark:from-black/80 to-transparent" />
                  <Flame size={14} className="absolute bottom-2 right-2 text-rose-500 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* สรุปท้ายหน้า */}
        <footer className="bg-white dark:bg-rose-500/5 border border-slate-200 dark:border-rose-500/10 p-6 rounded-[2.5rem] text-center shadow-sm">
           <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 dark:text-rose-500/60">
             {lang === 'th' ? "อัปเดตข้อมูลล่าสุดเมื่อ" : "Last updated at"}: {new Date().toLocaleTimeString(lang === 'th' ? 'th-TH' : 'en-GB')}
           </p>
        </footer>
      </div>
    </div>
  );
}