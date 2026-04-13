// components/grades/GradingScaleForm.js
import React, { useState, useEffect } from "react";

const GradingScaleForm = ({ scale, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    min_score: "",
    max_score: "",
    grade: "",
    remarks: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (scale) {
      setFormData({
        min_score: scale.min_score || "",
        max_score: scale.max_score || "",
        grade: scale.grade || "",
        remarks: scale.remarks || "",
      });
    }
  }, [scale]);

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

    if (!formData.min_score && formData.min_score !== 0) {
      newErrors.min_score = "Minimum score is required";
    } else if (formData.min_score < 0) {
      newErrors.min_score = "Minimum score cannot be negative";
    }

    if (!formData.max_score && formData.max_score !== 0) {
      newErrors.max_score = "Maximum score is required";
    } else if (formData.max_score > 100) {
      newErrors.max_score = "Maximum score cannot exceed 100";
    }

    if (parseFloat(formData.min_score) > parseFloat(formData.max_score)) {
      newErrors.min_score =
        "Minimum score cannot be greater than maximum score";
    }

    if (!formData.grade.trim()) {
      newErrors.grade = "Grade is required";
    }

    if (!formData.remarks.trim()) {
      newErrors.remarks = "Remarks are required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave({
        ...formData,
        min_score: parseFloat(formData.min_score),
        max_score: parseFloat(formData.max_score),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Score *
          </label>
          <input
            type="number"
            name="min_score"
            value={formData.min_score}
            onChange={handleChange}
            min="0"
            max="100"
            step="0.5"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              errors.min_score ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="0"
          />
          {errors.min_score && (
            <p className="text-red-500 text-sm mt-1">{errors.min_score}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maximum Score *
          </label>
          <input
            type="number"
            name="max_score"
            value={formData.max_score}
            onChange={handleChange}
            min="0"
            max="100"
            step="0.5"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              errors.max_score ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="100"
          />
          {errors.max_score && (
            <p className="text-red-500 text-sm mt-1">{errors.max_score}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Grade Letter *
          </label>
          <input
            type="text"
            name="grade"
            value={formData.grade}
            onChange={handleChange}
            maxLength="5"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              errors.grade ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="e.g., A, B+, C-"
          />
          {errors.grade && (
            <p className="text-red-500 text-sm mt-1">{errors.grade}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Remarks *
        </label>
        <input
          type="text"
          name="remarks"
          value={formData.remarks}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
            errors.remarks ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="e.g., Excellent, Very Good, Good"
        />
        {errors.remarks && (
          <p className="text-red-500 text-sm mt-1">{errors.remarks}</p>
        )}
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          Common Grading Scales:
        </h4>
        <div className="text-sm text-blue-700 grid grid-cols-2 gap-2">
          <div>
            <strong>A:</strong> 80-100 - Highly Proficient
          </div>
          <div>
            <strong>B:</strong> 70-79 - Very Good
          </div>
          <div>
            <strong>C:</strong> 60-69 - Good
          </div>
          <div>
            <strong>D:</strong> 50-59 - Pass
          </div>
          <div>
            <strong>F:</strong> 0-49 - Fail
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
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
          {scale ? "Update Scale" : "Add Scale"}
        </button>
      </div>
    </form>
  );
};

export default GradingScaleForm;
