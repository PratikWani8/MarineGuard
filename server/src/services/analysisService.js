import fs from "node:fs/promises";
import SonarFrame from "../models/SonarFrame.js";
import Detection from "../models/Detection.js";
import Survey from "../models/Survey.js";
import AnalysisJob from "../models/AnalysisJob.js";
import { analyzeSonarFrame } from "./aiService.js";
import { makeId } from "../utils/ids.js";

function mapDetection(d, surveyId, frameId) {
  const location = d?.location || {};

  const latitude =
    location.latitude != null
      ? Number(location.latitude)
      : null;

  const longitude =
    location.longitude != null
      ? Number(location.longitude)
      : null;

  const locationAvailable =
    location.geolocation_available === true ||
    (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)
    );

  return {
    detectionId:
      d.detection_id ||
      makeId("DET"),

    survey:
      surveyId,

    frame:
      frameId,

    trackId:
      d.track_id ||
      null,

    classification:
      d.classification ||
      "other_debris",

    confidence:
      Number(
        d.confidence ?? 0
      ),

    uncertainty:
      Number(
        d.uncertainty ?? 0
      ),

    artificialProbability:
      Number(
        d.artificial_probability ?? 0
      ),

    naturalProbability:
      Number(
        d.natural_probability ?? 0
      ),

    hazardScore:
      Number(
        d.hazard_score ?? 0
      ),

    riskLevel:
      d.risk_level ||
      "LOW",

    boundingBox:
      d.bbox ||
      d.bounding_box ||
      {},

    segmentation: {
      available:
        Boolean(
          d.segmentation
            ?.segmentation_available ??
          d.segmentation
            ?.available ??
          false
        ),

      mask:
        d.segmentation?.mask ??
        null,

      maskAreaPixels:
        Number(
          d.segmentation?.mask_area ??
          d.segmentation?.maskAreaPixels ??
          0
        ),

      polygon:
        d.segmentation?.polygon ??
        null,

      confidence:
        Number(
          d.segmentation
            ?.segmentation_confidence ??
          d.segmentation
            ?.confidence ??
          0
        ),
    },

    dimensions: {
      available:
        Boolean(
          d.dimensions
            ?.dimension_estimation_available ??
          d.dimensions?.available ??
          false
        ),

      lengthM:
        d.dimensions?.length_m ??
        d.dimensions?.lengthM ??
        null,

      widthM:
        d.dimensions?.width_m ??
        d.dimensions?.widthM ??
        null,

      areaM2:
        d.dimensions?.area_m2 ??
        d.dimensions?.areaM2 ??
        null,
    },

    location: {
      available:
        locationAvailable,

      latitude:
        Number.isFinite(latitude)
          ? latitude
          : null,

      longitude:
        Number.isFinite(longitude)
          ? longitude
          : null,

      depthM:
        location.depth_m ??
        location.depthM ??
        null,

      positionAccuracyEstimateM:
        location.position_accuracy_estimate_m ??
        location.positionAccuracyEstimateM ??
        null,
    },

    shadowAnalysis: {
      score:
        Number(
          d.shadow_analysis
            ?.shadow_score ??
          0
        ),

      lengthPixels:
        Number(
          d.shadow_analysis
            ?.shadow_length_pixels ??
          0
        ),

      direction:
        d.shadow_analysis
          ?.shadow_direction ??
        null,

      detected:
        Boolean(
          d.shadow_analysis
            ?.shadow_detected ??
          false
        ),
    },

    persistence: {
      framesSeen:
        Number(
          d.frames_seen ??
          d.persistence
            ?.frames_seen ??
          d.persistence
            ?.framesSeen ??
          0
        ),

      persistenceScore:
        Number(
          d.persistence_score ??
          d.persistence
            ?.persistence_score ??
          d.persistence
            ?.persistenceScore ??
          0
        ),

      confirmed:
        Boolean(
          d.confirmed ??
          d.persistence
            ?.confirmed ??
          false
        ),
    },

    verification: {
      required:
        Boolean(
          d.camera_verification_required ??
          d.verification
            ?.required ??
          false
        ),

      status:
        d.verification?.status ||
        (
          d.camera_verification_required
            ? "pending"
            : "not_required"
        ),

      confidence:
        Number(
          d.verification
            ?.confidence ??
          0
        ),

      classification:
        d.verification
          ?.classification ??
        d.classification ??
        "unknown",

      reason:
        d.verification?.reason ||
        null,
    },

    recommendedAction:
      d.recommended_action ||
      null,

    status:
      "unverified",
  };
}


// ============================================================
// ANALYZE SINGLE SONAR FRAME
// ============================================================

export async function analyzeFrame({
  frame,
  survey,
  io,
}) {
  await SonarFrame.findByIdAndUpdate(
    frame._id,
    {
      analysisStatus:
        "processing",
    }
  );

  if (io) {
    io
      .to(`survey:${survey.surveyId}`)
      .emit(
        "analysis:started",
        {
          surveyId:
            survey.surveyId,

          frameId:
            frame.frameId,
        }
      );
  }

  const started =
    Date.now();

  try {
    // --------------------------------------------------------
    // Send frame to FastAPI
    // --------------------------------------------------------

    const result =
      await analyzeSonarFrame(
        frame.storedPath,
        {
          survey_id:
            survey.surveyId,

          frame_id:
            frame.frameId,

          ...frame.metadata,
        }
      );

    // --------------------------------------------------------
    // Extract detections
    // --------------------------------------------------------

    const rawDetections =
      Array.isArray(
        result?.detections
      )
        ? result.detections
        : [];

    // --------------------------------------------------------
    // Convert AI detections to MongoDB format
    // --------------------------------------------------------

    const docs =
      rawDetections.map(
        (detection) =>
          mapDetection(
            detection,
            survey._id,
            frame._id
          )
      );

    // --------------------------------------------------------
    // Save detections
    // --------------------------------------------------------

    const created =
      docs.length
        ? await Detection.insertMany(
            docs
          )
        : [];

    const processingTime =
      Date.now() - started;

    // --------------------------------------------------------
    // Update frame
    // --------------------------------------------------------

    await SonarFrame.findByIdAndUpdate(
      frame._id,
      {
        analysisStatus:
          "completed",

        processingTime,
      }
    );

    // --------------------------------------------------------
    // Update survey statistics
    // --------------------------------------------------------

    await updateSurveyStats(
      survey._id
    );

    // --------------------------------------------------------
    // Emit detection events
    // --------------------------------------------------------

    for (const detection of created) {
      if (!io) continue;

      io
        .to(`survey:${survey.surveyId}`)
        .emit(
          "detection:created",
          {
            surveyId:
              survey.surveyId,

            detection,
          }
        );
    }

    return {
      result,

      detections:
        created,

      processingTime,
    };

  } catch (error) {

    await SonarFrame.findByIdAndUpdate(
      frame._id,
      {
        analysisStatus:
          "failed",
      }
    );

    throw error;
  }
}


// ============================================================
// PROCESS COMPLETE SURVEY
// ============================================================

export async function processSurveyBatch({
  survey,
  job,
  frames,
  io,
}) {
  try {

    await Survey.findByIdAndUpdate(
      survey._id,
      {
        status:
          "processing",
      }
    );

    io
      ?.to(`survey:${survey.surveyId}`)
      .emit(
        "analysis:started",
        {
          surveyId:
            survey.surveyId,

          jobId:
            job.jobId,

          totalFrames:
            frames.length,
        }
      );

    // --------------------------------------------------------
    // Process frames sequentially
    // --------------------------------------------------------

    for (
      let i = 0;
      i < frames.length;
      i++
    ) {

      await analyzeFrame({
        frame:
          frames[i],

        survey,

        io,
      });

      const progress =
        Math.round(
          (
            (i + 1) /
            frames.length
          ) * 100
        );

      await AnalysisJob.findByIdAndUpdate(
        job._id,
        {
          processedFrames:
            i + 1,

          progress,
        }
      );

      io
        ?.to(`survey:${survey.surveyId}`)
        .emit(
          "analysis:progress",
          {
            surveyId:
              survey.surveyId,

            jobId:
              job.jobId,

            progress,

            processedFrames:
              i + 1,

            totalFrames:
              frames.length,
          }
        );
    }

    // --------------------------------------------------------
    // Complete job
    // --------------------------------------------------------

    await AnalysisJob.findByIdAndUpdate(
      job._id,
      {
        status:
          "completed",

        progress:
          100,

        completedAt:
          new Date(),
      }
    );

    await Survey.findByIdAndUpdate(
      survey._id,
      {
        status:
          "completed",
      }
    );

    await updateSurveyStats(
      survey._id
    );

    io
      ?.to(`survey:${survey.surveyId}`)
      .emit(
        "analysis:completed",
        {
          surveyId:
            survey.surveyId,

          jobId:
            job.jobId,
        }
      );

  } catch (error) {

    await AnalysisJob.findByIdAndUpdate(
      job._id,
      {
        status:
          "failed",

        error:
          error.message,

        completedAt:
          new Date(),
      }
    );

    await Survey.findByIdAndUpdate(
      survey._id,
      {
        status:
          "failed",
      }
    );

    io
      ?.to(`survey:${survey.surveyId}`)
      .emit(
        "analysis:failed",
        {
          surveyId:
            survey.surveyId,

          jobId:
            job.jobId,

          message:
            error.message,
        }
      );
  }
}


// ============================================================
// UPDATE SURVEY STATISTICS
// ============================================================

export async function updateSurveyStats(
  surveyId
) {
  const [
    detections,
    totalFrames,
  ] = await Promise.all([
    Detection.find({
      survey:
        surveyId,
    }).lean(),

    SonarFrame.countDocuments({
      survey:
        surveyId,
    }),
  ]);

  const stats = {
    frames:
      totalFrames,

    detections:
      detections.length,

    criticalDetections:
      detections.filter(
        (d) =>
          d.riskLevel ===
          "CRITICAL"
      ).length,

    highRiskDetections:
      detections.filter(
        (d) =>
          d.riskLevel ===
          "HIGH"
      ).length,

    ghostNets:
      detections.filter(
        (d) =>
          d.classification ===
          "ghost_net"
      ).length,

    shipwrecks:
      detections.filter(
        (d) =>
          d.classification ===
          "shipwreck"
      ).length,

    pipes:
      detections.filter(
        (d) =>
          d.classification ===
          "pipe"
      ).length,

    totalEstimatedArea:
      detections.reduce(
        (
          sum,
          detection
        ) =>
          sum +
          Number(
            detection
              .dimensions
              ?.areaM2 ||
            0
          ),
        0
      ),
  };

  await Survey.findByIdAndUpdate(
    surveyId,
    {
      stats,
    }
  );

  return stats;
}


// ============================================================
// SAFE FILE DELETE
// ============================================================

export async function safeDeleteFile(
  filePath
) {
  try {
    await fs.unlink(
      filePath
    );
  } catch {
    // File may already be deleted.
  }
}