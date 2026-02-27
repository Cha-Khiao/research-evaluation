import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { EvaluationResult } from "@/models/EvaluationResult";
import { EvaluationTrack } from "@/models/EvaluationTrack";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    const { evaluatorId, targetGroupId, scores, comment } = await req.json();

    // 1. ตรวจสอบก่อนว่าเคยประเมินกลุ่มนี้ไปแล้วหรือยัง (ป้องกันการยิง API ซ้ำ)
    const existingTrack = await EvaluationTrack.findOne({ evaluatorId, targetGroupId });
    if (existingTrack) {
      return NextResponse.json({ error: "คุณได้ประเมินกลุ่มนี้ไปแล้ว" }, { status: 400 });
    }

    // 2. บันทึกผลคะแนน (ไม่มี ID ของคนประเมินลงในนี้เด็ดขาด!)
    await EvaluationResult.create({
      targetGroupId,
      scores,
      comment
    });

    // 3. บันทึกประวัติการทำงาน (รู้แค่ว่าคนนี้ทำแล้ว แต่ไม่รู้ว่าให้คะแนนเท่าไหร่)
    await EvaluationTrack.create({
      evaluatorId,
      targetGroupId,
      isCompleted: true
    });

    return NextResponse.json({ message: "บันทึกผลการประเมินสำเร็จ!" }, { status: 201 });
  } catch (error) {
    console.error("Submit evaluation error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" }, { status: 500 });
  }
}