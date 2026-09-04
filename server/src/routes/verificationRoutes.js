import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { cameraUpload } from "../middleware/upload.js";
import { verify } from "../controllers/verificationController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(protect);
router.post("/:detectionId/verify", cameraUpload.single("image"), asyncHandler(verify));
export default router;