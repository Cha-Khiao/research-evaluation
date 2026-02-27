import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Room } from "@/models/Room";
import { Group } from "@/models/Group";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    if (!studentId) return NextResponse.json({ error: "ระบุ studentId ไม่ครบถ้วน" }, { status: 400 });

    await connectToDatabase();
    
    // 1. หาห้องที่นักศึกษามีกลุ่มอยู่แล้ว
    const groups = await Group.find({
      $or: [{ leaderId: studentId }, { members: studentId }]
    });
    const groupRoomIds = groups.map(g => g.roomId);
    
    // 2. หาห้องที่นักศึกษาเพิ่งกด Join (เจาะทะลุ Mongoose Schema)
    const joinedRooms = await Room.collection.find({ joinedStudents: studentId }).toArray();
    const joinedRoomIds = joinedRooms.map(r => r._id);

    // ดึงห้องทั้งหมดมารวมกัน (โชว์ใน Dashboard แน่นอน 100%)
    const rooms = await Room.find({
      $or: [
        { _id: { $in: groupRoomIds } },
        { _id: { $in: joinedRoomIds } }
      ]
    });

    return NextResponse.json({ rooms, groups }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "ดึงข้อมูลห้องเรียนล้มเหลว" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { joinCode, studentId } = await req.json();
    if (!joinCode) return NextResponse.json({ error: "กรุณากรอกรหัสเข้าห้อง" }, { status: 400 });

    await connectToDatabase();
    const room = await Room.findOne({ joinCode: joinCode.toUpperCase() });

    if (!room) return NextResponse.json({ error: "ไม่พบห้องเรียนที่ตรงกับรหัสนี้" }, { status: 404 });

    // บันทึกนักศึกษาเข้าห้อง (เจาะทะลุ Schema บังคับให้เซฟ)
    if (studentId) {
      await Room.collection.updateOne(
        { _id: new mongoose.Types.ObjectId(room._id) }, 
        { $addToSet: { joinedStudents: studentId } }
      );
    }

    return NextResponse.json({ message: "พบห้องเรียน", roomId: room._id }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการเข้าร่วมห้อง" }, { status: 500 });
  }
}