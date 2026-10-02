import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../axiosConfig";
import { useState } from "react";

export default function GoogleLoginButton({ disabled }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return (
      <div className="flex justify-center items-center mt-3">
        <button disabled className="w-full py-2.5 px-4 bg-white text-gray-500 font-medium rounded border border-gray-300 cursor-not-allowed text-sm h-[40px]">
          Google Login (Missing Client ID)
        </button>
      </div>
    );
  }

  const handleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const res = await api.post("/api/auth/google/", {
        access_token: credentialResponse.credential,
      });

      sessionStorage.setItem("access_token", res.data.access);
      localStorage.removeItem("previousProjectData");

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
    <GoogleOAuthProvider clientId={clientId}>
      <div className="flex justify-center items-center mt-3">
        {loading ? (
          <span className="animate-spin border-4 border-white/50 border-t-white h-12 w-12 rounded-full"></span>
        ) : (
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={handleError}
              width="384"
            />
          </div>
        )}
      </div>
    </GoogleOAuthProvider>
  );
}