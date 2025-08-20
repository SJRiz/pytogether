import { useState } from "react";
import api from "../../axiosConfig";
import { Eye, EyeOff, UserPlus, ArrowLeft, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrors({}); // reset errors
    setIsLoading(true);

    // frontend check for matching passwords
    if (password1 !== password2) {
      setErrors({ password2: ["Passwords do not match."] });
      setIsLoading(false);
      return;
    }

    try {
      await api.post("/api/auth/register/", {
        email,
        password: password1,
      });
      alert("Registration successful, please log in.");
      navigate("/login");
    } catch (err) {
      console.error(err.response?.data || err.message);
      if (err.response?.data) {
        setErrors(err.response.data); // backend validation errors
      } else {
        alert("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800/70 backdrop-blur-md border border-gray-700/30 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-700/50">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-400 hover:text-gray-300 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </button>
          <div className="flex items-center justify-center">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <UserPlus className="h-6 w-6 text-blue-400" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-white text-center mt-3">
            Create Account
          </h1>
          <p className="text-gray-400 text-sm text-center mt-1">
            Join us to start collaborating
          </p>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Email field */}
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-2">{errors.email[0]}</p>
              )}
            </div>

            {/* Password field */}
            <div>
              <div className="relative">
                <input
                  type={showPassword1 ? "text" : "password"}
                  placeholder="Password"
                  value={password1}
                  onChange={(e) => setPassword1(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  onClick={() => setShowPassword1(!showPassword1)}
                >
                  {showPassword1 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-2">{errors.password[0]}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <div className="relative">
                <input
                  type={showPassword2 ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  onClick={() => setShowPassword2(!showPassword2)}
                >
                  {showPassword2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password2 && (
                <p className="text-red-400 text-sm mt-2">{errors.password2[0]}</p>
              )}
            </div>

            {/* Register button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-all duration-300 flex items-center justify-center shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <UserPlus className="h-5 w-5 mr-2" />
                  Register
                </>
              )}
            </button>
          </form>

          {/* Redirect to login */}
          <div className="mt-6 pt-4 border-t border-gray-700/50">
            <p className="text-gray-400 text-sm text-center">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors flex items-center justify-center mx-auto mt-2"
              >
                <LogIn className="h-4 w-4 mr-1" />
                Login here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}