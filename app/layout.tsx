"use client";

import "./globals.css";
import { useState } from "react";
import { Inter } from "next/font/google";
import { Menu, X, Home, Camera, History, User, LogOut, Bell, LogIn, Activity, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SessionProvider, useSession, signOut } from "next-auth/react";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#050505] text-white antialiased`}>
        {/* ✅ หุ้ม SessionProvider ไว้ชั้นนอกสุดเพื่อให้ทุกหน้าใช้ useSession ได้ */}
        <SessionProvider>
          <LayoutContent>{children}</LayoutContent>
        </SessionProvider>
      </body>
    </html>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { status } = useSession(); 

  // ✅ ตรวจสอบหน้า Auth แบบเด็ดขาด
  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/register");

  const handleLogout = () => signOut({ callbackUrl: "/login" });

  const menuItems = [
    { icon: <Home size={20} />, label: "Dashboard", href: "/" },
    { icon: <Camera size={20} />, label: "Analyze", href: "/analyze" },
    { icon: <History size={20} />, label: "History", href: "/history" },
    { icon: <User size={20} />, label: "Profile", href: "/profile" },
  ];

  // 🟢 1. สำหรับหน้า LOGIN / REGISTER (แยกโครงสร้างชัดเจน)
  if (isAuthPage) {
    return (
      <main className="min-h-screen w-full flex flex-col items-center justify-center relative bg-[#050505] overflow-x-hidden">
        {/* แสงฟุ้งพื้นหลัง (Ambient Background) */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-emerald-500/10 blur-[120px] rounded-full opacity-60" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-emerald-500/5 blur-[120px] rounded-full opacity-40" />
        </div>
        
        {/* โลโก้ HM ใหญ่ตรงกลางหน้า Auth */}
        <div className="relative z-10 mb-8 text-center flex flex-col items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-1000">
           <div className="h-20 w-20 rounded-[2.5rem] bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/40 border border-white/10">
              <Sparkles className="text-black" size={38} />
           </div>
           <div className="space-y-1">
             <h1 className="font-black text-3xl uppercase tracking-[0.2em] italic">Healthy<span className="text-emerald-500">Mate</span></h1>
             <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">AI-Powered Nutrition Assistant</p>
           </div>
        </div>

        {/* ฟอร์ม Register / Login จากไฟล์ page.tsx จะมาโผล่ตรงนี้ */}
        <div className="relative z-20 w-full max-w-md px-6 animate-in fade-in zoom-in-95 duration-500">
          {children}
        </div>
      </main>
    );
  }

  // 🟢 2. สำหรับหน้าปกติ (DASHBOARD, ANALYZE, ETC.)
  return (
    <div className="flex flex-col min-h-screen bg-[#050505]">
      {/* DESKTOP NAVBAR */}
      <header className="sticky top-0 z-[60] bg-[#050505]/60 backdrop-blur-xl border-b border-white/5">
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-black font-black text-xs">HM</div>
            <div className="hidden sm:block font-black text-sm uppercase tracking-tighter">HealthyMate</div>
          </Link>

          {/* Desktop Menu Capsule */}
          <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/5">
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${pathname === item.href ? "bg-emerald-500 text-black shadow-lg" : "text-gray-400 hover:text-white"}`}>
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {status === "authenticated" ? (
              <button onClick={handleLogout} className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-500/20 text-red-400 hover:bg-red-400/10 transition-all"><LogOut size={14} /> Logout</button>
            ) : (
              <Link href="/login" className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 transition-all"><LogIn size={14} /> Login</Link>
            )}
            <button onClick={() => setIsOpen(true)} className="md:hidden p-2.5 bg-white/5 text-emerald-500 rounded-xl border border-white/10 active:scale-90"><Menu size={20} /></button>
          </div>
        </nav>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl mx-auto w-full pb-24 md:pb-10">
        {children}
      </main>

      {/* 📱 MOBILE SIDEBAR */}
      <div className={`fixed inset-0 z-[100] md:hidden transition-all duration-500 ${isOpen ? "visible opacity-100" : "invisible opacity-0"}`}>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsOpen(false)} />
        <aside className={`absolute left-0 top-0 bottom-0 w-[280px] bg-[#0a0a0a] border-r border-white/10 p-6 flex flex-col transition-transform duration-500 ease-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex justify-between items-center mb-10"><div className="font-black text-emerald-500 tracking-tighter text-xl italic uppercase">HealthyMate</div><button onClick={() => setIsOpen(false)} className="p-2 bg-white/5 rounded-xl text-gray-400"><X size={20}/></button></div>
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${pathname === item.href ? "bg-emerald-500 text-black shadow-lg" : "text-gray-400 hover:bg-white/5"}`}>{item.icon}<span className="font-bold text-sm uppercase tracking-widest">{item.label}</span></Link>
            ))}
          </nav>
          {status === "authenticated" ? (
             <button onClick={handleLogout} className="mt-auto flex items-center gap-4 p-4 rounded-2xl text-red-400 border border-red-400/10 active:scale-95"><LogOut size={20} /><span className="font-bold text-sm uppercase tracking-widest">Logout</span></button>
          ) : (
             <Link href="/login" onClick={() => setIsOpen(false)} className="mt-auto flex items-center gap-4 p-4 rounded-2xl text-emerald-500 border border-emerald-500/10 active:scale-95 text-center justify-center flex gap-2"><LogIn size={20} /><span className="font-bold text-sm uppercase tracking-widest">Login</span></Link>
          )}
        </aside>
      </div>

      {/* 📱 BOTTOM NAV มือถือ (โชว์เฉพาะเมื่อ Login แล้ว) */}
      {status === "authenticated" && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-[70] md:hidden block">
          <nav className="bg-black/70 backdrop-blur-2xl border border-white/10 px-8 py-4 rounded-[2.5rem] flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <Link href="/"><button className={`transition-all ${pathname === "/" ? "text-emerald-500 scale-110 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "text-gray-500"}`}><Activity size={24} /></button></Link>
            <Link href="/analyze"><div className="bg-emerald-500 p-3.5 rounded-2xl text-black -translate-y-3 border-4 border-[#050505] shadow-lg shadow-emerald-500/30 active:scale-90"><Camera size={26} strokeWidth={2.5} /></div></Link>
            <Link href="/profile"><button className={`transition-all ${pathname === "/profile" ? "text-emerald-500 scale-110" : "text-gray-500"}`}><User size={24} /></button></Link>
          </nav>
        </div>
      )}
    </div>
  );
}