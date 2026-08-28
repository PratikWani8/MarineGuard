import api from "./api";

export const getDetections = (params = {}) => api.get("/detections", { params });
export const getDetection = (detectionId) => api.get(`/detections/${encodeURIComponent(detectionId)}`);
export const updateDetectionStatus = (detectionId, status) =>
  api.patch(`/detections/${encodeURIComponent(detectionId)}/status`, { status });

export const verifyDetection = (detectionId, image) => {
  const form = new FormData();
  if (image) form.append("image", image);
  return api.post(`/detections/${encodeURIComponent(detectionId)}/verify`, form, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};