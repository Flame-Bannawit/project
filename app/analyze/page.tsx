// app/analyze/page.tsx
"use client";

import { useState } from "react";

type AnalyzeResult = any; // ปรับทีหลังได้

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setResult(null);
    setMsg(null);
    if (f) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setMsg("กรุณาเลือกรูปอาหารก่อน");
      return;
    }
    setLoading(true);
    setMsg(null);
    setResult(null);

    try {
      // 1) upload ไป Cloudinary ผ่าน API ของเรา
      const formData = new FormData();
      formData.append("image", file);

      const uploadRes = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || "อัปโหลดรูปภาพไม่สำเร็จ");
      }

      const imageUrl = uploadData.url;

      // 2) ส่งให้ AI วิเคราะห์
      const aiRes = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });

      const aiData = await aiRes.json();
      if (!aiRes.ok) {
        throw new Error(aiData.error || "วิเคราะห์รูปภาพไม่สำเร็จ");
      }

      setResult(aiData);
      setMsg("วิเคราะห์สำเร็จแล้ว! 🎉");
    } catch (err: any) {
      console.error(err);
      setMsg(err.message || "เกิดข้อผิดพลาดในการวิเคราะห์");
    } finally {
      setLoading(false);
    }
  };

  const topPrediction =
    result?.mainDish || result?.raw?.recognition_results?.[0];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">วิเคราะห์มื้ออาหาร</h1>
          <p className="text-[11px] text-gray-400">
            ถ่ายรูปจากมุมบนเพื่อให้ AI แยกอาหารบนจานได้แม่นยำที่สุด
          </p>
        </div>
      </div>

      {/* Upload zone + preview */}
      <div className="grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-4">
        <div className="space-y-3">
          <div className="rounded-2xl border border-dashed border-white/20 bg-black/40 p-4 flex flex-col items-center justify-center gap-3">
            <div className="text-center space-y-1">
              <div className="text-sm font-medium">
                เลือกรูปมื้ออาหารของคุณ
              </div>
              <p className="text-[11px] text-gray-400">
                แนะนำให้ถ่ายจาก{" "}
                <span className="text-emerald-300">มุมมองด้านบน (Top View)</span>{" "}
                เพื่อให้เห็นทั้งจาน/ชามชัดเจน
              </p>
            </div>

            <label className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-white text-black text-xs font-medium cursor-pointer hover:bg-gray-200">
              เลือกรูปภาพ
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleChange}
              />
            </label>

            {preview && (
              <div className="w-full mt-2">
                <div className="text-[11px] text-gray-400 mb-1">
                  ตัวอย่างรูปที่เลือก
                </div>
                <img
                  src={preview}
                  alt="preview"
                  className="w-full rounded-xl border border-white/10 object-cover max-h-64"
                />
              </div>
            )}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !file}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-emerald-500 text-black disabled:bg-gray-600 disabled:text-gray-300 hover:bg-emerald-400"
          >
            {loading ? "กำลังวิเคราะห์..." : "วิเคราะห์มื้อนี้ด้วย AI"}
          </button>

          {msg && (
            <div className="text-[11px] text-gray-300 bg-black/40 border border-white/10 rounded-xl px-3 py-2">
              {msg}
            </div>
          )}
        </div>

        {/* AI result summary */}
        <div className="space-y-3 text-xs">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-3 sm:p-4 h-full flex flex-col">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div>
                <div className="text-[11px] text-gray-400">
                  ผลการวิเคราะห์ล่าสุด
                </div>
                <div className="font-semibold text-sm">
                  {topPrediction
                    ? topPrediction.name || "AI วิเคราะห์แล้ว"
                    : "ยังไม่มีผลการวิเคราะห์"}
                </div>
              </div>
            </div>

            {topPrediction ? (
              <div className="space-y-2 mt-2">
                <div className="text-[11px] text-gray-400">
                  Top prediction:
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="font-medium text-sm">
                      {topPrediction.name}
                    </div>
                    {typeof topPrediction.prob === "number" && (
                      <div className="text-[11px] text-emerald-300">
                        {(topPrediction.prob * 100).toFixed(1)}% เชื่อมั่น
                      </div>
                    )}
                  </div>
                </div>

                {/* Top 3 results (ถ้ามี) */}
                {result?.raw?.recognition_results && (
                  <div className="mt-2 space-y-1">
                    <div className="text-[11px] text-gray-400">
                      เมนูที่เป็นไปได้ (Top 3):
                    </div>
                    <div className="space-y-1">
                      {result.raw.recognition_results
                        .slice(0, 3)
                        .map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex justify-between text-[11px] bg-white/5 border border-white/5 rounded-lg px-2 py-1.5"
                          >
                            <span>{item.name}</span>
                            {typeof item.prob === "number" && (
                              <span className="text-emerald-300">
                                {(item.prob * 100).toFixed(1)}%
                              </span>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-gray-400 mt-2">
                หลังจากอัปโหลดรูปและกดวิเคราะห์ ระบบจะแสดงเมนูที่คาดว่าใกล้เคียงที่สุดที่นี่
              </p>
            )}

            {/* Debug JSON toggle (ถ้าอยากดูดิบ) */}
            {result && (
              <details className="mt-3 text-[11px] text-gray-400">
                <summary className="cursor-pointer">
                  ดูผลลัพธ์แบบ JSON (สำหรับ Dev)
                </summary>
                <pre className="mt-2 max-h-52 overflow-auto bg-black/70 border border-white/10 rounded-lg p-2 text-[10px] whitespace-pre-wrap">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
