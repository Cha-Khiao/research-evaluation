import mongoose, { Schema, models } from "mongoose";

const resultSchema = new Schema({
  targetGroupId: { type: Schema.Types.ObjectId, ref: "Group", required: true }, // กลุ่มที่ถูกประเมิน
  scores: { type: Schema.Types.Mixed, required: true }, 
  comment: { type: String }, 
  
}, { timestamps: true });

export const EvaluationResult = models.EvaluationResult || mongoose.model("EvaluationResult", resultSchema);