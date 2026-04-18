"use client";

import "@/app/globals.css";
import { useState, useEffect } from "react";
import { Inter } from "next/font/google";
import { Menu, X, Home, Camera, History, User, LogOut, LogIn, Activity, Languages, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeProvider, useTheme } from "next-themes";
import SupportButton from "./components/SupportButton"; 

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>HealthyMate</title>
        <meta name="description" content="AI-Powered Nutrition & Calorie Tracker" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.className} antialiased transition-colors duration-300`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <LayoutContent>{children}</LayoutContent>
        </ThemeProvider>
      </body>
    </html>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState<'en' | 'th'>('th');
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 🆕 เพิ่ม State เช็คการ Login
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 🆕 ฟังก์ชันตรวจสอบสถานะจาก Server (ใช้ API ที่เราสร้างไว้)
  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: 'no-store' });
      const data = await res.json();
      setIsLoggedIn(!!data.isLoggedIn);
    } catch (err) {
      setIsLoggedIn(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem("preferred-lang") as 'en' | 'th';
    if (savedLang) setLang(savedLang);

    checkAuth(); // เช็คทันทีที่โหลด
  }, [pathname]); // 🔄 เช็คทุกครั้งที่เปลี่ยนหน้าเพื่อให้ปุ่มอัปเดต

  if (!mounted) {
    return <div className="min-h-screen bg-white dark:bg-[#050505]" />;
  }

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'th' : 'en';
    setLang(newLang);
    localStorage.setItem("preferred-lang", newLang);
    window.location.reload();
  };

  const handleLogout = async () => {
    const confirmMsg = lang === 'th' ? "คุณต้องการออกจากระบบใช่หรือไม่?" : "Are you sure you want to logout?";
    if (!confirm(confirmMsg)) return;
    
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        setIsLoggedIn(false);
        window.location.href = "/login";
      } else {
        throw new Error("Logout failed");
      }
    } catch (err) {
      console.error("Logout Error:", err);
      window.location.href = "/login";
    }
  };

  const menuItems = [
    { icon: <Home size={20} />, label: lang === 'th' ? "หน้าแรก" : "Dashboard", href: "/" },
    { icon: <Camera size={20} />, label: lang === 'th' ? "วิเคราะห์" : "Analyze", href: "/analyze" },
    { icon: <History size={20} />, label: lang === 'th' ? "ประวัติ" : "History", href: "/history" },
    { icon: <User size={20} />, label: lang === 'th' ? "โปรไฟล์" : "Profile", href: "/profile" },
  ];

  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/register");
  const bodyBaseClass = "bg-white dark:bg-[#050505] text-slate-900 dark:text-white transition-colors duration-300";

  if (isAuthPage) {
    return (
      <main className={`min-h-screen w-full flex flex-col items-center justify-center relative overflow-x-hidden ${bodyBaseClass}`}>
        {children}
      </main>
    );
  }

  return (
    <div className={`flex flex-col min-h-screen ${bodyBaseClass}`}>
      <header className="sticky top-0 z-[60] backdrop-blur-xl border-b border-slate-200 dark:border-white/5 bg-white/70 dark:bg-[#050505]/60">
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-black font-black text-xs">HM</div>
            <div className="hidden sm:block font-black text-sm uppercase italic tracking-tighter text-slate-900 dark:text-white">HealthyMate</div>
          </Link>

          <div className="hidden md:flex items-center gap-1 p-1 rounded-full border bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5">
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href} className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${pathname === item.href ? "bg-emerald-500 text-black shadow-lg" : "text-gray-400 hover:text-emerald-500"}`}>
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-yellow-400 transition-all active:scale-90"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button 
              onClick={toggleLang}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-emerald-600 dark:text-emerald-500 text-xs font-black uppercase tracking-tighter transition-all"
            >
              <Languages size={14} />
              {lang === 'en' ? "TH" : "EN"}
            </button>

            {/* ✅ แสดงปุ่ม Logout ถ้า Login แล้ว หรือปุ่ม Login ถ้ายังไม่ได้ Login */}
            {isLoggedIn ? (
              <button 
                onClick={handleLogout} 
                className="hidden md:flex p-2.5 rounded-xl text-red-500 hover:bg-red-500/10 transition-all"
                title={lang === 'th' ? "ออกจากระบบ" : "Logout"}
              >
                <LogOut size={18} />
              </button>
            ) : (
              <Link 
                href="/login" 
                className="hidden md:flex p-2.5 rounded-xl text-emerald-500 hover:bg-emerald-500/10 transition-all"
                title={lang === 'th' ? "เข้าสู่ระบบ" : "Login"}
              >
                <LogIn size={18} />
              </Link>
            )}

            <button onClick={() => setIsOpen(true)} className="md:hidden p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/10 active:scale-90"><Menu size={20} /></button>
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full pb-24 md:pb-10">
        {children}
      </main>

      {/* Sidebar Mobile */}
      <div className={`fixed inset-0 z-[100] md:hidden transition-all duration-500 ${isOpen ? "visible opacity-100" : "invisible opacity-0"}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsOpen(false)} />
        <aside className={`absolute left-0 top-0 bottom-0 w-[280px] border-r border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] p-6 flex flex-col transition-transform duration-500 ease-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex justify-between items-center mb-10">
            <div className="font-black text-emerald-500 tracking-tighter text-xl italic uppercase">HealthyMate</div>
            <button onClick={() => setIsOpen(false)} className="p-2 bg-slate-100 dark:bg-white/5 rounded-xl text-gray-400"><X size={20}/></button>
          </div>
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${pathname === item.href ? "bg-emerald-500 text-black shadow-lg" : "text-gray-400 hover:bg-emerald-500/5"}`}>{item.icon}<span className="font-bold text-sm uppercase tracking-widest">{item.label}</span></Link>
            ))}
          </nav>
          <div className="mt-auto space-y-2">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-yellow-400">
               {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
               <span className="font-bold text-sm uppercase tracking-widest">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            
            {/* ✅ สลับปุ่มใน Mobile Sidebar ด้วย */}
            {isLoggedIn ? (
              <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 rounded-2xl text-red-400 border border-red-400/10 active:scale-95 text-left">
                <LogOut size={20} />
                <span className="font-bold text-sm uppercase tracking-widest">Logout</span>
              </button>
            ) : (
              <Link href="/login" onClick={() => setIsOpen(false)} className="w-full flex items-center gap-4 p-4 rounded-2xl text-emerald-500 border border-emerald-500/10 active:scale-95 text-left">
                <LogIn size={20} />
                <span className="font-bold text-sm uppercase tracking-widest">Login</span>
              </Link>
            )}
          </div>
        </aside>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-[70] md:hidden block">
        <nav className="backdrop-blur-2xl border px-8 py-4 rounded-[2.5rem] flex items-center justify-between shadow-2xl bg-white/80 dark:bg-black/70 border-slate-200 dark:border-white/10 transition-all">
          <Link href="/"><button className={`transition-all ${pathname === "/" ? "text-emerald-500 scale-110" : "text-gray-500"}`}><Activity size={24} /></button></Link>
          <Link href="/analyze"><div className="bg-emerald-500 p-3.5 rounded-2xl text-black -translate-y-3 border-4 border-white dark:border-[#050505] shadow-lg shadow-emerald-500/30 active:scale-90"><Camera size={26} strokeWidth={2.5} /></div></Link>
          <Link href="/profile"><button className={`transition-all ${pathname === "/profile" ? "text-emerald-500 scale-110" : "text-gray-500"}`}><User size={24} /></button></Link>
        </nav>
      </div>

      <SupportButton />
    </div>
  );
}