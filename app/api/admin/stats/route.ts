import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import { MealLog } from "@/models/MealLog";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "7d";
    await connectDB();

    const now = new Date();
    let daysToSubtract = range === "1m" ? 30 : range === "3m" ? 90 : 7;
    const startDate = new Date();
    startDate.setDate(now.getDate() - daysToSubtract);
    startDate.setHours(0, 0, 0, 0);

    // ดึงข้อมูล 1.ผู้ใช้ทั้งหมด 2.บันทึกทั้งหมด 3.สถิติการสแกนรายวัน
    const [totalUsers, totalLogs, usageStats] = await Promise.all([
      User.countDocuments(),
      MealLog.countDocuments(),
      MealLog.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { 
          $group: { 
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
            count: { $sum: 1 } 
          } 
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // จัดการข้อมูลให้ครบทุกวัน (ถ้าวันไหนไม่มีสแกนให้เป็น 0)
    const usageMap = new Map(usageStats.map(i => [i._id, i.count]));
    const fullUsageData = [];
    let tempDate = new Date(startDate);

    while (tempDate <= now) {
      const dateStr = tempDate.toISOString().split('T')[0];
      const dayLabel = tempDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }); // เช่น "27 Feb"
      
      fullUsageData.push({ 
        name: dayLabel, 
        value: usageMap.get(dateStr) || 0 
      });
      
      tempDate.setDate(tempDate.getDate() + 1);
    }

    return NextResponse.json({
      summary: { totalUsers, totalLogs },
      charts: { usage: fullUsageData }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}