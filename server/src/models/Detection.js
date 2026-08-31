import mongoose from "mongoose";

const detectionSchema = new mongoose.Schema({
  detectionId: { type: String, unique: true, index: true },
  survey: { type: mongoose.Schema.Types.ObjectId, ref: "Survey", required: true, index: true },
  frame: { type: mongoose.Schema.Types.ObjectId, ref: "SonarFrame", required: true, index: true },
  trackId: String,
  classification: { type: String, required: true, index: true },
  confidence: { type: Number, min: 0, max: 100, required: true, index: true },
  uncertainty: Number,
  artificialProbability: Number,
  naturalProbability: Number,
  hazardScore: { type: Number, min: 0, max: 100, index: true },
  riskLevel: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], index: true },
  boundingBox: {
    x1: Number, y1: Number, x2: Number, y2: Number,
    width: Number, height: Number
  },
  segmentation: {
    available: Boolean,
    mask: mongoose.Schema.Types.Mixed,
    maskAreaPixels: Number,
    polygon: mongoose.Schema.Types.Mixed,
    confidence: Number
  },
  dimensions: {
    available: Boolean,
    lengthM: Number,
    widthM: Number,
    areaM2: Number
  },
  location: {
    available: Boolean,
    latitude: Number,
    longitude: Number,
    depthM: Number,
    positionAccuracyEstimateM: Number
  },
  shadowAnalysis: {
    score: Number,
    lengthPixels: Number,
    direction: Number,
    detected: Boolean
  },
  persistence: {
    framesSeen: Number,
    persistenceScore: Number,
    confirmed: Boolean
  },
  verification: {
    required: Boolean,
    status: { type: String, enum: ["not_required", "pending", "verified", "rejected"] },
    confidence: Number,
    classification: String,
    reason: String
  },
  recommendedAction: String,
  status: {
    type: String,
    enum: ["unverified", "verified", "rejected", "resolved"],
    default: "unverified",
    index: true
  }
}, { timestamps: true });

export default mongoose.model("Detection", detectionSchema);