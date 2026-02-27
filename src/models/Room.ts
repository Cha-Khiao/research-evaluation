import mongoose, { Schema, models } from "mongoose";

const roomSchema = new Schema({
  name: { type: String, required: true },
  joinCode: { type: String, required: true, unique: true },
  teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  // กำหนดเวลาเปิด-ปิดอัตโนมัติ (จะไม่มีปุ่มล้างกระดาน หรือเวลานับถอยหลังกวนใจในหน้าตั้งค่า)
  isOpen: { type: Boolean, default: true },
  autoCloseAt: { type: Date }, 
  evaluationForm: { type: Schema.Types.Mixed }, // เก็บ JSON ของฟอร์มที่อาจารย์สร้าง
}, { timestamps: true });

export const Room = models.Room || mongoose.model("Room", roomSchema);