// app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import getCurrentUser from "@/lib/auth";

export const dynamic = "force-dynamic"; // ✅ บังคับให้โหลดข้อมูลใหม่เสมอ

export async function GET() {
  try {
    const adminUser = (await getCurrentUser()) as any;
    
    // ตรวจสอบสิทธิ์แบบ Hybrid (ใช้อีเมลเป็นหลัก)
    const isAdmin = adminUser?.email === "useradmin@test.com" || adminUser?.role === "admin";

    if (!isAdmin) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    await connectDB();
    // ดึงรายชื่อ User ทุกคนมาแสดง (รวมแอดมินด้วยเพื่อเช็คว่าต่อ DB ติดไหม)
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    
    return NextResponse.json(users);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}