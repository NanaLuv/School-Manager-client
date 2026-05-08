// frontend/src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import api from "../components/axiosconfig/axiosConfig";
import {
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ComputerDesktopIcon,
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 py-12 px-4">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - App Info Section */}
        <div className="hidden md:block space-y-6">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mr-4">
                <span className="text-white text-2xl font-bold">T</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Trackers</h1>
                <p className="text-emerald-600 font-medium">
                  School Management System
                </p>
              </div>
            </div>

            <p className="text-gray-600 leading-relaxed mb-6">
              A complete school management solution that helps you track
              students, fees, attendance, payroll, and everything in between.
              Simple, fast, and reliable.
            </p>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Key Features</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center text-sm text-gray-600">
                  <AcademicCapIcon className="w-4 h-4 text-emerald-500 mr-2" />
                  Student Management
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CurrencyDollarIcon className="w-4 h-4 text-emerald-500 mr-2" />
                  Fee Tracking
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <UserGroupIcon className="w-4 h-4 text-emerald-500 mr-2" />
                  Staff Payroll
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <ChartBarIcon className="w-4 h-4 text-emerald-500 mr-2" />
                  Reports & Analytics
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <DocumentTextIcon className="w-4 h-4 text-emerald-500 mr-2" />
                  Attendance Tracking
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <ComputerDesktopIcon className="w-4 h-4 text-emerald-500 mr-2" />
                  Easy to Use
                </div>
              </div>
            </div>
          </div>

          {/* Testimonial or Stats */}
          <div className="bg-emerald-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex justify-between items-center">
              <div className="text-center">
                <div className="text-3xl font-bold">500+</div>
                <div className="text-sm opacity-90">Students</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">50+</div>
                <div className="text-sm opacity-90">Staff</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">100%</div>
                <div className="text-sm opacity-90">Data Secure</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            {/* Mobile logo - only visible on small screens */}
            <div className="md:hidden flex justify-center mb-4">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">T</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-gray-600 mt-2">
              Sign in to your Trackers account
            </p>
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
          {/* <div className="mt-4 text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-emerald-600 hover:text-emerald-800"
            >
              Forgot your password?
            </Link>
          </div> */}

          {/* Demo Credentials Hint - Optional */}
          {/* <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              Demo credentials available upon request
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Login;
