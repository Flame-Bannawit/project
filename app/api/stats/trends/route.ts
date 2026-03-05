import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { MealLog } from "@/models/MealLog";
import getCurrentUser from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    // ดึงข้อมูลย้อนหลัง 90 วัน
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const logs = await MealLog.find({
      userId: authUser._id,
      loggedAt: { $gte: ninetyDaysAgo }
    }).sort({ loggedAt: 1 });

    // Group ข้อมูลตามวันที่ (ตัดรอบตี 3 เหมือนเดิม)
    const statsMap = new Map();

    logs.forEach(log => {
      const date = new Date(log.loggedAt || log.createdAt);
      if (date.getHours() < 3) date.setDate(date.getDate() - 1);
      const dateStr = date.toISOString().slice(0, 10);

      const existing = statsMap.get(dateStr) || { calories: 0, protein: 0, carbs: 0, fat: 0 };
      statsMap.set(dateStr, {
        calories: existing.calories + (log.totalCalories || 0),
        protein: existing.protein + (log.protein || 0),
        carbs: existing.carbs + (log.carbs || 0),
        fat: existing.fat + (log.fat || 0),
      });
    });

    const formattedData = Array.from(statsMap.entries()).map(([date, values]) => ({
      date,
      displayDate: new Date(date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' }),
      ...values
    }));

    return NextResponse.json(formattedData);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}