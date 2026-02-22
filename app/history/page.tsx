"use client";

import { useEffect, useState } from "react";
import { Trash2, Calendar, Flame, Beef, Wheat, Droplets, AlertCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";

type MealLog = {
  _id: string;
  loggedAt?: string;
  createdAt?: string;
  foodName?: string;
  imageUrl?: string;
  totalCalories?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
};

function MacroRing({ label, current, goal, colorClass, icon: Icon }: { label: string; current: number; goal: number; colorClass: string; icon: any }) {
  const safeGoal = goal > 0 ? goal : 1;
  const percentage = Math.min((current / safeGoal) * 100, 100);
  return (
    <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-3xl p-4 w-full">
      <div className="flex items-center gap-4">
        <div className="relative h-14 w-14">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="none" className="stroke-white/5" strokeWidth="3" />
            <circle cx="18" cy="18" r="16" fill="none" className={`${colorClass} transition-all duration-1000 ease-out`} strokeWidth="3.5" strokeDasharray={`${percentage}, 100`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon size={16} className={`${colorClass.replace('stroke-', 'text-')} opacity-80`} />
          </div>
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
          <p className="text-sm font-black text-white leading-none">
            {Math.round(current)} <span className="text-[10px] text-gray-500 font-bold uppercase">/ {Math.round(goal)}g</span>
          </p>
        </div>
      </div>
      <div className="text-right px-2">
        <span className={`text-xs font-black ${percentage >= 100 ? 'text-emerald-500' : 'text-gray-500'}`}>{Math.round(percentage)}%</span>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ✅ เริ่มต้นที่ค่าว่าง เพื่อรอรับค่าจริงจากบัญชีที่ Logged in อยู่
  const [goals, setGoals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });
  
  const [showAll, setShowAll] = useState(false);
  const [filterDate, setFilterDate] = useState("");

  const loadData = async () => {
    try {
      // 1. ดึงเป้าหมายจาก Profile ของ User คนปัจจุบัน
      const profileRes = await fetch("/api/profile");
      if (profileRes.ok) {
        const data = await profileRes.json();
        const profile = data.profile || data; // รองรับโครงสร้าง API หลายแบบ
        
        // ดึงค่าเป้าหมายจาก Database ตรงๆ เหมือนหน้า Home
        const g = profile.goals || profile; 
        
        setGoals({
          calories: Number(g.calories || g.dailyCalorieGoal) || 2000,
          protein: Number(g.protein || g.proteinGoal) || 150,
          carbs: Number(g.carbs || g.carbsGoal) || 250,
          fat: Number(g.fat || g.fatGoal) || 70,
        });
      }

      // 2. ดึงประวัติการกิน
      const res = await fetch("/api/meal-logs");
      if (res.ok) {
        const data = await res.json();
        const logsData = Array.isArray(data) ? data : data.logs || [];
        setLogs(logsData.sort((a: any, b: any) => new Date(b.loggedAt || b.createdAt).getTime() - new Date(a.loggedAt || a.createdAt).getTime()));
      }
    } catch (err) { 
      console.error("Load Error:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { loadData(); }, []);

  const getCustomDateStr = (dateInput?: string) => {
    const date = dateInput ? new Date(dateInput) : new Date();
    if (date.getHours() < 3) date.setDate(date.getDate() - 1);
    return date.toISOString().slice(0, 10);
  };

  const todayStr = getCustomDateStr();
  
  const filteredLogs = filterDate 
    ? logs.filter(log => (log.loggedAt || log.createdAt || "").startsWith(filterDate))
    : logs;

  const todaysLogs = logs.filter(log => getCustomDateStr(log.loggedAt || log.createdAt) === todayStr);
  const pastLogs = logs.filter(log => getCustomDateStr(log.loggedAt || log.createdAt) !== todayStr);

  const stats = todaysLogs.reduce((acc, log) => ({
    cal: acc.cal + (log.totalCalories || log.calories || 0), 
    pro: acc.pro + (log.protein || 0),
    carb: acc.carb + (log.carbs || 0),
    fat: acc.fat + (log.fat || 0),
  }), { cal: 0, pro: 0, carb: 0, fat: 0 });

  const calPercentage = Math.min((stats.cal / (goals.calories || 1)) * 100, 100);

  const handleDelete = async (id: string) => {
    if (!confirm("ลบรายการนี้ใช่หรือไม่?")) return;
    const res = await fetch(`/api/meal-logs/${id}`, { method: "DELETE" });
    if (res.ok) setLogs(prev => prev.filter(l => l._id !== id));
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-screen bg-black">
      <Loader2 className="animate-spin text-emerald-500 mb-4" size={32} />
      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Syncing Data...</span>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 px-4 pt-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-center mb-8 px-2">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter italic">Daily Status</h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">Reset at 03:00 AM</p>
        </div>
        <div className="h-10 w-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-500">
          <Flame size={20} fill="currentColor" />
        </div>
      </header>

      {/* 🟢 ส่วนวงแหวนสรุป (ตอนนี้จะเปลี่ยนตาม User แล้ว) */}
      <section className="space-y-4">
        <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center relative overflow-hidden shadow-2xl">
            <div className="relative h-48 w-48">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" fill="none" className="stroke-white/5" strokeWidth="2.5" />
                    <circle cx="18" cy="18" r="16" fill="none" className="stroke-emerald-500 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(16,185,129,0.3)]" strokeWidth="2.5" strokeDasharray={`${calPercentage}, 100`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black text-white tracking-tighter">{Math.round(stats.cal)}</span>
                    <div className="w-12 h-[1px] bg-white/20 my-1.5"></div>
                    <span className="text-[11px] text-gray-500 uppercase font-black tracking-widest">{goals.calories} kcal</span>
                </div>
            </div>
            <p className="mt-4 text-[11px] font-black text-emerald-500 uppercase tracking-[0.3em]">Calories Today</p>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <MacroRing label="Protein (เนื้อ)" current={stats.pro} goal={goals.protein} colorClass="stroke-blue-400" icon={Beef} />
          <MacroRing label="Carbohydrates (ข้าว)" current={stats.carb} goal={goals.carbs} colorClass="stroke-yellow-400" icon={Wheat} />
          <MacroRing label="Fats (ไขมัน)" current={stats.fat} goal={goals.fat} colorClass="stroke-rose-500" icon={Droplets} />
        </div>
      </section>

      {/* 🔍 ระบบ Filter วันที่ */}
      <div className="px-2">
        <div className="relative group">
          <input 
            type="date" 
            value={filterDate}
            onChange={(e) => {setFilterDate(e.target.value); setShowAll(true);}}
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 pl-10 text-xs font-bold text-gray-300 focus:outline-none focus:border-emerald-500/50 transition-all appearance-none"
            style={{ colorScheme: 'dark' }}
          />
          <Calendar className="absolute left-3 top-3 text-gray-500 group-focus-within:text-emerald-500 transition-colors" size={16} />
          {filterDate && (
            <button onClick={() => {setFilterDate(""); setShowAll(false);}} className="absolute right-3 top-3 text-[10px] font-black text-emerald-500 uppercase">Clear</button>
          )}
        </div>
      </div>

      {/* 🟢 รายการอาหาร */}
      <div className="mt-6 space-y-6">
        <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.3em] px-2 flex justify-between items-center">
           <span>{filterDate ? `Result: ${filterDate}` : "Today's Meals"}</span>
           {!filterDate && todaysLogs.length > 0 && <span className="text-emerald-500/50">{todaysLogs.length} items</span>}
        </h3>

        {(filterDate ? filteredLogs : todaysLogs).length === 0 ? (
          <div className="py-12 text-center border border-dashed border-white/10 rounded-[2.5rem] bg-white/[0.01]">
             <AlertCircle size={20} className="mx-auto text-gray-700 mb-2" />
             <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">ยังไม่มีการบันทึกอาหาร</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(filterDate ? filteredLogs : todaysLogs).map((log) => (
              <MealCard key={log._id} log={log} isToday={getCustomDateStr(log.loggedAt || log.createdAt) === todayStr} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {!filterDate && pastLogs.length > 0 && (
          <div className="pt-4">
            <button 
              onClick={() => setShowAll(!showAll)}
              className="w-full py-4 border border-white/5 bg-white/[0.02] rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:bg-white/5 transition-all"
            >
              {showAll ? <><ChevronUp size={14} /> Hide Past History</> : <><ChevronDown size={14} /> Show Past History ({pastLogs.length})</>}
            </button>
            
            {showAll && (
              <div className="space-y-3 mt-4 animate-in slide-in-from-top-4 duration-500">
                {pastLogs.map((log) => (
                  <MealCard key={log._id} log={log} isToday={false} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MealCard({ log, isToday, onDelete }: { log: MealLog, isToday: boolean, onDelete: (id: string) => void }) {
  const logDate = new Date(log.loggedAt || log.createdAt || "");
  return (
    <div className="flex gap-4 rounded-[2rem] border border-white/5 bg-white/[0.02] p-4 group hover:bg-white/[0.04] transition-all">
      {log.imageUrl && <img src={log.imageUrl} className="h-16 w-16 rounded-2xl object-cover ring-1 ring-white/10" />}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-black text-sm text-gray-200 truncate pr-8 uppercase italic leading-none">{log.foodName || "Unknown"}</h4>
          <span className="text-emerald-500 font-black text-sm">{Math.round(log.totalCalories || log.calories || 0)} <span className="text-[8px]">kcal</span></span>
        </div>
        <div className="flex items-center gap-2 mb-2 font-bold uppercase">
            <span className={`text-[8px] px-2 py-0.5 rounded-md ${isToday ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-gray-500'}`}>
                {isToday ? "TODAY" : logDate.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' })}
            </span>
            <span className="text-[9px] text-gray-600">{logDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1"><Beef size={10} className="text-blue-400 opacity-70" /><span className="text-[10px] font-bold text-gray-500">{Math.round(log.protein || 0)}g</span></div>
          <div className="flex items-center gap-1"><Wheat size={10} className="text-yellow-400 opacity-70" /><span className="text-[10px] font-bold text-gray-500">{Math.round(log.carbs || 0)}g</span></div>
          <div className="flex items-center gap-1"><Droplets size={10} className="text-rose-400 opacity-70" /><span className="text-[10px] font-bold text-gray-500">{Math.round(log.fat || 0)}g</span></div>
        </div>
      </div>
      <button onClick={() => onDelete(log._id)} className="p-2 text-red-500/30 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
    </div>
  );
}