"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, MessageSquare, CheckCircle2, Clock, Mail, User, Loader2, RefreshCw, X, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { getDictionary } from "@/lib/get-dictionary";

export default function SupportPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  
  // 🌐 ระบบภาษาและธีม
  const [dict, setDict] = useState<any>(null);
  const [lang, setLang] = useState<'en' | 'th'>('th');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/support");
      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
    } catch (err) { 
      console.error("Fetch Support Error:", err); 
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    const savedLang = (localStorage.getItem("preferred-lang") as 'en' | 'th') || 'th';
    setLang(savedLang);
    getDictionary(savedLang).then(setDict);
    fetchReports(); 
  }, [fetchReports]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/support", {
        method: "PATCH",
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) fetchReports();
    } catch (err) { console.error(err); }
  };

  const filteredReports = reports.filter(r => filter === "all" || r.status === filter);

  if (!dict) return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
       <RefreshCw className="animate-spin text-indigo-500" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050505] transition-colors duration-500 pb-20">
      <div className="p-6 space-y-8 max-w-7xl mx-auto selection:bg-indigo-500/30">
        
        {/* 🟢 HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-in fade-in duration-700">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-400 dark:text-gray-400 hover:text-indigo-500 transition-all shadow-sm">
              <ChevronLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter italic leading-none text-indigo-600 dark:text-indigo-400">
                {lang === 'th' ? "ศูนย์ช่วยเหลือ" : "Support Tickets"}
              </h1>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">
                {lang === 'th' ? "จัดการปัญหาและข้อเสนอแนะจากผู้ใช้งาน" : "Manage issues and feedback from users"}
              </p>
            </div>
          </div>

          {/* 📑 TABS FILTER */}
          <div className="flex bg-white dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
            {["all", "pending", "resolved"].map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  filter === t 
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                    : "text-gray-400 hover:text-indigo-500 dark:hover:text-gray-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </header>

        {/* 📬 TICKETS LIST */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-32 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" size={40} /></div>
          ) : filteredReports.length === 0 ? (
            <div className="py-32 text-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[3rem] opacity-40">
               <MessageSquare size={48} className="mx-auto text-slate-300 dark:text-white/10 mb-4" />
               <p className="text-slate-400 font-black uppercase text-xs tracking-widest">
                 {lang === 'th' ? "ไม่มีรายการข้อมูลในหมวดนี้" : "No tickets found in this category"}
               </p>
            </div>
          ) : filteredReports.map((report) => (
            <div 
              key={report._id} 
              className={`bg-white dark:bg-white/[0.02] border rounded-[2.5rem] p-8 transition-all hover:shadow-xl dark:hover:bg-white/[0.04] ${
                  report.status === 'pending' ? 'border-indigo-500/30 shadow-indigo-500/5' : 'border-slate-200 dark:border-white/10'
              }`}
            >
              <div className="flex flex-col lg:flex-row gap-8">
                {/* User Info & Status */}
                <div className="lg:w-1/4 space-y-4 border-r border-slate-100 dark:border-white/5 pr-8">
                  <div className="flex items-center gap-3">
                     <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black border border-indigo-500/20 shadow-sm">
                        <User size={18} />
                     </div>
                     <div>
                        <p className="text-sm font-black italic text-slate-900 dark:text-white">
                          {report.userId?.name || (lang == 'th' ? "ไม่ระบุขื่่อ" : "Anonymous")}
                        </p>
                        <p className="text-xs text-gray-500 font-bold lowercase truncate max-w-[120px]">{report.userId?.email || "no-email"}</p>
                     </div>
                  </div>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-black uppercase tracking-widest border ${
                     report.status === 'pending' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/10' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/10'
                  }`}>
                     {report.status === 'pending' ? <Clock size={10} /> : <CheckCircle2 size={10} />}
                     {report.status === 'pending' ? (lang === 'th' ? "รอดำเนินการ" : "Pending") : (lang === 'th' ? "เสร็จสิ้น" : "Resolved")}
                  </div>
                  <p className="text-[12px] text-gray-400 font-bold uppercase tracking-widest">
                     {lang === 'th' ? "แจ้งเมื่อ" : "Reported"}: {new Date(report.createdAt).toLocaleString(lang === 'th' ? 'th-TH' : 'en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Message Content */}
                <div className="flex-1 space-y-4">
                   <div className="bg-slate-50 dark:bg-black/40 p-6 rounded-3xl border border-slate-100 dark:border-white/5 italic text-slate-700 dark:text-gray-300 text-sm leading-relaxed shadow-inner">
                     "{report.message || (lang === 'th' ? "ไม่มีรายละเอียด" : "No details provided")}"
                   </div>
                   
                   <div className="flex justify-end items-center gap-3">
                      {report.status === 'pending' && (
                         <button 
                          onClick={() => updateStatus(report._id, 'resolved')}
                          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 dark:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-400 transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
                         >
                           <CheckCircle2 size={14} /> {lang === 'th' ? "ทำเครื่องหมายว่าแก้แล้ว" : "Mark as Resolved"}
                         </button>
                      )}
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}