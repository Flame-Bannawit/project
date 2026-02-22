"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, RefreshCw, AlertCircle, Mail, Weight, Ruler, Target, Search, UserCheck, Activity, Filter, Trash2 } from "lucide-react";
import Link from "next/link";

export default function ManageUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/all-members");
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // ✅ ระบบกรองชื่อหรืออีเมล
  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && users.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] gap-4">
      <RefreshCw className="animate-spin text-blue-500" size={40} />
      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Loading Member Database...</p>
    </div>
  );

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto min-h-screen bg-[#0a0a0a] pb-24 selection:bg-blue-500/30">
      
      {/* 🟢 Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-5">
          <Link href="/admin" className="h-12 w-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-90">
            <ChevronLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">User Management</h1>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
               <UserCheck size={12} className="text-blue-500" /> Total {users.length} Registered Members
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                    type="text" 
                    placeholder="Search name or email..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50 w-full md:w-[300px] transition-all"
                />
            </div>
            <button onClick={fetchUsers} className="p-3.5 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all active:rotate-180 duration-500">
                <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
        </div>
      </header>

      {/* 📊 Quick Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiniStat icon={<Activity size={14}/>} label="Avg. Weight" val={`${(users.reduce((acc, u) => acc + (u.weightKg || 0), 0) / (users.length || 1)).toFixed(1)} kg`} color="text-blue-400" />
          <MiniStat icon={<Target size={14}/>} label="Avg. Goal" val={`${Math.round(users.reduce((acc, u) => acc + (u.dailyCalorieGoal || 0), 0) / (users.length || 1))} kcal`} color="text-emerald-400" />
          <div className="hidden md:flex bg-white/[0.02] border border-white/10 rounded-2xl p-4 flex-col justify-center items-center">
             <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Database Status</span>
             <span className="text-xs font-black text-emerald-500 uppercase">Synchronized</span>
          </div>
          <div className="hidden md:flex bg-white/[0.02] border border-white/10 rounded-2xl p-4 flex-col justify-center items-center">
             <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Last Update</span>
             <span className="text-xs font-black text-white uppercase italic">Just Now</span>
          </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-[2rem] text-red-400 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <AlertCircle size={20} /> <span className="text-xs font-bold uppercase tracking-widest">{error}</span>
        </div>
      )}

      {/* 🟢 User Cards Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((u) => (
            <div key={u._id} className="group bg-white/[0.02] border border-white/10 p-6 rounded-[2.5rem] flex flex-col lg:flex-row justify-between items-center gap-6 hover:bg-white/[0.04] hover:border-white/20 transition-all relative overflow-hidden">
              
              <div className="flex items-center gap-5 w-full lg:w-auto">
                <div className="relative">
                    <div className="h-16 w-16 rounded-[1.5rem] bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-500/20 uppercase italic">
                    {u.name?.charAt(0)}
                    </div>
                    {u.email === 'useradmin@test.com' && (
                        <div className="absolute -top-2 -right-2 bg-amber-500 p-1.5 rounded-lg text-black shadow-lg">
                            <Filter size={10} fill="currentColor" />
                        </div>
                    )}
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-white font-black text-xl italic tracking-tight uppercase leading-none">{u.name}</h3>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded ${u.email === 'useradmin@test.com' ? 'bg-amber-500 text-black' : 'bg-white/10 text-gray-500'} uppercase tracking-widest`}>
                      {u.email === 'useradmin@test.com' ? 'Administrator' : 'Premium Member'}
                    </span>
                  </div>
                  <div className="text-gray-600 text-[11px] font-bold flex items-center gap-2">
                    <Mail size={12} className="text-blue-500/50" /> {u.email}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-4 bg-black/40 p-5 rounded-[2rem] border border-white/5 w-full lg:w-auto">
                <StatItem icon={<Weight size={14}/>} label="Weight" value={u.weightKg} unit="kg" />
                <div className="hidden sm:block w-[1px] h-10 bg-white/10 self-center" />
                <StatItem icon={<Ruler size={14}/>} label="Height" value={u.heightCm} unit="cm" />
                <div className="hidden sm:block w-[1px] h-10 bg-white/10 self-center" />
                <StatItem icon={<Target size={14}/>} label="Target Goal" value={u.dailyCalorieGoal} unit="kcal" color="text-emerald-400" />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                 <button className="p-4 bg-white/5 rounded-2xl text-gray-500 hover:text-white hover:bg-white/10 transition-all active:scale-90">
                    <Activity size={18} />
                 </button>
                 <button className="p-4 bg-red-500/5 rounded-2xl text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90">
                    <Trash2 size={18} />
                 </button>
              </div>

              {/* Decorative Glow */}
              <div className="absolute -right-20 -bottom-20 w-40 h-40 bg-blue-500/5 blur-[80px] rounded-full group-hover:bg-blue-500/10 transition-all" />
            </div>
          ))
        ) : (
          <div className="text-center py-32 text-gray-700 border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center gap-4">
            <Search size={40} className="opacity-20" />
            <p className="font-black uppercase tracking-[0.4em] text-xs">No matching results found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ icon, label, val, color }: any) {
    return (
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
                {icon}
                <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
            </div>
            <span className={`text-sm font-black ${color} italic`}>{val}</span>
        </div>
    )
}

function StatItem({ icon, label, value, unit, color = "text-white" }: any) {
  return (
    <div className="text-center min-w-[70px] space-y-1">
      <div className="text-gray-600 text-[9px] uppercase font-black flex items-center justify-center gap-1.5">
        {icon} {label}
      </div>
      <div className={`${color} font-black text-base tabular-nums italic tracking-tighter`}>
        {value || 0} <span className="text-[9px] font-bold opacity-30 uppercase ml-0.5">{unit}</span>
      </div>
    </div>
  );
}