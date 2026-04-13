import React, { useState, useEffect } from "react";
import {
  CurrencyDollarIcon,
  PlusIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  ReceiptRefundIcon,
  BanknotesIcon,
  UserIcon,
  TagIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import api from "../../components/axiosconfig/axiosConfig";

import { useAuth } from "../contexts/AuthContext";

const ExpensesManagement = () => {
  // Form state
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    expense_category: "",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    description: "",
    paid_to: "",
    payment_method: "Cash",
    reference_number: "",
    voucher_number: "",
  });


  // UI state
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [view, setView] = useState("entries");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
    expense_category: "",
    paid_to: "",
  });
  const [statistics, setStatistics] = useState({});
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    format: "excel",
    includeSummary: true,
  });

  // Load initial data
  useEffect(() => {
    fetchExpenses();
    fetchStatistics();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await api.get("/expenses", {
        params: { ...filters, limit: 50 },
      });
      console.log("Fetched expenses:", response.data);
      setExpenses(response.data.expenses || []);
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error("Error loading expenses:", error);
      alert("Error loading expenses");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await api.get("/expenses/statistics", {
        params: { start_date: today, end_date: today },
      });
      setStatistics(response.data.overview || {});
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setLoading(true);
  //   try {
  //     // Don't send voucher_number if it's empty
  //     const submitData = { ...formData};
  //     console.log("Submitting form with data:", submitData);
  //     if (
  //       !submitData.voucher_number ||
  //       submitData.voucher_number.trim() === ""
  //     ) {
  //       delete submitData.voucher_number;
  //     }

  //     if (editingId) {
  //       await api.put(`/expenses/${editingId}`, submitData);
  //       alert("Expense updated successfully!");
  //       setEditingId(null);
  //     } else {
  //       await api.post("/expenses", submitData);
  //       alert("Expense recorded successfully!");
  //     }

  //     // Reset form
  //     setFormData({
  //       expense_category: "",
  //       amount: "",
  //       expense_date: new Date().toISOString().split("T")[0],
  //       description: "",
  //       paid_to: "",
  //       payment_method: "Cash",
  //       reference_number: "",
  //       voucher_number: "", // Keep this empty
  //       recorded_by: user.role_id || 1,
  //     });
  //     setShowForm(false);

  //     // Refresh data
  //     fetchExpenses();
  //     fetchStatistics();
  //   } catch (error) {
  //     console.error("Error saving expense:", error);

  //     // Special handling for database schema errors
  //     if (error.response?.data?.error?.includes("Database schema mismatch")) {
  //       alert(
  //         "Database needs update. Please run the SQL query to add voucher_number column to expenses table.",
  //       );
  //     } else {
  //       alert(error.response?.data?.error || "Error saving expense");
  //     }
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const recordedById = user.id || 1;


      const submitData = {
        ...formData,
        recorded_by: parseInt(recordedById),
      };


      if (
        !submitData.voucher_number ||
        submitData.voucher_number.trim() === ""
      ) {
        delete submitData.voucher_number;
      }

      if (editingId) {
        await api.put(`/expenses/${editingId}`, submitData);
        alert("Expense updated successfully!");
        setEditingId(null);
      } else {
        await api.post("/expenses", submitData);
        alert("Expense recorded successfully!");
      }

      setFormData({
        expense_category: "",
        amount: "",
        expense_date: new Date().toISOString().split("T")[0],
        description: "",
        paid_to: "",
        payment_method: "Cash",
        reference_number: "",
        voucher_number: "",
      });
      setShowForm(false);

      fetchExpenses();
      fetchStatistics();
    } catch (error) {
      console.error("Error saving expense:", error);
      alert(error.response?.data?.error || "Error saving expense");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (expense) => {
    setFormData({
      expense_category: expense.expense_category,
      amount: expense.amount,
      expense_date: expense.expense_date.split("T")[0],
      description: expense.description,
      paid_to: expense.paid_to,
      payment_method: expense.payment_method || "Cash",
      reference_number: expense.reference_number || "",
      voucher_number: expense.voucher_number || "",
      recorded_by: expense.recorded_by,
    });
    setEditingId(expense.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?"))
      return;

    try {
      await api.delete(`/expenses/${id}`);
      fetchExpenses();
      fetchStatistics();
      alert("Expense deleted successfully!");
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert("Error deleting expense");
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

  const formatCurrency = (amount) => {
    return `Ghc ${parseFloat(amount || 0).toFixed(2)}`;
  };

  const handleExport = async () => {
    try {
      const cleanFilters = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "" && value !== null && value !== undefined) {
          cleanFilters[key] = value;
        }
      });

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

      const response = await api.get(`/expenses/export?${params}`, {
        responseType: "blob",
        timeout: 60000,
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const format = exportOptions.format === "excel" ? "xlsx" : "pdf";
      const filename = `expenses-${
        new Date().toISOString().split("T")[0]
      }.${format}`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setShowExportModal(false);
    } catch (error) {
      console.error("Error exporting:", error);
      if (error.response?.status === 404) {
        alert("Export route not found. Please check backend routes.");
      } else {
        alert(
          "Error exporting data: " +
            (error.response?.data?.error || error.message),
        );
      }
    }
  };

  // Common expense categories
  const commonCategories = [
    "Utilities",
    "Stationery",
    "Maintenance",
    "Transport",
    "Food & Catering",
    "Staff Welfare",
    "Office Supplies",
    "Cleaning",
    "Security",
    "Internet",
    "Communication",
    "Repairs",
    "Other",
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <ReceiptRefundIcon className="w-6 h-6 mr-2 text-orange-500" />
          Expenses & PV Management
        </h1>
        <p className="text-gray-600">
          Record, track, and manage school expenses
        </p>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow border p-4">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-full">
              <CurrencyDollarIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-lg font-semibold">
                {statistics.total_expenses || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border p-4">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded-full">
              <BanknotesIcon className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-lg font-semibold">
                {formatCurrency(statistics.total_amount)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border p-4">
          <div className="flex items-center">
            <div className="bg-purple-100 p-2 rounded-full">
              <TagIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Categories</p>
              <p className="text-lg font-semibold">
                {statistics.unique_categories || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border p-4">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-2 rounded-full">
              <UserIcon className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Vendors</p>
              <p className="text-lg font-semibold">
                {statistics.unique_vendors || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Form & Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <PlusIcon className="w-5 h-5 mr-2 text-blue-500" />
              Quick Actions
            </h2>

            <button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setFormData({
                  expense_category: "",
                  amount: "",
                  expense_date: new Date().toISOString().split("T")[0],
                  description: "",
                  paid_to: "",
                  payment_method: "Cash",
                  reference_number: "",
                  voucher_number: "",
                  recorded_by: 1,
                });
              }}
              className="w-full bg-blue-500 text-white px-4 py-3 rounded hover:bg-blue-600 flex items-center justify-center font-medium mb-3"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              New Expense / PV
            </button>

            <button
              onClick={() => setView("reports")}
              className="w-full bg-green-500 text-white px-4 py-3 rounded hover:bg-green-600 flex items-center justify-center font-medium mb-3"
            >
              <ChartBarIcon className="w-4 h-4 mr-2" />
              View Reports
            </button>

            <button
              onClick={() => setShowExportModal(true)}
              className="w-full bg-purple-500 text-white px-4 py-3 rounded hover:bg-purple-600 flex items-center justify-center font-medium"
            >
              <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
              Export Data
            </button>

            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Today's Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Expenses:</span>
                  <span className="font-medium">
                    {statistics.total_expenses || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(statistics.total_amount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Average:</span>
                  <span className="font-medium">
                    {formatCurrency(statistics.average_amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Data Table */}
        <div className="lg:col-span-3">
          {/* Filter Bar */}
          <div className="bg-white rounded-lg shadow border p-4 mb-6">
            <div className="flex flex-wrap gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">From</label>
                <input
                  type="date"
                  name="start_date"
                  value={filters.start_date}
                  onChange={handleFilterChange}
                  className="border p-1 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">To</label>
                <input
                  type="date"
                  name="end_date"
                  value={filters.end_date}
                  onChange={handleFilterChange}
                  className="border p-1 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Category
                </label>
                <select
                  name="expense_category"
                  value={filters.expense_category}
                  onChange={handleFilterChange}
                  className="border p-1 rounded text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat, index) => (
                    <option key={index} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Vendor</label>
                <input
                  type="text"
                  name="paid_to"
                  value={filters.paid_to}
                  onChange={handleFilterChange}
                  placeholder="Search vendor..."
                  className="border p-1 rounded text-sm"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={fetchExpenses}
                  className="bg-blue-500 text-white px-4 py-1.5 rounded text-sm"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-lg shadow border">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Recent Expenses</h2>
              <span className="text-sm text-gray-500">
                {expenses.length} record(s)
              </span>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading expenses...</p>
              </div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No expenses found</p>
                <p className="text-sm">Record your first expense above</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-left">Voucher No</th>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Category</th>
                      <th className="p-3 text-left">Description</th>
                      <th className="p-3 text-left">Paid To</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3 text-left">Method</th>
                      <th className="p-3 text-left">Recorded By</th>
                      <th className="p-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr
                        key={expense.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-3 font-mono text-xs">
                          {expense.voucher_number}
                        </td>
                        <td className="p-3">
                          {new Date(expense.expense_date).toDateString()}
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {expense.expense_category}
                          </span>
                        </td>
                        <td className="p-3 max-w-xs truncate">
                          {expense.description}
                        </td>
                        <td className="p-3">{expense.paid_to}</td>
                        <td className="p-3 text-right font-medium text-green-600">
                          {formatCurrency(expense.amount)}
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {expense.payment_method}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-gray-500">
                          {expense.recorded_by_name}
                        </td>
                        <td className="p-3">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(expense)}
                              className="text-blue-500 hover:text-blue-700"
                              title="Edit expense"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(expense.id)}
                              className="text-red-500 hover:text-red-700"
                              title="Delete expense"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expense Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingId ? "Edit Expense" : "New Expense / PCV"}
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      <CalendarIcon className="w-4 h-4 inline mr-1" />
                      Date *
                    </label>
                    <input
                      type="date"
                      name="expense_date"
                      value={formData.expense_date}
                      onChange={handleInputChange}
                      className="w-full border p-2 rounded"
                      required
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      <CurrencyDollarIcon className="w-4 h-4 inline mr-1" />
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

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      <TagIcon className="w-4 h-4 inline mr-1" />
                      Category *
                    </label>
                    <select
                      name="expense_category"
                      value={formData.expense_category}
                      onChange={handleInputChange}
                      className="w-full border p-2 rounded"
                      required
                    >
                      <option value="">Select Category</option>
                      {commonCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Paid To */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      <UserIcon className="w-4 h-4 inline mr-1" />
                      Paid To *
                    </label>
                    <input
                      type="text"
                      name="paid_to"
                      value={formData.paid_to}
                      onChange={handleInputChange}
                      className="w-full border p-2 rounded"
                      placeholder="Vendor/Supplier name"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      <DocumentTextIcon className="w-4 h-4 inline mr-1" />
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full border p-2 rounded"
                      placeholder="Detailed description of the expense"
                      rows="2"
                      required
                    />
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Payment Method
                    </label>
                    <select
                      name="payment_method"
                      value={formData.payment_method}
                      onChange={handleInputChange}
                      className="w-full border p-2 rounded"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Check">Check</option>
                      <option value="Mobile Money">Mobile Money</option>
                    </select>
                  </div>

                  {/* Voucher Number */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Voucher Number
                    </label>
                    <input
                      type="text"
                      name="voucher_number"
                      value={formData.voucher_number}
                      onChange={handleInputChange}
                      className="w-full border p-2 rounded"
                      placeholder="Auto-generated if empty"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                        Saving...
                      </>
                    ) : editingId ? (
                      "Update Expense"
                    ) : (
                      "Record Expense"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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

export default ExpensesManagement;
