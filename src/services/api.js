import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3200",
  timeout: 15000
});

api.interceptors.request.use((config) => {
  // Automatically attach admin JWT for protected endpoints.
  const token = localStorage.getItem("admin_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
