// app/api/admin/user-details/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import { MealLog } from "@/models/MealLog";
import getCurrentUser from "@/lib/auth";

export const dynamic = "force-dynamic";

// 🔍 [GET] ดึงประวัติอาหารรายบุคคล (ทั้งหมด)
export async function GET(req: Request) {
  try {
    const adminUser = (await getCurrentUser()) as any;
    
    const isAdmin = adminUser?.email === "useradmin@test.com" || adminUser?.role === "admin";
    if (!adminUser || !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    await connectDB();
    
    // ✅ ดึงรายการทั้งหมดเรียงจากใหม่ไปเก่า
    const logs = await MealLog.find({ userId }).sort({ createdAt: -1 });
    
    return NextResponse.json(logs);
  } catch (err: any) {
    console.error("GET User Details Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 📝 [PATCH] อัปเดตข้อมูลร่างกาย
export async function PATCH(req: Request) {
  try {
    const adminUser = (await getCurrentUser()) as any;
    
    const isAdmin = adminUser?.email === "useradmin@test.com" || adminUser?.role === "admin";
    if (!adminUser || !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, heightCm, weightKg } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    await connectDB();

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        heightCm: Number(heightCm), 
        weightKg: Number(weightKg) 
      },
      { new: true } 
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: any) {
    console.error("PATCH User Details Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}