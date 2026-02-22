// app/api/meal-logs/route.ts
import { NextResponse } from "next/server";
import { MealLog } from "@/models/MealLog";
import { connectDB } from "@/lib/mongoose";
import getCurrentUser from "@/lib/auth"; // เช็ค Login

export async function GET() {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    
    // ดึงเฉพาะของ User คนนี้ และเรียงจากใหม่ไปเก่า
    const logs = await MealLog.find({ userId: authUser._id }).sort({ createdAt: -1 });
    
    return NextResponse.json(logs);
  } catch (err: any) {
    console.error("Meal Log Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}