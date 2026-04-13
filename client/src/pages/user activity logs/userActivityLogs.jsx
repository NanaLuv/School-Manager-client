import React, { useState, useEffect } from "react";
import {
  ClockIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  UserCircleIcon,
  ComputerDesktopIcon,
  ShieldCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import Modal from "../../components/common/Modal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import api from "../../components/axiosconfig/axiosConfig";
import { format } from "date-fns";

const UserActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    user_id: "",
    action: "",
    start_date: "",
    end_date: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });
  const [availableActions, setAvailableActions] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [filters.page, filters.limit]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await api.get(`/user-activity-logs?${params}`);
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
      setAvailableActions(response.data.filters.actions);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const response = await api.get("/user-activity-logs/stats?days=30");
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 50,
      user_id: "",
      action: "",
      start_date: "",
      end_date: "",
      search: "",
    });
    setShowFilters(false);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);
      if (filters.action) params.append("action", filters.action);

      const response = await api.get(`/user-activity-logs/export?${params}`);

      // Convert to CSV
      const csvData = convertToCSV(response.data);
      downloadCSV(
        csvData,
        `activity_logs_${format(new Date(), "yyyy-MM-dd")}.csv`,
      );
    } catch (error) {
      console.error("Error exporting logs:", error);
      alert("Failed to export logs");
    }
    setExporting(false);
  };

  const convertToCSV = (data) => {
    if (data.length === 0) return "";

    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add headers
    csvRows.push(headers.join(","));

    // Add rows
    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header]?.toString() || "";
        return `"${value.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(","));
    }

    return csvRows.join("\n");
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", filename);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getActionColor = (action) => {
    const colors = {
      login: "bg-green-100 text-green-800 border-green-200",
      logout: "bg-gray-100 text-gray-800 border-gray-200",
      create: "bg-blue-100 text-blue-800 border-blue-200",
      update: "bg-yellow-100 text-yellow-800 border-yellow-200",
      delete: "bg-red-100 text-red-800 border-red-200",
      password_change: "bg-purple-100 text-purple-800 border-purple-200",
      export: "bg-indigo-100 text-indigo-800 border-indigo-200",
      import: "bg-cyan-100 text-cyan-800 border-cyan-200",
    };
    return colors[action] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: format(date, "MMM dd, yyyy"),
      time: format(date, "hh:mm:ss a"),
    };
  };

  if (loading && logs.length === 0) {
    return <LoadingSpinner text="Loading activity logs..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                User Activity Logs
              </h1>
              <p className="text-gray-600 mt-2">
                Track and monitor all user actions in the system
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowStats(!showStats)}
                className="flex items-center space-x-2 bg-purple-50 text-purple-700 px-4 py-2.5 rounded-xl hover:bg-purple-100 transition-colors border border-purple-200"
              >
                <ChartBarIcon className="w-5 h-5" />
                <span>Stats</span>
              </button>

              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-200 disabled:opacity-50"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                <span>{exporting ? "Exporting..." : "Export"}</span>
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-colors ${
                  showFilters
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <FunnelIcon className="w-5 h-5" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          {/* Stats Section */}
          {showStats && stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 animate-fadeIn">
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Activities</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.summary.total_activities}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <ClockIcon className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.summary.active_users}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Unique users</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <UserCircleIcon className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Days</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.summary.active_days}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Out of 30 days</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <CalendarIcon className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Last Activity</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {format(new Date(stats.summary.last_activity), "hh:mm a")}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(stats.summary.last_activity), "MMM dd")}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <ComputerDesktopIcon className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters Section */}
          {showFilters && (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6 animate-slideDown">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Filter Logs</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center space-x-1"
                >
                  <XMarkIcon className="w-4 h-4" />
                  <span>Clear all</span>
                </button>
              </div>

              <form
                onSubmit={handleSearch}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) =>
                      handleFilterChange("search", e.target.value)
                    }
                    placeholder="Search by user or description..."
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Action Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action
                  </label>
                  <select
                    value={filters.action}
                    onChange={(e) =>
                      handleFilterChange("action", e.target.value)
                    }
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Actions</option>
                    {availableActions.map((action) => (
                      <option key={action} value={action}>
                        {action}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) =>
                      handleFilterChange("start_date", e.target.value)
                    }
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) =>
                      handleFilterChange("end_date", e.target.value)
                    }
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Apply Filters Button */}
                <div className="md:col-span-2 lg:col-span-4 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    Timestamp
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    Action
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-16 text-center text-gray-500"
                    >
                      <ClockIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg">No activity logs found</p>
                      <p className="text-sm">Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDateTime(log.created_at).date}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDateTime(log.created_at).time}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {log.first_name?.[0]}
                              {log.last_name?.[0] || log.username?.[0]}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {log.first_name && log.last_name
                                ? `${log.first_name} ${log.last_name}`
                                : log.username}
                            </div>
                            <div className="text-xs text-gray-500">
                              {log.role_name}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getActionColor(log.action)}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {log.description}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 font-mono">
                          {log.ip_address || "N/A"}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} entries
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={pagination.page === 1}
                  className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>

                <span className="px-4 py-2 bg-blue-500 text-white rounded-lg">
                  Page {pagination.page} of {pagination.pages}
                </span>

                <button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={pagination.page === pagination.pages}
                  className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats Cards - Actions Breakdown */}
        {stats && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {stats.actions.slice(0, 6).map((action) => (
              <div
                key={action.action}
                className="bg-white rounded-lg p-3 border border-gray-200"
              >
                <p className="text-xs text-gray-500">{action.action}</p>
                <p className="text-lg font-bold text-gray-900">
                  {action.count}
                </p>
                <p className="text-xs text-gray-500">
                  {action.unique_users} users
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserActivityLogs;
