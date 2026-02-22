"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Upload, Sparkles, X, ChevronRight, Loader2, Info, Beef, Wheat, Droplets } from "lucide-react";

type AnalyzeApiResponse = {
  logId: string;
  thaiDish: {
    thaiName: string;
    baseCalories: number;
    protein: number;
    fat: number;
    carbs: number;
    healthNote: string;
  } | null;
  success?: boolean;
};

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [portion, setPortion] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const openCamera = async () => {
    setResult(null);
    setMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch (err) {
      alert("ไม่สามารถเปิดกล้องได้");
    }
  };

  const closeCamera = () => {
    stopCamera();
    setIsCameraOpen(false);
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;
    const size = Math.min(video.videoWidth, video.videoHeight);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.95));
    if (!blob) return;
    const capturedFile = new File([blob], `meal-${Date.now()}.jpg`, { type: "image/jpeg" });
    setFile(capturedFile);
    setPreview(URL.createObjectURL(capturedFile));
    closeCamera();
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setMsg(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const uploadRes = await fetch("/api/upload-image", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error);

      const aiRes = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: uploadData.url }),
      });
      const aiData = await aiRes.json();
      setResult(aiData);
    } catch (err: any) {
      setMsg(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmMeal = async () => {
    if (!result?.logId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/meal-logs/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId: result.logId, portion }),
      });
      if (res.ok) setSaveMsg("บันทึกมื้ออาหารเรียบร้อยแล้ว ✨");
    } catch (err: any) {
      setSaveMsg("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const thai = result?.thaiDish;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 px-4 pt-6">
      {/* 🟢 Header */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter">AI Analyzer</h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
            <Sparkles size={10} className="text-emerald-500" /> Powered by Gemini Vision
          </p>
        </div>
        <button onClick={openCamera} className="bg-emerald-500/10 text-emerald-500 p-3 rounded-2xl border border-emerald-500/20 active:scale-90 transition-all">
          <Camera size={24} />
        </button>
      </header>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* 🟢 Left: Image Section */}
        <section className="space-y-4">
          <div className="relative aspect-square w-full rounded-[2.5rem] bg-white/[0.02] border border-white/10 overflow-hidden group shadow-2xl">
            {preview ? (
              <>
                <img src={preview} className="w-full h-full object-cover" />
                {loading && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                       <Loader2 className="animate-spin text-emerald-500" size={40} />
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Scanning Food...</p>
                    </div>
                    {/* Scanning Line Animation */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-scan shadow-[0_0_15px_#10b981]" />
                  </div>
                )}
              </>
            ) : (
              <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all">
                <Upload size={40} className="text-gray-700 mb-4" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Upload Meal Photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            )}
            
            {preview && !loading && !result && (
              <button onClick={() => setPreview(null)} className="absolute top-4 right-4 p-2 bg-black/60 rounded-xl text-white backdrop-blur-md">
                <X size={18} />
              </button>
            )}
          </div>

          {!result && (
            <button
              onClick={handleAnalyze}
              disabled={!file || loading}
              className="w-full py-5 rounded-3xl bg-emerald-500 text-black font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-20 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={18} />}
              Analyze Nutrition
            </button>
          )}
        </section>

        {/* 🟢 Right: Result Section */}
        <section className="space-y-6">
          <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 min-h-[400px] flex flex-col shadow-2xl">
            <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <Info size={14} /> Analysis Result
            </h3>

            {thai ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">{thai.thaiName}</h2>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase">Confirmed Dish</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                    <Beef size={16} className="text-blue-400 mx-auto mb-2" />
                    <div className="text-lg font-black">{thai.protein}g</div>
                    <div className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Protein</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                    <Wheat size={16} className="text-yellow-400 mx-auto mb-2" />
                    <div className="text-lg font-black">{thai.carbs}g</div>
                    <div className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Carbs</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                    <Droplets size={16} className="text-rose-400 mx-auto mb-2" />
                    <div className="text-lg font-black">{thai.fat}g</div>
                    <div className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Fats</div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    <span>Adjust Portion</span>
                    <span className="text-white">{portion} Plate(s)</span>
                  </div>
                  <div className="flex gap-2">
                    {[0.5, 1, 1.5, 2].map((p) => (
                      <button key={p} onClick={() => setPortion(p)} className={`flex-1 py-3 rounded-2xl text-[10px] font-black transition-all ${portion === p ? "bg-white text-black" : "bg-white/5 text-gray-500 border border-white/5 hover:border-white/20"}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center bg-emerald-500/10 p-5 rounded-[1.5rem] border border-emerald-500/20">
                     <span className="text-xs font-black uppercase text-emerald-500 tracking-widest">Total Energy</span>
                     <span className="text-2xl font-black text-white tracking-tighter italic">{((thai.baseCalories || 0) * portion).toFixed(0)} kcal</span>
                  </div>
                </div>

                {thai.healthNote && (
                  <p className="text-[11px] text-gray-500 leading-relaxed italic border-l-2 border-emerald-500/30 pl-4 py-1">
                    "{thai.healthNote}"
                  </p>
                )}

                <button onClick={handleConfirmMeal} disabled={saving || !!saveMsg} className="w-full py-5 rounded-3xl bg-white text-black font-black uppercase tracking-widest text-xs shadow-2xl active:scale-[0.98] transition-all disabled:opacity-50">
                  {saving ? "SAVING..." : saveMsg ? "MEAL LOGGED" : "CONFIRM & LOG MEAL"}
                </button>
                {saveMsg && <div className="text-center text-[11px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">{saveMsg}</div>}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 opacity-30 group-hover:opacity-50 transition-opacity">
                <Sparkles size={48} className="text-gray-500" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] max-w-[200px]">Waiting for your meal photo to analyze nutrition</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 🟢 Fullscreen Camera Overlay */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col overflow-hidden">
          <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
             <div className="flex items-center gap-2 text-emerald-500">
                <Camera size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">Scanner Mode</span>
             </div>
             <button onClick={closeCamera} className="h-10 w-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-90 transition-all">
                <X size={20} />
             </button>
          </div>
          
          <div className="flex-1 flex items-center justify-center relative">
            <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
            {/* Guide Square */}
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-72 h-72 border-2 border-white/30 rounded-[3rem] shadow-[0_0_0_1000px_rgba(0,0,0,0.6)] relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-xl" />
               </div>
            </div>
            <p className="absolute bottom-32 text-center w-full text-[10px] font-black uppercase tracking-widest text-white/60">Center your meal in the square</p>
          </div>

          <div className="bg-black p-10 flex justify-center items-center">
            <button 
              onClick={capturePhoto} 
              className="h-20 w-20 rounded-full border-4 border-emerald-500/50 p-1 active:scale-90 transition-all"
            >
              <div className="h-full w-full rounded-full bg-white shadow-xl shadow-white/20" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}