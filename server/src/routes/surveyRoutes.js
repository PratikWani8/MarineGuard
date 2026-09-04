import { Router } from "express";
import {
  createSurvey, listSurveys, getSurvey, deleteSurvey,
  uploadFrame, startSurveyAnalysis
} from "../controllers/surveyController.js";
import { protect, authorize } from "../middleware/auth.js";
import { sonarUpload } from "../middleware/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(protect);
router.post("/", asyncHandler(createSurvey));
router.get("/", asyncHandler(listSurveys));
router.get("/:surveyId", asyncHandler(getSurvey));
router.delete("/:surveyId", authorize("admin", "operator"), asyncHandler(deleteSurvey));
router.post("/:surveyId/frames", sonarUpload.single("image"), asyncHandler(uploadFrame));
router.post("/:surveyId/analyze", asyncHandler(startSurveyAnalysis));
export default router;