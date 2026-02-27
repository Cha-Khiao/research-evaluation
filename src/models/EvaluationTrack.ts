import mongoose, { Schema, models } from "mongoose";

const trackSchema = new Schema({
  evaluatorId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // คนประเมิน
  targetGroupId: { type: Schema.Types.ObjectId, ref: "Group", required: true }, // กลุ่มที่ถูกประเมิน
  isCompleted: { type: Boolean, default: true }, 
}, { timestamps: true });

export const EvaluationTrack = models.EvaluationTrack || mongoose.model("EvaluationTrack", trackSchema);