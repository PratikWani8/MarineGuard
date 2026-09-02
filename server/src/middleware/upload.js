import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs";
import { env } from "../config/env.js";

const allowed = new Set([
  "image/png", "image/jpeg", "image/jpg", "image/tiff", "image/webp"
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = file.fieldname === "cameraImage" ? "uploads/camera" : "uploads/sonar";
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`);
  }
});

function fileFilter(req, file, cb) {
  if (!allowed.has(file.mimetype)) {
    return cb(Object.assign(new Error("Unsupported image MIME type"), { code: "INVALID_FILE_TYPE", statusCode: 400 }));
  }
  cb(null, true);
}

export const sonarUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.maxUploadSizeMb * 1024 * 1024 }
});

export const cameraUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.maxUploadSizeMb * 1024 * 1024 }
});