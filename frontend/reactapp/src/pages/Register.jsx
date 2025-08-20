import { useState } from "react";
import api from "../../axiosConfig";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [errors, setErrors] = useState({}); // store field errors

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrors({}); // reset errors

    // frontend check for matching passwords
    if (password1 !== password2) {
      setErrors({ password2: ["Passwords do not match."] });
      return;
    }

    try {
      await api.post("/api/auth/register/", {
        email,
        password: password1,
      });
      alert("Registration successful, please log in.");
      window.location.href = "/login";
    } catch (err) {
      console.error(err.response?.data || err.message);
      if (err.response?.data) {
        setErrors(err.response.data); // backend validation errors
      } else {
        alert("Registration failed. Please try again.");
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-6">Register</h1>
        <form onSubmit={handleRegister}>
          {/* Email field */}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-1 p-2 border rounded"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mb-2">{errors.email[0]}</p>
          )}

          {/* Password field */}
          <input
            type="password"
            placeholder="Password"
            value={password1}
            onChange={(e) => setPassword1(e.target.value)}
            className="w-full mb-1 p-2 border rounded"
          />
          {errors.password && (
            <p className="text-red-500 text-sm mb-2">{errors.password[0]}</p>
          )}

          {/* Confirm Password */}
          <input
            type="password"
            placeholder="Confirm Password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            className="w-full mb-1 p-2 border rounded"
          />
          {errors.password2 && (
            <p className="text-red-500 text-sm mb-2">{errors.password2[0]}</p>
          )}

          {/* Register button */}
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 mt-2"
          >
            Register
          </button>
        </form>

        {/* Redirect to login */}
        <p className="text-sm mt-4">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-green-600 hover:underline font-medium"
          >
            Login here
          </a>
        </p>
      </div>
    </div>
  );
}
