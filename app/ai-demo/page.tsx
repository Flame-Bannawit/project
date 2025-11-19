"use client";

import React, { useEffect, useRef, useState } from "react";

export default function AiDemoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ---------- Helpers for camera ----------

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const openCamera = async () => {
    setCameraError(null);
    setResult(null);

    try {
      // ขอ permission กล้อง
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // พยายามใช้กล้องหลังบนมือถือ
        },
        audio: false,
      });

      streamRef.current = stream;
      setIsCameraOpen(true);

      // ให้ video โชว์ภาพจากกล้อง
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("OPEN CAMERA ERROR:", err);
      setCameraError(
        "ไม่สามารถเปิดกล้องได้ กรุณาเช็คสิทธิ์การใช้งานกล้อง หรือเปิดจากเบราว์เซอร์อื่น"
      );
    }
  };

  const closeCamera = () => {
    stopCamera();
    setIsCameraOpen(false);
  };

  // ปิดกล้องตอนออกจากหน้านี้
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // ---------- Capture & crop อัตโนมัติ ----------

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    if (!videoWidth || !videoHeight) {
      console.warn("VIDEO SIZE UNKNOWN");
      return;
    }

    // ครอปให้เป็นสี่เหลี่ยมจัตุรัสตรงกลางภาพ
    const size = Math.min(videoWidth, videoHeight);
    const sx = (videoWidth - size) / 2;
    const sy = (videoHeight - size) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);

    // แปลง canvas → blob → File
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92)
    );

    if (!blob) return;

    const capturedFile = new File([blob], `meal-${Date.now()}.jpg`, {
      type: "image/jpeg",
    });

    setFile(capturedFile);
    setPreview(URL.createObjectURL(capturedFile));

    // ปิดกล้องหลังถ่ายเสร็จ
    closeCamera();
  };

  // ---------- Upload & Analyze ----------

  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setResult(null);

    try {
      // 1) Upload ไป Cloudinary
      const formData = new FormData();
      formData.append("image", file);

      const uploadRes = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Upload failed");
      }

      const uploadData = await uploadRes.json();
      const imageUrl = uploadData.url;

      // 2) ส่งไป LogMeal
      const analyzeRes = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });

      if (!analyzeRes.ok) {
        throw new Error("Analyze failed");
      }

      const analyzeData = await analyzeRes.json();
      setResult(analyzeData);
    } catch (err) {
      console.error("ANALYZE ERROR:", err);
      setResult({
        error: "เกิดข้อผิดพลาดระหว่างการวิเคราะห์",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // กดถ่ายใหม่ → เคลียร์ preview & result แล้วเปิดกล้องอีกครั้ง
  const handleRetake = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    openCamera();
  };

  // เผื่อ desktop ยังอยากให้เลือกไฟล์จากเครื่องได้
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setResult(null);
    if (f) setPreview(URL.createObjectURL(f));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            AI Food Analyzer
          </h1>
          <p className="text-sm text-gray-400">
            ถ่ายรูปมื้ออาหารของคุณ แล้วให้ AI วิเคราะห์ชื่อเมนูและบันทึกลงประวัติ
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={openCamera}
            className="px-4 py-2 rounded-xl bg-emerald-500/90 hover:bg-emerald-400 text-sm font-semibold shadow-lg shadow-emerald-500/20"
          >
            📸 เปิดกล้องถ่าย
          </button>

          <label className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium cursor-pointer hover:bg-white/10">
            เลือกไฟล์
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInputChange}
            />
          </label>
        </div>
      </div>

      {/* Preview Section */}
      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            รูปภาพมื้ออาหาร
          </div>
          <div className="aspect-square w-full rounded-2xl bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center">
            {preview ? (
              <img
                src={preview}
                alt="preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-gray-500 text-xs text-center px-4">
                ยังไม่มีรูป กรุณาถ่ายด้วยกล้อง หรือเลือกไฟล์จากเครื่องของคุณ
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAnalyze}
              disabled={!file || isAnalyzing}
              className={`flex-1 inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold transition ${
                !file
                  ? "bg-gray-700/40 text-gray-400 cursor-not-allowed"
                  : "bg-emerald-500 hover:bg-emerald-400 text-white shadow shadow-emerald-500/30"
              }`}
            >
              {isAnalyzing ? (
                <>
                  <span className="mr-2 h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  กำลังวิเคราะห์...
                </>
              ) : (
                "วิเคราะห์รูป & บันทึกมื้ออาหาร"
              )}
            </button>

            {preview && (
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/15 text-xs sm:text-sm text-gray-200 hover:bg-white/10"
              >
                ↺ ถ่ายใหม่
              </button>
            )}
          </div>
        </div>

        {/* ผลลัพธ์ AI */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            ผลลัพธ์จาก AI
          </div>
          <div className="rounded-2xl bg-black/50 border border-white/10 p-3 sm:p-4 text-xs sm:text-sm max-h-[360px] overflow-auto">
            {result ? (
              <pre className="whitespace-pre-wrap break-words">
{JSON.stringify(result, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-500 text-xs">
                ผลลัพธ์การวิเคราะห์จะมาแสดงตรงนี้หลังจากคุณอัปโหลดรูป
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ---------- Fullscreen Camera Overlay (WebRTC) ---------- */}
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
            <div className="px-4 pb-2 text-center text-xs text-red-400">
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
