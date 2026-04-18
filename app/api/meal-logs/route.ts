// app/api/meal-logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { MealLog } from "@/models/MealLog";
import { connectDB } from "@/lib/mongoose";
import getCurrentUser from "@/lib/auth";

export async function GET() {
  try {
    const authUser = await getCurrentUser() as any;
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    
    // ดึงเฉพาะของ User คนนี้ และเรียงจากใหม่ไปเก่า
    const logs = await MealLog.find({ userId: authUser._id || authUser.id }).sort({ createdAt: -1 });
    
    return NextResponse.json(logs);
  } catch (err: any) {
    console.error("Meal Log Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// 🆕 เพิ่มฟังก์ชัน PUT สำหรับกดบันทึกมื้ออาหาร (Save to Log)
export async function PUT(req: NextRequest) {
  try {
    const authUser = await getCurrentUser() as any;
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { logIds, portion, isSaved } = body;

    if (!logIds || !Array.isArray(logIds)) {
      return NextResponse.json({ error: "Invalid log IDs" }, { status: 400 });
    }

    await connectDB();

    // วนลูปอัปเดตข้อมูลทุกๆ รูป (ในกรณีถ่ายพร้อมกันหลายรูป)
    for (const id of logIds) {
      const meal = await MealLog.findById(id);
      if (meal && meal.userId.toString() === (authUser._id || authUser.id).toString()) {
        meal.isSaved = isSaved;
        if (portion !== undefined) {
          meal.portion = portion;
          // คำนวณแคลอรี่และสารอาหารใหม่ตามจำนวนจาน (Portion)
          meal.calories = Math.round(meal.thaiDish.originalCalories * portion);
          meal.totalCalories = meal.calories;
          meal.protein = Number((meal.thaiDish.originalProtein * portion).toFixed(1));
          meal.fat = Number((meal.thaiDish.originalFat * portion).toFixed(1));
          meal.carbs = Number((meal.thaiDish.originalCarbs * portion).toFixed(1));
        }
        await meal.save();
      }
    }

    return NextResponse.json({ success: true, message: "Meals saved successfully" });
  } catch (err: any) {
    console.error("Meal Log PUT Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}