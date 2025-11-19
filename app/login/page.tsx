// app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "เข้าสู่ระบบไม่สำเร็จ");
      } else {
        setMsg("เข้าสู่ระบบสำเร็จ ✅");
        router.push("/analyze");
      }
    } catch (err) {
      console.error(err);
      setMsg("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-semibold">เข้าสู่ระบบ</h1>
        <p className="text-[11px] text-gray-400">
          ใช้อีเมลและรหัสผ่านที่คุณสมัครไว้ เพื่อเข้าถึงข้อมูล HealthyMate
        </p>
      </div>

      <div className="space-y-3 text-xs sm:text-sm">
        <div className="space-y-1">
          <label className="text-[11px] text-gray-400">อีเมล</label>
          <input
            className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] text-gray-400">รหัสผ่าน</label>
          <input
            className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {msg && <p className="text-[11px] text-emerald-300">{msg}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full mt-1 px-4 py-2.5 rounded-xl bg-emerald-500 text-black text-sm font-medium hover:bg-emerald-400 disabled:bg-gray-600"
        >
          {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>

        <p className="text-[11px] text-gray-400 text-center mt-2">
          ยังไม่มีบัญชี?{" "}
          <Link href="/register" className="text-emerald-300 underline">
            สมัครสมาชิกใหม่
          </Link>
        </p>
      </div>
    </div>
  );
}
