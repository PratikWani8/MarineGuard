import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { listDetections, getDetection, updateStatus } from "../controllers/detectionController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(protect);
router.get("/", asyncHandler(listDetections));
router.get("/:detectionId", asyncHandler(getDetection));
router.patch("/:detectionId/status", asyncHandler(updateStatus));
export default router;