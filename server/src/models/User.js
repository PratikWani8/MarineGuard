import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ["admin", "operator", "researcher"], default: "operator", index: true }
}, { timestamps: true });

export default mongoose.model("User", userSchema);