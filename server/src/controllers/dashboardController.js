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

// ============================================================
// ANALYTICS
// ============================================================

export const analytics = asyncHandler(
  async (req, res) => {
    const [
      totalSurveys,
      totalFrames,
      totalDetections,
      statusBreakdown,
      classificationBreakdown,
      riskBreakdown,
      timeline,
      surveyBreakdown,
      confidenceDistribution,
      depthDistribution,
      coordinates,
    ] = await Promise.all([
      // --------------------------------------------------------
      // Total surveys
      // --------------------------------------------------------
      Survey.countDocuments(),

      // --------------------------------------------------------
      // Total sonar frames
      // --------------------------------------------------------
      SonarFrame.countDocuments(),

      // --------------------------------------------------------
      // Total detections
      // --------------------------------------------------------
      Detection.countDocuments(),

      // --------------------------------------------------------
      // Detection status
      // --------------------------------------------------------
      Detection.aggregate([
        {
          $group: {
            _id: {
              $ifNull: ["$status", "UNKNOWN"],
            },
            count: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
      ]),

      // --------------------------------------------------------
      // Classification
      // --------------------------------------------------------
      Detection.aggregate([
        {
          $group: {
            _id: {
              $ifNull: ["$classification", "UNKNOWN"],
            },
            count: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
      ]),

      // --------------------------------------------------------
      // Risk
      // --------------------------------------------------------
      Detection.aggregate([
        {
          $group: {
            _id: {
              $ifNull: ["$riskLevel", "UNKNOWN"],
            },
            count: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
      ]),

      // --------------------------------------------------------
      // Detection timeline
      // --------------------------------------------------------
      Detection.aggregate([
        {
          $match: {
            createdAt: {
              $exists: true,
              $ne: null,
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            detections: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]),

      // --------------------------------------------------------
      // Detections by survey
      // --------------------------------------------------------
      Detection.aggregate([
        {
          $group: {
            _id: "$survey",
            detections: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            detections: -1,
          },
        },
        {
          $limit: 20,
        },
      ]),

      // --------------------------------------------------------
      // Confidence distribution
      // --------------------------------------------------------
      Detection.aggregate([
        {
          $match: {
            confidence: {
              $exists: true,
              $ne: null,
            },
          },
        },
        {
          $bucket: {
            groupBy: "$confidence",
            boundaries: [
              0,
              20,
              40,
              60,
              80,
              100,
              101,
            ],
            default: "UNKNOWN",
            output: {
              count: {
                $sum: 1,
              },
            },
          },
        },
      ]),

      // --------------------------------------------------------
      // Depth distribution
      // --------------------------------------------------------
      Detection.aggregate([
        {
          $match: {
            "location.depthM": {
              $exists: true,
              $ne: null,
            },
          },
        },
        {
          $group: {
            _id: "$location.depthM",
            detections: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]),

      // --------------------------------------------------------
      // Geographical detections
      // --------------------------------------------------------
      Detection.find({
        "location.available": true,
        "location.latitude": {
          $exists: true,
          $ne: null,
        },
        "location.longitude": {
          $exists: true,
          $ne: null,
        },
      })
        .select(
          [
            "detectionId",
            "classification",
            "confidence",
            "hazardScore",
            "riskLevel",
            "location",
          ].join(" ")
        )
        .lean(),
    ]);

    // ==========================================================
    // Format status data
    // ==========================================================

    const byStatus = statusBreakdown.map((item) => ({
      name: item._id,
      value: item.count,
    }));

    // ==========================================================
    // Format classification data
    // ==========================================================

    const byClass = classificationBreakdown.map((item) => ({
      name: item._id,
      value: item.count,
    }));

    // ==========================================================
    // Format risk data
    // ==========================================================

    const byRisk = riskBreakdown.map((item) => ({
      name: item._id,
      value: item.count,
    }));

    // ==========================================================
    // Format timeline
    // ==========================================================

    const byMonth = timeline.map((item) => ({
      date: item._id,
      detections: item.detections,
    }));

    // ==========================================================
    // Format confidence
    // ==========================================================

    const confidence = confidenceDistribution.map((item) => {
      if (typeof item._id !== "number") {
        return {
          range: "Unknown",
          count: item.count,
        };
      }

      const start = item._id;
      const nextBoundary =
        confidenceDistribution.find(
          (x) =>
            typeof x._id === "number" &&
            x._id > item._id
        )?._id;

      const end =
        nextBoundary !== undefined
          ? nextBoundary
          : 100;

      return {
        range: `${start}-${end}%`,
        count: item.count,
      };
    });

    // ==========================================================
    // Format depth
    // ==========================================================

    const depth = depthDistribution.map((item) => ({
      depth: Number(item._id),
      detections: item.detections,
    }));

    // ==========================================================
    // Format survey data
    // ==========================================================

    const surveyIds = surveyBreakdown
      .map((item) => item._id)
      .filter(Boolean);

    const surveys =
      surveyIds.length > 0
        ? await Survey.find({
            _id: {
              $in: surveyIds,
            },
          })
            .select("_id surveyId name")
            .lean()
        : [];

    const surveyMap = new Map(
      surveys.map((survey) => [
        String(survey._id),
        survey.surveyId ||
          survey.name ||
          String(survey._id),
      ])
    );

    const bySurvey = surveyBreakdown.map(
      (item) => ({
        name:
          surveyMap.get(
            String(item._id)
          ) ||
          String(item._id || "Unknown"),
        value: item.detections,
      })
    );

    // ==========================================================
    // Format geographic data
    // ==========================================================

    const coordinateData = coordinates
      .map((detection) => {
        const latitude = Number(
          detection.location?.latitude
        );

        const longitude = Number(
          detection.location?.longitude
        );

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude)
        ) {
          return null;
        }

        return {
          detectionId:
            detection.detectionId,

          classification:
            detection.classification ||
            "UNKNOWN",

          latitude,

          longitude,

          confidence:
            Number(
              detection.confidence || 0
            ),

          hazardScore:
            Number(
              detection.hazardScore || 0
            ),

          riskLevel:
            detection.riskLevel ||
            "LOW",

          depthM:
            detection.location?.depthM ??
            null,
        };
      })
      .filter(Boolean);

    // ==========================================================
    // Return analytics
    // ==========================================================

    return ok(res, {
      summary: {
        totalSurveys,
        totalFrames,
        totalDetections,
      },

      charts: {
        byClass,
        byStatus,
        byRisk,
        byMonth,
        bySurvey,
        confidence,
        depth,
        coordinates: coordinateData,
      },
    });
  }
);