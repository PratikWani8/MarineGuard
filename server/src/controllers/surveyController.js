import Survey from "../models/Survey.js";
import SonarFrame from "../models/SonarFrame.js";
import AnalysisJob from "../models/AnalysisJob.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, fail } from "../utils/apiResponse.js";
import { makeId } from "../utils/ids.js";
import { analyzeFrame, processSurveyBatch, updateSurveyStats } from "../services/analysisService.js";

function parseMetadata(raw) {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try { return JSON.parse(raw); } catch {
    const e = new Error("metadata must be valid JSON");
    e.statusCode = 400;
    e.code = "INVALID_METADATA";
    throw e;
  }
}

export const createSurvey = asyncHandler(async (req, res) => {
  const { name, description, startLocation, endLocation } = req.body;
  if (!name) return fail(res, "VALIDATION_ERROR", "Survey name is required");

  const survey = await Survey.create({
    surveyId: makeId("SURVEY"),
    name,
    description,
    operator: req.user._id,
    startLocation,
    endLocation
  });

  return ok(res, survey, 201);
});

export const listSurveys = asyncHandler(async (req, res) => {
  const filter = req.user.role === "admin" ? {} : { operator: req.user._id };
  const surveys = await Survey.find(filter).sort({ createdAt: -1 }).lean();
  return ok(res, surveys);
});

export const getSurvey = asyncHandler(async (req, res) => {
  const survey = await Survey.findOne({ surveyId: req.params.surveyId }).populate("operator", "name email role");
  if (!survey) return fail(res, "SURVEY_NOT_FOUND", "Survey not found", 404);
  if (req.user.role !== "admin" && survey.operator?._id.toString() !== req.user._id.toString()) {
    return fail(res, "FORBIDDEN", "You do not have access to this survey", 403);
  }
  return ok(res, survey);
});

export const deleteSurvey = asyncHandler(async (req, res) => {
  const survey = await Survey.findOne({ surveyId: req.params.surveyId });
  if (!survey) return fail(res, "SURVEY_NOT_FOUND", "Survey not found", 404);

  if (req.user.role !== "admin" && survey.operator.toString() !== req.user._id.toString()) {
    return fail(res, "FORBIDDEN", "You do not have access to this survey", 403);
  }

  await Promise.all([
    Survey.deleteOne({ _id: survey._id }),
    SonarFrame.deleteMany({ survey: survey._id }),
    AnalysisJob.deleteMany({ survey: survey._id })
  ]);

  return ok(res, { deleted: true });
});

export const uploadFrame = asyncHandler(async (req, res) => {
  const survey = await Survey.findOne({ surveyId: req.params.surveyId });
  if (!survey) return fail(res, "SURVEY_NOT_FOUND", "Survey not found", 404);
  if (!req.file) return fail(res, "IMAGE_REQUIRED", "Sonar image is required");

  const metadata = parseMetadata(req.body.metadata);
  const frameId = Number(metadata.frame_id);

  if (!Number.isInteger(frameId) || frameId < 0) {
    return fail(res, "INVALID_FRAME_ID", "metadata.frame_id must be a non-negative integer");
  }

  const existing = await SonarFrame.findOne({ survey: survey._id, frameId });
  if (existing) return fail(res, "FRAME_EXISTS", "Frame ID already exists for this survey", 409);

  const frame = await SonarFrame.create({
    survey: survey._id,
    frameId,
    filename: req.file.filename,
    storedPath: req.file.path,
    metadata
  });

  survey.status = "processing";
  await survey.save();

  try {
    const result = await analyzeFrame({
      frame,
      survey,
      io: req.app.get("io")
    });

    return ok(res, {
      frame,
      processingTime: result.processingTime,
      detections: result.detections,
      ai: result.result
    }, 201);
  } catch (error) {
    return fail(res, "AI_SERVICE_ERROR", error.message || "AI analysis failed", 502);
  }
});

export const startSurveyAnalysis = asyncHandler(async (req, res) => {
  const survey = await Survey.findOne({ surveyId: req.params.surveyId });
  if (!survey) return fail(res, "SURVEY_NOT_FOUND", "Survey not found", 404);

  const frames = await SonarFrame.find({ survey: survey._id }).sort({ frameId: 1 });
  if (!frames.length) return fail(res, "NO_FRAMES", "No sonar frames available for analysis");

  const job = await AnalysisJob.create({
    jobId: makeId("JOB"),
    survey: survey._id,
    totalFrames: frames.length
  });

  processSurveyBatch({
    survey,
    job,
    frames,
    io: req.app.get("io")
  });

  return ok(res, {
    jobId: job.jobId,
    status: "processing",
    totalFrames: frames.length
  }, 202);
});