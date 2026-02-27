import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Room } from "@/models/Room";
import { Group } from "@/models/Group";

// สุ่มรหัสเข้าห้อง 6 หลัก (ตัวพิมพ์ใหญ่ + ตัวเลข)
const generateJoinCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// 1. ดึงข้อมูลห้องเรียนทั้งหมดของอาจารย์ท่านนั้น
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get("teacherId");

    if (!teacherId) return NextResponse.json({ error: "ระบุข้อมูลไม่ครบถ้วน" }, { status: 400 });

    await connectToDatabase();
    // ดึงห้องเรียงจากสร้างล่าสุดไปเก่าสุด
    const rooms = await Room.find({ teacherId }).sort({ createdAt: -1 }); 
    
    return NextResponse.json(rooms, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "ดึงข้อมูลห้องเรียนล้มเหลว" }, { status: 500 });
  }
}

// 2. สร้างห้องเรียนใหม่
export async function POST(req: Request) {
  try {
    const { name, teacherId } = await req.json();

    if (!name || !teacherId) return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });

    await connectToDatabase();
    
    let joinCode = generateJoinCode();
    // เช็คว่ารหัสซ้ำไหม (เผื่อบังเอิญสุ่มได้ตัวเดิม)
    let isDuplicate = await Room.findOne({ joinCode });
    while (isDuplicate) {
      joinCode = generateJoinCode();
      isDuplicate = await Room.findOne({ joinCode });
    }

    const newRoom = await Room.create({
      name,
      teacherId,
      joinCode,
      evaluationForm: [], // เริ่มต้นเป็นฟอร์มว่างๆ
      isOpen: true
    });

    return NextResponse.json({ message: "สร้างห้องเรียนสำเร็จ!", room: newRoom }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "สร้างห้องเรียนล้มเหลว" }, { status: 500 });
  }
}

// 3. ลบห้องเรียน
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) return NextResponse.json({ error: "ไม่พบรหัสห้อง" }, { status: 400 });

    await connectToDatabase();
    
    // ลบห้องเรียน
    await Room.findByIdAndDelete(roomId);
    
    // ทริคเสริม: ลบกลุ่มทั้งหมดที่อยู่ในห้องนี้ทิ้งด้วย เพื่อไม่ให้ข้อมูลขยะตกค้าง
    await Group.deleteMany({ roomId });

    return NextResponse.json({ message: "ลบห้องเรียนสำเร็จ" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "ลบห้องเรียนล้มเหลว" }, { status: 500 });
  }
}