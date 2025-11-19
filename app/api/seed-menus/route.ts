// app/api/seed-menus/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Menu } from "@/models/Menu";

const SAMPLE_MENUS = [
  {
    nameTh: "ข้าวกะเพราไก่ไข่ดาว",
    nameEn: "stir-fried chicken with holy basil on rice + fried egg",
    category: "rice",
    kcal: 650,
    protein: 32,
    carb: 70,
    fat: 25,
  },
  {
    nameTh: "ข้าวผัดหมู",
    nameEn: "fried rice with pork",
    category: "rice",
    kcal: 550,
    protein: 20,
    carb: 65,
    fat: 18,
  },
  {
    nameTh: "ข้าวมันไก่",
    nameEn: "hainanese chicken rice",
    category: "rice",
    kcal: 650,
    protein: 25,
    carb: 70,
    fat: 24,
  },
  {
    nameTh: "ก๋วยเตี๋ยวเรือน้ำตกหมู",
    nameEn: "thai boat noodle with pork",
    category: "noodle",
    kcal: 450,
    protein: 20,
    carb: 50,
    fat: 15,
  },
];

export async function POST(_req: NextRequest) {
  await connectDB();

  await Menu.deleteMany({});
  const docs = await Menu.insertMany(SAMPLE_MENUS);

  return NextResponse.json({ inserted: docs.length });
}
