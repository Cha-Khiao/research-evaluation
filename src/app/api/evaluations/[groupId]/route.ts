import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Group } from "@/models/Group";
import { Room } from "@/models/Room";

export async function GET(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    await connectToDatabase();
    
    // ดึง groupId จาก URL parameters (รองรับ Next.js เวอร์ชันใหม่)
    const groupId = (await params).groupId;

    // หากลุ่มที่ถูกประเมิน
    const targetGroup = await Group.findById(groupId);
    if (!targetGroup) return NextResponse.json({ error: "ไม่พบกลุ่มเป้าหมาย" }, { status: 404 });

    // หาห้องที่กลุ่มนี้สังกัดอยู่ เพื่อดึงแบบฟอร์ม
    const room = await Room.findById(targetGroup.roomId);
    if (!room) return NextResponse.json({ error: "ไม่พบข้อมูลห้องเรียน" }, { status: 404 });

    return NextResponse.json({
      groupName: targetGroup.name,
      evaluationForm: room.evaluationForm || [] // ดึง JSON ฟอร์มออกมา
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงแบบฟอร์ม" }, { status: 500 });
  }
}