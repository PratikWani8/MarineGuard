import dotenv from "dotenv";
dotenv.config();

const required = ["MONGO_URI", "JWT_SECRET", "AI_SERVICE_URL", "CLIENT_URL"];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  aiServiceUrl: process.env.AI_SERVICE_URL.replace(/\/$/, ""),
  clientUrl: process.env.CLIENT_URL,
  maxUploadSizeMb: Number(process.env.MAX_UPLOAD_SIZE_MB || 50),
  aiTimeoutMs: Number(process.env.AI_TIMEOUT_MS || 120000)
};