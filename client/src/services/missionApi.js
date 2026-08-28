import api from "./api";

export const planMission = (payload) => api.post("/missions/plan", payload);