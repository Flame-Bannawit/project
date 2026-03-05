"use client";

import { useState } from "react";
import { MessageSquareText, Send, X, Loader2, LifeBuoy } from "lucide-react";

export default function SupportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // 💡 เอาเงื่อนไขการเช็ค Session ออกเพื่อให้ปุ่มแสดงผลตลอดเวลาตามต้องการ
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        body: JSON.stringify({ message }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        setSent(true);
        setMessage("");
        setTimeout(() => {
          setSent(false);
          setIsOpen(false);
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 🟢 Floating Button - แสดงตลอดเวลา */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-28 right-6 md:bottom-10 md:right-10 z-[80] h-14 w-14 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-emerald-500 shadow-2xl hover:scale-110 active:scale-95 transition-all group"
      >
        <LifeBuoy size={28} className="group-hover:rotate-12 transition-transform" />
        <div className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full animate-pulse border-2 border-[#050505]" />
      </button>

      {/* 🟢 Support Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          <div className="relative w-full max-w-sm bg-[#0f0f0f] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <button onClick={() => setIsOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X size={20}/></button>
            
            <div className="mb-6">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4">
                <MessageSquareText size={24} />
              </div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Support <span className="text-emerald-500">& Feedback</span></h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">แจ้งปัญหาหรือข้อเสนอแนะให้เราทราบ</p>
            </div>

            {sent ? (
              <div className="py-10 text-center space-y-3">
                <div className="h-12 w-12 bg-emerald-500 rounded-full mx-auto flex items-center justify-center text-black">
                  <Send size={20} />
                </div>
                <p className="text-sm font-bold text-emerald-500">ส่งข้อความเรียบร้อยแล้ว!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="พิมพ์ข้อความที่นี่..."
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors resize-none text-white"
                />
                <button
                  disabled={loading}
                  className="w-full bg-emerald-500 text-black font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}