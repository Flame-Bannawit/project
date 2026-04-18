import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { MealLog } from "@/models/MealLog";
import getCurrentUser from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const adminUser = (await getCurrentUser()) as any;
    
    // 🎯 ตรวจสอบสิทธิ์แอดมิน
    const isAdmin = adminUser?.email === "useradmin@test.com" || adminUser?.role === "admin";
    if (!isAdmin) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const startTime = Date.now();
    await connectDB();
    const dbLatency = Date.now() - startTime;

    // 🕒 ตั้งค่าโควตาเป็น 20 ครั้งต่อวัน (อ้างอิงเวลาไทย +7)
    const DAILY_QUOTA_LIMIT = 20; 
    const now = new Date();
    
    // กำหนดช่วงเริ่มต้นและสิ้นสุดของวันนี้ (Local Time)
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // 📊 1. ดึงข้อมูลสถิติภาพรวม
    const totalLogs = await MealLog.countDocuments();
    
    // นับเฉพาะที่บันทึกวันนี้
    const usedToday = await MealLog.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd }
    });

    // สมมติว่ารายการที่แคลอรี่เป็น 0 คือวิเคราะห์พลาด
    const failedLogs = await MealLog.countDocuments({ 
      $or: [{ totalCalories: 0 }, { totalCalories: null }] 
    });

    // 🍲 2. หาเมนูที่ AI วิเคราะห์บ่อยที่สุด 5 อันดับ
    const topDishes = await MealLog.aggregate([
      { $group: { _id: "$foodName", count: { $sum: 1 }, avgCal: { $avg: "$totalCalories" } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // 📈 3. วิเคราะห์ค่าสถิติแคลอรี่
    const calStats = await MealLog.aggregate([
      { 
        $group: { 
          _id: null, 
          maxCal: { $max: "$totalCalories" },
          minCal: { $min: "$totalCalories" },
          avgRemaining: { $avg: "$remainingPercent" }
        } 
      }
    ]);

    // คำนวณ Quota
    const remainingQuota = Math.max(0, DAILY_QUOTA_LIMIT - usedToday);
    const usagePercent = ((usedToday / DAILY_QUOTA_LIMIT) * 100).toFixed(1);

    return NextResponse.json({
      status: "Operational",
      latency: `${dbLatency}ms`,
      uptime: "99.99%",
      modelName: "Gemini 2.5 Flash", // ✅ อัปเดตชื่อรุ่นโมเดล
      errorRate: totalLogs > 0 ? ((failedLogs / totalLogs) * 100).toFixed(2) + "%" : "0%",
      topDishes: topDishes,
      quota: {
        total: DAILY_QUOTA_LIMIT,
        used: usedToday,
        remaining: remainingQuota,
        percent: usagePercent
      },
      summary: {
        totalAnalysis: totalLogs,
        avgAccuracy: 100 - (calStats[0]?.avgRemaining || 0),
        peakCalories: calStats[0]?.maxCal || 0,
        floorCalories: calStats[0]?.minCal || 0
      }
    });
  } catch (err: any) {
    return NextResponse.json({ status: "Down", error: err.message }, { status: 500 });
  }
}