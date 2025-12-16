import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../axiosConfig";
import { useState, useEffect } from "react";

export default function GoogleLoginButton() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const redirectUrl = searchParams.get('redirect');
    if (redirectUrl) {
      sessionStorage.setItem('login_redirect', redirectUrl);
    }
  }, [searchParams]);

  const handleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const googleToken = credentialResponse.credential;

      const res = await api.post("/api/auth/google/", {
        access_token: googleToken,
      });

      sessionStorage.setItem("access_token", res.data.access);
      
      const storedRedirect = sessionStorage.getItem('login_redirect');
      const urlRedirect = searchParams.get('redirect');
      const finalRedirect = storedRedirect || urlRedirect || '/home';
      
      // Clean up memory
      sessionStorage.removeItem('login_redirect');
      
      navigate(finalRedirect);
    } catch (err) {
      console.error("Google login failed:", err);
      alert("Google login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <div className="flex justify-center items-center">
          <GoogleLogin 
            onSuccess={handleSuccess} 
            onError={() => alert("Login Failed")} 
            ux_mode="redirect"
            login_uri={window.location.origin + '/login'} 
          />
      </div>
    </GoogleOAuthProvider>
  );
}