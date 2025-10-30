import { Navigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import { initializeAuth } from "../components/auth.js"

const PublicRoute = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    // Already logged in, redirect to home
    return <Navigate to="/home" replace />;
  }

  // Not logged in, show login/register page
  return children;
};

export default PublicRoute;