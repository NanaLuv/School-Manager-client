// Updated Dashboard.js with optimized API calls
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  AcademicCapIcon,
  UserGroupIcon,
  BanknotesIcon,
  ClockIcon,
  ChartBarIcon,
  CalendarIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  UsersIcon,
  BuildingLibraryIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Sidebar from "../../components/sidebar/sidebar";
import { useAuth } from "../contexts/AuthContext";
import Topbar from "../../components/sidebar/Topbar";
import api from "../../components/axiosconfig/axiosConfig";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    overview: {
      totalStudents: 0,
      activeStudents: 0,
      totalTeachers: 0,
      totalClasses: 0,
      activeClasses: 0,
      academicYear: "Loading...",
      currentTerm: "Loading...",
    },
    today: {
      attendance: {
        present: 0,
        absent: 0,
        total: 0,
        rate: 0,
      },
      payments: {
        count: 0,
        amount: 0,
      },
    },
    finance: {
      termBilled: 0,
      termPaid: 0,
      termPending: 0,
      pendingBills: {
        count: 0,
        amount: 0,
      },
      collectionRate: 0,
    },
    recentActivities: [],
  });

  const [refreshTime, setRefreshTime] = useState("");

  const { user, logout } = useAuth();

  useEffect(() => {
    fetchDashboardData();
    // Refresh data every 5 minutes
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/dashboard/stats");
      setStats(response.data);
      setRefreshTime(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
    setLoading(false);
  };

  const statCards = [
    {
      title: "Total Students",
      value: `${stats.overview.activeStudents} active`,
      icon: AcademicCapIcon,
      color: "bg-blue-500",
      link: "/students-lists",
      trend: "up",
    },
    {
      title: "Teachers",
      value: stats.overview.totalTeachers,
      subValue: "Active staff",
      icon: UserGroupIcon,
      color: "bg-purple-500",
      link: "/teachers/list",
    },
    {
      title: "Classes",
      value: stats.overview.totalClasses,
      subValue: `${stats.overview.activeClasses} active`,
      icon: BuildingLibraryIcon,
      color: "bg-emerald-500",
      link: "/classes/list",
    },
    {
      title: "Today's Attendance",
      value: stats.today.attendance.present,
      subValue: `${stats.today.attendance.rate}% present`,
      icon: ClockIcon,
      color: "bg-green-500",
      link: "academics/attendance",
    },
    {
      title: "Pending Fees",
      value: `Ghc ${stats.finance.termPending}`,
      subValue: ` arrears`,
      icon: ExclamationTriangleIcon,
      color: "bg-amber-500",
      link: "/finance/student-bills",
    },
    {
      title: "Collection Rate",
      value: `${stats.finance.collectionRate}%`,
      subValue: `Ghc ${stats.finance.termPaid} collected`,
      icon: ChartBarIcon,
      color: "bg-indigo-500",
      link: "/finance/reports",
    },
  ];

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  const getAttendanceColor = (rate) => {
    if (rate >= 90) return "text-green-600";
    if (rate >= 75) return "text-amber-600";
    return "text-red-600";
  };

  const getCollectionColor = (rate) => {
    if (rate >= 80) return "text-green-600";
    if (rate >= 60) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
              School Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Welcome back {user?.first_name || user?.username}! Here's an
              overview of your school's performance.
            </p>
            <div className="flex items-center mt-2 space-x-4">
              <span className="text-sm text-gray-500">
                Academic Year:{" "}
                <span className="font-semibold">
                  {stats.overview.academicYear}
                </span>
              </span>
              <span className="text-sm text-gray-500">
                Term:{" "}
                <span className="font-semibold">
                  {stats.overview.currentTerm}
                </span>
              </span>
              <span className="text-xs text-gray-400">
                Updated: {refreshTime}
              </span>
            </div>
          </div>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow p-5 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => (window.location.href = stat.link)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                <stat.icon
                  className={`w-6 h-6 ${stat.color.replace("bg-", "text-")}`}
                />
              </div>
              {stat.trend && (
                <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {stat.value}
            </p>
            {stat.subValue && (
              <p className="text-xs text-gray-500 mt-1">{stat.subValue}</p>
            )}
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Financial Overview */}
        <div className="lg:col-span-2 space-y-8">
          {/* Financial Summary */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Financial Overview
              </h2>
              <span className="text-sm text-gray-500">
                {stats.overview.currentTerm}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-lg font-semibold text-blue-800">
                  Billed
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-2">
                  Ghc {stats.finance.termBilled}
                </div>
                <div className="text-sm text-gray-600 mt-1">Total Fees</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-lg font-semibold text-green-800">
                  Collected
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-2">
                  Ghc {stats.finance.termPaid}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {stats.finance.collectionRate}% Collection Rate
                </div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-lg font-semibold text-red-800">
                  Pending
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-2">
                  Ghc {stats.finance.termPending}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {stats.finance.pendingBills.count} Outstanding Bills
                </div>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Collection Progress
                </span>
                <span
                  className={`text-sm font-semibold ${getCollectionColor(
                    stats.finance.collectionRate
                  )}`}
                >
                  {stats.finance.collectionRate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${
                    stats.finance.collectionRate >= 80
                      ? "bg-green-500"
                      : stats.finance.collectionRate >= 60
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                  style={{
                    width: `${Math.min(stats.finance.collectionRate, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  title: "Take Attendance",
                  link: "academics/attendance",
                  icon: ClockIcon,
                  color: "text-blue-600 bg-blue-50",
                  description: "Record today's attendance",
                },
                {
                  title: "Record Payment",
                  link: "/finance/receive-payment",
                  icon: BanknotesIcon,
                  color: "text-green-600 bg-green-50",
                  description: "Receive fee payment",
                },
                {
                  title: "Add Student",
                  link: "/students-lists",
                  icon: AcademicCapIcon,
                  color: "text-purple-600 bg-purple-50",
                  description: "Enroll new student",
                },
                {
                  title: "Generate Bills",
                  link: "/finance/student-bills",
                  icon: DocumentCheckIcon,
                  color: "text-amber-600 bg-amber-50",
                  description: "Create term bills",
                },
              ].map((action, index) => (
                <a
                  key={index}
                  href={action.link}
                  className="flex flex-col items-center justify-center p-4 rounded-lg border hover:bg-gray-50 transition-colors text-center"
                >
                  <div className={`p-3 rounded-full ${action.color} mb-3`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {action.title}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    {action.description}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          {stats.recentActivities.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Recent Activity
              </h2>
              <div className="space-y-4">
                {stats.recentActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center p-3 hover:bg-gray-50 rounded-lg"
                  >
                    <div
                      className={`p-2 rounded-full ${
                        activity.type === "payment"
                          ? "bg-green-100"
                          : activity.type === "attendance"
                          ? "bg-blue-100"
                          : "bg-amber-100"
                      }`}
                    >
                      {activity.type === "payment" && (
                        <BanknotesIcon className="w-4 h-4 text-green-600" />
                      )}
                      {activity.type === "attendance" && (
                        <ClockIcon className="w-4 h-4 text-blue-600" />
                      )}
                      {activity.type === "expense" && (
                        <DocumentCheckIcon className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-800">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.activity_date).toLocaleDateString()} •
                        {/* {new Date(activity.activity_date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })} */}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Attendance & Alerts */}
        <div className="space-y-8">
          {/* Attendance Today */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Attendance Today
              </h2>
              <CalendarIcon className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="10"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={
                      stats.today.attendance.rate >= 90
                        ? "#10b981"
                        : stats.today.attendance.rate >= 75
                        ? "#f59e0b"
                        : "#ef4444"
                    }
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${
                      stats.today.attendance.rate * 2.51
                    } 251`}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div>
                    <span
                      className={`text-2xl font-bold ${getAttendanceColor(
                        stats.today.attendance.rate
                      )}`}
                    >
                      {stats.today.attendance.rate}%
                    </span>
                    <p className="text-xs text-gray-500">Present</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-2 bg-green-50 rounded">
                  <div className="text-lg font-bold text-green-700">
                    {stats.today.attendance.present}
                  </div>
                  <div className="text-xs text-green-600">Present</div>
                </div>
                <div className="text-center p-2 bg-red-50 rounded">
                  <div className="text-lg font-bold text-red-700">
                    {stats.today.attendance.absent}
                  </div>
                  <div className="text-xs text-red-600">Absent</div>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts & Notifications */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Alerts & Notifications
            </h2>
            <div className="space-y-3">
              {stats.finance.termPending > 0 && (
                <div className="flex items-start p-3 bg-red-50 rounded-lg">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      Ghc {stats.finance.termPending} in pending fees
                    </p>
                    <a
                      href="/finance/student-bills"
                      className="text-xs text-red-600 hover:underline"
                    >
                      View pending bills →
                    </a>
                  </div>
                </div>
              )}

              {stats.today.attendance.rate < 75 && (
                <div className="flex items-start p-3 bg-amber-50 rounded-lg">
                  <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      Low attendance rate ({stats.today.attendance.rate}%)
                    </p>
                    <a
                      href="/attendance"
                      className="text-xs text-amber-600 hover:underline"
                    >
                      Check attendance →
                    </a>
                  </div>
                </div>
              )}

              {stats.today.payments.amount > 0 && (
                <div className="flex items-start p-3 bg-green-50 rounded-lg">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Ghc {stats.today.payments.amount} received today
                    </p>
                    <span className="text-xs text-green-600">
                      {stats.today.payments.count} payments
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-start p-3 bg-blue-50 rounded-lg">
                <CheckCircleIcon className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    All systems operational
                  </p>
                  <span className="text-xs text-blue-600">
                    Updated {refreshTime}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
