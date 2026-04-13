// frontend/src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3001/schmgt",
});



// Request interceptor - adds token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("No token found in localStorage");}

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor - handles 401 errors
api.interceptors.response.use(
  (response) => {
    
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {

      // Check what the error message is
      const errorMsg = error.response.data?.error || "Unknown error";
      console.warn("Received 401 Unauthorized:", errorMsg);
      // Don't redirect if it's a login attempt
      if (error.config?.url !== "/login") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
