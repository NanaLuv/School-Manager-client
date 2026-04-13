import React, { useState, useEffect } from "react";
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  UserIcon,
  BanknotesIcon,
  XMarkIcon,
  CreditCardIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import api from "../../components/axiosconfig/axiosConfig";

const ReceiptsManagement = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [allocationDetails, setAllocationDetails] = useState({});
  const [loadingAllocations, setLoadingAllocations] = useState(false);

  const [filters, setFilters] = useState({
    receipt_number: "",
    student_name: "",
    admission_number: "",
    start_date: "",
    end_date: "",
    payment_method: "",
    academic_year_id: "",
    term_id: "",
  });

  const [pagination, setPagination] = useState({});

  const fetchReceipts = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...filters, page });
      const response = await api.get(
        `/getallreceipts?${params}`
      );
      setReceipts(response.data.receipts);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      alert("Error loading receipts");
    }
    setLoading(false);
  };

  const fetchAllocationDetails = async (paymentId) => {
    if (!paymentId) return;

    setLoadingAllocations(true);
    try {
      const response = await api.get(
        `/getpaymentallocations/${paymentId}`
      );
      setAllocationDetails((prev) => ({
        ...prev,
        [paymentId]: response.data,
      }));
    } catch (error) {
      console.error("Error fetching allocation details:", error);
    }
    setLoadingAllocations(false);
  };

  const viewReceiptDetails = async (receipt) => {
    setSelectedReceipt(receipt);
    setShowPreview(true);

    // Fetch allocation details if not already loaded
    if (!allocationDetails[receipt.payment_id]) {
      await fetchAllocationDetails(receipt.payment_id);
    }
  };

  const downloadReceipt = async (receiptNumber) => {
    try {
      const response = await api.get(
        `/receipts/${receiptNumber}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `receipt-${receiptNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading receipt:", error);
      alert("Error downloading receipt");
    }
  };

  const closePreview = () => {
    setShowPreview(false);
    setSelectedReceipt(null);
  };

  const formatCurrency = (amount) => {
    return `Ghc ${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      Cash: "💵",
      "Bank Transfer": "🏦",
      "Mobile Money": "📱",
      Check: "📋",
      Card: "💳",
    };
    return icons[method] || "💰";
  };

  useEffect(() => {
    fetchReceipts();
  }, [filters]);

  // Receipt Preview Modal Component
  const ReceiptPreviewModal = () => {
    if (!selectedReceipt) return null;

    const currentAllocations =
      allocationDetails[selectedReceipt.payment_id] || [];
    const totalAllocated = currentAllocations.reduce(
      (sum, alloc) => sum + parseFloat(alloc.amount_allocated || 0),
      0
    );

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <DocumentTextIcon className="w-8 h-8 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Receipt Details
                </h2>
                <p className="text-gray-600">
                  {selectedReceipt.receipt_number}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => downloadReceipt(selectedReceipt.receipt_number)}
                className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                <DocumentArrowDownIcon className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
              <button
                onClick={closePreview}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Receipt Content */}
          <div className="p-6">
            {/* Student Information */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <UserIcon className="w-5 h-5 mr-2 text-blue-600" />
                Student Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Student Name:</span>
                    <span className="font-semibold">
                      {selectedReceipt.first_name} {selectedReceipt.last_name}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Admission Number:</span>
                    <span className="font-semibold">
                      {selectedReceipt.admission_number}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Class:</span>
                    <span className="font-semibold">
                      {selectedReceipt.class_name}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Parent Name:</span>
                    <span className="font-semibold">
                      {selectedReceipt.parent_name || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Parent Contact:</span>
                    <span className="font-semibold">
                      {selectedReceipt.parent_contact || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Academic Period:</span>
                    <span className="font-semibold">
                      {selectedReceipt.academic_year} -{" "}
                      {selectedReceipt.term_name}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <BanknotesIcon className="w-5 h-5 mr-2 text-green-600" />
                Payment Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Payment Date:</span>
                    <span className="font-semibold">
                      {formatDate(selectedReceipt.payment_date)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-semibold flex items-center">
                      {getPaymentMethodIcon(selectedReceipt.payment_method)}
                      <span className="ml-2">
                        {selectedReceipt.payment_method}
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Reference Number:</span>
                    <span className="font-semibold">
                      {selectedReceipt.reference_number || "N/A"}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-semibold text-green-600 text-lg">
                      {formatCurrency(selectedReceipt.amount_paid)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Issued By:</span>
                    <span className="font-semibold">
                      {selectedReceipt.issued_by_name}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Issue Date:</span>
                    <span className="font-semibold">
                      {formatDate(selectedReceipt.issued_date)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Allocation Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <AcademicCapIcon className="w-5 h-5 mr-2 text-purple-600" />
                Fee Allocation Breakdown
                {loadingAllocations && (
                  <span className="ml-2 text-sm text-gray-500">
                    (Loading...)
                  </span>
                )}
              </h3>

              {currentAllocations.length > 0 ? (
                <div className="space-y-3">
                  {/* {currentAllocations.map((allocation, index) => (
                    <div
                      key={allocation.id}
                      className="flex justify-between items-center p-3 bg-white rounded-lg border"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {allocation.category_name || allocation.bill_description}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {allocation.bill_description && 
                           allocation.bill_description !== allocation.category_name && 
                           allocation.bill_description}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Due: {formatDate(allocation.due_date)}
                          {allocation.is_compulsory && (
                            <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                              Compulsory
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-blue-600">
                          {formatCurrency(allocation.amount_allocated)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Bill: {formatCurrency(allocation.bill_amount)}
                        </div>
                      </div>
                    </div>
                  ))} */}

                  {currentAllocations.map((allocation, index) => {
                    // Use custom description if available, otherwise fall back to existing logic
                    const allocationDescription =
                      allocation.description || // Custom description from payment
                      allocation.bill_description ||
                      allocation.category_name ||
                      `Bill #${allocation.bill_id}`;

                    return (
                      <div
                        key={allocation.id}
                        className="flex justify-between items-center p-3 bg-white rounded-lg border"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {allocation.category_name}
                            {/* Show indicator if custom description was used */}
                            {allocation.description && (
                              <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                Custom Note
                              </span>
                            )}
                          </div>

                          <div className="text-sm text-gray-600 mt-1">
                            {allocationDescription}
                          </div>

                          <div className="text-xs text-gray-500 mt-1">
                            Due: {formatDate(allocation.due_date)}
                            {allocation.is_compulsory && (
                              <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                Compulsory
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-blue-600">
                            {formatCurrency(allocation.amount_allocated)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Bill: {formatCurrency(allocation.bill_amount)}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Allocation Summary */}
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200 mt-4">
                    <div className="font-semibold text-blue-900">
                      Total Allocated:
                    </div>
                    <div className="font-bold text-blue-900 text-lg">
                      {formatCurrency(totalAllocated)}
                    </div>
                  </div>

                  {/* Allocation vs Payment Comparison */}
                  {Math.abs(
                    totalAllocated - parseFloat(selectedReceipt.amount_paid)
                  ) > 0.01 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex justify-between text-sm text-yellow-800">
                        <span>Unallocated Amount:</span>
                        <span className="font-semibold">
                          {formatCurrency(
                            parseFloat(selectedReceipt.amount_paid) -
                              totalAllocated
                          )}
                        </span>
                      </div>
                      <div className="text-xs text-yellow-600 mt-1">
                        This amount was not allocated to any specific bill
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <CreditCardIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No allocation details available</p>
                  <p className="text-sm">
                    Payment was not allocated to specific bills
                  </p>
                </div>
              )}
            </div>

            {/* Notes */}
            {selectedReceipt.notes && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">Additional Notes</h3>
                <p className="text-gray-700 italic">
                  "{selectedReceipt.notes}"
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t p-4 bg-gray-50 rounded-b-lg">
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>
                Generated on {new Date().toLocaleDateString()} at{" "}
                {new Date().toLocaleTimeString()}
              </span>
              <span>School Manager System</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Receipts Management
          </h1>
          <p className="text-gray-600">
            View, search, and re-issue payment receipts
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Receipt Number
            </label>
            <input
              type="text"
              value={filters.receipt_number}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  receipt_number: e.target.value,
                }))
              }
              placeholder="RCP-2024-001"
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Student Name
            </label>
            <input
              type="text"
              value={filters.student_name}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  student_name: e.target.value,
                }))
              }
              placeholder="Search by student name"
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Admission Number
            </label>
            <input
              type="text"
              value={filters.admission_number}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  admission_number: e.target.value,
                }))
              }
              placeholder="ADM-001"
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date Range</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    start_date: e.target.value,
                  }))
                }
                className="flex-1 border p-2 rounded"
              />
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, end_date: e.target.value }))
                }
                className="flex-1 border p-2 rounded"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Payment Method
            </label>
            <select
              value={filters.payment_method}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  payment_method: e.target.value,
                }))
              }
              className="w-full border p-2 rounded"
            >
              <option value="">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Mobile Money">Mobile Money</option>
              <option value="Check">Check</option>
              <option value="Card">Card</option>
            </select>
          </div>
          <div>
            <button
              onClick={() => fetchReceipts(1)}
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 mt-6"
            >
              Search Receipts
            </button>
          </div>
          <div>
            <button
              onClick={() =>
                setFilters({
                  receipt_number: "",
                  student_name: "",
                  admission_number: "",
                  start_date: "",
                  end_date: "",
                  payment_method: "",
                  academic_year_id: "",
                  term_id: "",
                })
              }
              className="w-full bg-gray-500 text-white p-2 rounded hover:bg-gray-600 mt-6"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Receipts List */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">
            All Receipts ({pagination.total || 0})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">Loading receipts...</div>
        ) : receipts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>No receipts found</p>
            <p className="text-sm mt-2">Try adjusting your search filters</p>
          </div>
        ) : (
          <div className="divide-y">
            {receipts.map((receipt) => (
              <div key={receipt.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="font-mono text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {receipt.receipt_number}
                      </div>
                      <div className="font-semibold">
                        {receipt.first_name} {receipt.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {receipt.admission_number}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        <span>Class: {receipt.class_name}</span>
                        <span>Academic Year: {receipt.academic_year}</span>
                        <span>Term: {receipt.term_name}</span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="flex items-center">
                          <BanknotesIcon className="w-4 h-4 mr-1" />
                          {formatCurrency(receipt.amount_paid)} •{" "}
                          {receipt.payment_method}
                        </span>
                        <span className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {formatDate(receipt.payment_date)}
                        </span>
                        <span>Issued by: {receipt.issued_by_name}</span>
                        <span>
                          Allocations: {receipt.allocation_count || 0} bills
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => viewReceiptDetails(receipt)}
                      className="flex items-center space-x-1 bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 transition-colors"
                    >
                      <EyeIcon className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                    <button
                      onClick={() => downloadReceipt(receipt.receipt_number)}
                      className="flex items-center space-x-1 bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 transition-colors"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex space-x-2">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
              (page) => (
                <button
                  key={page}
                  onClick={() => fetchReceipts(page)}
                  className={`px-3 py-1 rounded ${
                    pagination.page === page
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {page}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Receipt Preview Modal */}
      {showPreview && <ReceiptPreviewModal />}
    </div>
  );
};

export default ReceiptsManagement;
