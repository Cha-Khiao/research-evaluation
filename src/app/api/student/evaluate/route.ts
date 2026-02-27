import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { EvaluationResult } from "@/models/EvaluationResult";
import { EvaluationTrack } from "@/models/EvaluationTrack";

export async function POST(req: Request) {
  try {
    const { roomId, targetGroupId, evaluatorId, scores, comment } = await req.json();

    if (!roomId || !targetGroupId || !evaluatorId || !scores) {
      return NextResponse.json({ error: "ข้อมูลการประเมินไม่ครบถ้วน" }, { status: 400 });
    }

    await connectToDatabase();
    
    // 1. เช็คว่าเคยประเมินหรือยัง (เจาะผ่าน .collection ของ Model โดยตรง ปลอดภัย 100%)
    const existingTrack = await EvaluationTrack.collection.findOne({ 
      roomId, targetGroupId, evaluatorId 
    });
    
    if (existingTrack) {
      return NextResponse.json({ error: "คุณได้ส่งแบบประเมินให้กลุ่มนี้ไปแล้ว" }, { status: 400 });
    }

    // 2. บันทึกผลคะแนน (เจาะผ่าน .collection เพื่อทะลุ Schema)
    await EvaluationResult.collection.insertOne({
      roomId, targetGroupId, evaluatorId, scores, comment, createdAt: new Date()
    });

    // 3. บันทึกประวัติกันการประเมินซ้ำ
    await EvaluationTrack.collection.insertOne({
      roomId, targetGroupId, evaluatorId, createdAt: new Date()
    });

    return NextResponse.json({ message: "บันทึกผลการประเมินสำเร็จ!" }, { status: 201 });
  } catch (error) {
    console.error("Evaluation Error:", error);
    return NextResponse.json({ error: "บันทึกผลการประเมินล้มเหลว" }, { status: 500 });
  }
}