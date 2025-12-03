import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import api from "../../axiosConfig";
import GoogleLoginButton from "../components/GoogleLoginButton";
import { Eye, EyeOff, LogIn, UserPlus, Info } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      // Send credentials to backend
      const res = await api.post("/api/auth/token/", {
        email,
        password,
      }, {
        withCredentials: true, // important so refresh token cookie is set
      });

      // Save access token in sessionStorage
      sessionStorage.setItem("access_token", res.data.access);

      // Redirect user
      navigate('/home');
    } catch (err) {
      const data = err.response?.data || {};
      console.error(data);

      if (data.email) {
        setErrors({ email: data.email[0] });
      } else if (data.non_field_errors) {
        setErrors({ general: "Email or Password is incorrect" });
      } else {
        setErrors({ general: "Login failed. Please try again." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <Helmet>
        <title>PyTogether - Login</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://pytogether.org/login" />
        <meta name="description" content="Google Docs for Python. Real-time collaborative Python IDE in the browser, completely free" />
        <meta property="og:title" content="PyTogether" />
        <meta property="og:description" content="Pair programming made simple with real-time collaboration." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://pytogether.org/login" />
        <meta property="og:image" content="https://pytogether.org/pytog.png" />
        <style>{`
          @keyframes blob {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            33% {
              transform: translate(30px, -50px) scale(1.1);
            }
            66% {
              transform: translate(-20px, 20px) scale(0.9);
            }
            100% {
              transform: translate(0px, 0px) scale(1);
            }
          }
          @keyframes pulse {
            0%, 100% {
              opacity: 0.15;
              transform: scale(1);
            }
            50% {
              opacity: 0.3;
              transform: scale(1.05);
            }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animate-pulse-slow {
            animation: pulse 4s ease-in-out infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
          .animation-delay-1000 {
            animation-delay: 1s;
          }
          .animation-delay-3000 {
            animation-delay: 3s;
          }
        `}</style>
    </Helmet>
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        
        {/* Purple pulsing orbs */}
        <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-purple-600 rounded-full mix-blend-multiply filter blur-2xl animate-pulse-slow"></div>
        <div className="absolute top-3/4 right-1/4 w-56 h-56 bg-purple-500 rounded-full mix-blend-multiply filter blur-2xl animate-pulse-slow animation-delay-1000"></div>
        <div className="absolute top-1/2 left-3/4 w-40 h-40 bg-purple-700 rounded-full mix-blend-multiply filter blur-2xl animate-pulse-slow animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/2 w-52 h-52 bg-purple-400 rounded-full mix-blend-multiply filter blur-2xl animate-pulse-slow animation-delay-3000"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      </div>

      <div className="w-full max-w-md bg-gradient-to-b from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden relative z-10">
        {/* Header Section */}
        <div className="p-8 text-center border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full blur-2xl opacity-40 animate-pulse"></div>
              <div className="relative p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border-2 border-gray-700/50">
                <img
                  src="/pytog.png"
                  alt="PyTogether Logo"
                  className="h-16 w-16"
                />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-3">
            PyTogether
          </h1>
          <p className="text-gray-300 text-base font-semibold mb-2">Easy. Quick. Real-time. Free.</p>
          <p className="text-gray-400 text-sm mb-4">Google Docs for Python. Write Python code with others.</p>
          <div className="inline-block px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg">
            <p className="text-blue-300 text-sm font-semibold">Get Started</p>
          </div>
        </div>

        {/* Form Section */}
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <div className="relative">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/40 border border-gray-600/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 hover:bg-gray-700/60"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm mt-2 flex items-center ml-1">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/40 border border-gray-600/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 hover:bg-gray-700/60 pr-12"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors p-1"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.general && (
                <p className="text-red-400 text-sm mt-2 flex items-center ml-1">
                  {errors.general}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 rounded-xl font-bold hover:from-blue-500 hover:to-purple-500 transition-all duration-300 flex items-center justify-center shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transform"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Login
                </>
              )}
            </button>
          </form>

          {/* Buttons Section */}
          <div className="flex gap-3 mt-5">
            {/* Register Button */}
            <button
              onClick={() => navigate("/register")}
              disabled={isLoading}
              className="flex-1 bg-gray-700/40 text-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-700/60 transition-all duration-300 flex items-center justify-center border border-gray-600/30 hover:border-gray-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Register
            </button>

            {/* About Button */}
            <button
              onClick={() => navigate("/")}
              disabled={isLoading}
              className="flex-1 bg-gray-700/40 text-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-700/60 transition-all duration-300 flex items-center justify-center border border-gray-600/30 hover:border-gray-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Info className="h-5 w-5 mr-2" />
              About Us
            </button>
          </div>

          <div className="flex items-center my-6">
            <div className="flex-grow h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent" />
            <span className="mx-4 text-gray-400 text-sm font-medium">or continue with</span>
            <div className="flex-grow h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent" />
          </div>

          {/* OAuth */}
          <GoogleLoginButton disabled={isLoading} />

          {/* TERMS OF SERVICE */}
          <p className="text-xs text-gray-500 mt-6 text-center leading-relaxed">
            By creating an account or logging in, you agree to our{' '}
            <a href="/terms" target="_blank" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">
              Terms of Service
            </a>
            {' '}and{' '}
            <a href="/privacy" target="_blank" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">
              Privacy Policy
            </a>.
          </p>

        </div>

        {/* Footer */}
        <div className="p-6 text-center border-t border-gray-700/50 bg-gradient-to-r from-gray-900/50 to-gray-800/50">
          <p className="text-xs text-gray-400 mb-2">
            This is an open-source project! Check it out at: 
            <a href="https://github.com/SJRiz/pytogether" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors ml-1">
              github.com/SJRiz/pytogether
            </a>
          </p>
          <p className="text-xs text-gray-400">
            For any questions or inquiries, email 
            <a href="mailto:contact@pytogether.org" className="text-blue-400 font-bold underline hover:text-blue-300 transition-colors ml-1">
              contact@pytogether.org
            </a>
          </p>
        </div>
      </div>
    </div>
    </>
  );
}