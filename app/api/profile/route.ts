import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import getCurrentUser from "@/lib/auth";

// ✅ ฟังก์ชันคำนวณสุขภาพที่แม่นยำ (Mifflin-St Jeor)
function calculateHealth(user: any) {
  // 1. คำนวณอายุ (Age)
  const birth = new Date(user.birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  // ป้องกันค่าอายุผิดพลาด (เช่น ใส่ปี พ.ศ.)
  if (age < 10 || age > 100) age = 25;

  // 2. คำนวณ BMR
  // สูตร: (10 * weight) + (6.25 * height) - (5 * age) + s (male: +5, female: -161)
  let bmr = (10 * user.weightKg) + (6.25 * user.heightCm) - (5 * age);
  bmr = user.gender === "male" ? bmr + 5 : bmr - 161;

  // 3. ตรวจสอบ Activity Level (ตัวคูณ TDEE)
  // หาก activityLevel ส่งมาเป็น 1, 2, 3... ให้แปลงเป็นตัวคูณมาตรฐาน
  let factor = Number(user.activityLevel);
  if (factor === 1) factor = 1.2;
  else if (factor === 2) factor = 1.375;
  else if (factor === 3) factor = 1.55;
  else if (factor === 4) factor = 1.725;
  else if (factor === 5) factor = 1.9;
  // ถ้าส่งมาเป็นตัวคูณอยู่แล้ว (เช่น 1.2) ให้ใช้ค่านั้นเลย
  else if (factor < 1) factor = 1.2; 

  const tdee = Math.round(bmr * factor);

  return { tdee };
}

export async function GET() {
  try {
    const authUser = await getCurrentUser() as any;
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const user = await User.findById(authUser._id || authUser.id);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // ✅ ส่งออกแบบ Flat ตามที่หน้า ProfilePage ต้องการ
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
    user.name = body.name || user.name;
    user.gender = body.gender || user.gender;
    user.birthDate = body.birthDate ? new Date(body.birthDate) : user.birthDate;
    user.heightCm = Number(body.heightCm) || user.heightCm;
    user.weightKg = Number(body.weightKg) || user.weightKg;
    user.activityLevel = Number(body.activityLevel) || user.activityLevel;

    // ✅ คำนวณ kcal และสารอาหารใหม่ทันที
    const { tdee } = calculateHealth(user);
    
    user.dailyCalorieGoal = tdee;
    user.proteinGoal = Math.round((tdee * 0.30) / 4); // Protein 30%
    user.fatGoal = Math.round((tdee * 0.25) / 9);     // Fat 25%
    user.carbsGoal = Math.round((tdee * 0.45) / 4);    // Carbs 45%

    await user.save();

    return NextResponse.json({ ok: true, profile: user });
  } catch (err) {
    return NextResponse.json({ error: "Update Failed" }, { status: 500 });
  }
}