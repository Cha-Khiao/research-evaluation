import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Room } from "@/models/Room";
import { Group } from "@/models/Group";
import { EvaluationResult } from "@/models/EvaluationResult";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) return NextResponse.json({ error: "ระบุ roomId ไม่ครบถ้วน" }, { status: 400 });

    await connectToDatabase();

    const objectIdRoomId = new mongoose.Types.ObjectId(roomId);
    const room = await Room.findById(roomId);
    if (!room) return NextResponse.json({ error: "ไม่พบข้อมูลห้องเรียน" }, { status: 404 });

    const evaluationForm = room.evaluationForm || [];
    const groups = await Group.find({ roomId });

    // 🚨 1. หาจำนวนนักศึกษาในห้องทั้งหมดแบบเป๊ะๆ (ใช้ตะกร้ารวบรวม ID เหมือนหน้าสมาชิก)
    const rawRoom = await Room.collection.findOne({ _id: objectIdRoomId });
    const allRelevantIds = new Set<string>();

    const joinedStudents = rawRoom?.joinedStudents || [];
    joinedStudents.forEach((id: any) => allRelevantIds.add(id.toString()));

    groups.forEach(g => {
      if (g.leaderId) allRelevantIds.add(g.leaderId.toString());
      if (g.members) g.members.forEach((mId: any) => allRelevantIds.add(mId.toString()));
    });

    // จำนวนนักศึกษาทั้งหมดที่อยู่ในห้องนี้จริงๆ
    const totalStudents = allRelevantIds.size;

    const groupResults = await Promise.all(groups.map(async (group) => {
      // ดึงผลโหวตทั้งหมดที่พุ่งเป้ามาที่กลุ่มนี้
      const results = await EvaluationResult.collection.find({ targetGroupId: group._id.toString() }).toArray();

      const scoreSums: Record<string, number> = {};
      const scoreCounts: Record<string, number> = {};
      const minScores: Record<string, number> = {};
      const maxScores: Record<string, number> = {};
      const comments: string[] = [];

      // 🚨 2. รวบรวม ID ของคนที่มาประเมิน (เพื่อให้นับ "เป็นรายคน" จริงๆ ลบข้อมูลซ้ำทิ้ง)
      const evaluatorIds = new Set<string>();

      results.forEach(res => {
        if (res.evaluatorId) evaluatorIds.add(res.evaluatorId.toString());
        if (res.comment && res.comment.trim() !== "") comments.push(res.comment);
        
        if (res.scores) {
          Object.keys(res.scores).forEach(qId => {
            const score = Number(res.scores[qId]);
            scoreSums[qId] = (scoreSums[qId] || 0) + score;
            scoreCounts[qId] = (scoreCounts[qId] || 0) + 1;
            if (minScores[qId] === undefined || score < minScores[qId]) minScores[qId] = score;
            if (maxScores[qId] === undefined || score > maxScores[qId]) maxScores[qId] = score;
          });
        }
      });

      const averages: Record<string, number> = {};
      let totalAverageScore = 0;

      Object.keys(scoreSums).forEach(qId => {
        // ป้องกัน Error หารด้วย 0
        const avg = scoreCounts[qId] > 0 ? scoreSums[qId] / scoreCounts[qId] : 0;
        averages[qId] = Number(avg.toFixed(2));
        totalAverageScore += Number(avg.toFixed(2));
      });

      return {
        groupId: group._id.toString(),
        groupName: group.name,
        // 🚨 3. ส่งตัวเลขรายบุคคลที่กรองแล้วกลับไปแสดงผล
        evaluationCount: evaluatorIds.size, 
        averages,
        minScores,
        maxScores,
        totalAverageScore: Number(totalAverageScore.toFixed(2)),
        comments
      };
    }));

    return NextResponse.json({
      evaluationForm,
      totalStudents, // ส่งจำนวนคนในห้องทั้งหมดกลับไปโชว์
      groupResults: groupResults.sort((a, b) => b.totalAverageScore - a.totalAverageScore)
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลคะแนน" }, { status: 500 });
  }
}