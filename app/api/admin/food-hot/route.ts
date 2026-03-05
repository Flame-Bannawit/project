import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { MealLog } from "@/models/MealLog";
import getCurrentUser from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const adminUser = (await getCurrentUser()) as any;
    // เช็คสิทธิ์ Admin เหมือนหน้าอื่นๆ
    const isAdmin = adminUser?.email === "useradmin@test.com" || adminUser?.role === "admin";
    if (!isAdmin) return NextResponse.json({ error: "Access Denied" }, { status: 403 });

    await connectDB();

    // 📈 ใช้ Aggregate จัดกลุ่มข้อมูล
    const hotMenus = await MealLog.aggregate([
      {
        $group: {
          _id: "$foodName", // จัดกลุ่มตามชื่ออาหาร
          count: { $sum: 1 }, // นับจำนวนครั้งที่พบ
          avgCalories: { $avg: "$totalCalories" }, // หาค่าเฉลี่ยแคลอรี่
          sampleImage: { $first: "$imageUrl" } // เอารูปภาพตัวอย่างมา 1 รูป
        }
      },
      { $sort: { count: -1 } }, // เรียงจากมากไปน้อย
      { $limit: 10 } // เอาแค่ Top 10
    ]);

    return NextResponse.json(hotMenus);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}