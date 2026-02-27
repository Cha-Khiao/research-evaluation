import mongoose, { Schema, models } from "mongoose";

const resultSchema = new Schema({
  targetGroupId: { type: Schema.Types.ObjectId, ref: "Group", required: true }, // กลุ่มที่ถูกประเมิน
  scores: { type: Schema.Types.Mixed, required: true }, // เก็บผลคะแนนเป็น JSON เช่น { q1: 10, q2: 5 }
  comment: { type: String }, 
  
}, { timestamps: true });

export const EvaluationResult = models.EvaluationResult || mongoose.model("EvaluationResult", resultSchema);