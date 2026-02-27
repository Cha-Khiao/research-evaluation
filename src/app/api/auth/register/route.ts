import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
    }

    const lowerEmail = email.toLowerCase();

    // 🚨 1. บังคับว่าต้องลงท้ายด้วย @eval.ac.th เท่านั้น!
    if (!lowerEmail.endsWith('@eval.ac.th')) {
      return NextResponse.json({ error: "ต้องใช้อีเมลของระบบ (@eval.ac.th) เท่านั้น" }, { status: 400 });
    }

    // 🚨 2. แยกส่วนหน้า @ ออกมาตรวจสอบ
    const emailPrefix = lowerEmail.split('@')[0];
    
    // ตรวจสอบว่าเป็นตัวเลขล้วน (รหัสนักศึกษา) หรือไม่
    const isNumbersOnly = /^[0-9]+$/.test(emailPrefix); 
    
    // ถ้าเป็นตัวเลขล้วน -> นักศึกษา / ถ้ามีตัวอักษรผสม -> อาจารย์
    const assignedRole = isNumbersOnly ? "STUDENT" : "TEACHER";

    await connectToDatabase();

    const existingUser = await User.findOne({ email: lowerEmail });
    if (existingUser) {
      return NextResponse.json({ error: "อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email: lowerEmail,
      password: hashedPassword,
      role: assignedRole
    });

    return NextResponse.json({ 
      message: `สมัครสมาชิกสำเร็จ! สถานะของคุณคือ: ${assignedRole === 'TEACHER' ? 'อาจารย์ผู้สอน' : 'นักศึกษา'}` 
    }, { status: 201 });
    
  } catch (error) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการสมัครสมาชิก" }, { status: 500 });
  }
}