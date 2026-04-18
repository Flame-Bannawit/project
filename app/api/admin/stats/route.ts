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
    // ปรับเวลาไทย (+7) เพื่อหาจุดเริ่มต้นของวันนี้ให้แม่นยำ
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let daysToSubtract = range === "1m" ? 30 : range === "3m" ? 90 : 7;
    const startDate = new Date();
    startDate.setDate(now.getDate() - daysToSubtract);
    startDate.setHours(0, 0, 0, 0);

    // 📊 1. ดึงสถิติรายวัน (ใช้ localTime เพื่อให้ตรงกับเวลาไทย)
    const usageStats = await MealLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $project: {
          thaiTime: { $add: ["$createdAt", 7 * 60 * 60 * 1000] }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$thaiTime" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 👥 2. ดึงยอด User ใหม่รายวัน
    const userStats = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $project: { thaiTime: { $add: ["$createdAt", 7 * 60 * 60 * 1000] } }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$thaiTime" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const [totalUsers, totalLogs, totalLogsToday] = await Promise.all([
      User.countDocuments(),
      MealLog.countDocuments(),
      MealLog.countDocuments({ createdAt: { $gte: todayStart } }) // ยอดสแกนวันนี้จริง
    ]);

    // 🎯 จัดการข้อมูลให้ครบทุกวัน (Filling Gaps)
    const usageMap = new Map(usageStats.map(i => [i._id, i.count]));
    const userMap = new Map(userStats.map(i => [i._id, i.count]));
    
    const fullUsageData = [];
    const fullUserData = [];
    let tempDate = new Date(startDate);

    // วน Loop สร้างข้อมูลรายวันจนถึง "วันนี้"
    while (tempDate <= now) {
      const year = tempDate.getFullYear();
      const month = String(tempDate.getMonth() + 1).padStart(2, '0');
      const day = String(tempDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`; // Format: YYYY-MM-DD ตรงกับ $group _id
      
      const dayLabel = tempDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

      fullUsageData.push({ 
        name: dayLabel, 
        value: usageMap.get(dateStr) || 0 
      });

      fullUserData.push({
        name: dayLabel,
        count: userMap.get(dateStr) || 0
      });

      tempDate.setDate(tempDate.getDate() + 1);
    }

    return NextResponse.json({
      summary: { totalUsers, totalLogs, totalLogsToday },
      charts: { usage: fullUsageData, userGrowth: fullUserData }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}