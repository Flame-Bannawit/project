// app/history/page.tsx
"use client";

import { useEffect, useState } from "react";

type MealLog = {
  _id: string;
  createdAt?: string;
  mainName?: string;
  foodName?: string;
  imageUrl?: string;
  totalCalories?: number;
};

export default function HistoryPage() {
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/meal-logs");
        const data = await res.json();
        // สมมติ API ส่งเป็น { logs: [...] } หรือเป็น array ตรง ๆ
        const arr = Array.isArray(data) ? data : data.logs || [];
        setLogs(arr);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatDateTime = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString("th-TH", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">ประวัติมื้ออาหาร</h1>
        <p className="text-[11px] text-gray-400">
          รายการมื้ออาหารที่คุณเคยวิเคราะห์ด้วย AI และบันทึกไว้
        </p>
      </div>

      {loading ? (
        <div className="text-xs text-gray-400">กำลังโหลดข้อมูล...</div>
      ) : logs.length === 0 ? (
        <div className="text-xs text-gray-400">
          ยังไม่มีมื้ออาหารที่บันทึก ลองไปที่หน้า{" "}
          <span className="text-emerald-300">Analyze</span> เพื่อเริ่มต้น
        </div>
      ) : (
        <div className="space-y-3 max-h-[480px] overflow-auto pr-1">
          {logs.map((log) => (
            <div
              key={log._id}
              className="flex gap-3 rounded-2xl border border-white/10 bg-black/40 p-3"
            >
              {log.imageUrl && (
                <img
                  src={log.imageUrl}
                  alt={log.mainName || log.foodName || "meal"}
                  className="h-16 w-16 rounded-xl object-cover border border-white/10 flex-shrink-0"
                />
              )}

              <div className="flex-1 space-y-1">
                <div className="flex justify-between gap-2">
                  <div className="font-medium text-sm">
                    {log.mainName || log.foodName || "ไม่รู้จักเมนู"}
                  </div>
                  {log.totalCalories && (
                    <div className="text-[11px] text-emerald-300">
                      ~{Math.round(log.totalCalories)} kcal
                    </div>
                  )}
                </div>
                <div className="text-[11px] text-gray-400">
                  บันทึกเมื่อ: {formatDateTime(log.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
