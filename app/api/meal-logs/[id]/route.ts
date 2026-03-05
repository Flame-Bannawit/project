import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { MealLog } from "@/models/MealLog";
import getCurrentUser from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { remainingPercent } = await req.json();

    await connectDB();
    const log = await MealLog.findOne({ _id: id, userId: authUser._id });
    if (!log) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

    // 1. 🛡️ ป้องกัน NaN โดยการบังคับให้เป็นตัวเลขเสมอ
    // ถ้าไม่มีค่า original ให้ถอยไปใช้ค่าปัจจุบัน ถ้าไม่มีเลยให้ใช้ 0
    const base = {
      cal: Number(log.thaiDish?.originalCalories ?? log.calories ?? log.totalCalories ?? 0),
      pro: Number(log.thaiDish?.originalProtein ?? log.protein ?? 0),
      fat: Number(log.thaiDish?.originalFat ?? log.fat ?? 0),
      carb: Number(log.thaiDish?.originalCarbs ?? log.carbs ?? 0)
    };

    // 2. 🔐 ตรวจสอบและซ่อมแซม "ตู้เซฟ" (original data)
    // หากบันทึกครั้งแรก AI ไม่ได้ส่งค่า original มา ให้สร้างไว้ตอนนี้เลย
    if (!log.thaiDish) log.thaiDish = {};
    
    if (!log.thaiDish.originalCalories || log.thaiDish.originalCalories === 0) {
      log.thaiDish.originalCalories = base.cal;
      log.thaiDish.originalProtein = base.pro;
      log.thaiDish.originalFat = base.fat;
      log.thaiDish.originalCarbs = base.carb;
    }

    // 3. ⚖️ คำนวณตามสัดส่วนที่กินจริง
    const eatenFactor = (100 - Number(remainingPercent)) / 100;

    // 4. 📝 อัปเดตข้อมูล และป้องกัน NaN อีกชั้นด้วย Math.round(Number)
    log.calories = Math.round(base.cal * eatenFactor) || 0;
    log.totalCalories = log.calories;
    log.protein = Math.round(base.pro * eatenFactor) || 0;
    log.fat = Math.round(base.fat * eatenFactor) || 0;
    log.carbs = Math.round(base.carb * eatenFactor) || 0;
    
    // 5. บันทึกสถานะ
    log.remainingPercent = Number(remainingPercent);

    // แจ้ง Mongoose ว่ามีการแก้ไข Object ภายใน
    log.markModified('thaiDish');

    await log.save();
    
    console.log(`✅ Updated Log ${id}: Eaten ${100 - remainingPercent}%`);
    
    return NextResponse.json({ success: true, updatedLog: log });
  } catch (err: any) {
    console.error("PATCH ERROR DETAIL:", err); // พิมพ์ Error ตัวเต็มออกมาดู
    return NextResponse.json({ error: `API ERROR: ${err.message}` }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    await connectDB();
    await MealLog.findOneAndDelete({ _id: id, userId: authUser._id });
    return NextResponse.json({ success: true });
  } catch (err: any) { 
    return NextResponse.json({ error: "DELETE ERROR" }, { status: 500 }); 
  }
}