"use client";

import { useEffect, useState } from "react";
import { 
  Users, Utensils, Activity, RefreshCw, 
  UserCog, Globe, Zap, Search, Flame, MessageSquareQuote,
  ArrowUpRight, Clock, PieChart as PieIcon
} from "lucide-react";
import Link from "next/link";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, PieChart as RePieChart, Pie, Cell, LineChart, Line, LabelList
} from "recharts";
import { getDictionary } from "@/lib/get-dictionary";

export default function AdminPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Home");
  const [range, setRange] = useState("7d");
  const [isClient, setIsClient] = useState(false);
  const [dict, setDict] = useState<any>(null);
  const [lang, setLang] = useState<'en' | 'th'>('th');

  const fetchStats = async (selectedRange: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stats?range=${selectedRange}`);
      if (!res.ok) throw new Error("Fetch failed");
      const result = await res.json();
      setData(result);
    } catch (err) { 
      console.error("Fetch Stats Error:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    setIsClient(true);
    const savedLang = (localStorage.getItem("preferred-lang") as 'en' | 'th') || 'th';
    setLang(savedLang);
    getDictionary(savedLang).then(setDict);
  }, []);

  useEffect(() => {
    if (isClient) fetchStats(range);
  }, [range, isClient]);

  const getChartData = () => {
    const usage = data?.charts?.usage?.map((d: any) => ({
      name: d.name,
      value: Number(d.value ?? 0)
    })) || [];

    const userGrowthData = data?.charts?.userGrowth || [];
    let runningTotal = (data?.summary?.totalUsers || 0) - userGrowthData.reduce((acc: number, curr: any) => acc + (curr.count || 0), 0);
    if (runningTotal < 0) runningTotal = 0;

    const userGrowth = userGrowthData.map((d: any) => {
      runningTotal += Number(d.count ?? 0);
      return { name: d.name, users: runningTotal };
    }) || [];

    const time = data?.charts?.hourly || [];
    
    // ✅ แก้ไข: กรองเอาเฉพาะช่วงวัยที่มีคนจริงๆ (value > 0) เพื่อไม่ให้ Label ซ้อนทับกัน
    const age = (data?.charts?.age || []).filter((item: any) => item.value > 0);

    return { usage, userGrowth, time, age };
  };

  const cData = getChartData();
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, value }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30; 
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text 
        x={x} 
        y={y} 
        fill="currentColor" 
        className="fill-slate-500 dark:fill-slate-400 text-[13px] font-black uppercase italic" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
      >
        {`${name}: ${value}`}
      </text>
    );
  };

  if (!isClient || !dict) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050505] transition-colors duration-500 pb-20 selection:bg-emerald-500/30">
      <div className="p-6 space-y-10 max-w-7xl mx-auto">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 dark:border-white/5 pb-8">
          <div className="space-y-2">
            <h1 className="text-5xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white leading-none">
              Admin<span className="text-emerald-500">Panel</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-[0.4em] flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" /> 
              {lang === 'th' ? "สถานะระบบ: ปกติ" : "System Status: Operational"}
            </p>
          </div>
          <button onClick={() => fetchStats(range)} className="p-5 bg-emerald-500 text-black rounded-3xl hover:bg-emerald-400 transition-all shadow-2xl shadow-emerald-500/20 active:scale-95">
            <RefreshCw size={24} className={loading ? "animate-spin" : ""} />
          </button>
        </header>

        <section className="space-y-8">
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {[
              { id: "Home", icon: <Activity size={18}/> },
              { id: "All Users", icon: <Users size={18}/> },
              { id: "Time", icon: <Clock size={18}/> },
              { id: "Age", icon: <PieIcon size={18}/> }
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-10 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all border flex items-center gap-3 shrink-0 ${
                  activeTab === tab.id ? "bg-emerald-500 text-black border-emerald-500 shadow-2xl shadow-emerald-500/40 translate-y-[-2px]" : "bg-white dark:bg-white/5 text-slate-400 dark:text-gray-500 border-slate-200 dark:border-white/10 hover:border-emerald-500"
                }`}
              >
                {tab.icon} {tab.id}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 lg:col-span-2 rounded-[3.5rem] p-10 min-h-[580px] relative overflow-hidden shadow-2xl">
                <div className="flex justify-between items-center mb-16 relative z-10">
                  <h3 className="font-black text-xl uppercase tracking-widest text-emerald-500 italic flex items-center gap-3">
                    <Zap size={24} fill="currentColor" /> {activeTab} Analytics
                  </h3>
                  { (activeTab === "Home" || activeTab === "All Users") && (
                    <div className="flex bg-slate-100 dark:bg-black/40 p-1.5 rounded-2xl border border-slate-200 dark:border-white/5">
                        {["7d", "1m", "3m"].map((r) => (
                          <button key={r} onClick={() => setRange(r)} className={`px-5 py-2 rounded-xl text-xs font-black uppercase transition-all ${range === r ? "bg-emerald-500 text-black shadow-lg" : "text-gray-500 hover:text-emerald-500"}`}>{r}</button>
                        ))}
                    </div>
                  )}
                </div>
                
                <div className="h-[400px] w-full relative z-10 px-4">
                  <ResponsiveContainer width="100%" height="100%">
                    {activeTab === "Home" ? (
                      <AreaChart data={cData.usage}>
                        <defs><linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#88888815" vertical={false} />
                        <XAxis dataKey="name" stroke="#888" fontSize={12} fontWeight={900} tickLine={false} axisLine={false} dy={15} />
                        <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{backgroundColor: '#000', border: 'none', borderRadius: '20px', fontSize: '12px', color: '#fff', padding: '15px'}} />
                        <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorVal)" strokeWidth={5} />
                      </AreaChart>
                    ) : activeTab === "All Users" ? (
                      <LineChart data={cData.userGrowth}>
                         <CartesianGrid strokeDasharray="3 3" stroke="#88888815" vertical={false} />
                         <XAxis dataKey="name" stroke="#888" fontSize={12} axisLine={false} dy={15} tickLine={false} fontWeight={900} />
                         <YAxis stroke="#888" fontSize={12} axisLine={false} tickLine={false} />
                         <Tooltip contentStyle={{backgroundColor: '#000', border: 'none', borderRadius: '20px', fontSize: '12px', color: '#fff', padding: '15px'}} />
                         <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={5} dot={false} activeDot={{ r: 8 }} />
                      </LineChart>
                    ) : activeTab === "Time" ? (
                      <BarChart data={cData.time} margin={{ top: 30, bottom: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#88888815" vertical={false} />
                          {/* ✅ ขยับ dy มากขึ้น และเพิ่ม margin bottom เพื่อไม่ให้เลขเวลาขาด */}
                          <XAxis dataKey="hour" stroke="#888" fontSize={12} axisLine={false} dy={20} tickLine={false} fontWeight={900} />
                          <YAxis hide />
                          <Tooltip cursor={{fill: '#88888810'}} contentStyle={{backgroundColor: '#000', border: 'none', borderRadius: '20px', color: '#fff'}} />
                          <Bar dataKey="count" fill="#f59e0b" radius={[15, 15, 0, 0]} barSize={40}>
                             <LabelList dataKey="count" position="top" fill="#f59e0b" fontSize={14} fontWeight={900} offset={15} />
                          </Bar>
                      </BarChart>
                    ) : (
                      <RePieChart>
                        <Pie 
                            data={cData.age} 
                            innerRadius={75} 
                            outerRadius={115} 
                            paddingAngle={10} 
                            dataKey="value" 
                            stroke="none"
                            label={renderCustomLabel}
                            labelLine={{ stroke: '#888', strokeWidth: 1, offset: 5 }}
                        >
                          {cData.age.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{borderRadius: '20px', border: 'none', fontWeight: 900}} />
                      </RePieChart>
                    )}
                  </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 h-full">
                <StatCard title={lang === 'th' ? "ผู้ใช้ทั้งหมด" : "Total Users"} value={data?.summary?.totalUsers ?? 0} icon={<Users size={32}/>} color="text-blue-500" />
                <StatCard title={lang === 'th' ? "สแกนวันนี้" : "Today's Scans"} value={data?.summary?.totalLogsToday ?? 0} icon={<Flame size={32}/>} color="text-orange-500" />
                <StatCard title={lang === 'th' ? "วิเคราะห์รวม" : "AI Analysis"} value={data?.summary?.totalLogs ?? 0} icon={<Utensils size={32}/>} color="text-emerald-500" />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-10">
          <MenuButton title={lang === 'th' ? "หน้าหลักเว็บ" : "Web Interface"} desc={lang === 'th' ? "กลับไปยังหน้าฝั่งผู้ใช้" : "View Client Side"} icon={<Globe size={36}/>} href="/" color="bg-blue-500" />
          <MenuButton title={lang === 'th' ? "จัดการผู้ใช้" : "User Audit"} desc={lang === 'th' ? "ตรวจสอบข้อมูลสมาชิก" : "Manage Database"} icon={<UserCog size={36}/>} href="/admin/users" color="bg-emerald-500" />
          <MenuButton title={lang === 'th' ? "สถานะ AI" : "AI Statistics"} desc={lang === 'th' ? "ตรวจสอบประสิทธิภาพระบบ" : "System Performance"} icon={<Zap size={36}/>} href="/admin/ai" color="bg-yellow-500" />
          <MenuButton title={lang === 'th' ? "ประวัติการทาน" : "Logs Archive"} desc={lang === 'th' ? "คลังข้อมูลอาหารทั่วโลก" : "Global Food Data"} icon={<Search size={36}/>} href="/admin/foods" color="bg-orange-500" />
          <MenuButton title={lang === 'th' ? "เมนูยอดฮิต" : "Trend Tracker"} desc={lang === 'th' ? "รายการอาหารยอดนิยม" : "Popular Dishes"} icon={<Flame size={36}/>} href="/admin/trending" color="bg-rose-500" />
          <MenuButton title={lang === 'th' ? "ศูนย์ช่วยเหลือ" : "Help Center"} desc={lang === 'th' ? "จัดการบัตรคำร้อง" : "Admin Support"} icon={<MessageSquareQuote size={36}/>} href="/admin/support" color="bg-indigo-500" />
        </section>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 p-10 rounded-[3rem] flex items-center gap-8 group hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all shadow-2xl">
      <div className={`p-6 rounded-3xl bg-slate-50 dark:bg-white/5 ${color} group-hover:scale-110 transition-transform shadow-inner`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-1 truncate">{title}</p>
        <p className="text-4xl font-black text-slate-900 dark:text-white italic tracking-tighter">{value}</p>
      </div>
    </div>
  );
}

function MenuButton({ title, desc, icon, href, color }: any) {
  return (
    <Link href={href} className="group relative bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 p-12 rounded-[4.5rem] overflow-hidden transition-all active:scale-[0.98] shadow-md hover:shadow-2xl flex flex-col items-center text-center">
      <div className={`absolute top-0 right-0 h-48 w-48 ${color} opacity-[0.05] rounded-full translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700`} />
      <div className="relative z-10 space-y-6">
        <div className={`h-24 w-24 mx-auto rounded-[2.5rem] ${color} flex items-center justify-center text-black shadow-2xl group-hover:rotate-12 transition-all duration-500`}>{icon}</div>
        <div className="space-y-3">
          <h4 className="text-3xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">{title}</h4>
          <p className="text-base text-gray-500 font-bold uppercase tracking-widest leading-relaxed opacity-60 px-4">{desc}</p>
        </div>
        <div className="pt-4 opacity-0 group-hover:opacity-100 transition-all translate-y-6 group-hover:translate-y-0">
          <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg">
            <ArrowUpRight size={24} />
          </div>
        </div>
      </div>
    </Link>
  );
}