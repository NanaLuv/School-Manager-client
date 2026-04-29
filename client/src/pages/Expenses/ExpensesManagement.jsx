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
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BanknotesIcon,
  UserIcon,
  TagIcon,
  TrashIcon as TrashIconOutline,
} from "@heroicons/react/24/outline";
import api from "../../components/axiosconfig/axiosConfig";
import { useAuth } from "../contexts/AuthContext";

const ExpensesManagement = () => {
  const { user } = useAuth();

  // PV Form state
  const [pvFormData, setPvFormData] = useState({
    pv_date: new Date().toISOString().split("T")[0],
    description: "",
    paid_to: "",
    payment_method: "Cash",
    reference_number: "",
    items: [],
  });

  // Item form for adding/editing within PV
  const [itemForm, setItemForm] = useState({
    expense_category: "",
    quantity: 1,
    unit_price: "",
    description: "",
  });
  const [editingItemIndex, setEditingItemIndex] = useState(null);

  // UI state
  const [pvHeaders, setPvHeaders] = useState([]);
  const [selectedPV, setSelectedPV] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("list"); // list, form, detail
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
    status: "",
    paid_to: "",
  });
  const [statistics, setStatistics] = useState({});
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    format: "excel",
  });

  // Status badge colors
  const statusColors = {
    Draft: "bg-yellow-100 text-yellow-800",
    Approved: "bg-green-100 text-green-800",
    Paid: "bg-blue-100 text-blue-800",
    Rejected: "bg-red-100 text-red-800",
  };

  const StatusIcon = ({ status }) => {
    switch (status) {
      case "Draft":
        return <ClockIcon className="w-4 h-4 inline mr-1" />;
      case "Approved":
        return <CheckCircleIcon className="w-4 h-4 inline mr-1" />;
      case "Paid":
        return <BanknotesIcon className="w-4 h-4 inline mr-1" />;
      case "Rejected":
        return <XCircleIcon className="w-4 h-4 inline mr-1" />;
      default:
        return null;
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

  useEffect(() => {
    fetchPVHeaders();
    fetchStatistics();
  }, [filters]);

  const fetchPVHeaders = async () => {
    try {
      setLoading(true);
      const response = await api.get("/pv-headers", {
        params: { ...filters, limit: 50 },
      });
      setPvHeaders(response.data.pv_headers || []);
    } catch (error) {
      console.error("Error loading PVs:", error);
      alert("Error loading PVs");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get("/pv-headers/statistics", {
        params: { start_date: filters.start_date, end_date: filters.end_date },
      });
      setStatistics(response.data);
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  };

  const fetchPVDetails = async (id) => {
    try {
      setLoading(true);
      const response = await api.get(`/pv-headers/${id}`);
      setSelectedPV(response.data);
      setView("detail");
    } catch (error) {
      console.error("Error loading PV details:", error);
      alert("Error loading PV details");
    } finally {
      setLoading(false);
    }
  };

  // Item management functions
  const handleAddItem = () => {
    if (!itemForm.expense_category || !itemForm.unit_price) {
      alert("Please fill category and unit price");
      return;
    }

    const newItem = {
      expense_category: itemForm.expense_category,
      quantity: parseFloat(itemForm.quantity) || 1,
      unit_price: parseFloat(itemForm.unit_price),
      amount:
        (parseFloat(itemForm.quantity) || 1) * parseFloat(itemForm.unit_price),
      description: itemForm.description,
    };

    if (editingItemIndex !== null) {
      // Update existing item
      const updatedItems = [...pvFormData.items];
      updatedItems[editingItemIndex] = newItem;
      setPvFormData({ ...pvFormData, items: updatedItems });
      setEditingItemIndex(null);
    } else {
      // Add new item
      setPvFormData({
        ...pvFormData,
        items: [...pvFormData.items, newItem],
      });
    }

    // Reset item form
    setItemForm({
      expense_category: "",
      quantity: 1,
      unit_price: "",
      description: "",
    });
  };

  const handleEditItem = (index) => {
    const item = pvFormData.items[index];
    setItemForm({
      expense_category: item.expense_category,
      quantity: item.quantity,
      unit_price: item.unit_price,
      description: item.description || "",
    });
    setEditingItemIndex(index);
  };

  const handleRemoveItem = (index) => {
    const updatedItems = pvFormData.items.filter((_, i) => i !== index);
    setPvFormData({ ...pvFormData, items: updatedItems });
    if (editingItemIndex === index) {
      setEditingItemIndex(null);
      setItemForm({
        expense_category: "",
        quantity: 1,
        unit_price: "",
        description: "",
      });
    }
  };

  const handleSubmitPV = async (e) => {
    e.preventDefault();

    if (pvFormData.items.length === 0) {
      alert("Please add at least one expense item");
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...pvFormData,
        recorded_by: user.id || 1,
      };

      if (editingId) {
        await api.put(`/pv-headers/${editingId}`, submitData);
        alert("PV updated successfully!");
        setEditingId(null);
      } else {
        await api.post("/pv-headers", submitData);
        alert("PV created successfully!");
      }

      // Reset form
      setPvFormData({
        pv_date: new Date().toISOString().split("T")[0],
        description: "",
        paid_to: "",
        payment_method: "Cash",
        reference_number: "",
        items: [],
      });
      setView("list");
      fetchPVHeaders();
      fetchStatistics();
    } catch (error) {
      console.error("Error saving PV:", error);
      alert(error.response?.data?.error || "Error saving PV");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this PV? Once approved, it cannot be edited."))
      return;

    try {
      await api.put(`/pv-headers/${id}/approve`, {
        approved_by: user.id || 1,
      });
      alert("PV approved successfully!");
      fetchPVHeaders();
      if (selectedPV?.id === id) {
        fetchPVDetails(id);
      }
    } catch (error) {
      console.error("Error approving PV:", error);
      alert(error.response?.data?.error || "Error approving PV");
    }
  };

  const handleMarkPaid = async (id) => {
    if (!window.confirm("Mark this PV as paid?")) return;

    try {
      await api.put(`/pv-headers/${id}/mark-paid`);
      alert("PV marked as paid!");
      fetchPVHeaders();
      if (selectedPV?.id === id) {
        fetchPVDetails(id);
      }
    } catch (error) {
      console.error("Error marking PV as paid:", error);
      alert(error.response?.data?.error || "Error marking PV as paid");
    }
  };

  const handleEditPV = async (pv) => {
    if (pv.status !== "Draft") {
      alert("Only draft PVs can be edited");
      return;
    }

    setEditingId(pv.id);
    setPvFormData({
      pv_date: pv.pv_date.split("T")[0],
      description: pv.description || "",
      paid_to: pv.paid_to || "",
      payment_method: pv.payment_method || "Cash",
      reference_number: pv.reference_number || "",
      items: pv.items || [],
    });
    setView("form");
  };

  const handleDeletePV = async (id, status) => {
    if (status !== "Draft") {
      alert("Only draft PVs can be deleted");
      return;
    }

    if (!window.confirm("Delete this PV? This cannot be undone.")) return;

    try {
      await api.delete(`/pv-headers/${id}`);
      alert("PV deleted successfully!");
      fetchPVHeaders();
      if (selectedPV?.id === id) {
        setSelectedPV(null);
        setView("list");
      }
    } catch (error) {
      console.error("Error deleting PV:", error);
      alert(error.response?.data?.error || "Error deleting PV");
    }
  };

  const formatCurrency = (amount) => {
    return `Ghc ${parseFloat(amount || 0).toFixed(2)}`;
  };

  const getTotalAmount = () => {
    return pvFormData.items.reduce(
      (sum, item) => sum + (item.amount || item.quantity * item.unit_price),
      0,
    );
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        start_date: filters.start_date,
        end_date: filters.end_date,
        status: filters.status || "",
        format: exportOptions.format,
      });

      const response = await api.get(`/pv-headers/export?${params}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const ext = exportOptions.format === "excel" ? "xlsx" : "pdf";
      link.setAttribute(
        "download",
        `pvs-${new Date().toISOString().split("T")[0]}.${ext}`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setShowExportModal(false);
    } catch (error) {
      console.error("Error exporting:", error);
      alert("Error exporting data");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <BanknotesIcon className="w-6 h-6 mr-2 text-orange-500" />
          Payment Vouchers (PV)
        </h1>
        <p className="text-gray-600">
          Create, manage, and track payment vouchers
        </p>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow border p-4">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-full">
              <DocumentTextIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total PVs</p>
              <p className="text-lg font-semibold">
                {statistics.total_pvs || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border p-4">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-2 rounded-full">
              <ClockIcon className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Draft</p>
              <p className="text-lg font-semibold">
                {statistics.draft_count || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border p-4">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded-full">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-lg font-semibold">
                {statistics.approved_count || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border p-4">
          <div className="flex items-center">
            <div className="bg-purple-100 p-2 rounded-full">
              <BanknotesIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Paid</p>
              <p className="text-lg font-semibold">
                {statistics.paid_count || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border p-4">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded-full">
              <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-lg font-semibold">
                {formatCurrency(statistics.total_amount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {view === "list" && (
        <div className="bg-white rounded-lg shadow border">
          {/* Filter Bar */}
          <div className="p-4 border-b">
            <div className="flex flex-wrap gap-3 items-end">
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
                <label className="block text-xs font-medium mb-1">Status</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="border p-1 rounded text-sm"
                >
                  <option value="">All Status</option>
                  <option value="Draft">Draft</option>
                  <option value="Approved">Approved</option>
                  <option value="Paid">Paid</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Payee</label>
                <input
                  type="text"
                  name="paid_to"
                  value={filters.paid_to}
                  onChange={handleFilterChange}
                  placeholder="Search payee..."
                  className="border p-1 rounded text-sm"
                />
              </div>
              <div>
                <button
                  onClick={fetchPVHeaders}
                  className="bg-blue-500 text-white px-4 py-1.5 rounded text-sm"
                >
                  Apply Filters
                </button>
              </div>
              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => {
                    setEditingId(null);
                    setPvFormData({
                      pv_date: new Date().toISOString().split("T")[0],
                      description: "",
                      paid_to: "",
                      payment_method: "Cash",
                      reference_number: "",
                      items: [],
                    });
                    setView("form");
                  }}
                  className="bg-green-500 text-white px-4 py-1.5 rounded text-sm flex items-center"
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  New PV
                </button>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="bg-purple-500 text-white px-4 py-1.5 rounded text-sm flex items-center"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* PV Table */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading...</p>
            </div>
          ) : pvHeaders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No payment vouchers found</p>
              <button
                onClick={() => setView("form")}
                className="mt-2 text-blue-500 hover:text-blue-700"
              >
                Create your first PV
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left">PV No</th>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Payee</th>
                    <th className="p-3 text-left">Description</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Items</th>
                    <th className="p-3 text-left">Recorded By</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pvHeaders.map((pv) => (
                    <tr key={pv.id} className="border-b hover:bg-gray-50">
                      <td
                        className="p-3 font-mono text-xs cursor-pointer text-blue-600 hover:underline"
                        onClick={() => fetchPVDetails(pv.id)}
                      >
                        {pv.pv_number}
                      </td>
                      <td className="p-3">
                        {new Date(pv.pv_date).toLocaleDateString()}
                      </td>
                      <td className="p-3">{pv.paid_to || "-"}</td>
                      <td className="p-3 max-w-xs truncate">
                        {pv.description || "-"}
                      </td>
                      <td className="p-3 text-right font-medium text-green-600">
                        {formatCurrency(pv.total_amount)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            statusColors[pv.status]
                          }`}
                        >
                          <StatusIcon status={pv.status} />
                          {pv.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full text-xs">
                          {pv.item_count}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-500">
                        {pv.recorded_by_name}
                      </td>
                      <td className="p-3">
                        <div className="flex space-x-2">
                          {pv.status === "Draft" && (
                            <>
                              <button
                                onClick={() => handleEditPV(pv)}
                                className="text-blue-500 hover:text-blue-700"
                                title="Edit"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePV(pv.id, pv.status)}
                                className="text-red-500 hover:text-red-700"
                                title="Delete"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleApprove(pv.id)}
                                className="text-green-500 hover:text-green-700"
                                title="Approve"
                              >
                                <CheckCircleIcon className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {pv.status === "Approved" && (
                            <button
                              onClick={() => handleMarkPaid(pv.id)}
                              className="text-purple-500 hover:text-purple-700"
                              title="Mark as Paid"
                            >
                              <BanknotesIcon className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => fetchPVDetails(pv.id)}
                            className="text-gray-500 hover:text-gray-700"
                            title="View Details"
                          >
                            <DocumentTextIcon className="w-4 h-4" />
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
      )}

      {/* PV Form Modal */}
      {view === "form" && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingId ? "Edit Payment Voucher" : "New Payment Voucher"}
                </h3>
                <button
                  onClick={() => setView("list")}
                  className="text-gray-400 hover:text-gray-500"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitPV}>
                {/* PV Header Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      <CalendarIcon className="w-4 h-4 inline mr-1" />
                      PV Date *
                    </label>
                    <input
                      type="date"
                      value={pvFormData.pv_date}
                      onChange={(e) =>
                        setPvFormData({
                          ...pvFormData,
                          pv_date: e.target.value,
                        })
                      }
                      className="w-full border p-2 rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      <UserIcon className="w-4 h-4 inline mr-1" />
                      Payee (Paid To) *
                    </label>
                    <input
                      type="text"
                      value={pvFormData.paid_to}
                      onChange={(e) =>
                        setPvFormData({
                          ...pvFormData,
                          paid_to: e.target.value,
                        })
                      }
                      className="w-full border p-2 rounded"
                      placeholder="Vendor/Supplier name"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      <DocumentTextIcon className="w-4 h-4 inline mr-1" />
                      Description
                    </label>
                    <textarea
                      value={pvFormData.description}
                      onChange={(e) =>
                        setPvFormData({
                          ...pvFormData,
                          description: e.target.value,
                        })
                      }
                      className="w-full border p-2 rounded"
                      placeholder="Overall description of this payment"
                      rows="2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Payment Method
                    </label>
                    <select
                      value={pvFormData.payment_method}
                      onChange={(e) =>
                        setPvFormData({
                          ...pvFormData,
                          payment_method: e.target.value,
                        })
                      }
                      className="w-full border p-2 rounded"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Check">Check</option>
                      <option value="Mobile Money">Mobile Money</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Reference Number
                    </label>
                    <input
                      type="text"
                      value={pvFormData.reference_number}
                      onChange={(e) =>
                        setPvFormData({
                          ...pvFormData,
                          reference_number: e.target.value,
                        })
                      }
                      className="w-full border p-2 rounded"
                      placeholder="Check no, transfer ref, etc"
                    />
                  </div>
                </div>

                {/* Expense Items Section */}
                <div className="border-t pt-6 mb-6">
                  <h4 className="text-md font-semibold mb-3">Expense Items</h4>

                  {/* Add/Edit Item Form */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium mb-1">
                          Category *
                        </label>
                        <select
                          value={itemForm.expense_category}
                          onChange={(e) =>
                            setItemForm({
                              ...itemForm,
                              expense_category: e.target.value,
                            })
                          }
                          className="w-full border p-2 rounded text-sm"
                        >
                          <option value="">Select Category</option>
                          {commonCategories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          value={itemForm.quantity}
                          onChange={(e) =>
                            setItemForm({
                              ...itemForm,
                              quantity: e.target.value,
                            })
                          }
                          step="0.01"
                          className="w-full border p-2 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Unit Price (Ghc) *
                        </label>
                        <input
                          type="number"
                          value={itemForm.unit_price}
                          onChange={(e) =>
                            setItemForm({
                              ...itemForm,
                              unit_price: e.target.value,
                            })
                          }
                          step="0.01"
                          className="w-full border p-2 rounded text-sm"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={handleAddItem}
                          className="bg-blue-500 text-white px-4 py-2 rounded text-sm"
                        >
                          {editingItemIndex !== null ? "Update" : "Add Item"}
                        </button>
                        {editingItemIndex !== null && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItemIndex(null);
                              setItemForm({
                                expense_category: "",
                                quantity: 1,
                                unit_price: "",
                                description: "",
                              });
                            }}
                            className="ml-2 text-gray-500 px-3 py-2 rounded text-sm"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="block text-xs font-medium mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={itemForm.description}
                        onChange={(e) =>
                          setItemForm({
                            ...itemForm,
                            description: e.target.value,
                          })
                        }
                        className="w-full border p-2 rounded text-sm"
                        placeholder="Item description (optional)"
                      />
                    </div>
                  </div>

                  {/* Items Table */}
                  {pvFormData.items.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm border">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="p-2 text-left">Category</th>
                            <th className="p-2 text-right">Qty</th>
                            <th className="p-2 text-right">Unit Price</th>
                            <th className="p-2 text-right">Amount</th>
                            <th className="p-2 text-left">Description</th>
                            <th className="p-2 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pvFormData.items.map((item, index) => (
                            <tr key={index} className="border-b">
                              <td className="p-2">{item.expense_category}</td>
                              <td className="p-2 text-right">
                                {item.quantity}
                              </td>
                              <td className="p-2 text-right">
                                {formatCurrency(item.unit_price)}
                              </td>
                              <td className="p-2 text-right font-medium">
                                {formatCurrency(
                                  item.amount ||
                                    item.quantity * item.unit_price,
                                )}
                              </td>
                              <td className="p-2">{item.description || "-"}</td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleEditItem(index)}
                                  className="text-blue-500 hover:text-blue-700 mr-2"
                                >
                                  <PencilIcon className="w-4 h-4 inline" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <TrashIcon className="w-4 h-4 inline" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td
                              colSpan="3"
                              className="p-2 text-right font-bold"
                            >
                              TOTAL:
                            </td>
                            <td className="p-2 text-right font-bold text-green-600">
                              {formatCurrency(getTotalAmount())}
                            </td>
                            <td colSpan="2"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                      <PlusIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>No items added yet</p>
                      <p className="text-sm">Add expense items above</p>
                    </div>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || pvFormData.items.length === 0}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                        Saving...
                      </>
                    ) : editingId ? (
                      "Update PV"
                    ) : (
                      "Create PV"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* PV Detail View */}
      {view === "detail" && selectedPV && (
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold">{selectedPV.pv_number}</h2>
                <p className="text-gray-500 mt-1">
                  {new Date(selectedPV.pv_date).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setView("list")}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg"
                >
                  Back to List
                </button>
                {selectedPV.status === "Draft" && (
                  <>
                    <button
                      onClick={() => handleEditPV(selectedPV)}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg"
                    >
                      <PencilIcon className="w-4 h-4 inline mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleApprove(selectedPV.id)}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg"
                    >
                      <CheckCircleIcon className="w-4 h-4 inline mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        handleDeletePV(selectedPV.id, selectedPV.status)
                      }
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg"
                    >
                      <TrashIcon className="w-4 h-4 inline mr-1" />
                      Delete
                    </button>
                  </>
                )}
                {selectedPV.status === "Approved" && (
                  <button
                    onClick={() => handleMarkPaid(selectedPV.id)}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg"
                  >
                    <BanknotesIcon className="w-4 h-4 inline mr-1" />
                    Mark as Paid
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* PV Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      statusColors[selectedPV.status]
                    }`}
                  >
                    <StatusIcon status={selectedPV.status} />
                    {selectedPV.status}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payee</p>
                <p className="font-medium">{selectedPV.paid_to || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Method</p>
                <p>{selectedPV.payment_method || "Cash"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Reference Number</p>
                <p className="font-mono text-sm">
                  {selectedPV.reference_number || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Recorded By</p>
                <p>{selectedPV.recorded_by_name}</p>
              </div>
              {selectedPV.approved_by_name && (
                <div>
                  <p className="text-sm text-gray-500">Approved By</p>
                  <p>{selectedPV.approved_by_name}</p>
                  <p className="text-xs text-gray-400">
                    {selectedPV.approved_at &&
                      new Date(selectedPV.approved_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            {selectedPV.description && (
              <div className="mb-6">
                <p className="text-sm text-gray-500">Description</p>
                <p className="mt-1">{selectedPV.description}</p>
              </div>
            )}

            {/* Items Table */}
            <h4 className="font-semibold mb-3">Expense Items</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left">Category</th>
                    <th className="p-3 text-right">Quantity</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-left">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPV.items?.map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-3">{item.expense_category}</td>
                      <td className="p-3 text-right">{item.quantity}</td>
                      <td className="p-3 text-right">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {formatCurrency(
                          item.amount || item.quantity * item.unit_price,
                        )}
                      </td>
                      <td className="p-3">{item.description || "-"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="3" className="p-3 text-right font-bold">
                      TOTAL:
                    </td>
                    <td className="p-3 text-right font-bold text-green-600">
                      {formatCurrency(selectedPV.total_amount)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
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
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">PDF</span>
                  </button>
                </div>
              </div>

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
