"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { 
  Camera, History, User, Flame, Target, ChevronRight, Activity, 
  Sparkles, Loader2, TrendingUp, BarChart3, LineChart as LineChartIcon, 
  Zap, Lightbulb, X, Info, Dumbbell, Timer, Utensils, RefreshCw, Save 
} from "lucide-react";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ReferenceLine } from 'recharts';
import { getDictionary } from "@/lib/get-dictionary";

export default function HomePage() {
  const [data, setData] = useState<{
    profile: any;
    eatenToday: number;
    macrosToday: { p: number; c: number; f: number };
  } | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState(7);
  const [chartType, setChartType] = useState<"calories" | "macros">("calories");
  const [loading, setLoading] = useState(true);

  const [dict, setDict] = useState<any>(null);
  const [lang, setLang] = useState<'en' | 'th'>('th');

  // 💡 Smart Tips State
  const [showTipModal, setShowTipModal] = useState(false);
  const [modalView, setModalView] = useState<'select' | 'loading' | 'advice'>('select');
  const [activeTip, setActiveTip] = useState<any>({ short: "", diet: "", workout: "", cardio: "", icon: "💡" });
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [showFloatingTip, setShowFloatingTip] = useState(true);

  // ⚖️ Popups State
  const [showBmiPopup, setShowBmiPopup] = useState(false);
  const [showWelcomeAuth, setShowWelcomeAuth] = useState(false);
  const [welcomeData, setWelcomeData] = useState<any>(null);

  // 🧠 Logic วิเคราะห์คำแนะนำ (สำหรับปุ่มหลอดไฟ)
  const generateSmartTip = useCallback((profile: any, eaten: number, currentLang: string) => {
    const target = profile?.dailyCalorieGoal || 2000;
    const userGoal = profile?.goal || 'none';
    const diff = eaten - target;

    let shortMsg = "";
    if (userGoal === 'none') {
      shortMsg = currentLang === 'th' ? "ตั้งค่าเป้าหมาย" : "Setting Goals";
    } else if (userGoal === 'muscle_gain') {
      if (eaten >= target) shortMsg = currentLang === 'th' ? "เป้าหมายสำเร็จแล้ว 💪" : "Goal Achieved 💪";
      else shortMsg = currentLang === 'th' ? "ดูคำแนะนำเพิ่มเติม 💡" : "View more advice 💡";
    } else {
      if (diff > 100) shortMsg = currentLang === 'th' ? "ทานเกินกำหนดแล้ว ⚠️" : "Limit exceeded ⚠️";
      else if (eaten >= target && diff <= 100) shortMsg = currentLang === 'th' ? "เป้าหมายสำเร็จแล้ว 🎯" : "Goal Achieved 🎯";
      else shortMsg = currentLang === 'th' ? "ดูคำแนะนำเพิ่มเติม 💡" : "View more advice 💡";
    }

    const adviceDB: any = {
      weight_loss: {
         diet: [
           currentLang === 'th' ? "เน้นโปรตีนจากอกไก่ ไข่ต้ม ลดแป้งขัดสี และดื่มน้ำ 1 แก้วก่อนมื้ออาหารเพื่อช่วยให้อิ่มเร็วขึ้น" : "Focus on lean protein (chicken, eggs), reduce refined carbs. Drink water before meals.",
           currentLang === 'th' ? "พยายามทานผักใบเขียวให้ได้ครึ่งจานในทุกมื้อ หลีกเลี่ยงของทอดและน้ำหวานเด็ดขาด" : "Fill half your plate with greens. Avoid fried foods and sugary drinks completely."
         ],
         workout: [
           currentLang === 'th' ? "เวทเทรนนิ่ง 3-4 วัน/สัปดาห์ (12-15 ครั้ง/เซต) แบบทั่วร่าง เพื่อกระตุ้นระบบเผาผลาญ" : "Weight training 3-4 days/week (12-15 reps/set), Full Body focus to boost metabolism.",
           currentLang === 'th' ? "บอดี้เวทที่บ้าน 4 วัน/สัปดาห์ เน้นแกนกลางลำตัว (Core) และช่วงล่าง (Legs)" : "Home bodyweight 4 days/week. Focus on core and legs."
         ],
         cardio: [
           currentLang === 'th' ? "เดินชันบนลู่วิ่ง 30 นาที 3-4 วัน/สัปดาห์ (Zone 2)" : "Incline Walk for 30 mins, 3-4 days/week (Zone 2).",
           currentLang === 'th' ? "วิ่งสลับเดิน (Interval) 25 นาที 3 วัน/สัปดาห์ ช่วยเบิร์นไขมันสะสมได้ดี" : "Interval running 25 mins, 3 days/week to burn stubborn fat."
         ]
      },
      health_maintenance: {
         diet: [
           currentLang === 'th' ? "ทานอาหารครบ 5 หมู่ ยึดหลัก 2:1:1 (ผัก 2 ส่วน ข้าว 1 ส่วน เนื้อ 1 ส่วน)" : "Eat balanced meals. Rule of thumb: 2 parts veg, 1 part carbs, 1 part protein.",
           currentLang === 'th' ? "ทานให้อิ่มแค่ 80% ของกระเพาะ เลี่ยงอาหารรสจัด หวานจัด หรือเค็มจัด" : "Eat until 80% full. Avoid overly sweet, salty, or spicy foods."
         ],
         workout: [
           currentLang === 'th' ? "เวทเทรนนิ่งเบาๆ 3 วัน/สัปดาห์ (10-12 ครั้ง/เซต) เพื่อความกระชับของกล้ามเนื้อ" : "Light weight training 3 days/week (10-12 reps) for muscle toning.",
           currentLang === 'th' ? "โยคะ หรือ พิลาทิส 2 วัน/สัปดาห์ เพื่อเพิ่มความยืดหยุ่นและลดความเครียด" : "Yoga or Pilates 2 days/week for flexibility and stress relief."
         ],
         cardio: [
           currentLang === 'th' ? "วิ่งเหยาะๆ หรือปั่นจักรยาน 30-40 นาที 3 วัน/สัปดาห์" : "Jogging or cycling 30-40 mins, 3 days/week.",
           currentLang === 'th' ? "ว่ายน้ำ หรือเต้นแอโรบิก 45 นาที 2 วัน/สัปดาห์ เพื่อสุขภาพหัวใจ" : "Swimming or aerobics 45 mins, 2 days/week for heart health."
         ]
      },
      muscle_gain: {
         diet: [
           currentLang === 'th' ? "ทานโปรตีน 1.6-2 กรัมต่อน้ำหนักตัว เพิ่มคาร์บเพื่อเป็นพลังงานในการยกน้ำหนัก" : "1.6-2g of protein per kg of bodyweight. Increase carbs for lifting energy.",
           currentLang === 'th' ? "แบ่งทาน 4-5 มื้อย่อย เน้นไขมันดีอย่างถั่วและอะโวคาโดเพื่อช่วยเพิ่มแคลอรี่" : "Eat 4-5 small meals. Focus on healthy fats like nuts and avocados to increase calories."
         ],
         workout: [
           currentLang === 'th' ? "เน้นท่า Compound (Squat, Deadlift, Bench Press) ยกหนัก 8-10 ครั้ง/เซต" : "Focus on Compound lifts (Squat, Deadlift, Bench). Heavy 8-10 reps/set.",
           currentLang === 'th' ? "แยกเล่นทีละส่วน (Push/Pull/Legs) 4-5 วัน/สัปดาห์ พยายามเพิ่มน้ำหนักขึ้นในทุกสัปดาห์" : "Push/Pull/Legs split 4-5 days/week. Apply progressive overload."
         ],
         cardio: [
           currentLang === 'th' ? "คาร์ดิโอเบาๆ 15-20 นาทีหลังเล่นเวท เพื่อสุขภาพหัวใจ (ไม่เน้นเบิร์นไขมัน)" : "Light cardio 15-20 mins post-workout for heart health (don't overdo it).",
           currentLang === 'th' ? "เดินเร็ว 2 วัน/สัปดาห์ หลีกเลี่ยงคาร์ดิโอหนักๆ ที่อาจเผาผลาญกล้ามเนื้อทิ้ง" : "Brisk walk 2 days/week. Avoid intense cardio that might burn muscle."
         ]
      }
    };

    const plan = adviceDB[userGoal === 'none' ? 'weight_loss' : userGoal];
    const rDiet = plan.diet[Math.floor(Math.random() * plan.diet.length)];
    const rWorkout = plan.workout[Math.floor(Math.random() * plan.workout.length)];
    const rCardio = plan.cardio[Math.floor(Math.random() * plan.cardio.length)];

    return {
      short: shortMsg,
      diet: rDiet,
      workout: rWorkout,
      cardio: rCardio,
      icon: userGoal === 'none' ? '🎯' : userGoal === 'muscle_gain' ? '💪' : userGoal === 'weight_loss' ? '🔥' : '✨'
    };
  }, []);

  const loadHomeData = async (currentLang: string) => {
    try {
      const profileRes = await fetch("/api/profile");
      const profileData = await profileRes.json();
      const userProfile = profileData.profile || profileData;

      const logsRes = await fetch("/api/meal-logs");
      const logsData = await logsRes.json();
      const logs = Array.isArray(logsData) ? logsData : logsData.logs || [];

      const now = new Date();
      if (now.getHours() < 3) now.setDate(now.getDate() - 1);
      const todayStr = now.toISOString().slice(0, 10);

      const todaysLogs = logs.filter((log: any) => 
        (log.loggedAt || log.createdAt).startsWith(todayStr)
      );

      // ✅ แก้ไข: บวกแคลอรี่เฉพาะมื้อที่ isSaved === true เท่านั้น
      const totals = todaysLogs
        .filter((log: any) => log.isSaved === true)
        .reduce((acc: any, log: any) => ({
          cal: acc.cal + (log.totalCalories || log.calories || 0),
          p: acc.p + (log.protein || 0),
          c: acc.c + (log.carbs || 0),
          f: acc.f + (log.fat || 0),
        }), { cal: 0, p: 0, c: 0, f: 0 });

      setData({
        profile: userProfile,
        eatenToday: totals.cal,
        macrosToday: { p: totals.p, c: totals.c, f: totals.f }
      });

      setActiveTip(generateSmartTip(userProfile, totals.cal, currentLang));

      // ✅ ตรวจสอบว่าเพิ่ง Login/Register เข้ามาใช่ไหม?
      const isNewAuth = sessionStorage.getItem("show_welcome_popup") === "true";
      
      if (isNewAuth && userProfile.weightKg && userProfile.heightCm) {
        // คำนวณข้อมูลสำหรับ Popup ใหม่
        const bmi = userProfile.weightKg / ((userProfile.heightCm / 100) ** 2);
        let status = "", dietRec = "", workRec = "", sg = "";
        
        if (bmi < 18.5) {
          status = currentLang === 'th' ? "น้ำหนักน้อยเกินไป" : "Underweight";
          dietRec = currentLang === 'th' ? "เน้นทานโปรตีนและไขมันดี เพิ่มปริมาณอาหารขึ้นทีละนิด" : "Focus on protein & healthy fats in a caloric surplus.";
          workRec = currentLang === 'th' ? "เน้นเวทเทรนนิ่งสร้างกล้ามเนื้อ งดคาร์ดิโอหนักๆ" : "Focus on strength training, avoid heavy cardio.";
          sg = "muscle_gain";
        } else if (bmi >= 25) {
          status = currentLang === 'th' ? "น้ำหนักเกินเกณฑ์" : "Overweight";
          dietRec = currentLang === 'th' ? "คุมปริมาณแคลอรี่ เน้นโปรตีนไร้ไขมันและผักใบเขียวเยอะๆ" : "Control calories, focus on lean protein and greens.";
          workRec = currentLang === 'th' ? "คาร์ดิโอผสมเวทเทรนนิ่งเพื่อเบิร์นไขมันและคงกล้ามเนื้อ" : "Mix cardio & strength training to burn fat.";
          sg = "weight_loss";
        } else {
          status = currentLang === 'th' ? "อยู่ในเกณฑ์ปกติ" : "Normal Weight";
          dietRec = currentLang === 'th' ? "ทานอาหารครบ 5 หมู่ เน้นรักษาสมดุลแคลอรี่ในแต่ละวัน" : "Eat a balanced diet, maintain daily calorie equilibrium.";
          workRec = currentLang === 'th' ? "ออกกำลังกายสม่ำเสมอ 3-4 วัน/สัปดาห์เพื่อความแข็งแรง" : "Exercise 3-4 days/week for overall fitness.";
          sg = "health_maintenance";
        }

        setWelcomeData({ bmi: bmi.toFixed(1), status, dietRec, workRec, tdee: userProfile.dailyCalorieGoal, sg });
        setShowWelcomeAuth(true);
        sessionStorage.removeItem("show_welcome_popup"); // 🗑️ ลบทิ้ง จะได้ไม่เด้งตอนรีเฟรชหน้า
      } 
      // ✅ ถ้าไม่ได้เพิ่ง Login ให้เช็คว่าไม่มี Goal ไหม (Popup เตือนปกติ)
      else if (!userProfile.goal || userProfile.goal === 'none') {
        const hasSeenPopup = sessionStorage.getItem('bmi_popup_seen');
        if (!hasSeenPopup) {
          setShowBmiPopup(true);
          sessionStorage.setItem('bmi_popup_seen', 'true');
        }
      }

      const statsRes = await fetch("/api/stats/trends");
      if (statsRes.ok) { setTrendData(await statsRes.json()); }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSaveGoal = async (directGoal?: string) => {
    const targetGoal = directGoal || selectedGoal;
    if (!targetGoal) return;
    
    setShowBmiPopup(false); 
    setShowTipModal(true);
    setModalView('loading'); 
    
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          goal: targetGoal,
          name: data?.profile?.name,
          weightKg: data?.profile?.weightKg,
          heightCm: data?.profile?.heightCm,
          activityLevel: data?.profile?.activityLevel
        })
      });
      if (res.ok) {
        await loadHomeData(lang); 
        setTimeout(() => {
          setModalView('advice');
        }, 800);
      }
    } catch (e) { 
      console.error(e); 
      setModalView('select'); 
    }
  };

  const openModal = () => {
    if (!data?.profile?.goal || data?.profile?.goal === 'none') {
      setSelectedGoal(null); 
      setModalView('select');
    } else {
      setActiveTip(generateSmartTip(data?.profile, data?.eatenToday || 0, lang));
      setModalView('advice');
    }
    setShowTipModal(true);
  };

  useEffect(() => {
    const initData = async () => {
      const savedLang = (localStorage.getItem("preferred-lang") as 'en' | 'th') || 'th';
      setLang(savedLang);
      const dictionary = await getDictionary(savedLang);
      setDict(dictionary);
      await loadHomeData(savedLang);
    };
    initData();
  }, []);

  useEffect(() => {
    if (activeTip.short) {
      setShowFloatingTip(true); 
      const timer = setTimeout(() => {
        setShowFloatingTip(false); 
      }, 20000);
      return () => clearTimeout(timer); 
    }
  }, [activeTip.short]);

  const getBmiRecommendation = () => {
    if (!data?.profile?.weightKg || !data?.profile?.heightCm) return null;
    const bmi = data.profile.weightKg / ((data.profile.heightCm / 100) ** 2);
    
    if (bmi < 18.5) return { status: lang === 'th' ? "น้ำหนักน้อย" : "Underweight", advice: lang === 'th' ? "แนะนำเป้าหมาย: 'เพิ่มน้ำหนัก/สร้างกล้ามเนื้อ' เพื่อสุขภาพที่ดี" : "Recommended Goal: 'Muscle Gain' for better health.", suggestedGoal: 'muscle_gain', icon: '💪', color: 'text-blue-500' };
    if (bmi >= 25) return { status: lang === 'th' ? "น้ำหนักเกินเกณฑ์" : "Overweight", advice: lang === 'th' ? "แนะนำเป้าหมาย: 'ลดน้ำหนัก' เพื่อลดความเสี่ยงด้านสุขภาพ" : "Recommended Goal: 'Weight Loss' to reduce health risks.", suggestedGoal: 'weight_loss', icon: '🔥', color: 'text-rose-500' };
    return { status: lang === 'th' ? "เกณฑ์ปกติ" : "Normal Weight", advice: lang === 'th' ? "ยอดเยี่ยม! แนะนำเป้าหมาย: 'รักษาสุขภาพ/คงที่'" : "Great! Recommended Goal: 'Health Maintenance'.", suggestedGoal: 'health_maintenance', icon: '✨', color: 'text-emerald-500' };
  };

  const bmiRec = getBmiRecommendation();

  const getFullTrendData = () => {
    if (!trendData) return [];
    const fullData = [];
    const now = new Date();
    const todayComparison = new Date();
    if (todayComparison.getHours() < 3) todayComparison.setDate(todayComparison.getDate() - 1);
    const todayStr = todayComparison.toISOString().slice(0, 10);

    for (let i = timeRange - 1; i >= 0; i--) {
      const targetDate = new Date(); targetDate.setDate(now.getDate() - i);
      const dateStr = targetDate.toISOString().slice(0, 10);
      const existingDay = trendData.find((d: any) => (d.date === dateStr || d._id === dateStr));
      let dayValue = { calories: Number(existingDay?.calories || 0), protein: Number(existingDay?.protein || 0), carbs: Number(existingDay?.carbs || 0), fat: Number(existingDay?.fat || 0) };
      
      if (dateStr === todayStr && data) {
        dayValue.calories = data.eatenToday;
        dayValue.protein = data.macrosToday.p;
        dayValue.carbs = data.macrosToday.c;
        dayValue.fat = data.macrosToday.f;
      }
      fullData.push({ ...dayValue, date: dateStr, displayDate: targetDate.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short' }) });
    }
    return fullData;
  };

  const filteredTrendData = getFullTrendData();
  const goal = data?.profile?.dailyCalorieGoal || 2000;
  const eaten = data?.eatenToday || 0;
  const remaining = Math.max(goal - eaten, 0);
  const progress = Math.min((eaten / goal) * 100, 100);

  if (loading || !dict) return <div className="min-h-screen flex items-center justify-center bg-transparent"><Loader2 className="text-emerald-500 animate-spin" size={40} /></div>;

  return (
    <div className="min-h-screen bg-transparent pb-32">
      <main className="p-5 max-w-xl mx-auto space-y-6">
        
        <header className="px-1 pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center gap-2 text-base px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-600 font-black uppercase tracking-widest">
                <Sparkles size={12} className="animate-pulse" /> {lang === 'th' ? "โภชนาการ AI" : "AI Insights"}
              </div>
              <p className="text-[12px] font-bold text-gray-500">
                {lang === 'th' ? "ยินดีต้อนรับ, " : "Welcome, "}
                <span className="text-emerald-500 text-sm">
                  {data?.profile?.name?.split(' ')[0] || (lang === 'th' ? "ผู้ใช้" : "User")}
                </span>
              </p>
            </div>
            <h1 className="text-5xl font-black leading-none uppercase tracking-tighter italic text-slate-900 dark:text-white">Healthy<span className="text-emerald-500 underline decoration-emerald-500/30 underline-offset-4">Mate</span></h1>
        </header>

        {/* 📊 TRENDS SECTION */}
        <section className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 space-y-6 shadow-xl relative animate-in fade-in duration-1000">
          <div className="flex justify-between items-start px-1">
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-1 flex items-center gap-2"><Activity size={12} className="text-emerald-500" /> {lang === 'th' ? "สถิติสุขภาพ" : "Health Stats"}</h4>
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-800 dark:text-white">{chartType === "calories" ? (lang === 'th' ? "แนวโน้มแคลอรี่" : "Calorie Trends") : (lang === 'th' ? "แนวโน้มสารอาหาร" : "Macro Trends")}</h3>
            </div>
            <div className="flex bg-slate-100 dark:bg-black/40 p-1 rounded-2xl border border-slate-200 dark:border-white/5">
              <button onClick={() => setChartType("calories")} className={`p-2 rounded-xl transition-all ${chartType === "calories" ? "bg-white dark:bg-white/10 text-emerald-500 shadow-sm" : "text-gray-400"}`}><LineChartIcon size={16} /></button>
              <button onClick={() => setChartType("macros")} className={`p-2 rounded-xl transition-all ${chartType === "macros" ? "bg-white dark:bg-white/10 text-emerald-500 shadow-sm" : "text-gray-400"}`}><BarChart3 size={16} /></button>
            </div>
          </div>
          <div className="h-64 w-full pr-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "calories" ? (
                <AreaChart data={filteredTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs><linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-white/5" />
                  <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} dy={10} />
                  <YAxis domain={[0, (dataMax: any) => Math.max(dataMax, goal + 500)]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 900}} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '11px', fontWeight: 800 }} />
                  <ReferenceLine y={goal} stroke="#ef4444" strokeDasharray="5 5" label={{ position: 'right', value: 'GOAL', fill: '#ef4444', fontSize: 10, fontWeight: 900 }} />
                  <Area type="monotone" dataKey="calories" stroke="#10b981" strokeWidth={4} fill="url(#colorCal)" animationDuration={2000} />
                </AreaChart>
              ) : (
                <BarChart data={filteredTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-white/5" />
                  <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 900}} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '11px', fontWeight: 800 }} />
                  <Bar dataKey="protein" stackId="a" fill="#3b82f6" barSize={14} /><Bar dataKey="carbs" stackId="a" fill="#f59e0b" /><Bar dataKey="fat" stackId="a" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4">
            {[7, 30].map((range) => (
              <button key={range} onClick={() => setTimeRange(range)} className={`px-6 py-2.5 rounded-2xl text-base font-black uppercase tracking-widest transition-all ${timeRange === range ? "bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg" : "text-gray-400 bg-slate-100 dark:bg-white/5"}`}>{range} Days</button>
            ))}
          </div>
        </section>

        {/* 🟢 PROGRESS CARD */}
        <section className="bg-emerald-500 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden group">
          <div className="flex justify-between items-start relative z-20">
             <div className="space-y-1 pt-2">
                <p className="text-base font-black uppercase tracking-[0.2em] text-black/50">{lang === 'th' ? "วันนี้ทานได้อีก" : "KCAL Remaining"}</p>
             </div>
             <div className="flex items-center gap-3">
               <div className={`relative bg-black/90 backdrop-blur-md text-xs font-black text-white px-3 py-2 rounded-xl uppercase tracking-tighter shadow-xl border border-white/5 whitespace-nowrap flex items-center transition-all duration-1000 ${showFloatingTip ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'}`}>
                 {activeTip.short}
                 <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-black/90 rotate-45" />
               </div>
               <button onClick={openModal} className="bg-black/10 hover:bg-black/20 p-3.5 rounded-2xl transition-all border border-black/5 shadow-inner active:scale-90 relative shrink-0 group/btn">
                 <Lightbulb size={22} className="text-black group-hover/btn:rotate-12 transition-transform" />
                 <div className="absolute inset-0 bg-yellow-400/30 blur-xl animate-pulse -z-10 rounded-full" />
               </button>
             </div>
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000"><Zap size={280} fill="black" /></div>
          
          <div className="relative z-10 flex justify-between items-end mt-2">
             <div className="space-y-1">
                <h3 className="text-7xl font-black tracking-tighter text-black italic leading-none">{Math.round(remaining)}</h3>
             </div>
             <div className="text-right">
                <p className="text-base font-black uppercase tracking-[0.2em] text-black/50 mb-1.5">{lang === 'th' ? "จากเป้าหมาย" : "Daily Goal"}</p>
                <div className="px-4 py-2.5 bg-black/10 rounded-2xl border border-black/10 inline-block font-black text-black leading-none text-lg">{goal}</div>
             </div>
          </div>

          <div className="mt-8 space-y-4 relative z-10">
             <div className="w-full bg-black/10 h-4 rounded-full p-1 border border-black/5 overflow-hidden"><div className="bg-black h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} /></div>
             <div className="flex justify-between items-center text-black">
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-black animate-pulse" /><span className="text-base font-black uppercase tracking-widest opacity-80">{Math.round(eaten)} kcal</span></div>
                <span className="text-xs font-black italic">{Math.round(progress)}% COMPLETED</span>
             </div>
          </div>
        </section>

        {/* 🟢 MACRO GRID */}
        <div className="grid grid-cols-3 gap-4">
          <MacroCard label={lang === 'th' ? "โปรตีน" : "Protein"} val={data?.macrosToday.p} goal={data?.profile?.proteinGoal || 150} color="bg-blue-500/10 dark:bg-blue-500/20" border="border-blue-500/20" text="text-blue-600 dark:text-blue-400" icon={<Activity size={16}/>} />
          <MacroCard label={lang === 'th' ? "คาร์บ" : "Carbs"} val={data?.macrosToday.c} goal={data?.profile?.carbsGoal || 250} color="bg-amber-500/10 dark:bg-amber-500/20" border="border-amber-500/20" text="text-amber-600 dark:text-amber-400" icon={<TrendingUp size={16}/>} />
          <MacroCard label={lang === 'th' ? "ไขมัน" : "Fat"} val={data?.macrosToday.f} goal={data?.profile?.fatGoal || 70} color="bg-rose-500/10 dark:bg-rose-500/20" border="border-rose-500/20" text="text-rose-600 dark:text-rose-400" icon={<Zap size={16}/>} />
        </div>

        {/* 🟢 QUICK ACTIONS */}
        <section className="space-y-4 pt-2 pb-10">
          <h4 className="text-base font-black uppercase tracking-[0.4em] text-gray-400 px-2">{lang === 'th' ? "เมนูทางลัด" : "Quick Actions"}</h4>
          <div className="grid gap-3">
            <FeatureLink href="/analyze" title={lang === 'th' ? "วิเคราะห์มื้ออาหาร" : "Analyze Meal"} desc={lang === 'th' ? "ใช้ AI สแกนแคลอรี่จากรูปภาพ" : "AI calorie scanning"} icon={<Camera size={24} />} color="emerald" />
            <FeatureLink href="/history" title={lang === 'th' ? "ประวัติการทาน" : "Meal History"} desc={lang === 'th' ? "ตรวจสอบรายการบันทึก" : "Review past records"} icon={<History size={24} />} color="sky" />
            <FeatureLink href="/profile" title={lang === 'th' ? "ร่างกายและเป้าหมาย" : "Body & Goals"} desc={lang === 'th' ? "ปรับแต่งค่า BMI และแคลอรี่" : "Adjust your setup"} icon={<User size={24} />} color="violet" />
          </div>
        </section>

        {/* 🚀 WELCOME AUTH POPUP (เพิ่ง Login/Register เข้ามา) */}
        {showWelcomeAuth && welcomeData && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/90 backdrop-blur-xl animate-in fade-in duration-300" />
            <div className="relative w-full max-w-md bg-white dark:bg-[#0d0d0d] border border-emerald-500/30 rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col">
              <div className="bg-emerald-500 p-8 text-center relative">
                <button onClick={() => setShowWelcomeAuth(false)} className="absolute top-6 right-6 text-black/40 hover:text-black transition-colors"><X size={24} /></button>
                <div className="text-5xl mb-4 drop-shadow-lg animate-bounce">🎉</div>
                
                {/* ✅ โชว์ชื่อผู้ใช้ตรงนี้ด้วย */}
                <h3 className="text-2xl font-black italic uppercase text-black leading-none">
                  {lang === 'th' 
                    ? `ยินดีต้อนรับ, ${data?.profile?.name?.split(' ')[0]}!` 
                    : `Welcome, ${data?.profile?.name?.split(' ')[0]}!`}
                </h3>
                
              </div>
              <div className="p-8 space-y-6">
                
                {/* ข้อมูลร่างกาย */}
                <div className="flex justify-between items-center bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10">
                  <div className="text-center w-full border-r border-slate-200 dark:border-white/10">
                    <p className="text-xs text-gray-400 font-black uppercase tracking-widest">BMI</p>
                    <p className="text-xl font-black text-slate-800 dark:text-white">{welcomeData.bmi}</p>
                  </div>
                  <div className="text-center w-full">
                    <p className="text-xs text-gray-400 font-black uppercase tracking-widest">TDEE</p>
                    <p className="text-xl font-black text-emerald-500">{welcomeData.tdee} <span className="text-xs">kcal</span></p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <Activity size={16} className="text-emerald-500"/> {lang === 'th' ? `รูปร่าง: ${welcomeData.status}` : `Status: ${welcomeData.status}`}
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <Utensils size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-600 dark:text-gray-400 font-medium leading-relaxed">
                        <span className="font-bold text-slate-800 dark:text-white">
                          {lang === 'th' ? "โภชนาการ: " : "Diet: "}
                        </span>
                        {welcomeData.dietRec}
                      </p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <Dumbbell size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-600 dark:text-gray-400 font-medium leading-relaxed">
                        <span className="font-bold text-slate-800 dark:text-white">
                          {lang === 'th' ? "การออกกำลังกาย: " : "Workout: "}
                        </span>
                        {welcomeData.workRec}
                      </p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setShowWelcomeAuth(false);
                    handleSaveGoal(welcomeData.sg); 
                  }}
                  className="w-full bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-gray-200 text-white dark:text-black font-black py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl uppercase tracking-widest text-sm mt-4"
                >
                  <Target size={20} />
                  {lang === 'th' ? "ยอมรับและตั้งเป้าหมายเลย 🎯" : "Set Goal Now 🎯"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🚨 BMI RECOMMENDATION POPUP (กรณีเข้าเว็บปกติแต่ยังไม่มี Goal) */}
        {showBmiPopup && bmiRec && !showWelcomeAuth && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/90 backdrop-blur-xl animate-in fade-in duration-300" />
            <div className="relative w-full max-w-md bg-white dark:bg-[#0d0d0d] border border-slate-200 dark:border-white/10 rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col">
              <div className="bg-slate-50 dark:bg-white/5 p-8 text-center relative border-b border-slate-200 dark:border-white/5">
                <button onClick={() => setShowBmiPopup(false)} className="absolute top-6 right-6 text-gray-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
                <div className="text-6xl mb-4 drop-shadow-lg animate-bounce">{bmiRec.icon}</div>
                <h3 className="text-2xl font-black italic uppercase text-slate-800 dark:text-white leading-none">
                  {lang === 'th' ? "คุณยังไม่มีเป้าหมาย!" : "No Goal Set!"}
                </h3>
              </div>
              <div className="p-8 space-y-6 text-center">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{lang === 'th' ? "ผลวิเคราะห์ BMI ของคุณ" : "Your BMI Status"}</p>
                  <p className={`text-2xl font-black uppercase ${bmiRec.color}`}>{bmiRec.status}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                  <p className="text-sm text-slate-700 dark:text-gray-300 font-medium leading-relaxed italic">"{bmiRec.advice}"</p>
                </div>
                <button 
                  onClick={() => handleSaveGoal(bmiRec.suggestedGoal)}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 uppercase tracking-widest text-sm"
                >
                  <Target size={20} />
                  {lang === 'th' ? "ตั้งเป้าหมายตามนี้เลย" : "Accept Recommendation"}
                </button>
                <button onClick={() => setShowBmiPopup(false)} className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors underline underline-offset-4">
                  {lang === 'th' ? "ไว้ทีหลัง ขอตั้งค่าเอง" : "Maybe later, I'll set it myself"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 💡 SMART TIP MODAL */}
        {showTipModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/90 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setShowTipModal(false)} />
            <div className="relative w-full max-w-md bg-white dark:bg-[#0d0d0d] border border-slate-200 dark:border-white/10 rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
              {modalView === 'loading' ? (
                <div className="p-16 flex flex-col items-center justify-center space-y-6">
                  <RefreshCw className="animate-spin text-emerald-500" size={56} />
                  <p className="text-sm font-black text-gray-500 uppercase tracking-widest">{lang === 'th' ? "AI กำลังวิเคราะห์ข้อมูล..." : "AI Analyzing..."}</p>
                </div>
              ) : (
                <>
                  <div className="bg-emerald-500 p-8 text-center relative">
                    <button onClick={() => setShowTipModal(false)} className="absolute top-6 right-6 text-black/40 hover:text-black transition-colors"><X size={24} /></button>
                    <div className="text-6xl mb-4 drop-shadow-lg">{modalView === 'select' ? '🎯' : activeTip.icon}</div>
                    <h3 className="text-2xl font-black italic uppercase text-black leading-none">{modalView === 'select' ? (lang === 'th' ? "ตั้งค่าเป้าหมาย" : "Setting Goals") : (lang === 'th' ? "คำแนะนำจาก AI" : "AI Smart Advice")}</h3>
                  </div>

                  <div className="p-8 space-y-6">
                    {modalView === 'select' ? (
                      <div className="flex flex-col gap-4">
                        <div className="grid gap-3">
                          <GoalOption active={selectedGoal === 'weight_loss'} onClick={() => setSelectedGoal('weight_loss')} title={lang === 'th' ? "ลดน้ำหนัก" : "Loss Weight"} desc={lang === 'th' ? "เน้นคุมแคลอรี่และเบิร์นไขมัน" : "Focus on calorie deficit"} />
                          <GoalOption active={selectedGoal === 'health_maintenance'} onClick={() => setSelectedGoal('health_maintenance')} title={lang === 'th' ? "คุมน้ำหนัก / Normal" : "Normal / Maintain"} desc={lang === 'th' ? "เน้นความสมดุลและรักษาสุขภาพ" : "Focus on balance & health"} />
                          <GoalOption active={selectedGoal === 'muscle_gain'} onClick={() => setSelectedGoal('muscle_gain')} title={lang === 'th' ? "เพิ่มน้ำหนัก / สร้างกล้าม" : "Gain Weight / Muscle"} desc={lang === 'th' ? "เน้นโปรตีนและเพิ่มพลังงาน" : "Focus on protein surplus"} />
                        </div>
                        <button onClick={() => handleSaveGoal()} disabled={!selectedGoal} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 uppercase tracking-widest text-sm mt-2">
                          <Save size={20} /> {lang === 'th' ? "บันทึกและวิเคราะห์" : "Save & Analyze"}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <TipItem icon={<Utensils size={24}/>} title={lang === 'th' ? "โภชนาการ (Diet)" : "Nutrition Guide"} desc={activeTip.diet} />
                        <TipItem icon={<Dumbbell size={24}/>} title={lang === 'th' ? "การออกกำลังกาย (Workout)" : "Workout Plan"} desc={activeTip.workout} />
                        <TipItem icon={<Timer size={24}/>} title={lang === 'th' ? "คาร์ดิโอ (Cardio)" : "Cardio Focus"} desc={activeTip.cardio} />
                        <button onClick={() => { setModalView('select'); setSelectedGoal(null); }} className="w-full pt-4 border-t border-slate-100 dark:border-white/5 text-xs font-black uppercase text-gray-400 hover:text-emerald-500 transition-colors flex items-center justify-center gap-2">
                           <RefreshCw size={14} /> {lang === 'th' ? "เปลี่ยนเป้าหมายใหม่" : "Choose New Goal"}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function GoalOption({ onClick, active, title, desc }: any) {
  return (
    <button onClick={onClick} className={`w-full p-4 border rounded-2xl text-left flex items-center justify-between group transition-all ${active ? 'bg-emerald-500/10 border-emerald-500 shadow-md' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-emerald-500/50'}`}>
      <div>
        <p className={`font-black italic uppercase text-base ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>{title}</p>
        <p className={`text-xs font-bold uppercase tracking-tight mt-0.5 ${active ? 'text-emerald-600/70 dark:text-emerald-400/70' : 'text-gray-500'}`}>{desc}</p>
      </div>
      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${active ? 'border-emerald-500' : 'border-gray-300'}`}>
        {active && <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />}
      </div>
    </button>
  );
}

function TipItem({ icon, title, desc }: any) {
  return (
    <div className="flex gap-4 group">
      <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:scale-110 transition-transform">{icon}</div>
      <div className="space-y-1">
        <h5 className="text-base font-black uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-500">{title}</h5>
        <p className="text-[12px] text-slate-600 dark:text-gray-400 font-medium leading-relaxed italic">{desc}</p>
      </div>
    </div>
  );
}

function MacroCard({ label, val, goal, color, border, text, icon }: any) {
    return (
      <div className={`${color} border ${border} p-5 rounded-[2.5rem] flex flex-col items-center shadow-sm hover:scale-105 transition-transform`}>
        <div className={`mb-3 ${text} opacity-60`}>{icon}</div>
        <p className="text-[12px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">{label}</p>
        <p className={`text-2xl font-black tracking-tighter italic ${text}`}>{Math.round(val || 0)}<span className="text-xs opacity-40 ml-0.5">g</span></p>
        <div className="w-8 h-[1px] bg-slate-200 dark:bg-white/10 my-2"></div>
        <p className="text-[12px] font-bold text-gray-400 uppercase tracking-tighter">Goal: {goal}g</p>
      </div>
    );
}

function FeatureLink({ href, title, desc, icon, color }: any) {
  const colors: any = { emerald: "text-emerald-500 bg-emerald-500/10", sky: "text-sky-500 bg-sky-500/10", violet: "text-violet-500 bg-violet-500/10" };
  return (
    <Link href={href} className="flex items-center justify-between p-5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-[2.5rem] hover:bg-slate-50 dark:hover:bg-white/5 transition-all group shadow-sm active:scale-[0.98]">
      <div className="flex items-center gap-4">
        <div className={`h-16 w-16 rounded-2xl flex items-center justify-center ${colors[color]} transition-transform group-hover:rotate-6 shadow-sm`}>{icon}</div>
        <div><h5 className="text-base font-black text-slate-800 dark:text-white leading-none mb-1.5 uppercase italic">{title}</h5><p className="text-base text-gray-400 font-bold uppercase tracking-widest">{desc}</p></div>
      </div>
      <ChevronRight size={20} className="text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
    </Link>
  );
}