import mongoose, { Schema, models } from "mongoose";

const roomSchema = new Schema({
  name: { type: String, required: true },
  joinCode: { type: String, required: true, unique: true },
  teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  
  isOpen: { type: Boolean, default: true },
  autoCloseAt: { type: Date }, 
  evaluationForm: { type: Schema.Types.Mixed }, 
}, { timestamps: true });

export const Room = models.Room || mongoose.model("Room", roomSchema);