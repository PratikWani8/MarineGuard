import mongoose from "mongoose";

const pointSchema = new mongoose.Schema({
  latitude: Number,
  longitude: Number
}, { _id: false });

const surveySchema = new mongoose.Schema({
  surveyId: { type: String, unique: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 2000 },
  operator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  startLocation: pointSchema,
  endLocation: pointSchema,
  status: {
    type: String,
    enum: ["uploaded", "processing", "completed", "failed"],
    default: "uploaded",
    index: true
  },
  stats: {
    frames: { type: Number, default: 0 },
    detections: { type: Number, default: 0 },
    criticalDetections: { type: Number, default: 0 },
    highRiskDetections: { type: Number, default: 0 },
    ghostNets: { type: Number, default: 0 },
    shipwrecks: { type: Number, default: 0 },
    pipes: { type: Number, default: 0 },
    totalEstimatedArea: { type: Number, default: 0 }
  }
}, { timestamps: true });

export default mongoose.model("Survey", surveySchema);