"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, Upload, Sparkles, X, Loader2, Info, Trash2, Plus, RefreshCw, Lock, ArrowRight, Minus, CheckCircle2, Dna, Wheat, Droplets, Zap } from "lucide-react";
import { getDictionary } from "@/lib/get-dictionary";
import Link from "next/link";

type FoodItem = {
  logId?: string; // 🆕 เก็บ ID ของ History ที่ API สร้างให้
  thaiName: string;
  baseCalories: number;
  protein: number;
  fat: number;
  carbs: number;
  healthNote?: string;
  imagePreview?: string;
};

export default function AnalyzePage() {
  const [dict, setDict] = useState<any>(null);
  const [lang, setLang] = useState<'en' | 'th'>('th');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [results, setResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [portion, setPortion] = useState<number>(1);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: 'no-store' });
      const data = await res.json();
      setIsLoggedIn(!!data.isLoggedIn);
    } catch (err) {
      setIsLoggedIn(false);
    }
  };

  const initLang = useCallback(async () => {
    const savedLang = (localStorage.getItem("preferred-lang") as 'en' | 'th') || 'th';
    setLang(savedLang);
    const dictionary = await getDictionary(savedLang);
    setDict(dictionary);
  }, []);

  useEffect(() => { 
    initLang(); 
    checkAuth();
  }, [initLang]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedImages((prev) => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
      setResults([]); 
      setShowSaveAlert(false);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setResults([]);
  };

  const openCamera = async () => {
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
      alert(lang === 'th' ? "ไม่สามารถเปิดกล้องได้" : "Unable to open camera");
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.95));
    if (!blob) return;
    const capturedFile = new File([blob], `meal-${Date.now()}.jpg`, { type: "image/jpeg" });
    setSelectedImages(prev => [...prev, capturedFile]);
    setPreviews(prev => [...prev, URL.createObjectURL(capturedFile)]);
    closeCamera();
  };

  const closeCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setIsCameraOpen(false);
  };

  const handleAnalyze = async () => {
    if (selectedImages.length === 0) return;
    setLoading(true);
    setResults([]);
    const tempResults: FoodItem[] = [];
    
    try {
      for (let i = 0; i < selectedImages.length; i++) {
        const imgFile = selectedImages[i];
        const formData = new FormData();
        formData.append("image", imgFile);
        
        const res = await fetch("/api/analyze-food", { method: "POST", body: formData });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || "Analysis failed");
        
        // 🎯 ✅ แก้ไขตรงนี้: รองรับ Array จาก API (ถ้าส่งรูปโต๊ะจีนมา อาจจะได้กลับมา 5 จาน)
        if (data.results && Array.isArray(data.results)) {
          data.results.forEach((item: any) => {
            const dish = item.thaiDish || item;
            tempResults.push({
              logId: item.logId, 
              thaiName: dish.thaiName || dish.foodName,
              baseCalories: dish.baseCalories || dish.calories || 0,
              protein: dish.protein || 0,
              fat: dish.fat || 0,
              carbs: dish.carbs || 0,
              healthNote: dish.healthNote,
              imagePreview: previews[i] // จานที่หาเจอจากรูปนี้ จะใช้รูปพรีวิวเดียวกัน
            });
          });
        } 
        // เผื่อ fallback กรณี API เก่าที่ส่งมาแบบเดี่ยวๆ
        else {
          const dish = data.thaiDish || data;
          tempResults.push({
            logId: data.logId,
            thaiName: dish.thaiName || dish.foodName,
            baseCalories: dish.baseCalories || dish.calories || 0,
            protein: dish.protein || 0,
            fat: dish.fat || 0,
            carbs: dish.carbs || 0,
            healthNote: dish.healthNote,
            imagePreview: previews[i]
          });
        }
      }
      setResults(tempResults);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const logIds = results.map(r => r.logId).filter(Boolean);
    if (logIds.length === 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/meal-logs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logIds, portion, isSaved: true })
      });

      if (!res.ok) throw new Error("Save failed");

      setShowSaveAlert(true);
      setTimeout(() => {
        setShowSaveAlert(false);
        // เคลียร์หน้าจอหลังจากบันทึกเสร็จ
        setResults([]);
        setSelectedImages([]);
        setPreviews([]);
      }, 3000);
    } catch(err: any) {
      alert(lang === 'th' ? "บันทึกไม่สำเร็จ กรุณาลองใหม่" : "Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const totals = results.reduce((acc, curr) => ({
    calories: acc.calories + (curr.baseCalories * portion),
    protein: acc.protein + (curr.protein * portion),
    carbs: acc.carbs + (curr.carbs * portion),
    fat: acc.fat + (curr.fat * portion),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  if (!dict || isLoggedIn === null) return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <RefreshCw className="animate-spin text-emerald-500" size={32} />
    </div>
  );

  if (isLoggedIn === false) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center mb-8 border border-emerald-500/20 relative">
          <Lock size={40} className="text-emerald-500" />
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full border-4 border-white dark:border-[#050505]" />
        </div>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white mb-3">
          {lang === 'th' ? "ต้องเข้าสู่ระบบก่อน" : "Login Required"}
        </h2>
        <Link href="/login" className="group flex items-center gap-3 bg-emerald-500 text-black px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">
          {lang === 'th' ? "ไปหน้าเข้าสู่ระบบ" : "Go to Login"}
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-32 px-4 pt-6 animate-in fade-in duration-700 relative">
      
      {/* 🚨 Custom Floating Alert */}
      {showSaveAlert && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] w-[90%] max-w-sm bg-slate-900 dark:bg-white text-white dark:text-black p-4 rounded-3xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-10 duration-500 border border-white/10">
          <div className="bg-emerald-500 p-2 rounded-2xl">
            <CheckCircle2 size={24} className="text-black" />
          </div>
          <div>
            <p className="font-black text-xs uppercase tracking-widest">{lang === 'th' ? "บันทึกเรียบร้อย!" : "Saved Successfully!"}</p>
            <p className="text-xs opacity-60 font-bold uppercase">{lang === 'th' ? "ข้อมูลโภชนาการถูกเก็บลงประวัติแล้ว" : "Nutrition log has been updated."}</p>
          </div>
          <button onClick={() => setShowSaveAlert(false)} className="ml-auto opacity-40 hover:opacity-100 transition-opacity">
            <X size={16} />
          </button>
        </div>
      )}

      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">AI Analyzer</h1>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
            <Sparkles size={10} className="text-emerald-500" />{lang === 'th' ? "สแกนเนอร์อัจฉริยะ" : "Smart Scanner"}
          </p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-600 dark:text-gray-400 active:scale-90 transition-all">
             <Plus size={20} />
           </button>
           <button onClick={openCamera} className="bg-emerald-500 text-black p-3 rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-90 transition-all">
             <Camera size={20} />
           </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Left Section */}
        <section className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {previews.map((src, idx) => (
              <div key={idx} className="relative w-20 h-20 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 overflow-hidden shadow-md group">
                <img src={src} className="w-full h-full object-cover" alt="Preview" />
                <button onClick={() => removeImage(idx)} className="absolute inset-0 bg-red-500/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {previews.length === 0 && (
              <div onClick={() => fileInputRef.current?.click()} className="w-full h-32 rounded-[2rem] bg-slate-50 dark:bg-white/[0.02] border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-all group">
                <Upload size={20} className="text-gray-400 mb-2 group-hover:text-emerald-500 transition-colors" />
                <span className="text-[12px] font-black uppercase tracking-widest text-gray-400">{lang === 'th' ? "คลิกเพื่ออัปโหลด" : "Click to upload"}</span>
              </div>
            )}
          </div>
          <input type="file" multiple hidden ref={fileInputRef} onChange={handleFileChange} accept="image/*" />

          {results.length === 0 && selectedImages.length > 0 && (
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-emerald-500 text-black font-black uppercase tracking-widest text-base shadow-lg active:scale-[0.98] transition-all disabled:opacity-20 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
              {lang === 'th' ? "เริ่มการวิเคราะห์" : "Start Analysis"}
            </button>
          )}
        </section>

        {/* Right Section */}
        <section>
          <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden transition-all">
            {loading && (
              <div className="absolute inset-0 bg-white/80 dark:bg-black/70 backdrop-blur-sm z-20 flex items-center justify-center flex-col gap-4">
                <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-[12px] font-black uppercase tracking-[0.2em] text-emerald-600 animate-pulse">AI Processing</p>
              </div>
            )}

            <h3 className="text-[12px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Info size={12} /> {lang === 'th' ? "โภชนาการที่ตรวจพบ" : "Nutrition Detected"}
            </h3>

            {results.length > 0 ? (
              <div className="space-y-6">
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {results.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-white/5 p-3 rounded-2xl flex items-center gap-4 border border-slate-100 dark:border-white/5 animate-in slide-in-from-right duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                      <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm shrink-0">
                        <img src={item.imagePreview} className="w-full h-full object-cover" alt="food" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-slate-800 dark:text-white text-base uppercase italic truncate pr-2">{item.thaiName}</h4>
                        <div className="flex gap-2 text-xs text-gray-500 font-bold uppercase mt-0.5">
                          <span className="flex items-center gap-0.5"><Dna size={8} className="text-blue-500" /> {item.protein}g</span>
                          <span className="flex items-center gap-0.5"><Wheat size={8} className="text-orange-500" /> {item.carbs}g</span>
                          <span className="flex items-center gap-0.5"><Droplets size={8} className="text-yellow-500" /> {item.fat}g</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm">{item.baseCalories}</span>
                        <p className="text-[7px] text-gray-400 font-bold leading-none">KCAL</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Portion Picker - ปรับสัดส่วนการกินแบบเหมารวม (เช่น กินโต๊ะจีนนี้แค่ 0.5 ส่วน) */}
                {selectedImages.length > 0 && (
                  <div className="flex justify-between items-center p-4 bg-slate-100/50 dark:bg-white/5 rounded-3xl">
                    <span className="text-[12px] font-black text-gray-400 uppercase tracking-widest">{lang === 'th' ? "สัดส่วนที่ทาน" : "Portions"}</span>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setPortion(Math.max(0.5, portion - 0.5))} className="w-8 h-8 rounded-full bg-white dark:bg-white/10 flex items-center justify-center shadow-sm hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors">
                        <Minus size={14} className="text-slate-600 dark:text-white" />
                      </button>
                      <span className="font-black text-slate-900 dark:text-white text-lg min-w-[1.5rem] text-center">{portion}</span>
                      <button onClick={() => setPortion(portion + 0.5)} className="w-8 h-8 rounded-full bg-white dark:bg-white/10 flex items-center justify-center shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-500/20 transition-colors">
                        <Plus size={14} className="text-slate-600 dark:text-white" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Summary Card */}
                <div className="bg-emerald-500 text-black p-5 rounded-[2.5rem] shadow-xl shadow-emerald-500/20 relative overflow-hidden group">
                  <Zap size={80} className="absolute -right-4 -bottom-4 opacity-10 rotate-12 group-hover:scale-110 transition-transform" />
                  <div className="flex justify-between items-center mb-4 relative z-10">
                    <p className="text-xs font-black uppercase tracking-widest opacity-70">{lang === 'th' ? "รวมแคลอรี่" : "Total KCAL"}</p>
                    <h2 className="text-4xl font-black italic tracking-tighter">{totals.calories.toFixed(0)}</h2>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-black/10 relative z-10">
                    <div className="flex flex-col items-center">
                      <Dna size={12} className="mb-1 opacity-60" />
                      <p className="font-black text-xs">{totals.protein.toFixed(1)}g</p>
                      <p className="text-[7px] font-bold uppercase opacity-50">{lang === 'th' ? "โปรตีน" : "Protein"}</p>
                    </div>
                    <div className="flex flex-col items-center border-x border-black/10">
                      <Wheat size={12} className="mb-1 opacity-60" />
                      <p className="font-black text-xs">{totals.carbs.toFixed(1)}g</p>
                      <p className="text-[7px] font-bold uppercase opacity-50">{lang === 'th' ? "คาร์บ" : "Carbs"}</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <Droplets size={12} className="mb-1 opacity-60" />
                      <p className="font-black text-xs">{totals.fat.toFixed(1)}g</p>
                      <p className="text-[7px] font-bold uppercase opacity-50">{lang === 'th' ? "ไขมัน" : "Fats"}</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-base shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowRight size={16} />
                  {lang === 'th' ? "บันทึกลงสมุดสุขภาพ" : "SAVE TO HEALTH LOG"}
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-16 opacity-30">
                <Sparkles size={40} className="text-slate-400 mb-4" />
                <p className="text-[12px] font-black uppercase tracking-[0.2em] max-w-[150px]">
                  {lang === 'th' ? "วิเคราะห์รูปภาพอาหารของคุณเพื่อดูโภชนาการ" : "Analyze your meal for nutrition insights"}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Camera UI */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[400] bg-black flex flex-col animate-in fade-in duration-300">
          <div className="p-6 flex justify-between items-center z-10">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-500 italic">Live Lens</span>
            <button onClick={closeCamera} className="p-3 bg-white/10 rounded-full text-white backdrop-blur-md"><X size={20} /></button>
          </div>
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
            <div className="absolute inset-0 border-[4rem] border-black/60 pointer-events-none" />
            <div className="absolute w-64 h-64 border-2 border-emerald-500/50 rounded-[3.5rem] shadow-[0_0_0_2px_rgba(255,255,255,0.1)]" />
          </div>
          <div className="p-12 flex justify-center items-center bg-black">
            <button onClick={capturePhoto} className="h-20 w-20 rounded-full border-4 border-white p-1 active:scale-90 transition-all bg-transparent group">
              <div className="h-full w-full rounded-full bg-white group-hover:bg-emerald-500 transition-colors" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}