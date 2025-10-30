import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

let isInitializing = false;
let initPromise = null;

export const isAuthenticated = () => {
  return !!sessionStorage.getItem("access_token");
};

export const initializeAuth = async () => {
  
  // If already initializing, return the existing promise
  if (isInitializing && initPromise) {
    return initPromise;
  }

  // Check if we already have an access token
  const existingToken = sessionStorage.getItem('access_token');
  if (existingToken) {
    return true;
  }


  // Start initialization
  isInitializing = true;
  initPromise = (async () => {
    try {
      // Use raw axios to bypass interceptors
      const res = await axios.post(
        `${baseURL}/api/auth/token/refresh/`,
        {},
        { withCredentials: true }
      );
      const newAccess = res.data.access;
      
      sessionStorage.setItem('access_token', newAccess);
      
      return true;
    } catch (error) {
      return false;
    } finally {
      isInitializing = false;
      initPromise = null;
    }
  })();

  return initPromise;
};