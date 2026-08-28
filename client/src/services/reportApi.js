import api from "./api";

export const getJsonReport = (surveyId) => api.get(`/reports/survey/${encodeURIComponent(surveyId)}/json`);
export const downloadCsv = (surveyId) => api.get(`/reports/survey/${encodeURIComponent(surveyId)}/csv`, { responseType: "blob" });
export const downloadPdf = (surveyId) => api.get(`/reports/survey/${encodeURIComponent(surveyId)}/pdf`, { responseType: "blob" });