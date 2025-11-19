// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="space-y-3">
        <p className="inline-flex items-center gap-2 text-[11px] px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/40 text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          HealthyMate · AI Food Logging Prototype
        </p>

        <h1 className="text-2xl sm:text-3xl font-semibold leading-snug">
          บันทึกมื้ออาหารด้วย{" "}
          <span className="text-emerald-400">AI</span> แล้วให้ระบบช่วย
          คำนวณสารอาหาร &amp; TDEE ให้คุณ
        </h1>

        <p className="text-xs sm:text-sm text-gray-300 max-w-xl">
          ถ่ายรูปอาหารของคุณ แล้วให้ HealthyMate วิเคราะห์เมนู แคลอรี่
          และเก็บเป็นประวัติ เพื่อใช้สรุปเป็น Dashboard สุขภาพในอนาคต
        </p>

        <div className="flex flex-wrap gap-2 mt-2">
          <Link
            href="/analyze"
            className="px-4 py-2 rounded-full bg-emerald-500 text-black text-sm font-medium hover:bg-emerald-400"
          >
            เริ่มวิเคราะห์มื้ออาหาร
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded-full border border-white/15 text-xs text-gray-200 hover:bg-white/10"
          >
            สมัครสมาชิก HealthyMate
          </Link>
        </div>
      </section>

      {/* Quick actions */}
      <section className="grid sm:grid-cols-3 gap-3 text-xs sm:text-sm">
        <Link
          href="/analyze"
          className="rounded-2xl border border-white/10 bg-black/40 p-3 sm:p-4 hover:border-emerald-400/60 hover:bg-emerald-500/5 transition"
        >
          <div className="text-[11px] text-emerald-300 mb-1">STEP 1</div>
          <div className="font-semibold mb-1">ถ่ายรูปมื้ออาหาร</div>
          <p className="text-[11px] text-gray-300">
            อัปโหลดภาพอาหารจากกล้องหรือแกลเลอรีให้ AI วิเคราะห์เมนู
            และประเมินแคลอรี่
          </p>
        </Link>

        <Link
          href="/history"
          className="rounded-2xl border border-white/10 bg-black/40 p-3 sm:p-4 hover:border-sky-400/60 hover:bg-sky-500/5 transition"
        >
          <div className="text-[11px] text-sky-300 mb-1">STEP 2</div>
          <div className="font-semibold mb-1">ดูประวัติมื้ออาหาร</div>
          <p className="text-[11px] text-gray-300">
            ระบบบันทึกมื้ออาหารของคุณ
            เพื่อใช้ดูย้อนหลังและสรุปเป็นสถิติรายวัน/รายสัปดาห์
          </p>
        </Link>

        <Link
          href="/profile"
          className="rounded-2xl border border-white/10 bg-black/40 p-3 sm:p-4 hover:border-violet-400/60 hover:bg-violet-500/5 transition"
        >
          <div className="text-[11px] text-violet-300 mb-1">STEP 3</div>
          <div className="font-semibold mb-1">ตั้งค่าข้อมูลร่างกาย</div>
          <p className="text-[11px] text-gray-300">
            กรอกเพศ อายุ น้ำหนัก ส่วนสูง เพื่อให้ระบบคำนวณ BMI, BMR และ TDEE
            ได้แม่นยำขึ้น
          </p>
        </Link>
      </section>
    </div>
  );
}
