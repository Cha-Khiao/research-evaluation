import mongoose, { Schema, models } from "mongoose";

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // ในของจริงต้อง Hash รหัสผ่าน
  role: { type: String, enum: ["TEACHER", "STUDENT"], required: true },
}, { timestamps: true });

export const User = models.User || mongoose.model("User", userSchema);