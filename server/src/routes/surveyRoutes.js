import { Router } from "express";

import {
  createSurvey,
  listSurveys,
  getSurvey,
  deleteSurvey,
  uploadFrame,
  startSurveyAnalysis,
  getFrameImage
} from "../controllers/surveyController.js";

import {
  protect,
  authorize
} from "../middleware/auth.js";

import {
  sonarUpload
} from "../middleware/upload.js";

import {
  asyncHandler
} from "../utils/asyncHandler.js";

const router = Router();

/* =========================================================
   AUTHENTICATION
========================================================= */

router.use(protect);


/* =========================================================
   SURVEYS
========================================================= */

router.post(
  "/",
  asyncHandler(createSurvey)
);

router.get(
  "/",
  asyncHandler(listSurveys)
);

router.get(
  "/:surveyId",
  asyncHandler(getSurvey)
);

router.delete(
  "/:surveyId",
  authorize(
    "admin",
    "operator"
  ),
  asyncHandler(deleteSurvey)
);


/* =========================================================
   SONAR FRAMES
========================================================= */

router.post(
  "/:surveyId/frames",
  sonarUpload.single(
    "image"
  ),
  asyncHandler(uploadFrame)
);


/*
 * IMPORTANT:
 * This must exist for SonarAnalysis.jsx
 */
router.get(
  "/:surveyId/frames/:frameId/image",
  asyncHandler(getFrameImage)
);


/* =========================================================
   SURVEY ANALYSIS
========================================================= */

router.post(
  "/:surveyId/analyze",
  asyncHandler(
    startSurveyAnalysis
  )
);

export default router;