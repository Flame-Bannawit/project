"use client";

import { useEffect, useState } from "react";
import { 
  Users, Utensils, Activity, RefreshCw, 
  UserCog, Globe, Zap, Search, Flame, MessageSquareQuote,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, PieChart as RePieChart, Pie, Cell, LineChart, Line
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

  // 🎯 ปรับปรุง Logic การดึงข้อมูลกราฟให้พล็อต "จุดรายวัน" ให้ติดแน่นอน
  const getChartData = () => {
    // 🏠 1. กราฟ Home (ยอดสแกน)
    const usage = data?.charts?.usage?.map((d: any) => ({
      name: d.name || d._id || "N/A",
      value: Number(d.value ?? d.count ?? 0)
    })) || [];

    // 👥 2. กราฟ All Users (พล็อตรายวัน)
    // แก้ไข Key ให้ดักฟังทั้ง 'users' และ 'count' เพื่อให้เส้นกราฟปรากฏ
    const userGrowth = data?.charts?.userGrowth?.map((d: any) => ({
      name: d.name || d._id || "N/A",
      users: Number(d.users ?? d.count ?? d.value ?? 0) 
    })) || [];

    // 🕒 3. Time และ 🎂 4. Age (Mock สำรองถ้า API ว่าง)
    const time = (data?.charts?.time?.length > 0) ? data.charts.time : [
      { name: '06:00', v: 4 }, { name: '12:00', v: 15 }, { name: '18:00', v: 10 }, { name: '22:00', v: 2 }
    ];
    const age = (data?.charts?.age?.length > 0) ? data.charts.age : [
      { name: '18-24', value: 45 }, { name: '25-34', value: 30 }, { name: '35+', value: 25 }
    ];

    return { usage, userGrowth, time, age };
  };

  const cData = getChartData();
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  if (!isClient || !dict) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050505] transition-colors duration-500 pb-20">
      <div className="p-6 space-y-10 max-w-7xl mx-auto selection:bg-emerald-500/30">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white leading-none transition-colors">
              Admin<span className="text-emerald-500">Panel</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> 
              {lang === 'th' ? "สถานะระบบ: ปกติ" : "System Status: Operational"}
            </p>
          </div>
          <button onClick={() => fetchStats(range)} className="p-4 bg-emerald-500 text-black rounded-2xl hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 active:scale-95">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </header>

        <section className="space-y-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {["Home", "All Users", "Time", "Age"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 ${
                  activeTab === tab ? "bg-emerald-500 text-black border-emerald-500 shadow-xl shadow-emerald-500/20" : "bg-white dark:bg-white/5 text-slate-400 dark:text-gray-500 border-slate-200 dark:border-white/10 hover:border-emerald-500 shadow-sm"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 lg:col-span-2 rounded-[3rem] p-10 min-h-[480px] relative overflow-hidden shadow-2xl transition-all">
                <div className="flex justify-between items-center mb-12 relative z-10">
                  <h3 className="font-black text-sm uppercase tracking-widest text-emerald-500 italic flex items-center gap-2">
                    <Activity size={18} /> {activeTab} Visualization
                  </h3>
                  <div className="flex bg-slate-100 dark:bg-black/40 p-1 rounded-xl border border-slate-200 dark:border-white/5">
                    {["7d", "1m", "3m"].map((r) => (
                      <button key={r} onClick={() => setRange(r)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${range === r ? "bg-emerald-500 text-black" : "text-gray-500 hover:text-emerald-500"}`}>{r}</button>
                    ))}
                  </div>
                </div>
                
                <div className="h-[320px] w-full relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    {activeTab === "Home" ? (
                      <AreaChart data={cData.usage}>
                        <defs><linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#88888820" vertical={false} />
                        <XAxis dataKey="name" stroke="#888" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                        <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{backgroundColor: '#000', border: 'none', borderRadius: '16px', fontSize: '10px', color: '#fff'}} />
                        <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorVal)" strokeWidth={4} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
                      </AreaChart>
                    ) : activeTab === "All Users" ? (
                      <LineChart data={cData.userGrowth}>
                         <CartesianGrid strokeDasharray="3 3" stroke="#88888820" vertical={false} />
                         <XAxis dataKey="name" stroke="#888" fontSize={10} axisLine={false} dy={10} tickLine={false} />
                         <YAxis stroke="#888" fontSize={10} axisLine={false} tickLine={false} />
                         <Tooltip contentStyle={{backgroundColor: '#000', border: 'none', borderRadius: '16px', fontSize: '10px', color: '#fff'}} />
                         {/* 🎯 คืนค่าจุด Dot รายวัน และเส้นแบบ monotone */}
                         <Line 
                          type="monotone"
                          dataKey="users"
                          stroke="#3b82f6"
                          strokeWidth={4}
                          dot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} 
                          activeDot={{ r: 8, strokeWidth: 0 }} 
                         />
                      </LineChart>
                    ) : activeTab === "Time" ? (
                      <BarChart data={cData.time}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#88888820" vertical={false} />
                          <XAxis dataKey="name" stroke="#888" fontSize={10} axisLine={false} tickLine={false} />
                          <YAxis stroke="#888" fontSize={10} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{backgroundColor: '#000', border: 'none', borderRadius: '16px', fontSize: '10px', color: '#fff'}} />
                          <Bar dataKey="v" fill="#f59e0b" radius={[12, 12, 0, 0]} />
                      </BarChart>
                    ) : (
                      <RePieChart>
                        <Pie data={cData.age} innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value" stroke="none">
                          {cData.age.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{borderRadius: '16px', border: 'none'}} />
                      </RePieChart>
                    )}
                  </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5">
                <StatCard title={lang === 'th' ? "ผู้ใช้ทั้งหมด" : "Total Users"} value={data?.summary?.totalUsers ?? 0} icon={<Users size={24}/>} color="text-blue-500" />
                <StatCard title={lang === 'th' ? "สแกนวันนี้" : "Today's Scans"} value={data?.summary?.totalLogsToday ?? 0} icon={<Flame size={24}/>} color="text-orange-500" />
                <StatCard title={lang === 'th' ? "วิเคราะห์รวม" : "AI Analysis"} value={data?.summary?.totalLogs ?? 0} icon={<Utensils size={24}/>} color="text-emerald-500" />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <MenuButton title={lang === 'th' ? "หน้าหลักเว็บ" : "Web Interface"} desc={lang === 'th' ? "กลับไปยังหน้าฝั่งผู้ใช้" : "View Client Side"} icon={<Globe size={28}/>} href="/" color="bg-blue-500" />
          <MenuButton title={lang === 'th' ? "จัดการผู้ใช้" : "User Audit"} desc={lang === 'th' ? "ตรวจสอบข้อมูลสมาชิก" : "Manage Database"} icon={<UserCog size={28}/>} href="/admin/users" color="bg-emerald-500" />
          <MenuButton title={lang === 'th' ? "สถานะ AI" : "AI Statistics"} desc={lang === 'th' ? "ตรวจสอบประสิทธิภาพระบบ" : "System Performance"} icon={<Zap size={28}/>} href="/admin/ai" color="bg-yellow-500" />
          <MenuButton title={lang === 'th' ? "ประวัติการทาน" : "Logs Archive"} desc={lang === 'th' ? "คลังข้อมูลอาหารทั่วโลก" : "Global Food Data"} icon={<Search size={28}/>} href="/admin/foods" color="bg-orange-500" />
          <MenuButton title={lang === 'th' ? "เมนูยอดฮิต" : "Trend Tracker"} desc={lang === 'th' ? "รายการอาหารยอดนิยม" : "Popular Dishes"} icon={<Flame size={28}/>} href="/admin/trending" color="bg-rose-500" />
          <MenuButton title={lang === 'th' ? "ศูนย์ช่วยเหลือ" : "Help Center"} desc={lang === 'th' ? "จัดการบัตรคำร้อง" : "Admin Support"} icon={<MessageSquareQuote size={28}/>} href="/admin/support" color="bg-indigo-500" />
        </section>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 p-8 rounded-[2.5rem] flex items-center gap-6 group hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all shadow-xl">
      <div className={`p-4 rounded-2xl bg-slate-50 dark:bg-white/5 ${color} group-hover:scale-110 transition-transform shadow-sm`}>{icon}</div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
        <p className="text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter">{value}</p>
      </div>
    </div>
  );
}

function MenuButton({ title, desc, icon, href, color }: any) {
  return (
    <Link href={href} className="group relative bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 p-10 rounded-[3.5rem] overflow-hidden transition-all active:scale-[0.98] shadow-sm hover:shadow-xl">
      <div className={`absolute top-0 right-0 h-40 w-40 ${color} opacity-[0.03] rounded-full translate-x-12 -translate-y-12 group-hover:scale-150 transition-transform duration-700`} />
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className={`h-20 w-20 rounded-[2rem] ${color} flex items-center justify-center text-black shadow-2xl mb-8 group-hover:rotate-6 transition-all`}>{icon}</div>
        <h4 className="text-2xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter mb-2">{title}</h4>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed opacity-60">{desc}</p>
        <div className="mt-8 p-3 rounded-full bg-white/5 border border-white/10 text-slate-900 dark:text-white opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0"><ArrowUpRight size={20} /></div>
      </div>
    </Link>
  );
}