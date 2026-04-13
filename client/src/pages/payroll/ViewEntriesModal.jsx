import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  XMarkIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  BanknotesIcon,
  CreditCardIcon,
  UserIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import api from "../../components/axiosconfig/axiosConfig";

const downloadPDF = async (url, filename) => {
  const response = await api.get(url, { responseType: "blob" });
  const blobUrl = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};

const ViewEntriesModal = ({ periodId, isOpen, onClose, periodName }) => {
  const [entries, setEntries] = useState([]);
  const [periodDetails, setPeriodDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    staff_count: 0,
    total_gross: 0,
    total_deductions: 0,
    total_net: 0,
    total_ssnit_employer: 0,
  });

  useEffect(() => {
    if (isOpen && periodId) {
      fetchPayrollEntries();
    }
  }, [isOpen, periodId]);

  const fetchPayrollEntries = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/payroll/entries/${periodId}`);
      setEntries(response.data.entries || []);
      setPeriodDetails(response.data.period || {});
      setSummary(
        response.data.summary || {
          staff_count: 0,
          total_gross: 0,
          total_deductions: 0,
          total_net: 0,
          total_ssnit_employer: 0,
        },
      );
    } catch (error) {
      console.error("Error fetching payroll entries:", error);
      alert("Failed to load payroll entries");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayslip = async (entryId, staffName) => {
    try {
      await downloadPDF(
        `/payroll/payslip/${entryId}`,
        `payslip_${staffName}_${entryId}.pdf`,
      );
    } catch (error) {
      console.error("Error:", error);
      alert(`Failed to generate payslip for ${staffName}`);
    }
  };

  const handleApproveEntry = async (entryId, staffName) => {
    if (window.confirm(`Approve payroll entry for ${staffName}?`)) {
      try {
        await api.put(`/payroll/approve/${entryId}`, {
          approved_by: 1, // Get actual user ID from your auth system
          payment_date: new Date().toISOString().split("T")[0],
          payment_method: "Bank Transfer",
          payment_reference: `PAY-${Date.now()}`,
        });
        fetchPayrollEntries(); // Refresh data
        alert(`Payroll entry for ${staffName} approved successfully`);
      } catch (error) {
        console.error("Error approving entry:", error);
        alert(`Failed to approve payroll entry`);
      }
    }
  };

  const handleExportFullReport = async (periodId) => {
    try {
      // Fetch the PDF with token via your axios instance
      const response = await api.get(`/payroll/report/${periodId}`, {
        responseType: "blob", // Important: tells axios to treat the response as binary data
      });

      // Create a temporary URL for the blob
      const blobUrl = window.URL.createObjectURL(response.data);

      // Create a hidden anchor and trigger download
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", `payroll_report_${periodId}.pdf`); // filename
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report");
    }
  };

  const formatCurrency = (amount) => {
    return `Ghc ${parseFloat(amount || 0).toFixed(2)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-7xl bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Payroll Entries - {periodName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {periodDetails?.start_date
                      ? `${new Date(
                          periodDetails.start_date,
                        ).toLocaleDateString()} to ${new Date(
                          periodDetails.end_date,
                        ).toLocaleDateString()}`
                      : "Loading period details..."}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-white p-3 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <UserIcon className="h-5 w-5 text-blue-500 mr-2" />
                  <div>
                    <p className="text-xs text-gray-500">Staff</p>
                    <p className="font-semibold">{summary.staff_count}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-5 w-5 text-green-500 mr-2" />
                  <div>
                    <p className="text-xs text-gray-500">Total Gross</p>
                    <p className="font-semibold">
                      {formatCurrency(summary.total_gross)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <CreditCardIcon className="h-5 w-5 text-yellow-500 mr-2" />
                  <div>
                    <p className="text-xs text-gray-500">Deductions</p>
                    <p className="font-semibold">
                      {formatCurrency(summary.total_deductions)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <BanknotesIcon className="h-5 w-5 text-purple-500 mr-2" />
                  <div>
                    <p className="text-xs text-gray-500">Net Pay</p>
                    <p className="font-semibold text-blue-600">
                      {formatCurrency(summary.total_net)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <BuildingOfficeIcon className="h-5 w-5 text-red-500 mr-2" />
                  <div>
                    <p className="text-xs text-gray-500">SSNIT (Employer)</p>
                    <p className="font-semibold">
                      {formatCurrency(summary.total_ssnit_employer)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="py-12">
                <LoadingSpinner text="Loading payroll entries..." />
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">
                  No entries found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  No payroll entries have been created for this period.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                      >
                        Staff Member
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Basic Salary
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Allowances
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Deductions
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Net Salary
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="relative py-3.5 pl-3 pr-4 sm:pr-0"
                      >
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-0">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="font-medium text-gray-900">
                                {entry.staff_name}
                              </div>
                              <div className="text-gray-500">
                                {entry.staff_number}
                              </div>
                              <div className="text-xs text-gray-400">
                                {entry.category_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <div className="font-medium text-gray-900">
                            {formatCurrency(entry.basic_salary)}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <div className="text-gray-900">
                            {formatCurrency(
                              parseFloat(entry.housing_allowance || 0) +
                                parseFloat(entry.transport_allowance || 0) +
                                parseFloat(entry.medical_allowance || 0) +
                                parseFloat(entry.other_allowance || 0),
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <div className="text-red-600 font-medium">
                            {formatCurrency(entry.total_deductions)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Tax: {formatCurrency(entry.income_tax)} • SSNIT:{" "}
                            {formatCurrency(entry.ssnit_employee)}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <div className="font-semibold text-blue-600">
                            {formatCurrency(entry.net_salary)}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              entry.is_approved
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {entry.is_approved ? (
                              <>
                                <CheckCircleIcon className="mr-1 h-3 w-3" />
                                Approved
                              </>
                            ) : (
                              <>
                                <ClockIcon className="mr-1 h-3 w-3" />
                                Pending
                              </>
                            )}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() =>
                                handleGeneratePayslip(
                                  entry.id,
                                  entry.staff_name,
                                )
                              }
                              className="text-blue-600 hover:text-blue-900"
                              title="Generate Payslip"
                            >
                              <ArrowDownTrayIcon className="h-5 w-5" />
                            </button>

                            {!entry.is_approved && (
                              <button
                                onClick={() =>
                                  handleApproveEntry(entry.id, entry.staff_name)
                                }
                                className="text-green-600 hover:text-green-900"
                                title="Approve Entry"
                              >
                                <CheckCircleIcon className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-lg">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Showing <span className="font-medium">{entries.length}</span>{" "}
                entries
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Close
                </button>
                {/* <button
                  onClick={() => handleExportFullReport(periodId)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Export Full Report
                </button> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewEntriesModal;
