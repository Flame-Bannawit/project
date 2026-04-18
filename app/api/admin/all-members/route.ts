// app/api/admin/all-members/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import { MealLog } from "@/models/MealLog"; 
import getCurrentUser from "@/lib/auth";

export const dynamic = "force-dynamic";

// 🔍 1. ฟังก์ชันดึงรายชื่อทั้งหมด พร้อมนับจำนวนมื้ออาหาร
export async function GET() {
  try {
    const adminUser = (await getCurrentUser()) as any;
    const isAdmin = adminUser?.email === "useradmin@test.com" || adminUser?.role === "admin";

    if (!isAdmin) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    await connectDB();

    // 🎯 ใช้ Aggregation เพื่อรวมข้อมูลจำนวนมื้ออาหาร (Activity)
    const usersWithStats = await User.aggregate([
      {
        $lookup: {
          from: "meallogs", // ชื่อคอลเลกชันใน MongoDB
          localField: "_id",
          foreignField: "userId",
          as: "meals"
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          role: 1,
          heightCm: 1,
          weightKg: 1,
          createdAt: 1,
          // 🔢 นับจำนวนมื้ออาหารใส่ในตัวแปร totalMealLogs
          totalMealLogs: { $size: "$meals" }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);
    
    return NextResponse.json(usersWithStats);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 🗑️ 2. ฟังก์ชันลบ User
export async function DELETE(req: Request) {
  try {
    const adminUser = (await getCurrentUser()) as any;
    const isAdmin = adminUser?.email === "useradmin@test.com" || adminUser?.role === "admin";

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing User ID" }, { status: 400 });
    }

    await connectDB();

    // ลบประวัติการกินทั้งหมดของ User คนนี้ก่อน
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