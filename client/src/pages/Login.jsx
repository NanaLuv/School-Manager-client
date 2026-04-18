// frontend/src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import api from "../components/axiosconfig/axiosConfig";
import {
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rateLimit, setRateLimit] = useState({
    locked: false,
    attempts: 0,
    remaining: 5,
    minutesLeft: 0,
  });
  const [checkingStatus, setCheckingStatus] = useState(false);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();

  // Check login status when username changes
  useEffect(() => {
    const checkLoginStatus = async () => {
      if (!credentials.username || credentials.username.length < 3) return;

      setCheckingStatus(true);
      try {
        const response = await api.get(
          `/login-status?username=${credentials.username}`,
        );
        setRateLimit(response.data);
      } catch (error) {
        console.error("Error checking login status:", error);
      } finally {
        setCheckingStatus(false);
      }
    };

    const debounce = setTimeout(checkLoginStatus, 500);
    return () => clearTimeout(debounce);
  }, [credentials.username]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rateLimit.locked) {
      setError(
        `Account is locked. Please try again in ${rateLimit.minutesLeft} minutes.`,
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/login", credentials);

      login(response.data.user, response.data.token);

      // Get user role
      const userRole = response.data.user.role_name.toLowerCase();

      // Redirect based on role
      let redirectPath = "/dashboard";

      switch (userRole) {
        case "admin":
          redirectPath = "/dashboard";
          break;
        default:
          redirectPath = "/profile";
      }

      navigate(redirectPath, { replace: true });
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Login failed.";
      setError(errorMsg);

      // Update rate limit info from response
      if (error.response?.status === 429) {
        // Parse minutes from error message
        const minutesMatch = errorMsg.match(/(\d+)/);
        const minutesLeft = minutesMatch ? parseInt(minutesMatch[0]) : 15;
        setRateLimit((prev) => ({
          ...prev,
          locked: true,
          minutesLeft,
        }));
      } else {
        // Update remaining attempts
        setRateLimit((prev) => ({
          ...prev,
          attempts: prev.attempts + 1,
          remaining: Math.max(0, prev.remaining - 1),
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">S</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>

          {/* Rate Limit Warning */}
          {rateLimit.locked && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center text-red-700">
                <LockClosedIcon className="w-5 h-5 mr-2" />
                <span className="font-medium">Account Temporarily Locked</span>
              </div>
              <p className="text-sm text-red-600 mt-1">
                Too many failed attempts. Please try again in{" "}
                {rateLimit.minutesLeft} minutes.
              </p>
            </div>
          )}

          {/* Attempts Remaining */}
          {!rateLimit.locked && rateLimit.attempts > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-700">
                ⚠️ {rateLimit.remaining} login{" "}
                {rateLimit.remaining === 1 ? "attempt" : "attempts"} remaining
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && !rateLimit.locked && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) =>
                    setCredentials({
                      ...credentials,
                      username: e.target.value,
                    })
                  }
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    rateLimit.locked ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  required
                  disabled={loading || rateLimit.locked}
                  placeholder="Enter your username"
                />
                {checkingStatus && (
                  <div className="absolute right-3 top-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500"></div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={credentials.password}
                  onChange={(e) =>
                    setCredentials({
                      ...credentials,
                      password: e.target.value,
                    })
                  }
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    rateLimit.locked ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  required
                  disabled={loading || rateLimit.locked}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2 text-gray-500 hover:text-emerald-500"
                  disabled={rateLimit.locked}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || rateLimit.locked}
              className="w-full py-3 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-3 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : rateLimit.locked ? (
                "Account Locked"
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Forgot Password Link */}
          <div className="mt-4 text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-emerald-600 hover:text-emerald-800"
            >
              Forgot your password?
            </Link>
          </div>

          {/* Last Login Info */}
          {rateLimit.lastLogin && (
            <div className="mt-4 text-xs text-gray-500 text-center">
              Last successful login:{" "}
              {new Date(rateLimit.lastLogin.last_attempt).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
