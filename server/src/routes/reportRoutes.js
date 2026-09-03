import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { jsonReport, csvReport, pdfReport } from "../controllers/reportController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(protect);
router.get("/survey/:surveyId/json", asyncHandler(jsonReport));
router.get("/survey/:surveyId/csv", asyncHandler(csvReport));
router.get("/survey/:surveyId/pdf", asyncHandler(pdfReport));
export default router;