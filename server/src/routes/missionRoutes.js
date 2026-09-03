import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { createMission } from "../controllers/missionController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(protect);
router.post("/plan", asyncHandler(createMission));
export default router;