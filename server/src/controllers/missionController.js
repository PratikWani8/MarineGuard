import CleanupMission from "../models/CleanupMission.js";
import Survey from "../models/Survey.js";
import Detection from "../models/Detection.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, fail } from "../utils/apiResponse.js";
import { makeId } from "../utils/ids.js";
import { planRoute } from "../services/aiService.js";

export const createMission = asyncHandler(async (req, res) => {
  const {
    surveyId,
    start,
    targetDetectionIds = [],
    restrictedZones = [],
  } = req.body;

  // ---------------------------------------------------------
  // Validate survey
  // ---------------------------------------------------------

  if (!surveyId) {
    return fail(
      res,
      "SURVEY_ID_REQUIRED",
      "Survey ID is required",
      400
    );
  }

  const survey = await Survey.findOne({
    surveyId,
  });

  if (!survey) {
    return fail(
      res,
      "SURVEY_NOT_FOUND",
      "Survey not found",
      404
    );
  }

  // ---------------------------------------------------------
  // Validate AUV starting location
  // ---------------------------------------------------------

  const latitude = Number(
    start?.latitude
  );

  const longitude = Number(
    start?.longitude
  );

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return fail(
      res,
      "INVALID_START_LOCATION",
      "Valid AUV latitude and longitude are required",
      400
    );
  }

  const normalizedStart = {
    latitude,
    longitude,
  };

  // ---------------------------------------------------------
  // Fetch detections from MongoDB
  // ---------------------------------------------------------

  let detections;

  if (
    Array.isArray(targetDetectionIds) &&
    targetDetectionIds.length > 0
  ) {
    detections =
      await Detection.find({
        detectionId: {
          $in: targetDetectionIds,
        },

        survey: survey._id,

        "location.available": true,
      }).lean();
  } else {
    detections =
      await Detection.find({
        survey: survey._id,

        riskLevel: {
          $in: [
            "HIGH",
            "CRITICAL",
          ],
        },

        "location.available": true,
      }).lean();
  }

  // ---------------------------------------------------------
  // Make sure detections actually exist
  // ---------------------------------------------------------

  if (!detections.length) {
    return fail(
      res,
      "NO_VALID_TARGETS",
      "No geolocated cleanup targets were found for this survey",
      400
    );
  }

  // ---------------------------------------------------------
  // Convert MongoDB Detection format
  //
  // MongoDB:
  //
  // location.latitude
  // location.longitude
  // hazardScore
  //
  // Python planner expects:
  //
  // location:
  //   latitude
  //   longitude
  //
  // hazard_score
  // ---------------------------------------------------------

  const targets = detections
    .filter(
      (detection) =>
        detection.location?.available &&
        Number.isFinite(
          Number(
            detection.location.latitude
          )
        ) &&
        Number.isFinite(
          Number(
            detection.location.longitude
          )
        )
    )
    .map((detection) => ({
      detection_id:
        detection.detectionId,

      detectionId:
        detection.detectionId,

      track_id:
        detection.trackId || null,

      trackId:
        detection.trackId || null,

      classification:
        detection.classification,

      confidence:
        Number(
          detection.confidence || 0
        ),

      hazard_score:
        Number(
          detection.hazardScore || 0
        ),

      hazardScore:
        Number(
          detection.hazardScore || 0
        ),

      risk_level:
        detection.riskLevel,

      riskLevel:
        detection.riskLevel,

      location: {
        latitude:
          Number(
            detection.location.latitude
          ),

        longitude:
          Number(
            detection.location.longitude
          ),

        depth_m:
          detection.location.depthM ??
          null,

        position_accuracy_estimate_m:
          detection.location
            .positionAccuracyEstimateM ??
          null,
      },
    }));

  // ---------------------------------------------------------
  // Check valid target count
  // ---------------------------------------------------------

  if (!targets.length) {
    return fail(
      res,
      "NO_GEOLOCATED_TARGETS",
      "Selected detections do not contain valid GPS coordinates",
      400
    );
  }

  // ---------------------------------------------------------
  // Call AI route planner
  // ---------------------------------------------------------

  const result = await planRoute({
    start: normalizedStart,

    targets,

    restricted_zones:
      Array.isArray(
        restrictedZones
      )
        ? restrictedZones
        : [],
  });

  // ---------------------------------------------------------
  // Normalize AI response
  // ---------------------------------------------------------

  const route =
    result?.data ||
    result ||
    {};

  const orderedTargets =
    route?.ordered_targets ||
    route?.orderedTargets ||
    [];

  const totalDistanceKm =
    Number(
      route?.total_distance_km ??
        route?.totalDistanceKm ??
        0
    );

  const estimatedDurationMinutes =
    Number(
      route?.estimated_duration_minutes ??
        route?.estimatedDurationMinutes ??
        0
    );

  const priorityScore =
    Number(
      route?.priority_score ??
        route?.priorityScore ??
        0
    );

  const targetCount =
    Number(
      route?.target_count ??
        route?.targetCount ??
        orderedTargets.length
    );

  const skippedTargetCount =
    Number(
      route?.skipped_target_count ??
        route?.skippedTargetCount ??
        0
    );

  const skippedTargets =
    route?.skipped_targets ||
    route?.skippedTargets ||
    [];

  const returnToStart =
    Boolean(
      route?.return_to_start ??
        route?.returnToStart ??
        false
    );

  const returnDistanceKm =
    Number(
      route?.return_distance_km ??
        route?.returnDistanceKm ??
        0
    );

  // ---------------------------------------------------------
  // Ensure route actually contains targets
  // ---------------------------------------------------------

  if (!orderedTargets.length) {
    return fail(
      res,
      "ROUTE_EMPTY",
      "AI route planner returned no ordered targets",
      400
    );
  }

  // ---------------------------------------------------------
  // Generate mission ID
  // ---------------------------------------------------------

  const missionId =
    makeId("MISSION");

  // ---------------------------------------------------------
  // Save mission in MongoDB
  // ---------------------------------------------------------

  const mission =
    await CleanupMission.create({
      missionId,

      survey:
        survey._id,

      startLocation:
        normalizedStart,

      targets:
        orderedTargets,

      totalDistanceKm,

      estimatedDurationMinutes,

      priorityScore,

      status: "planned",
    });

  // ---------------------------------------------------------
  // Return frontend-friendly response
  // ---------------------------------------------------------

  return ok(
    res,
    {
      missionId:
        mission.missionId,

      surveyId:
        survey.surveyId,

      startLocation:
        normalizedStart,

      ordered_targets:
        orderedTargets,

      total_distance_km:
        totalDistanceKm,

      estimated_duration_minutes:
        estimatedDurationMinutes,

      priority_score:
        priorityScore,

      target_count:
        targetCount,

      skipped_target_count:
        skippedTargetCount,

      skipped_targets:
        skippedTargets,

      return_to_start:
        returnToStart,

      return_distance_km:
        returnDistanceKm,

      status:
        mission.status,

      createdAt:
        mission.createdAt,
    },
    201
  );
});