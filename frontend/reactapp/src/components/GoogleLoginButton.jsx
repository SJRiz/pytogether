import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import api from "../../axiosConfig";

export default function GoogleLoginButton() {
    const navigate = useNavigate()
    const handleSuccess = async (credentialResponse) => {
        try {
        // Get Google credential (JWT)
        const googleToken = credentialResponse.credential;
        const decoded = jwtDecode(googleToken);
        console.log("Google user:", decoded);

        // Send token to Django backend
        const res = await api.post("/api/auth/google/", {
            access_token: googleToken,
        });

        // Save access + refresh tokens
        localStorage.setItem("token", res.data.access);
        localStorage.setItem("refresh", res.data.refresh);

        console.log("Login successful!");
        navigate("/");
        } catch (err) {
        console.error("Google login failed:", err);
        }
    };

    const handleError = () => {
        console.error("Google Login Failed");
    };

    return (
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <div className="flex justify-center">
            <GoogleLogin onSuccess={handleSuccess} onError={handleError} />
        </div>
        </GoogleOAuthProvider>
    );
}
