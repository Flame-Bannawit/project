// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // 🛡️ ป้องกัน Browser จำ Cache หน้าที่มีข้อมูลส่วนตัว (Profile)
  // วิธีนี้จะทำให้เวลาคุณกด Logout แล้วกด Back กลับมา Browser จะถูกบังคับให้ไปเช็คกับ Server ใหม่เสมอ
  if (request.nextUrl.pathname.startsWith('/profile')) {
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
  }

  return response
}

// กำหนดให้ Middleware ทำงานเฉพาะหน้าที่เราต้องการเพื่อประหยัด Resource
export const config = {
  matcher: ['/profile/:path*', '/admin/:path*'],
}