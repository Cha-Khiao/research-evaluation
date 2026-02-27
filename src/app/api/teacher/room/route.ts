import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Room } from "@/models/Room";

// ดึงข้อมูลห้องและฟอร์มของอาจารย์
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId"); // เปลี่ยนมารับรหัสห้อง

    if (!roomId) return NextResponse.json({ error: "ระบุ roomId ไม่ครบถ้วน" }, { status: 400 });

    await connectToDatabase();
    
    const room = await Room.findById(roomId);
    if (!room) return NextResponse.json({ error: "ไม่พบข้อมูลห้องเรียน" }, { status: 404 });

    return NextResponse.json(room, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" }, { status: 500 });
  }
}

// อัปเดตข้อมูลแบบฟอร์มประเมิน
export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const { roomId, evaluationForm } = await req.json();

    if (!roomId || !evaluationForm) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      { evaluationForm },
      { new: true }
    );

    return NextResponse.json({ message: "บันทึกแบบฟอร์มสำเร็จ!", room: updatedRoom }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" }, { status: 500 });
  }
}