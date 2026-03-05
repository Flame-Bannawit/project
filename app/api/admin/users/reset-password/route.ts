import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import getCurrentUser from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const adminUser = (await getCurrentUser()) as any;
    
    // 🛡️ เช็คสิทธิ์ Admin
    const isAdmin = adminUser?.email === "useradmin@test.com" || adminUser?.role === "admin";
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized Access" }, { status: 403 });
    }

    const { userId, newPassword } = await req.json();

    if (!userId || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
    }

    await connectDB();

    // 🔒 Hash รหัสผ่านใหม่ก่อนบันทึก (สำคัญมาก!)
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้งานรายนี้" }, { status: 404 });
    }

    return NextResponse.json({ message: "Reset Password Success" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}