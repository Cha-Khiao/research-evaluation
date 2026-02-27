import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Group } from "@/models/Group";
import { Room } from "@/models/Room";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    // รับข้อมูลที่ส่งมาจากหน้าบ้าน
    const { name, leaderId, memberIds } = await req.json();

    // ดึงข้อมูลห้องเรียน (กลุ่มต้องมีห้องสังกัด)
    const room = await Room.findOne();
    if (!room) {
      return NextResponse.json({ error: "ไม่พบห้องเรียนในระบบ" }, { status: 404 });
    }

    // สร้างกลุ่มใหม่ลงใน MongoDB
    const newGroup = await Group.create({
      name: name,
      roomId: room._id,
      leaderId: leaderId,
      members: memberIds,
    });

    return NextResponse.json({ message: "สร้างกลุ่มสำเร็จ!", group: newGroup }, { status: 201 });
  } catch (error) {
    console.error("Group creation error:", error); // เพิ่ม log ไว้ดู error ใน terminal
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการสร้างกลุ่ม" }, { status: 500 });
  }
}