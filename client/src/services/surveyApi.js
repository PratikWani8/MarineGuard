import api from "./api";

export const getSurveys = () =>
  api.get("/surveys");

export const getSurvey = (surveyId) =>
  api.get(
    `/surveys/${encodeURIComponent(
      surveyId
    )}`
  );

export const createSurvey = (payload) =>
  api.post(
    "/surveys",
    payload
  );

export const deleteSurvey = (
  surveyId
) =>
  api.delete(
    `/surveys/${encodeURIComponent(
      surveyId
    )}`
  );

/**
 * Upload a Side-Scan Sonar frame
 *
 * Backend:
 * POST /api/v1/surveys/:surveyId/frames
 *
 * multipart/form-data:
 * image
 * metadata
 */
export const uploadFrame = (
  surveyId,
  file,
  metadata,
  onUploadProgress
) => {
  const form = new FormData();

  form.append(
    "image",
    file
  );

  form.append(
    "metadata",
    JSON.stringify(metadata)
  );

  return api.post(
    `/surveys/${encodeURIComponent(
      surveyId
    )}/frames`,
    form,
    {
      onUploadProgress
    }
  );
};

/**
 * Analyze all frames in a survey
 */
export const analyzeSurvey = (
  surveyId
) =>
  api.post(
    `/surveys/${encodeURIComponent(
      surveyId
    )}/analyze`
  );

/**
 * Returns the relative URL for a
 * sonar frame image.
 *
 * NOTE:
 * This is kept for components that
 * may need the URL directly.
 */
export const getFrameImageUrl = (
  surveyId,
  frameId
) =>
  `/api/v1/surveys/${encodeURIComponent(
    surveyId
  )}/frames/${encodeURIComponent(
    frameId
  )}/image`;

/**
 * Get protected sonar frame image.
 *
 * Axios automatically adds the
 * Authorization header through
 * api.js interceptor.
 *
 * Returns a Blob.
 */
export const getFrameImage = (
  surveyId,
  frameId
) =>
  api.get(
    `/surveys/${encodeURIComponent(
      surveyId
    )}/frames/${encodeURIComponent(
      frameId
    )}/image`,
    {
      responseType: "blob"
    }
  );