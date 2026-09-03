import { Router } from "express";
import { aiHealth } from "../services/aiService.js";

const router = Router();

router.get("/", async (req, res) => {
  let ai = { status: "unavailable" };
  try {
    ai = await aiHealth();
  } catch {}
  res.json({
    success: true,
    data: {
      service: "marineguard-backend",
      status: "ok",
      aiService: ai
    }
  });
});

export default router;