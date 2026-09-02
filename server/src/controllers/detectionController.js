import Detection from "../models/Detection.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, fail } from "../utils/apiResponse.js";

export const listDetections = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.surveyId) {
    const Survey = (await import("../models/Survey.js")).default;
    const survey = await Survey.findOne({ surveyId: req.query.surveyId }).select("_id");
    if (!survey) return ok(res, []);
    filter.survey = survey._id;
  }
  if (req.query.classification) filter.classification = req.query.classification;
  if (req.query.riskLevel) filter.riskLevel = req.query.riskLevel;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.minConfidence !== undefined) filter.confidence = { $gte: Number(req.query.minConfidence) };

  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));

  const [items, total] = await Promise.all([
    Detection.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Detection.countDocuments(filter)
  ]);

  return ok(res, { items, page, limit, total, pages: Math.ceil(total / limit) });
});

export const getDetection = asyncHandler(async (req, res) => {
  const detection = await Detection.findOne({ detectionId: req.params.detectionId }).populate("survey frame");
  if (!detection) return fail(res, "DETECTION_NOT_FOUND", "Detection not found", 404);
  return ok(res, detection);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["unverified", "verified", "rejected", "resolved"].includes(status)) {
    return fail(res, "INVALID_STATUS", "Invalid detection status");
  }

  const detection = await Detection.findOneAndUpdate(
    { detectionId: req.params.detectionId },
    { status, ...(status === "verified" ? { "verification.status": "verified" } : {}) },
    { new: true }
  );

  if (!detection) return fail(res, "DETECTION_NOT_FOUND", "Detection not found", 404);
  return ok(res, detection);
});