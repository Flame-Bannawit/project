// app/api/meal-logs/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { MealLog } from "@/models/MealLog";
import getCurrentUser from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { logId, portion } = await req.json();
    const authUser = await getCurrentUser();
    
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const log = await MealLog.findById(logId);
    if (!log || !log.thaiDish) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const base = log.thaiDish;
    const cal = base.baseCalories * portion;

    log.portion = portion;
    log.calories = cal;
    log.totalCalories = cal; 
    log.protein = base.protein * portion;
    log.fat = base.fat * portion;
    log.carbs = base.carbs * portion;
    log.foodName = base.thaiName;
    log.thaiName = base.thaiName;
    log.userId = authUser._id;
    
    // ✅ บันทึกเวลา ณ ตอนที่กดยืนยันกินจริง
    log.loggedAt = new Date(); 

    await log.save();

    return NextResponse.json({ ok: true, calories: cal });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}