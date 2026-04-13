import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  CalculatorIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  InformationCircleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import api from "../../components/axiosconfig/axiosConfig";

const EditEntryForm = ({ entryId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    staff_id: "",
    period_id: "",
    basic_salary: 0,
    housing_allowance: 0,
    transport_allowance: 0,
    medical_allowance: 0,
    other_allowance: 0,
    allowance_description: "",
    welfare_deduction: 0,
    loan_deduction: 0,
    other_deduction: 0,
    deduction_description: "",
    income_tax: 0,
    ssnit_employee: 0,
    ssnit_employer: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calculated, setCalculated] = useState(null);
  const [errors, setErrors] = useState({});
  const [staffInfo, setStaffInfo] = useState(null);
  const [periodInfo, setPeriodInfo] = useState(null);

  useEffect(() => {
    fetchEntryData();
  }, [entryId]);

  const fetchEntryData = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/payroll/entry/${entryId}`
      );

      const entry = response.data;

      // Set form data
      setFormData({
        staff_id: entry.staff_id,
        period_id: entry.period_id,
        basic_salary: parseFloat(entry.basic_salary) || 0,
        housing_allowance: parseFloat(entry.housing_allowance) || 0,
        transport_allowance: parseFloat(entry.transport_allowance) || 0,
        medical_allowance: parseFloat(entry.medical_allowance) || 0,
        other_allowance: parseFloat(entry.other_allowance) || 0,
        allowance_description: entry.allowance_description || "",
        welfare_deduction: parseFloat(entry.welfare_deduction) || 0,
        loan_deduction: parseFloat(entry.loan_deduction) || 0,
        other_deduction: parseFloat(entry.other_deduction) || 0,
        deduction_description: entry.deduction_description || "",
        income_tax: parseFloat(entry.income_tax) || 0,
        ssnit_employee: parseFloat(entry.ssnit_employee) || 0,
        ssnit_employer: parseFloat(entry.ssnit_employer) || 0,
      });

      // Set staff and period info
      setStaffInfo({
        name: `${entry.first_name} ${entry.last_name}`,
        staff_number: entry.staff_number,
        category: entry.category_name,
      });

      setPeriodInfo({
        period: `${entry.period_month}/${entry.period_year}`,
        is_processed: entry.is_processed,
      });

      // Calculate current totals
      calculateTotals(entry);
    } catch (error) {
      console.error("Error fetching entry data:", error);
      setErrors({ fetch: "Failed to load payroll entry data" });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (entry) => {
    const total_gross =
      (parseFloat(entry.basic_salary) || 0) +
      (parseFloat(entry.housing_allowance) || 0) +
      (parseFloat(entry.transport_allowance) || 0) +
      (parseFloat(entry.medical_allowance) || 0) +
      (parseFloat(entry.other_allowance) || 0);

    const total_deductions =
      (parseFloat(entry.income_tax) || 0) +
      (parseFloat(entry.ssnit_employee) || 0) +
      (parseFloat(entry.welfare_deduction) || 0) +
      (parseFloat(entry.loan_deduction) || 0) +
      (parseFloat(entry.other_deduction) || 0);

    const net_salary = total_gross - total_deductions;

    setCalculated({
      total_gross: parseFloat(total_gross.toFixed(2)),
      total_deductions: parseFloat(total_deductions.toFixed(2)),
      net_salary: parseFloat(net_salary.toFixed(2)),
    });
  };

  const handleRecalculate = async () => {
    setErrors({});

    // Validate required fields
    if (!formData.basic_salary || formData.basic_salary <= 0) {
      setErrors({ basic_salary: "Basic salary must be greater than 0" });
      return;
    }

    try {
      const response = await api.post(
        "/payroll/calculate",
        {
          staff_id: formData.staff_id,
          period_id: formData.period_id,
          basic_salary: formData.basic_salary,
          housing_allowance: formData.housing_allowance,
          transport_allowance: formData.transport_allowance,
          medical_allowance: formData.medical_allowance,
          other_allowance: formData.other_allowance,
          allowance_description: formData.allowance_description,
          welfare_deduction: formData.welfare_deduction,
          loan_deduction: formData.loan_deduction,
          other_deduction: formData.other_deduction,
          deduction_description: formData.deduction_description,
        }
      );

      const newCalculations = response.data.calculated;
      setCalculated(newCalculations);

      // Update tax and SSNIT in form data
      setFormData((prev) => ({
        ...prev,
        income_tax: newCalculations.income_tax,
        ssnit_employee: newCalculations.ssnit_employee,
        ssnit_employer: newCalculations.ssnit_employer,
      }));
    } catch (error) {
      console.error("Error recalculating payroll:", error);
      setErrors({
        calculation: "Failed to recalculate payroll. Please check the values.",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.put(
        `/payroll/update-entry/${entryId}`,
        formData
      );

      alert("Payroll entry updated successfully!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating entry:", error);
      alert("Failed to update payroll entry");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name.includes("salary") ||
        name.includes("allowance") ||
        name.includes("deduction") ||
        name.includes("tax") ||
        name.includes("ssnit")
          ? parseFloat(value) || 0
          : value,
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header with Staff Info */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <PencilIcon className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-medium text-gray-900">
              Edit Payroll Entry
            </h3>
          </div>

          {periodInfo?.is_processed && (
            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
              Period Processed - Read Only
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-3">
          <div>
            <p className="text-sm text-gray-500">Staff Member</p>
            <p className="font-medium">{staffInfo?.name}</p>
            <p className="text-xs text-gray-600">
              {staffInfo?.staff_number} - {staffInfo?.category}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Period</p>
            <p className="font-medium">{periodInfo?.period}</p>
          </div>
        </div>
      </div>

      {/* Earnings Section */}
      <div className="border-t pt-6">
        <div className="flex items-center gap-2 mb-4">
          <CurrencyDollarIcon className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-medium text-gray-900">Earnings</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Basic Salary *", name: "basic_salary" },
            { label: "Housing Allowance", name: "housing_allowance" },
            { label: "Transport Allowance", name: "transport_allowance" },
            { label: "Medical Allowance", name: "medical_allowance" },
            { label: "Other Allowance", name: "other_allowance" },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">
                  Ghc
                </span>
                <input
                  type="number"
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  className={`w-full pl-10 border ${
                    errors[field.name] ? "border-red-300" : "border-gray-300"
                  } rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  disabled={periodInfo?.is_processed}
                  step="0.01"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Allowance Description
          </label>
          <textarea
            name="allowance_description"
            value={formData.allowance_description}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="2"
            disabled={periodInfo?.is_processed}
          />
        </div>
      </div>

      {/* Deductions Section */}
      <div className="border-t pt-6">
        <div className="flex items-center gap-2 mb-4">
          <BanknotesIcon className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-medium text-gray-900">Deductions</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Welfare Deduction", name: "welfare_deduction" },
            { label: "Loan Deduction", name: "loan_deduction" },
            { label: "Other Deduction", name: "other_deduction" },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">
                  Ghc
                </span>
                <input
                  type="number"
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  className="w-full pl-10 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={periodInfo?.is_processed}
                  step="0.01"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deduction Description
          </label>
          <textarea
            name="deduction_description"
            value={formData.deduction_description}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="2"
            disabled={periodInfo?.is_processed}
          />
        </div>

        {/* Auto-calculated deductions (read-only) */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Income Tax (Auto)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">Ghc</span>
              <input
                type="number"
                value={formData.income_tax}
                readOnly
                className="w-full pl-10 border border-gray-300 bg-gray-100 rounded-lg px-3 py-2 text-gray-700"
              />
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SSNIT Employee (Auto)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">Ghc</span>
              <input
                type="number"
                value={formData.ssnit_employee}
                readOnly
                className="w-full pl-10 border border-gray-300 bg-gray-100 rounded-lg px-3 py-2 text-gray-700"
              />
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SSNIT Employer (Auto)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">Ghc</span>
              <input
                type="number"
                value={formData.ssnit_employer}
                readOnly
                className="w-full pl-10 border border-gray-300 bg-gray-100 rounded-lg px-3 py-2 text-gray-700"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Calculation Results */}
      {calculated && (
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <InformationCircleIcon className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-medium text-gray-900">
                Current Totals
              </h3>
            </div>

            {!periodInfo?.is_processed && (
              <button
                type="button"
                onClick={handleRecalculate}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
              >
                <CalculatorIcon className="w-4 h-4" />
                Recalculate
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">Basic Salary</p>
              <p className="text-xl font-bold text-blue-900">
                Ghc {parseFloat(formData.basic_salary).toFixed(2)}
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">Total Gross</p>
              <p className="text-xl font-bold text-green-900">
                Ghc {calculated.total_gross.toFixed(2)}
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">Total Deductions</p>
              <p className="text-xl font-bold text-red-900">
                Ghc {calculated.total_deductions.toFixed(2)}
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-800">Net Salary</p>
              <p className="text-xl font-bold text-purple-900">
                Ghc {calculated.net_salary.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {errors.calculation && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{errors.calculation}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center border-t pt-6">
        <div className="flex items-center gap-3">
          {periodInfo?.is_processed ? (
            <span className="text-sm text-gray-500 italic">
              This period has been processed. Entries are read-only.
            </span>
          ) : (
            <span className="text-sm text-gray-500">
              Make changes and click "Recalculate" to update totals
            </span>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <XMarkIcon className="w-4 h-4" />
            Cancel
          </button>

          {!periodInfo?.is_processed && (
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

export default EditEntryForm;
