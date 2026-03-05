// app/api/admin/all-members/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import { MealLog } from "@/models/MealLog"; // นำเข้าเพื่อลบประวัติการกินด้วย
import getCurrentUser from "@/lib/auth";

export const dynamic = "force-dynamic";

// 🔍 1. ฟังก์ชันดึงรายชื่อทั้งหมด (เดิม)
export async function GET() {
  try {
    const adminUser = (await getCurrentUser()) as any;
    const isAdmin = adminUser?.email === "useradmin@test.com" || adminUser?.role === "admin";

    if (!isAdmin) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    await connectDB();
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    
    return NextResponse.json(users);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 🗑️ 2. ฟังก์ชันลบ User (เพิ่มใหม่)
export async function DELETE(req: Request) {
  try {
    const adminUser = (await getCurrentUser()) as any;
    const isAdmin = adminUser?.email === "useradmin@test.com" || adminUser?.role === "admin";

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // ดึง id จาก Query String (?id=...)
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing User ID" }, { status: 400 });
    }

    await connectDB();

    // ลบข้อมูลที่เกี่ยวข้องเพื่อไม่ให้ค้างใน Database
    await MealLog.deleteMany({ userId: id }); 
    
    // ลบตัว User
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "ลบผู้ใช้งานเรียบร้อยแล้ว" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}