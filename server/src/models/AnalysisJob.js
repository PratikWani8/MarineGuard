import mongoose from "mongoose";

const analysisJobSchema = new mongoose.Schema({
  jobId: { type: String, unique: true, index: true },
  survey: { type: mongoose.Schema.Types.ObjectId, ref: "Survey", required: true, index: true },
  status: { type: String, enum: ["processing", "completed", "failed"], default: "processing", index: true },
  totalFrames: { type: Number, default: 0 },
  processedFrames: { type: Number, default: 0 },
  progress: { type: Number, default: 0 },
  error: String,
  startedAt: { type: Date, default: Date.now },
  completedAt: Date
}, { timestamps: true });

export default mongoose.model("AnalysisJob", analysisJobSchema);