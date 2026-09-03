import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { overview, heatmap } from "../controllers/dashboardController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(protect);
router.get("/overview", asyncHandler(overview));
router.get("/heatmap", asyncHandler(heatmap));
export default router;