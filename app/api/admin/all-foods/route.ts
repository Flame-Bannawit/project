import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { MealLog } from "@/models/MealLog";
import getCurrentUser from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const adminUser = (await getCurrentUser()) as any;
    const isAdmin = adminUser?.email === "useradmin@test.com" || adminUser?.role === "admin";

    if (!isAdmin) return NextResponse.json({ error: "Access Denied" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    await connectDB();

    let query: any = { totalCalories: { $gt: 0 } };

    // 📅 กรองวันที่ถ้ามีการส่งมา
    if (start && end) {
      query.createdAt = {
        $gte: new Date(start),
        $lte: new Date(new Date(end).setHours(23, 59, 59))
      };
    }

    // ดึง 50 รายการล่าสุด
    const logs = await MealLog.find(query)
      .sort({ createdAt: -1 })
      .limit(50);
      
    return NextResponse.json(logs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}