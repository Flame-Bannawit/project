// app/admin/layout.tsx
import { redirect } from "next/navigation";
import getCurrentUser from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser() as any;

  // 🕵️‍♂️ DEBUG ยังคงไว้เพื่อดูสถานะ
  console.log("--- ADMIN AUTH DEBUG ---");
  if (!user) {
    console.log("❌ ไม่พบ User ในระบบ");
  } else {
    console.log("✅ พบ User:", user.email);
    console.log("🔑 Role:", user.role);
  }
  console.log("------------------------");

  // 🔥 แก้ไขเงื่อนไขตรงนี้: ยอมให้เข้าได้ถ้าเป็น admin หรือเป็นอีเมลที่คุณกำหนด
  const isAdminEmail = user?.email === "useradmin@test.com";
  const hasAdminRole = user?.role === "admin";

  if (!user || (!isAdminEmail && !hasAdminRole)) {
    // ถ้าไม่ใช่ทั้งอีเมลแอดมิน และไม่มี Role แอดมิน ให้ดีดออก
    redirect("/"); 
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {children}
    </div>
  );
}