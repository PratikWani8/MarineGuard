import Detection from "../models/Detection.js";
import Survey from "../models/Survey.js";
import SonarFrame from "../models/SonarFrame.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/apiResponse.js";

export const overview = asyncHandler(
  async (req, res) => {
    const [
      totalSurveys,
      totalFrames,
      grouped,
    ] = await Promise.all([
      Survey.countDocuments(),

      SonarFrame.countDocuments(),

      Detection.aggregate([
        {
          $group: {
            _id: null,

            totalDetections: {
              $sum: 1,
            },

            ghostNets: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$classification",
                      "ghost_net",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            shipwrecks: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$classification",
                      "shipwreck",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            pipes: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$classification",
                      "pipe",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            criticalDetections: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$riskLevel",
                      "CRITICAL",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            highRiskDetections: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$riskLevel",
                      "HIGH",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            averageConfidence: {
              $avg: "$confidence",
            },

            totalEstimatedArea: {
              $sum: {
                $ifNull: [
                  "$dimensions.areaM2",
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    const stats =
      grouped[0] || {
        totalDetections: 0,
        ghostNets: 0,
        shipwrecks: 0,
        pipes: 0,
        criticalDetections: 0,
        highRiskDetections: 0,
        averageConfidence: 0,
        totalEstimatedArea: 0,
      };

    return ok(res, {
      totalSurveys,
      totalFrames,

      ...stats,

      averageConfidence: Number(
        stats.averageConfidence || 0
      ),

      totalEstimatedArea: Number(
        stats.totalEstimatedArea || 0
      ),
    });
  }
);


// ============================================================
// MARINE HEATMAP
// ============================================================

export const heatmap = asyncHandler(
  async (req, res) => {

    // --------------------------------------------------------
    // Base query
    //
    // ONLY detections that actually have
    // geolocation data are included.
    // --------------------------------------------------------

    const filter = {
      "location.available": true,

      "location.latitude": {
        $exists: true,
        $ne: null,
      },

      "location.longitude": {
        $exists: true,
        $ne: null,
      },
    };


    // --------------------------------------------------------
    // Classification filter
    // --------------------------------------------------------

    if (
      req.query.classification
    ) {
      filter.classification =
        req.query.classification;
    }


    // --------------------------------------------------------
    // Risk filter
    // --------------------------------------------------------

    if (
      req.query.riskLevel
    ) {
      filter.riskLevel =
        req.query.riskLevel.toUpperCase();
    }


    // --------------------------------------------------------
    // Survey filter
    // --------------------------------------------------------

    if (req.query.surveyId) {

      const survey =
        await Survey.findOne({
          surveyId:
            req.query.surveyId,
        })
          .select("_id")
          .lean();

      if (!survey) {
        return ok(res, []);
      }

      filter.survey =
        survey._id;
    }


    // --------------------------------------------------------
    // Fetch REAL detections from MongoDB
    // --------------------------------------------------------

    const items =
      await Detection.find(filter)
        .select(
          [
            "detectionId",
            "trackId",
            "classification",
            "confidence",
            "hazardScore",
            "riskLevel",
            "location",
            "persistence",
          ].join(" ")
        )
        .lean();


    // --------------------------------------------------------
    // Convert DB documents to map points
    // --------------------------------------------------------

    const points = items
      .map((detection) => {

        const latitude =
          Number(
            detection.location
              ?.latitude
          );

        const longitude =
          Number(
            detection.location
              ?.longitude
          );

        if (
          !Number.isFinite(
            latitude
          ) ||
          !Number.isFinite(
            longitude
          )
        ) {
          return null;
        }


        // ----------------------------------------------------
        // Hazard score
        //
        // Use hazardScore first.
        // Fall back to confidence only when
        // hazardScore is unavailable.
        // ----------------------------------------------------

        const rawScore =
          detection.hazardScore ??
          detection.confidence ??
          0;

        const hazardScore =
          Math.max(
            0,
            Math.min(
              100,
              Number(rawScore) || 0
            )
          );


        return {
          detectionId:
            detection.detectionId,

          trackId:
            detection.trackId ||
            null,

          latitude,

          longitude,

          intensity:
            hazardScore / 100,

          classification:
            detection.classification,

          hazardScore,

          riskLevel:
            detection.riskLevel ||
            "LOW",

          confidence:
            Number(
              detection.confidence || 0
            ),

          depthM:
            detection.location
              ?.depthM ??
            null,

          positionAccuracyM:
            detection.location
              ?.positionAccuracyEstimateM ??
            null,

          framesSeen:
            detection.persistence
              ?.framesSeen ??
            0,

          confirmed:
            detection.persistence
              ?.confirmed ??
            false,
        };
      })
      .filter(Boolean);

    return ok(res, points);
  }
);