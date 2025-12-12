import { Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from 'react';
import { initializeAuth } from "../components/auth.js"

const ProtectedRoute = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await initializeAuth();
      setIsAuthenticated(authenticated);
      setIsChecking(false);
    };
    
    checkAuth();
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center pointer-events-none">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Not logged in, redirect to login with current path as redirect parameter
    const currentPath = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(currentPath)}`} replace />;
  }

  // Logged in, show protected content
  return children;
};

export default ProtectedRoute;