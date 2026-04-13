import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  CurrencyDollarIcon,
  UserGroupIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import PayrollSummary from "./PayrollSummary";
import PayrollPeriods from "./PayrollPeriods";
import StaffList from "./StaffList";
import PayrollEntries from "./PayrollEntries";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Modal from "../../components/common/Modal";
import api from "../../components/axiosconfig/axiosConfig";

const PayrollDashboard = () => {
  const [activeTab, setActiveTab] = useState("summary");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalStaff: 0,
    totalProcessed: 0,
    totalAmount: 0,
    pendingApprovals: 0,
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchPayrollStats();
  }, []);

  const fetchPayrollStats = async () => {
    setLoading(true);
    try {
      const [staffRes, periodsRes] = await Promise.all([
        api.get("/payroll/getstaff?page=1&limit=1"),
        api.get("/payroll/getpayrollperiods"),
      ]);

      const staffCount = staffRes.data.pagination?.total || 0;
      const periods = periodsRes.data || [];


      const processedPeriods = periods.filter((p) => p.is_processed).length;
      const pendingPeriods = periods.filter((p) => !p.is_processed).length;
      const totalAmount = periods.reduce(
        (sum, p) => sum + parseFloat(p.period_net || 0),
        0,
      );

      setStats({
        totalStaff: staffCount,
        totalProcessed: processedPeriods,
        pendingApprovals: pendingPeriods,
        totalAmount: totalAmount,
      });
    } catch (error) {
      console.error("Error fetching payroll stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setIsCreateModalOpen(true);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "summary":
        return <PayrollSummary />;
      case "staff":
        return <StaffList />;
      case "periods":
        return <PayrollPeriods />;
      case "entries":
        return <PayrollEntries />;
      default:
        return <PayrollSummary />;
    }
  };

  if (loading) return <LoadingSpinner text="Loading payroll dashboard..." />;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Payroll Management
          </h1>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>New Payroll Period</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalStaff}
                </p>
              </div>
              <UserGroupIcon className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-2 text-sm text-gray-500">Active employees</div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Processed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalProcessed}
                </p>
              </div>
              <DocumentTextIcon className="w-8 h-8 text-green-500" />
            </div>
            <div className="mt-2 text-sm text-gray-500">Completed periods</div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  Ghc {parseFloat(stats.totalAmount).toFixed(2)}
                </p>
              </div>
              <CurrencyDollarIcon className="w-8 h-8 text-yellow-500" />
            </div>
            <div className="mt-2 text-sm text-gray-500">Net payroll paid</div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Approvals</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pendingApprovals}
                </p>
              </div>
              <ArrowTrendingUpIcon className="w-8 h-8 text-red-500" />
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Awaiting processing
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "summary", label: "Summary", icon: CurrencyDollarIcon },
              { id: "staff", label: "Staff", icon: UserGroupIcon },
              { id: "periods", label: "Payroll Periods", icon: CalendarIcon },
              { id: "entries", label: "Entries", icon: DocumentTextIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow border border-gray-200">
        {renderTabContent()}
      </div>

      {/* Create New Period Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Payroll Period"
        size="medium"
      >
        <CreatePeriodForm onClose={() => setIsCreateModalOpen(false)} />
      </Modal>
    </div>
  );
};

// Simple form for creating new period
const CreatePeriodForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    period_year: new Date().getFullYear(),
    period_month: new Date().getMonth() + 1,
    start_date: "",
    end_date: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/payroll/addpayrollperiods", formData);
      onClose();
      window.location.reload();
    } catch (error) {
      console.error("Error creating period:", error);
      alert("Failed to create payroll period");
    }
  };

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Year
          </label>
          <select
            value={formData.period_year}
            onChange={(e) =>
              setFormData({ ...formData, period_year: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {[2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Month
          </label>
          <select
            value={formData.period_month}
            onChange={(e) =>
              setFormData({ ...formData, period_month: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {months.map((month, index) => (
              <option key={index} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={formData.start_date}
            onChange={(e) =>
              setFormData({ ...formData, start_date: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={formData.end_date}
            onChange={(e) =>
              setFormData({ ...formData, end_date: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create Period
        </button>
      </div>
    </form>
  );
};

export default PayrollDashboard;
