import mongoose, { Schema, models } from "mongoose";

const groupSchema = new Schema({
  name: { type: String, required: true },
  roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true },
  leaderId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // หัวหน้ากลุ่ม
  members: [{ type: Schema.Types.ObjectId, ref: "User" }], 
}, { timestamps: true });

export const Group = models.Group || mongoose.model("Group", groupSchema);