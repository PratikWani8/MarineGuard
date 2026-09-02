import axios from "axios";
import fs from "node:fs";
import FormData from "form-data";
import { env } from "../config/env.js";

const client = axios.create({
  baseURL: env.aiServiceUrl,
  timeout: env.aiTimeoutMs
});

export async function aiHealth() {
  const { data } = await client.get("/api/v1/health");
  return data;
}

export async function analyzeSonarFrame(filePath, metadata) {
  const form = new FormData();
  form.append("image", fs.createReadStream(filePath));
  form.append("metadata", JSON.stringify(metadata));

  const { data } = await client.post("/api/v1/analyze", form, {
    headers: form.getHeaders()
  });
  return data;
}

export async function analyzeSonarBatch(frames) {
  const form = new FormData();
  for (const frame of frames) {
    form.append("images", fs.createReadStream(frame.filePath));
    form.append("metadata", JSON.stringify(frame.metadata));
  }

  const { data } = await client.post("/api/v1/analyze/batch", form, {
    headers: form.getHeaders()
  });
  return data;
}

export async function planRoute(payload) {
  const { data } = await client.post("/api/v1/route-plan", payload);
  return data;
}

export async function verifyDetection(payload, cameraPath) {
  const form = new FormData();
  form.append("metadata", JSON.stringify(payload));
  if (cameraPath) form.append("image", fs.createReadStream(cameraPath));

  const { data } = await client.post("/api/v1/verify", form, {
    headers: form.getHeaders()
  });
  return data;
}