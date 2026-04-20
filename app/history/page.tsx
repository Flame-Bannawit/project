"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Trash2, Calendar, Flame, Beef, Wheat, Droplets, 
  AlertCircle, Loader2, Edit2, X, Save, RotateCcw, 
  RefreshCw, Zap, TrendingUp, CheckCircle2 
} from "lucide-react";
import { getDictionary } from "@/lib/get-dictionary";

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
  remainingPercent?: number;
  isSaved?: boolean;
  thaiDish?: {
    originalCalories?: number;
    originalProtein?: number;
    originalCarbs?: number;
    originalFat?: number;
  }
};

function MacroRing({ label, current, goal, colorClass, icon: Icon }: { label: string; current: number; goal: number; colorClass: string; icon: any }) {
  const safeGoal = goal > 0 ? goal : 1;
  const percentage = Math.min((current / safeGoal) * 100, 100);
  return (
    <div className="flex items-center justify-between bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-[1.8rem] p-4 w-full shadow-sm">
      <div className="flex items-center gap-4">
        <div className="relative h-12 w-12">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-100 dark:stroke-white/5" strokeWidth="3" />
            <circle cx="18" cy="18" r="16" fill="none" className={`${colorClass} transition-all duration-1000 ease-out`} strokeWidth="3.5" strokeDasharray={`${percentage}, 100`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon size={14} className={`${colorClass.replace('stroke-', 'text-')} opacity-80`} />
          </div>
        </div>
        <div>
          <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none mb-1">{label}</p>
          <p className="text-base font-black text-slate-900 dark:text-white leading-none">
            {Math.round(current)} <span className="text-[12px] text-gray-400 font-bold uppercase">/ {Math.round(goal)}g</span>
          </p>
        </div>
      </div>
      <span className={`text-xs font-black px-2 py-1 rounded-lg ${percentage >= 100 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 dark:bg-white/5 text-gray-400'}`}>{Math.round(percentage)}%</span>
    </div>
  );
}

export default function HistoryPage() {
  const [dict, setDict] = useState<any>(null);
  const [lang, setLang] = useState<'en' | 'th'>('th');
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [goals, setGoals] = useState({ calories: 2000, protein: 150, carbs: 250, fat: 70 });
  const [showAll, setShowAll] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [editingLog, setEditingLog] = useState<MealLog | null>(null);
  const [remainingPercent, setRemainingPercent] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const savedLang = (localStorage.getItem("preferred-lang") as 'en' | 'th') || 'th';
      setLang(savedLang);
      const dictionary = await getDictionary(savedLang);
      setDict(dictionary);

      const [profileRes, logsRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/meal-logs")
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        const userProfile = profileData.profile || profileData;
        
        setGoals({
          calories: Number(userProfile?.dailyCalorieGoal || userProfile?.goals?.calories || 2000),
          protein: Number(userProfile?.goals?.protein || userProfile?.proteinGoal || 150),
          carbs: Number(userProfile?.goals?.carbs || userProfile?.carbsGoal || 250),
          fat: Number(userProfile?.goals?.fat || userProfile?.fatGoal || 70),
        });
      }

      if (logsRes.ok) {
        const data = await logsRes.json();
        const logsData = Array.isArray(data) ? data : data.logs || [];
        
        const normalizedLogs = logsData.map((log: any) => ({
          ...log,
          calories: Number(log.calories ?? log.totalCalories ?? 0),
          protein: Number(log.protein ?? 0),
          carbs: Number(log.carbs ?? 0),
          fat: Number(log.fat ?? 0)
        }));

        setLogs(normalizedLogs.sort((a: any, b: any) => 
          new Date(b.loggedAt || b.createdAt).getTime() - new Date(a.loggedAt || a.createdAt).getTime()
        ));
      }
    } catch (err) { console.error("Load Error:", err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const getCustomDateStr = (dateInput?: string) => {
    const date = dateInput ? new Date(dateInput) : new Date();
    return date.toISOString().slice(0, 10);
  };

  const todayStr = getCustomDateStr();
  const filteredLogs = filterDate ? logs.filter(log => (log.loggedAt || log.createdAt || "").startsWith(filterDate)) : logs;
  const todaysLogs = logs.filter(log => getCustomDateStr(log.loggedAt || log.createdAt) === todayStr);
  const pastLogs = logs.filter(log => getCustomDateStr(log.loggedAt || log.createdAt) !== todayStr);

  // 🎯 อัปเดต: ถ้ามีการเลือกวันที่ (filterDate) ให้เอาข้อมูลของวันนั้นมาคำนวณ ถ้าไม่ได้เลือกให้เป็นของวันนี้
  const activeLogsForStats = filterDate ? filteredLogs : todaysLogs;

  const stats = activeLogsForStats
    .filter(log => log.isSaved === true) 
    .reduce((acc, log) => ({
      cal: acc.cal + (log.calories || 0), 
      pro: acc.pro + (log.protein || 0),
      carb: acc.carb + (log.carbs || 0),
      fat: acc.fat + (log.fat || 0),
    }), { cal: 0, pro: 0, carb: 0, fat: 0 });

  const calPercentage = Math.min((stats.cal / (goals.calories || 1)) * 100, 100);

  const handleDelete = async (id: string) => {
    if (!confirm(lang === 'th' ? "ลบรายการนี้ใช่หรือไม่?" : "Delete this item?")) return;
    const res = await fetch(`/api/meal-logs/${id}`, { method: "DELETE" });
    if (res.ok) setLogs(prev => prev.filter(l => l._id !== id));
  };

  const handleSaveToLog = async (id: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch("/api/meal-logs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logIds: [id], isSaved: true })
      });
      if (res.ok) {
        setLogs(prev => prev.map(l => l._id === id ? { ...l, isSaved: true } : l));
      } else {
        alert(lang === 'th' ? "บันทึกไม่สำเร็จ" : "Failed to save");
      }
    } catch (err) {
      console.error("Save Error:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const openEditModal = (log: MealLog) => {
    setEditingLog(log);
    setRemainingPercent(log.remainingPercent || 0);
  };

  const handleUpdatePercent = async () => {
    if (!editingLog) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/meal-logs/${editingLog._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remainingPercent: Number(remainingPercent) })
      });
      if (res.ok) {
        const data = await res.json();
        const updated = data.updatedLog || data;
        setLogs(prev => prev.map(l => l._id === updated._id ? { 
          ...l, 
          ...updated, 
          calories: updated.calories ?? updated.totalCalories ?? 0,
          protein: updated.protein ?? 0,
          carbs: updated.carbs ?? 0,
          fat: updated.fat ?? 0
        } : l));
        setEditingLog(null);
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error}`);
      }
    } catch (err) { console.error("Update Error:", err); } finally { setIsUpdating(false); }
  };

  if (loading || !dict) return (
    <div className="flex flex-col justify-center items-center h-screen">
      <RefreshCw className="animate-spin text-emerald-500 mb-4" size={32} />
      <span className="text-xs font-black uppercase tracking-[0.3em] text-emerald-500">Syncing History...</span>
    </div>
  );

  // เตรียมข้อความวันที่สำหรับแสดงผล
  const displayDateText = filterDate 
    ? (lang === 'th' ? `ข้อมูลวันที่ ${new Date(filterDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}` : `Insights for ${new Date(filterDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`)
    : (lang === 'th' ? "ข้อมูลวันนี้" : "Today's Insights");

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 px-4 pt-6 animate-in fade-in duration-700">
      <header className="flex justify-between items-center mb-4 px-2 text-slate-900 dark:text-white">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter italic leading-none">History</h1>
          <p className="text-xs text-emerald-500 font-bold uppercase tracking-widest mt-2 flex items-center gap-1">
             <Zap size={10} fill="currentColor" /> {displayDateText}
          </p>
        </div>
        <div className="h-10 w-10 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400">
          <Calendar size={18} />
        </div>
      </header>

      <section className="grid lg:grid-cols-2 gap-4 items-center">
        <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center shadow-xl">
            <div className="relative h-40 w-40">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-100 dark:stroke-white/5" strokeWidth="2.5" />
                    <circle cx="18" cy="18" r="16" fill="none" className="stroke-emerald-500 transition-all duration-1000" strokeWidth="2.5" strokeDasharray={`${calPercentage}, 100`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic">{Math.round(stats.cal)}</span>
                    <span className="text-[12px] text-gray-400 uppercase font-bold tracking-widest mt-1">/ {goals.calories} KCAL</span>
                </div>
            </div>
        </div>
        <div className="space-y-3">
          <MacroRing label={lang === 'th' ? "โปรตีน" : "Protein"} current={stats.pro} goal={goals.protein} colorClass="stroke-blue-500" icon={Beef} />
          <MacroRing label={lang === 'th' ? "คาร์บ" : "Carbs"} current={stats.carb} goal={goals.carbs} colorClass="stroke-amber-500" icon={Wheat} />
          <MacroRing label={lang === 'th' ? "ไขมัน" : "Fats"} current={stats.fat} goal={goals.fat} colorClass="stroke-rose-500" icon={Droplets} />
        </div>
      </section>

      <div className="px-2">
        <div className="relative flex items-center bg-slate-100 dark:bg-white/5 rounded-2xl border border-transparent focus-within:border-emerald-500/30 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
          <Calendar className="absolute left-4 text-gray-400 pointer-events-none" size={16} />
          <input 
            type="date" 
            value={filterDate} 
            onChange={(e) => {setFilterDate(e.target.value); setShowAll(true);}} 
            className="w-full bg-transparent border-none p-4 pl-12 pr-12 text-sm font-black uppercase tracking-widest text-slate-700 dark:text-gray-300 outline-none cursor-pointer appearance-none" 
          />
          {filterDate && (
            <button 
              onClick={() => setFilterDate("")} 
              className="absolute right-3 p-1.5 bg-white dark:bg-white/10 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors z-10"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {(filterDate ? filteredLogs : todaysLogs).map((log) => (
          <MealCard key={log._id} log={log} isToday={getCustomDateStr(log.loggedAt || log.createdAt) === todayStr} onDelete={handleDelete} onEdit={() => openEditModal(log)} onSave={() => handleSaveToLog(log._id)} lang={lang} isUpdating={isUpdating} />
        ))}

        {!filterDate && pastLogs.length > 0 && (
          <div className="pt-2">
            <button onClick={() => setShowAll(!showAll)} className="w-full py-4 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all">
              {showAll ? "Close History" : `Past Records (${pastLogs.length})`}
            </button>
            {showAll && (
              <div className="space-y-4 mt-4 animate-in fade-in slide-in-from-bottom-4">
                {pastLogs.map((log) => (
                  <MealCard key={log._id} log={log} isToday={false} onDelete={handleDelete} onEdit={() => openEditModal(log)} onSave={() => handleSaveToLog(log._id)} lang={lang} isUpdating={isUpdating} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {editingLog && (() => {
        const base = {
          cal: Number(editingLog.thaiDish?.originalCalories || editingLog.calories || editingLog.totalCalories || 0),
          pro: Number(editingLog.thaiDish?.originalProtein || editingLog.protein || 0),
          carb: Number(editingLog.thaiDish?.originalCarbs || editingLog.carbs || 0),
          fat: Number(editingLog.thaiDish?.originalFat || editingLog.fat || 0)
        };
        const multiplier = (100 - remainingPercent) / 100;
        const live = {
          cal: Math.round(base.cal * multiplier),
          pro: Math.round(base.pro * multiplier),
          carb: Math.round(base.carb * multiplier),
          fat: Math.round(base.fat * multiplier)
        };

        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingLog(null)} />
            <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] w-full max-w-md p-8 relative z-10 shadow-2xl border border-white/10 animate-in slide-in-from-bottom-10">
              <div className="w-12 h-1 bg-slate-200 dark:bg-white/10 rounded-full mx-auto mb-6 sm:hidden" />
              
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Adjust Portion</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{editingLog.foodName}</p>
                 </div>
                 <button onClick={() => setEditingLog(null)} className="p-2 bg-slate-100 dark:bg-white/5 rounded-xl text-gray-400"><X size={18}/></button>
              </div>

              <div className="bg-slate-50 dark:bg-white/5 rounded-[2rem] p-6 mb-8 border border-slate-100 dark:border-white/5 text-center relative overflow-hidden">
                <div className="flex flex-col items-center relative z-10">
                  <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter italic">{live.cal}</span>
                  <span className="text-emerald-500 font-black text-xs uppercase tracking-widest mt-1">Calories Intake</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t border-slate-200 dark:border-white/5">
                  <div className="flex flex-col items-center">
                    <Beef size={14} className="text-blue-500 mb-1" />
                    <span className="text-xs font-black text-slate-800 dark:text-white">{live.pro}g</span>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Pro</span>
                  </div>
                  <div className="flex flex-col items-center border-x border-slate-200 dark:border-white/5">
                    <Wheat size={14} className="text-amber-500 mb-1" />
                    <span className="text-xs font-black text-slate-800 dark:text-white">{live.carb}g</span>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Carb</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Droplets size={14} className="text-rose-500 mb-1" />
                    <span className="text-xs font-black text-slate-800 dark:text-white">{live.fat}g</span>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Fat</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] italic">{lang === 'th' ? "ทานเหลือทิ้งกี่ %" : "Leftover %"}</span>
                  <span className="text-2xl font-black text-emerald-500 tracking-tighter">{remainingPercent}%</span>
                </div>
                <input type="range" min="0" max="100" step="5" value={remainingPercent} onChange={(e) => setRemainingPercent(Number(e.target.value))} className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500 outline-none" />

                <div className="flex gap-3">
                  <button onClick={() => setRemainingPercent(0)} className="p-4 bg-slate-100 dark:bg-white/5 rounded-2xl text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"><RotateCcw size={20}/></button>
                  <button onClick={handleUpdatePercent} disabled={isUpdating} className="flex-1 bg-emerald-500 text-black py-4 rounded-2xl font-black uppercase text-base tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                    {isUpdating ? <Loader2 className="animate-spin" size={16}/> : <><Save size={16}/> {lang === 'th' ? "ยืนยันการปรับ" : "Confirm Update"}</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function MealCard({ log, isToday, onDelete, onEdit, onSave, lang, isUpdating }: any) {
  const logDate = new Date(log.loggedAt || log.createdAt || "");
  const isEdited = (log.remainingPercent || 0) > 0;
  
  const isPending = log.isSaved === false; 

  return (
    <div className={`flex flex-col gap-3 rounded-[2rem] border ${isPending ? 'border-dashed border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/[0.02]' : 'border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02]'} p-4 group hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all relative shadow-sm`}>
      
      <div className="flex gap-4 items-center">
        <div className={`w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 dark:bg-white/5 flex-shrink-0 ${isPending ? 'grayscale-[30%]' : ''}`}>
          {log.imageUrl ? <img src={log.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Flame size={20}/></div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h4 className="font-black text-[13px] text-slate-800 dark:text-white uppercase italic truncate pr-4">
              {log.foodName || "Meal"}
              {isEdited && <span className="ml-2 text-xs text-emerald-500 not-italic lowercase tracking-normal bg-emerald-500/10 px-1.5 py-0.5 rounded-md">-{log.remainingPercent}%</span>}
            </h4>
            <span className="text-emerald-600 dark:text-emerald-500 font-black text-sm italic">{Math.round(log.calories || 0)} <span className="text-xs font-bold">KCAL</span></span>
          </div>
          <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${isPending ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-100 dark:bg-white/5 text-gray-400'}`}>
                  {isPending ? (lang === 'th' ? 'ยังไม่บันทึก' : 'Unsaved') : (isToday ? "Today" : logDate.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', { day: '2-digit', month: 'short' }))}
              </span>
              <span className="text-xs font-bold text-gray-300 dark:text-gray-600">{logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex gap-3">
            <MacroMini icon={Beef} val={log.protein} color="text-blue-500" />
            <MacroMini icon={Wheat} val={log.carbs} color="text-amber-500" />
            <MacroMini icon={Droplets} val={log.fat} color="text-rose-500" />
          </div>
        </div>
        
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all"><Edit2 size={14} /></button>
          <button onClick={() => onDelete(log._id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={14} /></button>
        </div>
      </div>

      {isPending && (
        <button 
          onClick={onSave}
          disabled={isUpdating}
          className="w-full py-3 mt-1 rounded-2xl bg-amber-500 text-black font-black uppercase text-xs tracking-widest shadow-md hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {isUpdating ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
          {lang === 'th' ? "บันทึกมื้ออาหารนี้" : "Save this Meal"}
        </button>
      )}

    </div>
  );
}

function MacroMini({ icon: Icon, val, color }: any) {
    return (
        <div className="flex items-center gap-1">
            <Icon size={10} className={`${color} opacity-60`} />
            <span className="text-[12px] font-black text-gray-400 dark:text-gray-500">{Math.round(val || 0)}g</span>
        </div>
    );
}