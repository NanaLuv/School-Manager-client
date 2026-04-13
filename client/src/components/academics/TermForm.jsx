import React, { useState, useEffect } from "react";

const TermForm = ({ term, academicYears, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    academic_year_id: "",
    term_name: "",
    start_date: "",
    end_date: "",
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
    if (term) {
      // Format dates properly for the input fields
      const formattedStartDate = formatDateForInput(term.start_date);
      const formattedEndDate = formatDateForInput(term.end_date);
      setFormData({
        academic_year_id: term.academic_year_id || "",
        term_name: term.term_name || "",
        start_date:
          formattedStartDate || new Date().toISOString().split("T")[0],
        end_date: formattedEndDate || new Date().toISOString().split("T")[0],
      });
    }
  }, [term]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

    if (!formData.academic_year_id) {
      newErrors.academic_year_id = "Please select an academic year";
    }
    if (!formData.term_name.trim()) {
      newErrors.term_name = "Term name is required";
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
          Academic Year *
        </label>
        <select
          name="academic_year_id"
          value={formData.academic_year_id}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
            errors.academic_year_id ? "border-red-500" : "border-gray-300"
          }`}
        >
          <option value="">Select Academic Year</option>
          {academicYears.map((year) => (
            <option key={year.id} value={year.id}>
              {year.year_label} {year.is_current ? "(Current)" : ""}
            </option>
          ))}
        </select>
        {errors.academic_year_id && (
          <p className="text-red-500 text-sm mt-1">{errors.academic_year_id}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Term Name *
        </label>
        <select
          name="term_name"
          value={formData.term_name}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
            errors.term_name ? "border-red-500" : "border-gray-300"
          }`}
        >
          <option value="">Select Term</option>
          <option value="First Term">First Term</option>
          <option value="Second Term">Second Term</option>
          <option value="Third Term">Third Term</option>
          {/* <option value="Summer Term">Summer Term</option> */}
        </select>
        {errors.term_name && (
          <p className="text-red-500 text-sm mt-1">{errors.term_name}</p>
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
          {term ? "Update Term" : "Add Term"}
        </button>
      </div>
    </form>
  );
};

export default TermForm;
