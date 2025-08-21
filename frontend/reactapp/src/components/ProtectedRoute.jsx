import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "./auth";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();

  if (!isAuthenticated()) {
    // redirect to login and store the attempted URL
    console.log("you are not logged in")
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;