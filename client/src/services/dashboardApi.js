import api from "./api";

export const getOverview = () => api.get("/dashboard/overview");
export const getHeatmap = (params = {}) => api.get("/dashboard/heatmap", { params });