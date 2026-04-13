import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  CalculatorIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PencilIcon,
  DocumentArrowDownIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
  ClockIcon,
  CheckBadgeIcon,
  PlusIcon,
  InformationCircleIcon,
  UserGroupIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Modal from "../../components/common/Modal";
import CreateEntryForm from "./CreateEntryForm";
import EditEntryForm from "./EditEntryForm";

import { format, parseISO } from "date-fns";
import api from "../../components/axiosconfig/axiosConfig";

const PayrollEntries = () => {
  const [entries, setEntries] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [loading, setLoading] = useState(true);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [summary, setSummary] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState([]);
  const [isBulkApproveModalOpen, setIsBulkApproveModalOpen] = useState(false);
  const [isSelectAll, setIsSelectAll] = useState(false);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  useEffect(() => {
    fetchPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      fetchEntries();
    }
  }, [selectedPeriod]);

  const fetchPeriods = async () => {
    try {
      const response = await api.get("/payroll/getpayrollperiods");
      setPeriods(response.data || []);
      if (response.data.length > 0) {
        setSelectedPeriod(response.data[0].id);
      }
    } catch (error) {
      console.error("Error fetching periods:", error);
    }
  };

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/payroll/entries/${selectedPeriod}`);
      setEntries(response.data?.entries || []);
      setSummary(response.data?.summary || {});
    } catch (error) {
      console.error("Error fetching entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (entryId) => {
    setSelectedEntryId(entryId);
    setEditModalOpen(true);
  };

  const handleViewPayslip = async (entryId) => {
    try {
      window.open(`/payroll/payslip/${entryId}`, "_blank");
    } catch (error) {
      console.error("Error viewing payslip:", error);
      alert("Failed to open payslip");
    }
  };

  const handleDownloadReport = async () => {
    try {
      window.open(`/payroll/report/${selectedPeriod}`, "_blank");
    } catch (error) {
      console.error("Error downloading report:", error);
      alert("Failed to download payroll report");
    }
  };

  const handleApproveEntry = async (entryId) => {
    if (!window.confirm("Are you sure you want to approve this payroll entry?"))
      return;

    try {
      await api.put(`/payroll/approve/${entryId}`, {
        approved_by: 1, // Get from auth context
        payment_date: new Date().toISOString().split("T")[0],
        payment_method: "Bank Transfer",
        payment_reference: `PAY-${Date.now()}`,
      });
      fetchEntries();
      alert("Payroll entry approved successfully");
    } catch (error) {
      console.error("Error approving entry:", error);
      alert("Failed to approve payroll entry");
    }
  };

  const handleProcessPeriod = async () => {
    if (
      !window.confirm(
        "Are you sure you want to process this entire payroll period? This will finalize all entries.",
      )
    )
      return;

    try {
      const response = await api.post(`/payroll/process/${selectedPeriod}`, {
        processed_by: 1, // Get from auth context
      });

      if (response.data.success) {
        alert(
          `Payroll period processed successfully for ${
            response.data.totals.staffCount || entries.length
          } staff`,
        );
        fetchEntries();
        fetchPeriods();
      }
    } catch (error) {
      console.error("Error processing period:", error);
      alert("Failed to process payroll period");
    }
  };

  const getStatusColor = (status) => {
    if (status) return "bg-green-100 text-green-800";
    return "bg-yellow-100 text-yellow-800";
  };

  const getStatusIcon = (isApproved) => {
    if (isApproved) {
      return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
    }
    return <ClockIcon className="w-5 h-5 text-yellow-600" />;
  };

  if (loading && !selectedPeriod)
    return <LoadingSpinner text="Loading payroll entries..." />;

  const currentPeriod = periods.find((p) => p.id === parseInt(selectedPeriod));

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm("Are you sure you want to delete this payroll entry?"))
      return;

    try {
      await api.delete(`/payroll/delete-entry/${entryId}`);
      fetchEntries();
      alert("Payroll entry deleted successfully");
    } catch (error) {
      console.error("Error deleting entry:", error);
      alert("Failed to delete payroll entry");
    }
  };
  const handleBulkApprove = async () => {
    if (selectedEntries.length === 0) {
      alert("Please select at least one entry to approve.");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to approve ${selectedEntries.length} payroll entries?`,
      )
    )
      return;

    try {
      const response = await api.post("/payroll/approve-bulk", {
        entry_ids: selectedEntries,
        approved_by: 1, // Get from auth context
        payment_date: new Date().toISOString().split("T")[0],
        payment_method: "Bank Transfer",
        payment_reference: `BULK-${Date.now()}`,
      });

      if (response.data.success) {
        alert(response.data.message);
        // Clear selection and refresh data
        setSelectedEntries([]);
        setIsSelectAll(false);
        fetchEntries();
      }
    } catch (error) {
      console.error("Error bulk approving entries:", error);
      alert("Failed to bulk approve entries");
    }
  };

  // Add these helper functions for selection
  const handleSelectAll = () => {
    if (isSelectAll) {
      setSelectedEntries([]);
    } else {
      const allEntryIds = entries
        .filter((entry) => !entry.is_approved) // Only select unapproved entries
        .map((entry) => entry.id);
      setSelectedEntries(allEntryIds);
    }
    setIsSelectAll(!isSelectAll);
  };

  const handleSelectEntry = (entryId, isApproved) => {
    // Don't allow selection of already approved entries
    if (isApproved) return;

    if (selectedEntries.includes(entryId)) {
      setSelectedEntries(selectedEntries.filter((id) => id !== entryId));
    } else {
      setSelectedEntries([...selectedEntries, entryId]);
    }
  };

  const handleBulkApproveClick = () => {
    // Filter out already approved entries from selection
    const pendingEntries = selectedEntries.filter((entryId) => {
      const entry = entries.find((e) => e.id === entryId);
      return entry && !entry.is_approved;
    });

    if (pendingEntries.length === 0) {
      alert("No pending entries selected. Please select unapproved entries.");
      return;
    }

    setIsBulkApproveModalOpen(true);
  };

  return (
    <div className="p-6">
      {/* Header with Period Selector */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6">
            <div className="flex items-start">
              <InformationCircleIcon className="w-5 h-5 text-gray-400 mt-0.5 mr-2" />
              <div>
                <p className="text-sm text-gray-600">
                  Create payroll entries for staff in the selected period. Click
                  "Add Entry" to get started.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Add Entry
            </button>
            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              Download Report
            </button>
            <button
              onClick={() => setIsProcessModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <CheckBadgeIcon className="w-5 h-5" />
              Process Period
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Payroll Period
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {monthNames[period.period_month - 1]} {period.period_year}
                  {period.is_processed ? " ✓ (Processed)" : " ⏳ (Pending)"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Period Summary */}
        {currentPeriod && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between">
              <div className="flex items-center space-x-6">
                <div>
                  <span className="text-sm text-gray-600">Period:</span>
                  <p className="text-lg font-semibold text-gray-900">
                    {monthNames[currentPeriod.period_month - 1]}{" "}
                    {currentPeriod.period_year}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Status:</span>
                  <p
                    className={`font-medium ${
                      currentPeriod.is_processed
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {currentPeriod.is_processed
                      ? "✓ Processed"
                      : "⏳ Pending Processing"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Date Range:</span>
                  <p className="font-medium text-gray-900">
                    {new Date(currentPeriod.start_date).toLocaleDateString(
                      "en-US",
                      { month: "long", day: "numeric", year: "numeric" },
                    )}{" "}
                    to{" "}
                    {new Date(currentPeriod.end_date).toLocaleDateString(
                      "en-US",
                      { month: "long", day: "numeric", year: "numeric" },
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {!currentPeriod.is_processed && (
                  <button
                    onClick={handleProcessPeriod}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Process Now
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add bulk action buttons to your header section */}
        <div className="flex items-center space-x-3 mb-4">
          <button
            onClick={handleBulkApproveClick}
            disabled={selectedEntries.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              selectedEntries.length > 0
                ? "bg-purple-600 text-white hover:bg-purple-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <CheckCircleIcon className="w-5 h-5" />
            Bulk Approve ({selectedEntries.length})
          </button>

          {selectedEntries.length > 0 && (
            <button
              onClick={() => {
                setSelectedEntries([]);
                setIsSelectAll(false);
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
            >
              Clear Selection
            </button>
          )}
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Staff</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary.staff_count || 0}
                  </p>
                </div>
                <UserCircleIcon className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Gross</p>
                  <p className="text-2xl font-bold text-gray-900">
                    Ghc{" "}
                    {(summary.total_gross || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <CurrencyDollarIcon className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Deductions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    Ghc {(summary.total_deductions || 0).toFixed(2)}
                  </p>
                </div>
                <BanknotesIcon className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Net Payable</p>
                  <p className="text-2xl font-bold text-gray-900">
                    Ghc {(summary.total_net || 0).toFixed(2)}
                  </p>
                </div>
                <CheckCircleIcon className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Entries Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isSelectAll}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2">Select</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Basic Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gross Pay
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Pay
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                      <p className="text-gray-500">Loading entries...</p>
                    </div>
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8">
                    <div className="text-center">
                      <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">
                        No payroll entries found for this period
                      </p>
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <PlusIcon className="w-4 h-4" />
                        Create First Entry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedEntries.includes(entry.id)}
                        onChange={() =>
                          handleSelectEntry(entry.id, entry.is_approved)
                        }
                        disabled={entry.is_approved}
                        className={`h-4 w-4 rounded ${
                          entry.is_approved
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-blue-600 focus:ring-blue-500"
                        }`}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {entry.staff_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {entry.staff_number}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {entry.category_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        Ghc {parseFloat(entry.basic_salary || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        Ghc {parseFloat(entry.total_gross || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-green-700">
                        Ghc {parseFloat(entry.net_salary || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          entry.is_approved,
                        )}`}
                      >
                        {getStatusIcon(entry.is_approved)}
                        {entry.is_approved ? "Approved" : "Pending"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewPayslip(entry.id)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Payslip"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEditClick(entry.id)}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit Entry"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Entry"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                        {!entry.is_approved && (
                          <button
                            onClick={() => handleApproveEntry(entry.id)}
                            className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Approve Entry"
                          >
                            <CheckCircleIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {summary && entries.length > 0 && (
              <tfoot className="bg-gray-50">
                <tr>
                  <td
                    colSpan="2"
                    className="px-6 py-3 text-right font-medium text-gray-700"
                  >
                    Totals:
                  </td>
                  <td className="px-6 py-3 font-bold text-gray-900">
                    Ghc{" "}
                    {parseFloat(
                      summary.total_gross - summary.total_deductions || 0,
                    ).toFixed(2)}
                  </td>
                  <td className="px-6 py-3 font-bold text-gray-900">
                    Ghc {parseFloat(summary.total_gross || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-3 font-bold text-green-700">
                    Ghc {parseFloat(summary.total_net || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-3">
                    <div className="text-sm text-gray-500">
                      {entries.filter((e) => e.is_approved).length} of{" "}
                      {entries.length} approved
                    </div>
                  </td>
                  <td className="px-6 py-3"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Payroll Entry"
        size="large"
      >
        <CreateEntryForm
          periodId={selectedPeriod}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            fetchEntries();
          }}
        />
      </Modal>

      {/* Process Period Modal */}
      <Modal
        isOpen={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        title="Process Payroll Period"
        size="medium"
      >
        <ProcessPeriodForm
          period={currentPeriod}
          entriesCount={entries.length}
          totalNet={summary?.total_net || 0}
          onClose={() => setIsProcessModalOpen(false)}
          onProcess={handleProcessPeriod}
        />
      </Modal>

      {editModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <EditEntryForm
                entryId={selectedEntryId}
                onClose={() => setEditModalOpen(false)}
                onSuccess={() => {
                  setEditModalOpen(false);
                  // Refresh your entries list
                  fetchEntries();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* bulk modal component to your JSX */}
      <Modal
        isOpen={isBulkApproveModalOpen}
        onClose={() => setIsBulkApproveModalOpen(false)}
        title="Bulk Approve Payroll Entries"
        size="medium"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-800 mb-2">
              Confirm Bulk Approval
            </h3>
            <p className="text-sm text-blue-700">
              You are about to approve {selectedEntries.length} payroll entries.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Selected Entries:</h4>
            <ul className="space-y-1 max-h-40 overflow-y-auto">
              {entries
                .filter((entry) => selectedEntries.includes(entry.id))
                .map((entry) => (
                  <li
                    key={entry.id}
                    className="flex justify-between items-center text-sm"
                  >
                    <span>{entry.staff_name}</span>
                    <span className="font-medium">
                      Ghc {parseFloat(entry.net_salary || 0).toFixed(2)}
                    </span>
                  </li>
                ))}
            </ul>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">
              Total Net Amount:{" "}
              <span className="font-bold">
                Ghc{" "}
                {entries
                  .filter((entry) => selectedEntries.includes(entry.id))
                  .reduce(
                    (sum, entry) => sum + parseFloat(entry.net_salary || 0),
                    0,
                  )
                  .toFixed(2)}
              </span>
            </p>
          </div>

          <div className="flex justify-end space-x-3 border-t pt-6">
            <button
              type="button"
              onClick={() => setIsBulkApproveModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                handleBulkApprove();
                setIsBulkApproveModalOpen(false);
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Approve All Selected
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Process Period Form Component
const ProcessPeriodForm = ({
  period,
  entriesCount,
  totalNet,
  onClose,
  onProcess,
}) => {
  const [confirmText, setConfirmText] = useState("");

  const handleProcess = () => {
    if (confirmText !== "PROCESS") {
      alert('Please type "PROCESS" in the confirmation field');
      return;
    }
    onProcess();
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">
          ⚠️ Important Notice
        </h3>
        <p className="text-sm text-yellow-700">
          Processing this payroll period will finalize all entries. Once
          processed:
        </p>
        <ul className="list-disc pl-5 mt-2 text-sm text-yellow-700 space-y-1">
          <li>Entries can no longer be edited</li>
          <li>Payslips will be finalized</li>
          <li>The period will be marked as processed</li>
          <li>All approved entries will be ready for payment</li>
        </ul>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Period</p>
            <p className="font-medium">Month Year</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Entries</p>
            <p className="font-medium">{entriesCount} staff members</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Net Payable</p>
            <p className="font-bold text-green-700">
              Ghc {parseFloat(totalNet).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <p className="font-medium text-yellow-600">Pending Processing</p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type "PROCESS" to confirm
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
          placeholder="PROCESS"
        />
      </div>

      <div className="flex justify-end space-x-3 border-t pt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleProcess}
          disabled={confirmText !== "PROCESS"}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          Process Payroll Period
        </button>
      </div>
    </div>
  );
};

export default PayrollEntries;
