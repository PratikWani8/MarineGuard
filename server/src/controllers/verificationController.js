import Detection from "../models/Detection.js";
import { verifyDetection } from "../services/aiService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, fail } from "../utils/apiResponse.js";

export const verify = asyncHandler(async (req, res) => {
  const detection = await Detection.findOne({ detectionId: req.params.detectionId });
  if (!detection) return fail(res, "DETECTION_NOT_FOUND", "Detection not found", 404);

  const payload = {
    detection_id: detection.detectionId,
    classification: detection.classification,
    confidence: detection.confidence,
    location: detection.location,
    bounding_box: detection.boundingBox
  };

  const result = await verifyDetection(payload, req.file?.path);

  const data = result?.data || result || {};
  detection.verification = {
    required: false,
    status: data.verification_status === "verified" ? "verified" : "pending",
    confidence: Number(data.confidence || 0),
    classification: data.classification || detection.classification,
    reason: data.reason
  };

  await detection.save();
  return ok(res, { detection, verification: data });
});