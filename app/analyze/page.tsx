"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { 
  Camera, Upload, Sparkles, X, Loader2, Info, Trash2, Plus, RefreshCw, Lock, ArrowRight, Minus, CheckCircle2, Dna, Wheat, Droplets, Zap, Image as ImageIcon
} from "lucide-react";
import { getDictionary } from "@/lib/get-dictionary";
import Link from "next/link";

type FoodItem = {
  logId?: string;
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
              imagePreview: previews[i]
            });
          });
        } 
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
      <RefreshCw className="animate-spin text-emerald-500" size={40} />
    </div>
  );

  if (isLoggedIn === false) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-28 h-28 bg-emerald-500/10 rounded-[3rem] flex items-center justify-center mb-8 border border-emerald-500/20 relative shadow-2xl">
          <Lock size={48} className="text-emerald-500" />
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full border-4 border-white dark:border-[#050505]" />
        </div>
        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white mb-4">
          {lang === 'th' ? "ต้องเข้าสู่ระบบก่อน" : "Login Required"}
        </h2>
        <Link href="/login" className="group flex items-center gap-3 bg-emerald-500 text-black px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">
          {lang === 'th' ? "ไปหน้าเข้าสู่ระบบ" : "Go to Login"}
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-32">
      <main className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      
        {/* 🚨 Custom Floating Alert */}
        {showSaveAlert && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] w-[90%] max-w-md bg-slate-900 dark:bg-white text-white dark:text-black p-5 rounded-3xl shadow-2xl flex items-center gap-5 animate-in slide-in-from-top-10 duration-500 border border-white/10">
            <div className="bg-emerald-500 p-3 rounded-2xl">
              <CheckCircle2 size={28} className="text-black" />
            </div>
            <div>
              <p className="font-black text-sm uppercase tracking-widest">{lang === 'th' ? "บันทึกเรียบร้อย!" : "Saved Successfully!"}</p>
              <p className="text-xs opacity-60 font-bold uppercase mt-1">{lang === 'th' ? "ข้อมูลโภชนาการถูกเก็บลงประวัติแล้ว" : "Nutrition log has been updated."}</p>
            </div>
            <button onClick={() => setShowSaveAlert(false)} className="ml-auto opacity-40 hover:opacity-100 transition-opacity p-2">
              <X size={20} />
            </button>
          </div>
        )}

        <header className="flex justify-between items-end border-b border-slate-200 dark:border-white/5 pb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs md:text-sm px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-600 font-black uppercase tracking-widest">
                <Sparkles size={14} className="animate-pulse" /> {lang === 'th' ? "สแกนเนอร์อัจฉริยะ" : "Smart Scanner"}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">
              AI <span className="text-emerald-500">Analyzer</span>
            </h1>
          </div>
          {selectedImages.length > 0 && (
            <div className="flex gap-2">
              <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-600 dark:text-gray-400 hover:text-emerald-500 hover:border-emerald-500/50 active:scale-95 transition-all shadow-sm">
                <Plus size={24} />
              </button>
              <button onClick={openCamera} className="bg-emerald-500 text-black p-4 rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all hover:bg-emerald-400">
                <Camera size={24} />
              </button>
            </div>
          )}
        </header>

        {/* 🎯 DESKTOP GRID SYSTEM (แบ่ง 2 คอลัมน์) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* 🟢 LEFT COLUMN (Upload Section) */}
          <section className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[3rem] p-6 shadow-xl relative overflow-hidden">
              
              <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                  <ImageIcon size={16} /> {lang === 'th' ? "รูปภาพของคุณ" : "Your Images"}
                </h3>
                <span className="text-xs font-bold text-gray-400 bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full">{selectedImages.length} {lang === 'th' ? "รูป" : "Item"}</span>
              </div>

              {previews.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {previews.map((src, idx) => (
                    <div key={idx} className="relative aspect-square rounded-[2rem] bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm group">
                      <img src={src} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Preview" />
                      <button onClick={() => removeImage(idx)} className="absolute inset-0 bg-red-500/40 backdrop-blur-[2px] flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="p-3 bg-red-500 rounded-full shadow-lg scale-75 group-hover:scale-100 transition-transform"><Trash2 size={20} /></div>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full min-h-[300px] rounded-[2rem] bg-slate-50 dark:bg-white/[0.02] border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center p-8 text-center group transition-all">
                  <div className="w-20 h-20 bg-white dark:bg-white/5 rounded-full shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-slate-100 dark:border-white/5">
                    <Sparkles size={32} className="text-emerald-500" />
                  </div>
                  <h4 className="text-lg font-black italic uppercase text-slate-800 dark:text-white mb-2">{lang === 'th' ? "เพิ่มรูปภาพอาหาร" : "Add Food Images"}</h4>
                  <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-8 max-w-[200px]">{lang === 'th' ? "เลือกรูปภาพจากเครื่อง หรือถ่ายรูปใหม่" : "Select from gallery or take a new photo"}</p>
                  
                  <div className="flex gap-3 w-full">
                    <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-4 bg-white dark:bg-white/10 rounded-2xl text-sm font-black uppercase tracking-widest text-slate-700 dark:text-white shadow-sm border border-slate-200 dark:border-white/5 hover:bg-slate-50 hover:dark:bg-white/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                      <Upload size={18} /> {lang === 'th' ? "อัปโหลด" : "Upload"}
                    </button>
                    <button onClick={openCamera} className="flex-1 py-4 bg-emerald-500 rounded-2xl text-sm font-black uppercase tracking-widest text-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all active:scale-95 flex items-center justify-center gap-2">
                      <Camera size={18} /> {lang === 'th' ? "กล้อง" : "Camera"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Hidden Input File */}
            <input type="file" multiple hidden ref={fileInputRef} onChange={handleFileChange} accept="image/*" />

            {results.length === 0 && selectedImages.length > 0 && (
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full py-5 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-sm md:text-base shadow-2xl active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 hover:shadow-emerald-500/20"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} className="text-emerald-500" />}
                {lang === 'th' ? "เริ่มการวิเคราะห์ด้วย AI" : "Start AI Analysis"}
              </button>
            )}
          </section>

          {/* 🟢 RIGHT COLUMN (Results Section) */}
          <section className="lg:col-span-7">
            <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[3rem] p-6 md:p-8 shadow-xl relative overflow-hidden transition-all min-h-[500px] flex flex-col">
              
              {loading && (
                <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-20 flex items-center justify-center flex-col gap-6">
                  <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <Sparkles className="absolute inset-0 m-auto text-emerald-500 animate-pulse" size={24} />
                  </div>
                  <p className="text-sm font-black uppercase tracking-[0.3em] text-emerald-600 animate-pulse">{lang === 'th' ? "กำลังประมวลผล..." : "Processing..."}</p>
                </div>
              )}

              <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 px-2">
                <Info size={16} className="text-emerald-500" /> {lang === 'th' ? "โภชนาการที่ตรวจพบ" : "Nutrition Detected"}
              </h3>

              {results.length > 0 ? (
                <div className="flex flex-col h-full flex-1">
                  {/* Results List */}
                  <div className="space-y-4 max-h-[400px] lg:max-h-[500px] overflow-y-auto pr-2 custom-scrollbar flex-1 mb-6">
                    {results.map((item, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-white/5 p-4 rounded-[2rem] flex items-center gap-5 border border-slate-100 dark:border-white/5 animate-in slide-in-from-right duration-500 shadow-sm hover:shadow-md transition-shadow group" style={{ animationDelay: `${idx * 100}ms` }}>
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden shadow-inner shrink-0 relative">
                          <img src={item.imagePreview} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="food" />
                        </div>
                        <div className="flex-1 min-w-0 py-1">
                          <h4 className="font-black text-slate-800 dark:text-white text-base md:text-lg uppercase italic truncate pr-2 mb-2">{item.thaiName}</h4>
                          <div className="flex gap-3 md:gap-4 text-[10px] md:text-xs text-gray-500 font-bold uppercase">
                            <span className="flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg"><Dna size={12} /> {item.protein}g</span>
                            <span className="flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-lg"><Wheat size={12} /> {item.carbs}g</span>
                            <span className="flex items-center gap-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-1 rounded-lg"><Droplets size={12} /> {item.fat}g</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 bg-white dark:bg-black/20 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
                          <span className="text-emerald-600 dark:text-emerald-500 font-black text-xl md:text-2xl">{item.baseCalories}</span>
                          <p className="text-[10px] text-gray-400 font-bold tracking-widest mt-1">KCAL</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Portion Picker */}
                  <div className="flex justify-between items-center p-5 md:p-6 bg-slate-100 dark:bg-white/5 rounded-3xl mb-6">
                    <div>
                      <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest block">{lang === 'th' ? "สัดส่วนที่ทาน" : "Portions"}</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">{lang === 'th' ? "ปรับจำนวนจานหรือ % การทาน" : "Adjust serving size"}</span>
                    </div>
                    <div className="flex items-center gap-5 bg-white dark:bg-black/20 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-white/5">
                      <button onClick={() => setPortion(Math.max(0.5, portion - 0.5))} className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center shadow-sm hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors active:scale-95">
                        <Minus size={18} className="text-slate-600 dark:text-white" />
                      </button>
                      <span className="font-black text-emerald-600 dark:text-emerald-500 text-xl min-w-[2rem] text-center">{portion}</span>
                      <button onClick={() => setPortion(portion + 0.5)} className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-500/20 transition-colors active:scale-95">
                        <Plus size={18} className="text-slate-600 dark:text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Summary Card & Save Button */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-emerald-500 text-black p-6 rounded-[2rem] shadow-xl shadow-emerald-500/20 relative overflow-hidden group">
                      <Zap size={100} className="absolute -right-6 -bottom-6 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-500" />
                      <div className="flex justify-between items-start mb-4 relative z-10">
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">{lang === 'th' ? "แคลอรี่รวม" : "Total KCAL"}</p>
                          <h2 className="text-5xl font-black italic tracking-tighter leading-none">{totals.calories.toFixed(0)}</h2>
                        </div>
                      </div>
                      <div className="flex gap-4 pt-4 border-t border-black/10 relative z-10">
                        <div>
                          <p className="font-black text-sm">{totals.protein.toFixed(1)}<span className="text-[10px] opacity-70 ml-0.5">g</span></p>
                          <p className="text-[9px] font-bold uppercase opacity-60 mt-1">{lang === 'th' ? "โปรตีน" : "Pro"}</p>
                        </div>
                        <div className="w-[1px] bg-black/10"></div>
                        <div>
                          <p className="font-black text-sm">{totals.carbs.toFixed(1)}<span className="text-[10px] opacity-70 ml-0.5">g</span></p>
                          <p className="text-[9px] font-bold uppercase opacity-60 mt-1">{lang === 'th' ? "คาร์บ" : "Carb"}</p>
                        </div>
                        <div className="w-[1px] bg-black/10"></div>
                        <div>
                          <p className="font-black text-sm">{totals.fat.toFixed(1)}<span className="text-[10px] opacity-70 ml-0.5">g</span></p>
                          <p className="text-[9px] font-bold uppercase opacity-60 mt-1">{lang === 'th' ? "ไขมัน" : "Fat"}</p>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={handleSave}
                      disabled={loading}
                      className="w-full h-full min-h-[120px] rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-sm shadow-2xl active:scale-95 transition-all flex flex-col items-center justify-center gap-3 hover:bg-slate-800 dark:hover:bg-slate-200 group"
                    >
                      <div className="p-4 rounded-full bg-white/10 dark:bg-black/10 group-hover:scale-110 transition-transform">
                        <ArrowRight size={24} />
                      </div>
                      {lang === 'th' ? "บันทึกลงสมุด" : "SAVE LOG"}
                    </button>
                  </div>

                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 mt-10">
                  <div className="w-32 h-32 mb-6 opacity-50 grayscale">
                     <img src="https://cdn-icons-png.flaticon.com/512/3135/3135692.png" alt="Empty" className="w-full h-full object-contain drop-shadow-xl" />
                  </div>
                  <h4 className="text-xl font-black italic uppercase text-slate-800 dark:text-white mb-2">{lang === 'th' ? "รอการวิเคราะห์" : "Awaiting Analysis"}</h4>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] max-w-[250px]">
                    {lang === 'th' ? "เพิ่มรูปภาพแล้วกดเริ่มเพื่อดูข้อมูลโภชนาการ" : "Upload an image and start to see nutrition facts"}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* 📸 CAMERA OVERLAY UI */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[400] bg-black flex flex-col animate-in fade-in zoom-in-95 duration-300">
          <div className="p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
            <span className="text-sm font-black uppercase tracking-widest text-emerald-500 italic flex items-center gap-2">
              <Zap size={16} /> Live Lens
            </span>
            <button onClick={closeCamera} className="p-3 bg-white/20 rounded-full text-white backdrop-blur-md hover:bg-white/40 transition-colors"><X size={24} /></button>
          </div>
          
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
            <div className="absolute inset-0 border-[6rem] border-black/50 backdrop-blur-[2px] pointer-events-none transition-all" />
            <div className="absolute w-72 h-72 border-2 border-emerald-500/80 rounded-[4rem] shadow-[0_0_0_2px_rgba(255,255,255,0.1)] flex items-center justify-center">
              <div className="w-8 h-8 border-t-4 border-l-4 border-white absolute top-6 left-6 rounded-tl-2xl"></div>
              <div className="w-8 h-8 border-t-4 border-r-4 border-white absolute top-6 right-6 rounded-tr-2xl"></div>
              <div className="w-8 h-8 border-b-4 border-l-4 border-white absolute bottom-6 left-6 rounded-bl-2xl"></div>
              <div className="w-8 h-8 border-b-4 border-r-4 border-white absolute bottom-6 right-6 rounded-br-2xl"></div>
              <Sparkles size={32} className="text-white/20 animate-pulse" />
            </div>
          </div>

          <div className="p-10 pb-16 flex justify-center items-center bg-gradient-to-t from-black to-black/80">
            <button onClick={capturePhoto} className="h-24 w-24 rounded-full border-4 border-white p-2 active:scale-90 transition-all bg-transparent group">
              <div className="h-full w-full rounded-full bg-white group-hover:bg-emerald-500 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}