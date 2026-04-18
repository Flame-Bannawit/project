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
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let daysToSubtract = range === "1m" ? 30 : range === "3m" ? 90 : 7;
    const startDate = new Date();
    startDate.setDate(now.getDate() - daysToSubtract);
    startDate.setHours(0, 0, 0, 0);

    // 📊 1. ดึงสถิติรายวัน (คงเดิมเพื่อ Home Graph)
    const usageStats = await MealLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $project: { thaiTime: { $add: ["$createdAt", 7 * 60 * 60 * 1000] } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$thaiTime" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 👥 2. ดึงยอด User ใหม่รายวัน (คงเดิมเพื่อ All User Graph)
    const userStats = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $project: { thaiTime: { $add: ["$createdAt", 7 * 60 * 60 * 1000] } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$thaiTime" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 🕒 3. 🆕 สถิติความถี่ช่วงเวลาการใช้งาน (Time Graph)
    const hourlyStats = await MealLog.aggregate([
      { $project: { hour: { $hour: { $add: ["$createdAt", 7 * 60 * 60 * 1000] } } } },
      { $group: { _id: "$hour", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // 🎂 4. 🆕 สถิติช่วงอายุตามที่อาจารย์ขอ (Age Graph)
    const allUsers = await User.find({}, "birthDate");
    const ageGroups = {
      "วัยเด็ก (6-15)": 0,
      "วัยรุ่น (16-24)": 0,
      "วัยทำงาน (25-60)": 0,
      "สูงอายุ (61+)": 0
    };

    allUsers.forEach(user => {
      if (user.birthDate) {
        const birthDate = new Date(user.birthDate);
        let age = now.getFullYear() - birthDate.getFullYear();
        const m = now.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age--;

        if (age >= 6 && age <= 15) ageGroups["วัยเด็ก (6-15)"]++;
        else if (age >= 16 && age <= 24) ageGroups["วัยรุ่น (16-24)"]++;
        else if (age >= 25 && age <= 60) ageGroups["วัยทำงาน (25-60)"]++;
        else if (age >= 61) ageGroups["สูงอายุ (61+)"]++;
      }
    });

    const [totalUsers, totalLogs, totalLogsToday] = await Promise.all([
      User.countDocuments(),
      MealLog.countDocuments(),
      MealLog.countDocuments({ createdAt: { $gte: todayStart } })
    ]);

    // --- จัดการข้อมูล Gap ของรายวัน (เหมือนเดิม) ---
    const usageMap = new Map(usageStats.map(i => [i._id, i.count]));
    const userMap = new Map(userStats.map(i => [i._id, i.count]));
    const fullUsageData = [];
    const fullUserData = [];
    let tempDate = new Date(startDate);

    while (tempDate <= now) {
      const year = tempDate.getFullYear();
      const month = String(tempDate.getMonth() + 1).padStart(2, '0');
      const day = String(tempDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const dayLabel = tempDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

      fullUsageData.push({ name: dayLabel, value: usageMap.get(dateStr) || 0 });
      fullUserData.push({ name: dayLabel, count: userMap.get(dateStr) || 0 });
      tempDate.setDate(tempDate.getDate() + 1);
    }

    // --- 🎯 จัดการข้อมูล Gap ของรายชั่วโมง (0-23) ---
    const hourlyMap = new Map(hourlyStats.map(i => [i._id, i.count]));
    const fullHourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${String(hour).padStart(2, '0')}:00`,
      count: hourlyMap.get(hour) || 0
    }));

    return NextResponse.json({
      summary: { totalUsers, totalLogs, totalLogsToday },
      charts: { 
        usage: fullUsageData, 
        userGrowth: fullUserData,
        hourly: fullHourlyData, // ส่งไปที่ Tab Time
        age: Object.entries(ageGroups).map(([name, value]) => ({ name, value })) // ส่งไปที่ Tab Age
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}