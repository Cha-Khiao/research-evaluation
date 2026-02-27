import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { User } from "@/models/User";
import { Room } from "@/models/Room";
import { Group } from "@/models/Group";
import { EvaluationTrack } from "@/models/EvaluationTrack";
import { EvaluationResult } from "@/models/EvaluationResult";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();

    // 1. 🧹 ล้างข้อมูลเก่า
    await User.deleteMany({});
    await Room.deleteMany({});
    await Group.deleteMany({});
    await EvaluationTrack.collection.deleteMany({});
    await EvaluationResult.collection.deleteMany({});

    const hashedPassword = await bcrypt.hash("123456", 10);

    // 3. 👨‍🏫 สร้างข้อมูล อาจารย์
    const teacher = await User.create({
      name: "อ. สมฤดี ใจดี",
      email: "somrudee@eval.ac.th", 
      password: hashedPassword,
      role: "TEACHER"
    });

    // 4. 🎓 สร้างข้อมูล นักศึกษา 5 คน
    const studentsData = [
      { name: "นศ. สมชาย เรียนดี (หัวหน้ากลุ่ม 1)", email: "64010001@eval.ac.th" },
      { name: "นศ. สมหญิง ขยัน (สมาชิกกลุ่ม 1)", email: "64010002@eval.ac.th" },
      { name: "นศ. มานี ตั้งใจ (สมาชิกกลุ่ม 1)", email: "64010003@eval.ac.th" },
      { name: "นศ. ปิติ ร่าเริง (ทำโปรเจกต์เดี่ยว)", email: "64010004@eval.ac.th" },
      { name: "นศ. ชูใจ ว่างเปล่า (ยังไม่มีกลุ่ม)", email: "64010005@eval.ac.th" },
    ];

    const createdStudents = [];
    for (const student of studentsData) {
      const newUser = await User.create({ ...student, password: hashedPassword, role: "STUDENT" });
      createdStudents.push(newUser);
    }

    // 5. 🏫 สร้างห้องเรียน
    const roomForm = [
      { id: "q1", question: "ความสมบูรณ์ของชิ้นงาน", maxScore: 10 },
      { id: "q2", question: "การนำเสนอและการตอบคำถาม", maxScore: 5 },
      { id: "q3", question: "ความคิดสร้างสรรค์", maxScore: 5 }
    ];

    const room = await Room.create({
      name: "วิชาโครงงานวิศวกรรมซอฟต์แวร์ (เซค 1)",
      joinCode: "SWE101",
      teacherId: teacher._id,
      evaluationForm: roomForm
    });

    // 🚨 ทะลวงฐานข้อมูลดิบ! ยัด ObjectIds ของนักศึกษาทั้ง 5 คนเข้าห้องเรียนแบบบังคับ
    const studentObjectIds = createdStudents.map(s => new mongoose.Types.ObjectId(s._id));
    await Room.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(room._id) },
      { $set: { joinedStudents: studentObjectIds } }
    );

    // 6. 📁 สร้างโปรเจกต์
    const group1 = await Group.create({
      roomId: room._id,
      name: "โปรเจกต์ AI ตรวจจับโรคพืช (งานกลุ่ม)",
      leaderId: createdStudents[0]._id, 
      members: [createdStudents[1]._id, createdStudents[2]._id] 
    });

    const group2 = await Group.create({
      roomId: room._id,
      name: "แอปพลิเคชันจัดการหอพัก (งานเดี่ยว)",
      leaderId: createdStudents[3]._id, 
      members: [] 
    });

    // 7. 📝 จำลองการประเมิน
    const evalData1 = {
      roomId: room._id.toString(),
      targetGroupId: group1._id.toString(),
      evaluatorId: createdStudents[3]._id.toString(),
      scores: { "q1": 9, "q2": 4, "q3": 5 },
      comment: "ผลงานน่าสนใจมากครับ AI แม่นยำดี",
      createdAt: new Date()
    };
    
    await EvaluationResult.collection.insertOne(evalData1);
    await EvaluationTrack.collection.insertOne({
      roomId: evalData1.roomId,
      targetGroupId: evalData1.targetGroupId,
      evaluatorId: evalData1.evaluatorId,
      createdAt: evalData1.createdAt
    });

    const evalData2 = {
      roomId: room._id.toString(),
      targetGroupId: group2._id.toString(),
      evaluatorId: createdStudents[0]._id.toString(),
      scores: { "q1": 8, "q2": 5, "q3": 4 },
      comment: "ทำงานคนเดียวได้ขนาดนี้เก่งมากครับ UI สวย",
      createdAt: new Date()
    };

    await EvaluationResult.collection.insertOne(evalData2);
    await EvaluationTrack.collection.insertOne({
      roomId: evalData2.roomId,
      targetGroupId: evalData2.targetGroupId,
      evaluatorId: evalData2.evaluatorId,
      createdAt: evalData2.createdAt
    });

    return NextResponse.json({
      message: "🌱 Seed ข้อมูลสำเร็จ! (ยัดชื่อนักศึกษาเข้าห้อง 5 คนเรียบร้อย)",
      login_test_accounts: {
        password_for_all: "123456",
        teacher: "somrudee@eval.ac.th",
        student_group_leader: "64010001@eval.ac.th",
        student_solo: "64010004@eval.ac.th",
        student_no_group: "64010005@eval.ac.th" // ลองเข้าอันนี้ดูครับ!
      },
      room_code: "SWE101"
    }, { status: 200 });

  } catch (error: any) {
    console.error("Seed Error:", error);
    return NextResponse.json({ error: "การ Seed ล้มเหลว: " + error.message }, { status: 500 });
  }
}