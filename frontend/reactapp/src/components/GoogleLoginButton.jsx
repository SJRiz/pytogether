import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../axiosConfig";
import { useState } from "react";

export default function GoogleLoginButton() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const handleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      // Get Google credential (JWT)
      const googleToken = credentialResponse.credential;

      // Send token to Django backend
      const res = await api.post("/api/auth/google/", {
        access_token: googleToken,
      });

      sessionStorage.setItem("access_token", res.data.access);
      
      // Get the redirect parameter from URL, default to '/home'
      const redirectTo = searchParams.get('redirect') || '/home';
      navigate(redirectTo);
    } catch (err) {
      console.error("Google login failed:", err);
      alert("Google login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleError = () => {
    console.error("Google Login Failed");
    alert("Google login failed");
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <div className="flex justify-center items-center">
        {loading ? (
          <span className="animate-spin border-4 border-white/50 border-t-white h-12 w-12 rounded-full"></span>
        ) : (
          <GoogleLogin onSuccess={handleSuccess} onError={handleError} />
        )}
      </div>
    </GoogleOAuthProvider>
  );
}