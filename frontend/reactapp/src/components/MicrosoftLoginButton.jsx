import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../axiosConfig";
import { useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { EventType } from "@azure/msal-browser";

export default function MicrosoftLoginButton({ disabled }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const { instance, inProgress } = useMsal();

  useEffect(() => {
    console.log("Checking MSAL redirect status...");
    instance.handleRedirectPromise()
      .then((response) => {
        console.log("MSAL handleRedirectPromise resolved:", response);
        if (response && response.idToken) {
          console.log("Token found, sending to backend...");
          setLoading(true);
          api.post("/api/auth/microsoft/", {
            access_token: response.idToken,
          })
            .then((res) => {
              sessionStorage.setItem("access_token", res.data.access);
              localStorage.removeItem("previousProjectData");

              const redirectTo = searchParams.get("redirect") || "/home";
              navigate(redirectTo);
            })
            .catch((err) => {
              console.error("Microsoft login failed:", err);
              alert("Microsoft login failed");
              setLoading(false);
            });
        } else {
          const accounts = instance.getAllAccounts();
          console.log("Current MSAL accounts:", accounts);
          if (accounts.length > 0) {
            console.log("User is already logged into MSAL! We can just acquire a token silently.");
          }
        }
      })
      .catch((err) => {
        console.error("MSAL redirect error:", err);
        setLoading(false);
      });
  }, [instance, navigate, searchParams]);

  const handleMicrosoftLogin = async () => {
    if (disabled || loading) return;
    setLoading(true);
    try {
      await instance.loginRedirect({
        scopes: ["openid", "profile", "email"],
        // Redirect back to the login page so the React app loads and this component runs
        redirectUri: window.location.origin + "/login",
      });
    } catch (err) {
      console.error("Microsoft login failed:", err);
      setLoading(false);
    }
  };

  const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;

  if (!clientId) {
    return (
      <div className="flex justify-center items-center mt-3">
        <button disabled className="w-full py-2.5 px-4 bg-white text-gray-500 font-medium rounded border border-gray-300 cursor-not-allowed text-[14px] h-[40px]">
          Microsoft Login (Missing Client ID)
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center mt-3">
      {loading ? (
        <span className="animate-spin border-4 border-white/50 border-t-white h-12 w-12 rounded-full"></span>
      ) : (
        <button
          type="button"
          onClick={handleMicrosoftLogin}
          disabled={disabled}
          className="flex items-center w-full bg-white rounded border border-[#dadce0] hover:bg-[#f8f9fa] transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed pr-2"
          style={{ height: "40px" }}
        >
          <div className="flex items-center justify-center w-[40px] h-[40px]">
            <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
              <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
              <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
          </div>
          <div 
            className="flex-1 text-center"
            style={{ color: "#3c4043", fontSize: "14px", fontWeight: "500", letterSpacing: "0.25px", fontFamily: "'Roboto', sans-serif" }}
          >
            Sign in with Microsoft
          </div>
        </button>
      )}
    </div>
  );
}
