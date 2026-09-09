import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  overview,
  heatmap,
  analytics,
} from "../controllers/dashboardController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(protect);
router.get("/overview", asyncHandler(overview));
router.get("/heatmap", asyncHandler(heatmap));
router.get("/analytics", asyncHandler(analytics));
export default router;