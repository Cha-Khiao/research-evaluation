import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { User } from "@/models/User";
import { Group } from "@/models/Group";

export async function GET() {
  try {
    await connectToDatabase();

    // 1. หาว่ามีนักศึกษาคนไหนบ้างที่มีกลุ่มแล้ว (ดึง ID ออกมาทั้งหัวหน้าและสมาชิก)
    const allGroups = await Group.find({});
    const groupedStudentIds = allGroups.flatMap(group => [
      group.leaderId.toString(),
      ...group.members.map((m: any) => m.toString())
    ]);

    // 2. ดึงรายชื่อนักศึกษาทั้งหมด ที่ไม่ได้อยู่ในลิสต์คนที่มีกลุ่มแล้ว
    const availableStudents = await User.find({
      role: "STUDENT",
      _id: { $nin: groupedStudentIds }
    }).select("_id name"); // เอามาแค่ ID และชื่อเพื่อความปลอดภัย

    return NextResponse.json(availableStudents, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลนักศึกษาได้" }, { status: 500 });
  }
}