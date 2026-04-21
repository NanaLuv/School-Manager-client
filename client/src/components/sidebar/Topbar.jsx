// frontend/src/components/Topbar.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../pages/contexts/AuthContext";
import {
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  SunIcon,
  MoonIcon,
  UserCircleIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

const Topbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  // const [showNotifications, setShowNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  // Get page title based on route
  const getPageTitle = () => {
    const path = location.pathname;
    const pathMap = {
      "/dashboard": "Dashboard",
      "/students-lists": "Students",
      "/teachers/list": "Teachers",
      "/classes/list": "Classes",
      "/subjects/list": "Subjects",
      "/year-term-settings": "Academic Calendar",
      "/school-settings": "School Settings",
      "/accounts": "User Management",
      "/finance/student-bills": "Student Bills",
      "/email-logs": "Email Logs",
      "/profit-loss": "Profit & Loss",
      "/payroll-dashboard": "Payroll Dashboard",
      "/finance/arrears": "Arrears",
      "/finance/fee-categories": "Fee Categories",
      "/finance/classbills": "Class Bills",
      "/finance/receive-payment": "Receive Payments",
      "/finance/receipts-management": "Receipts Management",
      "/daily-payments": "Daily Payments",
      "/finance/reports": "Financial Reports",
      "/expenses": "Expenses",
      // Add more mappings as needed
    };

    return pathMap[path] || "School Management System";
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user?.username?.[0]?.toUpperCase() || "U";
  };

  // Get role badge color
  const getRoleColor = () => {
    const role = (user?.role || user?.role_name || "").toLowerCase();
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "teacher":
        return "bg-blue-100 text-blue-800";
      case "student":
        return "bg-green-100 text-green-800";
      case "accountant":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get role icon
  const getRoleIcon = () => {
    const role = (user?.role || user?.role_name || "").toLowerCase();
    switch (role) {
      case "admin":
        return <ShieldCheckIcon className="w-4 h-4" />;
      case "teacher":
        return <UserCircleIcon className="w-4 h-4" />;
      case "student":
        return <UserCircleIcon className="w-4 h-4" />;
      case "accountant":
        return <ChartBarIcon className="w-4 h-4" />;
      default:
        return <UserCircleIcon className="w-4 h-4" />;
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality
    }
  };

  // Get unread notification count
  // const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section - Page title */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {getPageTitle()}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Right section - Controls */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            {/* <form onSubmit={handleSearch} className="hidden md:block">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white 
                           focus:ring-2 focus:ring-emerald-500 focus:border-transparent 
                           w-64 lg:w-80"
                  placeholder="Search students, teachers, reports..."
                />
              </div>
            </form> */}

            {/* Help */}
            <button
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 
                             dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 
                             dark:hover:bg-gray-700"
            >
              <QuestionMarkCircleIcon className="h-6 w-6" />
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 
                       dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 
                       dark:hover:bg-gray-700"
            >
              {darkMode ? (
                <SunIcon className="h-6 w-6" />
              ) : (
                <MoonIcon className="h-6 w-6" />
              )}
            </button>

            {/* Notifications */}
            <div className="relative">
              {/* <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 
                         dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 
                         dark:hover:bg-gray-700 relative"
              >
                <BellIcon className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 bg-red-500 text-white 
                                 text-xs rounded-full h-5 w-5 flex items-center justify-center"
                  >
                    {unreadCount}
                  </span>
                )}
              </button> */}

              {/* Notifications dropdown */}
              {/* {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  ></div>
                  <div
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 
                                rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 
                                z-50"
                  >
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Notifications
                        </h3>
                        <button
                          onClick={clearAllNotifications}
                          className="text-sm text-emerald-600 hover:text-emerald-700"
                        >
                          Clear all
                        </button>
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b border-gray-100 dark:border-gray-700 
                                     hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer
                                     ${
                                       !notification.read
                                         ? "bg-blue-50 dark:bg-gray-700"
                                         : ""
                                     }`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div className="flex items-start">
                              <div
                                className={`flex-shrink-0 w-8 h-8 rounded-full flex 
                                            items-center justify-center mr-3
                                            ${
                                              notification.type === "success"
                                                ? "bg-green-100 text-green-600"
                                                : notification.type ===
                                                  "warning"
                                                ? "bg-amber-100 text-amber-600"
                                                : "bg-blue-100 text-blue-600"
                                            }`}
                              >
                                {notification.type === "success"
                                  ? "✓"
                                  : notification.type === "warning"
                                  ? "!"
                                  : "i"}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  {notification.time}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-500 dark:text-gray-400">
                            No notifications
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
                      <button
                        onClick={() => navigate("/notifications")}
                        className="text-sm text-emerald-600 hover:text-emerald-700"
                      >
                        View all notifications
                      </button>
                    </div>
                  </div>
                </>
              )} */}
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 
                         dark:hover:bg-gray-700 focus:outline-none"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div
                      className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 
                                  rounded-full flex items-center justify-center text-white 
                                  font-semibold"
                    >
                      {getUserInitials()}
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full 
                                  border-2 border-white dark:border-gray-800 flex 
                                  items-center justify-center ${getRoleColor()}`}
                    >
                      {getRoleIcon()}
                    </div>
                  </div>

                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.first_name || user?.username}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {user?.role || user?.role_name || "User"}
                    </p>
                  </div>

                  <ChevronDownIcon
                    className={`h-5 w-5 text-gray-500 dark:text-gray-400 
                                             transition-transform ${
                                               showUserMenu ? "rotate-180" : ""
                                             }`}
                  />
                </div>
              </button>

              {/* User dropdown menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  ></div>
                  <div
                    className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 
                                rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 
                                z-50 py-1"
                  >
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {user?.email || "No email"}
                      </p>
                      <div className="mt-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full 
                                        text-xs font-medium ${getRoleColor()}`}
                        >
                          {getRoleIcon()}
                          <span className="ml-1 capitalize">
                            {user?.role || user?.role_name}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Menu items */}
                    <button
                      onClick={() => {
                        navigate("/profile");
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-gray-700 
                               dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 
                               flex items-center"
                    >
                      <UserCircleIcon className="h-5 w-5 mr-3 text-gray-400" />
                      My Profile
                    </button>

                    <button
                      onClick={() => {
                        navigate("/settings");
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-gray-700 
                               dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 
                               flex items-center"
                    >
                      <Cog6ToothIcon className="h-5 w-5 mr-3 text-gray-400" />
                      Settings
                    </button>

                    {/* Divider */}
                    <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>

                    {/* Logout */}
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-red-600 
                               hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      <div className="md:hidden px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSearch} className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 
                     rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white 
                     focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="Search..."
          />
        </form>
      </div>
    </header>
  );
};

export default Topbar;
