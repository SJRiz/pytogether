import { useState } from "react";
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from "../../axiosConfig";
import GoogleLoginButton from "../components/GoogleLoginButton";
import { Eye, EyeOff, LogIn, UserPlus, Info, Zap } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const res = await api.post("/api/auth/token/", {
        email,
        password,
      }, {
        withCredentials: true,
      });

      sessionStorage.setItem("access_token", res.data.access);
      localStorage.removeItem('previousProjectData');
      
      // Get the redirect parameter from URL, default to '/home'
      const redirectTo = searchParams.get('redirect') || '/home';
      navigate(redirectTo);
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
        <style>{`
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          @keyframes pulse-slow {
            0%, 100% { opacity: 0.15; transform: scale(1); }
            50% { opacity: 0.3; transform: scale(1.05); }
          }
          .animate-blob { animation: blob 7s infinite; }
          .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
          .animation-delay-2000 { animation-delay: 2s; }
          .animation-delay-4000 { animation-delay: 4s; }
          
          /* Shimmer effect for the new button */
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          .animate-shimmer {
            animation: shimmer 3s linear infinite;
            background-size: 200% auto;
          }
        `}</style>
    </Helmet>
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      </div>

      <div className="w-full max-w-md bg-gradient-to-b from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden relative z-10">
        
        {/* Header */}
        <div className="p-8 text-center border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full blur-2xl opacity-40 animate-pulse"></div>
              <div className="relative p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border-2 border-gray-700/50">
                <img src="/pytog.png" alt="PyTogether Logo" className="h-16 w-16" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-3">
            PyTogether
          </h1>
          <p className="text-gray-300 text-base font-semibold mb-2">Easy. Quick. Real-time. Free.</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700/40 border border-gray-600/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                disabled={isLoading}
              />
              {errors.email && <p className="text-red-400 text-sm mt-2 ml-1">{errors.email}</p>}
            </div>

            <div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/40 border border-gray-600/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 pr-12"
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
              {errors.general && <p className="text-red-400 text-sm mt-2 ml-1">{errors.general}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 rounded-xl font-bold hover:from-blue-500 hover:to-purple-500 transition-all duration-300 flex items-center justify-center shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" /> Sign In
                </>
              )}
            </button>
          </form>

          {/* Secondary Actions */}
          <div className="flex gap-3 mt-5">
            <button
              onClick={() => {
                const redirect = searchParams.get('redirect');
                if (redirect) {
                  navigate(`/register?redirect=${encodeURIComponent(redirect)}`);
                } else {
                  navigate('/register');
                }
              }}
              disabled={isLoading}
              className="flex-1 bg-gray-700/40 text-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-700/60 transition-all duration-300 flex items-center justify-center border border-gray-600/30 hover:border-gray-500/50"
            >
              <UserPlus className="h-5 w-5 mr-2" /> Register
            </button>

            <button
              onClick={() => navigate("/")}
              disabled={isLoading}
              className="flex-1 bg-gray-700/40 text-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-700/60 transition-all duration-300 flex items-center justify-center border border-gray-600/30 hover:border-gray-500/50"
            >
              <Info className="h-5 w-5 mr-2" /> About Us
            </button>
          </div>

          <div className="mt-5 relative group">
             {/* Glow effect behind the button */}
             <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl blur opacity-20 group-hover:opacity-60 transition duration-500"></div>
             
             <button
               type="button"
               onClick={() => navigate("/playground")}
               disabled={isLoading}
               className="relative w-full bg-gray-800 text-white py-3.5 rounded-xl font-bold flex items-center justify-center border border-gray-700 group-hover:border-cyan-500/50 transition-all duration-200 overflow-hidden"
             >
               {/* Subtle background gradient on hover */}
               <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
               
               <Zap className="h-5 w-5 mr-2 text-cyan-400 group-hover:text-yellow-300 transition-colors" />
               <span className="bg-gradient-to-r from-teal-100 to-cyan-100 bg-clip-text text-transparent group-hover:text-white transition-all">
                  Offline Playground <span className="text-xs font-normal text-gray-400 italic">(no account required)</span>
               </span>
             </button>
          </div>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent" />
            <span className="mx-4 text-gray-400 text-sm font-medium">or continue with</span>
            <div className="flex-grow h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent" />
          </div>

          <GoogleLoginButton disabled={isLoading} />

          <p className="text-xs text-gray-500 mt-6 text-center leading-relaxed">
            By creating an account or logging in, you agree to our{' '}
            <a href="/terms" className="text-blue-400 hover:underline">Terms of Service</a>{' '}and{' '}
            <a href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</a>.
          </p>

        </div>
        
        {/* Footer */}
        <div className="p-4 text-center border-t border-gray-700/50 bg-gray-900/50">
          <p className="text-xs text-gray-400">
             Open source at <a href="https://github.com/SJRiz/pytogether" className="text-blue-400 hover:underline">GitHub</a>
          </p>
        </div>
      </div>
    </div>
    </>
  );
}