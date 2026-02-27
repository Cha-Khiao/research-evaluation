import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

// ฟังก์ชัน Middleware นี้จะทำงาน "ก่อน" ที่จะเปิดหน้าเว็บใดๆ
export async function middleware(req: NextRequest) {
  // ดึง Token ของผู้ใช้ (ดึงข้อมูล Session จากฝั่ง Server โดยตรง)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // ==========================================
  // กฎข้อที่ 1: สำหรับคนที่ "ยังไม่ได้ล็อกอิน"
  // ==========================================
  if (!token) {
    // ถ้าพยายามแอบเข้าหน้าอาจารย์ หรือ หน้านักศึกษา ให้เตะไปหน้า Login
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/student")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    // ปล่อยผ่านให้เข้าหน้า Landing (/), /login, /register ได้ปกติ
    return NextResponse.next();
  }

  // ==========================================
  // กฎข้อที่ 2: สำหรับคนที่ "ล็อกอินแล้ว"
  // ==========================================
  const role = token.role as string;

  // 2.1 ถ้าล็อกอินแล้ว แต่เผลอกดมาหน้า Landing, Login, Register ให้เตะกลับไปหน้าทำงานของตัวเอง
  if (pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/register")) {
    if (role === "TEACHER") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    } else if (role === "STUDENT") {
      return NextResponse.redirect(new URL("/student", req.url));
    }
  }

  // 2.2 กีดกันการข้ามสาย (Cross-Role Protection)
  // ถ้านักศึกษาแอบพิมพ์ URL เข้าหน้าอาจารย์ -> เตะกลับหน้านักศึกษา
  if (pathname.startsWith("/dashboard") && role !== "TEACHER") {
    return NextResponse.redirect(new URL("/student", req.url));
  }

  // ถ้าอาจารย์แอบพิมพ์ URL เข้าหน้านักศึกษา -> เตะกลับหน้าอาจารย์
  if (pathname.startsWith("/student") && role !== "STUDENT") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // ถ้าถูกสิทธิ์ทั้งหมด ปล่อยผ่าน!
  return NextResponse.next();
}

// กำหนดว่า Middleware นี้จะทำงานที่หน้าไหนบ้าง (Matcher)
export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/dashboard/:path*",
    "/student/:path*"
  ]
};