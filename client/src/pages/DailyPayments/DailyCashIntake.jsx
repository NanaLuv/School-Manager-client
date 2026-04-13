import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  CurrencyDollarIcon,
  PlusIcon,
  CalendarIcon,
  BanknotesIcon,
  DocumentTextIcon,
  ChartBarIcon,
  TableCellsIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import api from "../../components/axiosconfig/axiosConfig";

const DailyCashIntake = () => {
  const [formData, setFormData] = useState({
    receipt_date: new Date().toISOString().split("T")[0],
    fee_category_id: "",
    amount: "",
    description: "",
    source: "",
    payment_method: "Cash",
    reference_number: "",
    notes: "",
  });

  const [feeCategories, setFeeCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentReceipts, setRecentReceipts] = useState([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [stats, setStats] = useState({});
  const [view, setView] = useState("today"); // 'today', 'history', 'reports'
  const [filters, setFilters] = useState({
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
    fee_category_id: "",
    source: "",
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    format: "excel",
    includeSummary: true,
  });

  // Load fee categories
  useEffect(() => {
    fetchFeeCategories();
    fetchTodaysData();
  }, []);

  // Fetch today's data
  const fetchTodaysData = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];

      const [receiptsRes, statsRes] = await Promise.all([
        api.get("/cash-receipts", {
          params: { start_date: today, end_date: today, limit: 20 },
        }),
        api.get("/cash-receipts/stats", {
          params: { start_date: today, end_date: today },
        }),
      ]);

      setRecentReceipts(receiptsRes.data.receipts || []);
      setStats(statsRes.data.overview || {});

      // Calculate today's total
      const total = (receiptsRes.data.receipts || []).reduce(
        (sum, receipt) => sum + parseFloat(receipt.amount),
        0
      );
      setTodayTotal(total);
    } catch (error) {
      console.error("Error loading today's data:", error);
    }
  };

  // Fetch with filters (for history view)
  const fetchWithFilters = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        "/cash-receipts",
        {
          params: { ...filters, limit: 50 },
        }
      );

      setRecentReceipts(response.data.receipts || []);

      const total = (response.data.receipts || []).reduce(
        (sum, receipt) => sum + parseFloat(receipt.amount),
        0
      );
      setTodayTotal(total);
    } catch (error) {
      console.error("Error loading filtered data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeeCategories = async () => {
    try {
      const response = await api.get(
        "/getfeecategories"
      );
      setFeeCategories(response.data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/cash-receipts", {
        ...formData,
        received_by: 1, // Replace with actual logged-in user ID
      });

      // Reset form
      setFormData({
        receipt_date: new Date().toISOString().split("T")[0],
        fee_category_id: "",
        amount: "",
        description: "",
        source: "",
        payment_method: "Cash",
        reference_number: "",
        notes: "",
      });

      // Refresh data
      fetchTodaysData();
      alert("Cash receipt recorded successfully!");
    } catch (error) {
      console.error("Error recording receipt:", error);
      alert(error.response?.data?.error || "Error recording cash receipt");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeleteReceipt = async (id) => {
    if (!window.confirm("Are you sure you want to delete this receipt?"))
      return;

    try {
      await api.delete(`/cash-receipts/${id}`);
      fetchTodaysData();
      alert("Receipt deleted successfully!");
    } catch (error) {
      console.error("Error deleting receipt:", error);
      alert("Error deleting receipt");
    }
  };

  const formatCurrency = (amount) => {
    return `Ghc ${parseFloat(amount || 0).toFixed(2)}`;
  };

  // Export handler
  const handleExport = async () => {
    try {
      // Clean up empty filter values
      const cleanFilters = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "" && value !== null && value !== undefined) {
          cleanFilters[key] = value;
        }
      });

      // Ensure we have dates
      if (!cleanFilters.start_date) {
        cleanFilters.start_date = new Date().toISOString().split("T")[0];
      }
      if (!cleanFilters.end_date) {
        cleanFilters.end_date = new Date().toISOString().split("T")[0];
      }

      const params = new URLSearchParams({
        ...cleanFilters,
        format: exportOptions.format,
      });


      const response = await api.get(
        `/cash-receipts/export?${params}`,
        {
          responseType: "blob",
          timeout: 60000,
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // FIX: Use correct file extensions
      const format = exportOptions.format === "excel" ? "xlsx" : "pdf";
      const filename = `cash-receipts-${
        new Date().toISOString().split("T")[0]
      }.${format}`; // Changed from .excel to .xlsx
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setShowExportModal(false);
    } catch (error) {
      console.error("Error exporting:", error);
      if (error.response?.status === 404) {
        alert(
          "Export route not found. Please check if the route is registered on the server."
        );
      } else if (error.code === "ECONNABORTED") {
        alert("Export timed out. Try with smaller date range or Excel format.");
      } else {
        alert(
          "Error exporting data: " +
            (error.response?.data?.error || error.message)
        );
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <BanknotesIcon className="w-6 h-6 mr-2 text-green-500" />
          Daily Cash Intake
        </h1>
        <p className="text-gray-600">
          Record and track cash received from various sources
        </p>
      </div>

      {/* View Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setView("today")}
          className={`py-2 px-4 font-medium text-sm border-b-2 ${
            view === "today"
              ? "border-green-500 text-green-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Today's Entries
        </button>
        <button
          onClick={() => setView("history")}
          className={`py-2 px-4 font-medium text-sm border-b-2 ${
            view === "history"
              ? "border-green-500 text-green-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          History
        </button>
        <button
          onClick={() => setView("reports")}
          className={`py-2 px-4 font-medium text-sm border-b-2 ${
            view === "reports"
              ? "border-green-500 text-green-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Reports & Export
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Entry Form (Always visible) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <PlusIcon className="w-5 h-5 mr-2 text-blue-500" />
              Quick Entry
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <CalendarIcon className="w-4 h-4 inline mr-1" />
                    Date
                  </label>
                  <input
                    type="date"
                    name="receipt_date"
                    value={formData.receipt_date}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                    required
                  />
                </div>

                {/* Fee Category */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Fee Category *
                  </label>
                  <select
                    name="fee_category_id"
                    value={formData.fee_category_id}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                    required
                  >
                    <option value="">Select Category</option>
                    {feeCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.category_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {/* <CurrencyDollarIcon className="w-4 h-4 inline mr-1" /> */}
                    Amount (Ghc) *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0.01"
                    className="w-full border p-2 rounded"
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Source */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Source *
                  </label>
                  <input
                    type="text"
                    name="source"
                    value={formData.source}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                    placeholder="e.g., Bus Driver, Canteen, Book Seller"
                    required
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                    placeholder="Brief description (optional)"
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600 flex items-center justify-center font-medium"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Recording...
                      </>
                    ) : (
                      <>
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Record Cash Receipt
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Data Table (Changes based on view) */}
          <div className="bg-white rounded-lg shadow border">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                {view === "today" && "Today's Receipts"}
                {view === "history" && "Receipt History"}
                {view === "reports" && "Receipts Data"}
              </h2>

              {view === "history" && (
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    name="start_date"
                    value={filters.start_date}
                    onChange={handleFilterChange}
                    className="border p-1 rounded text-sm"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    name="end_date"
                    value={filters.end_date}
                    onChange={handleFilterChange}
                    className="border p-1 rounded text-sm"
                  />
                  <button
                    onClick={fetchWithFilters}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                  >
                    Filter
                  </button>
                </div>
              )}
            </div>

            {recentReceipts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <TableCellsIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No receipts found</p>
                <p className="text-sm">Record your first cash receipt above</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Category</th>
                      <th className="p-3 text-left">Source</th>
                      <th className="p-3 text-left">Description</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3 text-left">Method</th>
                      <th className="p-3 text-left">Recorded By</th>
                      {view !== "today" && (
                        <th className="p-3 text-left">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {recentReceipts.map((receipt) => (
                      <tr
                        key={receipt.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-3">
                          {new Date(receipt.receipt_date).toDateString()}
                        </td>
                        <td className="p-3">{receipt.category_name}</td>
                        <td className="p-3">{receipt.source}</td>
                        <td className="p-3 max-w-xs truncate">
                          {receipt.description}
                        </td>
                        <td className="p-3 text-right font-medium text-green-600">
                          {formatCurrency(receipt.amount)}
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {receipt.payment_method}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-gray-500">
                          {receipt.received_by_name}
                        </td>
                        {view !== "today" && (
                          <td className="p-3">
                            <button
                              onClick={() => handleDeleteReceipt(receipt.id)}
                              className="text-red-500 hover:text-red-700"
                              title="Delete receipt"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Stats & Summary */}
        <div>
          {/* Today's Total */}
          <div className="bg-white rounded-lg shadow border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Today's Summary</h2>

            <div className="bg-green-50 p-4 rounded-lg mb-4">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-green-600">
                    Total Collected Today
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(todayTotal)}
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    {recentReceipts.length} receipt(s)
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Average Receipt:</span>
                <span className="font-medium">
                  {formatCurrency(stats.average_amount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Unique Sources:</span>
                <span className="font-medium">{stats.unique_sources || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Categories:</span>
                <span className="font-medium">
                  {stats.unique_categories || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Export Card */}
          <div className="bg-white rounded-lg shadow border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <ArrowDownTrayIcon className="w-5 h-5 mr-2 text-blue-500" />
              Export Data
            </h2>

            <p className="text-sm text-gray-600 mb-4">
              Export receipts to Excel or PDF format for reporting and record
              keeping.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => setShowExportModal(true)}
                className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center justify-center"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                Export Receipts
              </button>

              <button
                onClick={() => {
                  setView("reports");
                  setShowExportModal(true);
                }}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center"
              >
                <ChartBarIcon className="w-4 h-4 mr-2" />
                Generate Report
              </button>
            </div>

            <div className="mt-4 text-xs text-gray-500 flex items-start">
              <InformationCircleIcon className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
              <p>
                Exports include all receipt details and can be filtered by date
                range, category, or source.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Export Options
                </h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  ✕
                </button>
              </div>

              {/* Format Selection */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Select Format
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() =>
                      setExportOptions((prev) => ({ ...prev, format: "excel" }))
                    }
                    className={`p-4 border rounded-lg flex flex-col items-center ${
                      exportOptions.format === "excel"
                        ? "border-green-500 bg-green-50"
                        : "border-gray-300"
                    }`}
                  >
                    <div className="w-10 h-10 mb-2 bg-green-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-green-600"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M6 2h8l6 6v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zm8 2v6h6l-6-6z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">Excel</span>
                    <span className="text-xs text-gray-500">.xlsx</span>
                  </button>

                  <button
                    onClick={() =>
                      setExportOptions((prev) => ({ ...prev, format: "pdf" }))
                    }
                    className={`p-4 border rounded-lg flex flex-col items-center ${
                      exportOptions.format === "pdf"
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                  >
                    <div className="w-10 h-10 mb-2 bg-red-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-red-600"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8.267 14.68c-.184 0-.308.018-.372.036v1.178c.076.018.171.023.302.023.479 0 .774-.242.774-.651 0-.366-.254-.586-.704-.586zm3.487.012c-.2 0-.33.018-.407.036v2.61c.077.018.201.018.313.018.817.006 1.349-.444 1.349-1.396 0-.705-.373-1.268-1.255-1.268z" />
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-3.666 9.293c0-.757.268-1.304.785-1.643.511-.334 1.24-.514 2.186-.514.949 0 1.683.18 2.201.537.517.357.778.92.778 1.692v3.861h-1.496v-1.02h-.05c-.163.377-.419.669-.767.876-.348.205-.804.308-1.368.308-.644 0-1.148-.152-1.513-.456-.365-.305-.548-.76-.548-1.363 0-.628.192-1.092.577-1.392.385-.3.935-.449 1.649-.449.457 0 .846.061 1.169.184.322.123.569.277.738.462h.05v-1.23h.033c-.012-.213-.081-.405-.207-.574a1.19 1.19 0 00-.524-.396 2.157 2.157 0 00-.801-.137c-.57 0-1.024.153-1.362.46-.339.307-.508.75-.508 1.33h1.503zm4.988 2.963v1.15h-3.595v-1.15h3.595zM14 9h-1V4l5 5h-4z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">PDF</span>
                    <span className="text-xs text-gray-500">.pdf</span>
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeSummary"
                    checked={exportOptions.includeSummary}
                    onChange={(e) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        includeSummary: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="includeSummary"
                    className="ml-3 text-sm text-gray-700"
                  >
                    Include summary section
                  </label>
                </div>

                {view === "history" && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    <p className="font-medium">Exporting with filters:</p>
                    <p className="mt-1">
                      Date: {filters.start_date} to {filters.end_date}
                    </p>
                    {filters.fee_category_id && <p>Category: Selected</p>}
                    {filters.source && <p>Source: {filters.source}</p>}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  Export {exportOptions.format.toUpperCase()}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyCashIntake;
