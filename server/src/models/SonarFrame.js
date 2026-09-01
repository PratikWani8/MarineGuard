import mongoose from "mongoose";

const sonarFrameSchema = new mongoose.Schema({
  survey: { type: mongoose.Schema.Types.ObjectId, ref: "Survey", required: true, index: true },
  frameId: { type: Number, required: true, index: true },
  filename: { type: String, required: true },
  storedPath: { type: String, required: true },
  metadata: {
    survey_id: String,
    frame_id: Number,
    latitude: Number,
    longitude: Number,
    heading: Number,
    depth: Number,
    sonar_range_m: Number,
    pixel_resolution_m: Number,
    ping_spacing_m: Number,
    side: { type: String, enum: ["port", "starboard", "unknown"], default: "unknown" },
    timestamp: Date
  },
  analysisStatus: {
    type: String,
    enum: ["uploaded", "processing", "completed", "failed"],
    default: "uploaded",
    index: true
  },
  processingTime: Number
}, { timestamps: true });

sonarFrameSchema.index({ survey: 1, frameId: 1 }, { unique: true });

export default mongoose.model("SonarFrame", sonarFrameSchema);