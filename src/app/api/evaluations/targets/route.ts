import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Group } from "@/models/Group";
import { EvaluationTrack } from "@/models/EvaluationTrack";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) return NextResponse.json({ error: "ระบุ userId ไม่ครบถ้วน" }, { status: 400 });

    await connectToDatabase();

    // 1. หากลุ่มของนักศึกษาคนนี้ก่อน
    const myGroup = await Group.findOne({
      $or: [{ leaderId: userId }, { members: userId }]
    });

    if (!myGroup) {
      return NextResponse.json({ targetGroups: [] }, { status: 200 }); // ยังไม่มีกลุ่ม
    }

    // 2. ดึงกลุ่มทั้งหมดในห้อง ยกเว้นกลุ่มตัวเอง (ห้ามประเมินกลุ่มตัวเอง)
    const otherGroups = await Group.find({
      roomId: myGroup.roomId,
      _id: { $ne: myGroup._id }
    });

    // 3. เช็คประวัติการประเมินว่า เคยประเมินกลุ่มไหนไปแล้วบ้าง
    const myTracks = await EvaluationTrack.find({ evaluatorId: userId });
    const evaluatedGroupIds = myTracks.map(track => track.targetGroupId.toString());

    // 4. ประกอบร่างข้อมูลส่งกลับไปหน้าบ้าน
    const targetGroups = otherGroups.map(group => ({
      _id: group._id,
      name: group.name,
      isEvaluated: evaluatedGroupIds.includes(group._id.toString()) // เช็คสถานะ
    }));

    return NextResponse.json({ myGroup, targetGroups }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลกลุ่มเป้าหมาย" }, { status: 500 });
  }
}