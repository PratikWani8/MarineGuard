import Detection from "../models/Detection.js";
import Survey from "../models/Survey.js";
import SonarFrame from "../models/SonarFrame.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import {
  ok,
  fail
} from "../utils/apiResponse.js";

/**
 * List detections
 *
 * Supported query parameters:
 *
 * surveyId
 * frameId
 * classification
 * riskLevel
 * status
 * minConfidence
 * page
 * limit
 */
export const listDetections =
  asyncHandler(
    async (req, res) => {
      const filter = {};

      /* =========================
         SURVEY FILTER
      ========================== */

      if (req.query.surveyId) {
        const survey =
          await Survey.findOne({
            surveyId:
              req.query.surveyId
          }).select("_id");

        if (!survey) {
          return ok(res, {
            items: [],
            page: 1,
            limit: 50,
            total: 0,
            pages: 0
          });
        }

        filter.survey =
          survey._id;
      }

      /* =========================
         FRAME FILTER
      ========================== */

      if (
        req.query.frameId !==
        undefined
      ) {
        const numericFrameId =
          Number(
            req.query.frameId
          );

        if (
          !Number.isInteger(
            numericFrameId
          )
        ) {
          return fail(
            res,
            "INVALID_FRAME_ID",
            "Invalid frame ID",
            400
          );
        }

        /*
         * Find the actual SonarFrame
         * MongoDB document.
         */
        const frameFilter = {
          frameId:
            numericFrameId
        };

        /*
         * Restrict frame to the survey
         * when surveyId was provided.
         */
        if (filter.survey) {
          frameFilter.survey =
            filter.survey;
        }

        const frame =
          await SonarFrame.findOne(
            frameFilter
          ).select("_id");

        if (!frame) {
          return ok(res, {
            items: [],
            page: 1,
            limit: 50,
            total: 0,
            pages: 0
          });
        }

        /*
         * Detection.frame contains
         * the SonarFrame ObjectId.
         */
        filter.frame =
          frame._id;
      }

      /* =========================
         OTHER FILTERS
      ========================== */

      if (
        req.query.classification
      ) {
        filter.classification =
          req.query.classification;
      }

      if (
        req.query.riskLevel
      ) {
        filter.riskLevel =
          req.query.riskLevel;
      }

      if (req.query.status) {
        filter.status =
          req.query.status;
      }

      if (
        req.query.minConfidence !==
        undefined
      ) {
        const minConfidence =
          Number(
            req.query.minConfidence
          );

        if (
          !Number.isFinite(
            minConfidence
          )
        ) {
          return fail(
            res,
            "INVALID_CONFIDENCE",
            "Invalid minimum confidence",
            400
          );
        }

        filter.confidence = {
          $gte: minConfidence
        };
      }

      /* =========================
         PAGINATION
      ========================== */

      const page = Math.max(
        1,
        Number(
          req.query.page || 1
        )
      );

      const limit = Math.min(
        100,
        Math.max(
          1,
          Number(
            req.query.limit || 50
          )
        )
      );

      const skip =
        (page - 1) * limit;

      /* =========================
         DATABASE
      ========================== */

      const [
        items,
        total
      ] = await Promise.all([
        Detection.find(filter)
          .sort({
            createdAt: -1
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        Detection.countDocuments(
          filter
        )
      ]);

      /* =========================
         RESPONSE
      ========================== */

      return ok(res, {
        items,
        page,
        limit,
        total,
        pages: Math.ceil(
          total / limit
        )
      });
    }
  );

/**
 * Get one detection
 */
export const getDetection =
  asyncHandler(
    async (req, res) => {
      const detection =
        await Detection.findOne({
          detectionId:
            req.params.detectionId
        }).populate(
          "survey frame"
        );

      if (!detection) {
        return fail(
          res,
          "DETECTION_NOT_FOUND",
          "Detection not found",
          404
        );
      }

      return ok(
        res,
        detection
      );
    }
  );

/**
 * Update detection status
 */
export const updateStatus =
  asyncHandler(
    async (req, res) => {
      const { status } =
        req.body;

      if (
        ![
          "unverified",
          "verified",
          "rejected",
          "resolved"
        ].includes(status)
      ) {
        return fail(
          res,
          "INVALID_STATUS",
          "Invalid detection status"
        );
      }

      const detection =
        await Detection.findOneAndUpdate(
          {
            detectionId:
              req.params.detectionId
          },
          {
            status,

            ...(status ===
            "verified"
              ? {
                  "verification.status":
                    "verified"
                }
              : {})
          },
          {
            new: true
          }
        );

      if (!detection) {
        return fail(
          res,
          "DETECTION_NOT_FOUND",
          "Detection not found",
          404
        );
      }

      return ok(
        res,
        detection
      );
    }
  );