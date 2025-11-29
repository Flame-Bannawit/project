// app/api/meal-logs/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { MealLog } from "@/models/MealLog";
// import getCurrentUser from "@/lib/auth"; // ถ้าอยากผูก user ด้วย

export async function POST(req: NextRequest) {
  try {
    const { logId, portion } = await req.json();

    if (!logId || !portion) {
      return NextResponse.json(
        { error: "logId and portion are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const log = await MealLog.findById(logId);
    if (!log) {
      return NextResponse.json(
        { error: "MealLog not found" },
        { status: 404 }
      );
    }

    if (!log.thaiDish) {
      return NextResponse.json(
        { error: "No thaiDish info in this MealLog" },
        { status: 400 }
      );
    }

    const base = log.thaiDish;

    const calories = base.baseCalories * portion;
    const protein = base.protein * portion;
    const fat = base.fat * portion;
    const carbs = base.carbs * portion;

    log.portion = portion;
    log.calories = calories;
    log.protein = protein;
    log.fat = fat;
    log.carbs = carbs;

    log.thaiDishId = base.id;
    log.thaiName = base.thaiName;

    // TODO: ถ้าอยากผูก user:
    // const user = await getCurrentUser();
    // if (user) log.userId = user._id;

    await log.save();

    return NextResponse.json({
      ok: true,
      logId: log._id.toString(),
      thaiName: log.thaiName,
      portion: log.portion,
      calories: log.calories,
      protein: log.protein,
      fat: log.fat,
      carbs: log.carbs,
    });
  } catch (err) {
    console.error("confirm-meal ERROR:", err);
    return NextResponse.json(
      { error: "Failed to confirm meal" },
      { status: 500 }
    );
  }
}
