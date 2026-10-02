import { useState } from "react";
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from "../../axiosConfig";
import GoogleLoginButton from "../components/GoogleLoginButton";
import MicrosoftLoginButton from "../components/MicrosoftLoginButton";
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
        <meta name="description" content="Real-time collaborative Python IDE in the browser, completely free" />
        <meta property="og:title" content="PyTogether" />
    </Helmet>
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gray-950">
      
      {/* Animated grid overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[linear-gradient(to_right,#4f4f4f30_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f30_1px,transparent_1px)] bg-[size:24px_24px] animate-grid-diagonal"></div>

      <div className="w-full max-w-md backdrop-blur-xl border rounded-2xl shadow-2xl overflow-hidden relative z-10 bg-gray-800/60 border-gray-700/50">
        
        {/* Header */}
        <div className="p-8 text-center border-b border-gray-700/50 bg-gray-800/50">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="relative p-4 rounded-2xl border-2 bg-gray-800 border-gray-700/50">
                <img src="/pytog.png" alt="PyTogether Logo" className="h-16 w-16" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-3 text-white">
            PyTogether
          </h1>
          <p className="text-base font-semibold mb-2 text-gray-300">Easy. Quick. Real-time. Free.</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 ${
                  'bg-gray-700/40 border-gray-600/30 text-white'
                }`}
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
                  className={`w-full px-4 py-3 border rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 pr-12 ${
                    'bg-gray-700/40 border-gray-600/30 text-white'
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className={`absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors p-1 ${'text-gray-400 hover:text-gray-300'}`}
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
              className="group relative w-full bg-white text-black py-3.5 rounded-xl font-bold transition-all duration-300 shadow-lg shadow-white/10 hover:shadow-white/20 disabled:opacity-50 disabled:hover:scale-100 overflow-hidden"
            >
              <div className="absolute inset-0 bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              <div className="relative flex items-center justify-center">
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent"></div>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" /> Sign In
                  </>
                )}
              </div>
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
              className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center border ${
                'bg-gray-700/40 text-gray-300 border-gray-600/30 hover:bg-gray-700/60 hover:border-gray-500/50'
              }`}
            >
              <UserPlus className="h-5 w-5 mr-2" /> Register
            </button>

            <button
              onClick={() => navigate("/")}
              disabled={isLoading}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center border ${
                'bg-gray-700/40 text-gray-300 border-gray-600/30 hover:bg-gray-700/60 hover:border-gray-500/50'
              }`}
            >
              <Info className="h-5 w-5 mr-2" /> About Us
            </button>
          </div>

          <div className="mt-5">
             <button
               type="button"
               onClick={() => navigate("/playground")}
               disabled={isLoading}
               className={`relative w-full py-3.5 rounded-xl font-bold flex items-center justify-center border transition-all duration-200 overflow-hidden ${
                 'bg-gray-800 text-white border-gray-700 hover:border-cyan-500/50'
               }`}
             >
               <Zap className="h-5 w-5 mr-2 text-cyan-400" />
               <span>
                  Offline Playground <span className={`text-xs font-normal italic ${'text-gray-400'}`}>(no account required)</span>
               </span>
             </button>
          </div>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className={`flex-grow h-px ${'bg-gray-700'}`} />
            <span className={`mx-4 text-sm font-medium ${'text-gray-400'}`}>or continue with</span>
            <div className={`flex-grow h-px ${'bg-gray-700'}`} />
          </div>

          <GoogleLoginButton disabled={isLoading} />
          <MicrosoftLoginButton disabled={isLoading} />

          <p className={`text-xs mt-6 text-center leading-relaxed ${'text-gray-500'}`}>
            By creating an account or logging in, you agree to our{' '}
            <a href="/terms" className="text-blue-400 hover:underline">Terms of Service</a>{' '}and{' '}
            <a href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</a>.
          </p>

        </div>
        
        {/* Footer */}
        <div className={`p-4 text-center border-t ${'border-gray-700/50 bg-gray-900/50'}`}>
          <p className={`text-xs ${'text-gray-400'}`}>
             Open source at <a href="https://github.com/SJRiz/pytogether" className="text-blue-400 hover:underline">GitHub</a>
          </p>
        </div>
      </div>
    </div>
    </>
  );
}