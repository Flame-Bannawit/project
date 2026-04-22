"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Users, Search, ChevronLeft, MoreVertical, 
  Trash2, UserCog, Utensils, Info, X, 
  ShieldAlert, Lock, Save, ArrowRight, Loader2, Clock, KeyRound, RefreshCw, Calendar
} from "lucide-react";
import Link from "next/link";
import { getDictionary } from "@/lib/get-dictionary";

// ฟังก์ชันคำนวณอายุ
const calculateAge = (birthdateStr: string) => {
  if (!birthdateStr) return null;
  const birthDate = new Date(birthdateStr);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// ฟังก์ชันจัดกลุ่มวัย
const getAgeGroup = (age: number | null, lang: string) => {
  if (age === null) return lang === 'th' ? "ไม่ระบุ" : "Not specified";
  if (age >= 10 && age <= 15) return lang === 'th' ? "วัยเด็ก (10-15)" : "Child (10-15)";
  if (age >= 16 && age <= 24) return lang === 'th' ? "วัยรุ่น (16-24)" : "Teen (16-24)";
  if (age >= 25 && age <= 60) return lang === 'th' ? "วัยทำงาน (25-60)" : "Adult (25-60)";
  if (age > 60) return lang === 'th' ? "ผู้สูงอายุ (60+)" : "Senior (60+)";
  return lang === 'th' ? "อื่นๆ" : "Other";
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  
  // 🌐 ระบบภาษาและธีม
  const [dict, setDict] = useState<any>(null);
  const [lang, setLang] = useState<'en' | 'th'>('th');

  // Modal States
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [pinModal, setPinModal] = useState(false);
  const [pin, setPin] = useState("");
  const [isPinVerified, setIsPinVerified] = useState(false);

  const [userMeals, setUserMeals] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // ขยาย State ให้ครอบคลุมข้อมูลทั้งหมด
  const [editMetrics, setEditMetrics] = useState({ 
    name: "",
    email: "",
    heightCm: 0, 
    weightKg: 0,
    birthdate: "",
    goal: ""
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/all-members");
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { 
    const savedLang = (localStorage.getItem("preferred-lang") as 'en' | 'th') || 'th';
    setLang(savedLang);
    getDictionary(savedLang).then(setDict);
    fetchUsers(); 
  }, [fetchUsers]);

// ดึงประวัติอาหารและ Set ค่าเริ่มต้นเมื่อเลือก User
  useEffect(() => {
    if (selectedUser) {
      // 🛠️ แก้ไขส่วนการแปลงวันที่ให้รองรับ Input Date
      let formattedDate = "";
      if (selectedUser.birthDate) {
        try {
          const dateObj = new Date(selectedUser.birthDate);
          // เช็คว่า Date Valid หรือไม่
          if (!isNaN(dateObj.getTime())) {
            // ดึงเฉพาะ YYYY-MM-DD
            formattedDate = dateObj.toISOString().split('T')[0];
          }
        } catch(e) {
          console.error("Date conversion error:", e);
        }
      }

      setEditMetrics({ 
        name: selectedUser.name || "",
        email: selectedUser.email || "",
        heightCm: selectedUser.heightCm || 0, 
        weightKg: selectedUser.weightKg || 0,
        birthdate: formattedDate, // ตอนนี้จะเป็น YYYY-MM-DD แล้ว
        goal: selectedUser.goal || ""
      });
      
      const fetchUserMeals = async () => {
        try {
          const res = await fetch(`/api/admin/user-details?userId=${selectedUser._id}`);
          const data = await res.json();
          setUserMeals(Array.isArray(data) ? data : []);
        } catch (err) { console.error(err); }
      };
      fetchUserMeals();
    }
  }, [selectedUser]);

  const handleUpdateMetrics = async () => {
    if (!selectedUser) return;
    setIsUpdating(true);
    try {
      const res = await fetch("/api/admin/user-details", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser._id,
          name: editMetrics.name,
          email: editMetrics.email,
          heightCm: Number(editMetrics.heightCm),
          weightKg: Number(editMetrics.weightKg),
          birthDate: editMetrics.birthdate,
          goal: editMetrics.goal
        }),
      });
      if (res.ok) {
        alert(lang === 'th' ? "อัปเดตข้อมูลสำเร็จ! ✅" : "Data updated successfully! ✅");
        // อัปเดต selectedUser เพื่อให้ UI สะท้อนค่าใหม่ทันที
        setSelectedUser({
          ...selectedUser,
          name: editMetrics.name,
          email: editMetrics.email,
          heightCm: editMetrics.heightCm,
          weightKg: editMetrics.weightKg,
          birthDate: editMetrics.birthdate,
          goal: editMetrics.goal
        });
        fetchUsers();
      } else {
        alert("Update failed.");
      }
    } catch (err) { console.error(err); }
    setIsUpdating(false);
  };

  const handleDeleteUser = async (userId: string) => {
    const msg = lang === 'th' ? "ยืนยันการลบผู้ใช้? การกระทำนี้ไม่สามารถย้อนกลับได้" : "Are you sure you want to delete this user? This action cannot be undone.";
    if (!confirm(msg)) return;
    
    try {
      const res = await fetch(`/api/admin/all-members?id=${userId}`, { method: "DELETE" });
      if (res.ok) {
        alert(lang === 'th' ? "ลบผู้ใช้สำเร็จ" : "User deleted successfully");
        setSelectedUser(null);
        fetchUsers();
      }
    } catch (err) { alert("Error deleting user"); }
  };

  const handleResetPassword = async (userId: string) => {
    const promptMsg = lang === 'th' ? "กรุณาใส่รหัสผ่านใหม่ (อย่างน้อย 6 ตัว):" : "Please enter new password (min 6 chars):";
    const newPass = prompt(promptMsg);
    if (!newPass) return;
    if (newPass.length < 6) {
      alert(lang === 'th' ? "รหัสผ่านสั้นเกินไป" : "Password too short");
      return;
    }

    try {
      const res = await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newPassword: newPass }),
      });
      if (res.ok) alert(lang === 'th' ? "เปลี่ยนรหัสผ่านสำเร็จ! 🔐" : "Password reset successful! 🔐");
    } catch (e) { alert("Error connecting to server"); }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const verifyPin = () => {
    if (pin === "1234") { 
      setIsPinVerified(true);
      setPinModal(false);
      setPin("");
    } else {
      alert("PIN Error!");
      setPin("");
    }
  };

  if (!dict) return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
       <RefreshCw className="animate-spin text-emerald-500" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050505] transition-colors duration-500 pb-20">
      <div className="p-6 space-y-8 max-w-7xl mx-auto selection:bg-emerald-500/30">
        
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in duration-700">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Link href="/admin" className="p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-400 dark:text-gray-400 hover:text-emerald-500 transition-all shadow-sm">
              <ChevronLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white transition-colors">
                {lang === 'th' ? "จัดการผู้ใช้งาน" : "User Management"}
              </h1>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{lang === 'th' ? "ตรวจสอบ และควบคุมการเข้าถึง" : "Audit, Reset & Control User Access"}</p>
            </div>
          </div>
          <div className="relative group w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder={lang === 'th' ? "ค้นหาชื่อ หรืออีเมล..." : "Search users..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-6 py-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all shadow-sm"
            />
          </div>
        </header>

        <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-xl dark:shadow-2xl transition-all overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="text-[12px] text-gray-500 font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
                <th className="px-8 py-5">{lang === 'th' ? "โปรไฟล์" : "User Profile"}</th>
                <th className="px-8 py-5">{lang === 'th' ? "กิจกรรม" : "Activity"}</th>
                <th className="px-8 py-5">{lang === 'th' ? "สถานะ" : "Status"}</th>
                <th className="px-8 py-5 text-right">{lang === 'th' ? "จัดการ" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading ? (
                <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-emerald-500" size={32} /></td></tr>
              ) : filteredUsers.map((user) => {
                // เช็ค Role Admin และอีเมลผู้ดูแลระบบ
                const isAdmin = user.role === 'admin' || user.email === 'useradmin@test.com';

                return (
                  <tr key={user._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-500 font-black text-xs border border-emerald-500/20 uppercase shadow-sm">{user.name?.[0]}</div>
                        <div>
                          <div className="text-sm font-black italic text-slate-800 dark:text-white">{user.name}</div>
                          <div className="text-xs text-gray-500 font-bold">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-black text-slate-600 dark:text-gray-300 italic">{user.totalMealLogs || 0} {lang === 'th' ? "มื้อที่บันทึก" : "Meals Tracked"}</td>
                    <td className="px-8 py-5">
                        <span className={`text-[12px] font-black px-2 py-0.5 rounded-md uppercase border ${isAdmin ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                        {isAdmin ? 'Admin' : (user.role || 'Active')}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button onClick={() => setSelectedUser(user)} className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-emerald-600 dark:text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all active:scale-90 shadow-sm"><UserCog size={18} /></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Modal User Detail */}
        {selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/90 backdrop-blur-xl" onClick={() => {setSelectedUser(null); setIsPinVerified(false);}} />
            
            <div className="relative w-full max-w-5xl bg-white dark:bg-[#0d0d0d] border border-slate-200 dark:border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 max-h-[90vh]">
              {/* Left Column - User Info Editing */}
              <div className="md:w-5/12 bg-slate-50/50 dark:bg-black/40 p-8 border-r border-slate-100 dark:border-white/10 overflow-y-auto custom-scrollbar">
                <div className="text-center space-y-2 mb-6">
                  <div className="h-20 w-20 rounded-3xl bg-emerald-500 mx-auto flex items-center justify-center text-black text-3xl font-black uppercase shadow-lg shadow-emerald-500/20">{selectedUser.name?.[0]}</div>
                  <h2 className="text-xl font-black italic uppercase text-slate-900 dark:text-white">{selectedUser.name}</h2>
                  
                  {/* แสดงอายุและวัย */}
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="px-3 py-1 bg-slate-200 dark:bg-white/10 rounded-lg text-xs font-black uppercase text-slate-700 dark:text-gray-300">
                      {lang === 'th' ? `อายุ ${calculateAge(editMetrics.birthdate) !== null ? calculateAge(editMetrics.birthdate) : '-'} ปี` : `Age ${calculateAge(editMetrics.birthdate) !== null ? calculateAge(editMetrics.birthdate) : '-'}`}
                    </span>
                    <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs font-black uppercase text-emerald-600 dark:text-emerald-500">
                      {getAgeGroup(calculateAge(editMetrics.birthdate), lang)}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* ฟิลด์ชื่อ */}
                  <div className="space-y-1">
                    <label className="text-[12px] font-black text-gray-500 uppercase ml-4">{lang === 'th' ? "ชื่อผู้ใช้" : "Name"}</label>
                    <input type="text" value={editMetrics.name} onChange={(e) => setEditMetrics({...editMetrics, name: e.target.value})} className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-black text-slate-900 dark:text-white outline-none focus:border-emerald-500" />
                  </div>
                  
                  {/* ฟิลด์อีเมล */}
                  <div className="space-y-1">
                    <label className="text-[12px] font-black text-gray-500 uppercase ml-4">{lang === 'th' ? "อีเมล" : "Email"}</label>
                    <input type="email" value={editMetrics.email} onChange={(e) => setEditMetrics({...editMetrics, email: e.target.value})} className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500" />
                  </div>

                  {/* ฟิลด์วันเกิด */}
                  <div className="space-y-1">
                    <label className="text-[12px] font-black text-gray-500 uppercase ml-4 flex items-center gap-1"><Calendar size={12}/> {lang === 'th' ? "วัน/เดือน/ปีเกิด" : "Birthdate"}</label>
                    <input type="date" value={editMetrics.birthdate} onChange={(e) => setEditMetrics({...editMetrics, birthdate: e.target.value})} className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-black text-slate-900 dark:text-white outline-none focus:border-emerald-500 [color-scheme:light] dark:[color-scheme:dark]" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[12px] font-black text-gray-500 uppercase ml-4">{lang === 'th' ? "ส่วนสูง (ซม.)" : "Height (cm)"}</label>
                      <input type="number" value={editMetrics.heightCm} onChange={(e) => setEditMetrics({...editMetrics, heightCm: Number(e.target.value)})} className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-black text-slate-900 dark:text-white outline-none focus:border-emerald-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[12px] font-black text-gray-500 uppercase ml-4">{lang === 'th' ? "น้ำหนัก (กก.)" : "Weight (kg)"}</label>
                      <input type="number" value={editMetrics.weightKg} onChange={(e) => setEditMetrics({...editMetrics, weightKg: Number(e.target.value)})} className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-black text-slate-900 dark:text-white outline-none focus:border-emerald-500" />
                    </div>
                  </div>

                  {/* ฟิลด์เป้าหมาย */}
                  <div className="space-y-1">
                    <label className="text-[12px] font-black text-gray-500 uppercase ml-4">{lang === 'th' ? "เป้าหมาย" : "Goal"}</label>
                    <input type="text" placeholder={lang === 'th' ? "เช่น ลดน้ำหนัก, เพิ่มกล้ามเนื้อ" : "e.g., Lose weight"} value={editMetrics.goal} onChange={(e) => setEditMetrics({...editMetrics, goal: e.target.value})} className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-black text-slate-900 dark:text-white outline-none focus:border-emerald-500" />
                  </div>
                  
                  <div className="pt-4 space-y-3">
                    <button onClick={handleUpdateMetrics} disabled={isUpdating} className="w-full py-3 bg-emerald-500 text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                      {isUpdating ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} {lang === 'th' ? "บันทึกข้อมูลทั้งหมด" : "Save All Changes"}
                    </button>

                    <button onClick={() => handleDeleteUser(selectedUser._id)} className="w-full py-3 bg-red-500/10 text-red-600 dark:text-red-500 border border-red-500/20 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2">
                      <Trash2 size={14} /> {lang === 'th' ? "ลบผู้ใช้งาน" : "Delete User"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column - Activities & Security */}
              <div className="md:w-7/12 p-8 flex flex-col bg-white dark:bg-[#0d0d0d]">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-black text-xs text-emerald-600 dark:text-emerald-500 uppercase tracking-widest italic">{lang === 'th' ? "ประวัติการทานทั้งหมด" : "Complete Meal History"}</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase">{lang === 'th' ? `รวม ${userMeals.length} รายการ` : `Total: ${userMeals.length} Records`}</p>
                  </div>
                  <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={24}/></button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar max-h-[500px]">
                  {userMeals.length > 0 ? userMeals.map((meal) => (
                    <div key={meal._id} className="group flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-4">
                        <img src={meal.imageUrl} className="h-12 w-12 rounded-xl object-cover bg-slate-200 border border-slate-200 dark:border-white/10 shadow-sm" alt="" />
                        <div>
                          <p className="text-[12px] font-black italic text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{meal.foodName}</p>
                          <p className="text-[12px] text-gray-500 font-bold uppercase">
                            {new Date(meal.createdAt).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB')} {new Date(meal.createdAt).toLocaleTimeString(lang === 'th' ? 'th-TH' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{Math.round(meal.totalCalories || 0)}</p>
                        <p className="text-xs text-gray-500 font-black uppercase">KCAL</p>
                      </div>
                    </div>
                  )) : (
                    <div className="py-20 text-center flex flex-col items-center gap-4 opacity-30">
                      <Utensils size={48} className="text-slate-400" />
                      <p className="text-xs font-bold uppercase tracking-widest">{lang === 'th' ? "ไม่พบประวัติการทาน" : "No history record found"}</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/10">
                  <div className="flex items-center justify-between p-4 bg-red-500/5 dark:bg-red-500/5 border border-red-500/10 rounded-3xl">
                    <div className="flex items-center gap-4">
                      <ShieldAlert className="text-red-500" size={20} />
                      <div className="flex-1">
                        <p className="text-xs font-black text-red-500 uppercase">{lang === 'th' ? "ข้อมูลบัญชีสำคัญ" : "Sensitive Data Account"}</p>
                        <p className="text-xs font-mono font-bold text-slate-600 dark:text-gray-300">{isPinVerified ? selectedUser.email : "Email Account Locked"}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {isPinVerified && (
                        <button onClick={() => handleResetPassword(selectedUser._id)} className="px-4 py-2 bg-amber-500 text-black font-black text-[12px] uppercase rounded-xl hover:bg-amber-400 shadow-lg shadow-amber-500/20 flex items-center gap-2">
                          <KeyRound size={12} /> Force Reset
                        </button>
                      )}
                      {!isPinVerified && (
                        <button onClick={() => setPinModal(true)} className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-black font-black text-[12px] uppercase rounded-xl shadow-md transition-all active:scale-95">
                          {lang === 'th' ? "ปลดล็อค" : "Unlock"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PIN Modal */}
        {pinModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-xs bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 rounded-[2rem] p-8 text-center space-y-6 shadow-2xl">
              <Lock className="mx-auto text-emerald-500" size={32} />
              <h4 className="font-black text-sm uppercase italic text-slate-900 dark:text-white">{lang === 'th' ? "ใส่รหัส PIN" : "Enter PIN"}</h4>
              <input type="password" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 text-center text-xl font-black tracking-[1em] outline-none text-slate-900 dark:text-white focus:border-emerald-500 transition-colors" autoFocus />
              <div className="flex gap-2">
                <button onClick={() => setPinModal(false)} className="flex-1 py-3 text-xs font-black uppercase text-gray-500 hover:text-slate-900 dark:hover:text-white transition-colors">{lang === 'th' ? "ยกเลิก" : "Cancel"}</button>
                <button onClick={verifyPin} className="flex-1 py-3 bg-emerald-500 text-black rounded-xl text-xs font-black uppercase shadow-lg shadow-emerald-500/20">{lang === 'th' ? "ยืนยัน" : "Verify"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}