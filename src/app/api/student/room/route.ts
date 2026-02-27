import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Room } from "@/models/Room";
import { Group } from "@/models/Group";
import { User } from "@/models/User";
import { EvaluationTrack } from "@/models/EvaluationTrack";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");
    const studentId = searchParams.get("studentId");

    if (!roomId || !studentId) return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    await connectToDatabase();

    const objectIdRoomId = new mongoose.Types.ObjectId(roomId);
    
    // 🚨 จุดแก้บั๊กที่ 1: บังคับแปลงรหัสนักศึกษาเป็น ObjectId เสมอก่อนบันทึกเข้าห้อง
    const objectIdStudentId = new mongoose.Types.ObjectId(studentId);

    // บันทึกการเข้าห้องของนักศึกษาคนนี้ (ถ้าเข้าแล้วมันจะไม่บันทึกซ้ำ)
    await Room.collection.updateOne(
      { _id: objectIdRoomId },
      { $addToSet: { joinedStudents: objectIdStudentId } }
    );

    const room = await Room.findById(roomId);
    if (!room) return NextResponse.json({ error: "ไม่พบห้องเรียน" }, { status: 404 });

    const groups = await Group.find({ roomId });

    // 🚨 จุดแก้บั๊กที่ 2: รวบรวม ID คนที่อยู่ในห้องนี้ทั้งหมดแบบไม่มีทางพลาด
    const allRelevantIds = new Set<string>();

    const rawRoom = await Room.collection.findOne({ _id: objectIdRoomId });
    const joinedStudents = rawRoom?.joinedStudents || [];
    joinedStudents.forEach((id: any) => allRelevantIds.add(id.toString()));

    groups.forEach(g => {
      if (g.leaderId) allRelevantIds.add(g.leaderId.toString());
      if (g.members) g.members.forEach((mId: any) => allRelevantIds.add(mId.toString()));
    });

    // 🚨 จุดแก้บั๊กที่ 3: โยนกลับให้ MongoDB ดึงข้อมูลมาเป็นก้อน ป้องกันคนหาย
    const objectIdsToFind = Array.from(allRelevantIds).map(id => new mongoose.Types.ObjectId(id));
    
    const roomMembers = await User.find(
      { _id: { $in: objectIdsToFind }, role: "STUDENT" },
      'name email _id'
    ).lean();

    const userMap: Record<string, any> = {};
    roomMembers.forEach(u => {
      userMap[u._id.toString()] = { _id: u._id.toString(), name: u.name, email: u.email };
    });

    let myGroup = null;
    const groupedStudentIds = new Set<string>();

    const formattedGroups = groups.map(g => {
      groupedStudentIds.add(g.leaderId.toString());
      g.members.forEach((m: any) => groupedStudentIds.add(m.toString()));

      const formattedGroup = {
        _id: g._id.toString(),
        name: g.name,
        leaderId: g.leaderId.toString(),
        leader: userMap[g.leaderId.toString()] || { _id: g.leaderId.toString(), name: "ไม่พบข้อมูล" },
        members: g.members.map((mId: any) => userMap[mId.toString()] || { _id: mId.toString(), name: "ไม่พบข้อมูล" })
      };
      
      if (g.leaderId.toString() === studentId || g.members.some((m: any) => m.toString() === studentId)) {
         myGroup = formattedGroup;
      }
      return formattedGroup;
    });

    // 🚨 จุดแก้บั๊กที่ 4: หาคนที่ว่าง (ต้องเป็นคนที่อยู่ในห้อง + ไม่มีกลุ่ม + ไม่ใช่ตัวเอง)
    const availableStudents: any[] = [];
    roomMembers.forEach(u => {
       const uIdStr = u._id.toString();
       if (!groupedStudentIds.has(uIdStr) && uIdStr !== studentId) {
          availableStudents.push(userMap[uIdStr]);
       }
    });

    const tracks = await EvaluationTrack.collection.find({ roomId, evaluatorId: studentId }).toArray();
    const evaluatedGroupIds = tracks.map(t => t.targetGroupId.toString());

    return NextResponse.json({
      room,
      myGroup,
      allGroups: formattedGroups,
      evaluatedGroupIds,
      availableStudents,
      allStudents: roomMembers.map(u => userMap[u._id.toString()])
    }, { status: 200 });

  } catch (error) { return NextResponse.json({ error: "ดึงข้อมูลล้มเหลว" }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    const { roomId, name, leaderId, members } = await req.json();
    await connectToDatabase();
    
    // ป้องกันการดึงคนนอกห้อง
    const rawRoom = await Room.collection.findOne({ _id: new mongoose.Types.ObjectId(roomId) });
    const joinedIds = (rawRoom?.joinedStudents || []).map((id: any) => id.toString());
    
    for (const mId of (members || [])) {
      if (!joinedIds.includes(mId)) {
        return NextResponse.json({ error: "ปฏิเสธ! มีรายชื่อคนที่ไม่ได้อยู่ในห้องนี้แฝงมา" }, { status: 400 });
      }
    }

    const existing = await Group.findOne({ roomId, name });
    if (existing) return NextResponse.json({ error: "ชื่อโปรเจกต์นี้มีคนใช้แล้ว" }, { status: 400 });
    const newGroup = await Group.create({ roomId, name, leaderId, members: members || [] });
    return NextResponse.json({ message: "สร้างกลุ่มสำเร็จ!", group: newGroup }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: "สร้างกลุ่มล้มเหลว" }, { status: 500 }); }
}

export async function PUT(req: Request) {
  try {
    const { groupId, action, memberId, leaderId } = await req.json();
    await connectToDatabase();
    const group = await Group.findById(groupId);
    if (!group) return NextResponse.json({ error: "ไม่พบกลุ่ม" }, { status: 404 });
    if (group.leaderId.toString() !== leaderId) return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });

    if (action === "ADD") {
      const rawRoom = await Room.collection.findOne({ _id: new mongoose.Types.ObjectId(group.roomId) });
      const joinedIds = (rawRoom?.joinedStudents || []).map((id: any) => id.toString());
      if (!joinedIds.includes(memberId)) {
        return NextResponse.json({ error: "นักศึกษาคนนี้ยังไม่ได้เข้าร่วมห้องเรียน ดึงเข้ากลุ่มไม่ได้!" }, { status: 400 });
      }
      if (!group.members.includes(memberId)) group.members.push(memberId);
    } 
    else if (action === "KICK") {
      group.members = group.members.filter((id: any) => id.toString() !== memberId);
    }
    
    await group.save();
    return NextResponse.json({ message: action === "ADD" ? "เพิ่มสมาชิกสำเร็จ" : "ลบสมาชิกออกแล้ว" }, { status: 200 });
  } catch (error) { return NextResponse.json({ error: "จัดการสมาชิกล้มเหลว" }, { status: 500 }); }
}