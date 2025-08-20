import { useState } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import api from "../../axiosConfig";
import GoogleLoginButton from "../components/GoogleLoginButton";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  // If redirected to login, save original URL
  const from = location.state?.from?.pathname || "/";

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors({}); // Clear previous errors

    try {
      const res = await api.post("/api/auth/token/", {
        email,
        password,
      });

      // Save tokens
      localStorage.setItem("token", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      // Redirect to original page
      navigate(from, { replace: true });
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
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-6">Login</h1>

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div className="mb-3">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
            />
            {errors.general && (
              <p className="text-red-500 text-sm mt-1">{errors.general}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Login
          </button>
        </form>

        {/* Register Button */}
        <button
          onClick={() => navigate("/register")}
          className="w-full mt-3 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
        >
          Register
        </button>

        <div className="flex items-center my-4">
          <div className="flex-grow border-t" />
          <span className="mx-2 text-gray-400">or</span>
          <div className="flex-grow border-t" />
        </div>

        {/* OAuth */}
        <GoogleLoginButton />
      </div>
    </div>
  );
}
