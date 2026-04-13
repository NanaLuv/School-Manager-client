import React, { useState, useEffect } from "react";
import {
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import api from "../../components/axiosconfig/axiosConfig";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { toast } from "react-hot-toast";

const EmailLogs = () => {
  // State for logs data
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Filter state
  const [filters, setFilters] = useState({
    email_type: "",
    status: "",
    start_date: "",
    end_date: "",
    student_id: "",
    search: "",
  });

  // Show/hide filter panel
  const [showFilters, setShowFilters] = useState(false);

  // Load data on mount and when filters/pagination change
  useEffect(() => {
    fetchLogs();
  }, [
    pagination.page,
    filters.email_type,
    filters.status,
    filters.start_date,
    filters.end_date,
    filters.student_id,
  ]);

  // Load stats on mount and when date filters change
  useEffect(() => {
    fetchStats();
  }, [filters.start_date, filters.end_date]);

  // Fetch email logs with pagination
  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });

      // Add filters if they have values
      if (filters.email_type) params.append("email_type", filters.email_type);
      if (filters.status) params.append("status", filters.status);
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);
      if (filters.student_id) params.append("student_id", filters.student_id);

      const response = await api.get(`/email-logs?${params.toString()}`);
      if (response.data.success) {
        setLogs(response.data.data);
        setPagination(response.data.pagination);
      } else {
        toast.error("Failed to load email logs");
      }
    } catch (error) {
      console.error("Error fetching email logs:", error);
      toast.error(error.response?.data?.error || "Error loading email logs");
    } finally {
      setLoading(false);
    }
  };

  // Fetch email statistics
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const params = new URLSearchParams();
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);

      const response = await api.get(`/email-stats?${params.toString()}`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching email stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    // Reset to page 1 when filters change
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      email_type: "",
      status: "",
      start_date: "",
      end_date: "",
      student_id: "",
      search: "",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Handle page change
  const goToPage = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Get status badge with icon
  const getStatusBadge = (status, errorMessage) => {
    if (status === "sent") {
      return (
        <div className="flex items-center justify-center">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Sent
          </span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-center group relative">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="w-3 h-3 mr-1" />
            Failed
          </span>
          {errorMessage && (
            <div className="absolute bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
              <ExclamationTriangleIcon className="w-3 h-3 inline mr-1" />
              {errorMessage}
            </div>
          )}
        </div>
      );
    }
  };

  // Get email type badge
  const getEmailTypeBadge = (type) => {
    const colors = {
      payment_receipt: "bg-blue-100 text-blue-800",
      balance_reminder: "bg-purple-100 text-purple-800",
      invoice: "bg-green-100 text-green-800",
      general: "bg-gray-100 text-gray-800",
    };

    const labels = {
      payment_receipt: "Payment Receipt",
      balance_reminder: "Balance Reminder",
      invoice: "Invoice",
      general: "General",
    };

    const colorClass = colors[type] || "bg-gray-100 text-gray-800";
    const label = labels[type] || type.replace(/_/g, " ");

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <EnvelopeIcon className="w-6 h-6 mr-2 text-blue-500" />
                Email Communication Logs
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Track all email communications sent to parents and students
              </p>
            </div>

            {/* Refresh button */}
            <button
              onClick={() => {
                fetchLogs();
                fetchStats();
              }}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowPathIcon
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                  <EnvelopeIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 truncate">
                    Total Emails
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {loadingStats ? "..." : stats.overview.total_emails}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 truncate">
                    Successful
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {loadingStats ? "..." : stats.overview.successful}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-100 rounded-lg p-3">
                  <XCircleIcon className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 truncate">
                    Failed
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {loadingStats ? "..." : stats.overview.failed}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                  <DocumentTextIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 truncate">
                    Success Rate
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {loadingStats
                      ? "..."
                      : stats.overview.total_emails > 0
                        ? Math.round(
                            (stats.overview.successful /
                              stats.overview.total_emails) *
                              100,
                          )
                        : 0}
                    %
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div
            className="px-6 py-4 flex items-center justify-between cursor-pointer"
            onClick={() => setShowFilters(!showFilters)}
          >
            <div className="flex items-center">
              <FunnelIcon className="w-5 h-5 text-gray-500 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Filters</h2>
              {(filters.email_type ||
                filters.status ||
                filters.start_date ||
                filters.end_date ||
                filters.student_id) && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Active Filters
                </span>
              )}
            </div>
            <ChevronRightIcon
              className={`w-5 h-5 text-gray-400 transform transition-transform ${
                showFilters ? "rotate-90" : ""
              }`}
            />
          </div>

          {showFilters && (
            <div className="px-6 pb-6 border-t border-gray-200 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Email Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Type
                  </label>
                  <select
                    value={filters.email_type}
                    onChange={(e) =>
                      handleFilterChange("email_type", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">All Types</option>
                    <option value="payment_receipt">Payment Receipt</option>
                    <option value="balance_reminder">Balance Reminder</option>
                    <option value="invoice">Invoice</option>
                    <option value="general">General</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      handleFilterChange("status", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="sent">Sent</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) =>
                      handleFilterChange("start_date", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) =>
                      handleFilterChange("end_date", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Student ID (can be hidden or shown based on need) */}
                <div className="lg:col-span-4 flex justify-end space-x-3">
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={() => {
                      setPagination((prev) => ({ ...prev, page: 1 }));
                      fetchLogs();
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Email Type Summary */}
        {stats && stats.by_type.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Email Type Summary
            </h3>
            <div className="flex flex-wrap gap-3">
              {stats.by_type.map((type) => (
                <div
                  key={type.email_type}
                  className="flex items-center bg-gray-50 rounded-lg px-3 py-2"
                >
                  {getEmailTypeBadge(type.email_type)}
                  <span className="ml-2 text-sm text-gray-600">
                    {type.sent_count} sent, {type.failed_count} failed
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="py-20">
              <LoadingSpinner text="Loading email logs..." />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No emails found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {filters.email_type || filters.status || filters.start_date
                  ? "Try adjusting your filters"
                  : "No email logs have been recorded yet"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Date & Time
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Student
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Recipient
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Type
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Message ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <ClockIcon className="w-4 h-4 text-gray-400 mr-2" />
                            {formatDate(log.sent_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {log.student_name || "Unknown Student"}
                          </div>
                          {log.admission_number && (
                            <div className="text-xs text-gray-500">
                              {log.admission_number}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.recipient_email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getEmailTypeBadge(log.email_type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(log.status, log.error_message)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {log.message_id ? (
                            <span title={log.message_id}>
                              {log.message_id.substring(0, 8)}...
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{" "}
                        <span className="font-medium">
                          {(pagination.page - 1) * pagination.limit + 1}
                        </span>{" "}
                        to{" "}
                        <span className="font-medium">
                          {Math.min(
                            pagination.page * pagination.limit,
                            pagination.total,
                          )}
                        </span>{" "}
                        of{" "}
                        <span className="font-medium">{pagination.total}</span>{" "}
                        results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => goToPage(pagination.page - 1)}
                          disabled={!pagination.hasPrevPage}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeftIcon className="h-5 w-5" />
                        </button>

                        {/* Page numbers */}
                        {[...Array(Math.min(5, pagination.totalPages))].map(
                          (_, idx) => {
                            let pageNum;
                            if (pagination.totalPages <= 5) {
                              pageNum = idx + 1;
                            } else if (pagination.page <= 3) {
                              pageNum = idx + 1;
                            } else if (
                              pagination.page >=
                              pagination.totalPages - 2
                            ) {
                              pageNum = pagination.totalPages - 4 + idx;
                            } else {
                              pageNum = pagination.page - 2 + idx;
                            }

                            return (
                              <button
                                key={pageNum}
                                onClick={() => goToPage(pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  pagination.page === pageNum
                                    ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                    : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          },
                        )}

                        <button
                          onClick={() => goToPage(pagination.page + 1)}
                          disabled={!pagination.hasNextPage}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRightIcon className="h-5 w-5" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Daily Activity Chart (Simple version) */}
        {stats && stats.daily && stats.daily.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Recent Daily Activity
            </h3>
            <div className="flex items-end space-x-2 h-24">
              {stats.daily.slice(0, 10).map((day) => {
                const maxCount = Math.max(...stats.daily.map((d) => d.total));
                const height = maxCount > 0 ? (day.total / maxCount) * 100 : 0;

                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center"
                  >
                    <div
                      className="w-full bg-blue-500 rounded-t"
                      style={{ height: `${height}%` }}
                    >
                      <div className="text-xs text-center text-white font-medium pt-1">
                        {day.total}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 truncate w-full text-center">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailLogs;
