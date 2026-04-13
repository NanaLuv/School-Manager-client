import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  CheckCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  PlusIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ViewEntriesModal from "./ViewEntriesModal";
import api from "../../components/axiosconfig/axiosConfig";

const PayrollPeriods = () => {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false); // Add this state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    setLoading(true);
    try {
      const response = await api.get("/payroll/getpayrollperiods");
      setPeriods(response.data || []);
    } catch (error) {
      console.error("Error fetching periods:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewEntries = (period) => {
    setSelectedPeriod(period);
    setIsViewModalOpen(true);
  };

  const handleProcessPeriod = async (periodId) => {
    try {
      await api.post(`/payroll/process/${periodId}`, {
        processed_by: 1,
      });
      fetchPeriods();
    } catch (error) {
      console.error("Error processing period:", error);
      alert("Failed to process payroll period");
    }
  };

  const handleDeletePeriod = async (periodId) => {
    if (
      window.confirm("Are you sure you want to delete this payroll period?")
    ) {
      try {
        await api.delete(`/payroll/periods/${periodId}`);
        fetchPeriods();
        alert("Payroll period deleted successfully");
      } catch (error) {
        console.error("Error deleting period:", error);
        alert("Failed to delete payroll period");
      }
    }
  };

  const generateReport = async (periodId) => {
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

  const handleCopyFromPrevious = async (periodId) => {
    if (window.confirm("Copy all payroll entries from previous period?")) {
      try {
        const response = await api.post(`/payroll/copy-previous/${periodId}`, {
          adjustments: {
            salary_increase_percent: 0, // Optional: 5% increase
          },
        });

        if (response.data.success) {
          alert(response.data.message);
          // Refresh the entries list
          fetchPeriods(periodId);
        }
      } catch (error) {
        console.error("Error copying from previous:", error);
        alert("Failed to copy from previous period");
      }
    }
  };

  if (loading) return <LoadingSpinner text="Loading payroll periods..." />;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Payroll Periods</h2>
        {/* <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Period
        </button> */}
      </div>

      {/* Periods Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Period
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Staff
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Gross
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Deductions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Net
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
            {periods.map((period) => (
              <tr key={period.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {getMonthName(period.period_month)} {period.period_year}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(period.start_date).toLocaleDateString()} -{" "}
                    {new Date(period.end_date).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {period.staff_count || 0}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    Ghc {period.period_gross || 0}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-red-500">
                    Ghc {period.period_deductions || 0}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-blue-600">
                    Ghc {period.period_net || 0}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      period.is_processed
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {period.is_processed ? (
                      <>
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        Processed
                      </>
                    ) : (
                      <>
                        <ClockIcon className="w-4 h-4 mr-1" />
                        Pending
                      </>
                    )}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewEntries(period)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View Entries"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => generateReport(period.id)}
                      className="text-green-600 hover:text-green-900"
                      title="Generate Report"
                    >
                      <ArrowDownTrayIcon className="w-5 h-5" />
                    </button>

                    {!period.is_processed && (
                      <button
                        onClick={() => handleProcessPeriod(period.id)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Process Payroll"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleCopyFromPrevious(period.id)}
                      className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      title="Copy from Previous Period"
                    >
                      <DocumentDuplicateIcon className="w-4 h-4" />
                    </button>

                    {!period.is_processed && (
                      <button
                        onClick={() => handleDeletePeriod(period.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Period"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {periods.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 text-gray-300 mb-4">
            <CalendarIcon className="w-full h-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No payroll periods found
          </h3>
          <p className="text-gray-600">
            Create your first payroll period to get started
          </p>
        </div>
      )}

      {/* View Entries Modal */}
      {selectedPeriod && (
        <ViewEntriesModal
          periodId={selectedPeriod.id}
          periodName={`${getMonthName(selectedPeriod.period_month)} ${
            selectedPeriod.period_year
          }`}
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedPeriod(null);
          }}
        />
      )}

      {/* Create Period Modal (optional) */}
      {/* {isCreateModalOpen && (
        <CreatePeriodModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            fetchPeriods();
          }}
        />
      )} */}
    </div>
  );
};

const getMonthName = (monthNumber) => {
  const months = [
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
  return months[monthNumber - 1] || `Month ${monthNumber}`;
};

export default PayrollPeriods;
