import axios from "axios";

// Create Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry if this is already a refresh request
    if (error.config?.url?.includes('/auth/token/refresh/')) {
      sessionStorage.removeItem("access_token");
      // DON'T redirect here - let route guards handle it
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await api.post("/api/auth/token/refresh/");
        const newAccess = res.data.access;

        sessionStorage.setItem("access_token", newAccess);
        api.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`;
        
        processQueue(null, newAccess);

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);

        // Clear tokens but DON'T redirect - let route guards handle it
        sessionStorage.removeItem("access_token");
        delete api.defaults.headers.common['Authorization'];

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;