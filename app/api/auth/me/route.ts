// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    // 🔍 ไปหยิบกุญแจชื่อ auth_token มาดู
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      // ❌ ถ้าไม่มีกุญแจ บอกหน้า Analyze ว่า "ยังไม่ได้ล็อคอิน"
      return NextResponse.json({ isLoggedIn: false }, { status: 200 });
    }

    // ✅ ถ้ามีกุญแจ บอกหน้า Analyze ว่า "ล็อคอินแล้วจ้า"
    return NextResponse.json({ isLoggedIn: true }, { status: 200 });
  } catch (err) {
    console.error("Check Auth Error:", err);
    return NextResponse.json({ isLoggedIn: false }, { status: 500 });
  }
}