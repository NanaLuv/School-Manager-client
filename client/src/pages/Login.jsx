// frontend/src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import api from "../components/axiosconfig/axiosConfig";
import {
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  BoltIcon,
  DevicePhoneMobileIcon,
  ChartBarSquareIcon,
  DocumentDuplicateIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  CloudArrowUpIcon,
  CreditCardIcon,
  CalendarDaysIcon,
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
  const [activeFeature, setActiveFeature] = useState(0);

  const { login } = useAuth();

  const features = [
    {
      icon: <AcademicCapIcon className="w-8 h-8" />,
      title: "Smart Student Management",
      description:
        "Track academic progress, attendance, and behavior all in one place",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <CreditCardIcon className="w-8 h-8" />,
      title: "Automated Fee Collection",
      description:
        "Real-time fee tracking, automatic receipts, and payment reminders",
      color: "from-emerald-500 to-teal-500",
    },
    {
      icon: <UserGroupIcon className="w-8 h-8" />,
      title: "Staff & Payroll",
      description:
        "Manage salaries, deductions, and generate payslips instantly",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: <ChartBarSquareIcon className="w-8 h-8" />,
      title: "Analytics Dashboard",
      description:
        "Beautiful charts and insights to make data-driven decisions",
      color: "from-orange-500 to-red-500",
    },
  ];

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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

      const userRole = response.data.user.role_name.toLowerCase();
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

      if (error.response?.status === 429) {
        const minutesMatch = errorMsg.match(/(\d+)/);
        const minutesLeft = minutesMatch ? parseInt(minutesMatch[0]) : 15;
        setRateLimit((prev) => ({
          ...prev,
          locked: true,
          minutesLeft,
        }));
      } else {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-7xl w-full mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Hero Section */}
            <div className="text-white space-y-8">
              {/* Logo and Name */}
              <div className="flex items-center space-x-3 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-400 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="relative w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl">
                    <span className="text-white text-3xl font-bold tracking-tighter">
                      T
                    </span>
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">
                    Trackers<span className="text-emerald-400">.</span>
                  </h1>
                  <p className="text-gray-300 text-sm">
                    School Management Simplified
                  </p>
                </div>
              </div>

              {/* Main Headline */}
              <div className="space-y-4">
                <h2 className="text-5xl lg:text-6xl font-bold leading-tight">
                  Manage Your School
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                    {" "}
                    Effortlessly
                  </span>
                </h2>
                <p className="text-gray-300 text-lg leading-relaxed max-w-lg">
                  The all-in-one platform that helps schools track students,
                  manage fees, process payroll, and make data-driven decisions.
                  Join 500+ schools already using Trackers.
                </p>
              </div>

              {/* Rotating Feature Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-start space-x-4">
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-r ${features[activeFeature].color} bg-opacity-20`}
                  >
                    <div className="text-white">
                      {features[activeFeature].icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">
                      {features[activeFeature].title}
                    </h3>
                    <p className="text-gray-300 text-sm">
                      {features[activeFeature].description}
                    </p>
                  </div>
                </div>

                {/* Feature Dots */}
                <div className="flex justify-center space-x-2 mt-6">
                  {features.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveFeature(idx)}
                      className={`transition-all duration-300 rounded-full ${
                        activeFeature === idx
                          ? "w-8 h-2 bg-emerald-400"
                          : "w-2 h-2 bg-white/30 hover:bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-6 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-400">
                    500+
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Schools</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-400">
                    50k+
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Students</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-400">
                    99.9%
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Uptime</div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="relative">
              {/* Decorative elements */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-purple-500/10 rounded-3xl blur-3xl"></div>

              <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl mb-4">
                    <RocketLaunchIcon className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    Welcome Back
                  </h2>
                  <p className="text-gray-300 mt-2">
                    Sign in to continue to Trackers
                  </p>
                </div>

                {/* Rate Limit Warning */}
                {rateLimit.locked && (
                  <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center text-red-200">
                      <LockClosedIcon className="w-5 h-5 mr-2" />
                      <span className="font-medium">
                        Account Temporarily Locked
                      </span>
                    </div>
                    <p className="text-sm text-red-200/80 mt-1">
                      Too many failed attempts. Try again in{" "}
                      {rateLimit.minutesLeft} minutes.
                    </p>
                  </div>
                )}

                {/* Attempts Remaining */}
                {!rateLimit.locked && rateLimit.attempts > 0 && (
                  <div className="mb-4 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-xl backdrop-blur-sm">
                    <p className="text-sm text-yellow-200">
                      ⚠️ {rateLimit.remaining} login{" "}
                      {rateLimit.remaining === 1 ? "attempt" : "attempts"}{" "}
                      remaining
                    </p>
                  </div>
                )}

                {/* Error Message */}
                {error && !rateLimit.locked && (
                  <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur-sm text-red-200 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
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
                        className={`w-full px-4 py-3 bg-white/5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-gray-400 ${
                          rateLimit.locked
                            ? "border-gray-600 cursor-not-allowed opacity-50"
                            : "border-white/20 focus:border-emerald-500"
                        }`}
                        required
                        disabled={loading || rateLimit.locked}
                        placeholder="Enter your username"
                      />
                      {checkingStatus && (
                        <div className="absolute right-4 top-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-400"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
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
                        className={`w-full px-4 py-3 bg-white/5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-gray-400 ${
                          rateLimit.locked
                            ? "border-gray-600 cursor-not-allowed opacity-50"
                            : "border-white/20 focus:border-emerald-500"
                        }`}
                        required
                        disabled={loading || rateLimit.locked}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-3 text-gray-400 hover:text-emerald-400 transition-colors"
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
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg shadow-emerald-500/25"
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

                {/* <div className="mt-6 text-center">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Forgot your password?
                  </Link>
                </div> */}

                {/* Trust Badges */}
                <div className="mt-8 pt-6 border-t border-white/10">
                  <div className="flex justify-center space-x-4 text-xs text-gray-400">
                    <div className="flex items-center">
                      <ShieldCheckIcon className="w-3 h-3 mr-1" />
                      <span>256-bit SSL</span>
                    </div>
                    <div className="flex items-center">
                      <BoltIcon className="w-3 h-3 mr-1" />
                      <span>99.9% Uptime</span>
                    </div>
                    <div className="flex items-center">
                      <DevicePhoneMobileIcon className="w-3 h-3 mr-1" />
                      <span>Mobile Ready</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 text-center text-gray-400 text-sm">
            <p>
              © 2026 Trackers. All rights reserved. Made with Love for schools
              everywhere.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
