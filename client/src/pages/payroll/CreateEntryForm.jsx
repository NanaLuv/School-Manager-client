import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  CalculatorIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  InformationCircleIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import api from "../../components/axiosconfig/axiosConfig";

const CreateEntryForm = ({ periodId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    staff_id: "",
    period_id: periodId,
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
    created_by: 1,
  });

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calculated, setCalculated] = useState(null);
  const [errors, setErrors] = useState({});
  const [previousEntry, setPreviousEntry] = useState(null);
  const [loadingPrevious, setLoadingPrevious] = useState(false);


  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await api.get(
        "/payroll/getstaff?is_active=true&limit=100"
      );
      setStaffList(response.data?.staff || []);
    } catch (error) {
      console.error("Error fetching staff:", error);
    }
  };

  const handleStaffChange = async (e) => {
    const staffId = e.target.value;
    setFormData((prev) => ({ ...prev, staff_id: staffId }));

    if (staffId) {
      await fetchPreviousEntry(staffId);
    }
  };

  const fetchPreviousEntry = async (staffId) => {
    setLoadingPrevious(true);
    try {
      const response = await api.get(
        `/payroll/previous-entry/${staffId}`
      );

      if (response.data.exists) {
        setPreviousEntry(response.data.entry);
        console.log("Previous entry data:", response.data.entry);

        // Auto-fill form with previous data (you can adjust this)
        const prev = response.data.entry;
        setFormData((prevForm) => ({
          ...prevForm,
          basic_salary: prev.basic_salary || 0,
          housing_allowance: prev.housing_allowance || 0,
          transport_allowance: prev.transport_allowance || 0,
          medical_allowance: prev.medical_allowance || 0,
          other_allowance: prev.other_allowance || 0,
          allowance_description: prev.allowance_description || "",
          welfare_deduction: prev.welfare_deduction || 0,
          loan_deduction: prev.loan_deduction || 0,
          other_deduction: prev.other_deduction || 0,
          deduction_description: prev.deduction_description || "",
        }));
      } else {
        setPreviousEntry(null);
      }
    } catch (error) {
      console.error("Error fetching previous entry:", error);
    } finally {
      setLoadingPrevious(false);
    }
  };

  const loadPreviousData = () => {
    if (previousEntry) {
      const prev = previousEntry;
      setFormData((prevForm) => ({
        ...prevForm,
        basic_salary: prev.basic_salary || 0,
        housing_allowance: prev.housing_allowance || 0,
        transport_allowance: prev.transport_allowance || 0,
        medical_allowance: prev.medical_allowance || 0,
        other_allowance: prev.other_allowance || 0,
        allowance_description: prev.allowance_description || "",
        welfare_deduction: prev.welfare_deduction || 0,
        loan_deduction: prev.loan_deduction || 0,
        other_deduction: prev.other_deduction || 0,
        deduction_description: prev.deduction_description || "",
      }));
    }
  };


const handleCalculate = async () => {
  setErrors({});

  // Validate required fields
  if (!formData.staff_id) {
    setErrors({ staff_id: "Please select a staff member" });
    return;
  }

  // Make sure basic_salary is a number
  const basicSalary = parseFloat(formData.basic_salary);
  if (!basicSalary || basicSalary <= 0) {
    setErrors({ basic_salary: "Basic salary must be greater than 0" });
    return;
  }

  setLoading(true);
  try {

    // Make sure all numbers are properly formatted
    const payload = {
      ...formData,
      basic_salary: parseFloat(formData.basic_salary) || 0,
      housing_allowance: parseFloat(formData.housing_allowance) || 0,
      transport_allowance: parseFloat(formData.transport_allowance) || 0,
      medical_allowance: parseFloat(formData.medical_allowance) || 0,
      other_allowance: parseFloat(formData.other_allowance) || 0,
      welfare_deduction: parseFloat(formData.welfare_deduction) || 0,
      loan_deduction: parseFloat(formData.loan_deduction) || 0,
      other_deduction: parseFloat(formData.other_deduction) || 0,
    };


    const response = await api.post(
      "/payroll/calculate",
      payload
    );

    console.log("Calculation response:", response.data);
    setCalculated(response.data.calculated);
  } catch (error) {
    console.error("Error calculating payroll:", error);
    console.error("Error response:", error.response?.data);

    setErrors({
      calculation:
        error.response?.data?.details ||
        "Failed to calculate payroll. Please check the values.",
    });
  } finally {
    setLoading(false);
  }
};


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!calculated) {
      alert("Please calculate payroll first");
      return;
    }

    try {
      const payload = {
        ...formData,
        income_tax: calculated.income_tax,
        ssnit_employee: calculated.ssnit_employee,
        ssnit_employer: calculated.ssnit_employer,
      };

      await api.post(
        "/payroll/save-entry",
        payload
      );
      alert("Payroll entry created successfully!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating entry:", error);
      alert("Failed to create payroll entry");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name.includes("salary") ||
        name.includes("allowance") ||
        name.includes("deduction")
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const getSelectedStaff = () => {
    return staffList.find((staff) => staff.id == formData.staff_id);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Updated Staff Selection */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <UserGroupIcon className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-medium text-gray-900">
              Select Staff Member
            </h3>
          </div>

          {previousEntry && (
            <button
              type="button"
              onClick={loadPreviousData}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
            >
              <DocumentDuplicateIcon className="w-4 h-4" />
              Load Previous Payroll
            </button>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Staff Member *
          </label>
          <select
            name="staff_id"
            value={formData.staff_id}
            onChange={handleStaffChange} // Changed to handleStaffChange
            className={`w-full border ${
              errors.staff_id ? "border-red-300" : "border-gray-300"
            } rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            required
          >
            <option value="">-- Select Staff --</option>
            {staffList.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.full_name} ({staff.staff_number}) - {staff.category_name}
              </option>
            ))}
          </select>
          {errors.staff_id && (
            <p className="mt-1 text-sm text-red-600">{errors.staff_id}</p>
          )}
        </div>

        {formData.staff_id && (
          <div className="mt-4">
            {loadingPrevious ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                Loading previous payroll...
              </div>
            ) : previousEntry ? (
              <div className="bg-white p-3 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <InformationCircleIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Previous Payroll Found
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-gray-500">Period</p>
                    <p className="font-medium">
                      {previousEntry.period_month}/{previousEntry.period_year}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Basic Salary</p>
                    <p className="font-medium">
                      Ghc {parseFloat(previousEntry.basic_salary).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Net Salary</p>
                    <p className="font-medium">
                      Ghc {parseFloat(previousEntry.net_salary).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-500">
                  No previous payroll found. Please enter all details manually.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Earnings Section */}
      <div className="border-t pt-6">
        <div className="flex items-center gap-2 mb-4">
          <CurrencyDollarIcon className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-medium text-gray-900">Earnings</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              label: "Basic Salary *",
              name: "basic_salary",
              required: true,
              min: 0,
            },
            { label: "Housing Allowance", name: "housing_allowance", min: 0 },
            {
              label: "Transport Allowance",
              name: "transport_allowance",
              min: 0,
            },
            { label: "Medical Allowance", name: "medical_allowance", min: 0 },
            { label: "Other Allowance", name: "other_allowance", min: 0 },
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
                  required={field.required}
                  min={field.min}
                  step="0.01"
                />
              </div>
              {errors[field.name] && (
                <p className="mt-1 text-sm text-red-600">
                  {errors[field.name]}
                </p>
              )}
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
            placeholder="Enter details about allowances (e.g., Housing allowance for accommodation)..."
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
            { label: "Welfare Deduction", name: "welfare_deduction", min: 0 },
            { label: "Loan Deduction", name: "loan_deduction", min: 0 },
            { label: "Other Deduction", name: "other_deduction", min: 0 },
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
                  min={field.min}
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
            placeholder="Enter details about deductions (e.g., Loan repayment, welfare contribution)..."
          />
        </div>
      </div>

      {/* Calculation Results */}
      {calculated && (
        <div className="border-t pt-6">
          <div className="flex items-center gap-2 mb-4">
            <InformationCircleIcon className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-medium text-gray-900">
              Calculation Results
            </h3>
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
                Ghc {parseFloat(calculated.total_gross).toFixed(2)}
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">Total Deductions</p>
              <p className="text-xl font-bold text-red-900">
                Ghc {parseFloat(calculated.total_deductions).toFixed(2)}
              </p>
              <div className="text-xs text-red-700 mt-1">
                (Tax: Ghc {parseFloat(calculated.income_tax).toFixed(2)}, SSNIT:
                Ghc {parseFloat(calculated.ssnit_employee).toFixed(2)})
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-800">Net Salary</p>
              <p className="text-xl font-bold text-purple-900">
                Ghc {parseFloat(calculated.net_salary).toFixed(2)}
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
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCalculate}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <CalculatorIcon className="w-5 h-5" />
            {loading ? "Calculating..." : "Calculate Payroll"}
          </button>

          {previousEntry && (
            <button
              type="button"
              onClick={() => {
                loadPreviousData();
                handleCalculate();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <DocumentDuplicateIcon className="w-4 h-4" />
              Load & Calculate
            </button>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            disabled={!calculated}
          >
            Save Payroll Entry
          </button>
        </div>
      </div>
    </form>
  );
};

export default CreateEntryForm;
