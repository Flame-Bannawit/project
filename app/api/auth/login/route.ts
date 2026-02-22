// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // 1. รับข้อมูลจากหน้าบ้าน
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "กรุณากรอกอีเมลและรหัสผ่าน" },
        { status: 400 }
      );
    }

    // 2. ค้นหา User จาก Email ในฐานข้อมูล
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "ไม่พบผู้ใช้งานด้วยอีเมลนี้" },
        { status: 401 }
      );
    }

    // 3. ตรวจสอบรหัสผ่าน (เทียบรหัสที่พิมพ์มา กับตัวที่ Hash ไว้ใน DB)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "รหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // 4. สร้าง JWT Token
    const token = signToken({
      _id: user._id.toString(),
      email: user.email,
    });

    // 5. ส่ง Response กลับไปพร้อมตั้งค่า Cookie
    const res = NextResponse.json({
      ok: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
    });

    // เก็บ Token ไว้ใน Cookie (HttpOnly เพื่อความปลอดภัย)
    res.cookies.set("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 วัน
    });

    return res;
  } catch (err: any) {
    console.error("LOGIN API ERROR:", err.message);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}