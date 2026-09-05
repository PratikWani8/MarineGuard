import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import surveyRoutes from "./routes/surveyRoutes.js";
import detectionRoutes from "./routes/detectionRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import missionRoutes from "./routes/missionRoutes.js";
import verificationRoutes from "./routes/verificationRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({
  origin: env.clientUrl,
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false
}));

app.get("/", (req, res) => res.json({
  success: true,
  data: { name: "MarineGuard AI Backend", version: "1.0.0" }
}));

app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/surveys", surveyRoutes);
app.use("/api/v1/detections", detectionRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/missions", missionRoutes);
app.use("/api/v1/detections", verificationRoutes);
app.use("/api/v1/reports", reportRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;