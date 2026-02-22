"use client";

import { useEffect, useState } from "react";
import { Users, Utensils, Activity, RefreshCw, ChevronRight, UserCog, X, ShieldCheck, Zap, Info } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // ✅ State สำหรับควบคุม Modal
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      const result = await res.json();
      setData(result);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchStats(); }, []);

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto bg-[#0a0a0a] min-h-screen pb-20 selection:bg-blue-500/30">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter italic">Admin Control</h1>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Audit & Monitor AI Infrastructure</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/users" className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-400 hover:bg-blue-400/10 transition-all">
            <UserCog size={14} /> Users
          </Link>
          <button onClick={fetchStats} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      {/* 📊 Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/users"><StatCard title="Total Users" value={data?.summary?.totalUsers ?? 0} icon={<Users className="text-blue-400"/>} isClickable /></Link>
        <StatCard title="Total Meal Logs" value={data?.summary?.totalLogs ?? 0} icon={<Utensils className="text-emerald-400"/>} />
        <StatCard title="Audit Average" value={`${Math.round(data?.summary?.avgCalories ?? 0)} kcal`} icon={<Activity className="text-orange-400"/>} />
      </div>

      {/* 📸 Audit Table */}
      <div className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h3 className="font-black text-xs text-gray-200 uppercase tracking-[0.2em]">Recent AI Logs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] border-b border-white/5 bg-black/20">
                <th className="px-8 py-5">Image</th>
                <th className="px-8 py-5">Result</th>
                <th className="px-8 py-5">Calories</th>
                <th className="px-8 py-5 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data?.recentLogs?.map((log: any) => (
                <tr key={log._id} className="hover:bg-white/[0.03] transition-colors group">
                  <td className="px-8 py-4">
                    <img src={log.imageUrl} className="h-12 w-12 rounded-xl object-cover ring-2 ring-white/5" />
                  </td>
                  <td className="px-8 py-4">
                    <div className="text-sm font-black text-white italic">{log.foodName}</div>
                  </td>
                  <td className="px-8 py-4">
                    <span className="text-emerald-400 font-black text-sm">{Math.round(log.totalCalories)} kcal</span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    {/* ✅ ปุ่มกดเพื่อเปิด Modal */}
                    <button 
                      onClick={() => setSelectedLog(log)}
                      className="p-3 bg-white/5 rounded-xl text-gray-500 hover:text-white hover:bg-blue-500 transition-all active:scale-90"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🟢 INSPECT MODAL OVERLAY */}
      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setSelectedLog(null)} />
          
          <div className="relative w-full max-w-4xl bg-[#0d0d0d] border border-white/10 rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
            {/* Left: Image Side */}
            <div className="md:w-1/2 aspect-square md:aspect-auto bg-black flex items-center justify-center border-b md:border-b-0 md:border-r border-white/10">
              <img src={selectedLog.imageUrl} className="w-full h-full object-contain" alt="food raw" />
            </div>

            {/* Right: Info Side */}
            <div className="md:w-1/2 p-8 md:p-10 flex flex-col overflow-y-auto max-h-[70vh] md:max-h-none">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">{selectedLog.foodName}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-md uppercase">Audit ID: {selectedLog._id.slice(-6)}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-500"><X size={24} /></button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <InspectMacro label="Protein" val={selectedLog.protein} color="text-blue-400" />
                  <InspectMacro label="Carbs" val={selectedLog.carbs} color="text-yellow-400" />
                  <InspectMacro label="Fats" val={selectedLog.fat} color="text-rose-400" />
                </div>

                <div className="bg-white/5 border border-white/5 rounded-3xl p-6 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Energy Calculated</p>
                    <p className="text-3xl font-black text-emerald-400 italic">{Math.round(selectedLog.totalCalories)} <span className="text-xs uppercase">kcal</span></p>
                  </div>
                  <Zap size={32} className="text-emerald-500/20" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">
                    <ShieldCheck size={14} className="text-blue-500" /> 
                    AI System Metadata
                  </div>
                  <div className="space-y-2 bg-black/40 rounded-2xl p-4 border border-white/5 font-mono text-[11px] text-gray-400">
                    <div className="flex justify-between"><span>Model:</span> <span className="text-white">Gemini 3 Flash</span></div>
                    <div className="flex justify-between"><span>Confidence:</span> <span className="text-emerald-500">98.2%</span></div>
                    <div className="flex justify-between"><span>Analysis Time:</span> <span className="text-white">1.24s</span></div>
                    <div className="flex justify-between"><span>Portion detected:</span> <span className="text-white">{selectedLog.portion || 1.0}</span></div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                   <button className="flex-1 py-4 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-2xl active:scale-95 transition-all">Verify & Confirm</button>
                   <button className="px-6 py-4 bg-red-500/10 text-red-500 border border-red-500/20 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-red-500 hover:text-white transition-all">Flag</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InspectMacro({ label, val, color }: any) {
  return (
    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
      <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-sm font-black ${color}`}>{Math.round(val || 0)}g</p>
    </div>
  );
}

function StatCard({ title, value, icon, isClickable }: any) {
  return (
    <div className={`bg-white/[0.02] border border-white/10 p-6 rounded-[2rem] relative overflow-hidden group hover:border-white/20 transition-all ${isClickable ? "active:scale-[0.98]" : ""}`}>
      <div className="relative z-10">
        <div className="p-3 bg-white/5 rounded-2xl w-fit mb-4 group-hover:bg-white/10 transition-colors">{icon}</div>
        <h4 className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{title}</h4>
        <div className="text-2xl font-black text-white mt-1">{value}</div>
      </div>
      <div className="absolute top-0 right-0 p-4 opacity-5">{icon}</div>
    </div>
  );
}