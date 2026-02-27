import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Group } from "@/models/Group";
import { User } from "@/models/User";
import { Room } from "@/models/Room";
import { EvaluationTrack } from "@/models/EvaluationTrack";
import { EvaluationResult } from "@/models/EvaluationResult";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");
    if (!roomId) return NextResponse.json({ error: "ระบุข้อมูลไม่ครบถ้วน" }, { status: 400 });

    await connectToDatabase();

    const groups = await Group.find({ roomId });
    const room = await Room.findById(roomId);
    
    // 🚨 1. สร้างตะกร้ารวบรวม ID ของนักศึกษาที่เกี่ยวข้องกับห้องนี้ทั้งหมด (ป้องกันคนหาย)
    const allRelevantIds = new Set<string>();

    // 1.1 เก็บ ID จากคนที่กด Join เข้าห้องมาแล้ว
    const joinedStudents = room?.joinedStudents || [];
    joinedStudents.forEach((id: any) => allRelevantIds.add(id.toString()));

    // 1.2 เก็บ ID จากคนที่มีกลุ่มแล้ว (เผื่อบางคนถูกเพื่อนดึงเข้ากลุ่ม แต่ตัวเองยังไม่ได้กดเข้าห้อง)
    groups.forEach(g => {
      if (g.leaderId) allRelevantIds.add(g.leaderId.toString());
      if (g.members) {
        g.members.forEach((mId: any) => allRelevantIds.add(mId.toString()));
      }
    });

    // 🚨 2. โยน ID ทั้งตะกร้าให้ MongoDB ดึงข้อมูล User มาให้ (วิธีนี้เสถียร 100% ไม่พลาดแน่นอน)
    const studentsInRoom = await User.find(
      { _id: { $in: Array.from(allRelevantIds) }, role: "STUDENT" },
      'name email _id'
    );

    // 3. สร้างสมุดหน้าเหลืองเพื่อเอาไปแปะชื่อในแต่ละกลุ่ม
    const userMap: Record<string, any> = {};
    studentsInRoom.forEach(u => {
      userMap[u._id.toString()] = { _id: u._id.toString(), name: u.name, email: u.email };
    });

    // 4. จัดรูปแบบรายชื่อสมาชิกกลุ่ม
    const groupMembers = groups.map(g => ({
      groupId: g._id.toString(),
      groupName: g.name,
      leader: userMap[g.leaderId?.toString()] || { _id: g.leaderId?.toString(), name: "ไม่พบข้อมูล" },
      members: g.members.map((mId:any) => userMap[mId.toString()] || { _id: mId.toString(), name: "ไม่พบข้อมูล" })
    }));

    // 5. ดึงประวัติว่าใครประเมินแล้วบ้าง
    const tracks = await EvaluationTrack.collection.find({ roomId }).toArray();
    const evaluatedUserIds = new Set(tracks.map(t => t.evaluatorId?.toString()));

    const trackingData = studentsInRoom.map((student: any) => ({
      _id: student._id.toString(),
      name: student.name,
      email: student.email,
      hasEvaluated: evaluatedUserIds.has(student._id.toString())
    }));

    return NextResponse.json({ 
      allMembers: studentsInRoom, // ส่งรายชื่อคนในห้องแบบชัวร์ๆ ไปโชว์
      groupMembers, 
      trackingData 
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "ดึงข้อมูลสมาชิกล้มเหลว" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");
    if (!groupId) return NextResponse.json({ error: "ไม่พบรหัสกลุ่ม" }, { status: 400 });

    await connectToDatabase();
    await Group.findByIdAndDelete(groupId);
    await EvaluationResult.collection.deleteMany({ targetGroupId: groupId });
    await EvaluationTrack.collection.deleteMany({ targetGroupId: groupId });

    return NextResponse.json({ message: "ลบกลุ่มสำเร็จ" }, { status: 200 });
  } catch (error) { return NextResponse.json({ error: "ลบกลุ่มล้มเหลว" }, { status: 500 }); }
}