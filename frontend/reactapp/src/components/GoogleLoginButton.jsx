import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../axiosConfig";

export default function GoogleLoginButton() {
  const navigate = useNavigate();
  const location = useLocation();

  // If redirected to login, save original URL
  const from = location.state?.from?.pathname || "/";

  const handleSuccess = async (credentialResponse) => {
    try {
      // Get Google credential (JWT)
      const googleToken = credentialResponse.credential;

      // Send token to Django backend
      const res = await api.post("/api/auth/google/", {
        access_token: googleToken,
      });

      sessionStorage.setItem("access_token", res.data.access);

      console.log("Login successful!");
      // Redirect to original page
      navigate(from, { replace: true });
    } catch (err) {
      console.error("Google login failed:", err);
      alert("Google login failed");
    }
  };

  const handleError = () => {
    console.error("Google Login Failed");
    alert("Google login failed");
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <div className="flex justify-center">
        <GoogleLogin onSuccess={handleSuccess} onError={handleError} />
      </div>
    </GoogleOAuthProvider>
  );
}
