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
    </Helmet>
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800/70 backdrop-blur-md border border-gray-700/30 rounded-xl shadow-2xl overflow-hidden transition-all duration-300 hover:bg-gray-800/80">
        {/* Header Section */}
        <div className="p-8 text-center border-b border-gray-700/50">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-blue-500/10 rounded-full">
              <img
                src="/pytog.png"
                alt="PyTogether Logo"
                className="h-15 w-15"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            PyTogether
          </h1>
          <p className="text-gray-400 text-sm mb-1">Easy. Quick. Real-time. Free.</p>
          <p className="text-gray-500 text-xs">Google Docs for Python. Write Python code with others.</p>
          <br/>
          <p className="text-gray-500 text-xs">Get Started</p>
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
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm mt-2 flex items-center">
                  <span className="ml-1">{errors.email}</span>
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
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.general && (
                <p className="text-red-400 text-sm mt-2 flex items-center">
                  <span className="ml-1">{errors.general}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-300 flex items-center justify-center shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Login
                </>
              )}
            </button>
          </form>

          {/* Buttons Section */}
          <div className="flex gap-3 mt-4">
            {/* Register Button */}
            <button
              onClick={() => navigate("/register")}
              disabled={isLoading}
              className="flex-1 bg-gray-700/50 text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-700 transition-all duration-300 flex items-center justify-center border border-gray-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Register
            </button>

            {/* About Button */}
            <button
              onClick={() => navigate("/")}
              disabled={isLoading}
              className="flex-1 bg-gray-700/50 text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-700 transition-all duration-300 flex items-center justify-center border border-gray-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Info className="h-5 w-5 mr-2" />
              About Us
            </button>
          </div>

          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-700/50" />
            <span className="mx-3 text-gray-500 text-sm">or continue with</span>
            <div className="flex-grow border-t border-gray-700/50" />
          </div>

          {/* OAuth */}
          <GoogleLoginButton disabled={isLoading} />
        </div>

        {/* Footer */}
        <div className="p-4 text-center border-t border-gray-700/50">
          <p className="text-xs text-gray-500 italic">
              This is an open-source project! Check it out at: <span className="text-blue-400 font-semibold"> <a href="https://github.com/SJRiz/pytogether">https://github.com/SJRiz/pytogether </a></span>
          </p>
          <p className="text-xs text-gray-500 pt-2">
            For any questions or inquiries, email <a href="mailto:contact@pytogether.org" className="text-blue-400 font-bold underline">contact@pytogether.org</a>
          </p>
        </div>
      </div>
    </div>
    </>
  );
}