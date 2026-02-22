// app/api/admin/stats/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User, { IUser } from "@/models/User";
import { MealLog } from "@/models/MealLog"; 
import getCurrentUser from "@/lib/auth";

export async function GET() {
  try {
    const adminUser = (await getCurrentUser()) as any;
    
    // 🔥 แก้เงื่อนไขให้ยอมรับ email แอดมินด้วย เพื่อเลี่ยงปัญหา Role ไม่ซิงก์
    const isAdminEmail = adminUser?.email === "useradmin@test.com";
    const hasAdminRole = adminUser?.role === "admin";

    if (!adminUser || (!isAdminEmail && !hasAdminRole)) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    await connectDB();

    // ดึงข้อมูลสรุป
    const [totalUsers, totalLogs, recentLogs] = await Promise.all([
      User.countDocuments({ role: 'user' }), 
      MealLog.countDocuments({ totalCalories: { $gt: 0 } }), 
      MealLog.find({ totalCalories: { $gt: 0 } })
        .sort({ createdAt: -1 })
        .limit(8) 
    ]);

    // คำนวณแคลอรี่เฉลี่ย
    const avgCalResult = await MealLog.aggregate([
      { $match: { totalCalories: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: "$totalCalories" } } }
    ]);

    return NextResponse.json({
      summary: {
        totalUsers,
        totalLogs,
        avgCalories: avgCalResult[0]?.avg || 0
      },
      recentLogs
    });
  } catch (err: any) {
    console.error("Admin Stats API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}