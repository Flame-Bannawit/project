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
      birthDate,    // "YYYY-MM-DD"
      heightCm,
      weightKg,
      activityLevel,
    } = await req.json();

    // เช็คกรอกครบ
    if (
      !email ||
      !password ||
      !name ||
      !gender ||
      !birthDate ||
      !heightCm ||
      !weightKg
    ) {
      return NextResponse.json(
        { error: "กรอกข้อมูลให้ครบทุกช่อง" },
        { status: 400 }
      );
    }

    await connectDB();

    // เช็คว่า email ซ้ำไหม
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: "อีเมลนี้ถูกใช้ไปแล้ว" },
        { status: 400 }
      );
    }

    // hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // สร้าง user ใหม่ (ปรับชื่อ field ให้ตรงกับ schema ของนาย ถ้า schema ใช้ passwordHash ก็เปลี่ยนชื่อ field ตรงนี้)
    const user = await User.create({
      email,
      password: passwordHash,
      name,
      gender,
      birthDate: new Date(birthDate),
      heightCm,
      weightKg,
      activityLevel: activityLevel ?? 3,
    });

    // สร้าง JWT
    const token = signToken({
      _id: user._id.toString(),
      email: user.email,
    });

    // response + set cookie
    const res = NextResponse.json({
      ok: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
    });

    res.cookies.set("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 วัน
    });

    return res;
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}
