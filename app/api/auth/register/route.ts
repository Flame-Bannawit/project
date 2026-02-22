// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const {
      email,
      password,
      name,
      gender,
      birthDate, // "YYYY-MM-DD"
      heightCm,
      weightKg,
      activityLevel, // เช่น 1.2, 1.375, 1.55, 1.725, 1.9
    } = await req.json();

    // 1. ตรวจสอบข้อมูลเบื้องต้น
    if (!email || !password || !name || !gender || !birthDate || !heightCm || !weightKg) {
      return NextResponse.json({ error: "กรอกข้อมูลให้ครบทุกช่อง" }, { status: 400 });
    }

    await connectDB();

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "อีเมลนี้ถูกใช้ไปแล้ว" }, { status: 400 });
    }

    // 2. คำนวณอายุและเป้าหมายสุขภาพ (BMR & TDEE)
    const birth = new Date(birthDate);
    const age = new Date().getFullYear() - birth.getFullYear();
    const activity = parseFloat(activityLevel) || 1.2;

    // สูตร Mifflin-St Jeor
    let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
    bmr = gender === "male" ? bmr + 5 : bmr - 161;

    const tdee = Math.round(bmr * activity);

    // คำนวณสารอาหารเบื้องต้น (P: 25%, F: 25%, C: 50%)
    const proteinGoal = Math.round((tdee * 0.25) / 4);
    const fatGoal = Math.round((tdee * 0.25) / 9);
    const carbsGoal = Math.round((tdee * 0.50) / 4);

    // 3. Hash Password และสร้าง User
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: passwordHash,
      name,
      gender,
      birthDate: birth,
      heightCm,
      weightKg,
      activityLevel: activity,
      // บันทึกเป้าหมายที่คำนวณได้ลงใน DB ทันที
      dailyCalorieGoal: tdee,
      proteinGoal,
      fatGoal,
      carbsGoal,
    });

    // 4. สร้าง JWT และตั้งค่า Cookie
    const token = signToken({
      _id: user._id.toString(),
      email: user.email,
    });

    const res = NextResponse.json({
      ok: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        tdee: user.dailyCalorieGoal // ส่งกลับไปโชว์ที่หน้าบ้านได้เลย
      },
    });

    res.cookies.set("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 วัน
    });

    return res;
  } catch (err: any) {
    console.error("REGISTER ERROR:", err.message);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" }, { status: 500 });
  }
}