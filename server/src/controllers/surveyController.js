import fs from "node:fs";
import path from "node:path";

import Survey from "../models/Survey.js";
import SonarFrame from "../models/SonarFrame.js";
import AnalysisJob from "../models/AnalysisJob.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, fail } from "../utils/apiResponse.js";
import { makeId } from "../utils/ids.js";

import {
  analyzeFrame,
  processSurveyBatch,
  updateSurveyStats
} from "../services/analysisService.js";


/* =========================================================
   HELPERS
========================================================= */

function parseMetadata(raw) {
  if (!raw) return {};

  if (typeof raw === "object") {
    return raw;
  }

  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error(
      "metadata must be valid JSON"
    );

    error.statusCode = 400;
    error.code = "INVALID_METADATA";

    throw error;
  }
}


/**
 * Convert a stored path into an absolute path.
 *
 * Multer may store:
 *
 * uploads/sonar/file.jpg
 *
 * or:
 *
 * C:\project\uploads\sonar\file.jpg
 */
function resolveStoredPath(storedPath) {
  if (!storedPath) {
    return null;
  }

  if (path.isAbsolute(storedPath)) {
    return storedPath;
  }

  return path.resolve(
    process.cwd(),
    storedPath
  );
}


/* =========================================================
   CREATE SURVEY
========================================================= */

export const createSurvey =
  asyncHandler(async (req, res) => {
    const {
      name,
      description,
      startLocation,
      endLocation
    } = req.body;

    if (!name) {
      return fail(
        res,
        "VALIDATION_ERROR",
        "Survey name is required"
      );
    }

    const survey =
      await Survey.create({
        surveyId: makeId("SURVEY"),
        name,
        description,
        operator: req.user._id,
        startLocation,
        endLocation
      });

    return ok(
      res,
      survey,
      201
    );
  });


/* =========================================================
   GET SONAR FRAME IMAGE
========================================================= */

/**
 * GET
 * /api/v1/surveys/:surveyId/frames/:frameId/image
 *
 * This endpoint is protected by the survey router's
 * authentication middleware.
 */
export const getFrameImage =
  asyncHandler(async (req, res) => {
    try {
      const {
        surveyId,
        frameId
      } = req.params;


      /* -----------------------------------------------------
         FIND SURVEY
      ----------------------------------------------------- */

      const survey =
        await Survey.findOne({
          surveyId
        });

      if (!survey) {
        return fail(
          res,
          "SURVEY_NOT_FOUND",
          "Survey not found",
          404
        );
      }


      /* -----------------------------------------------------
         CHECK SURVEY ACCESS
      ----------------------------------------------------- */

      if (
        req.user.role !== "admin" &&
        survey.operator?.toString() !==
          req.user._id?.toString()
      ) {
        return fail(
          res,
          "FORBIDDEN",
          "You do not have access to this survey",
          403
        );
      }


      /* -----------------------------------------------------
         VALIDATE FRAME ID
      ----------------------------------------------------- */

      const numericFrameId =
        Number(frameId);

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


      /* -----------------------------------------------------
         FIND FRAME
      ----------------------------------------------------- */

      const frame =
        await SonarFrame.findOne({
          survey: survey._id,
          frameId: numericFrameId
        });

      if (!frame) {
        return fail(
          res,
          "FRAME_NOT_FOUND",
          "Sonar frame not found",
          404
        );
      }


      /* -----------------------------------------------------
         CHECK STORED PATH
      ----------------------------------------------------- */

      if (!frame.storedPath) {
        return fail(
          res,
          "IMAGE_PATH_MISSING",
          "Sonar image path is missing",
          404
        );
      }


      /* -----------------------------------------------------
         RESOLVE ABSOLUTE PATH
      ----------------------------------------------------- */

      const absolutePath =
        resolveStoredPath(
          frame.storedPath
        );


      /* -----------------------------------------------------
         DEBUG LOG
      ----------------------------------------------------- */

      console.log(
        "Sonar image request:",
        {
          surveyId,
          frameId: numericFrameId,
          storedPath:
            frame.storedPath,
          absolutePath
        }
      );


      /* -----------------------------------------------------
         CHECK FILE EXISTS
      ----------------------------------------------------- */

      if (
        !absolutePath ||
        !fs.existsSync(
          absolutePath
        )
      ) {
        console.error(
          "Sonar image file not found:",
          absolutePath
        );

        return fail(
          res,
          "IMAGE_NOT_FOUND",
          "Sonar image file not found on server",
          404
        );
      }


      /* -----------------------------------------------------
         GET MIME TYPE
      ----------------------------------------------------- */

      const extension =
        path
          .extname(
            absolutePath
          )
          .toLowerCase();

      const mimeTypes = {
        ".jpg":
          "image/jpeg",
        ".jpeg":
          "image/jpeg",
        ".png":
          "image/png",
        ".webp":
          "image/webp",
        ".bmp":
          "image/bmp",
        ".tif":
          "image/tiff",
        ".tiff":
          "image/tiff"
      };

      const contentType =
        mimeTypes[
          extension
        ] ||
        "application/octet-stream";


      /* -----------------------------------------------------
         RESPONSE HEADERS
      ----------------------------------------------------- */

      res.setHeader(
        "Content-Type",
        contentType
      );

      res.setHeader(
        "Cache-Control",
        "private, max-age=300"
      );


      /* -----------------------------------------------------
         SEND IMAGE
      ----------------------------------------------------- */

      return res.sendFile(
        absolutePath,
        (error) => {
          if (error) {
            console.error(
              "Failed to send sonar image:",
              error
            );
          }
        }
      );
    } catch (error) {
      console.error(
        "getFrameImage error:",
        error
      );

      return fail(
        res,
        "IMAGE_LOAD_ERROR",
        error.message ||
          "Failed to load sonar image",
        500
      );
    }
  });


/* =========================================================
   LIST SURVEYS
========================================================= */

export const listSurveys =
  asyncHandler(async (req, res) => {
    const filter =
      req.user.role === "admin"
        ? {}
        : {
            operator:
              req.user._id
          };

    const surveys =
      await Survey.find(
        filter
      )
        .sort({
          createdAt: -1
        })
        .lean();

    return ok(
      res,
      surveys
    );
  });


/* =========================================================
   GET SINGLE SURVEY
========================================================= */

export const getSurvey =
  asyncHandler(async (req, res) => {
    const survey =
      await Survey.findOne({
        surveyId:
          req.params.surveyId
      }).populate(
        "operator",
        "name email role"
      );

    if (!survey) {
      return fail(
        res,
        "SURVEY_NOT_FOUND",
        "Survey not found",
        404
      );
    }


    /* -----------------------------------------------------
       CHECK ACCESS
    ----------------------------------------------------- */

    if (
      req.user.role !== "admin" &&
      survey.operator?._id?.toString() !==
        req.user._id?.toString()
    ) {
      return fail(
        res,
        "FORBIDDEN",
        "You do not have access to this survey",
        403
      );
    }

    return ok(
      res,
      survey
    );
  });


/* =========================================================
   DELETE SURVEY
========================================================= */

export const deleteSurvey =
  asyncHandler(async (req, res) => {
    const survey =
      await Survey.findOne({
        surveyId:
          req.params.surveyId
      });

    if (!survey) {
      return fail(
        res,
        "SURVEY_NOT_FOUND",
        "Survey not found",
        404
      );
    }


    /* -----------------------------------------------------
       CHECK ACCESS
    ----------------------------------------------------- */

    if (
      req.user.role !== "admin" &&
      survey.operator?.toString() !==
        req.user._id?.toString()
    ) {
      return fail(
        res,
        "FORBIDDEN",
        "You do not have access to this survey",
        403
      );
    }


    /* -----------------------------------------------------
       DELETE RELATED DATA
    ----------------------------------------------------- */

    await Promise.all([
      Survey.deleteOne({
        _id: survey._id
      }),

      SonarFrame.deleteMany({
        survey: survey._id
      }),

      AnalysisJob.deleteMany({
        survey: survey._id
      })
    ]);


    return ok(
      res,
      {
        deleted: true
      }
    );
  });


/* =========================================================
   UPLOAD SONAR FRAME
========================================================= */

export const uploadFrame =
  asyncHandler(async (req, res) => {

    /* -----------------------------------------------------
       FIND SURVEY
    ----------------------------------------------------- */

    const survey =
      await Survey.findOne({
        surveyId:
          req.params.surveyId
      });

    if (!survey) {
      return fail(
        res,
        "SURVEY_NOT_FOUND",
        "Survey not found",
        404
      );
    }


    /* -----------------------------------------------------
       CHECK IMAGE
    ----------------------------------------------------- */

    if (!req.file) {
      return fail(
        res,
        "IMAGE_REQUIRED",
        "Sonar image is required"
      );
    }


    /* -----------------------------------------------------
       PARSE METADATA
    ----------------------------------------------------- */

    const metadata =
      parseMetadata(
        req.body.metadata
      );


    /* -----------------------------------------------------
       FRAME ID
    ----------------------------------------------------- */

    const frameId =
      Number(
        metadata.frame_id
      );

    if (
      !Number.isInteger(
        frameId
      ) ||
      frameId < 0
    ) {
      return fail(
        res,
        "INVALID_FRAME_ID",
        "metadata.frame_id must be a non-negative integer"
      );
    }


    /* -----------------------------------------------------
       CHECK DUPLICATE
    ----------------------------------------------------- */

    const existing =
      await SonarFrame.findOne({
        survey: survey._id,
        frameId
      });

    if (existing) {
      return fail(
        res,
        "FRAME_EXISTS",
        "Frame ID already exists for this survey",
        409
      );
    }


    /* -----------------------------------------------------
       CREATE FRAME
    ----------------------------------------------------- */

    const frame =
      await SonarFrame.create({
        survey:
          survey._id,

        frameId,

        filename:
          req.file.filename,

        storedPath:
          req.file.path,

        metadata
      });


    console.log(
      "Sonar frame saved:",
      {
        id: frame._id,
        frameId:
          frame.frameId,
        filename:
          frame.filename,
        storedPath:
          frame.storedPath
      }
    );


    /* -----------------------------------------------------
       UPDATE SURVEY STATUS
    ----------------------------------------------------- */

    survey.status =
      "processing";

    await survey.save();


    /* -----------------------------------------------------
       RUN AI ANALYSIS
    ----------------------------------------------------- */

    try {
      const result =
        await analyzeFrame({
          frame,
          survey,
          io: req.app.get(
            "io"
          )
        });


      /* ---------------------------------------------------
         UPDATE SURVEY STATS
      --------------------------------------------------- */

      try {
        await updateSurveyStats(
          survey._id
        );
      } catch (statsError) {
        console.error(
          "Failed to update survey stats:",
          statsError
        );
      }


      /* ---------------------------------------------------
         RESPONSE
      --------------------------------------------------- */

      return ok(
        res,
        {
          frame,

          processingTime:
            result.processingTime,

          detections:
            result.detections,

          ai:
            result.result
        },
        201
      );
    } catch (error) {

      console.error(
        "AI analysis failed:",
        error
      );

      return fail(
        res,
        "AI_SERVICE_ERROR",
        error.message ||
          "AI analysis failed",
        502
      );
    }
  });


/* =========================================================
   START SURVEY BATCH ANALYSIS
========================================================= */

export const startSurveyAnalysis =
  asyncHandler(async (req, res) => {

    /* -----------------------------------------------------
       FIND SURVEY
    ----------------------------------------------------- */

    const survey =
      await Survey.findOne({
        surveyId:
          req.params.surveyId
      });

    if (!survey) {
      return fail(
        res,
        "SURVEY_NOT_FOUND",
        "Survey not found",
        404
      );
    }


    /* -----------------------------------------------------
       GET FRAMES
    ----------------------------------------------------- */

    const frames =
      await SonarFrame.find({
        survey:
          survey._id
      }).sort({
        frameId: 1
      });


    if (!frames.length) {
      return fail(
        res,
        "NO_FRAMES",
        "No sonar frames available for analysis"
      );
    }


    /* -----------------------------------------------------
       CREATE ANALYSIS JOB
    ----------------------------------------------------- */

    const job =
      await AnalysisJob.create({
        jobId:
          makeId("JOB"),

        survey:
          survey._id,

        totalFrames:
          frames.length
      });


    /* -----------------------------------------------------
       START BATCH PROCESSING
    ----------------------------------------------------- */

    processSurveyBatch({
      survey,
      job,
      frames,
      io: req.app.get(
        "io"
      )
    });


    /* -----------------------------------------------------
       RESPONSE
    ----------------------------------------------------- */

    return ok(
      res,
      {
        jobId:
          job.jobId,

        status:
          "processing",

        totalFrames:
          frames.length
      },
      202
    );
  });