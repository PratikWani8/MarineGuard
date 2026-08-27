import axios from "axios";

export const baseURL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL,
  timeout: 60000,
});

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("marineguard_token") ||
      sessionStorage.getItem("marineguard_token") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;

      localStorage.removeItem("marineguard_token");
      sessionStorage.removeItem("marineguard_token");

      if (
        currentPath !== "/login" &&
        currentPath !== "/register"
      ) {
        window.location.href = "/login";
      }
    }

    if (!error.response) {
      error.userMessage =
        "Unable to connect to the MarineGuard backend.";
    } else {
      error.userMessage =
        error.response.data?.error?.message ||
        "Request failed.";
    }

    return Promise.reject(error);
  }
);

export default api;