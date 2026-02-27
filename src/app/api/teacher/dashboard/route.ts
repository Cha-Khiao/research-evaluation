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

    if (!roomId) return NextResponse.json({ error: "Missing roomId" }, { status: 400 });

    await connectToDatabase();
    
    const objectIdRoomId = new mongoose.Types.ObjectId(roomId);
    const room = await Room.findById(roomId);
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    const groups = await Group.find({ roomId });
    
    // หากลุ่มที่ถูกประเมินแล้ว (มีอย่างน้อย 1 คนมาประเมิน)
    let totalCompleted = 0;

    // คำนวณ Chart Data (Bar Chart)
    const rawRoom = await Room.collection.findOne({ _id: objectIdRoomId });
    const totalStudentsInRoom = rawRoom?.joinedStudents?.length || 0;

    const chartData = await Promise.all(groups.map(async (group) => {
      // นับว่ามีกี่ผลการประเมินที่โหวตให้กลุ่มนี้
      const evalsForGroup = await EvaluationResult.collection.countDocuments({ targetGroupId: group._id.toString() });
      
      if (evalsForGroup > 0) totalCompleted++;

      return {
        name: group.name.length > 15 ? group.name.substring(0, 15) + "..." : group.name,
        "ประเมินแล้ว": evalsForGroup,
        "ยังไม่ประเมิน": Math.max(0, totalStudentsInRoom - evalsForGroup)
      };
    }));

    return NextResponse.json({
      roomName: room.name,
      joinCode: room.joinCode,
      totalGroups: groups.length,
      totalCompleted: totalCompleted,
      totalPending: Math.max(0, groups.length - totalCompleted),
      chartData
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}