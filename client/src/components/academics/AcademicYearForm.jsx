import React, { useState, useEffect } from "react";

const AcademicYearForm = ({ year, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    year_label: "",
    start_date: "",
    end_date: "",
    is_current: false,
  });

  const [errors, setErrors] = useState({});
  // Helper function to convert ISO date to yyyy-MM-dd format
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    // If it's already in yyyy-MM-dd format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    // If it's an ISO date, convert to yyyy-MM-dd
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (year) {
      // Format dates properly for the input fields
      const formattedStartDate = formatDateForInput(year.start_date);
      const formattedEndDate = formatDateForInput(year.end_date);

      setFormData({
        year_label: year.year_label || "",
        start_date:
          formattedStartDate || new Date().toISOString().split("T")[0],
        end_date: formattedEndDate || new Date().toISOString().split("T")[0],
        is_current: year.is_current || false,
      });
    }
  }, [year]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.year_label.trim()) {
      newErrors.year_label = "Year label is required (e.g., 2024-2025)";
    }
    if (!formData.start_date) {
      newErrors.start_date = "Start date is required";
    }
    if (!formData.end_date) {
      newErrors.end_date = "End date is required";
    }
    if (
      formData.start_date &&
      formData.end_date &&
      formData.start_date >= formData.end_date
    ) {
      newErrors.end_date = "End date must be after start date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Year Label *
        </label>
        <input
          type="text"
          name="year_label"
          value={formData.year_label}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
            errors.year_label ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="e.g., 2024-2025"
        />
        {errors.year_label && (
          <p className="text-red-500 text-sm mt-1">{errors.year_label}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date *
          </label>
          <input
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              errors.start_date ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.start_date && (
            <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date *
          </label>
          <input
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              errors.end_date ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.end_date && (
            <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>
          )}
        </div>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          name="is_current"
          checked={formData.is_current}
          onChange={handleChange}
          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-700">
          Set as current academic year
        </label>
      </div>

      <div className="bg-blue-50 p-3 rounded-md">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> Only one academic year can be set as current.
          Setting this as current will automatically unset any other current
          year.
        </p>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"
        >
          {year ? "Update Academic Year" : "Add Academic Year"}
        </button>
      </div>
    </form>
  );
};

export default AcademicYearForm;
