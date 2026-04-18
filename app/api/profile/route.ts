import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import getCurrentUser from "@/lib/auth";

// ✅ ฟังก์ชันคำนวณสุขภาพที่สัมพันธ์กับ Goal
function calculateHealth(user: any) {
  // 1. คำนวณอายุ (Age)
  const birth = new Date(user.birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  if (age < 10 || age > 100) age = 25;

  // 2. คำนวณ BMR (Mifflin-St Jeor)
  let bmr = (10 * user.weightKg) + (6.25 * user.heightCm) - (5 * age);
  bmr = user.gender === "male" ? bmr + 5 : bmr - 161;

  // 3. Activity Factor
  let factor = Number(user.activityLevel);
  // Map ค่ากรณีส่งมาเป็นลำดับ 1-5
  const factors: any = { 1: 1.2, 2: 1.375, 3: 1.55, 4: 1.725, 5: 1.9 };
  if (factors[factor]) factor = factors[factor];
  else if (factor < 1) factor = 1.2; 

  let tdee = Math.round(bmr * factor);

  // 🎯 4. ปรับ TDEE ตามเป้าหมาย (Goal)
  if (user.goal === 'weight_loss') tdee -= 500;
  else if (user.goal === 'muscle_gain') tdee += 300;

  return { tdee };
}

export async function GET() {
  try {
    const authUser = await getCurrentUser() as any;
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const user = await User.findById(authUser._id || authUser.id);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        gender: user.gender,
        birthDate: user.birthDate,
        heightCm: user.heightCm,
        weightKg: user.weightKg,
        activityLevel: user.activityLevel,
        goal: user.goal || 'none', // ✅ ส่งเป้าหมายออกไปให้หน้าบ้าน
        dailyCalorieGoal: user.dailyCalorieGoal || 2000,
        proteinGoal: user.proteinGoal || 0,
        fatGoal: user.fatGoal || 0,
        carbsGoal: user.carbsGoal || 0,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authUser = await getCurrentUser() as any;
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    await connectDB();

    const user = await User.findById(authUser._id || authUser.id);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // อัปเดตข้อมูลเบื้องต้น
    if (body.name) user.name = body.name;
    if (body.gender) user.gender = body.gender;
    if (body.birthDate) user.birthDate = new Date(body.birthDate);
    if (body.heightCm) user.heightCm = Number(body.heightCm);
    if (body.weightKg) user.weightKg = Number(body.weightKg);
    if (body.activityLevel) user.activityLevel = Number(body.activityLevel);
    
    // ✅ รับค่า Goal ถ้าหน้าบ้านส่งมา
    if (body.goal) user.goal = body.goal;

    // 🔄 คำนวณ kcal ใหม่ตามเป้าหมาย
    const { tdee } = calculateHealth(user);
    user.dailyCalorieGoal = tdee;

    // 🥩 ปรับสารอาหารตามเป้าหมาย (Macros Logic)
    if (user.goal === 'muscle_gain') {
      user.proteinGoal = Math.round((tdee * 0.35) / 4);
      user.fatGoal = Math.round((tdee * 0.25) / 9);
      user.carbsGoal = Math.round((tdee * 0.40) / 4);
    } else if (user.goal === 'weight_loss') {
      user.proteinGoal = Math.round((tdee * 0.40) / 4);
      user.fatGoal = Math.round((tdee * 0.25) / 9);
      user.carbsGoal = Math.round((tdee * 0.35) / 4);
    } else {
      user.proteinGoal = Math.round((tdee * 0.30) / 4);
      user.fatGoal = Math.round((tdee * 0.30) / 9);
      user.carbsGoal = Math.round((tdee * 0.40) / 4);
    }

    // 🔥 เปลี่ยนมาใช้ updateOne บังคับบันทึกลง Database ตรงๆ ทะลุกำแพง Cache!
    await User.updateOne({ _id: user._id }, {
      $set: {
        name: user.name,
        gender: user.gender,
        birthDate: user.birthDate,
        heightCm: user.heightCm,
        weightKg: user.weightKg,
        activityLevel: user.activityLevel,
        goal: user.goal,
        dailyCalorieGoal: user.dailyCalorieGoal,
        proteinGoal: user.proteinGoal,
        fatGoal: user.fatGoal,
        carbsGoal: user.carbsGoal
      }
    });

    return NextResponse.json({ ok: true, profile: user });
  } catch (err) {
    console.error("PUT Profile Error:", err);
    return NextResponse.json({ error: "Update Failed" }, { status: 500 });
  }
}

// ✅ เพิ่ม PATCH เพื่อรองรับการยิงจาก Dashboard (เผื่อไว้)
export async function PATCH(req: NextRequest) {
  return PUT(req);
}