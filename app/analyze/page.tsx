"use client";

import { useEffect, useRef, useState } from "react";

type AnalyzeApiResponse = {
  logId: string;
  topResults: { name: string; prob: number }[];
  thaiDish: {
    id: string;
    thaiName: string;
    baseCalories: number;
    protein: number;
    fat: number;
    carbs: number;
    matchedName: string;
    matchedKeyword: string;
    confidence: number;
  } | null;
  imageId?: number;
  foodType?: any;
  occasion?: string;
};

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // save
  const [portion, setPortion] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // กล้อง
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ---------- File upload จากเครื่อง ----------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // ---------- Camera controls ----------
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const openCamera = async () => {
    setCameraError(null);
    setResult(null);
    setMsg(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      streamRef.current = stream;
      setIsCameraOpen(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("OPEN CAMERA ERROR:", err);
      setCameraError(
        "ไม่สามารถเปิดกล้องได้ กรุณาเช็คสิทธิ์การใช้งานกล้อง หรือเปิดจากเบราว์เซอร์/แอปอื่น"
      );
    }
  };

  const closeCamera = () => {
    stopCamera();
    setIsCameraOpen(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // ---------- Capture & crop จากกล้อง ----------
  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    if (!videoWidth || !videoHeight) {
      console.warn("VIDEO SIZE UNKNOWN");
      return;
    }

    // ครอปเป็นสี่เหลี่ยมจัตุรัสตรงกลาง
    const size = Math.min(videoWidth, videoHeight);
    const sx = (videoWidth - size) / 2;
    const sy = (videoHeight - size) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92)
    );
    if (!blob) return;

    const capturedFile = new File([blob], `meal-${Date.now()}.jpg`, {
      type: "image/jpeg",
    });

    setFile(capturedFile);
    setPreview(URL.createObjectURL(capturedFile));
    closeCamera();
  };

  // ---------- Analyze ด้วย API ของเรา ----------
  const handleAnalyze = async () => {
    if (!file) {
      setMsg("กรุณาเลือกรูปหรือถ่ายรูปก่อน");
      return;
    }

    setLoading(true);
    setMsg(null);
    setResult(null);

    try {
      // 1) Upload ไป Cloudinary
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

      // 2) ใช้ API analyze-food
      const aiRes = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      const aiData = await aiRes.json();
      if (!aiRes.ok) {
        throw new Error(aiData.error || "วิเคราะห์รูปไม่สำเร็จ");
      }

      setResult(aiData);
      setMsg("วิเคราะห์สำเร็จแล้ว 🎉");
    } catch (err: any) {
      console.error(err);
      setMsg(err.message || "เกิดข้อผิดพลาดในการวิเคราะห์");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmMeal = async () => {
    if (!result?.logId || !portion) {
      setSaveMsg("ไม่พบข้อมูลมื้ออาหารหรือปริมาณ");
      return;
    }

    setSaving(true);
    setSaveMsg(null);

    try {
      const res = await fetch("/api/meal-logs/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logId: result.logId,
          portion,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "บันทึกมื้ออาหารไม่สำเร็จ");
      }

      setSaveMsg(
        `บันทึกมื้อ "${data.thaiName}" ปริมาณ ${data.portion} จาน เรียบร้อยแล้ว (${data.calories} kcal)`
      );
    } catch (err: any) {
      console.error(err);
      setSaveMsg(err.message || "เกิดข้อผิดพลาดระหว่างบันทึกมื้ออาหาร");
    } finally {
      setSaving(false);
    }
  };


  const handleRetake = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    openCamera();
  };

  const thai = result?.thaiDish ?? null;
  const topResults = result?.topResults ?? [];

  const top1 = thai
    ? thai.thaiName
    : topResults[0]
    ? topResults[0].name
    : "ยังไม่มีผลการวิเคราะห์";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">วิเคราะห์มื้ออาหาร</h1>
          <p className="text-[11px] text-gray-400">
            ถ่ายจากมุมด้านบนหรือใช้รูปอาหาร เพื่อให้ AI ช่วยเดาเมนูไทยและโภชนาการเบื้องต้น
          </p>
        </div>

        <div className="hidden sm:flex gap-2">
          <button
            onClick={openCamera}
            className="px-3 py-1.5 rounded-full bg-emerald-500 text-xs font-semibold text-black hover:bg-emerald-400"
          >
            📸 เปิดกล้อง
          </button>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-4">
        {/* ซ้าย: upload/camera + preview */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-dashed border-white/20 bg-black/40 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="text-sm font-medium">
                  รูปภาพมื้ออาหารของคุณ
                </div>
                <p className="text-[11px] text-gray-400">
                  เลือกรูปจากเครื่อง หรือกด{" "}
                  <span className="text-emerald-300 font-medium">
                    เปิดกล้อง
                  </span>{" "}
                  เพื่อถ่ายรูปใหม่
                </p>
              </div>

              <div className="flex sm:hidden">
                <button
                  onClick={openCamera}
                  className="px-3 py-1.5 rounded-full bg-emerald-500 text-[11px] font-semibold text-black hover:bg-emerald-400"
                >
                  📸 กล้อง
                </button>
              </div>
            </div>

            {/* ปุ่มเลือกไฟล์ */}
            <label className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-white text-black text-xs font-medium cursor-pointer hover:bg-gray-200 w-fit">
              เลือกรูปภาพจากเครื่อง
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            {/* Preview */}
            <div className="w-full mt-2">
              <div className="text-[11px] text-gray-400 mb-1">
                ตัวอย่างรูปที่เลือก
              </div>
              <div className="aspect-square w-full rounded-2xl border border-white/10 bg-black/60 flex items-center justify-center overflow-hidden">
                {preview ? (
                  <img
                    src={preview}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[11px] text-gray-500 px-4 text-center">
                    ยังไม่มีรูป กรุณาเลือกรูป หรือกดปุ่มเปิดกล้องเพื่อถ่ายรูปมื้ออาหารของคุณ
                  </span>
                )}
              </div>
            </div>

            {/* ปุ่มวิเคราะห์ + ถ่ายใหม่ */}
            <div className="flex gap-2">
              <button
                onClick={handleAnalyze}
                disabled={!file || loading}
                className={`flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 ${
                  !file
                    ? "bg-gray-700/60 text-gray-400 cursor-not-allowed"
                    : "bg-emerald-500 text-black hover:bg-emerald-400"
                }`}
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    กำลังวิเคราะห์...
                  </>
                ) : (
                  "วิเคราะห์รูป & ดูโภชนาการ"
                )}
              </button>

              {preview && (
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-[11px] sm:text-xs text-gray-200 hover:bg-white/10"
                >
                  ↺ ถ่ายใหม่
                </button>
              )}
            </div>

            {msg && (
              <div className="text-[11px] text-gray-200 bg-black/60 border border-white/10 rounded-xl px-3 py-2">
                {msg}
              </div>
            )}
          </div>
        </div>

        {/* ขวา: สรุปผล AI + โภชนาการ */}
        <div className="space-y-3 text-xs">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-3 sm:p-4 h-full flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[11px] text-gray-400">
                  ผลการวิเคราะห์ล่าสุด
                </div>
                <div className="font-semibold text-sm">{top1}</div>
              </div>
            </div>

            {/* ถ้าแมปเมนูไทยได้ */}
            {thai ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/40 p-3 space-y-1">
                  <div className="text-[11px] text-emerald-300 font-medium uppercase">
                    เมนูไทยจาก AI
                  </div>
                  <div className="text-sm font-semibold">
                    {thai.thaiName}
                  </div>
                  <div className="text-[11px] text-gray-300 mt-1">
                    พลังงานมาตรฐานต่อ 1 จาน:
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">
                      {thai.baseCalories} kcal
                    </span>{" "}
                    · โปรตีน{" "}
                    <span className="font-semibold">{thai.protein} g</span> · ไขมัน{" "}
                    <span className="font-semibold">{thai.fat} g</span> · คาร์บ{" "}
                    <span className="font-semibold">{thai.carbs} g</span>
                  </div>

                  <div className="mt-1 text-[11px] text-gray-400">
                    AI เดาว่ารูปนี้ใกล้เคียง{" "}
                    <span className="font-mono">“{thai.matchedName}”</span> และเชื่อมกับเมนูไทยนี้ด้วย
                    keyword <span className="font-mono">“{thai.matchedKeyword}”</span>{" "}
                    (ความมั่นใจ ~ {(thai.confidence * 100).toFixed(1)}%)
                  </div>
                </div>

                {/* เลือกปริมาณ */}
                <div>
                  <div className="text-[11px] text-gray-300 mb-1">
                    ปริมาณที่คุณกินประมาณ:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[0.5, 1, 1.5, 2].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPortion(p)}
                        className={`px-3 py-1.5 rounded-full text-[11px] border ${
                          portion === p
                            ? "bg-emerald-500 text-black border-emerald-400"
                            : "bg-white/5 text-gray-200 border-white/20 hover:bg-white/10"
                        }`}
                      >
                        {p} จาน
                      </button>
                    ))}
                  </div>
                  <div className="mt-1 text-[11px] text-gray-400">
                    รวมประมาณ:{" "}
                    <span className="font-semibold">
                      {(thai.baseCalories * portion).toFixed(0)} kcal
                    </span>
                  </div>
                </div>

                {/* ปุ่มบันทึกมื้อนี้ */}
                <button
                  onClick={handleConfirmMeal}
                  disabled={saving}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl bg-white text-black text-xs sm:text-sm font-semibold hover:bg-gray-100 flex items-center justify-center gap-2"
                >
                  {saving ? "กำลังบันทึก..." : "บันทึกมื้อนี้ลงประวัติ"}
                </button>

                {saveMsg && (
                  <div className="text-[11px] text-gray-200 bg-black/60 border border-white/10 rounded-xl px-3 py-2 mt-1">
                    {saveMsg}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-gray-400">
                ระบบยังไม่สามารถจับคู่เมนูไทยจากรูปนี้ได้
                แต่คุณยังสามารถดูผลจาก LogMeal (ชื่อเมนูภาษาอังกฤษ) ด้านล่างได้
              </p>
            )}


            {/* Top 3 จาก LogMeal */}
            {topResults.length > 0 && (
              <div className="space-y-1">
                <div className="text-[11px] text-gray-400">
                  เมนูที่ LogMeal คิดว่าเป็นไปได้ (Top 3):
                </div>
                <div className="space-y-1">
                  {topResults.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between text-[11px] bg-white/5 border border-white/5 rounded-lg px-2 py-1.5"
                    >
                      <span className="truncate max-w-[60%]">
                        {item.name}
                      </span>
                      <span className="text-emerald-300">
                        {(item.prob * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* JSON สำหรับ Dev */}
            {result && (
              <details className="mt-2 text-[11px] text-gray-400">
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

      {/* ---------- กล้องเต็มจอ (WebRTC Overlay) ---------- */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 text-gray-200">
            <span className="text-sm font-semibold">ถ่ายภาพมื้ออาหาร</span>
            <button
              onClick={closeCamera}
              className="text-xs px-3 py-1 rounded-full bg-white/10 hover:bg-white/20"
            >
              ปิด
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              playsInline
              muted
            />
          </div>

          {cameraError && (
            <div className="px-4 pb-2 text-center text-[11px] text-red-400">
              {cameraError}
            </div>
          )}

          <div className="pb-6 pt-3 flex items-center justify-center gap-4">
            <button
              onClick={capturePhoto}
              className="h-16 w-16 rounded-full bg-white flex items-center justify-center shadow-lg shadow-white/30"
            >
              <div className="h-12 w-12 rounded-full border-4 border-black/70" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
